"use client"

import Link from "next/link"
import { ArrowRight, BarChart3, Shield, TrendingUp, Database, CheckCircle2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

const stats = [
  { label: "Years of Data", value: "20+" },
  { label: "NSE Funds Tracked", value: "28" },
  { label: "Data Points", value: "140K+" },
  { label: "Metrics Computed", value: "8" },
]

const features = [
  {
    icon: BarChart3,
    title: "Portfolio Builder",
    desc: "Select up to 10 funds, assign weights, and see your portfolio's exact historical performance — computed in real time.",
    color: "text-indigo-600",
    bg: "bg-indigo-50 dark:bg-indigo-950/30",
  },
  {
    icon: TrendingUp,
    title: "Factor Investing",
    desc: "Access momentum, quality, low-volatility, alpha and multi-factor strategies backed by academic research and 20 years of NSE data.",
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-950/30",
  },
  {
    icon: Shield,
    title: "Risk Analytics",
    desc: "Understand your portfolio's maximum drawdown, volatility, Sharpe ratio, and rolling 3-year returns before you invest.",
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
  },
  {
    icon: Database,
    title: "Real Data",
    desc: "Every chart and metric is computed from actual NSE index NAV data — not simulations, not estimates.",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
]

const steps = [
  { step: "01", title: "Select Funds", desc: "Pick 1–10 funds from 28 NSE factor and broad-market indices." },
  { step: "02", title: "Set Weights", desc: "Drag sliders to allocate percentages. They auto-sum to 100%." },
  { step: "03", title: "Generate Portfolio", desc: "Hit Generate. Get CAGR, Sharpe, Drawdown and more instantly." },
  { step: "04", title: "Analyse & Decide", desc: "Study the interactive charts. Compare against Nifty 50 benchmark." },
]

const whyFactors = [
  { title: "Beat the Market Consistently", desc: "Factor indices like Momentum and Quality have historically outperformed broad-market Nifty 50 by 4–8% annually." },
  { title: "Passive. Low Cost.", desc: "Factor funds are rule-based index funds — no active manager, no high fees, no stock picking." },
  { title: "Diversification Works", desc: "Combining factors reduces drawdown and smooths returns. Our data shows blended portfolios outperform single-factor bets." },
  { title: "Data-Backed Decisions", desc: "Every allocation decision is backed by 20 years of real NSE price data, not marketing material." },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-indigo-900 to-background">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6 bg-indigo-100/20 text-indigo-200 border-indigo-500/30 text-xs px-3 py-1">
              NSE Factor Investing • 2005–2026
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
              Build Smarter Portfolios.<br />
              <span className="bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">
                Backed by Data.
              </span>{" "}
              Not Guesswork.
            </h1>
            <p className="text-lg sm:text-xl text-indigo-200/80 max-w-2xl mx-auto mb-10 leading-relaxed">
              Create your own diversified fund portfolio using 20+ years of real NSE backtest data.
              See exactly how any combination of factor funds would have performed — risk, return, everything.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white border-0 text-base px-8 h-12 shadow-lg shadow-indigo-900/50">
                  Build My Portfolio <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/rankings">
                <Button size="lg" variant="outline" className="border-indigo-400/40 text-indigo-200 hover:bg-indigo-800/50 hover:text-white text-base px-8 h-12">
                  Explore Fund Rankings <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto"
          >
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-white">{s.value}</div>
                <div className="text-sm text-indigo-300 mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">What is factorlens?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              An institutional-grade portfolio construction platform designed for everyday investors.
              No jargon. No complexity. Just data.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-border/60 hover:border-primary/30 hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className={`inline-flex p-3 rounded-xl ${f.bg} mb-4`}>
                      <f.icon className={`h-6 w-6 ${f.color}`} />
                    </div>
                    <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From fund selection to portfolio insights in under 30 seconds.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[calc(100%-12px)] w-8 h-0.5 bg-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Factor Investing */}
      <section className="py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Why Factor Investing?</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                Rules-Based. Research-Backed.<br />
                <span className="text-primary">Proven Over 20 Years.</span>
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Factor investing is a strategy of selecting stocks based on attributes associated with higher returns — momentum, quality, low volatility, value. These factors are implemented as NSE indices and accessible as low-cost index funds.
              </p>
              <ul className="space-y-3">
                {["Systematic, not emotional", "Low-cost index funds", "Diversified across factors", "Backed by decades of academic research"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-teal-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/academy" className="inline-block mt-8">
                <Button variant="outline" className="gap-2">
                  Learn More in Academy <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {whyFactors.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full border-border/60 hover:border-primary/30 transition-colors">
                    <CardContent className="p-5">
                      <h4 className="font-semibold text-sm mb-2 text-primary">{item.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Diversification */}
      <section className="py-24 bg-gradient-to-r from-indigo-950 to-indigo-900">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Why Diversification?
          </h2>
          <p className="text-indigo-200 text-lg mb-8 leading-relaxed max-w-2xl mx-auto">
            No single factor wins every year. Momentum crushes it in bull markets, but Low Volatility protects in crashes. Blending factors reduces your worst-case drawdown while preserving long-term return potential.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {[
              { val: "−38%", label: "Avg drawdown, single factor" },
              { val: "−24%", label: "Avg drawdown, blended portfolio" },
              { val: "+3.2%", label: "Avg annual outperformance vs Nifty 50" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold text-teal-400 mb-2">{s.val}</div>
                <div className="text-sm text-indigo-200">{s.label}</div>
              </div>
            ))}
          </div>
          <Link href="/dashboard">
            <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-teal-500 hover:from-indigo-600 hover:to-teal-600 text-white border-0 px-10 h-12 text-base">
              Build My Portfolio <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-teal-500">
              <BarChart3 className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">
              <span className="text-primary">factor</span>
              <span className="text-foreground/60">lens</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Data sourced from NSE India. For educational purposes only. Not financial advice.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
            <Link href="/rankings" className="hover:text-foreground">Rankings</Link>
            <Link href="/academy" className="hover:text-foreground">Academy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
