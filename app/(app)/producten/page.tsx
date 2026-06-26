import { createClient } from '@/lib/supabase/server'
import { ProductsClient } from './products-client'

export default async function ProductenPage() {
  const supabase = await createClient()

  const [{ data: products }, { data: categories }, { data: locations }] = await Promise.all([
    supabase
      .from('products')
      .select(`
        id, name, short_name, base_unit, active,
        tht_tracking, can_freeze,
        min_stock_opslag, min_stock_winkel,
        categories(id, name),
        locations!products_default_location_id_fkey(id, name, type)
      `)
      .order('name'),
    supabase.from('categories').select('id, name').order('sort_order'),
    supabase.from('locations').select('id, name, type, site').eq('active', true).order('sort_order'),
  ])

  return (
    <ProductsClient
      products={products ?? []}
      categories={categories ?? []}
      locations={locations ?? []}
    />
  )
}
