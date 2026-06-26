import { createClient } from '@/lib/supabase/server'
import { SuppliersClient } from './suppliers-client'

export default async function LeveranciersPage() {
  const supabase = await createClient()

  const [{ data: suppliers }, { data: products }] = await Promise.all([
    supabase
      .from('suppliers')
      .select(`
        *,
        product_suppliers(
          id, price, price_unit, min_order_qty, is_preferred, active,
          products(id, name, base_unit)
        )
      `)
      .order('name'),
    supabase.from('products').select('id, name, base_unit').eq('active', true).order('name'),
  ])

  return <SuppliersClient suppliers={suppliers ?? []} products={products ?? []} />
}
