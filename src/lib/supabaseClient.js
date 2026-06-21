"use client";

import { createBrowserClient } from "@supabase/ssr";

let client;

// Singleton browser client. Safe to call multiple times across components.
export function getSupabaseBrowserClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase belum dikonfigurasi. Cek NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local / Vercel env vars."
    );
  }

  client = createBrowserClient(url, anonKey);
  return client;
}
