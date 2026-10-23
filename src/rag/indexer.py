"""Knowledge Base Indexer and Chunk Parser for ZentroMart VoiceOps 2026.
Parses all 21 Markdown KB documents, extracts section IDs and metadata,
and indexes product catalog rows.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
import os
import re
import glob
import json
import yaml

_BASE_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "Capstone_Project_Dataset_FTTT_2026")
)
KB_DIR = os.path.join(_BASE_DIR, "kb")
DATA_DIR = os.path.join(_BASE_DIR, "data")
ARTIFACTS_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "artifacts")
)

PRECEDENCE_RANKS = {
    "policy_current": 1,
    "agent_guide": 2,
    "help": 3,
    "faq": 4,
    "marketing": 5,
    "catalog": 5,
    "policy_superseded": 99,
}


@dataclass
class KBChunk:
    chunk_id: str          # Unique ID, e.g. "RET-2" or "products.csv:ELE-0012"
    doc_id: str            # Document ID, e.g. "POL-RET-04" or "products.csv"
    doc_name: str          # Filename, e.g. "pol_returns_v4.md"
    doc_type: str          # "policy", "agent_guide", "help", "faq", "marketing", "catalog"
    status: str            # "current", "superseded", etc.
    effective_from: str    # Date string e.g. "2026-08-01"
    section_id: str        # e.g. "RET-2"
    section_title: str     # e.g. "Return windows by category"
    content: str           # Full text of the section
    precedence_rank: int   # 1 is highest priority
    extra: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "doc_id": self.doc_id,
            "doc_name": self.doc_name,
            "doc_type": self.doc_type,
            "status": self.status,
            "effective_from": self.effective_from,
            "section_id": self.section_id,
            "section_title": self.section_title,
            "content": self.content,
            "precedence_rank": self.precedence_rank,
            "extra": self.extra,
        }


class KBIndexer:
    def __init__(self, kb_dir: str = KB_DIR, data_dir: str = DATA_DIR):
        self.kb_dir = kb_dir
        self.data_dir = data_dir
        self.chunks: List[KBChunk] = []
        self.chunks_by_id: Dict[str, KBChunk] = {}

    def parse_frontmatter(self, text: str) -> tuple[Dict[str, Any], str]:
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) >= 3:
                try:
                    meta = yaml.safe_load(parts[1]) or {}
                    body = parts[2].strip()
                    return meta, body
                except Exception:
                    pass
        return {}, text

    def build_chunks(self) -> List[KBChunk]:
        chunks: List[KBChunk] = []

        # 1. Parse all 21 Markdown files
        md_files = sorted(glob.glob(os.path.join(self.kb_dir, "*.md")))
        for fpath in md_files:
            fname = os.path.basename(fpath)
            with open(fpath, "r", encoding="utf-8") as f:
                raw_text = f.read()

            meta, body = self.parse_frontmatter(raw_text)
            doc_id = str(meta.get("doc_id", fname))
            doc_type = str(meta.get("doc_type", "policy"))
            status = str(meta.get("status", "current"))
            effective_from = str(meta.get("effective_from", "2026-01-01"))

            # Determine precedence rank
            if doc_type == "policy":
                prec_key = "policy_current" if status == "current" else "policy_superseded"
            else:
                prec_key = doc_type
            rank = PRECEDENCE_RANKS.get(prec_key, 10)

            # Split into sections by '## [SECTION-ID] Title'
            section_pattern = re.compile(r"^##\s*\[([^\]]+)\]\s*(.*)$", re.MULTILINE)
            matches = list(section_pattern.finditer(body))

            if not matches:
                # If no section header, treat the document body as single chunk
                chunk_id = doc_id
                chunks.append(
                    KBChunk(
                        chunk_id=chunk_id,
                        doc_id=doc_id,
                        doc_name=fname,
                        doc_type=doc_type,
                        status=status,
                        effective_from=effective_from,
                        section_id=chunk_id,
                        section_title=str(meta.get("title", fname)),
                        content=body.strip(),
                        precedence_rank=rank,
                    )
                )
            else:
                for i, match in enumerate(matches):
                    sec_id = match.group(1).strip()
                    sec_title = match.group(2).strip()
                    start_pos = match.start()
                    end_pos = matches[i + 1].start() if i + 1 < len(matches) else len(body)
                    sec_content = body[start_pos:end_pos].strip()

                    chunks.append(
                        KBChunk(
                            chunk_id=sec_id,
                            doc_id=doc_id,
                            doc_name=fname,
                            doc_type=doc_type,
                            status=status,
                            effective_from=effective_from,
                            section_id=sec_id,
                            section_title=sec_title,
                            content=sec_content,
                            precedence_rank=rank,
                        )
                    )

        # 2. Add product catalog entries from products.csv as products.csv:<sku>
        products_csv = os.path.join(self.data_dir, "products.csv")
        if os.path.exists(products_csv):
            import csv
            with open(products_csv, "r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for r in reader:
                    sku = r.get("sku", "").strip()
                    title = r.get("title", "").strip()
                    category = r.get("return_category", "").strip()
                    price = r.get("price_inr", "").strip()
                    fulfilled_by = r.get("fulfilled_by", "").strip()
                    assured = r.get("assured", "").strip()
                    warranty = r.get("warranty_months", "").strip()

                    content = (
                        f"Product SKU: {sku}\n"
                        f"Title: {title}\n"
                        f"Return Category: {category}\n"
                        f"Price: ₹{price}\n"
                        f"Fulfilled by: {fulfilled_by}\n"
                        f"ZentroMart Assured: {assured}\n"
                        f"Warranty: {warranty} months\n"
                    )
                    chunk_id = f"products.csv:{sku}"
                    chunks.append(
                        KBChunk(
                            chunk_id=chunk_id,
                            doc_id="products.csv",
                            doc_name="products.csv",
                            doc_type="catalog",
                            status="current",
                            effective_from="2026-08-01",
                            section_id=chunk_id,
                            section_title=f"Product: {title} ({sku})",
                            content=content,
                            precedence_rank=PRECEDENCE_RANKS["catalog"],
                            extra={"sku": sku, "title": title, "category": category, "warranty_months": warranty, "assured": assured},
                        )
                    )

        self.chunks = chunks
        self.chunks_by_id = {c.chunk_id: c for c in chunks}
        return chunks

    def save_index_metadata(self, out_path: str = os.path.join(ARTIFACTS_DIR, "kb_index.json")):
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        data = [c.to_dict() for c in self.chunks]
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
