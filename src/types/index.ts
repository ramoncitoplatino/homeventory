export type Category =
  | 'Food & Beverages'
  | 'Cleaning Supplies'
  | 'Personal Care'
  | 'Kitchen'
  | 'Laundry'
  | 'Other'

export const CATEGORIES: Category[] = [
  'Food & Beverages',
  'Cleaning Supplies',
  'Personal Care',
  'Kitchen',
  'Laundry',
  'Other',
]

export const CATEGORY_CONFIG: Record<Category, { color: string; bg: string; icon: string }> = {
  'Food & Beverages': { color: 'text-green-700', bg: 'bg-green-100', icon: '🥛' },
  'Cleaning Supplies': { color: 'text-blue-700', bg: 'bg-blue-100', icon: '🧹' },
  'Personal Care': { color: 'text-purple-700', bg: 'bg-purple-100', icon: '🧴' },
  Kitchen: { color: 'text-orange-700', bg: 'bg-orange-100', icon: '🍳' },
  Laundry: { color: 'text-cyan-700', bg: 'bg-cyan-100', icon: '🧺' },
  Other: { color: 'text-gray-700', bg: 'bg-gray-100', icon: '📦' },
}

export const UNITS = [
  'pieces',
  'bottles',
  'cans',
  'boxes',
  'bags',
  'liters',
  'ml',
  'kg',
  'g',
  'rolls',
  'packs',
]

export interface Item {
  id: string
  name: string
  category: Category
  quantity: number
  unit: string
  low_stock_threshold: number
  expiry_date: string | null
  notes: string | null
  user_id: string
  created_at: string
  updated_at: string
}

export interface ItemFormData {
  name: string
  category: Category
  quantity: number
  unit: string
  low_stock_threshold: number
  expiry_date: string
  notes: string
}
