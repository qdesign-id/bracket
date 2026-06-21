"use client";

import { useState, useEffect } from "react";
import { useAllTournaments } from "@/lib/useTournamentData";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function PublicHomePage() {
  const { tournaments, loading } = useAllTournaments();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBracketClick = (tournamentId) => {
    router.push(`/bracket/${tournamentId}`);
  };

  return (
    <main className={styles.main}>
      {/* Decorative corner runes */}
      <div className={styles.runeTopLeft} aria-hidden="true">✦</div>
      <div className={styles.runeTopRight} aria-hidden="true">✦</div>
      <div className={styles.runeBottomLeft} aria-hidden="true">✦</div>
      <div className={styles.runeBottomRight} aria-hidden="true">✦</div>

      {/* Hero / Welcome Section */}
      <section className={`${styles.hero} ${mounted ? styles.heroVisible : ""}`}>
        <div className={styles.heroOrnamentTop} aria-hidden="true">
          <span className={styles.ornLine} />
          <span className={styles.ornDiamond}>◆</span>
          <span className={styles.ornLine} />
        </div>

        <p className={styles.eyebrow}>— Selamat Datang di —</p>
        <h1 className={styles.title}>FAST TOURNAMENT</h1>
        <p className={styles.subtitle}>
          KIEL FIVE99
        </p>

        <div className={styles.heroOrnamentBottom} aria-hidden="true">
          <span className={styles.ornLine} />
          <span className={styles.ornDiamond}>◆</span>
          <span className={styles.ornLine} />
        </div>

        <p className={styles.welcomeText}>
          
        </p>

        {/* CTA Buttons */}
        <div className={styles.ctaGroup}>
          <a
            href="https://wa.me/6285774393019"
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.ctaBtn} ${styles.ctaBtnWhatsapp}`}
          >
            <span className={styles.ctaIcon}>⚔</span>
            <span>
              <span className={styles.ctaBtnLabel}>Daftar Turnamen</span>
              <span className={styles.ctaBtnSub}>via WhatsApp</span>
            </span>
          </a>

          <button
            className={`${styles.ctaBtn} ${styles.ctaBtnBracket}`}
            onClick={() => {
              const el = document.getElementById("bracket-list");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span className={styles.ctaIcon}>🜲</span>
            <span>
              <span className={styles.ctaBtnLabel}>Lihat Bracket</span>
              <span className={styles.ctaBtnSub}>Pilih turnamen</span>
            </span>
          </button>
        </div>
      </section>

      {/* Bracket List Section */}
      <section className={styles.bracketSection} id="bracket-list">
        <div className={styles.sectionHeader}>
          <span className={styles.ornLine} />
          <h2 className={styles.sectionTitle}>Daftar Turnamen</h2>
          <span className={styles.ornLine} />
        </div>

        {loading && (
          <p className={styles.stateText}>Membuka gulungan turnamen…</p>
        )}

        {!loading && tournaments.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📜</span>
            <p>Belum ada turnamen yang terdaftar.</p>
            <p className={styles.emptyHint}>Hubungi admin untuk membuat bracket baru.</p>
          </div>
        )}

        {!loading && tournaments.length > 0 && (
          <div className={styles.bracketGrid}>
            {tournaments.map((t) => (
              <button
                key={t.id}
                className={`${styles.bracketCard} ${t.is_active ? styles.bracketCardActive : ""}`}
                onClick={() => handleBracketClick(t.id)}
              >
                <div className={styles.cardCornerTL} aria-hidden="true" />
                <div className={styles.cardCornerTR} aria-hidden="true" />
                <div className={styles.cardCornerBL} aria-hidden="true" />
                <div className={styles.cardCornerBR} aria-hidden="true" />

                {t.is_active && (
                  <span className={styles.activeBadge}>● AKTIF</span>
                )}
                <span className={styles.cardSeason}>
                  {t.season ? `Season ${t.season}` : "Open Tournament"}
                </span>
                <h3 className={styles.cardName}>{t.name}</h3>
                <span className={styles.cardTeams}>{t.num_teams} Tim</span>
                <span className={styles.cardCta}>Buka Bracket →</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        <span className={styles.ornDiamond}>◆</span>
        <a href="/admin/login" className={styles.footerLink}>Admin Portal</a>
        <span className={styles.ornDiamond}>◆</span>
      </footer>
    </main>
  );
}
