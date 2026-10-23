"""Date and business day utilities for ZentroMart VoiceOps 2026.

Reference date: 2026-10-20 (Tuesday)
Business days: Monday to Saturday (inclusive), excluding warehouse holidays.
Sunday is not a business day.
Return windows: Calendar days.
"""
from datetime import date, datetime, timedelta
from typing import List, Union
import csv
import os

REFERENCE_DATE = date(2026, 10, 20)

_DATA_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "Capstone_Project_Dataset_FTTT_2026", "data")
)
_HOLIDAYS_PATH = os.path.join(_DATA_DIR, "holidays.csv")

def load_holidays(holidays_path: str = _HOLIDAYS_PATH) -> set:
    holidays = set()
    if os.path.exists(holidays_path):
        with open(holidays_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get("date"):
                    holidays.add(datetime.strptime(row["date"].strip(), "%Y-%m-%d").date())
    else:
        # Fallback to standard 4 capstone holidays
        holidays = {
            date(2026, 8, 15),
            date(2026, 10, 2),
            date(2026, 10, 19),
            date(2026, 11, 9),
        }
    return holidays

HOLIDAYS = load_holidays()

def parse_date(d: Union[str, date, datetime]) -> date:
    if isinstance(d, datetime):
        return d.date()
    if isinstance(d, date):
        return d
    return datetime.strptime(str(d).strip(), "%Y-%m-%d").date()

def is_business_day(d: Union[str, date], holidays: set = HOLIDAYS) -> bool:
    curr = parse_date(d)
    # Monday is 0, Sunday is 6. Business days are Mon (0) to Sat (5)
    if curr.weekday() == 6:
        return False
    if curr in holidays:
        return False
    return True

def add_business_days(start_date: Union[str, date], n_days: int, holidays: set = HOLIDAYS) -> date:
    """Add n business days to start_date."""
    curr = parse_date(start_date)
    added = 0
    while added < n_days:
        curr += timedelta(days=1)
        if is_business_day(curr, holidays):
            added += 1
    return curr

def count_business_days(start_date: Union[str, date], end_date: Union[str, date], holidays: set = HOLIDAYS) -> int:
    """Count business days between start_date (exclusive) and end_date (inclusive)."""
    curr = parse_date(start_date)
    end = parse_date(end_date)
    if curr >= end:
        return 0
    count = 0
    while curr < end:
        curr += timedelta(days=1)
        if is_business_day(curr, holidays):
            count += 1
    return count

def add_calendar_days(start_date: Union[str, date], n_days: int) -> date:
    """Add n calendar days to start_date."""
    return parse_date(start_date) + timedelta(days=n_days)

def format_spoken_date(d: Union[str, date]) -> str:
    """Format date for speech: e.g. '27 October 2026'."""
    dt = parse_date(d)
    return dt.strftime("%d %B %Y").lstrip("0")
