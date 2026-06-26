'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  MapPin,
  ArrowLeftRight,
  ShoppingCart,
  Truck,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  BarChart3,
  ClipboardList,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/voorraad',      label: 'Voorraad',        icon: BarChart3 },
  { href: '/tellingen',     label: 'Telling starten', icon: ClipboardList },
  { href: '/producten',     label: 'Producten',       icon: Package },
  { href: '/leveranciers',  label: 'Leveranciers',    icon: Truck },
  { href: '/locaties', label: 'Locaties', icon: MapPin },
  { href: '/overplaatsingen', label: 'Overplaatsingen', icon: ArrowLeftRight },
  { href: '/boodschappen', label: 'Boodschappen', icon: ShoppingCart },
  { href: '/bestellingen', label: 'Bestellingen', icon: Package },
]

const adminItems = [
  { href: '/medewerkers', label: 'Medewerkers', icon: Users },
  { href: '/instellingen', label: 'Instellingen', icon: Settings },
]

interface Profile {
  full_name: string
  role: string
  language: string
}

export function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 flex flex-col bg-zinc-900 border-r border-zinc-800 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-zinc-800">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-orange-500 shrink-0">
          <span className="text-white text-base font-bold">I</span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">Imbiss App</p>
          <p className="text-zinc-500 text-xs">Voorraad & Beheer</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group',
                active
                  ? 'bg-orange-500/15 text-orange-400 font-medium'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-orange-400' : 'text-zinc-500 group-hover:text-zinc-300')} />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto text-orange-400/60" />}
            </Link>
          )
        })}

        {(profile?.role === 'beheerder') && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-zinc-600 text-xs font-medium uppercase tracking-wider">Beheer</p>
            </div>
            {adminItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group',
                    active
                      ? 'bg-orange-500/15 text-orange-400 font-medium'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-orange-400' : 'text-zinc-500 group-hover:text-zinc-300')} />
                  {label}
                  {active && <ChevronRight className="w-3 h-3 ml-auto text-orange-400/60" />}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
            <span className="text-orange-400 text-xs font-bold uppercase">
              {profile?.full_name?.charAt(0) ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{profile?.full_name}</p>
            <p className="text-zinc-500 text-xs capitalize">{profile?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-zinc-500 hover:text-red-400 transition-colors p-1 rounded"
            title="Uitloggen"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
