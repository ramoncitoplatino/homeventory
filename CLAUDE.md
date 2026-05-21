# HomeVentory

## What This Is
Inventory System for Household items like soap, milk, softdrinks, etc
Users scan receipts to add latest stocks

## Tech Stack
- Framework: Next.js 16 (App Router, TypeScript)
- TypeScript (strict mode)
- Auth & Database: Supabase (Postgres + Row Level Security)
- Styling: Tailwind CSS
- Icons: Lucide React
- Vercel (deployment)

## Key Folders
- /app → App Router pages and layouts
- /app/parse-receipt → parse receipt via gemini
- /app/auth → Authentication via supabase
- /app/dashboard → inventory
- /app/lib/supabase.ts → Supabase client (don't touch)
- /app/login → login codes

## Coding Conventions
- Functional components only
- Named exports only (no default exports)
- Tailwind utility classes only (no inline styles, no custom CSS)
- All API routes must include try/catch with standard error format
- Use existing UI components from /components before creating new ones

## Never Do This
- Don't install new dependencies without explicit permission
- Don't modify /lib/supabase.ts or auth configuration
- Don't change component APIs without discussing first
- Don't add custom CSS files
- Don't use default exports

## Useful Commands
- `npm run dev` → local dev server (port 3000)
- `npm run build` → production build
- `npm run lint` → ESLint check
- `npx supabase status` → check Supabase connection

## Common Tasks
- Receipt scanning: OCR handled by /api/parse-receipt route using gemini
- Currency: Always display in PHP (₱)