import { createClient } from '@/lib/supabase/server'
import { TellingenClient } from './tellingen-client'

export default async function TellingenPage() {
  const supabase = await createClient()

  const [{ data: locations }, { data: products }, { data: stockLevels }] = await Promise.all([
    supabase.from('locations').select('id, name, type, site').eq('active', true).order('sort_order'),
    supabase.from('products').select('id, name, short_name, base_unit, category_id').eq('active', true).order('name'),
    supabase.from('stock_levels').select('product_id, location_id, quantity'),
  ])

  return (
    <TellingenClient
      locations={locations ?? []}
      products={products ?? []}
      stockLevels={stockLevels ?? []}
    />
  )
}
