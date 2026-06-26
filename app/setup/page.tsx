'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus('')

    const supabase = createClient()

    // Check no users exist yet
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if ((count ?? 0) > 0) {
      setStatus('Setup is al uitgevoerd. Ga naar de loginpagina.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.name, role: 'beheerder', language: 'nl' },
      },
    })

    if (error) {
      setStatus(`Fout: ${error.message}`)
      setLoading(false)
      return
    }

    if (data.user) {
      // Ensure role is set to beheerder
      await supabase
        .from('profiles')
        .update({ role: 'beheerder', full_name: form.name })
        .eq('id', data.user.id)
    }

    setStatus('Admin account aangemaakt! Je kunt nu inloggen.')
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-500 mb-4">
            <span className="text-white text-2xl font-bold">I</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Eerste keer instellen</h1>
          <p className="text-zinc-400 text-sm mt-1">Maak het beheerder account aan</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Naam</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                placeholder="Jeffrey"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">E-mailadres</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                placeholder="jeffrey@imbiss.nl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Wachtwoord</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
                className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                placeholder="Minimaal 8 tekens"
              />
            </div>

            {status && (
              <div className={`rounded-lg px-3 py-2.5 text-sm ${status.startsWith('Fout') ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
                {status}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Bezig...' : 'Account aanmaken'}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-4">
          Deze pagina werkt alleen als er nog geen gebruikers zijn.
        </p>
      </div>
    </div>
  )
}
