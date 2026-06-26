'use client'

import { useState } from 'react'
import { Snowflake, Thermometer, Archive, ShoppingBag, MoreHorizontal, Search, AlertTriangle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StockRow = {
  product_id: string
  product_name: string
  base_unit: string
  category_name: string | null
  location_id: string
  location_name: string
  location_type: string
  site: string
  quantity: number
  min_stock_opslag: number
  min_stock_winkel: number
  updated_at: string
}
type Location = { id: string; name: string; type: string; site: string }
type Category = { id: string; name: string }

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  diepvries: { icon: Snowflake,     color: 'text-blue-400',   bg: 'bg-blue-500/10',   label: 'Diepvries' },
  koeling:   { icon: Thermometer,   color: 'text-cyan-400',   bg: 'bg-cyan-500/10',   label: 'Koeling' },
  droog:     { icon: Archive,       color: 'text-amber-400',  bg: 'bg-amber-500/10',  label: 'Droog' },
  winkel:    { icon: ShoppingBag,   color: 'text-green-400',  bg: 'bg-green-500/10',  label: 'Winkel' },
  overig:    { icon: MoreHorizontal,color: 'text-zinc-400',   bg: 'bg-zinc-500/10',   label: 'Overig' },
}

export function StockClient({ stock, locations, categories }: {
  stock: StockRow[]
  locations: Location[]
  categories: Category[]
}) {
  const [search, setSearch] = useState('')
  const [filterLocation, setFilterLocation] = useState('alle')
  const [filterCategory, setFilterCategory] = useState('alle')
  const [showLowOnly, setShowLowOnly] = useState(false)

  const filtered = stock.filter(row => {
    const matchSearch = row.product_name.toLowerCase().includes(search.toLowerCase())
    const matchLoc = filterLocation === 'alle' || row.location_id === filterLocation
    const matchCat = filterCategory === 'alle' || row.category_name === filterCategory
    const minStock = row.location_type === 'winkel' ? row.min_stock_winkel : row.min_stock_opslag
    const isLow = row.quantity <= minStock && minStock > 0
    const matchLow = !showLowOnly || isLow
    return matchSearch && matchLoc && matchCat && matchLow
  })

  // Group by location
  const byLocation = filtered.reduce<Record<string, StockRow[]>>((acc, row) => {
    const key = row.location_id
    if (!acc[key]) acc[key] = []
    acc[key].push(row)
    return acc
  }, {})

  // Group locations by site
  const sites = [...new Set(locations.map(l => l.site))]

  const lowStockCount = stock.filter(r => {
    const min = r.location_type === 'winkel' ? r.min_stock_winkel : r.min_stock_opslag
    return r.quantity <= min && min > 0
  }).length

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Voorraad</h1>
          <p className="text-zinc-400 text-sm mt-0.5">
            {stock.length} voorraadregels
            {lowStockCount > 0 && <span className="ml-2 text-orange-400">· {lowStockCount} onder minimum</span>}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Zoek product..."
            className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500" />
        </div>
        <select
          value={filterLocation}
          onChange={e => setFilterLocation(e.target.value)}
          className="px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="alle">Alle locaties</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.site} – {l.name}</option>)}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="alle">Alle categorieën</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <button
          onClick={() => setShowLowOnly(!showLowOnly)}
          className={cn(
            'px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors border',
            showLowOnly
              ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Lage voorraad
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-zinc-500">
          {stock.length === 0
            ? 'Nog geen voorraad geregistreerd. Gebruik Tellingen om voorraad in te voeren.'
            : 'Geen resultaten gevonden.'}
        </div>
      )}

      {/* Per vestiging → per locatie */}
      <div className="space-y-6">
        {sites.map(site => {
          const siteLocs = locations.filter(l => l.site === site)
          const siteHasRows = siteLocs.some(l => byLocation[l.id]?.length)
          if (!siteHasRows) return null

          return (
            <div key={site}>
              <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">{site}</h2>
              <div className="space-y-4">
                {siteLocs.map(loc => {
                  const rows = byLocation[loc.id]
                  if (!rows?.length) return null
                  const cfg = typeConfig[loc.type] ?? typeConfig.overig
                  const Icon = cfg.icon

                  return (
                    <div key={loc.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                      {/* Locatie header */}
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${cfg.bg} shrink-0`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <p className="text-white font-medium text-sm">{loc.name}</p>
                        <span className="text-zinc-500 text-xs ml-auto">{rows.length} producten</span>
                      </div>

                      {/* Producten */}
                      <div className="divide-y divide-zinc-800/60">
                        {rows.map(row => {
                          const minStock = row.location_type === 'winkel' ? row.min_stock_winkel : row.min_stock_opslag
                          const isLow = row.quantity <= minStock && minStock > 0
                          const isZero = row.quantity === 0

                          return (
                            <div key={`${row.product_id}-${row.location_id}`}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/30 transition-colors">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-white text-sm">{row.product_name}</p>
                                  {row.category_name && (
                                    <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700 py-0 hidden sm:inline-flex">
                                      {row.category_name}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isLow && (
                                  <AlertTriangle className="w-3.5 h-3.5 text-orange-400" title={`Onder minimum (${minStock})`} />
                                )}
                                <span className={cn(
                                  'text-sm font-medium tabular-nums',
                                  isZero ? 'text-red-400' : isLow ? 'text-orange-400' : 'text-white'
                                )}>
                                  {row.quantity}
                                </span>
                                <span className="text-zinc-500 text-xs">{row.base_unit}</span>
                                {minStock > 0 && (
                                  <span className="text-zinc-600 text-xs">/ {minStock} min</span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
