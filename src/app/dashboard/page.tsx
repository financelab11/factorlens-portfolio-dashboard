"use client"

import { useState, useEffect, useCallback } from "react"
import { PortfolioBuilder, Fund } from "@/components/portfolio-builder"
import { NavChart, DrawdownChart, RollingReturnChart, AllocationPieChart } from "@/components/portfolio-charts"
import { MetricsGrid } from "@/components/metrics-grid"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

// Top-5 fund IDs ranked by highest Sharpe ratio (equi-weighted reference portfolio)
const DEFAULT_FUND_IDS = [26, 9, 25, 12, 23]

interface FundAllocation {
  fund: Fund
  weight: number
}

interface PortfolioMetrics {
  cagr: number
  volatility: number
  sharpe: number
  maxDrawdown: number
  calmar: number
  sortino: number
  totalReturn: number
  startDate: string
  endDate: string
}

interface PortfolioResult {
  portfolioNav: { date: string; value: number }[]
  metrics: PortfolioMetrics
  drawdownSeries: { date: string; value: number }[]
  rollingReturns: { date: string; value: number }[]
}

export default function DashboardPage() {
  const [funds, setFunds] = useState<Fund[]>([])
  const [allocations, setAllocations] = useState<FundAllocation[]>([])
  const [result, setResult] = useState<PortfolioResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [fundsLoading, setFundsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    fetch("/api/funds")
      .then((r) => r.json())
      .then((data: Fund[]) => {
        setFunds(data)
        setFundsLoading(false)
        // Auto-load top-5 Sharpe funds at equal weight
        const defaultFunds = DEFAULT_FUND_IDS
          .map((id) => data.find((f) => f.id === id))
          .filter(Boolean) as Fund[]
        if (defaultFunds.length === 5) {
          setAllocations(defaultFunds.map((f) => ({ fund: f, weight: 20 })))
          setIsDefault(true)
        }
      })
      .catch(() => setFundsLoading(false))
  }, [])

  const handleGenerate = useCallback(async () => {
    if (allocations.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const body = {
        allocations: allocations.map((a) => ({ fundId: a.fund.id, weight: a.weight })),
      }
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to compute")
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [allocations])

  // Auto-generate the default reference portfolio once funds are loaded
  useEffect(() => {
    if (isDefault && allocations.length === 5 && !result) {
      handleGenerate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDefault, allocations.length])

  // Clear the default flag when the user edits allocations manually
  const handleAllocationsChange = useCallback((next: FundAllocation[]) => {
    setAllocations(next)
    setIsDefault(false)
  }, [])

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Portfolio Builder</h1>
          <p className="text-muted-foreground mt-1">
            Select funds, set weights, and instantly see 20 years of backtest performance.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left panel: Builder */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Build Your Portfolio</CardTitle>
                <CardDescription className="text-xs">
                  Select up to 10 funds. Allocate weights that sum to 100%.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fundsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                  </div>
                ) : (
                  <PortfolioBuilder
                    funds={funds}
                    allocations={allocations}
                    onChange={handleAllocationsChange}
                    onGenerate={handleGenerate}
                    loading={loading}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right panel: Results */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
              </Card>
            )}

            {!result && !loading && (
              <Card className="border-dashed">
                <CardContent className="p-16 text-center">
                  <div className="inline-flex p-4 bg-primary/5 rounded-full mb-4">
                    <Info className="h-8 w-8 text-primary/40" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No Portfolio Yet</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
                      Select funds from the panel on the left, adjust your weights, and click &ldquo;Generate Portfolio&rdquo; to see your results.
                  </p>
                </CardContent>
              </Card>
            )}

            {loading && (
                <Card>
                  <CardContent className="p-16 text-center">
                    <div className="h-8 w-8 rounded-full border-3 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm">
                      {isDefault
                        ? "Loading reference portfolio — top 5 funds by Sharpe…"
                        : `Computing portfolio metrics from ${allocations.length} fund${allocations.length > 1 ? "s" : ""}...`}
                    </p>
                  </CardContent>
                </Card>
              )}

            {result && !loading && (
              <>
                  {/* Summary badge */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {isDefault && (
                      <Badge className="text-xs gap-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-0">
                        <Sparkles className="h-3 w-3" />
                        Top-5 Sharpe Reference
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {allocations.length} fund{allocations.length > 1 ? "s" : ""}
                    </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {result.metrics.startDate.slice(0, 7)} → {result.metrics.endDate.slice(0, 7)}
                  </Badge>
                  <Badge className="text-xs bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                    CAGR: {(result.metrics.cagr * 100).toFixed(2)}%
                  </Badge>
                </div>

                {/* Metrics */}
                <MetricsGrid metrics={result.metrics} />

                {/* Charts */}
                <Tabs defaultValue="nav">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="nav">NAV Growth</TabsTrigger>
                    <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
                    <TabsTrigger value="rolling">3Y Rolling</TabsTrigger>
                    <TabsTrigger value="allocation">Allocation</TabsTrigger>
                  </TabsList>

                  <TabsContent value="nav">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Cumulative Portfolio Growth</CardTitle>
                        <CardDescription className="text-xs">Rebased to ₹100 at inception</CardDescription>
                      </CardHeader>
                      <CardContent className="pr-2">
                        <NavChart data={result.portfolioNav} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="drawdown">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Drawdown Curve</CardTitle>
                        <CardDescription className="text-xs">% decline from rolling peak</CardDescription>
                      </CardHeader>
                      <CardContent className="pr-2">
                        <DrawdownChart data={result.drawdownSeries} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="rolling">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Rolling 3-Year CAGR</CardTitle>
                        <CardDescription className="text-xs">756 trading-day rolling window</CardDescription>
                      </CardHeader>
                      <CardContent className="pr-2">
                        {result.rollingReturns.length > 0 ? (
                          <RollingReturnChart data={result.rollingReturns} />
                        ) : (
                          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                            Need at least 3 years of common data to show rolling returns.
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="allocation">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">Portfolio Allocation</CardTitle>
                        <CardDescription className="text-xs">Weight distribution across funds</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <AllocationPieChart
                          data={allocations.map((a) => ({
                            name: a.fund.name.length > 25 ? a.fund.name.slice(0, 25) + "…" : a.fund.name,
                            weight: a.weight,
                          }))}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>

                {/* Methodology note */}
                <Card className="bg-muted/50 border-dashed">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Methodology:</strong> Portfolio NAV is computed as a weighted sum of rebased individual fund NAVs (base = 100 at common start date). CAGR = annualised return. Volatility = annualised std dev of daily returns (×√252). Sharpe = CAGR/Volatility. Max Drawdown = maximum peak-to-trough decline. Calmar = CAGR / |Max Drawdown|. Rolling 3Y uses a 756 trading-day window. Data: NSE India, April 2005 – February 2026.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
