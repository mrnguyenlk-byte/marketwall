#!/usr/bin/env python3
"""
Import XAUUSD D1 bars from MetaTrader 5 into an AmiBroker-compatible ASCII file.

Only fully closed D1 candles are exported. The currently forming daily bar is
always excluded.
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import date, datetime, timezone
from typing import Any, Optional, Sequence, Tuple

try:
    import MetaTrader5 as mt5
except ImportError:  # pragma: no cover - optional on dev machines without MT5
    mt5 = None

try:
    import numpy as np
except ImportError:  # pragma: no cover
    np = None

DEFAULT_SYMBOL = os.environ.get("MT5_XAUUSD_SYMBOL", "XAUUSD")
DEFAULT_OUTPUT = os.environ.get(
    "AMIBROKER_XAUUSD_D1_OUTPUT",
    os.path.join("data", "amibroker", "XAUUSD_D1.csv"),
)
DEFAULT_BARS = int(os.environ.get("MT5_XAUUSD_D1_BARS", "500"))


def d1_bar_calendar_date(bar_time: int) -> date:
    return datetime.fromtimestamp(int(bar_time), tz=timezone.utc).date()


def is_still_open_d1_bar(bar_time: int, now: Optional[datetime] = None) -> bool:
    """True when the D1 bar that opened at bar_time has not yet closed."""
    now = now or datetime.now(timezone.utc)
    bar_open = datetime.fromtimestamp(int(bar_time), tz=timezone.utc)
    return bar_open.date() >= now.date()


def should_skip_latest_d1_bar(bar_time: int, now: Optional[datetime] = None) -> bool:
    now = now or datetime.now(timezone.utc)
    bar_date = d1_bar_calendar_date(bar_time)
    return bar_date >= now.date() or is_still_open_d1_bar(bar_time, now)


def trim_to_closed_d1_bars(
    rates: Any,
    now: Optional[datetime] = None,
) -> Tuple[Any, Optional[date], Optional[date]]:
    """
    Drop the latest D1 bar while it is today's candle or still open.
    Returns (closed_rates, last_closed_date, skipped_open_candle_date).
    """
    if rates is None or len(rates) == 0:
        return rates, None, None

    now = now or datetime.now(timezone.utc)
    trimmed = rates
    skipped_open_date: Optional[date] = None

    while len(trimmed) > 0:
        last_time = int(trimmed[-1]["time"])
        if should_skip_latest_d1_bar(last_time, now):
            skipped_open_date = d1_bar_calendar_date(last_time)
            trimmed = trimmed[:-1]
            continue
        break

    last_closed_date: Optional[date] = None
    if len(trimmed) > 0:
        last_closed_date = d1_bar_calendar_date(int(trimmed[-1]["time"]))

    return trimmed, last_closed_date, skipped_open_date


def log_d1_selection(
    last_closed_date: Optional[date],
    skipped_open_date: Optional[date],
) -> None:
    print(
        "XAUUSD_D1_LAST_CLOSED_DATE",
        last_closed_date.isoformat() if last_closed_date else "none",
    )
    print(
        "XAUUSD_D1_SKIPPED_OPEN_CANDLE_DATE",
        skipped_open_date.isoformat() if skipped_open_date else "none",
    )


def write_amibroker_csv(rates: Sequence[Any], output_path: str, symbol: str) -> None:
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "w", encoding="ascii", newline="\n") as handle:
        handle.write("<TICKER>,<DATE>,<OPEN>,<HIGH>,<LOW>,<CLOSE>,<VOLUME>\n")
        for row in rates:
            bar_date = datetime.fromtimestamp(int(row["time"]), tz=timezone.utc).strftime(
                "%Y%m%d"
            )
            handle.write(
                f"{symbol},{bar_date},"
                f"{float(row['open'])},{float(row['high'])},"
                f"{float(row['low'])},{float(row['close'])},"
                f"{int(row['tick_volume'])}\n"
            )


def resolve_reference_now(symbol: Optional[str] = None) -> datetime:
    if mt5 is not None and symbol:
        tick = mt5.symbol_info_tick(symbol)
        if tick is not None and int(tick.time) > 0:
            return datetime.fromtimestamp(int(tick.time), tz=timezone.utc)
    return datetime.now(timezone.utc)


def fetch_mt5_d1_rates(symbol: str, bars: int) -> Any:
    if mt5 is None:
        raise RuntimeError("MetaTrader5 package is not installed")
    if not mt5.initialize():
        raise RuntimeError(f"MT5 initialize failed: {mt5.last_error()}")

    try:
        if not mt5.symbol_select(symbol, True):
            raise RuntimeError(f"Unable to select symbol {symbol}: {mt5.last_error()}")

        rates = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_D1, 0, bars)
        if rates is None or len(rates) == 0:
            raise RuntimeError(f"No D1 rates returned for {symbol}: {mt5.last_error()}")
        return rates
    finally:
        mt5.shutdown()


def update_xauusd_d1(
    symbol: str = DEFAULT_SYMBOL,
    output_path: str = DEFAULT_OUTPUT,
    bars: int = DEFAULT_BARS,
    now: Optional[datetime] = None,
) -> Tuple[Optional[date], Optional[date]]:
    rates = fetch_mt5_d1_rates(symbol, bars)
    reference_now = resolve_reference_now(symbol)
    closed_rates, last_closed_date, skipped_open_date = trim_to_closed_d1_bars(
        rates,
        reference_now,
    )

    if closed_rates is None or len(closed_rates) == 0:
        raise RuntimeError("No fully closed XAUUSD D1 bars available after filtering")

    log_d1_selection(last_closed_date, skipped_open_date)
    write_amibroker_csv(closed_rates, output_path, symbol)
    print(f"XAUUSD_D1_EXPORTED_BARS {len(closed_rates)} -> {output_path}")
    return last_closed_date, skipped_open_date


def _make_rate(time_ts: int, close: float) -> dict[str, float | int]:
    return {
        "time": time_ts,
        "open": close - 1.0,
        "high": close + 1.0,
        "low": close - 2.0,
        "close": close,
        "tick_volume": 100,
    }


def run_self_test() -> None:
    if np is None:
        raise RuntimeError("numpy is required for self-test")

    now = datetime(2026, 6, 15, 12, 0, tzinfo=timezone.utc)
    yesterday = int(datetime(2026, 6, 14, 0, 0, tzinfo=timezone.utc).timestamp())
    today = int(datetime(2026, 6, 15, 0, 0, tzinfo=timezone.utc).timestamp())
    day_before = int(datetime(2026, 6, 13, 0, 0, tzinfo=timezone.utc).timestamp())

    rates = np.array(
        [
            _make_rate(day_before, 2300.0),
            _make_rate(yesterday, 2310.0),
            _make_rate(today, 2320.0),
        ],
        dtype=[
            ("time", "i8"),
            ("open", "f8"),
            ("high", "f8"),
            ("low", "f8"),
            ("close", "f8"),
            ("tick_volume", "i8"),
        ],
    )

    closed, last_closed, skipped = trim_to_closed_d1_bars(rates, now)
    assert len(closed) == 2, f"expected 2 closed bars, got {len(closed)}"
    assert last_closed == date(2026, 6, 14), f"unexpected last closed date: {last_closed}"
    assert skipped == date(2026, 6, 15), f"unexpected skipped date: {skipped}"

    only_closed, last_only, skipped_only = trim_to_closed_d1_bars(closed, now)
    assert len(only_closed) == 2
    assert last_only == date(2026, 6, 14)
    assert skipped_only is None

    print("XAUUSD_D1_SELF_TEST ok")


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Update XAUUSD D1 data for AmiBroker from MT5")
    parser.add_argument("--symbol", default=DEFAULT_SYMBOL)
    parser.add_argument("--output", default=DEFAULT_OUTPUT)
    parser.add_argument("--bars", type=int, default=DEFAULT_BARS)
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Run filter unit checks without MT5",
    )
    args = parser.parse_args(list(argv) if argv is not None else None)

    if args.self_test:
        run_self_test()
        return 0

    update_xauusd_d1(symbol=args.symbol, output_path=args.output, bars=args.bars)
    return 0


if __name__ == "__main__":
    sys.exit(main())
