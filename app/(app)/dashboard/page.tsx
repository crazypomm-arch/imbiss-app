import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AlertTriangle, Package, Clock, ClipboardList } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const [
    { count: lowStockCount },
    { data: thtAlerts },
    { count: openOrdersCount },
    { count: pendingTransfersCount },
  ] = await Promise.all([
    supabase.from('v_low_stock').select('*', { count: 'exact', head: true }),
    supabase.from('v_tht_alerts').select('product_name, days_until_expiry, location_name').limit(5),
    supabase.from('purchases').select('*', { count: 'exact', head: true }).in('status', ['besteld', 'deels_ontvangen']),
    supabase.from('transfer_orders').select('*', { count: 'exact', head: true }).in('status', ['aangemaakt', 'in_wacht', 'in_uitvoering']),
  ])

  const kpis = [
    { label: 'Lage voorraad', value: lowStockCount ?? 0, icon: Package, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'THT meldingen', value: thtAlerts?.length ?? 0, icon: Clock, color: 'text-red-400', bg: 'bg-red-500/10' },
    { label: 'Open bestellingen', value: openOrdersCount ?? 0, icon: ClipboardList, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Open opdrachten', value: pendingTransfersCount ?? 0, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  ]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond'

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">{greeting}, {profile?.full_name?.split(' ')[0]}</h1>
        <p className="text-zinc-400 text-sm mt-1">Hier is een overzicht van vandaag</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${bg} mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-zinc-400 text-sm mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {(thtAlerts?.length ?? 0) > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-400" />
            THT meldingen (komende 14 dagen)
          </h2>
          <div className="space-y-2">
            {thtAlerts?.map((alert, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{alert.product_name}</p>
                  <p className="text-zinc-500 text-xs">{alert.location_name}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  (alert.days_until_expiry ?? 0) <= 2
                    ? 'bg-red-500/20 text-red-400'
                    : (alert.days_until_expiry ?? 0) <= 7
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {alert.days_until_expiry === 0 ? 'Vandaag' : `${alert.days_until_expiry} dagen`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {lowStockCount === 0 && (thtAlerts?.length ?? 0) === 0 && openOrdersCount === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <p className="text-zinc-400">Alles ziet er goed uit — geen meldingen.</p>
        </div>
      )}
    </div>
  )
}
