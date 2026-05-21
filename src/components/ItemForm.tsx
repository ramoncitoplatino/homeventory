'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES, CATEGORY_CONFIG, UNITS, type Item, type ItemFormData, type Category } from '@/types'
import type { HouseholdItem } from '@/lib/household-items'
import { Loader2, Trash2 } from 'lucide-react'

interface Props {
  item?: Item
  suggestions?: HouseholdItem[]
}

const DEFAULT: ItemFormData = {
  name: '',
  category: 'Other',
  quantity: 1,
  unit: 'pieces',
  low_stock_threshold: 1,
  expiry_date: '',
  notes: '',
}

export default function ItemForm({ item, suggestions = [] }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState<ItemFormData>(
    item
      ? {
          name: item.name,
          category: item.category as Category,
          quantity: item.quantity,
          unit: item.unit,
          low_stock_threshold: item.low_stock_threshold,
          expiry_date: item.expiry_date ?? '',
          notes: item.notes ?? '',
        }
      : DEFAULT
  )
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  // Autocomplete state
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLUListElement>(null)

  const filtered =
    form.name.trim().length > 0
      ? suggestions.filter((s) =>
          s.name.toLowerCase().includes(form.name.toLowerCase())
        )
      : []

  // Reset active index when filtered list changes
  useEffect(() => {
    setActiveIndex(-1)
  }, [form.name])

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && dropdownRef.current) {
      const el = dropdownRef.current.children[activeIndex] as HTMLElement
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  function set<K extends keyof ItemFormData>(key: K, value: ItemFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function selectSuggestion(s: HouseholdItem) {
    setForm((f) => ({
      ...f,
      name: s.name,
      category: s.category,
      unit: s.unit,
    }))
    setShowDropdown(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      selectSuggestion(filtered[activeIndex])
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      setActiveIndex(-1)
    }
  }

  function highlightMatch(text: string, query: string) {
    if (!query.trim()) return <>{text}</>
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return <>{text}</>
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-semibold text-indigo-600">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      category: form.category,
      quantity: Number(form.quantity),
      unit: form.unit,
      low_stock_threshold: Number(form.low_stock_threshold),
      expiry_date: form.expiry_date || null,
      notes: form.notes.trim() || null,
      updated_at: new Date().toISOString(),
    }

    let err
    if (item) {
      ;({ error: err } = await supabase.from('items').update(payload).eq('id', item.id))
    } else {
      ;({ error: err } = await supabase.from('items').insert(payload))
    }

    if (err) {
      setError(err.message)
      setSaving(false)
    } else {
      router.push('/dashboard/items')
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!item) return
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    setDeleting(true)
    const { error: err } = await supabase.from('items').delete().eq('id', item.id)
    if (err) {
      setError(err.message)
      setDeleting(false)
    } else {
      router.push('/dashboard/items')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
      {/* Name with autocomplete */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
        <div className="relative">
          <input
            ref={inputRef}
            value={form.name}
            onChange={(e) => {
              set('name', e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 120)}
            onKeyDown={handleKeyDown}
            required
            autoComplete="off"
            placeholder="e.g. Whole Milk, Dishwashing Liquid"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />

          {showDropdown && filtered.length > 0 && (
            <ul
              ref={dropdownRef}
              className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto"
            >
              {filtered.map((s, i) => {
                const cfg = CATEGORY_CONFIG[s.category]
                return (
                  <li
                    key={s.name}
                    onMouseDown={() => selectSuggestion(s)}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm ${
                      i === activeIndex ? 'bg-indigo-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{cfg.icon}</span>
                      <span className="text-gray-800 truncate">
                        {highlightMatch(s.name, form.name)}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}
                    >
                      {s.category}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
        <select
          value={form.category}
          onChange={(e) => set('category', e.target.value as Category)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.quantity}
            onChange={(e) => set('quantity', parseFloat(e.target.value) || 0)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
          <select
            value={form.unit}
            onChange={(e) => set('unit', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Low Stock Alert When Below
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.low_stock_threshold}
          onChange={(e) => set('low_stock_threshold', parseFloat(e.target.value) || 0)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-400 mt-1">
          Alert when quantity drops to or below this number
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Expiry Date <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="date"
          value={form.expiry_date}
          onChange={(e) => set('expiry_date', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          placeholder="Brand, storage location, etc."
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-lg px-3 py-2">{error}</div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving || deleting}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition-colors"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {item ? 'Save Changes' : 'Add Item'}
        </button>

        {item && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving || deleting}
            className="flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
          >
            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            Delete
          </button>
        )}
      </div>
    </form>
  )
}
