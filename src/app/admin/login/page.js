"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import styles from "./login.module.css";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setLoading(false);

    if (signInError) {
      setError("Email atau password salah.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className={styles.main}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Admin Login</h1>
        <p className={styles.hint}>
          Masuk dengan akun admin yang sudah dibuat di Supabase (lihat README, bagian
          &quot;Membuat akun admin&quot;).
        </p>

        <label className={styles.label}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>

        <label className={styles.label}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Memproses..." : "Masuk"}
        </button>

        <a href="/" className={styles.backLink}>
          ← Kembali ke bracket
        </a>
      </form>
    </main>
  );
}
