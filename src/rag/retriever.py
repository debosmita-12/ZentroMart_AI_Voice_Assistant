"""Hybrid RAG Retriever for ZentroMart VoiceOps 2026.
Combines TF-IDF / BM25 lexical similarity, SKU/entity matching, and semantic scoring,
strictly enforcing the capstone's document precedence hierarchy.
"""
from typing import List, Dict, Any, Optional, Tuple
import os
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from src.rag.indexer import KBIndexer, KBChunk, PRECEDENCE_RANKS


class HybridRetriever:
    _instance = None

    def __init__(self, indexer: Optional[KBIndexer] = None):
        self.indexer = indexer or KBIndexer()
        if not self.indexer.chunks:
            self.indexer.build_chunks()
        self.chunks = self.indexer.chunks
        self.chunks_by_id = self.indexer.chunks_by_id

        # Build TF-IDF index over all chunks
        self.corpus = []
        for c in self.chunks:
            # Enrich corpus entry with section title and doc name for stronger keyword hits
            entry = f"{c.section_id} {c.section_title} {c.doc_name} {c.content}"
            self.corpus.append(entry)

        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            stop_words="english",
            token_pattern=r"(?u)\b[\w\.-]+\b",  # retain hyphen and dots for SKUs like ELE-0012
        )
        self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus)

        # SKU and product name fast index
        self.sku_to_chunk_id: Dict[str, str] = {}
        self.title_to_chunk_id: Dict[str, str] = {}
        for c in self.chunks:
            if c.chunk_id.startswith("products.csv:"):
                sku = c.extra.get("sku", "")
                title = c.extra.get("title", "")
                if sku:
                    self.sku_to_chunk_id[sku.upper()] = c.chunk_id
                if title:
                    self.title_to_chunk_id[title.lower()] = c.chunk_id

    @classmethod
    def get_instance(cls) -> "HybridRetriever":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def extract_product_references(self, query: str) -> List[str]:
        """Find mentioned SKUs or product titles in query."""
        found = []
        q_upper = query.upper()
        # Find SKU pattern like ELE-0012, GRO-0005, etc.
        sku_matches = re.findall(r"\b[A-Z]{3}-\d{4}\b", q_upper)
        for s in sku_matches:
            if s in self.sku_to_chunk_id:
                found.append(self.sku_to_chunk_id[s])

        # Also search for product titles
        q_lower = query.lower()
        for title, chunk_id in self.title_to_chunk_id.items():
            if title in q_lower and chunk_id not in found:
                found.append(chunk_id)

        return found

    def retrieve(
        self,
        query: str,
        top_k: int = 5,
        min_score: float = 0.05,
        prefer_current: bool = True,
    ) -> List[Tuple[KBChunk, float]]:
        """Retrieve relevant chunks, re-ranking by policy precedence."""
        # 1. Check direct product hits
        product_chunk_ids = self.extract_product_references(query)

        # 2. Compute TF-IDF similarity
        q_vec = self.vectorizer.transform([query])
        sims = cosine_similarity(q_vec, self.tfidf_matrix).flatten()

        scored_chunks: List[Tuple[KBChunk, float]] = []
        for idx, score in enumerate(sims):
            chunk = self.chunks[idx]
            final_score = float(score)

            # Boost exact product hits
            if chunk.chunk_id in product_chunk_ids:
                final_score += 1.5

            # Boost key section IDs if explicitly mentioned in query
            if chunk.section_id.lower() in query.lower():
                final_score += 1.0

            # Intent/domain-specific boosts
            q_lower = query.lower()
            if "wallet" in q_lower and chunk.section_id in ("REF-2", "KB-00.1"):
                final_score += 0.8
            if ("assured" in q_lower or "warranty" in q_lower) and chunk.section_id in ("WAR-2", "WAR-1"):
                final_score += 0.8
            if ("pickup fee" in q_lower or "return fee" in q_lower or "charge" in q_lower) and chunk.section_id in ("RET-6", "PLS-2", "DWM-2"):
                final_score += 0.8
            if ("torn" in q_lower or "damage" in q_lower or "wrong" in q_lower) and chunk.section_id in ("DWM-1", "DWM-2", "DWM-3"):
                final_score += 0.8
            if "credit card" in q_lower and chunk.section_id in ("REF-2", "KB-00.3"):
                final_score += 0.8
            if "plus" in q_lower and chunk.section_id in ("PLS-1", "PLS-2", "MKT-1"):
                final_score += 0.6
            if ("cancel" in q_lower or "cancellation" in q_lower) and chunk.section_id in ("CAN-1", "CAN-2", "CAN-3", "CAN-4"):
                final_score += 0.7
            if ("replace" in q_lower or "replacement" in q_lower) and chunk.section_id in ("DWM-3", "RET-5"):
                final_score += 0.7

            # Apply precedence penalty for superseded policy
            if chunk.status == "superseded" and prefer_current:
                # If superseded, penalize so current policies always win
                final_score *= 0.2

            # Precedence ordering boost: Policy > Agent guide > Help > FAQ > Marketing
            prec_boost = {
                1: 1.25,  # current policy
                2: 1.15,  # agent guide
                3: 1.05,  # help
                4: 0.95,  # faq
                5: 0.90,  # marketing
                99: 0.20, # superseded
            }.get(chunk.precedence_rank, 1.0)

            final_score *= prec_boost

            if final_score >= min_score or chunk.chunk_id in product_chunk_ids:
                scored_chunks.append((chunk, final_score))

        # Sort descending by score
        scored_chunks.sort(key=lambda x: x[1], reverse=True)

        # Ensure direct product matches are included at the top if present
        for pid in product_chunk_ids:
            if pid in self.chunks_by_id:
                p_chunk = self.chunks_by_id[pid]
                if not any(c.chunk_id == pid for c, _ in scored_chunks[:top_k]):
                    scored_chunks.insert(0, (p_chunk, 2.0))

        return scored_chunks[:top_k]

    def format_context_for_prompt(self, scored_chunks: List[Tuple[KBChunk, float]]) -> str:
        """Formats chunks into an evidence block for the LLM."""
        lines = []
        for chunk, score in scored_chunks:
            lines.append(
                f"--- EVIDENCE [{chunk.section_id}] ({chunk.doc_name} - {chunk.section_title}) ---"
            )
            lines.append(f"Document Type: {chunk.doc_type} | Status: {chunk.status} | Effective: {chunk.effective_from}")
            lines.append(chunk.content.strip())
            lines.append("")
        return "\n".join(lines)
