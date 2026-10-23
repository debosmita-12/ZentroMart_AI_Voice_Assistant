"""Unit tests for RAG retriever, document precedence, and grounding."""
from src.rag.retriever import HybridRetriever
from src.agent.rag_agent import RAGAgent


def test_wallet_refund_policy_wins_over_faq():
    retriever = HybridRetriever.get_instance()
    results = retriever.retrieve("How fast are refunds to the ZentroMart Wallet?", top_k=3)
    sec_ids = [c.section_id for c, _ in results]
    assert "REF-2" in sec_ids, "Current policy REF-2 must be retrieved"
    # Current policy REF-2 should have higher score than superseded documents
    ref2_rank = next(c.precedence_rank for c, _ in results if c.section_id == "REF-2")
    assert ref2_rank == 1, "REF-2 is a current policy with precedence rank 1"


def test_product_catalog_retrieval():
    retriever = HybridRetriever.get_instance()
    results = retriever.retrieve("SKU ELE-0012 warranty details", top_k=3)
    chunk_ids = [c.chunk_id for c, _ in results]
    assert "products.csv:ELE-0012" in chunk_ids, "Exact product SKU must be retrieved from catalog"


def test_unsupported_question_abstention():
    rag = RAGAgent()
    res = rag.answer_question("Can I schedule a delivery at midnight?")
    assert not res["answerable"], "Midnight delivery should be marked unanswerable"
    assert "don't have" in res["reply"].lower() or "nahi" in res["reply"].lower() or "जानकारी नहीं" in res["reply"]
