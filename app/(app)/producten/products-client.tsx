'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plus, Search, Package, Snowflake, Clock, MoreHorizontal,
  Pencil, ShoppingBag, Hammer, Layers, Box, Barcode,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type Product = {
  id: string; name: string; short_name: string | null; barcode: string | null
  base_unit: string; active: boolean; product_type: string; storage_type: string | null
  tht_tracking: boolean; can_freeze: boolean; fifo_required: boolean; auto_order: boolean
  min_stock_opslag: number; min_stock_winkel: number; shelf_life_days: number | null; thaw_hours: number | null
  notes: string | null
  categories: { id: string; name: string } | null
  locations: { id: string; name: string; type: string } | null
}
type Category = { id: string; name: string }
type Location  = { id: string; name: string; type: string; site: string }

const productTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  handelsproduct:  { label: 'Handelsproduct',  icon: ShoppingBag, color: 'text-blue-400' },
  huisgemaakt:     { label: 'Huisgemaakt',      icon: Hammer,      color: 'text-orange-400' },
  samengesteld:    { label: 'Samengesteld',     icon: Layers,      color: 'text-purple-400' },
  verbruiksproduct:{ label: 'Verbruiksproduct', icon: Box,         color: 'text-zinc-400' },
}

const emptyForm = {
  name: '', short_name: '', barcode: '', base_unit: 'stuk',
  product_type: 'handelsproduct', storage_type: '',
  category_id: '', default_location_id: '',
  tht_tracking: false, can_freeze: false, fifo_required: false, auto_order: false,
  min_stock_opslag: 0, min_stock_winkel: 0,
  max_stock_opslag: '', max_stock_winkel: '',
  shelf_life_days: '', thaw_hours: '', notes: '',
}

export function ProductsClient({ products: initial, categories, locations }: {
  products: Product[]; categories: Category[]; locations: Location[]
}) {
  const router = useRouter()
  const [products, setProducts] = useState(initial)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('alle')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'basis'|'voorraad'|'opties'>('basis')

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
      (p.short_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchType = filterType === 'alle' || p.product_type === filterType
    return matchSearch && matchType
  })

  function openAdd() {
    setEditing(null); setForm(emptyForm); setTab('basis'); setOpen(true)
  }
  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name, short_name: p.short_name ?? '', barcode: p.barcode ?? '',
      base_unit: p.base_unit, product_type: p.product_type, storage_type: p.storage_type ?? '',
      category_id: p.categories?.id ?? '', default_location_id: p.locations?.id ?? '',
      tht_tracking: p.tht_tracking, can_freeze: p.can_freeze,
      fifo_required: p.fifo_required, auto_order: p.auto_order,
      min_stock_opslag: p.min_stock_opslag, min_stock_winkel: p.min_stock_winkel,
      max_stock_opslag: '', max_stock_winkel: '',
      shelf_life_days: p.shelf_life_days?.toString() ?? '',
      thaw_hours: p.thaw_hours?.toString() ?? '',
      notes: p.notes ?? '',
    })
    setTab('basis'); setOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      name: form.name, short_name: form.short_name || null,
      barcode: form.barcode || null, base_unit: form.base_unit,
      product_type: form.product_type, storage_type: form.storage_type || null,
      category_id: form.category_id || null, default_location_id: form.default_location_id || null,
      tht_tracking: form.tht_tracking, can_freeze: form.can_freeze,
      fifo_required: form.fifo_required, auto_order: form.auto_order,
      min_stock_opslag: Number(form.min_stock_opslag) || 0,
      min_stock_winkel: Number(form.min_stock_winkel) || 0,
      max_stock_opslag: form.max_stock_opslag ? Number(form.max_stock_opslag) : null,
      max_stock_winkel: form.max_stock_winkel ? Number(form.max_stock_winkel) : null,
      shelf_life_days: form.shelf_life_days ? Number(form.shelf_life_days) : null,
      thaw_hours: form.thaw_hours ? Number(form.thaw_hours) : null,
      notes: form.notes || null,
    }
    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id)
      if (error) { toast.error('Fout bij opslaan'); setSaving(false); return }
      toast.success('Product bijgewerkt')
    } else {
      const { error } = await supabase.from('products').insert(payload)
      if (error) { toast.error('Fout bij aanmaken: ' + error.message); setSaving(false); return }
      toast.success('Product aangemaakt')
    }
    setSaving(false); setOpen(false); router.refresh()
  }

  async function toggleActive(p: Product) {
    const supabase = createClient()
    const { error } = await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    if (error) { toast.error('Fout'); return }
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: !p.active } : x))
    toast.success(p.active ? 'Gedeactiveerd' : 'Geactiveerd')
  }

  const f = (field: string, value: unknown) => setForm(prev => ({ ...prev, [field]: value }))
  const inputCls = 'mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Producten</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{products.filter(p => p.active).length} actieve producten</p>
        </div>
        <Button onClick={openAdd} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="w-4 h-4" /> Product toevoegen
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Zoek op naam of barcode..."
            className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500" />
        </div>
        <div className="flex gap-1">
          {['alle', 'handelsproduct', 'huisgemaakt', 'samengesteld', 'verbruiksproduct'].map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                filterType === t ? 'bg-orange-500 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800')}>
              {t === 'alle' ? 'Alle' : productTypeConfig[t]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lijst */}
      <div className="space-y-1.5">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            {search ? 'Geen producten gevonden.' : 'Nog geen producten. Voeg een product toe.'}
          </div>
        )}
        {filtered.map(p => {
          const typeCfg = productTypeConfig[p.product_type]
          const TypeIcon = typeCfg?.icon ?? Package
          return (
            <div key={p.id} className={cn(
              'bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-zinc-700 transition-colors',
              !p.active && 'opacity-50'
            )}>
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-800 shrink-0">
                <TypeIcon className={cn('w-4 h-4', typeCfg?.color ?? 'text-zinc-400')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-medium text-sm">{p.name}</p>
                  {p.categories && <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-700 py-0">{p.categories.name}</Badge>}
                  {p.tht_tracking && <Clock className="w-3.5 h-3.5 text-orange-400" title="THT" />}
                  {p.can_freeze && <Snowflake className="w-3.5 h-3.5 text-blue-400" title="Kan invriezen" />}
                  {!p.active && <Badge variant="outline" className="text-xs text-zinc-600 border-zinc-700 py-0">Inactief</Badge>}
                </div>
                <p className="text-zinc-500 text-xs mt-0.5">
                  {p.base_unit}
                  {p.barcode && <span className="ml-2 text-zinc-600">· {p.barcode}</span>}
                  {p.locations && <span> · {p.locations.name}</span>}
                  {p.min_stock_opslag > 0 && <span> · Min {p.min_stock_opslag}</span>}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="text-zinc-500 hover:text-white h-8 w-8 shrink-0 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                  <DropdownMenuItem onClick={() => openEdit(p)} className="gap-2 cursor-pointer hover:bg-zinc-800">
                    <Pencil className="w-4 h-4" /> Bewerken
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleActive(p)} className="gap-2 cursor-pointer hover:bg-zinc-800">
                    {p.active ? 'Deactiveren' : 'Activeren'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}
      </div>

      {/* Dialoog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Product bewerken' : 'Product toevoegen'}</DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b border-zinc-800 mb-4 -mx-1">
            {(['basis','voorraad','opties'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={cn('px-4 py-2 text-sm font-medium capitalize transition-colors',
                  tab === t ? 'text-orange-400 border-b-2 border-orange-500' : 'text-zinc-500 hover:text-zinc-300')}>
                {t === 'basis' ? 'Basisinfo' : t === 'voorraad' ? 'Voorraad' : 'Opties'}
              </button>
            ))}
          </div>

          {/* Tab: Basisinfo */}
          {tab === 'basis' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-zinc-300">Naam *</Label>
                  <Input value={form.name} onChange={e => f('name', e.target.value)}
                    placeholder="bijv. Ketchup Heinz" className={inputCls} />
                </div>
                <div>
                  <Label className="text-zinc-300">Korte naam</Label>
                  <Input value={form.short_name} onChange={e => f('short_name', e.target.value)}
                    placeholder="Ketchup" className={inputCls} />
                </div>
                <div>
                  <Label className="text-zinc-300">Barcode</Label>
                  <Input value={form.barcode} onChange={e => f('barcode', e.target.value)}
                    placeholder="EAN / artikel nr." className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-zinc-300">Type product</Label>
                  <Select value={form.product_type} onValueChange={v => f('product_type', v)}>
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      {Object.entries(productTypeConfig).map(([v, { label }]) => (
                        <SelectItem key={v} value={v} className="hover:bg-zinc-800">{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-zinc-300">Categorie</Label>
                  <Select value={form.category_id} onValueChange={v => f('category_id', v)}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Kies categorie" /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      {categories.map(c => <SelectItem key={c.id} value={c.id} className="hover:bg-zinc-800">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-zinc-300">Basiseenheid *</Label>
                  <Input value={form.base_unit} onChange={e => f('base_unit', e.target.value)}
                    placeholder="stuk / kg / liter" className={inputCls} />
                </div>
                <div>
                  <Label className="text-zinc-300">Opslagtype</Label>
                  <Select value={form.storage_type} onValueChange={v => f('storage_type', v)}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Kies type" /></SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      {[['diepvries','Diepvries'],['gekoeld','Gekoeld'],['droog','Droog'],['inpakmateriaal','Inpakmateriaal']].map(([v,l]) => (
                        <SelectItem key={v} value={v} className="hover:bg-zinc-800">{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-zinc-300">Standaard locatie</Label>
                <Select value={form.default_location_id} onValueChange={v => f('default_location_id', v)}>
                  <SelectTrigger className={inputCls}><SelectValue placeholder="Kies locatie" /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {locations.map(l => <SelectItem key={l.id} value={l.id} className="hover:bg-zinc-800">{l.site} – {l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300">Notities</Label>
                <Textarea value={form.notes} onChange={e => f('notes', e.target.value)}
                  placeholder="Extra info" rows={2}
                  className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 resize-none" />
              </div>
            </div>
          )}

          {/* Tab: Voorraad */}
          {tab === 'voorraad' && (
            <div className="space-y-4">
              <div>
                <p className="text-zinc-400 text-sm mb-3">Opslag (magazijn)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-zinc-300">Min. voorraad</Label>
                    <Input type="number" min="0" value={form.min_stock_opslag} onChange={e => f('min_stock_opslag', e.target.value)} className={inputCls} /></div>
                  <div><Label className="text-zinc-300">Max. voorraad</Label>
                    <Input type="number" min="0" value={form.max_stock_opslag} onChange={e => f('max_stock_opslag', e.target.value)} placeholder="optioneel" className={inputCls} /></div>
                </div>
              </div>
              <Separator className="bg-zinc-800" />
              <div>
                <p className="text-zinc-400 text-sm mb-3">Winkel</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-zinc-300">Min. voorraad</Label>
                    <Input type="number" min="0" value={form.min_stock_winkel} onChange={e => f('min_stock_winkel', e.target.value)} className={inputCls} /></div>
                  <div><Label className="text-zinc-300">Max. voorraad</Label>
                    <Input type="number" min="0" value={form.max_stock_winkel} onChange={e => f('max_stock_winkel', e.target.value)} placeholder="optioneel" className={inputCls} /></div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Opties */}
          {tab === 'opties' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['tht_tracking', 'THT bijhouden'],
                  ['can_freeze', 'Kan worden ingevroren'],
                  ['fifo_required', 'FIFO verplicht'],
                  ['auto_order', 'Automatisch bestellen'],
                ].map(([field, label]) => (
                  <label key={field} className="flex items-center gap-2.5 p-3 bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-700 transition-colors">
                    <input type="checkbox" checked={form[field as keyof typeof form] as boolean}
                      onChange={e => f(field, e.target.checked)}
                      className="w-4 h-4 rounded accent-orange-500" />
                    <span className="text-zinc-300 text-sm">{label}</span>
                  </label>
                ))}
              </div>
              <Separator className="bg-zinc-800" />
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-zinc-300">Houdbaarheidsdagen</Label>
                  <Input type="number" min="1" value={form.shelf_life_days} onChange={e => f('shelf_life_days', e.target.value)}
                    placeholder="bijv. 7" className={inputCls} /></div>
                {form.can_freeze && (
                  <div><Label className="text-zinc-300">Ontdooitijd (uren)</Label>
                    <Input type="number" min="1" value={form.thaw_hours} onChange={e => f('thaw_hours', e.target.value)}
                      placeholder="bijv. 24" className={inputCls} /></div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400 hover:text-white">Annuleren</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="bg-orange-500 hover:bg-orange-600 text-white">
              {saving ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
