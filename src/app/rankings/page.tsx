"use client"

import { useState, useEffect, useMemo } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Fund {
  id: number
  code: string
  name: string
  category: string
  inception_date: string
  cagr: number
  avg_3y_rolling_return: number
  max_drawdown: number
  volatility: number
  sharpe_ratio: number
  calmar_ratio: number
  score: number
  final_rank: number
}

type SortKey = keyof Fund
type SortDir = "asc" | "desc"

const CATEGORY_COLORS: Record<string, string> = {
  "Broad Market": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "Momentum": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "Multi-Factor": "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "Quality": "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  "Low Vol": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "Alpha": "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  "Value": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "Global/Other": "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300",
}

function pct(v: number | null) {
  if (v == null) return "—"
  return `${(v * 100).toFixed(2)}%`
}

function fixed(v: number | null, d = 2) {
  if (v == null) return "—"
  return v.toFixed(d)
}

export default function RankingsPage() {
  const [funds, setFunds] = useState<Fund[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("All")
  const [sortKey, setSortKey] = useState<SortKey>("final_rank")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  useEffect(() => {
    fetch("/api/funds")
      .then((r) => r.json())
      .then((d) => { setFunds(d); setLoading(false) })
  }, [])

  const categories = useMemo(() => ["All", ...Array.from(new Set(funds.map((f) => f.category)))], [funds])

  const sorted = useMemo(() => {
    let filtered = funds.filter((f) => {
      const matchCat = catFilter === "All" || f.category === catFilter
      const matchSearch = f.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })

    filtered = [...filtered].sort((a, b) => {
      const av = a[sortKey] as number
      const bv = b[sortKey] as number
      if (av == null) return 1
      if (bv == null) return -1
      return sortDir === "asc" ? av - bv : bv - av
    })

    return filtered
  }, [funds, search, catFilter, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const exportCsv = () => {
    const headers = ["Rank", "Name", "Category", "CAGR", "Avg 3Y CAGR", "Sharpe", "Max Drawdown", "Volatility", "Calmar", "Score"]
    const rows = sorted.map((f) => [
      f.final_rank, f.name, f.category,
      pct(f.cagr), pct(f.avg_3y_rolling_return), fixed(f.sharpe_ratio),
      pct(f.max_drawdown), pct(f.volatility), fixed(f.calmar_ratio), f.score,
    ])
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "factorlens-rankings.csv"; a.click()
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 text-primary" />
      : <ArrowDown className="h-3 w-3 text-primary" />
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Fund Rankings</h1>
            <p className="text-muted-foreground mt-1">
              All 28 NSE factor & broad-market funds ranked by composite score.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv} className="gap-2">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Link href="/dashboard">
              <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600 text-white border-0">
                Build Portfolio
              </Button>
            </Link>
          </div>
        </div>

        {/* Score explanation */}
        <Card className="mb-6 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800">
          <CardContent className="p-4">
            <p className="text-sm text-indigo-800 dark:text-indigo-200">
              <strong>Composite Score</strong> weights multiple metrics: CAGR (since inception), average 3-year rolling return, % outperformance vs Nifty 50, median excess returns, Sharpe ratio, and max drawdown protection.
              Rank 1 is the highest-scoring fund.
            </p>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search funds..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  catFilter === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      {[
                        { key: "final_rank" as SortKey, label: "Rank" },
                        { key: "name" as SortKey, label: "Fund Name" },
                        { key: "category" as SortKey, label: "Category" },
                        { key: "cagr" as SortKey, label: "CAGR" },
                        { key: "avg_3y_rolling_return" as SortKey, label: "Avg 3Y" },
                        { key: "sharpe_ratio" as SortKey, label: "Sharpe" },
                        { key: "max_drawdown" as SortKey, label: "Max DD" },
                        { key: "volatility" as SortKey, label: "Volatility" },
                        { key: "score" as SortKey, label: "Score" },
                      ].map((col) => (
                        <th
                          key={col.key}
                          className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                          onClick={() => handleSort(col.key)}
                        >
                          <span className="flex items-center gap-1">
                            {col.label}
                            <SortIcon col={col.key} />
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((fund, i) => (
                      <tr key={fund.id} className={cn("border-b last:border-0 hover:bg-muted/30 transition-colors", i % 2 === 0 ? "" : "bg-muted/10")}>
                        <td className="px-4 py-3 font-bold text-center">
                          <span className={cn(
                            "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
                            fund.final_rank === 1 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" :
                            fund.final_rank === 2 ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" :
                            fund.final_rank === 3 ? "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {fund.final_rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium max-w-xs">
                          <div className="truncate">{fund.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{fund.code}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className={cn("text-xs whitespace-nowrap", CATEGORY_COLORS[fund.category])}>
                            {fund.category}
                          </Badge>
                        </td>
                        <td className={cn("px-4 py-3 font-semibold tabular-nums whitespace-nowrap", fund.cagr > 0.18 ? "text-teal-600" : "text-foreground")}>
                          {pct(fund.cagr)}
                        </td>
                        <td className="px-4 py-3 tabular-nums whitespace-nowrap text-muted-foreground">
                          {pct(fund.avg_3y_rolling_return)}
                        </td>
                        <td className={cn("px-4 py-3 tabular-nums whitespace-nowrap", fund.sharpe_ratio > 0.9 ? "text-teal-600 font-semibold" : "text-foreground")}>
                          {fixed(fund.sharpe_ratio)}
                        </td>
                        <td className="px-4 py-3 tabular-nums whitespace-nowrap text-red-500">
                          {pct(fund.max_drawdown)}
                        </td>
                        <td className="px-4 py-3 tabular-nums whitespace-nowrap text-muted-foreground">
                          {pct(fund.volatility)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full min-w-[48px]">
                              <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full"
                                style={{ width: `${Math.min((fund.score / 50) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-foreground tabular-nums">{fund.score?.toFixed(1)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          {sorted.length} of {funds.length} funds shown · Data: NSE India, Apr 2005–Feb 2026 · For educational purposes only
        </p>
      </div>
    </div>
  )
}
