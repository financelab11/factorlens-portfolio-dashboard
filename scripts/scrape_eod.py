"""
EOD scraper for FactorLens — run manually or via CI.
Fetches latest NAV data for all 28 indices and upserts to Supabase.

Sources:
  - 26 NSE indices : niftyindices.com POST API
  - S&P 500 (SPX)  : Yahoo Finance  (^GSPC)
  - Gold BeES      : Yahoo Finance  (GOLDBEES.NS)

Usage:
    pip install requests yfinance psycopg2-binary
    python scripts/scrape_eod.py
"""

import os, sys, json, time, math
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import requests
import yfinance as yf
import psycopg2
from psycopg2.extras import execute_values

# ── Config ────────────────────────────────────────────────────────────────────

DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres.cxmaeueobsqrbivoqvry:74d4pPImwlV0sCH3LDrUUsB9OIkKHNzSrRZyht8OyWiWSGPr7uA8Iz1qRqlJCxQn@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
)

IST = ZoneInfo("Asia/Kolkata")

NSE_INDICES = [
    ("N50",         "NIFTY 50"),
    ("NN50",        "NIFTY NEXT 50"),
    ("N500",        "NIFTY 500"),
    ("NMC150",      "NIFTY MIDCAP 150"),
    ("NSC250",      "NIFTY SMALLCAP 250"),
    ("NSC500",      "NIFTY SMALLCAP 500"),
    ("NμC250",      "NIFTY MICROCAP 250"),
    ("NTM",         "NIFTY TOTAL MARKET"),
    ("MC150M50",    "NIFTY MIDCAP150 MOMENTUM 50"),
    ("N500M50",     "NIFTY500 MOMENTUM 50"),
    ("N200M30",     "NIFTY200 MOMENTUM 30"),
    ("NTMMQ50",     "NIFTY TOTAL MARKET MOMENTUM QUALITY 50"),
    ("MC150Q50",    "NIFTY MIDCAP150 QUALITY 50"),
    ("N500Q50",     "NIFTY500 QUALITY 50"),
    ("N200Q30",     "NIFTY200 QUALITY 30"),
    ("N100Q30",     "NIFTY100 QUALITY 30"),
    ("SC250Q50",    "NIFTY SMALLCAP250 QUALITY 50"),
    ("N100LV30",    "NIFTY100 LOW VOLATILITY 30"),
    ("N500LV50",    "NIFTY500 LOW VOLATILITY 50"),
    ("N100A30",     "NIFTY100 ALPHA 30"),
    ("N200A30",     "NIFTY200 ALPHA 30"),
    ("N500V50",     "NIFTY500 VALUE 50"),
    ("MMS400MQ100", "NIFTY MIDSMALLCAP400 MOMENTUM QUALITY 100"),
    ("SC250MQ100",  "NIFTY SMALLCAP250 MOMENTUM QUALITY 100"),
    ("N500MCQ50",   "NIFTY500 MULTICAP MOMENTUM QUALITY 50"),
    ("N500MF50",    "NIFTY500 MULTIFACTOR MQVLV 50"),
]

YAHOO_FUNDS = [
    ("SPX",  "^GSPC"),
    ("GOLD", "GOLDBEES.NS"),
]

NIFTY_HEADERS = {
    "Content-Type":     "application/json; charset=utf-8",
    "Accept":           "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    "Referer":          "https://www.niftyindices.com/reports/historical-data",
    "User-Agent":       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
}

# ── Date helpers ──────────────────────────────────────────────────────────────

MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

def today_ist() -> str:
    return datetime.now(IST).strftime("%Y-%m-%d")

def iso_to_nifty_req(iso: str) -> str:
    """'2026-02-28' → '28-Feb-2026'"""
    d = datetime.strptime(iso, "%Y-%m-%d")
    return d.strftime(f"%d-{MONTHS_SHORT[d.month-1]}-%Y")

def nifty_resp_to_iso(date_str: str) -> str:
    """'28 Feb 2026' → '2026-02-28'"""
    try:
        d = datetime.strptime(date_str.strip(), "%d %b %Y")
        return d.strftime("%Y-%m-%d")
    except Exception:
        return ""

def add_days(iso: str, n: int) -> str:
    d = datetime.strptime(iso, "%Y-%m-%d") + timedelta(days=n)
    return d.strftime("%Y-%m-%d")

# ── Scrapers ──────────────────────────────────────────────────────────────────

def fetch_nifty_index(index_name: str, from_iso: str, to_iso: str, retries=3):
    """Return list of (date_iso, close_value) tuples."""
    cinfo = json.dumps({
        "name": index_name,
        "startDate": iso_to_nifty_req(from_iso),
        "endDate":   iso_to_nifty_req(to_iso),
        "indexName": index_name,
    })
    payload = json.dumps({"cinfo": cinfo})

    for attempt in range(retries):
        try:
            resp = requests.post(
                "https://www.niftyindices.com/Backpage.aspx/getHistoricaldatatabletoString",
                data=payload,
                headers=NIFTY_HEADERS,
                timeout=20,
            )
            resp.raise_for_status()
            outer = resp.json()
            rows = json.loads(outer.get("d", "[]"))
            result = []
            for row in rows:
                date_str  = row.get("Date") or row.get("date", "")
                close_str = row.get("Close") or row.get("CLOSE") or row.get("close", "")
                date_iso  = nifty_resp_to_iso(date_str)
                try:
                    val = float(close_str.replace(",", ""))
                except (ValueError, AttributeError):
                    continue
                if date_iso and val > 0:
                    result.append((date_iso, val))
            return result
        except Exception as e:
            print(f"  [attempt {attempt+1}/{retries}] {index_name}: {e}")
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
    return []

def fetch_yahoo(symbol: str, from_iso: str, to_iso: str):
    """Return list of (date_iso, close_value) tuples via yfinance."""
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(start=from_iso, end=add_days(to_iso, 1), interval="1d", auto_adjust=True)
        if df.empty:
            return []
        result = []
        for ts, row in df.iterrows():
            date_iso = ts.strftime("%Y-%m-%d")
            val = float(row["Close"])
            if val > 0:
                result.append((date_iso, val))
        return result
    except Exception as e:
        print(f"  Yahoo {symbol}: {e}")
        return []

# ── Metric computation ────────────────────────────────────────────────────────

def compute_cagr(nav: list) -> float:
    if len(nav) < 2:
        return 0.0
    start_val, end_val = nav[0][1], nav[-1][1]
    start_dt = datetime.strptime(nav[0][0], "%Y-%m-%d")
    end_dt   = datetime.strptime(nav[-1][0], "%Y-%m-%d")
    years = (end_dt - start_dt).days / 365.25
    if years <= 0:
        return 0.0
    return (end_val / start_val) ** (1.0 / years) - 1.0

def compute_volatility(nav: list) -> float:
    if len(nav) < 2:
        return 0.0
    returns = [(nav[i][1] / nav[i-1][1]) - 1 for i in range(1, len(nav))]
    mean = sum(returns) / len(returns)
    variance = sum((r - mean) ** 2 for r in returns) / len(returns)
    return math.sqrt(variance) * math.sqrt(252)

def compute_max_drawdown(nav: list) -> float:
    peak = nav[0][1]
    max_dd = 0.0
    for _, v in nav:
        if v > peak:
            peak = v
        dd = (v - peak) / peak
        if dd < max_dd:
            max_dd = dd
    return max_dd

def compute_rolling_3y(nav: list) -> list:
    WINDOW = 756
    result = []
    for i in range(WINDOW, len(nav)):
        start_v = nav[i - WINDOW][1]
        end_v   = nav[i][1]
        cagr    = (end_v / start_v) ** (1.0 / 3.0) - 1.0
        result.append(cagr * 100)
    return result

def compute_metrics(nav: list) -> dict:
    cagr    = compute_cagr(nav)
    vol     = compute_volatility(nav)
    max_dd  = compute_max_drawdown(nav)
    sharpe  = cagr / vol if vol > 0 else 0.0
    calmar  = cagr / abs(max_dd) if max_dd != 0 else 0.0
    rolling = compute_rolling_3y(nav)
    avg3y   = (sum(rolling) / len(rolling) / 100) if rolling else 0.0
    return dict(cagr=cagr, vol=vol, max_dd=max_dd, sharpe=sharpe,
                calmar=calmar, avg3y=avg3y)

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    today = today_ist()
    print(f"EOD scraper — {today} IST\n")

    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()

    # Load fund id map
    cur.execute("SELECT id, code FROM funds")
    code_to_id = {row[1]: row[0] for row in cur.fetchall()}

    # Latest nav date per fund
    cur.execute("""
        SELECT DISTINCT ON (fund_id) fund_id, date
        FROM nav_data
        ORDER BY fund_id, date DESC
    """)
    latest_by_fund = {row[0]: row[1].strftime("%Y-%m-%d") for row in cur.fetchall()}

    DEFAULT_FROM = "2026-02-28"
    total_inserted = 0
    funds_updated = []

    # ── NSE indices ──────────────────────────────────────────────────────────
    print("=== NSE INDICES (niftyindices.com) ===")
    for code, index_name in NSE_INDICES:
        fund_id = code_to_id.get(code)
        if not fund_id:
            print(f"  [{code}] not in DB, skipping")
            continue

        last_date = latest_by_fund.get(fund_id, DEFAULT_FROM)
        from_iso  = add_days(last_date, 1)

        if from_iso > today:
            print(f"  [{code}] up to date ({last_date})")
            continue

        print(f"  [{code}] {index_name}: fetching {from_iso} → {today} ...", end=" ", flush=True)
        rows = fetch_nifty_index(index_name, from_iso, today)

        new_rows = [(fund_id, d, v) for d, v in rows if d > last_date]
        if not new_rows:
            print("no new data")
            continue

        execute_values(cur,
            "INSERT INTO nav_data (fund_id, date, nav_value) VALUES %s "
            "ON CONFLICT (fund_id, date) DO UPDATE SET nav_value = EXCLUDED.nav_value",
            new_rows)
        conn.commit()
        print(f"{len(new_rows)} rows → latest {new_rows[-1][1]}")
        total_inserted += len(new_rows)
        funds_updated.append(fund_id)
        time.sleep(0.3)  # be polite to niftyindices

    # ── Yahoo Finance funds ──────────────────────────────────────────────────
    print("\n=== YAHOO FINANCE (SPX / Gold) ===")
    for code, symbol in YAHOO_FUNDS:
        fund_id = code_to_id.get(code)
        if not fund_id:
            print(f"  [{code}] not in DB, skipping")
            continue

        last_date = latest_by_fund.get(fund_id, DEFAULT_FROM)
        from_iso  = add_days(last_date, 1)

        if from_iso > today:
            print(f"  [{code}] up to date ({last_date})")
            continue

        print(f"  [{code}] {symbol}: fetching {from_iso} → {today} ...", end=" ", flush=True)
        rows = fetch_yahoo(symbol, from_iso, today)

        new_rows = [(fund_id, d, v) for d, v in rows if d > last_date]
        if not new_rows:
            print("no new data")
            continue

        execute_values(cur,
            "INSERT INTO nav_data (fund_id, date, nav_value) VALUES %s "
            "ON CONFLICT (fund_id, date) DO UPDATE SET nav_value = EXCLUDED.nav_value",
            new_rows)
        conn.commit()
        print(f"{len(new_rows)} rows → latest {new_rows[-1][1]}")
        total_inserted += len(new_rows)
        funds_updated.append(fund_id)

    print(f"\nTotal new rows inserted: {total_inserted}")

    # ── Recompute metrics for updated funds ──────────────────────────────────
    if funds_updated:
        print(f"\n=== RECOMPUTING METRICS ({len(funds_updated)} funds) ===")
        cur.execute(
            "SELECT fund_id, date, nav_value FROM nav_data WHERE fund_id = ANY(%s) ORDER BY fund_id, date",
            (list(set(funds_updated)),)
        )
        nav_rows = cur.fetchall()

        # Group by fund
        nav_by_fund: dict = {}
        for fid, dt, val in nav_rows:
            nav_by_fund.setdefault(fid, []).append((dt.strftime("%Y-%m-%d"), float(val)))

        for fund_id, nav in nav_by_fund.items():
            if len(nav) < 2:
                continue
            m = compute_metrics(nav)
            cur.execute("""
                UPDATE funds SET
                    cagr = %s,
                    volatility = %s,
                    max_drawdown = %s,
                    sharpe_ratio = %s,
                    calmar_ratio = %s,
                    avg_3y_rolling_return = %s
                WHERE id = %s
            """, (m["cagr"], m["vol"], m["max_dd"], m["sharpe"], m["calmar"], m["avg3y"], fund_id))
            code = next((c for c, i in code_to_id.items() if i == fund_id), str(fund_id))
            print(f"  [{code}] CAGR={m['cagr']*100:.2f}%  Sharpe={m['sharpe']:.2f}  MaxDD={m['max_dd']*100:.2f}%")

        conn.commit()

    cur.close()
    conn.close()
    print("\nDone!")

if __name__ == "__main__":
    main()
