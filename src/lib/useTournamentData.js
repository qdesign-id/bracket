"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "./supabaseClient";

/* =========================
   ACTIVE TOURNAMENT (PUBLIC)
========================= */
export function useTournamentData() {
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) {
    supabaseRef.current = getSupabaseBrowserClient();
  }
  const supabase = supabaseRef.current;

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
      supabase
        .from("teams")
        .select("*")
        .eq("tournament_id", active.id)
        .order("seed"),
      supabase.from("matches").select("*").eq("tournament_id", active.id),
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        fetchAll
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        fetchAll
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournaments" },
        fetchAll
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchAll, supabase]);

  return { tournament, teams, matches, loading, error, refetch: fetchAll };
}

/* =========================
   ADMIN TOURNAMENT (BY ID)
========================= */
export function useManagedTournament(tournamentId) {
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) {
    supabaseRef.current = getSupabaseBrowserClient();
  }
  const supabase = supabaseRef.current;

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
      supabase
        .from("tournaments")
        .select("*")
        .eq("id", tournamentId)
        .single(),
      supabase
        .from("teams")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("seed"),
      supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tournamentId),
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
        {
          event: "*",
          schema: "public",
          table: "matches",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        fetchAll
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        fetchAll
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tournaments",
          filter: `id=eq.${tournamentId}`,
        },
        fetchAll
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchAll, supabase, tournamentId]);

  return { tournament, teams, matches, loading, refetch: fetchAll };
}

/* =========================
   ALL TOURNAMENTS (ADMIN)
========================= */
export function useAllTournaments() {
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) {
    supabaseRef.current = getSupabaseBrowserClient();
  }
  const supabase = supabaseRef.current;

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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tournaments" },
        fetchAll
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchAll, supabase]);

  return { tournaments, loading, refetch: fetchAll };
}
