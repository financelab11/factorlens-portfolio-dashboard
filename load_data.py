import json
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime

# Connection string
conn_str = "postgresql://postgres.cxmaeueobsqrbivoqvry:74d4pPImwlV0sCH3LDrUUsB9OIkKHNzSrRZyht8OyWiWSGPr7uA8Iz1qRqlJCxQn@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

with open('/home/user/app/data.json', 'r') as f:
    data = json.load(f)

sheets = data.get('sheets', {})
summary = sheets.get('Summary', {})
rankings = summary.get('rankings', [])
metric_inputs = sheets.get('Metric_Inputs', {}).get('records', [])
nav_records = sheets.get('NAV_Series', {}).get('records', [])

# NAV column order (exact match to JSON)
nav_cols = ['N50', 'NN50', 'N500', 'NMC150', 'NSC250', 'NSC500', 'NμC250', 'NTM',
            'MC150M50', 'N500M50', 'N200M30', 'NTMMQ50', 'MC150Q50', 'N500Q50',
            'N200Q30', 'N100Q30', 'SC250Q50', 'N100LV30', 'N500LV50', 'N100A30',
            'N200A30', 'N500V50', 'MMS400MQ100', 'SC250MQ100', 'N500MCQ50', 'N500MF50',
            'SPX', 'GOLD']

# Fund name mapping (code -> full name)
code_to_name = {
    'N50': 'NIFTY 50',
    'NN50': 'Nifty Next 50',
    'N500': 'Nifty 500',
    'NMC150': 'Nifty Midcap 150',
    'NSC250': 'Nifty Smallcap 250',
    'NSC500': 'NIFTY SMALLCAP 500',
    'NμC250': 'Nifty Microcap 250',
    'NTM': 'Nifty Total Market',
    'MC150M50': 'NIFTY MIDCAP150 MOMENTUM 50',
    'N500M50': 'Nifty500 Momentum 50',
    'N200M30': 'NIFTY200 MOMENTUM 30',
    'NTMMQ50': 'Nifty Total Market Momentum Quality 50',
    'MC150Q50': 'NIFTY MIDCAP150 QUALITY 50',
    'N500Q50': 'Nifty500 Quality 50',
    'N200Q30': 'NIFTY200 QUALITY 30',
    'N100Q30': 'NIFTY100 QUALITY 30',
    'SC250Q50': 'NIFTY SMALLCAP250 QUALITY 50',
    'N100LV30': 'NIFTY100 LOW VOLATILITY 30',
    'N500LV50': 'Nifty500 Low Volatility 50',
    'N100A30': 'NIFTY100 ALPHA 30',
    'N200A30': 'NIFTY200 ALPHA 30',
    'N500V50': 'Nifty500 Value 50',
    'MMS400MQ100': 'NIFTY MIDSMALLCAP400 MOMENTUM QUALITY 100',
    'SC250MQ100': 'NIFTY SMALLCAP250 MOMENTUM QUALITY 100',
    'N500MCQ50': 'NIFTY500 MULTICAP MOMENTUM QUALITY 50',
    'N500MF50': 'NIFTY500 MULTIFACTOR MQVLv 50',
    'SPX': 'S&P 500',
    'GOLD': 'Gold BeES'
}

# Build name -> metrics from metric_inputs
name_to_metrics = {}
for m in metric_inputs:
    name_to_metrics[m['index_name']] = m

# Build name -> ranking
name_to_rank = {}
for r in rankings:
    name_to_rank[r['index_name']] = r

conn = psycopg2.connect(conn_str)
cur = conn.cursor()

# Clear existing data
cur.execute("DELETE FROM nav_data")
cur.execute("DELETE FROM funds")
conn.commit()
print("Cleared existing data")

# Insert funds
fund_ids = {}
for code in nav_cols:
    name = code_to_name[code]
    metrics = name_to_metrics.get(name, {})
    rank_data = name_to_rank.get(name, {})
    
    # Try case-insensitive fallback
    if not metrics:
        for k, v in name_to_metrics.items():
            if k.upper() == name.upper():
                metrics = v
                break
    if not rank_data:
        for k, v in name_to_rank.items():
            if k.upper() == name.upper():
                rank_data = v
                break
    
    category = metrics.get('category', 'Unknown')
    inception_date = metrics.get('data_start', '')
    cagr = metrics.get('cagr_si')
    avg_3y = metrics.get('avg_3y_rr')
    max_dd = metrics.get('max_drawdown')
    vol = metrics.get('volatility')
    sharpe = metrics.get('sharpe_ratio')
    score = rank_data.get('score')
    final_rank = rank_data.get('final_rank') or rank_data.get('rank')
    calmar = cagr / abs(max_dd) if cagr and max_dd and max_dd != 0 else None
    
    cur.execute("""
        INSERT INTO funds (code, name, category, inception_date, cagr, avg_3y_rolling_return,
            max_drawdown, volatility, sharpe_ratio, calmar_ratio, score, final_rank)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    """, (code, name, category, inception_date, cagr, avg_3y, max_dd, vol, sharpe, calmar, score, final_rank))
    
    fund_id = cur.fetchone()[0]
    fund_ids[code] = fund_id
    print(f"Inserted fund: {name} (id={fund_id})")

conn.commit()
print(f"\nInserted {len(fund_ids)} funds")

# Insert NAV data in batches
batch_size = 500
total_inserted = 0

for col in nav_cols:
    fund_id = fund_ids[col]
    rows = []
    for rec in nav_records:
        val = rec.get(col)
        if val is not None and val > 0:
            rows.append((fund_id, rec['Date'], float(val)))
    
    # Insert in batches
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        execute_values(cur, "INSERT INTO nav_data (fund_id, date, nav_value) VALUES %s", batch)
    
    conn.commit()
    total_inserted += len(rows)
    print(f"Inserted {len(rows)} NAV records for {col}")

print(f"\nTotal NAV records inserted: {total_inserted}")
cur.close()
conn.close()
print("Done!")
