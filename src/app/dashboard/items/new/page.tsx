import { createClient } from '@/lib/supabase/server'
import ItemForm from '@/components/ItemForm'
import Link from 'next/link'
import { ChevronLeft, ScanLine } from 'lucide-react'
import { PRESET_ITEMS } from '@/lib/household-items'
import type { HouseholdItem } from '@/lib/household-items'
import type { Category } from '@/types'

export default async function NewItemPage() {
  const supabase = await createClient()
  const { data: existingItems } = await supabase
    .from('items')
    .select('name, category, unit')
    .order('name', { ascending: true })

  // Merge preset list with user's previously added items (deduplicated by name)
  const presetNames = new Set(PRESET_ITEMS.map((p) => p.name.toLowerCase()))
  const customItems: HouseholdItem[] = (existingItems ?? [])
    .filter((i) => !presetNames.has(i.name.toLowerCase()))
    .map((i) => ({ name: i.name, category: i.category as Category, unit: i.unit }))

  // Custom items appear first so they surface quickly in autocomplete
  const suggestions: HouseholdItem[] = [...customItems, ...PRESET_ITEMS]

  return (
    <div className="max-w-xl">
      <Link
        href="/dashboard/items"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft size={16} />
        Back to inventory
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Add Item</h2>
        <Link
          href="/dashboard/items/receipt"
          className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <ScanLine size={15} />
          Scan Receipt
        </Link>
      </div>
      <ItemForm suggestions={suggestions} />
    </div>
  )
}
