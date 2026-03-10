# ✂️ Scissors™ Men's Beauty Lounge — Booking System

Full-stack appointment booking web app built with **Next.js 14 + TypeScript + Supabase**.

## Features
- 6-step booking wizard: Branch → Services → **Staff** → Date → Time → Details
- Smart slot blocking (per-staff, per-branch, duration-aware)
- Admin panel: Dashboard, Bookings, Staff CRUD, Services CRUD, Calendar
- Black & gold premium theme from logo
- Mobile-first, fully responsive PWA-ready
- Real-time data from Supabase

---

## 🚀 Setup in 5 Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Open **SQL Editor** → New Query
3. Paste contents of `supabase/schema.sql` → Run

### 2. Get API Keys
Supabase Dashboard → Settings → API:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configure Environment
```bash
cp .env.local.example .env.local
# Fill in your Supabase credentials
```

### 4. Add Logo
Place your `Scissors_Logo.png` in the `/public/` folder.

### 5. Install & Run
```bash
npm install
npm run dev
# → http://localhost:3000
```

---

## 📱 Pages
| Route | Description |
|---|---|
| `/` | Home page with hero, services, branches |
| `/book` | 6-step booking wizard |
| `/success` | Booking confirmation screen |
| `/admin` | Admin login (password: `scissors2025`) |
| `/admin/dashboard` | Full admin panel |

---

## 🎯 Admin Panel (password: `scissors2025`)
- **Overview** — KPIs, bar chart, branch split, top services
- **Bookings** — Search, filter, cancel/complete/restore
- **Staff** — Add/edit/delete staff, assign branch & services
- **Services** — Add/edit services with pricing & duration
- **Calendar** — Day-by-day timeline view with appointment details

---

## 🔒 Slot Blocking Logic
When a customer books at **1:00 PM** for a service lasting **45 minutes**:
- The system blocks all time slots from **1:00 PM → 1:45 PM** for that staff member
- Other staff at the same branch remain available
- Blocked slots show red "BOOKED" label — cannot be selected

---

## 🛠 Tech Stack
- **Next.js 14** — App Router, TypeScript
- **Supabase** — PostgreSQL + RLS + Realtime
- **Tailwind CSS** — Utility-first styling
- **Framer Motion** — Animations (optional)
- **Google Fonts** — Cormorant Garamond + Outfit

---

## 🚢 Deploy to Vercel
```bash
npm i -g vercel
vercel
# Add env vars in Vercel Dashboard → Project Settings → Environment Variables
```

---

## 📞 Branches
- **Branch 1 — Main Road**: +91 98765 43210
- **Branch 2 — New Bus Stand**: +91 98765 43211

Update phone numbers and branch details in `supabase/schema.sql` or directly in Supabase Table Editor.
