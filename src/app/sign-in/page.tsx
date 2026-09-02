"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export default function SignInPage() {
  const [message, setMessage] = useState<string>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email")?.toString();
    if (!email) return;
    const { error } = await createSupabaseBrowserClient().auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setMessage(error ? error.message : "Check your inbox for a secure sign-in link.");
  }
  return <main><p className="eyebrow">Emergency Mesh</p><h1>Sign in</h1><p className="lede">Use an authorised email to access your unit’s private planning data.</p><form onSubmit={submit}><label>Email<input name="email" type="email" required /></label><button type="submit">Send sign-in link</button>{message && <p aria-live="polite">{message}</p>}</form></main>;
}
