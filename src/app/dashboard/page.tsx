import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  const { data: units, error } = await supabase.from("units").select("id, name, minimum_readiness").order("name");
  return <main><p className="eyebrow">Authenticated workspace</p><h1>Network readiness</h1><p className="lede">Signed in as {user.email}.</p>{error ? <p className="notice">Database data is not available yet: {error.message}</p> : <section><h2>Persisted units</h2><div className="cards">{units?.map((unit) => <article key={unit.id}><p>{unit.id}</p><h3>{unit.name}</h3><span>Minimum readiness: {unit.minimum_readiness}</span></article>)}</div></section>}</main>;
}
