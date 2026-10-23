"""Unit tests for date calculations, business days, and return windows."""
from datetime import date
from src.utils.date_utils import (
    REFERENCE_DATE,
    is_business_day,
    add_business_days,
    add_calendar_days,
    count_business_days,
    format_spoken_date,
)


def test_reference_date():
    assert REFERENCE_DATE == date(2026, 10, 20), "Reference date must be 2026-10-20"


def test_business_days_exclude_sunday_and_holidays():
    # 2026-10-18 is Sunday
    assert not is_business_day(date(2026, 10, 18)), "Sunday is not a business day"
    
    # 2026-10-19 is a warehouse holiday (festival)
    assert not is_business_day(date(2026, 10, 19)), "2026-10-19 is a warehouse holiday"
    
    # 2026-10-20 (Tuesday) is a business day
    assert is_business_day(date(2026, 10, 20)), "Tuesday is a business day"
    
    # 2026-10-24 (Saturday) is a business day
    assert is_business_day(date(2026, 10, 24)), "Saturday is a business day"


def test_refund_timeline_calculation_pq0008():
    # 17 Oct 2026 (Saturday) -> +5 business days = 24 Oct 2026, +7 business days = 27 Oct 2026
    start = date(2026, 10, 17)
    d5 = add_business_days(start, 5)
    d7 = add_business_days(start, 7)
    assert d5 == date(2026, 10, 24)
    assert d7 == date(2026, 10, 27)
    assert format_spoken_date(d7) == "27 October 2026"


def test_calendar_day_return_window():
    # 12 Oct 2026 + 15 calendar days = 27 Oct 2026
    start = date(2026, 10, 12)
    end = add_calendar_days(start, 15)
    assert end == date(2026, 10, 27)
