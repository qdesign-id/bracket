"use client";

import { createBrowserClient } from "@supabase/ssr";

let client = null;

export function getSupabaseBrowserClient() {
  // jangan jalan di server
  if (typeof window === "undefined") return null;

  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn("Supabase env belum di-set");
    return null;
  }

  client = createBrowserClient(url, anonKey);
  return client;
}
