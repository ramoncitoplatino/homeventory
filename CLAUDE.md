@AGENTS.md
Home Inventory — a web app to track household consumables so you never run out of essentials.

What it does
Track items — milk, dishwashing liquid, shampoo, cleaning supplies, etc. with quantity, unit, category, expiry date, and a low-stock threshold
Dashboard — overview of total items, low stock count, and expiry alerts at a glance
Alerts — flags items that are expired (red), expiring within 7 days (amber), or running low (orange)
Receipt scanning — take a photo of a grocery receipt and Claude AI (Gemini Flash) reads it and auto-populates items into the inventory
Autocomplete — when adding items manually, a dropdown suggests from 110 preset household items plus anything you've added before
Auth — each user has their own private inventory (email/password login via Supabase)
Categories
Food & Beverages · Cleaning Supplies · Personal Care · Kitchen · Laundry · Other

Tech stack
Layer	Tech
Framework	Next.js 16 (App Router, TypeScript)
Styling	Tailwind CSS
Auth & Database	Supabase (Postgres + Row Level Security)
AI receipt parsing	Google Gemini 2.0 Flash (free tier)
Icons	Lucide React