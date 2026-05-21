import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const CATEGORIES = ['Food & Beverages', 'Cleaning Supplies', 'Personal Care', 'Kitchen', 'Laundry', 'Other']
const UNITS = ['pieces', 'bottles', 'cans', 'boxes', 'bags', 'liters', 'ml', 'kg', 'g', 'rolls', 'packs']

export async function POST(request: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured in .env.local' }, { status: 500 })
  }

  const { imageBase64, mediaType } = await request.json()

  if (!imageBase64 || !mediaType) {
    return NextResponse.json({ error: 'Missing imageBase64 or mediaType' }, { status: 400 })
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  })

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mediaType,
        data: imageBase64,
      },
    },
    {
      text: `Parse this receipt and return a JSON array of household items.

Output format (JSON array only, no explanation):
[{"name":"...","category":"...","quantity":1,"unit":"..."}]

Rules:
- Include only physical household products (food, drinks, cleaning, personal care, kitchen, laundry items)
- Skip: taxes, fees, deposits, discounts, totals, warranties, store name, cashier, receipt number
- name: normalize abbreviations (e.g. "WHL MLK 1L" → "Whole Milk", "DW LIQ 500ML" → "Dishwashing Liquid")
- category: must be exactly one of: ${CATEGORIES.join(' | ')}
- quantity: use the number printed on the receipt; default to 1 if unclear
- unit: must be exactly one of: ${UNITS.join(' | ')} — pick the most appropriate`,
    },
  ])

  const raw = result.response.text().trim()

  // Strip markdown code fences if present
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()

  try {
    const items = JSON.parse(clean)
    if (!Array.isArray(items)) throw new Error('Not an array')
    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: 'Could not parse receipt items', raw }, { status: 422 })
  }
}
