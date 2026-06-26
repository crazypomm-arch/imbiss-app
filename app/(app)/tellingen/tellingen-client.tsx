'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Snowflake, Thermometer, Archive, ShoppingBag, MoreHorizontal, CheckCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Location = { id: string; name: string; type: string; site: string }
type Product  = { id: string; name: string; short_name: string | null; base_unit: string; category_id: string | null }
type StockLevel = { product_id: string; location_id: string; quantity: number }

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  diepvries: { icon: Snowflake,      color: 'text-blue-400',  bg: 'bg-blue-500/10' },
  koeling:   { icon: Thermometer,    color: 'text-cyan-400',  bg: 'bg-cyan-500/10' },
  droog:     { icon: Archive,        color: 'text-amber-400', bg: 'bg-amber-500/10' },
  winkel:    { icon: ShoppingBag,    color: 'text-green-400', bg: 'bg-green-500/10' },
  overig:    { icon: MoreHorizontal, color: 'text-zinc-400',  bg: 'bg-zinc-500/10' },
}

type Step = 'kies-locatie' | 'tellen'

export function TellingenClient({ locations, products, stockLevels }: {
  locations: Location[]
  products: Product[]
  stockLevels: StockLevel[]
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('kies-locatie')
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [counts, setCounts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Huidige voorraad per product voor geselecteerde locatie
  const currentStock = useMemo(() => {
    if (!selectedLocation) return {}
    return stockLevels
      .filter(s => s.location_id === selectedLocation.id)
      .reduce<Record<string, number>>((acc, s) => { acc[s.product_id] = s.quantity; return acc }, {})
  }, [selectedLocation, stockLevels])

  function startTelling(loc: Location) {
    setSelectedLocation(loc)
    // Pre-fill met huidige voorraad
    const pre: Record<string, string> = {}
    stockLevels.filter(s => s.location_id === loc.id).forEach(s => {
      pre[s.product_id] = s.quantity.toString()
    })
    setCounts(pre)
    setStep('tellen')
  }

  function setCount(productId: string, value: string) {
    setCounts(prev => ({ ...prev, [productId]: value }))
  }

  // Wijzigingen t.o.v. huidige voorraad
  const changes = useMemo(() => {
    return products.filter(p => {
      const current = currentStock[p.id] ?? 0
      const counted = parseFloat(counts[p.id] ?? '')
      return !isNaN(counted) && counted !== current
    })
  }, [products, counts, currentStock])

  async function saveTelling() {
    if (!selectedLocation || changes.length === 0) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Niet ingelogd'); setSaving(false); return }

    const movements = changes.map(p => {
      const current = currentStock[p.id] ?? 0
      const counted = parseFloat(counts[p.id])
      return {
        product_id: p.id,
        location_id: selectedLocation.id,
        created_by: user.id,
        type: 'telling',
        quantity: counted - current,
        quantity_before: current,
        quantity_after: counted,
      }
    })

    const { error } = await supabase.from('stock_movements').insert(movements)
    if (error) { toast.error('Fout bij opslaan: ' + error.message); setSaving(false); return }

    toast.success(`${changes.length} product(en) bijgewerkt`)
    setSaving(false)
    setStep('kies-locatie')
    setSelectedLocation(null)
    setCounts({})
    router.refresh()
  }

  // Sites groepering
  const sites = [...new Set(locations.map(l => l.site))]

  if (step === 'kies-locatie') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Telling starten</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Kies een locatie om te tellen</p>
        </div>

        <div className="space-y-5">
          {sites.map(site => (
            <div key={site}>
              <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">{site}</h2>
              <div className="space-y-2">
                {locations.filter(l => l.site === site).map(loc => {
                  const cfg = typeConfig[loc.type] ?? typeConfig.overig
                  const Icon = cfg.icon
                  const stockCount = stockLevels.filter(s => s.location_id === loc.id).length
                  return (
                    <button
                      key={loc.id}
                      onClick={() => startTelling(loc)}
                      className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl px-4 py-3.5 flex items-center gap-4 transition-colors group"
                    >
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${cfg.bg} shrink-0`}>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-medium">{loc.name}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">
                          {stockCount > 0 ? `${stockCount} producten in voorraad` : 'Nog niet geteld'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Step: tellen
  const cfg = typeConfig[selectedLocation!.type] ?? typeConfig.overig
  const Icon = cfg.icon

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setStep('kies-locatie')} className="text-zinc-500 hover:text-white transition-colors text-sm">
          ← Terug
        </button>
        <div className="flex items-center gap-2 ml-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${cfg.bg}`}>
            <Icon className={`w-4 h-4 ${cfg.color}`} />
          </div>
          <div>
            <h1 className="text-white font-bold">{selectedLocation!.name}</h1>
            <p className="text-zinc-500 text-xs">{selectedLocation!.site}</p>
          </div>
        </div>
        {changes.length > 0 && (
          <span className="ml-auto text-orange-400 text-xs font-medium">{changes.length} wijzigingen</span>
        )}
      </div>

      {/* Productenlijst */}
      <div className="space-y-1.5 mb-20">
        {products.map(p => {
          const current = currentStock[p.id] ?? 0
          const countVal = counts[p.id] ?? ''
          const counted = parseFloat(countVal)
          const hasChange = !isNaN(counted) && counted !== current
          const isDiff = hasChange && counted !== current

          return (
            <div key={p.id} className={cn(
              'bg-zinc-900 border rounded-xl px-4 py-3 flex items-center gap-3 transition-colors',
              isDiff ? 'border-orange-500/40' : 'border-zinc-800'
            )}>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{p.name}</p>
                <p className="text-zinc-500 text-xs mt-0.5">
                  Huidig: <span className="text-zinc-300">{current} {p.base_unit}</span>
                  {isDiff && <span className="ml-2 text-orange-400">→ {counted} {p.base_unit}</span>}
                </p>
              </div>
              <input
                type="number"
                min="0"
                step="0.001"
                value={countVal}
                onChange={e => setCount(p.id, e.target.value)}
                placeholder={current.toString()}
                className={cn(
                  'w-24 text-right px-3 py-1.5 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-orange-500 bg-zinc-800 text-white',
                  isDiff ? 'border-orange-500/60' : 'border-zinc-700'
                )}
              />
              <span className="text-zinc-500 text-xs w-10 shrink-0">{p.base_unit}</span>
            </div>
          )
        })}
      </div>

      {/* Fixed footer */}
      <div className="fixed bottom-0 left-64 right-0 bg-zinc-950 border-t border-zinc-800 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <p className="text-zinc-400 text-sm">
            {changes.length === 0
              ? 'Geen wijzigingen'
              : `${changes.length} product${changes.length !== 1 ? 'en' : ''} gewijzigd`}
          </p>
          <Button
            onClick={saveTelling}
            disabled={saving || changes.length === 0}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {saving ? 'Opslaan...' : 'Telling opslaan'}
          </Button>
        </div>
      </div>
    </div>
  )
}
