"use client";

import { useManagedTournament } from "@/lib/useTournamentData";
import BracketView from "@/components/BracketView";
import styles from "@/app/page.module.css";
import { useParams, useRouter } from "next/navigation";

export default function BracketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { tournament, teams, matches, loading } = useManagedTournament(id);

  if (loading) {
    return <div className={styles.center}>Membuka gulungan bracket…</div>;
  }

  if (!tournament) {
    return (
      <div className={styles.center}>
        Bracket tidak ditemukan.{" "}
        <button onClick={() => router.push("/")} style={{ marginLeft: 8, background: "none", border: "none", color: "inherit", cursor: "pointer", textDecoration: "underline" }}>
          Kembali
        </button>
      </div>
    );
  }

  const finalMatch = matches.find((m) => !m.next_match_id);
  const champion = finalMatch?.winner_id
    ? teams.find((t) => t.id === finalMatch.winner_id)
    : null;

  return (
    <main className={styles.main}>
      <div className={styles.runeTopLeft} aria-hidden="true">✦</div>
      <div className={styles.runeTopRight} aria-hidden="true">✦</div>

      <button
        onClick={() => router.push("/")}
        style={{
          alignSelf: "flex-start",
          background: "none",
          border: "1px solid var(--gold-shadow)",
          color: "var(--parchment-dim)",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          letterSpacing: "0.12em",
          padding: "6px 14px",
          cursor: "pointer",
          marginBottom: 24,
          borderRadius: 1,
        }}
      >
        ← Daftar Turnamen
      </button>

      <header style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.2em", color: "var(--gold-dim)", fontFamily: "var(--font-body)", marginBottom: 6 }}>
          {tournament.season ? `SEASON ${tournament.season}` : "OPEN TOURNAMENT"}
        </div>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(24px, 5vw, 44px)",
          color: "var(--gold-bright)",
          margin: 0,
          textShadow: "0 0 20px var(--gold-glow)",
          letterSpacing: "0.06em"
        }}>
          {tournament.name}
        </h1>
      </header>

      <BracketView teams={teams} matches={matches} isAdmin={false} />

      {champion && (
        <div style={{
          marginTop: 36,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          padding: "18px 48px",
          background: "linear-gradient(90deg, var(--gold-shadow), var(--gold-mid), var(--gold-shadow))",
          boxShadow: "0 0 30px var(--gold-glow)",
          border: "1px solid var(--gold-mid)",
        }}>
          <span style={{ fontSize: 11, letterSpacing: "0.22em", color: "var(--bg-deep)", fontWeight: 700 }}>⚜ JUARA ⚜</span>
          <strong style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--bg-deep)" }}>{champion.name}</strong>
        </div>
      )}

      <footer className={styles.footer}>
        <span className={styles.ornDiamond}>◆</span>
        <a href="/admin/login" className={styles.footerLink}>Admin Portal</a>
        <span className={styles.ornDiamond}>◆</span>
      </footer>
    </main>
  );
}
