'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Search, Package, Snowflake, Clock, MoreHorizontal, Pencil, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

type Product = {
  id: string
  name: string
  short_name: string | null
  base_unit: string
  active: boolean
  tht_tracking: boolean
  can_freeze: boolean
  min_stock_opslag: number
  min_stock_winkel: number
  categories: { id: string; name: string } | null
  locations: { id: string; name: string; type: string } | null
}

type Category = { id: string; name: string }
type Location = { id: string; name: string; type: string; site: string }

const emptyForm = {
  name: '', short_name: '', base_unit: 'stuk',
  category_id: '', default_location_id: '',
  tht_tracking: false, can_freeze: false,
  min_stock_opslag: 0, min_stock_winkel: 0,
  max_stock_opslag: '', max_stock_winkel: '',
  notes: '',
}

export function ProductsClient({
  products: initial, categories, locations,
}: {
  products: Product[]
  categories: Category[]
  locations: Location[]
}) {
  const router = useRouter()
  const [products, setProducts] = useState(initial)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.short_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
  )

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name,
      short_name: p.short_name ?? '',
      base_unit: p.base_unit,
      category_id: p.categories?.id ?? '',
      default_location_id: p.locations?.id ?? '',
      tht_tracking: p.tht_tracking,
      can_freeze: p.can_freeze,
      min_stock_opslag: p.min_stock_opslag,
      min_stock_winkel: p.min_stock_winkel,
      max_stock_opslag: '',
      max_stock_winkel: '',
      notes: '',
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const supabase = createClient()

    const payload = {
      name: form.name,
      short_name: form.short_name || null,
      base_unit: form.base_unit,
      category_id: form.category_id || null,
      default_location_id: form.default_location_id || null,
      tht_tracking: form.tht_tracking,
      can_freeze: form.can_freeze,
      min_stock_opslag: Number(form.min_stock_opslag) || 0,
      min_stock_winkel: Number(form.min_stock_winkel) || 0,
      max_stock_opslag: form.max_stock_opslag ? Number(form.max_stock_opslag) : null,
      max_stock_winkel: form.max_stock_winkel ? Number(form.max_stock_winkel) : null,
    }

    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id)
      if (error) { toast.error('Fout bij opslaan'); setSaving(false); return }
      toast.success('Product bijgewerkt')
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select().single()
      if (error) { toast.error('Fout bij aanmaken'); setSaving(false); return }
      toast.success('Product aangemaakt')
    }

    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  async function toggleActive(p: Product) {
    const supabase = createClient()
    const { error } = await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    if (error) { toast.error('Fout'); return }
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x))
    toast.success(p.active ? 'Product gedeactiveerd' : 'Product geactiveerd')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Producten</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{products.filter(p => p.active).length} actieve producten</p>
        </div>
        <Button onClick={openAdd} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="w-4 h-4" /> Product toevoegen
        </Button>
      </div>

      {/* Zoekbalk */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoek op naam..."
          className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500"
        />
      </div>

      {/* Productenlijst */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            {search ? 'Geen producten gevonden.' : 'Nog geen producten aangemaakt.'}
          </div>
        )}
        {filtered.map(p => (
          <div
            key={p.id}
            className={cn(
              'bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center gap-4 hover:border-zinc-700 transition-colors',
              !p.active && 'opacity-50'
            )}
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-800 shrink-0">
              <Package className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white font-medium text-sm">{p.name}</p>
                {p.categories && (
                  <Badge variant="outline" className="text-xs text-zinc-400 border-zinc-700 py-0">
                    {p.categories.name}
                  </Badge>
                )}
                {p.tht_tracking && <Clock className="w-3.5 h-3.5 text-orange-400" title="THT bijhouden" />}
                {p.can_freeze && <Snowflake className="w-3.5 h-3.5 text-blue-400" title="Kan worden ingevroren" />}
                {!p.active && <Badge variant="outline" className="text-xs text-zinc-600 border-zinc-700 py-0">Inactief</Badge>}
              </div>
              <p className="text-zinc-500 text-xs mt-0.5">
                Eenheid: {p.base_unit}
                {p.locations && ` · ${p.locations.name}`}
                {p.min_stock_opslag > 0 && ` · Min. opslag: ${p.min_stock_opslag}`}
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
        ))}
      </div>

      {/* Product dialoog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Product bewerken' : 'Product toevoegen'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-zinc-300">Naam *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="bijv. Ketchup Heinz" className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" />
              </div>
              <div>
                <Label className="text-zinc-300">Korte naam</Label>
                <Input value={form.short_name} onChange={e => setForm(f => ({ ...f, short_name: e.target.value }))}
                  placeholder="bijv. Ketchup" className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" />
              </div>
              <div>
                <Label className="text-zinc-300">Basiseenheid *</Label>
                <Input value={form.base_unit} onChange={e => setForm(f => ({ ...f, base_unit: e.target.value }))}
                  placeholder="stuk / kg / liter" className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-300">Categorie</Label>
                <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Kies categorie" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id} className="hover:bg-zinc-800">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-300">Standaard locatie</Label>
                <Select value={form.default_location_id} onValueChange={v => setForm(f => ({ ...f, default_location_id: v }))}>
                  <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Kies locatie" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {locations.map(l => (
                      <SelectItem key={l.id} value={l.id} className="hover:bg-zinc-800">{l.site} – {l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-zinc-300 block mb-2">Min. voorraad opslag / winkel</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" min="0" value={form.min_stock_opslag}
                  onChange={e => setForm(f => ({ ...f, min_stock_opslag: Number(e.target.value) }))}
                  placeholder="Opslag min." className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" />
                <Input type="number" min="0" value={form.min_stock_winkel}
                  onChange={e => setForm(f => ({ ...f, min_stock_winkel: Number(e.target.value) }))}
                  placeholder="Winkel min." className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" />
              </div>
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.tht_tracking}
                  onChange={e => setForm(f => ({ ...f, tht_tracking: e.target.checked }))}
                  className="w-4 h-4 rounded accent-orange-500" />
                <span className="text-zinc-300 text-sm">THT bijhouden</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.can_freeze}
                  onChange={e => setForm(f => ({ ...f, can_freeze: e.target.checked }))}
                  className="w-4 h-4 rounded accent-orange-500" />
                <span className="text-zinc-300 text-sm">Kan worden ingevroren</span>
              </label>
            </div>
          </div>

          <DialogFooter>
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
