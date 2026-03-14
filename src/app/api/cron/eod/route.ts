import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  computeCAGR,
  computeVolatility,
  computeMaxDrawdown,
  computeRolling3YCAGR,
  computeSortino,
  NavPoint,
} from '@/lib/calculations'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Index definitions ────────────────────────────────────────────────────────

const NSE_INDICES: { code: string; indexName: string }[] = [
  { code: 'N50',          indexName: 'NIFTY 50' },
  { code: 'NN50',         indexName: 'NIFTY NEXT 50' },
  { code: 'N500',         indexName: 'NIFTY 500' },
  { code: 'NMC150',       indexName: 'NIFTY MIDCAP 150' },
  { code: 'NSC250',       indexName: 'NIFTY SMALLCAP 250' },
  { code: 'NSC500',       indexName: 'NIFTY SMALLCAP 500' },
  { code: 'NμC250',       indexName: 'NIFTY MICROCAP 250' },
  { code: 'NTM',          indexName: 'NIFTY TOTAL MARKET' },
  { code: 'MC150M50',     indexName: 'NIFTY MIDCAP150 MOMENTUM 50' },
  { code: 'N500M50',      indexName: 'NIFTY500 MOMENTUM 50' },
  { code: 'N200M30',      indexName: 'NIFTY200 MOMENTUM 30' },
  { code: 'NTMMQ50',      indexName: 'NIFTY TOTAL MARKET MOMENTUM QUALITY 50' },
  { code: 'MC150Q50',     indexName: 'NIFTY MIDCAP150 QUALITY 50' },
  { code: 'N500Q50',      indexName: 'NIFTY500 QUALITY 50' },
  { code: 'N200Q30',      indexName: 'NIFTY200 QUALITY 30' },
  { code: 'N100Q30',      indexName: 'NIFTY100 QUALITY 30' },
  { code: 'SC250Q50',     indexName: 'NIFTY SMALLCAP250 QUALITY 50' },
  { code: 'N100LV30',     indexName: 'NIFTY100 LOW VOLATILITY 30' },
  { code: 'N500LV50',     indexName: 'NIFTY500 LOW VOLATILITY 50' },
  { code: 'N100A30',      indexName: 'NIFTY100 ALPHA 30' },
  { code: 'N200A30',      indexName: 'NIFTY200 ALPHA 30' },
  { code: 'N500V50',      indexName: 'NIFTY500 VALUE 50' },
  { code: 'MMS400MQ100',  indexName: 'NIFTY MIDSMALLCAP400 MOMENTUM QUALITY 100' },
  { code: 'SC250MQ100',   indexName: 'NIFTY SMALLCAP250 MOMENTUM QUALITY 100' },
  { code: 'N500MCQ50',    indexName: 'NIFTY500 MULTICAP MOMENTUM QUALITY 50' },
  { code: 'N500MF50',     indexName: 'NIFTY500 MULTIFACTOR MQVLV 50' },
]

// S&P 500 and Gold BeES via Yahoo Finance
const YAHOO_FUNDS: { code: string; symbol: string }[] = [
  { code: 'SPX',  symbol: '^GSPC' },
  { code: 'GOLD', symbol: 'GOLDBEES.NS' },
]

// ── Date helpers ─────────────────────────────────────────────────────────────

const MONTHS: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04',
  May: '05', Jun: '06', Jul: '07', Aug: '08',
  Sep: '09', Oct: '10', Nov: '11', Dec: '12',
}

/** "28 Feb 2026"  →  "2026-02-28" */
function niftyDateToISO(dateStr: string): string {
  const parts = dateStr.trim().split(/\s+/)
  if (parts.length !== 3) return ''
  const [day, mon, year] = parts
  const month = MONTHS[mon]
  if (!month) return ''
  return `${year}-${month}-${day.padStart(2, '0')}`
}

/** "2026-02-28" → "28-Feb-2026"  (niftyindices request format) */
function isoToNiftyReqDate(iso: string): string {
  const d = new Date(iso)
  const day  = String(d.getUTCDate()).padStart(2, '0')
  const mon  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()]
  const year = d.getUTCFullYear()
  return `${day}-${mon}-${year}`
}

/** Today's date as "YYYY-MM-DD" in IST (UTC+5:30) */
function todayIST(): string {
  const now = new Date()
  // Advance by 5h30m to get IST
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().slice(0, 10)
}

/** Add N calendar days to an ISO date string */
function addDays(iso: string, n: number): string {
  const d = new Date(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Strip commas and parse float ("22,124.70" → 22124.70) */
function parseNum(s: string): number {
  return parseFloat(s.replace(/,/g, ''))
}

// ── Scraping functions ───────────────────────────────────────────────────────

/**
 * Fetch historical closing values from niftyindices.com for a given index.
 * Returns an array of { date: "YYYY-MM-DD", value: number }.
 */
async function fetchNiftyIndex(
  indexName: string,
  fromISO: string,
  toISO: string
): Promise<{ date: string; value: number }[]> {
  const fromReq = isoToNiftyReqDate(fromISO)
  const toReq   = isoToNiftyReqDate(toISO)

  const cinfo = JSON.stringify({
    name: indexName,
    startDate: fromReq,
    endDate: toReq,
    indexName: indexName,
  })

  const res = await fetch(
    'https://www.niftyindices.com/Backpage.aspx/getHistoricaldatatabletoString',
    {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json; charset=utf-8',
        'Accept':          'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With':'XMLHttpRequest',
        'Referer':         'https://www.niftyindices.com/reports/historical-data',
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({ cinfo }),
      signal: AbortSignal.timeout(20_000),
    }
  )

  if (!res.ok) throw new Error(`niftyindices HTTP ${res.status} for ${indexName}`)

  const outer = await res.json() as { d: string }
  if (!outer.d) return []

  // outer.d is a JSON-encoded array string
  let rows: Record<string, string>[]
  try {
    rows = JSON.parse(outer.d)
  } catch {
    // fall back: try as-is if already parsed
    return []
  }

  return rows
    .map((row) => {
      // niftyindices uses "HistoricalDate" as the date field name
      const dateStr  = row['HistoricalDate'] ?? row['Date'] ?? row['date'] ?? ''
      const closeStr = row['CLOSE'] ?? row['Close'] ?? row['close'] ?? ''
      const date  = niftyDateToISO(dateStr)
      const value = parseNum(closeStr)
      return { date, value }
    })
    .filter((r) => r.date.length === 10 && !isNaN(r.value) && r.value > 0)
}

/**
 * Fetch closing prices from Yahoo Finance for the given symbol.
 * period1 / period2 are UNIX timestamps (seconds).
 */
async function fetchYahoo(
  symbol: string,
  fromISO: string,
  toISO: string
): Promise<{ date: string; value: number }[]> {
  const period1 = Math.floor(new Date(fromISO).getTime() / 1000)
  // Add 1 day to toISO so the last day is included
  const period2 = Math.floor(new Date(addDays(toISO, 1)).getTime() / 1000)
  const encodedSymbol = encodeURIComponent(symbol)

  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}` +
    `?interval=1d&period1=${period1}&period2=${period2}&events=history`

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status} for ${symbol}`)

  const json = await res.json() as {
    chart: {
      result?: Array<{
        timestamp?: number[]
        indicators?: { adjclose?: Array<{ adjclose?: number[] }>; quote?: Array<{ close?: number[] }> }
      }>
      error?: unknown
    }
  }

  const result = json?.chart?.result?.[0]
  if (!result) return []

  const timestamps = result.timestamp ?? []
  // Prefer adjusted close; fall back to regular close
  const closes =
    result.indicators?.adjclose?.[0]?.adjclose ??
    result.indicators?.quote?.[0]?.close ??
    []

  const points: { date: string; value: number }[] = []
  for (let i = 0; i < timestamps.length; i++) {
    const val = closes[i]
    if (val == null || isNaN(val) || val <= 0) continue
    const date = new Date(timestamps[i] * 1000).toISOString().slice(0, 10)
    points.push({ date, value: val })
  }
  return points
}

// ── Metric computation ───────────────────────────────────────────────────────

function computeMetricsFromNav(nav: NavPoint[]) {
  const cagr    = computeCAGR(nav)
  const vol     = computeVolatility(nav)
  const maxDD   = computeMaxDrawdown(nav)
  const sharpe  = vol > 0 ? cagr / vol : 0
  const calmar  = maxDD !== 0 ? cagr / Math.abs(maxDD) : 0
  const sortino = computeSortino(nav)
  const rolling = computeRolling3YCAGR(nav)
  const avg3y   = rolling.length > 0
    ? rolling.reduce((s, r) => s + r.value, 0) / rolling.length / 100
    : 0
  return { cagr, vol, maxDD, sharpe, calmar, sortino, avg3y }
}

// ── Main handler ─────────────────────────────────────────────────────────────

export const maxDuration = 300 // Vercel Pro: 300s

export async function GET(req: NextRequest) {
  // Allow Vercel's built-in cron auth OR a manual CRON_SECRET bearer token
  const authHeader = req.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = todayIST()
  const log: string[] = [`[EOD scraper] started at ${new Date().toISOString()} — today IST: ${today}`]

  try {
    // ── 1. Get fund IDs and their latest nav date ────────────────────────────
    const { data: funds, error: fundsErr } = await supabase
      .from('funds')
      .select('id, code')

    if (fundsErr || !funds) {
      return NextResponse.json({ error: 'Failed to load funds: ' + fundsErr?.message }, { status: 500 })
    }

    const codeToId = new Map<string, number>(funds.map((f) => [f.code, f.id]))

    // Get the latest date per fund in nav_data
    const fundIds = funds.map((f) => f.id)
    const { data: latestDates, error: latestErr } = await supabase
      .from('nav_data')
      .select('fund_id, date')
      .in('fund_id', fundIds)
      .order('date', { ascending: false })

    if (latestErr) {
      return NextResponse.json({ error: 'Failed to load latest dates: ' + latestErr.message }, { status: 500 })
    }

    // Build map: fund_id → latest_date
    const latestByFund = new Map<number, string>()
    for (const row of latestDates ?? []) {
      if (!latestByFund.has(row.fund_id)) {
        latestByFund.set(row.fund_id, row.date)
      }
    }

    const defaultFrom = '2026-02-28' // fallback if no existing data

    // ── 2. Fetch new data for all funds in parallel ──────────────────────────
    const nseJobs = NSE_INDICES.map(async ({ code, indexName }) => {
      const fundId = codeToId.get(code)
      if (!fundId) return { code, rows: [], error: 'Fund not found in DB' }

      const lastDate = latestByFund.get(fundId) ?? defaultFrom
      const fromISO  = addDays(lastDate, 1)

      if (fromISO > today) {
        return { code, rows: [], error: null, skipped: true }
      }

      try {
        const rows = await fetchNiftyIndex(indexName, fromISO, today)
        return { code, fundId, rows, error: null }
      } catch (e) {
        return { code, fundId, rows: [], error: String(e) }
      }
    })

    const yahooJobs = YAHOO_FUNDS.map(async ({ code, symbol }) => {
      const fundId = codeToId.get(code)
      if (!fundId) return { code, rows: [], error: 'Fund not found in DB' }

      const lastDate = latestByFund.get(fundId) ?? defaultFrom
      const fromISO  = addDays(lastDate, 1)

      if (fromISO > today) {
        return { code, rows: [], error: null, skipped: true }
      }

      try {
        const rows = await fetchYahoo(symbol, fromISO, today)
        return { code, fundId, rows, error: null }
      } catch (e) {
        return { code, fundId, rows: [], error: String(e) }
      }
    })

    const allResults = await Promise.all([...nseJobs, ...yahooJobs])

    // ── 3. Upsert new NAV rows into Supabase ─────────────────────────────────
    let totalInserted = 0
    const fundsWithNewData = new Set<number>()

    for (const result of allResults) {
      if ('skipped' in result && result.skipped) {
        log.push(`[${result.code}] up to date, skipped`)
        continue
      }
      if (result.error) {
        log.push(`[${result.code}] ERROR: ${result.error}`)
        continue
      }
      if (!result.rows.length) {
        log.push(`[${result.code}] no new data`)
        continue
      }

      const fundId = (result as { fundId: number }).fundId
      const records = result.rows
        .filter((r) => r.date > (latestByFund.get(fundId) ?? defaultFrom))
        .map((r) => ({ fund_id: fundId, date: r.date, nav_value: r.value }))

      if (!records.length) {
        log.push(`[${result.code}] no records after dedup`)
        continue
      }

      // Delete any existing rows for this date range before inserting
      const minDate = records[0].date
      const maxDate = records[records.length - 1].date
      await supabase
        .from('nav_data')
        .delete()
        .eq('fund_id', fundId)
        .gte('date', minDate)
        .lte('date', maxDate)

      const { error: insertErr } = await supabase
        .from('nav_data')
        .insert(records)

      if (insertErr) {
        log.push(`[${result.code}] insert error: ${insertErr.message}`)
      } else {
        log.push(`[${result.code}] inserted ${records.length} rows (up to ${records[records.length - 1].date})`)
        totalInserted += records.length
        fundsWithNewData.add(fundId)
      }
    }

    // ── 4. Recompute metrics for funds that got new data ─────────────────────
    let metricsUpdated = 0

    if (fundsWithNewData.size > 0) {
      const updatedFundIds = Array.from(fundsWithNewData)

      // Fetch full nav history for updated funds
      const PAGE = 1000
      let navRows: { fund_id: number; date: string; nav_value: number }[] = []
      let from = 0
      while (true) {
        const { data, error } = await supabase
          .from('nav_data')
          .select('fund_id, date, nav_value')
          .in('fund_id', updatedFundIds)
          .order('date', { ascending: true })
          .range(from, from + PAGE - 1)
        if (error || !data || data.length === 0) break
        navRows = navRows.concat(data)
        if (data.length < PAGE) break
        from += PAGE
      }

      // Group by fund_id
      const navByFund = new Map<number, NavPoint[]>()
      for (const row of navRows) {
        if (!navByFund.has(row.fund_id)) navByFund.set(row.fund_id, [])
        navByFund.get(row.fund_id)!.push({ date: row.date, value: Number(row.nav_value) })
      }

      // Update metrics for each fund
      for (const fundId of updatedFundIds) {
        const nav = navByFund.get(fundId)
        if (!nav || nav.length < 2) continue

        const { cagr, vol, maxDD, sharpe, calmar, avg3y } = computeMetricsFromNav(nav)

        const { error: updateErr } = await supabase
          .from('funds')
          .update({
            cagr,
            volatility: vol,
            max_drawdown: maxDD,
            sharpe_ratio: sharpe,
            calmar_ratio: calmar,
            avg_3y_rolling_return: avg3y,
          })
          .eq('id', fundId)

        if (updateErr) {
          log.push(`[metrics] fund ${fundId} update error: ${updateErr.message}`)
        } else {
          metricsUpdated++
        }
      }
    }

    log.push(`\nDone — ${totalInserted} new nav rows, ${metricsUpdated} fund metrics updated`)
    return NextResponse.json({ ok: true, log })

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    log.push(`FATAL: ${msg}`)
    return NextResponse.json({ ok: false, error: msg, log }, { status: 500 })
  }
}
