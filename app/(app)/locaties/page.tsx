import { createClient } from '@/lib/supabase/server'
import { LocationsClient } from './locations-client'

export default async function LocatiesPage() {
  const supabase = await createClient()

  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .order('sort_order')
    .order('name')

  return <LocationsClient locations={locations ?? []} />
}
