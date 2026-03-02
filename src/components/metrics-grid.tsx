"use client"

import { TrendingUp, TrendingDown, Activity, Shield, BarChart3, Zap } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Metrics {
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

interface Props {
  metrics: Metrics
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  positive,
  className,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  positive?: boolean
  className?: string
}) {
  return (
    <Card className={cn("border-border/60 hover:border-primary/20 transition-colors", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
          <div className={cn(
            "p-1.5 rounded-lg",
            positive === true ? "bg-teal-50 dark:bg-teal-950/30" :
            positive === false ? "bg-red-50 dark:bg-red-950/30" :
            "bg-muted"
          )}>
            <Icon className={cn(
              "h-3.5 w-3.5",
              positive === true ? "text-teal-600" :
              positive === false ? "text-red-500" :
              "text-muted-foreground"
            )} />
          </div>
        </div>
        <p className={cn(
          "text-2xl font-bold tabular-nums",
          positive === true ? "text-teal-600" :
          positive === false ? "text-red-500" :
          "text-foreground"
        )}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export function MetricsGrid({ metrics }: Props) {
  const pct = (v: number) => `${(v * 100).toFixed(2)}%`
  const fixed = (v: number, d = 2) => v.toFixed(d)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <MetricCard
        label="CAGR"
        value={pct(metrics.cagr)}
        sub="Since inception"
        icon={TrendingUp}
        positive={metrics.cagr > 0}
      />
      <MetricCard
        label="Volatility"
        value={pct(metrics.volatility)}
        sub="Annual std dev"
        icon={Activity}
        positive={metrics.volatility < 0.2}
      />
      <MetricCard
        label="Sharpe Ratio"
        value={fixed(metrics.sharpe)}
        sub="Return per unit risk"
        icon={BarChart3}
        positive={metrics.sharpe > 0.8}
      />
      <MetricCard
        label="Max Drawdown"
        value={pct(metrics.maxDrawdown)}
        sub="Worst peak-to-trough"
        icon={TrendingDown}
        positive={false}
      />
      <MetricCard
        label="Calmar Ratio"
        value={fixed(metrics.calmar)}
        sub="CAGR / Max Drawdown"
        icon={Shield}
        positive={metrics.calmar > 0.3}
      />
      <MetricCard
        label="Total Return"
        value={`${metrics.totalReturn.toFixed(1)}%`}
        sub={`${metrics.startDate.slice(0, 4)}–${metrics.endDate.slice(0, 4)}`}
        icon={Zap}
        positive={metrics.totalReturn > 0}
      />
    </div>
  )
}
