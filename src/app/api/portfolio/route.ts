import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  computePortfolioNav,
  computeAllMetrics,
  computeDrawdownSeries,
  computeRolling3YCAGR,
} from '@/lib/calculations'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const allocations: { fundId: number; weight: number }[] = body.allocations

    if (!allocations || allocations.length === 0) {
      return NextResponse.json({ error: 'No allocations provided' }, { status: 400 })
    }

    const totalWeight = allocations.reduce((sum, a) => sum + a.weight, 0)
    if (Math.abs(totalWeight - 100) > 0.5) {
      return NextResponse.json({ error: 'Weights must sum to 100' }, { status: 400 })
    }

      // Fetch NAV data for all selected funds (paginate to get all rows)
      // Supabase returns max 1000 rows per request by default
      const fundIds = allocations.map((a) => a.fundId)
      const PAGE = 1000
      let navRows: { fund_id: number; date: string; nav_value: number }[] = []
      let from = 0
      while (true) {
        const { data, error } = await supabase
          .from('nav_data')
          .select('fund_id, date, nav_value')
          .in('fund_id', fundIds)
          .order('fund_id', { ascending: true })
          .order('date', { ascending: true })
          .range(from, from + PAGE - 1)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        if (!data || data.length === 0) break
        navRows = navRows.concat(data)
        if (data.length < PAGE) break
        from += PAGE
      }

    // Group by fund
    const navByFund = new Map<number, { date: string; value: number }[]>()
    for (const row of navRows) {
      if (!navByFund.has(row.fund_id)) navByFund.set(row.fund_id, [])
      navByFund.get(row.fund_id)!.push({ date: row.date, value: Number(row.nav_value) })
    }

      // Build input for portfolio computation
      const fundNavs = allocations.map((a) => ({
        fundId: a.fundId,
        weight: a.weight,
        navSeries: navByFund.get(a.fundId) ?? [],
      }))

      // Validate all funds have NAV data
      const missingFunds = fundNavs.filter((f) => f.navSeries.length === 0)
      if (missingFunds.length > 0) {
        return NextResponse.json({ error: `No NAV data found for fund ID(s): ${missingFunds.map(f => f.fundId).join(', ')}` }, { status: 400 })
      }

    const portfolioNav = computePortfolioNav(fundNavs)
    const metrics = computeAllMetrics(portfolioNav)
    const drawdownSeries = computeDrawdownSeries(portfolioNav)
    const rollingReturns = computeRolling3YCAGR(portfolioNav)

    // Also compute individual fund metrics for comparison
    const individualMetrics = allocations.map((a) => {
      const navSeries = navByFund.get(a.fundId) ?? []
      if (navSeries.length < 2) return null
      // Rebase to 100
      const base = navSeries[0].value
      const rebased = navSeries.map((n) => ({ date: n.date, value: (n.value / base) * 100 }))
      return {
        fundId: a.fundId,
        metrics: computeAllMetrics(rebased),
      }
    })

    return NextResponse.json({
      portfolioNav,
      metrics,
      drawdownSeries,
      rollingReturns,
      individualMetrics,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
