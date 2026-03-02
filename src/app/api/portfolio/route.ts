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

    // Fetch NAV data for all selected funds
    const fundIds = allocations.map((a) => a.fundId)
    const { data: navRows, error } = await supabase
      .from('nav_data')
      .select('fund_id, date, nav_value')
      .in('fund_id', fundIds)
      .order('date', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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
