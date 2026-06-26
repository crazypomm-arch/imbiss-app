import { createClient } from '@/lib/supabase/server'
import { StockClient } from './stock-client'

export default async function VoorraadPage() {
  const supabase = await createClient()

  const [{ data: stock }, { data: locations }, { data: categories }] = await Promise.all([
    supabase
      .from('v_stock_overview')
      .select('*')
      .order('location_name')
      .order('product_name'),
    supabase.from('locations').select('id, name, type, site').eq('active', true).order('sort_order'),
    supabase.from('categories').select('id, name').order('sort_order'),
  ])

  return <StockClient stock={stock ?? []} locations={locations ?? []} categories={categories ?? []} />
}
