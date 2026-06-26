'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, MoreHorizontal, Truck, Phone, Mail, Package, Euro, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const DAYS = ['', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

type ProductSupplier = {
  id: string; price: number | null; price_unit: string | null
  min_order_qty: number | null; is_preferred: boolean; active: boolean
  products: { id: string; name: string; base_unit: string } | null
}
type Supplier = {
  id: string; name: string; contact_name: string | null; email: string | null
  phone: string | null; delivery_days: number[] | null; min_order_amount: number | null
  lead_time_days: number | null; notes: string | null; active: boolean
  product_suppliers: ProductSupplier[]
}
type Product = { id: string; name: string; base_unit: string }

const emptySupplierForm = {
  name: '', contact_name: '', email: '', phone: '',
  delivery_days: [] as number[], min_order_amount: '', lead_time_days: '1', notes: '',
}

const emptyLinkForm = {
  product_id: '', price: '', price_unit: '', min_order_qty: '',
  supplier_article_nr: '', quality_notes: '', is_preferred: false,
}

export function SuppliersClient({ suppliers: initial, products }: {
  suppliers: Supplier[]; products: Product[]
}) {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState(initial)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Leverancier dialoog
  const [supplierOpen, setSupplierOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm)

  // Product koppeling dialoog
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkSupplierId, setLinkSupplierId] = useState<string>('')
  const [linkForm, setLinkForm] = useState(emptyLinkForm)
  const [saving, setSaving] = useState(false)

  function sf(field: string, value: unknown) {
    setSupplierForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleDay(day: number) {
    setSupplierForm(prev => ({
      ...prev,
      delivery_days: prev.delivery_days.includes(day)
        ? prev.delivery_days.filter(d => d !== day)
        : [...prev.delivery_days, day].sort(),
    }))
  }

  function openAddSupplier() {
    setEditingSupplier(null)
    setSupplierForm(emptySupplierForm)
    setSupplierOpen(true)
  }

  function openEditSupplier(s: Supplier) {
    setEditingSupplier(s)
    setSupplierForm({
      name: s.name, contact_name: s.contact_name ?? '',
      email: s.email ?? '', phone: s.phone ?? '',
      delivery_days: s.delivery_days ?? [],
      min_order_amount: s.min_order_amount?.toString() ?? '',
      lead_time_days: s.lead_time_days?.toString() ?? '1',
      notes: s.notes ?? '',
    })
    setSupplierOpen(true)
  }

  async function saveSupplier() {
    if (!supplierForm.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      name: supplierForm.name,
      contact_name: supplierForm.contact_name || null,
      email: supplierForm.email || null,
      phone: supplierForm.phone || null,
      delivery_days: supplierForm.delivery_days.length ? supplierForm.delivery_days : null,
      min_order_amount: supplierForm.min_order_amount ? Number(supplierForm.min_order_amount) : null,
      lead_time_days: supplierForm.lead_time_days ? Number(supplierForm.lead_time_days) : 1,
      notes: supplierForm.notes || null,
    }
    if (editingSupplier) {
      const { error } = await supabase.from('suppliers').update(payload).eq('id', editingSupplier.id)
      if (error) { toast.error('Fout bij opslaan'); setSaving(false); return }
      toast.success('Leverancier bijgewerkt')
    } else {
      const { data, error } = await supabase.from('suppliers').insert(payload).select(`
        *, product_suppliers(id, price, price_unit, min_order_qty, is_preferred, active, products(id, name, base_unit))
      `).single()
      if (error) { toast.error('Fout bij aanmaken'); setSaving(false); return }
      setSuppliers(prev => [...prev, data])
      toast.success('Leverancier aangemaakt')
    }
    setSaving(false); setSupplierOpen(false); router.refresh()
  }

  async function toggleSupplierActive(s: Supplier) {
    const supabase = createClient()
    const { error } = await supabase.from('suppliers').update({ active: !s.active }).eq('id', s.id)
    if (error) { toast.error('Fout'); return }
    setSuppliers(prev => prev.map(x => x.id === s.id ? { ...x, active: !s.active } : x))
    toast.success(s.active ? 'Gedeactiveerd' : 'Geactiveerd')
  }

  function openLinkProduct(supplierId: string) {
    setLinkSupplierId(supplierId)
    setLinkForm(emptyLinkForm)
    setLinkOpen(true)
  }

  async function saveLink() {
    if (!linkForm.product_id) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('product_suppliers').insert({
      product_id: linkForm.product_id,
      supplier_id: linkSupplierId,
      price: linkForm.price ? Number(linkForm.price) : null,
      price_unit: linkForm.price_unit || null,
      min_order_qty: linkForm.min_order_qty ? Number(linkForm.min_order_qty) : null,
      supplier_article_nr: linkForm.supplier_article_nr || null,
      quality_notes: linkForm.quality_notes || null,
      is_preferred: linkForm.is_preferred,
    })
    if (error) { toast.error('Fout: ' + error.message); setSaving(false); return }
    toast.success('Product gekoppeld')
    setSaving(false); setLinkOpen(false); router.refresh()
  }

  async function removeLink(linkId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('product_suppliers').delete().eq('id', linkId)
    if (error) { toast.error('Fout'); return }
    toast.success('Koppeling verwijderd')
    router.refresh()
  }

  const inputCls = 'mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Leveranciers</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{suppliers.filter(s => s.active).length} actieve leveranciers</p>
        </div>
        <Button onClick={openAddSupplier} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="w-4 h-4" /> Leverancier toevoegen
        </Button>
      </div>

      <div className="space-y-3">
        {suppliers.length === 0 && (
          <div className="text-center py-12 text-zinc-500">Nog geen leveranciers aangemaakt.</div>
        )}
        {suppliers.map(s => {
          const isExpanded = expanded === s.id
          const activeProducts = s.product_suppliers?.filter(ps => ps.active) ?? []
          return (
            <div key={s.id} className={cn('bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden', !s.active && 'opacity-60')}>
              {/* Header */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 shrink-0">
                  <Truck className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold text-sm">{s.name}</p>
                    {!s.active && <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700 py-0">Inactief</Badge>}
                    {(s.delivery_days?.length ?? 0) > 0 && (
                      <div className="flex gap-0.5">
                        {s.delivery_days!.map(d => (
                          <span key={d} className="text-xs bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">{DAYS[d]}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {s.contact_name && <span className="text-zinc-500 text-xs">{s.contact_name}</span>}
                    {s.phone && <span className="text-zinc-500 text-xs flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}
                    {s.email && <span className="text-zinc-500 text-xs flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</span>}
                    {s.min_order_amount && <span className="text-zinc-500 text-xs flex items-center gap-1"><Euro className="w-3 h-3" />Min. €{s.min_order_amount}</span>}
                    {s.lead_time_days && <span className="text-zinc-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{s.lead_time_days}d levertijd</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setExpanded(isExpanded ? null : s.id)}
                    className="text-zinc-500 hover:text-white h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="text-zinc-500 hover:text-white h-8 w-8 shrink-0 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                      <DropdownMenuItem onClick={() => openEditSupplier(s)} className="gap-2 cursor-pointer hover:bg-zinc-800">
                        <Pencil className="w-4 h-4" /> Bewerken
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleSupplierActive(s)} className="gap-2 cursor-pointer hover:bg-zinc-800">
                        {s.active ? 'Deactiveren' : 'Activeren'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Uitklap: gekoppelde producten */}
              {isExpanded && (
                <div className="border-t border-zinc-800">
                  <div className="px-5 py-3 flex items-center justify-between">
                    <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">
                      Gekoppelde producten ({activeProducts.length})
                    </p>
                    <Button onClick={() => openLinkProduct(s.id)} variant="ghost" size="sm"
                      className="text-zinc-400 hover:text-white hover:bg-zinc-800 gap-1.5 text-xs h-7">
                      <Plus className="w-3.5 h-3.5" /> Product koppelen
                    </Button>
                  </div>
                  {activeProducts.length === 0 ? (
                    <p className="px-5 pb-4 text-zinc-600 text-sm">Geen producten gekoppeld.</p>
                  ) : (
                    <div className="divide-y divide-zinc-800/50">
                      {activeProducts.map(ps => (
                        <div key={ps.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-zinc-800/30">
                          <Package className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm">{ps.products?.name}</p>
                            <p className="text-zinc-500 text-xs">
                              {ps.price ? `€${ps.price} / ${ps.price_unit ?? ps.products?.base_unit}` : 'Geen prijs'}
                              {ps.min_order_qty ? ` · Min. ${ps.min_order_qty}` : ''}
                              {ps.is_preferred ? ' · Voorkeur' : ''}
                            </p>
                          </div>
                          <button onClick={() => removeLink(ps.id)}
                            className="text-zinc-600 hover:text-red-400 text-xs transition-colors">
                            Verwijderen
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Leverancier dialoog */}
      <Dialog open={supplierOpen} onOpenChange={setSupplierOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Leverancier bewerken' : 'Leverancier toevoegen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-zinc-300">Naam *</Label>
                <Input value={supplierForm.name} onChange={e => sf('name', e.target.value)}
                  placeholder="bijv. Metro" className={inputCls} />
              </div>
              <div>
                <Label className="text-zinc-300">Contactpersoon</Label>
                <Input value={supplierForm.contact_name} onChange={e => sf('contact_name', e.target.value)}
                  placeholder="Naam" className={inputCls} />
              </div>
              <div>
                <Label className="text-zinc-300">Telefoon</Label>
                <Input value={supplierForm.phone} onChange={e => sf('phone', e.target.value)}
                  placeholder="+31 6 ..." className={inputCls} />
              </div>
              <div className="col-span-2">
                <Label className="text-zinc-300">E-mail</Label>
                <Input value={supplierForm.email} onChange={e => sf('email', e.target.value)}
                  placeholder="bestellen@leverancier.nl" className={inputCls} />
              </div>
            </div>
            <Separator className="bg-zinc-800" />
            <div>
              <Label className="text-zinc-300 block mb-2">Bezorgdagen</Label>
              <div className="flex gap-1.5">
                {[1,2,3,4,5,6,7].map(d => (
                  <button key={d} onClick={() => toggleDay(d)}
                    className={cn('w-9 h-9 rounded-lg text-sm font-medium transition-colors',
                      supplierForm.delivery_days.includes(d)
                        ? 'bg-orange-500 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white')}>
                    {DAYS[d]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-300">Min. orderbedrag (€)</Label>
                <Input type="number" min="0" value={supplierForm.min_order_amount}
                  onChange={e => sf('min_order_amount', e.target.value)}
                  placeholder="bijv. 150" className={inputCls} />
              </div>
              <div>
                <Label className="text-zinc-300">Levertijd (dagen)</Label>
                <Input type="number" min="1" value={supplierForm.lead_time_days}
                  onChange={e => sf('lead_time_days', e.target.value)}
                  placeholder="1" className={inputCls} />
              </div>
            </div>
            <div>
              <Label className="text-zinc-300">Opmerkingen</Label>
              <Textarea value={supplierForm.notes} onChange={e => sf('notes', e.target.value)}
                placeholder="Extra info" rows={2}
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSupplierOpen(false)} className="text-zinc-400 hover:text-white">Annuleren</Button>
            <Button onClick={saveSupplier} disabled={saving || !supplierForm.name.trim()} className="bg-orange-500 hover:bg-orange-600 text-white">
              {saving ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product koppelen dialoog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Product koppelen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-zinc-300">Product *</Label>
              <Select value={linkForm.product_id} onValueChange={v => setLinkForm(f => ({ ...f, product_id: v }))}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Kies product" /></SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-48">
                  {products.map(p => <SelectItem key={p.id} value={p.id} className="hover:bg-zinc-800">{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-zinc-300">Inkoopprijs (€)</Label>
                <Input type="number" min="0" step="0.01" value={linkForm.price}
                  onChange={e => setLinkForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0.00" className={inputCls} />
              </div>
              <div>
                <Label className="text-zinc-300">Prijs per</Label>
                <Input value={linkForm.price_unit}
                  onChange={e => setLinkForm(f => ({ ...f, price_unit: e.target.value }))}
                  placeholder="stuk / doos / kg" className={inputCls} />
              </div>
              <div>
                <Label className="text-zinc-300">Min. bestelhoeveelheid</Label>
                <Input type="number" min="0" value={linkForm.min_order_qty}
                  onChange={e => setLinkForm(f => ({ ...f, min_order_qty: e.target.value }))}
                  placeholder="1" className={inputCls} />
              </div>
              <div>
                <Label className="text-zinc-300">Artikel nr. leverancier</Label>
                <Input value={linkForm.supplier_article_nr}
                  onChange={e => setLinkForm(f => ({ ...f, supplier_article_nr: e.target.value }))}
                  placeholder="optioneel" className={inputCls} />
              </div>
            </div>
            <div>
              <Label className="text-zinc-300">Kwaliteitsnotitie</Label>
              <Input value={linkForm.quality_notes}
                onChange={e => setLinkForm(f => ({ ...f, quality_notes: e.target.value }))}
                placeholder="bijv. A-merk / huismerk / biologisch" className={inputCls} />
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={linkForm.is_preferred}
                onChange={e => setLinkForm(f => ({ ...f, is_preferred: e.target.checked }))}
                className="w-4 h-4 rounded accent-orange-500" />
              <span className="text-zinc-300 text-sm">Voorkeursleverancier voor dit product</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLinkOpen(false)} className="text-zinc-400 hover:text-white">Annuleren</Button>
            <Button onClick={saveLink} disabled={saving || !linkForm.product_id} className="bg-orange-500 hover:bg-orange-600 text-white">
              {saving ? 'Koppelen...' : 'Koppelen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
