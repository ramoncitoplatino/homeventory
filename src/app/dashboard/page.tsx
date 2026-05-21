import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Package, AlertTriangle, CalendarX, Plus } from 'lucide-react'
import { CATEGORY_CONFIG, type Item, type Category } from '@/types'
import ItemCard from '@/components/ItemCard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .order('name', { ascending: true })

  const allItems: Item[] = items ?? []
  const today = new Date().toISOString().split('T')[0]
  const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const lowStock = allItems.filter((i) => i.quantity <= i.low_stock_threshold)
  const expiringSoon = allItems.filter(
    (i) => i.expiry_date && i.expiry_date >= today && i.expiry_date <= soon
  )
  const expired = allItems.filter((i) => i.expiry_date && i.expiry_date < today)

  const categoryCounts = allItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-0.5">{allItems.length} items tracked</p>
        </div>
        <Link
          href="/dashboard/items/new"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Add Item
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-xl">
            <Package className="text-indigo-600" size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{allItems.length}</p>
            <p className="text-sm text-gray-500">Total Items</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-xl">
            <AlertTriangle className="text-orange-600" size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{lowStock.length}</p>
            <p className="text-sm text-gray-500">Low Stock</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-xl">
            <CalendarX className="text-red-600" size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{expired.length + expiringSoon.length}</p>
            <p className="text-sm text-gray-500">Expiry Alerts</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(lowStock.length > 0 || expired.length > 0 || expiringSoon.length > 0) && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">Alerts</h3>
          {expired.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/items/${item.id}/edit`}
              className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 hover:bg-red-100 transition-colors"
            >
              <CalendarX size={16} className="text-red-500 shrink-0" />
              <span className="text-sm text-red-700 font-medium">{item.name}</span>
              <span className="text-xs text-red-500 ml-auto">Expired {item.expiry_date}</span>
            </Link>
          ))}
          {expiringSoon.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/items/${item.id}/edit`}
              className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors"
            >
              <CalendarX size={16} className="text-amber-500 shrink-0" />
              <span className="text-sm text-amber-700 font-medium">{item.name}</span>
              <span className="text-xs text-amber-500 ml-auto">Expires {item.expiry_date}</span>
            </Link>
          ))}
          {lowStock.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/items/${item.id}/edit`}
              className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 hover:bg-orange-100 transition-colors"
            >
              <AlertTriangle size={16} className="text-orange-500 shrink-0" />
              <span className="text-sm text-orange-700 font-medium">{item.name}</span>
              <span className="text-xs text-orange-500 ml-auto">
                {item.quantity} {item.unit} left
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Categories */}
      {Object.keys(categoryCounts).length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800">By Category</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const cfg = CATEGORY_CONFIG[cat as Category]
              return (
                <Link
                  key={cat}
                  href={`/dashboard/items?category=${encodeURIComponent(cat)}`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${cfg?.bg ?? 'bg-gray-100'} ${cfg?.color ?? 'text-gray-700'} hover:opacity-80 transition-opacity`}
                >
                  <span>{cfg?.icon}</span>
                  {cat}
                  <span className="font-bold">{count}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">All Items</h3>
          <Link href="/dashboard/items" className="text-sm text-indigo-600 hover:underline">
            View all
          </Link>
        </div>
        {allItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
            <Package size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No items yet.</p>
            <Link
              href="/dashboard/items/new"
              className="mt-4 inline-flex items-center gap-2 text-indigo-600 hover:underline text-sm font-medium"
            >
              <Plus size={14} /> Add your first item
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allItems.slice(0, 6).map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
