"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "./supabaseClient";

// Fetches the currently active tournament (teams + matches) and keeps it in
// sync live via Supabase Realtime. Any insert/update/delete on tournaments,
// teams or matches anywhere (made by an admin, on any device) triggers an
// automatic refetch here, on every connected client — that's what makes the
// public bracket page update in real time.
export function useTournamentData() {
  const supabase = getSupabaseBrowserClient();
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setError(null);

    const { data: tournaments, error: tErr } = await supabase
      .from("tournaments")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (tErr) {
      setError(tErr.message);
      setLoading(false);
      return;
    }

    const active = tournaments?.[0] || null;
    setTournament(active);

    if (!active) {
      setTeams([]);
      setMatches([]);
      setLoading(false);
      return;
    }

    const [teamsRes, matchesRes] = await Promise.all([
      supabase.from("teams").select("*").eq("tournament_id", active.id).order("seed"),
      supabase.from("matches").select("*").eq("tournament_id", active.id)
    ]);

    if (teamsRes.error) setError(teamsRes.error.message);
    if (matchesRes.error) setError(matchesRes.error.message);

    setTeams(teamsRes.data || []);
    setMatches(matchesRes.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("bracket-live-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "teams" }, fetchAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "tournaments" }, fetchAll)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll, supabase]);

  return { tournament, teams, matches, loading, error, refetch: fetchAll };
}

// For the admin dashboard: load + live-sync a specific tournament by id,
// regardless of whether it's the currently published/active one. Lets an
// admin draft a future bracket before publishing it.
export function useManagedTournament(tournamentId) {
  const supabase = getSupabaseBrowserClient();
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!tournamentId) {
      setTournament(null);
      setTeams([]);
      setMatches([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [tRes, teamsRes, matchesRes] = await Promise.all([
      supabase.from("tournaments").select("*").eq("id", tournamentId).single(),
      supabase.from("teams").select("*").eq("tournament_id", tournamentId).order("seed"),
      supabase.from("matches").select("*").eq("tournament_id", tournamentId)
    ]);

    setTournament(tRes.data || null);
    setTeams(teamsRes.data || []);
    setMatches(matchesRes.data || []);
    setLoading(false);
  }, [supabase, tournamentId]);

  useEffect(() => {
    fetchAll();
    if (!tournamentId) return;

    const channel = supabase
      .channel(`admin-tournament-${tournamentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches", filter: `tournament_id=eq.${tournamentId}` },
        fetchAll
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams", filter: `tournament_id=eq.${tournamentId}` },
        fetchAll
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournaments", filter: `id=eq.${tournamentId}` },
        fetchAll
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchAll, supabase, tournamentId]);

  return { tournament, teams, matches, loading, refetch: fetchAll };
}

// Same idea but for the admin dashboard, which needs the full list of
// tournaments (not just the active one) so the admin can switch/manage any of them.
export function useAllTournaments() {
  const supabase = getSupabaseBrowserClient();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false });
    setTournaments(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel("admin-tournaments-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "tournaments" }, fetchAll)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchAll, supabase]);

  return { tournaments, loading, refetch: fetchAll };
}
