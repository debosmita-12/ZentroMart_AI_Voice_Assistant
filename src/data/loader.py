"""Data loader module for ZentroMart VoiceOps 2026 dataset.
Loads CSV tables with dtype=str to preserve leading zeros, phone numbers, and IDs.
"""
from typing import Dict, Any, List, Optional
import os
import pandas as pd

_BASE_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "Capstone_Project_Dataset_FTTT_2026")
)
DATA_DIR = os.path.join(_BASE_DIR, "data")
KB_DIR = os.path.join(_BASE_DIR, "kb")
PRACTICE_DIR = os.path.join(_BASE_DIR, "practice")
TOOLS_DIR = os.path.join(_BASE_DIR, "tools")


class DataLoader:
    _instance = None

    def __init__(self, data_dir: str = DATA_DIR):
        self.data_dir = data_dir
        self.customers_df = pd.DataFrame()
        self.orders_df = pd.DataFrame()
        self.order_items_df = pd.DataFrame()
        self.products_df = pd.DataFrame()
        self.pincodes_df = pd.DataFrame()
        self.holidays_df = pd.DataFrame()
        self.support_logs_df = pd.DataFrame()
        
        # Indexed dictionaries for fast O(1) lookups
        self.customers_by_id: Dict[str, Dict[str, Any]] = {}
        self.orders_by_id: Dict[str, Dict[str, Any]] = {}
        self.order_items_by_order: Dict[str, List[Dict[str, Any]]] = {}
        self.products_by_sku: Dict[str, Dict[str, Any]] = {}
        self.pincodes_by_code: Dict[str, Dict[str, Any]] = {}
        
        self.load_all()

    @classmethod
    def get_instance(cls, data_dir: str = DATA_DIR) -> "DataLoader":
        if cls._instance is None:
            cls._instance = cls(data_dir=data_dir)
        return cls._instance

    def _read_csv(self, filename: str) -> pd.DataFrame:
        path = os.path.join(self.data_dir, filename)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Missing expected dataset file: {path}")
        df = pd.read_csv(path, dtype=str)
        # Fill NaN with empty string
        df = df.fillna("")
        # Strip string whitespace
        for col in df.columns:
            df[col] = df[col].astype(str).str.strip()
        return df

    def load_all(self):
        self.customers_df = self._read_csv("customers.csv")
        self.orders_df = self._read_csv("orders.csv")
        self.order_items_df = self._read_csv("order_items.csv")
        self.products_df = self._read_csv("products.csv")
        self.pincodes_df = self._read_csv("pincodes.csv")
        self.holidays_df = self._read_csv("holidays.csv")
        self.support_logs_df = self._read_csv("support_logs.csv")

        # Build index maps
        self.customers_by_id = {
            r["customer_id"]: r for r in self.customers_df.to_dict(orient="records")
        }
        self.orders_by_id = {
            r["order_id"]: r for r in self.orders_df.to_dict(orient="records")
        }
        self.products_by_sku = {
            r["sku"]: r for r in self.products_df.to_dict(orient="records")
        }
        self.pincodes_by_code = {
            r["pincode"]: r for r in self.pincodes_df.to_dict(orient="records")
        }

        self.order_items_by_order = {}
        for r in self.order_items_df.to_dict(orient="records"):
            oid = r["order_id"]
            if oid not in self.order_items_by_order:
                self.order_items_by_order[oid] = []
            self.order_items_by_order[oid].append(r)

    def get_customer(self, customer_id: str) -> Optional[Dict[str, Any]]:
        return self.customers_by_id.get(str(customer_id).strip())

    def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        clean_id = "".join(ch for ch in str(order_id) if ch.isdigit())
        return self.orders_by_id.get(clean_id)

    def get_order_items(self, order_id: str) -> List[Dict[str, Any]]:
        clean_id = "".join(ch for ch in str(order_id) if ch.isdigit())
        return self.order_items_by_order.get(clean_id, [])

    def get_product(self, sku: str) -> Optional[Dict[str, Any]]:
        return self.products_by_sku.get(str(sku).strip())

    def get_pincode(self, pincode: str) -> Optional[Dict[str, Any]]:
        return self.pincodes_by_code.get(str(pincode).strip())
