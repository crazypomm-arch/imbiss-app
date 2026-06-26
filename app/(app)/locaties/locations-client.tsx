'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Thermometer, Snowflake, Archive, ShoppingBag, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

type Location = {
  id: string
  name: string
  site: string
  type: string
  description: string | null
  active: boolean
  sort_order: number
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  diepvries: { label: 'Diepvries', icon: Snowflake, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  koeling:   { label: 'Koeling',   icon: Thermometer, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  droog:     { label: 'Droge opslag', icon: Archive, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  winkel:    { label: 'Winkel',    icon: ShoppingBag, color: 'text-green-400', bg: 'bg-green-500/10' },
  overig:    { label: 'Overig',    icon: MoreHorizontal, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
}

const emptyForm = { name: '', site: 'Blanke', type: 'droog', description: '' }

export function LocationsClient({ locations: initial }: { locations: Location[] }) {
  const router = useRouter()
  const [locations, setLocations] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Location | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  function openAdd() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(loc: Location) {
    setEditing(loc)
    setForm({ name: loc.name, site: loc.site, type: loc.type, description: loc.description ?? '' })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const supabase = createClient()

    if (editing) {
      const { error } = await supabase
        .from('locations')
        .update({ name: form.name, site: form.site, type: form.type, description: form.description || null })
        .eq('id', editing.id)
      if (error) { toast.error('Fout bij opslaan'); setSaving(false); return }
      setLocations(locs => locs.map(l => l.id === editing.id ? { ...l, ...form, description: form.description || null } : l))
      toast.success('Locatie bijgewerkt')
    } else {
      const { data, error } = await supabase
        .from('locations')
        .insert({ name: form.name, site: form.site, type: form.type, description: form.description || null })
        .select()
        .single()
      if (error) { toast.error('Fout bij aanmaken'); setSaving(false); return }
      setLocations(locs => [...locs, data])
      toast.success('Locatie aangemaakt')
    }

    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  async function toggleActive(loc: Location) {
    const supabase = createClient()
    const { error } = await supabase
      .from('locations')
      .update({ active: !loc.active })
      .eq('id', loc.id)
    if (error) { toast.error('Fout bij bijwerken'); return }
    setLocations(locs => locs.map(l => l.id === loc.id ? { ...l, active: !l.active } : l))
    toast.success(loc.active ? 'Locatie gedeactiveerd' : 'Locatie geactiveerd')
  }

  // Groepeer per site
  const sites = [...new Set(locations.map(l => l.site))]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Locaties</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{locations.filter(l => l.active).length} actieve locaties</p>
        </div>
        <Button onClick={openAdd} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="w-4 h-4" />
          Locatie toevoegen
        </Button>
      </div>

      <div className="space-y-6">
        {sites.map(site => (
          <div key={site}>
            <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">{site}</h2>
            <div className="grid gap-3">
              {locations.filter(l => l.site === site).map(loc => {
                const cfg = typeConfig[loc.type] ?? typeConfig.overig
                const Icon = cfg.icon
                return (
                  <div key={loc.id} className={`bg-zinc-900 border rounded-xl p-4 flex items-center gap-4 transition-opacity ${!loc.active ? 'opacity-50 border-zinc-800' : 'border-zinc-800 hover:border-zinc-700'}`}>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${cfg.bg} shrink-0`}>
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium text-sm">{loc.name}</p>
                        {!loc.active && <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700">Inactief</Badge>}
                      </div>
                      <p className="text-zinc-500 text-xs mt-0.5">{cfg.label}</p>
                      {loc.description && <p className="text-zinc-500 text-xs mt-0.5">{loc.description}</p>}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white h-8 w-8 shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                        <DropdownMenuItem onClick={() => openEdit(loc)} className="gap-2 cursor-pointer hover:bg-zinc-800">
                          <Pencil className="w-4 h-4" /> Bewerken
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleActive(loc)} className="gap-2 cursor-pointer hover:bg-zinc-800">
                          {loc.active ? 'Deactiveren' : 'Activeren'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>{editing ? 'Locatie bewerken' : 'Locatie toevoegen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-zinc-300">Naam</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="bijv. Diepvries 2"
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
              />
            </div>
            <div>
              <Label className="text-zinc-300">Vestiging</Label>
              <Input
                value={form.site}
                onChange={e => setForm(f => ({ ...f, site: e.target.value }))}
                placeholder="bijv. Blanke"
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
              />
            </div>
            <div>
              <Label className="text-zinc-300">Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  {Object.entries(typeConfig).map(([value, { label }]) => (
                    <SelectItem key={value} value={value} className="hover:bg-zinc-800">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-300">Omschrijving (optioneel)</Label>
              <Input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Extra info"
                className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500"
              />
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
