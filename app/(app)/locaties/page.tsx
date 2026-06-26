import { createClient } from '@/lib/supabase/server'
import { LocationsClient } from './locations-client'

export default async function LocatiesPage() {
  const supabase = await createClient()

  const [{ data: sites }, { data: locations }] = await Promise.all([
    supabase.from('sites').select('*').order('sort_order').order('name'),
    supabase.from('locations').select('*').order('sort_order').order('name'),
  ])

  return <LocationsClient sites={sites ?? []} locations={locations ?? []} />
}
