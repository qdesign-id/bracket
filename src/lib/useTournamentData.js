"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "./supabaseClient";

/* ================= PUBLIC ================= */
export function useTournamentData() {
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = getSupabaseBrowserClient();
  const supabase = supabaseRef.current;

  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!supabase) return;

    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .eq("is_active", true)
      .limit(1);

    const active = data?.[0] || null;
    setTournament(active);

    if (!active) {
      setTeams([]);
      setMatches([]);
      setLoading(false);
      return;
    }

    const [teamsRes, matchesRes] = await Promise.all([
      supabase.from("teams").select("*").eq("tournament_id", active.id),
      supabase.from("matches").select("*").eq("tournament_id", active.id),
    ]);

    setTeams(teamsRes.data || []);
    setMatches(matchesRes.data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAll();

    if (!supabase || typeof window === "undefined") return;

    const channel = supabase
      .channel("live")
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
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchAll, supabase]);

  return { tournament, teams, matches, loading, refetch: fetchAll };
}

/* ================= ADMIN SINGLE ================= */
export function useManagedTournament(tournamentId) {
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = getSupabaseBrowserClient();
  const supabase = supabaseRef.current;

  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!supabase || !tournamentId) return;

    const [tRes, teamsRes, matchesRes] = await Promise.all([
      supabase.from("tournaments").select("*").eq("id", tournamentId).single(),
      supabase.from("teams").select("*").eq("tournament_id", tournamentId),
      supabase.from("matches").select("*").eq("tournament_id", tournamentId),
    ]);

    setTournament(tRes.data || null);
    setTeams(teamsRes.data || []);
    setMatches(matchesRes.data || []);
    setLoading(false);
  }, [supabase, tournamentId]);

  useEffect(() => {
    fetchAll();
    if (!supabase || !tournamentId || typeof window === "undefined") return;

    const channel = supabase
      .channel(`admin-${tournamentId}`)
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
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchAll, supabase, tournamentId]);

  return { tournament, teams, matches, loading, refetch: fetchAll };
}

/* ================= ALL TOURNAMENTS ================= */
export function useAllTournaments() {
  const supabaseRef = useRef(null);
  if (!supabaseRef.current) supabaseRef.current = getSupabaseBrowserClient();
  const supabase = supabaseRef.current;

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!supabase) return;

    const { data } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false });

    setTournaments(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAll();

    if (!supabase || typeof window === "undefined") return;

    const channel = supabase
      .channel("tournaments")
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
