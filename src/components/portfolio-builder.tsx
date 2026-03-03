"use client"

import { useState, useCallback } from "react"
import { X, Plus, ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

export interface Fund {
  id: number
  code: string
  name: string
  category: string
  cagr: number
  sharpe_ratio: number
  max_drawdown: number
  final_rank: number
}

interface FundAllocation {
  fund: Fund
  weight: number
}

interface Props {
  funds: Fund[]
  allocations: FundAllocation[]
  onChange: (allocations: FundAllocation[]) => void
  onGenerate: () => void
  loading: boolean
}

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

export function PortfolioBuilder({ funds, allocations, onChange, onGenerate, loading }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [catFilter, setCatFilter] = useState("All")

  const categories = ["All", ...Array.from(new Set(funds.map((f) => f.category)))]
  const totalWeight = allocations.reduce((sum, a) => sum + a.weight, 0)
  const weightError = Math.abs(totalWeight - 100) > 0.5

  const selectedIds = new Set(allocations.map((a) => a.fund.id))

  const filteredFunds = funds.filter((f) => {
    const matchCat = catFilter === "All" || f.category === catFilter
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch && !selectedIds.has(f.id)
  })

  const addFund = useCallback((fund: Fund) => {
    if (allocations.length >= 10) return
    const remaining = 100 - totalWeight
    const newWeight = Math.max(5, Math.min(remaining, Math.round(remaining / (allocations.length + 1))))
    onChange([...allocations, { fund, weight: newWeight }])
    setOpen(false)
    setSearch("")
  }, [allocations, onChange, totalWeight])

  const removeFund = useCallback((id: number) => {
    onChange(allocations.filter((a) => a.fund.id !== id))
  }, [allocations, onChange])

  const updateWeight = useCallback((id: number, weight: number) => {
    onChange(allocations.map((a) => a.fund.id === id ? { ...a, weight } : a))
  }, [allocations, onChange])

  const autoNormalize = useCallback(() => {
    if (allocations.length === 0) return
    const equal = Math.floor(100 / allocations.length)
    const remainder = 100 - equal * allocations.length
    onChange(allocations.map((a, i) => ({ ...a, weight: equal + (i === 0 ? remainder : 0) })))
  }, [allocations, onChange])

  return (
    <div className="space-y-6">
      {/* Fund selector */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Selected Funds ({allocations.length}/10)
          </h3>
          {allocations.length > 0 && (
            <Button variant="ghost" size="sm" onClick={autoNormalize} className="text-xs h-7">
              Auto-Equalise
            </Button>
          )}
        </div>

        {/* Selected funds list */}
        {allocations.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm">No funds selected yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Click &ldquo;Add Fund&rdquo; to get started.</p>
          </div>
        ) : (
            <div className="space-y-4">
              {allocations.map((a) => (
                <div key={a.fund.id} className="border-2 rounded-2xl p-4 bg-card hover:border-primary/40 transition-all shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-bold text-[15px] leading-tight text-foreground truncate">{a.fund.name}</p>
                      <Badge variant="secondary" className={cn("text-[10px] mt-1.5 px-2 py-0 h-4.5 uppercase font-bold tracking-wider", CATEGORY_COLORS[a.fund.category])}>
                        {a.fund.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="bg-primary/10 px-2 py-1 rounded-lg">
                        <span className="font-black text-lg text-primary tabular-nums">{a.weight}%</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeFund(a.fund.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="px-1.5 pb-2">
                    <Slider
                      value={[a.weight]}
                      onValueChange={([v]) => updateWeight(a.fund.id, v)}
                      min={1}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              ))}
            </div>

        )}

        {/* Weight indicator */}
        {allocations.length > 0 && (
          <div className={cn(
            "mt-3 flex items-center justify-between text-sm px-1",
            weightError ? "text-destructive" : "text-muted-foreground"
          )}>
            <span>Total weight: <strong>{totalWeight}%</strong></span>
            {weightError && <span className="text-xs">Must equal 100%</span>}
            {!weightError && <span className="text-xs text-teal-600 font-medium">Ready to generate</span>}
          </div>
        )}

        {/* Progress bar */}
        {allocations.length > 0 && (
          <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                totalWeight > 100 ? "bg-destructive" : totalWeight === 100 ? "bg-teal-500" : "bg-primary"
              )}
              style={{ width: `${Math.min(totalWeight, 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Add Fund button + dropdown */}
      <div className="relative">
        <Button
          variant="outline"
          className="w-full gap-2 border-dashed"
          onClick={() => setOpen(!open)}
          disabled={allocations.length >= 10}
        >
          <Plus className="h-4 w-4" />
          Add Fund
          <ChevronDown className={cn("h-3 w-3 ml-auto transition-transform", open && "rotate-180")} />
        </Button>

        {open && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-popover border rounded-xl shadow-xl overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search funds..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Category filter */}
            <div className="p-2 border-b flex gap-1 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs whitespace-nowrap font-medium transition-colors flex-shrink-0",
                    catFilter === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Fund list */}
            <div className="max-h-64 overflow-y-auto">
              {filteredFunds.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">No funds found</p>
              ) : (
                filteredFunds.map((fund) => (
                  <button
                    key={fund.id}
                    onClick={() => addFund(fund)}
                    className="w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">{fund.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={cn("text-xs", CATEGORY_COLORS[fund.category])}>
                          {fund.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          CAGR: {(fund.cagr * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Generate button */}
      <Button
        className="w-full h-12 text-base bg-gradient-to-r from-indigo-600 to-teal-500 hover:from-indigo-700 hover:to-teal-600 text-white border-0 font-semibold"
        onClick={onGenerate}
        disabled={loading || allocations.length === 0 || weightError}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Computing Portfolio...
          </span>
        ) : (
          "Generate Portfolio"
        )}
      </Button>
    </div>
  )
}
