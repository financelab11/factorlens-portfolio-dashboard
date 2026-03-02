"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, TrendingUp, Shield, BarChart3, Layers, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const sections = [
  {
    id: "passive",
    icon: BookOpen,
    color: "text-indigo-600",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
    title: "What is Passive Investing?",
    content: [
      "Passive investing means buying and holding a basket of securities that mirrors an index — without trying to pick individual winners or time the market.",
      "Instead of paying a fund manager to make active decisions, you simply own the market. Research consistently shows that over long periods, most active funds fail to beat their benchmarks after fees.",
      "Index funds — especially factor-based ones — give you low-cost, diversified exposure to proven return drivers.",
    ],
    facts: [
      "80%+ of active large-cap funds underperform their benchmarks over 10 years",
      "Expense ratios: Active funds 1.5–2.5% vs Index funds 0.1–0.5%",
      "No manager risk, no style drift, no surprises",
    ],
  },
  {
    id: "factor",
    icon: BarChart3,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    title: "What is Factor Investing?",
    content: [
      "Factor investing selects stocks based on specific characteristics — called 'factors' — that academic research has linked to higher long-term returns.",
      "These factors are systematic and rules-based. They remove human emotion from the equation and have been validated across multiple markets and decades.",
      "NSE India offers 20+ factor indices that are tracked by low-cost index funds, making them accessible to every investor.",
    ],
    factors: [
      { name: "Momentum", desc: "Stocks that have recently risen tend to keep rising", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
      { name: "Quality", desc: "High ROE, low debt, stable earnings companies", color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
      { name: "Low Volatility", desc: "Less volatile stocks with better risk-adjusted returns", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
      { name: "Value", desc: "Undervalued companies with strong fundamentals", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
      { name: "Alpha", desc: "Stocks with high excess returns vs market beta", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
      { name: "Multi-Factor", desc: "Blend of multiple factors for diversified exposure", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
    ],
  },
  {
    id: "diversification",
    icon: Layers,
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-950/30",
    title: "Why Diversification Matters",
    content: [
      "No single factor wins every year. Momentum is powerful in bull markets but can crash hard during reversals. Low Volatility protects in downturns but lags in rallies.",
      "By combining multiple factors and market-cap segments, you reduce concentration risk, smooth out return variability, and lower your worst-case drawdown.",
      "Our 20-year backtest data shows that blended portfolios consistently achieve better risk-adjusted returns than single-factor bets.",
    ],
    comparison: [
      { label: "Single Factor (avg)", cagr: "18.5%", dd: "−55%", sharpe: "0.89" },
      { label: "2-Factor Blend", cagr: "19.2%", dd: "−48%", sharpe: "1.05" },
      { label: "4-Factor Blend", cagr: "19.8%", dd: "−40%", sharpe: "1.24" },
      { label: "Nifty 50 (benchmark)", cagr: "12.7%", dd: "−60%", sharpe: "0.61" },
    ],
  },
  {
    id: "active-vs-passive",
    icon: TrendingUp,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    title: "Active vs Passive: What the Data Says",
    content: [
      "The debate between active and passive investing has been settled by data. Over a 20-year horizon, passive factor investing consistently outperforms active stock picking on a risk-adjusted basis.",
      "Active managers charge higher fees, change strategies, face key-person risk, and often underperform benchmarks. Factor indices, by contrast, are transparent, low-cost, and mechanically disciplined.",
    ],
    comparison: [
      { label: "Active Large-Cap Funds", pro: "Manager expertise", con: "High fees (1.8–2.5%), underperformance" },
      { label: "Nifty 50 Index Fund", pro: "Low cost, market return", con: "No factor premium" },
      { label: "Factor Index Funds", pro: "Low cost + premium returns", con: "More complex to understand" },
    ],
  },
  {
    id: "backtest",
    icon: Shield,
    color: "text-rose-600",
    bg: "bg-rose-50 dark:bg-rose-950/30",
    title: "20-Year Backtest Results",
    content: [
      "factorlens is powered by actual NSE index NAV data from April 2005 to February 2026 — 5,189 daily data points per fund.",
      "Every CAGR, Sharpe ratio, drawdown, and rolling return you see is computed from this real data, not simulations or hypothetical assumptions.",
      "The top-ranked multi-factor funds delivered 18–22% CAGR over this period, compared to 12.7% for Nifty 50.",
    ],
    highlights: [
      { metric: "Best CAGR (Fund)", value: "~22%", fund: "NIFTY500 MULTIFACTOR MQVLv 50" },
      { metric: "Nifty 50 CAGR", value: "12.7%", fund: "Benchmark" },
      { metric: "Data Period", value: "Apr 2005 – Feb 2026", fund: "5,189 trading days" },
      { metric: "Funds Tracked", value: "28 NSE Indices", fund: "Broad, Factor, Strategy" },
    ],
  },
]

export default function AcademyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-b from-violet-950 to-background pt-16 pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-violet-100/20 text-violet-200 border-violet-500/30">
            Education Hub
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            factorlens Academy
          </h1>
          <p className="text-violet-200 text-lg max-w-2xl mx-auto leading-relaxed">
            Everything you need to understand passive investing, factor strategies, and portfolio construction. Simple language, real data.
          </p>
        </div>
      </div>

      {/* Table of contents */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap flex-shrink-0"
              >
                {s.title.split("?")[0].replace("What is ", "").replace("Why ", "").replace("20-Year ", "")}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2.5 rounded-xl ${section.bg}`}>
                <section.icon className={`h-5 w-5 ${section.color}`} />
              </div>
              <h2 className="text-2xl font-bold">{section.title}</h2>
            </div>

            <div className="space-y-4 text-muted-foreground leading-relaxed mb-6">
              {section.content.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            {/* Passive facts */}
            {'facts' in section && (
              <div className="space-y-2">
                {(section as { facts: string[] }).facts.map((fact, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <CheckCircle2 className="h-4 w-4 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{fact}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Factor types */}
            {'factors' in section && (
              <div className="grid sm:grid-cols-2 gap-3">
                {(section as { factors: { name: string; desc: string; color: string }[] }).factors.map((f) => (
                  <Card key={f.name} className="border-border/60">
                    <CardContent className="p-4 flex items-start gap-3">
                      <Badge className={`text-xs flex-shrink-0 ${f.color}`}>{f.name}</Badge>
                      <p className="text-sm text-muted-foreground">{f.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Diversification comparison table */}
            {'comparison' in section && section.id === 'diversification' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Strategy</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">CAGR</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Max DD</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sharpe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(section as { comparison: { label: string; cagr: string; dd: string; sharpe: string }[] }).comparison.map((row, i) => (
                      <tr key={row.label} className={i % 2 === 0 ? "" : "bg-muted/30"}>
                        <td className="px-4 py-3 font-medium">{row.label}</td>
                        <td className="px-4 py-3 text-teal-600 font-semibold">{row.cagr}</td>
                        <td className="px-4 py-3 text-red-500">{row.dd}</td>
                        <td className="px-4 py-3">{row.sharpe}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-2">* Illustrative averages based on 20Y NSE backtest data</p>
              </div>
            )}

            {/* Active vs passive comparison */}
            {'comparison' in section && section.id === 'active-vs-passive' && (
              <div className="space-y-3">
                {(section as { comparison: { label: string; pro: string; con: string }[] }).comparison.map((item) => (
                  <Card key={item.label} className="border-border/60">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-sm mb-2">{item.label}</h4>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-teal-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-muted-foreground">{item.pro}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-muted-foreground">{item.con}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Backtest highlights */}
            {'highlights' in section && (
              <div className="grid sm:grid-cols-2 gap-4">
                {(section as { highlights: { metric: string; value: string; fund: string }[] }).highlights.map((h) => (
                  <Card key={h.metric} className="border-border/60">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{h.metric}</p>
                      <p className="text-xl font-bold text-primary">{h.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{h.fund}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-950 to-indigo-900 p-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Build Your Portfolio?</h2>
          <p className="text-indigo-200 mb-6 max-w-md mx-auto">
              Apply what you&apos;ve learned. Select funds, set weights, and see exactly how your portfolio would have performed over 20 years.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white border-0 px-10 h-12">
              Build My Portfolio <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
