import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ItemForm from '@/components/ItemForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import type { Item } from '@/types'

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('items').select('*').eq('id', id).single()

  if (!data) notFound()

  return (
    <div className="max-w-xl">
      <Link
        href="/dashboard/items"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft size={16} />
        Back to inventory
      </Link>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Item</h2>
      <ItemForm item={data as Item} />
    </div>
  )
}
