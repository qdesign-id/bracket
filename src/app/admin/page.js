"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import { useAllTournaments, useManagedTournament } from "@/lib/useTournamentData";
import {
  createTournament,
  deleteTournament,
  setActiveTournament,
  renameTournament,
  renameTeam,
  uploadTeamLogo,
  setMatchWinner,
  clearMatchWinner
} from "@/lib/adminActions";
import BracketView from "@/components/BracketView";
import styles from "./admin.module.css";

const TEAM_COUNT_OPTIONS = [8, 16, 32];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { tournaments, refetch: refetchTournaments } = useAllTournaments();
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!selectedId && tournaments.length > 0) {
      const active = tournaments.find((t) => t.is_active);
      setSelectedId((active || tournaments[0]).id);
    }
  }, [tournaments, selectedId]);

  const { tournament, teams, matches, loading, refetch } = useManagedTournament(selectedId);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  async function runAction(fn) {
    setBusy(true);
    setErrorMsg(null);
    try {
      await fn();
    } catch (err) {
      setErrorMsg(err.message || "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.topbar}>
        <h1 className={styles.brand}>Block League — Admin</h1>
        <button className="btn btn-outline" onClick={handleLogout}>
          Keluar
        </button>
      </div>

      {errorMsg && <div className={styles.errorBanner}>{errorMsg}</div>}

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Turnamen</h2>
        <TournamentSwitcher
          tournaments={tournaments}
          selectedId={selectedId}
          onSelect={setSelectedId}
          busy={busy}
          onSetActive={(id) => runAction(async () => { await setActiveTournament(id); await refetchTournaments(); })}
          onDelete={(id) =>
            runAction(async () => {
              await deleteTournament(id);
              setSelectedId(null);
              await refetchTournaments();
            })
          }
        />

        <CreateTournamentForm
          busy={busy}
          onCreate={({ name, season, numTeams }) =>
            runAction(async () => {
              const id = await createTournament({ name, season, numTeams });
              await refetchTournaments();
              setSelectedId(id);
            })
          }
        />
      </section>

      {tournament && (
        <>
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>
              Detail Turnamen {tournament.is_active && <span className={styles.activeBadge}>PUBLISHED</span>}
            </h2>
            <TournamentDetailsForm
              tournament={tournament}
              busy={busy}
              onSave={({ name, season }) =>
                runAction(async () => {
                  await renameTournament(tournament.id, { name, season });
                  await refetch();
                  await refetchTournaments();
                })
              }
            />
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Tim ({teams.length})</h2>
            <p className={styles.hint}>
              Ubah nama tim dan logo. Perubahan langsung tersinkron ke semua orang yang sedang melihat bracket.
            </p>
            <TeamGrid
              teams={teams}
              busy={busy}
              onRename={(teamId, name) => runAction(async () => { await renameTeam(teamId, name); })}
              onUploadLogo={(teamId, file) => runAction(async () => { await uploadTeamLogo(teamId, file); })}
            />
          </section>

          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Bracket</h2>
            <p className={styles.hint}>
              Klik nama tim untuk menandainya sebagai pemenang pertandingan. Pemenang otomatis maju ke babak berikutnya.
            </p>
            {loading ? (
              <p className={styles.hint}>Memuat bracket...</p>
            ) : (
              <BracketView
                teams={teams}
                matches={matches}
                isAdmin
                onSetWinner={(match, team) =>
                  runAction(async () => {
                    if (match.winner_id === team.id) {
                      await clearMatchWinner(match);
                    } else {
                      await setMatchWinner(match, team);
                    }
                  })
                }
              />
            )}
          </section>
        </>
      )}
    </main>
  );
}

function TournamentSwitcher({ tournaments, selectedId, onSelect, onSetActive, onDelete, busy }) {
  if (tournaments.length === 0) {
    return <p className="hint">Belum ada turnamen. Buat satu di bawah ini.</p>;
  }

  return (
    <div className={styles.switcherRow}>
      <select
        value={selectedId || ""}
        onChange={(e) => onSelect(e.target.value)}
        className={styles.select}
      >
        {tournaments.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} {t.season ? `(${t.season})` : ""} {t.is_active ? "★ published" : ""}
          </option>
        ))}
      </select>

      <button
        className="btn"
        disabled={busy || !selectedId}
        onClick={() => onSetActive(selectedId)}
      >
        Jadikan Aktif (Publish)
      </button>

      <button
        className="btn btn-danger"
        disabled={busy || !selectedId}
        onClick={() => {
          if (confirm("Hapus turnamen ini beserta semua tim & pertandingannya? Tindakan ini tidak bisa dibatalkan.")) {
            onDelete(selectedId);
          }
        }}
      >
        Hapus
      </button>
    </div>
  );
}

function CreateTournamentForm({ onCreate, busy }) {
  const [name, setName] = useState("");
  const [season, setSeason] = useState("");
  const [numTeams, setNumTeams] = useState(16);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), season: season.trim(), numTeams: Number(numTeams) });
    setName("");
    setSeason("");
  }

  return (
    <form className={styles.createForm} onSubmit={handleSubmit}>
      <h3 className={styles.subTitle}>Buat Turnamen Baru</h3>
      <div className={styles.formRow}>
        <label>
          Nama Liga
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Block League" required />
        </label>
        <label>
          Season / Label
          <input value={season} onChange={(e) => setSeason(e.target.value)} placeholder="2023" />
        </label>
        <label>
          Jumlah Tim
          <select value={numTeams} onChange={(e) => setNumTeams(e.target.value)}>
            {TEAM_COUNT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} tim
              </option>
            ))}
          </select>
        </label>
      </div>
      <button type="submit" className="btn" disabled={busy}>
        {busy ? "Membuat..." : "Buat Bracket"}
      </button>
    </form>
  );
}

function TournamentDetailsForm({ tournament, onSave, busy }) {
  const [name, setName] = useState(tournament.name);
  const [season, setSeason] = useState(tournament.season || "");

  useEffect(() => {
    setName(tournament.name);
    setSeason(tournament.season || "");
  }, [tournament.id, tournament.name, tournament.season]);

  return (
    <form
      className={styles.formRow}
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ name, season });
      }}
    >
      <label>
        Nama Liga
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Season / Label
        <input value={season} onChange={(e) => setSeason(e.target.value)} />
      </label>
      <button type="submit" className="btn btn-outline" disabled={busy}>
        Simpan
      </button>
    </form>
  );
}

function TeamGrid({ teams, onRename, onUploadLogo, busy }) {
  return (
    <div className={styles.teamGrid}>
      {teams.map((team) => (
        <TeamRow key={team.id} team={team} onRename={onRename} onUploadLogo={onUploadLogo} busy={busy} />
      ))}
    </div>
  );
}

function TeamRow({ team, onRename, onUploadLogo, busy }) {
  const [name, setName] = useState(team.name);

  useEffect(() => setName(team.name), [team.name]);

  return (
    <div className={styles.teamRow}>
      <label className={styles.logoUpload}>
        {team.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={team.logo_url} alt="" className={styles.logoPreview} />
        ) : (
          <span className={styles.logoPlaceholder}>+</span>
        )}
        <input
          type="file"
          accept="image/*"
          hidden
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadLogo(team.id, file);
          }}
        />
      </label>

      <input
        className={styles.teamNameInput}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          if (name.trim() && name !== team.name) onRename(team.id, name.trim());
        }}
        disabled={busy}
      />
    </div>
  );
}
