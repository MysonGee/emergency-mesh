import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-safe client for fictional demo reads. Consequential writes remain in
 * server-side application services so the public client cannot bypass approval.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase is not configured. Add the public project URL and publishable key to .env.local.");
  }

  return createBrowserClient(url, publishableKey);
}
