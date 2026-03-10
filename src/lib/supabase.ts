// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase instance (anon key)
export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
});

// Server-side admin client (service role) — only used in API routes
export function getAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
