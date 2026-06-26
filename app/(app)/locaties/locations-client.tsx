'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Thermometer, Snowflake, Archive, ShoppingBag, MoreHorizontal, Building2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'

type Site = { id: string; name: string; address: string | null; notes: string | null; active: boolean; sort_order: number }
type Location = { id: string; name: string; site: string; site_id: string | null; type: string; description: string | null; active: boolean; sort_order: number }

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  diepvries: { label: 'Diepvries',    icon: Snowflake,     color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  koeling:   { label: 'Koeling',      icon: Thermometer,   color: 'text-cyan-400',   bg: 'bg-cyan-500/10' },
  droog:     { label: 'Droge opslag', icon: Archive,       color: 'text-amber-400',  bg: 'bg-amber-500/10' },
  winkel:    { label: 'Winkel',       icon: ShoppingBag,   color: 'text-green-400',  bg: 'bg-green-500/10' },
  overig:    { label: 'Overig',       icon: MoreHorizontal,color: 'text-zinc-400',   bg: 'bg-zinc-500/10' },
}

export function LocationsClient({ sites: initialSites, locations: initialLocations }: {
  sites: Site[]
  locations: Location[]
}) {
  const router = useRouter()
  const [sites, setSites] = useState(initialSites)
  const [locations, setLocations] = useState(initialLocations)

  // Vestiging dialoog
  const [siteOpen, setSiteOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [siteForm, setSiteForm] = useState({ name: '', address: '', notes: '' })

  // Locatie dialoog
  const [locOpen, setLocOpen] = useState(false)
  const [editingLoc, setEditingLoc] = useState<Location | null>(null)
  const [locForm, setLocForm] = useState({ name: '', type: 'droog', site_id: '', description: '' })
  const [saving, setSaving] = useState(false)

  // --- Vestiging acties ---
  function openAddSite() {
    setEditingSite(null)
    setSiteForm({ name: '', address: '', notes: '' })
    setSiteOpen(true)
  }

  function openEditSite(s: Site) {
    setEditingSite(s)
    setSiteForm({ name: s.name, address: s.address ?? '', notes: s.notes ?? '' })
    setSiteOpen(true)
  }

  async function saveSite() {
    if (!siteForm.name.trim()) return
    setSaving(true)
    const supabase = createClient()

    if (editingSite) {
      const { error } = await supabase.from('sites')
        .update({ name: siteForm.name, address: siteForm.address || null, notes: siteForm.notes || null })
        .eq('id', editingSite.id)
      if (error) { toast.error('Fout bij opslaan'); setSaving(false); return }
      setSites(prev => prev.map(s => s.id === editingSite.id ? { ...s, ...siteForm, address: siteForm.address || null, notes: siteForm.notes || null } : s))
      toast.success('Vestiging bijgewerkt')
    } else {
      const { data, error } = await supabase.from('sites')
        .insert({ name: siteForm.name, address: siteForm.address || null, notes: siteForm.notes || null, sort_order: sites.length })
        .select().single()
      if (error) { toast.error('Fout bij aanmaken'); setSaving(false); return }
      setSites(prev => [...prev, data])
      toast.success('Vestiging aangemaakt')
    }

    setSaving(false)
    setSiteOpen(false)
    router.refresh()
  }

  async function toggleSiteActive(s: Site) {
    const supabase = createClient()
    const { error } = await supabase.from('sites').update({ active: !s.active }).eq('id', s.id)
    if (error) { toast.error('Fout'); return }
    setSites(prev => prev.map(x => x.id === s.id ? { ...x, active: !s.active } : x))
    toast.success(s.active ? 'Vestiging gedeactiveerd' : 'Vestiging geactiveerd')
  }

  // --- Locatie acties ---
  function openAddLocation(siteId: string) {
    setEditingLoc(null)
    setLocForm({ name: '', type: 'droog', site_id: siteId, description: '' })
    setLocOpen(true)
  }

  function openEditLocation(loc: Location) {
    setEditingLoc(loc)
    setLocForm({ name: loc.name, type: loc.type, site_id: loc.site_id ?? '', description: loc.description ?? '' })
    setLocOpen(true)
  }

  async function saveLocation() {
    if (!locForm.name.trim()) return
    setSaving(true)
    const supabase = createClient()

    const payload = {
      name: locForm.name,
      type: locForm.type,
      site_id: locForm.site_id || null,
      description: locForm.description || null,
    }

    if (editingLoc) {
      const { error } = await supabase.from('locations').update(payload).eq('id', editingLoc.id)
      if (error) { toast.error('Fout bij opslaan'); setSaving(false); return }
      setLocations(prev => prev.map(l => l.id === editingLoc.id ? { ...l, ...payload } : l))
      toast.success('Locatie bijgewerkt')
    } else {
      const { data, error } = await supabase.from('locations').insert(payload).select().single()
      if (error) { toast.error('Fout bij aanmaken'); setSaving(false); return }
      setLocations(prev => [...prev, data])
      toast.success('Locatie aangemaakt')
    }

    setSaving(false)
    setLocOpen(false)
    router.refresh()
  }

  async function toggleLocActive(loc: Location) {
    const supabase = createClient()
    const { error } = await supabase.from('locations').update({ active: !loc.active }).eq('id', loc.id)
    if (error) { toast.error('Fout'); return }
    setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, active: !loc.active } : l))
    toast.success(loc.active ? 'Locatie gedeactiveerd' : 'Locatie geactiveerd')
  }

  const totalActive = locations.filter(l => l.active).length

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Locaties</h1>
          <p className="text-zinc-400 text-sm mt-0.5">{sites.length} vestigingen · {totalActive} actieve opslaglocaties</p>
        </div>
        <Button onClick={openAddSite} className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="w-4 h-4" /> Vestiging toevoegen
        </Button>
      </div>

      {sites.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          Nog geen vestigingen. Voeg een vestiging toe om te beginnen.
        </div>
      )}

      <div className="space-y-6">
        {sites.map(site => {
          const siteLocations = locations.filter(l => l.site_id === site.id)
          return (
            <div key={site.id} className={`bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden ${!site.active ? 'opacity-60' : ''}`}>
              {/* Vestiging header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-500/10 shrink-0">
                  <Building2 className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-sm">{site.name}</p>
                    {!site.active && <Badge variant="outline" className="text-xs text-zinc-500 border-zinc-700 py-0">Inactief</Badge>}
                  </div>
                  {site.address && <p className="text-zinc-500 text-xs mt-0.5">{site.address}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => openAddLocation(site.id)}
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800 gap-1.5 text-xs h-8"
                  >
                    <MapPin className="w-3.5 h-3.5" /> Locatie toevoegen
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="text-zinc-500 hover:text-white h-8 w-8 shrink-0 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                      <DropdownMenuItem onClick={() => openEditSite(site)} className="gap-2 cursor-pointer hover:bg-zinc-800">
                        <Pencil className="w-4 h-4" /> Bewerken
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleSiteActive(site)} className="gap-2 cursor-pointer hover:bg-zinc-800">
                        {site.active ? 'Deactiveren' : 'Activeren'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Locaties onder vestiging */}
              {siteLocations.length === 0 ? (
                <div className="px-5 py-4 text-zinc-600 text-sm">
                  Nog geen opslaglocaties — klik op "Locatie toevoegen"
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/60">
                  {siteLocations.map(loc => {
                    const cfg = typeConfig[loc.type] ?? typeConfig.overig
                    const Icon = cfg.icon
                    return (
                      <div key={loc.id} className={`flex items-center gap-4 px-5 py-3 hover:bg-zinc-800/30 transition-colors ${!loc.active ? 'opacity-50' : ''}`}>
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${cfg.bg} shrink-0`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white text-sm font-medium">{loc.name}</p>
                            {!loc.active && <Badge variant="outline" className="text-xs text-zinc-600 border-zinc-700 py-0">Inactief</Badge>}
                          </div>
                          <p className="text-zinc-500 text-xs">{cfg.label}{loc.description ? ` · ${loc.description}` : ''}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="text-zinc-500 hover:text-white h-7 w-7 shrink-0 flex items-center justify-center rounded-md hover:bg-zinc-800 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                            <DropdownMenuItem onClick={() => openEditLocation(loc)} className="gap-2 cursor-pointer hover:bg-zinc-800">
                              <Pencil className="w-4 h-4" /> Bewerken
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleLocActive(loc)} className="gap-2 cursor-pointer hover:bg-zinc-800">
                              {loc.active ? 'Deactiveren' : 'Activeren'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Vestiging dialoog */}
      <Dialog open={siteOpen} onOpenChange={setSiteOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>{editingSite ? 'Vestiging bewerken' : 'Vestiging toevoegen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-zinc-300">Naam *</Label>
              <Input value={siteForm.name} onChange={e => setSiteForm(f => ({ ...f, name: e.target.value }))}
                placeholder="bijv. Blanke" className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" />
            </div>
            <div>
              <Label className="text-zinc-300">Adres</Label>
              <Input value={siteForm.address} onChange={e => setSiteForm(f => ({ ...f, address: e.target.value }))}
                placeholder="bijv. Blankenburgstraat 1, Amsterdam" className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" />
            </div>
            <div>
              <Label className="text-zinc-300">Opmerkingen</Label>
              <Textarea value={siteForm.notes} onChange={e => setSiteForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Extra informatie" className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 resize-none" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSiteOpen(false)} className="text-zinc-400 hover:text-white">Annuleren</Button>
            <Button onClick={saveSite} disabled={saving || !siteForm.name.trim()} className="bg-orange-500 hover:bg-orange-600 text-white">
              {saving ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Locatie dialoog */}
      <Dialog open={locOpen} onOpenChange={setLocOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>{editingLoc ? 'Locatie bewerken' : 'Locatie toevoegen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-zinc-300">Naam *</Label>
              <Input value={locForm.name} onChange={e => setLocForm(f => ({ ...f, name: e.target.value }))}
                placeholder="bijv. Diepvries 2" className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" />
            </div>
            <div>
              <Label className="text-zinc-300">Type *</Label>
              <Select value={locForm.type} onValueChange={v => setLocForm(f => ({ ...f, type: v }))}>
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
              <Label className="text-zinc-300">Vestiging</Label>
              <Select value={locForm.site_id} onValueChange={v => setLocForm(f => ({ ...f, site_id: v }))}>
                <SelectTrigger className="mt-1.5 bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Kies vestiging" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  {sites.map(s => (
                    <SelectItem key={s.id} value={s.id} className="hover:bg-zinc-800">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-300">Omschrijving (optioneel)</Label>
              <Input value={locForm.description} onChange={e => setLocForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Extra info" className="mt-1.5 bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setLocOpen(false)} className="text-zinc-400 hover:text-white">Annuleren</Button>
            <Button onClick={saveLocation} disabled={saving || !locForm.name.trim()} className="bg-orange-500 hover:bg-orange-600 text-white">
              {saving ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
