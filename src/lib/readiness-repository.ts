import { createSupabaseBrowserClient } from "./supabase";

/**
 * Read-only persistence adapter. The solver deliberately receives plain domain
 * objects; it never calls Supabase itself, which keeps its output deterministic
 * and easy to test.
 */
export async function loadShareableUnitSummaries() {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("units")
    .select("id, name, minimum_readiness")
    .order("name");

  if (error) throw new Error(`Unable to load fictional unit summaries: ${error.message}`);
  return data;
}
