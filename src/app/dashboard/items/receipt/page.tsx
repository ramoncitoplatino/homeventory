'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ChevronLeft,
  Receipt,
  Upload,
  Loader2,
  CheckSquare,
  Square,
  Trash2,
  ScanLine,
} from 'lucide-react'
import { CATEGORIES, CATEGORY_CONFIG, UNITS, type Category } from '@/types'

interface ParsedItem {
  id: string
  name: string
  category: Category
  quantity: number
  unit: string
  selected: boolean
}

type Step = 'upload' | 'parsing' | 'review' | 'saving'

export default function ReceiptPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [preview, setPreview] = useState<string | null>(null)
  const [items, setItems] = useState<ParsedItem[]>([])
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  async function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WEBP, GIF)')
      return
    }
    setError('')

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      setStep('parsing')

      const [header, base64] = dataUrl.split(',')
      const mediaType = header.match(/data:(.*);base64/)?.[1] ?? 'image/jpeg'

      try {
        const res = await fetch('/api/parse-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mediaType }),
        })
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error ?? 'Failed to parse receipt')

        const parsed: ParsedItem[] = (
          data.items as Array<{ name: string; category: string; quantity: number; unit: string }>
        ).map((item, i) => ({
          id: String(i),
          name: item.name,
          category: (CATEGORIES.includes(item.category as Category)
            ? item.category
            : 'Other') as Category,
          quantity: Number(item.quantity) || 1,
          unit: UNITS.includes(item.unit) ? item.unit : 'pieces',
          selected: true,
        }))

        setItems(parsed)
        setStep('review')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse receipt')
        setStep('upload')
      }
    }
    reader.readAsDataURL(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function updateItem<K extends keyof ParsedItem>(id: string, field: K, value: ParsedItem[K]) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const selectedItems = items.filter((i) => i.selected)

  async function handleSave() {
    setStep('saving')
    setError('')

    const { error: err } = await supabase.from('items').insert(
      selectedItems.map((item) => ({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        low_stock_threshold: 1,
        updated_at: new Date().toISOString(),
      }))
    )

    if (err) {
      setError(err.message)
      setStep('review')
    } else {
      router.push('/dashboard/items')
      router.refresh()
    }
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/items"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft size={16} />
        Back to inventory
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 p-2.5 rounded-xl">
          <ScanLine className="text-indigo-600" size={22} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Scan Receipt</h2>
          <p className="text-sm text-gray-500">Upload a receipt photo to add items automatically</p>
        </div>
      </div>

      {/* Upload step */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors ${
              dragOver
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <Upload className="mx-auto text-gray-300 mb-4" size={44} />
            <p className="text-gray-700 font-medium">Drop your receipt here</p>
            <p className="text-sm text-gray-400 mt-1">or click to browse — JPG, PNG, WEBP, GIF</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) processFile(f)
                e.target.value = ''
              }}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <div className="bg-indigo-50 rounded-xl p-4 text-sm text-indigo-700">
            <strong>Powered by Claude AI</strong> — Claude reads your receipt and extracts household
            items, quantities, and categories automatically. You can review and edit everything
            before saving.
          </div>
        </div>
      )}

      {/* Parsing step */}
      {step === 'parsing' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          {preview && (
            <img
              src={preview}
              alt="Receipt preview"
              className="h-36 object-contain mx-auto mb-6 rounded-lg opacity-50"
            />
          )}
          <Loader2 className="animate-spin text-indigo-500 mx-auto mb-3" size={32} />
          <p className="font-medium text-gray-700">Analyzing receipt with Claude AI…</p>
          <p className="text-sm text-gray-400 mt-1">Extracting items, quantities, and categories</p>
        </div>
      )}

      {/* Review step */}
      {(step === 'review' || step === 'saving') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{items.length}</span> items found —{' '}
              <span className="font-semibold text-indigo-600">{selectedItems.length}</span> selected
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <button
                onClick={() => setItems((prev) => prev.map((i) => ({ ...i, selected: true })))}
                className="hover:text-gray-800 underline underline-offset-2"
              >
                Select all
              </button>
              <span className="text-gray-300">·</span>
              <button
                onClick={() => setItems((prev) => prev.map((i) => ({ ...i, selected: false })))}
                className="hover:text-gray-800 underline underline-offset-2"
              >
                Deselect all
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {items.map((item) => {
              const cfg = CATEGORY_CONFIG[item.category]
              return (
                <div
                  key={item.id}
                  className={`p-3.5 flex items-center gap-3 transition-opacity ${
                    !item.selected ? 'opacity-40' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => updateItem(item.id, 'selected', !item.selected)}
                    className="shrink-0 text-indigo-600"
                  >
                    {item.selected ? (
                      <CheckSquare size={18} />
                    ) : (
                      <Square size={18} className="text-gray-300" />
                    )}
                  </button>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-center min-w-0">
                    {/* Name */}
                    <input
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
                    />
                    {/* Category */}
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(item.id, 'category', e.target.value as Category)}
                      className={`border border-transparent rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${cfg.bg} ${cfg.color}`}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {/* Quantity + Unit */}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="w-16 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <select
                        value={item.unit}
                        onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                        className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="shrink-0 p-1.5 text-gray-300 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={selectedItems.length === 0 || step === 'saving'}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {step === 'saving' && <Loader2 size={15} className="animate-spin" />}
              Add {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} to inventory
            </button>
            <button
              onClick={() => {
                setStep('upload')
                setItems([])
                setPreview(null)
                setError('')
              }}
              disabled={step === 'saving'}
              className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Scan another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
