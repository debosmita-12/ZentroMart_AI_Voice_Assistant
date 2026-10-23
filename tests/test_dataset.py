"""Unit tests for dataset loading, relationships, and validation."""
import pytest
from src.data.loader import DataLoader
from src.rag.indexer import KBIndexer


def test_data_loader_counts():
    loader = DataLoader.get_instance()
    assert len(loader.customers_by_id) == 300, "Expected 300 customers"
    assert len(loader.orders_by_id) == 1000, "Expected 1000 orders"
    assert len(loader.products_by_sku) == 70, "Expected 70 products"
    assert len(loader.pincodes_by_code) == 36, "Expected 36 pincodes"
    assert len(loader.order_items_df) == 1783, "Expected 1783 order items"


def test_customer_order_relationship():
    loader = DataLoader.get_instance()
    order = loader.get_order("89782837")
    assert order is not None, "Order 89782837 must exist"
    cust_id = order["customer_id"]
    customer = loader.get_customer(cust_id)
    assert customer is not None, "Customer for order 89782837 must exist"
    assert len(customer["phone"]) >= 10, "Customer phone must be valid string"


def test_kb_chunks_and_sections():
    indexer = KBIndexer()
    chunks = indexer.build_chunks()
    assert len(chunks) >= 84, "Expected at least 84 section chunks from 21 KB docs"
    section_ids = [c.section_id for c in chunks]
    assert "RET-2" in section_ids
    assert "IDV-2" in section_ids
    assert "WAR-2" in section_ids
    assert "KB-00.1" in section_ids
    assert any(c.chunk_id.startswith("products.csv:") for c in chunks)
