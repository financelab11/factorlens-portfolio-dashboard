"use client"

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  PieChart,
  Pie,
  Cell,
  TooltipProps,
  BarChart,
  Bar,
  LabelList,
} from "recharts"
import { format, parseISO } from "date-fns"

interface NavPoint {
  date: string
  value: number
}

interface DrawdownPoint {
  date: string
  value: number
}

interface RollingReturn {
  date: string
  value: number
}

// Sample every Nth point for performance
function sampleData<T>(data: T[], targetPoints: number): T[] {
  if (data.length <= targetPoints) return data
  const step = Math.ceil(data.length / targetPoints)
  const sampled: T[] = []
  for (let i = 0; i < data.length; i += step) sampled.push(data[i])
  if (sampled[sampled.length - 1] !== data[data.length - 1]) sampled.push(data[data.length - 1])
  return sampled
}

function formatDate(dateStr: string) {
  try { return format(parseISO(dateStr), "MMM yyyy") } catch { return dateStr }
}

// Custom tooltip
function CustomTooltip({ active, payload, label, formatter }: TooltipProps<number, string> & { formatter?: (v: number) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-1">{formatDate(label)}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatter ? formatter(p.value as number) : (p.value as number).toFixed(2)}
        </p>
      ))}
    </div>
  )
}

// Merge two data series by date. Uses null (not undefined) so Recharts connectNulls works.
function mergeSeries(data: any[], benchmarkData?: any[]): any[] {
  if (!benchmarkData || benchmarkData.length === 0) return data

  const bMap = new Map<string, number>()
  benchmarkData.forEach(p => bMap.set(String(p.date).trim(), p.value))

  return data.map(p => ({
    ...p,
    benchmark: bMap.get(String(p.date).trim()) ?? null,
  }))
}

export function NavChart({
  data,
  benchmarkData,
  name = "Portfolio",
  benchmarkName = "Nifty 50",
}: {
  data: NavPoint[]
  benchmarkData?: NavPoint[]
  name?: string
  benchmarkName?: string
}) {
  const hasBenchmark = benchmarkData && benchmarkData.length > 0
  const merged = mergeSeries(data, benchmarkData)
  const sampled = sampleData(merged, 400)

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={sampled} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="navGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `₹${v.toFixed(0)}`}
          width={55}
        />
        <Tooltip content={<CustomTooltip formatter={(v) => `₹${v.toFixed(2)}`} />} />
        <Legend verticalAlign="top" height={36} />
        <Area
          type="monotone"
          dataKey="value"
          name={name}
          stroke="#4f46e5"
          strokeWidth={2}
          fill="url(#navGrad)"
          dot={false}
          activeDot={{ r: 4 }}
        />
        {hasBenchmark && (
          <Line
            type="monotone"
            dataKey="benchmark"
            name={benchmarkName}
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            connectNulls
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function DrawdownChart({ data, benchmarkData, name = "Portfolio", benchmarkName = "Nifty 50" }: { data: DrawdownPoint[], benchmarkData?: DrawdownPoint[], name?: string, benchmarkName?: string }) {
  const hasBenchmark = benchmarkData && benchmarkData.length > 0
  const merged = mergeSeries(data, benchmarkData)
  const sampled = sampleData(merged, 400)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={sampled} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v.toFixed(0)}%`}
          width={45}
        />
        <ReferenceLine y={0} stroke="hsl(var(--border))" />
        <Tooltip content={<CustomTooltip formatter={(v) => `${v.toFixed(2)}%`} />} />
        {hasBenchmark && <Legend verticalAlign="top" height={36} iconType="plainline" />}
        <Area
          type="monotone"
          dataKey="value"
          name={name}
          stroke="#ef4444"
          strokeWidth={1.5}
          fill="url(#ddGrad)"
          dot={false}
        />
        {hasBenchmark && (
          <Line
            type="monotone"
            dataKey="benchmark"
            name={benchmarkName}
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            connectNulls
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function RollingReturnChart({ data, benchmarkData, name = "Portfolio", benchmarkName = "Nifty 50" }: { data: RollingReturn[], benchmarkData?: RollingReturn[], name?: string, benchmarkName?: string }) {
  const hasBenchmark = benchmarkData && benchmarkData.length > 0
  const merged = mergeSeries(data, benchmarkData)
  const sampled = sampleData(merged, 400)

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={sampled} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v.toFixed(0)}%`}
          width={45}
        />
        <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="4 4" />
        <Tooltip content={<CustomTooltip formatter={(v) => `${v.toFixed(2)}%`} />} />
        {hasBenchmark && <Legend verticalAlign="top" height={36} iconType="plainline" />}
        <Line
          type="monotone"
          dataKey="value"
          name={name}
          stroke="#0d9488"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        {hasBenchmark && (
          <Line
            type="monotone"
            dataKey="benchmark"
            name={benchmarkName}
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            connectNulls
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}

const PIE_COLORS = ["#4f46e5", "#0d9488", "#7c3aed", "#d97706", "#059669", "#dc2626", "#0284c7", "#9333ea", "#16a34a", "#ea580c"]

export function AllocationPieChart({ data }: { data: { name: string; weight: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          dataKey="weight"
          nameKey="name"
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [`${v}%`, "Allocation"]} />
        <Legend
          formatter={(value) => <span className="text-xs">{value.length > 20 ? value.slice(0, 20) + "…" : value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ── Fiscal Year Returns Chart ──────────────────────────────────────────────

function findFloorNav(
  sortedDates: string[],
  navMap: Map<string, number>,
  targetDate: string
): number | null {
  // Binary search: find last date <= targetDate
  let lo = 0, hi = sortedDates.length - 1, result = -1
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (sortedDates[mid] <= targetDate) { result = mid; lo = mid + 1 }
    else hi = mid - 1
  }
  if (result !== -1) return navMap.get(sortedDates[result]) ?? null
  // All dates > targetDate: use earliest available
  if (sortedDates.length > 0) return navMap.get(sortedDates[0]) ?? null
  return null
}

interface FYReturn {
  fy: string
  value: number
  isLive: boolean
}

function computeFYReturns(nav: NavPoint[], today: string): FYReturn[] {
  if (nav.length === 0) return []
  const sorted = [...nav].sort((a, b) => a.date.localeCompare(b.date))
  const navMap = new Map(sorted.map(p => [p.date, p.value]))
  const sortedDates = sorted.map(p => p.date)
  const firstDate = sortedDates[0]

  const results: FYReturn[] = []
  // FY2006 = Apr 2005 – Mar 2006, ..., FY2026 = Apr 2025 – Mar 2026
  for (let fyYear = 2006; fyYear <= 2026; fyYear++) {
    const fyStart = `${fyYear - 1}-04-01`
    const fyEnd = `${fyYear}-03-31`
    // Skip if fund inception is after the end of this FY
    if (firstDate > fyEnd) continue

    const isLive = fyEnd > today
    const effectiveEnd = isLive ? today : fyEnd

    // For FY start: use the nearest date at or after fyStart (ceil),
    // but cap to the first date of the fund's history
    const effectiveStart = fyStart < firstDate ? firstDate : fyStart

    const startVal = findFloorNav(sortedDates, navMap, effectiveStart)
    const endVal = findFloorNav(sortedDates, navMap, effectiveEnd)

    if (startVal === null || endVal === null || startVal === 0) continue

    const ret = ((endVal / startVal) - 1) * 100
    results.push({ fy: `FY${fyYear.toString().slice(2)}`, value: parseFloat(ret.toFixed(1)), isLive })
  }
  return results
}

interface FYChartRow {
  fy: string
  fund: number | null
  benchmark: number | null
  isLive: boolean
}

export function FiscalYearChart({
  fundNav,
  benchmarkNav,
  fundName = "Fund",
  benchmarkName = "NIFTY 50",
}: {
  fundNav: NavPoint[]
  benchmarkNav: NavPoint[]
  fundName?: string
  benchmarkName?: string
}) {
  const today = new Date().toISOString().slice(0, 10)
  const fundReturns = computeFYReturns(fundNav, today)
  const benchReturns = computeFYReturns(benchmarkNav, today)

  const bMap = new Map(benchReturns.map(r => [r.fy, r]))
  const fMap = new Map(fundReturns.map(r => [r.fy, r]))

  // Combine all FY years present in either series
  const allFYs = new Set([...fundReturns.map(r => r.fy), ...benchReturns.map(r => r.fy)])
  const sortedFYs = Array.from(allFYs).sort()

  const data: FYChartRow[] = sortedFYs.map(fy => {
    const f = fMap.get(fy)
    const b = bMap.get(fy)
    return {
      fy,
      fund: f?.value ?? null,
      benchmark: b?.value ?? null,
      isLive: f?.isLive || b?.isLive || false,
    }
  })

  const hasLive = data.some(d => d.isLive)
  // Height: each row ~38px for horizontal bar chart
  const chartHeight = Math.max(320, data.length * 38 + 60)

  const CustomFYTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    const row = data.find(d => d.fy === label)
    return (
      <div className="bg-popover border rounded-lg shadow-lg px-3 py-2 text-xs">
        <p className="font-bold mb-1">{label}{row?.isLive ? " (live)" : ""}</p>
        {payload.map((p: any) => (
          p.value !== null && (
            <p key={p.dataKey} style={{ color: p.fill }} className="font-medium">
              {p.name}: {p.value > 0 ? "+" : ""}{p.value?.toFixed(1)}%
            </p>
          )
        ))}
      </div>
    )
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 52, left: 4, bottom: 4 }}
          barSize={13}
          barGap={2}
          barCategoryGap="28%"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            tickFormatter={(v) => `${v.toFixed(0)}%`}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="fy"
            tick={({ x, y, payload }) => {
              const row = data.find(d => d.fy === payload.value)
              return (
                <text x={x} y={y} dy={4} textAnchor="end" fontSize={10} fill={row?.isLive ? "#f59e0b" : "hsl(var(--muted-foreground))"}>
                  {payload.value}{row?.isLive ? "*" : ""}
                </text>
              )
            }}
            width={36}
          />
          <ReferenceLine x={0} stroke="hsl(var(--border))" />
          <Tooltip content={<CustomFYTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
          <Legend verticalAlign="top" height={28} iconType="square" wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="fund" name={fundName} fill="#4f46e5" radius={[0, 2, 2, 0]}>
            <LabelList
              dataKey="fund"
              position="right"
              formatter={(v: number | null) => v !== null ? `${v > 0 ? "+" : ""}${v?.toFixed(0)}%` : ""}
              style={{ fontSize: 9, fill: "#4f46e5" }}
            />
          </Bar>
          <Bar dataKey="benchmark" name={benchmarkName} fill="#94a3b8" radius={[0, 2, 2, 0]}>
            <LabelList
              dataKey="benchmark"
              position="right"
              formatter={(v: number | null) => v !== null ? `${v > 0 ? "+" : ""}${v?.toFixed(0)}%` : ""}
              style={{ fontSize: 9, fill: "#64748b" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {hasLive && (
        <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center mt-1 font-medium">
          * FY26 is live (year-to-date through {today})
        </p>
      )}
    </div>
  )
}
