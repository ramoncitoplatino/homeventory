import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Package, ScanLine } from 'lucide-react'
import { CATEGORIES, CATEGORY_CONFIG, type Item, type Category } from '@/types'
import ItemCard from '@/components/ItemCard'

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()

  let query = supabase.from('items').select('*').order('name', { ascending: true })
  if (category) query = query.eq('category', category)

  const { data: items } = await query
  const allItems: Item[] = items ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory</h2>
          <p className="text-gray-500 text-sm mt-0.5">{allItems.length} items</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/items/receipt"
            className="flex items-center gap-2 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <ScanLine size={16} />
            Scan Receipt
          </Link>
          <Link
            href="/dashboard/items/new"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Item
          </Link>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/items"
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !category
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((cat) => {
          const cfg = CATEGORY_CONFIG[cat]
          const active = category === cat
          return (
            <Link
              key={cat}
              href={`/dashboard/items?category=${encodeURIComponent(cat)}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? `${cfg.bg} ${cfg.color} ring-2 ring-offset-1 ring-current`
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span>{cfg.icon}</span>
              {cat}
            </Link>
          )
        })}
      </div>

      {allItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-16 text-center">
          <Package size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {category ? `No items in "${category}"` : 'No items yet.'}
          </p>
          <Link
            href="/dashboard/items/new"
            className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:underline text-sm font-medium"
          >
            <Plus size={14} /> Add an item
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
