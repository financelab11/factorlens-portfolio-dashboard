import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const fundId = parseInt(id)
    if (isNaN(fundId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const { data: fund, error: fundError } = await supabase
      .from('funds')
      .select('*')
      .eq('id', fundId)
      .single()

    if (fundError || !fund) return NextResponse.json({ error: 'Fund not found' }, { status: 404 })

    // Fetch NAV data (paged)
    const PAGE = 1000
    let navRows: { date: string; nav_value: number }[] = []
    let from = 0
    while (true) {
      const { data, error } = await supabase
        .from('nav_data')
        .select('date, nav_value')
        .eq('fund_id', fundId)
        .order('date', { ascending: true })
        .range(from, from + PAGE - 1)
      if (error) break
      if (!data || data.length === 0) break
      navRows = navRows.concat(data)
      if (data.length < PAGE) break
      from += PAGE
    }

    return NextResponse.json({
      fund,
      nav: navRows.map(r => ({ date: r.date, value: Number(r.nav_value) }))
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
