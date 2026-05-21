import Link from 'next/link'
import { AlertTriangle, CalendarX, Pencil } from 'lucide-react'
import { CATEGORY_CONFIG, type Item, type Category } from '@/types'

export default function ItemCard({ item }: { item: Item }) {
  const today = new Date().toISOString().split('T')[0]
  const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const isLowStock = item.quantity <= item.low_stock_threshold
  const isExpired = item.expiry_date && item.expiry_date < today
  const isExpiringSoon =
    item.expiry_date && item.expiry_date >= today && item.expiry_date <= soon

  const cfg = CATEGORY_CONFIG[item.category as Category] ?? CATEGORY_CONFIG['Other']

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`shrink-0 text-lg w-8 h-8 flex items-center justify-center rounded-lg ${cfg.bg}`}
          >
            {cfg.icon}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate">{item.name}</p>
            <p className={`text-xs font-medium ${cfg.color}`}>{item.category}</p>
          </div>
        </div>
        <Link
          href={`/dashboard/items/${item.id}/edit`}
          className="shrink-0 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          <Pencil size={14} />
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <span
          className={`text-lg font-bold ${isLowStock ? 'text-orange-600' : 'text-gray-800'}`}
        >
          {item.quantity}{' '}
          <span className="text-sm font-normal text-gray-500">{item.unit}</span>
        </span>

        <div className="flex gap-1">
          {isLowStock && (
            <span className="flex items-center gap-1 bg-orange-100 text-orange-600 text-xs font-medium px-2 py-0.5 rounded-full">
              <AlertTriangle size={11} />
              Low
            </span>
          )}
          {isExpired && (
            <span className="flex items-center gap-1 bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
              <CalendarX size={11} />
              Expired
            </span>
          )}
          {isExpiringSoon && !isExpired && (
            <span className="flex items-center gap-1 bg-amber-100 text-amber-600 text-xs font-medium px-2 py-0.5 rounded-full">
              <CalendarX size={11} />
              Soon
            </span>
          )}
        </div>
      </div>

      {item.expiry_date && (
        <p className="text-xs text-gray-400 mt-1">Expires {item.expiry_date}</p>
      )}
    </div>
  )
}
