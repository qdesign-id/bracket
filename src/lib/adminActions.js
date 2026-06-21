import { getSupabaseBrowserClient } from "./supabaseClient";
import { buildNewTournamentPayload } from "./bracketLogic";

// Creates a tournament + all its teams + the full bracket of matches
// (fully linked round-to-round), in three safe steps so foreign keys never
// point at a row that doesn't exist yet.
export async function createTournament({ name, season, numTeams }) {
  const supabase = getSupabaseBrowserClient();
  const tournamentId = crypto.randomUUID();
  const { teams, matches } = buildNewTournamentPayload({ tournamentId, numTeams });

  const { error: tErr } = await supabase
    .from("tournaments")
    .insert({ id: tournamentId, name, season, num_teams: numTeams, is_active: false });
  if (tErr) throw tErr;

  const { error: teamsErr } = await supabase.from("teams").insert(teams);
  if (teamsErr) throw teamsErr;

  // Step 1: insert every match WITHOUT the forward-pointing next_match_id yet.
  const matchesWithoutLinks = matches.map(({ next_match_id, next_slot, ...rest }) => rest);
  const { error: matchesErr } = await supabase.from("matches").insert(matchesWithoutLinks);
  if (matchesErr) throw matchesErr;

  // Step 2: now that every match row exists, fill in the next_match_id links.
  const linkUpdates = matches
    .filter((m) => m.next_match_id)
    .map((m) =>
      supabase
        .from("matches")
        .update({ next_match_id: m.next_match_id, next_slot: m.next_slot })
        .eq("id", m.id)
    );
  await Promise.all(linkUpdates);

  return tournamentId;
}

export async function deleteTournament(tournamentId) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("tournaments").delete().eq("id", tournamentId);
  if (error) throw error;
}

export async function setActiveTournament(tournamentId) {
  const supabase = getSupabaseBrowserClient();
  // Only one tournament can be "published" (publicly visible) at a time.
  const { error: clearErr } = await supabase
    .from("tournaments")
    .update({ is_active: false })
    .eq("is_active", true);
  if (clearErr) throw clearErr;

  const { error: setErr } = await supabase
    .from("tournaments")
    .update({ is_active: true })
    .eq("id", tournamentId);
  if (setErr) throw setErr;
}

export async function renameTournament(tournamentId, { name, season }) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("tournaments").update({ name, season }).eq("id", tournamentId);
  if (error) throw error;
}

export async function renameTeam(teamId, name) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("teams").update({ name }).eq("id", teamId);
  if (error) throw error;
}

// Uploads a logo image to the "logos" storage bucket and saves its public URL on the team.
export async function uploadTeamLogo(teamId, file) {
  const supabase = getSupabaseBrowserClient();
  const ext = file.name.split(".").pop() || "png";
  const path = `${teamId}-${Date.now()}.${ext}`;

  const { error: uploadErr } = await supabase.storage.from("logos").upload(path, file, {
    upsert: true,
    cacheControl: "3600"
  });
  if (uploadErr) throw uploadErr;

  const { data } = supabase.storage.from("logos").getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const { error: updateErr } = await supabase.from("teams").update({ logo_url: publicUrl }).eq("id", teamId);
  if (updateErr) throw updateErr;

  return publicUrl;
}

// Sets the winner of a match and, if there's a next round, advances the
// winner into the correct slot of the next match automatically.
export async function setMatchWinner(match, winnerTeam) {
  const supabase = getSupabaseBrowserClient();

  const { error: matchErr } = await supabase
    .from("matches")
    .update({ winner_id: winnerTeam.id })
    .eq("id", match.id);
  if (matchErr) throw matchErr;

  if (match.next_match_id) {
    const field = match.next_slot === 1 ? "team1_id" : "team2_id";
    const { error: nextErr } = await supabase
      .from("matches")
      .update({ [field]: winnerTeam.id })
      .eq("id", match.next_match_id);
    if (nextErr) throw nextErr;
  }
}

// Clears a previously set winner (in case the admin made a mistake) and
// removes that team from whatever next-round slot it had advanced to.
export async function clearMatchWinner(match) {
  const supabase = getSupabaseBrowserClient();

  const { error: matchErr } = await supabase
    .from("matches")
    .update({ winner_id: null })
    .eq("id", match.id);
  if (matchErr) throw matchErr;

  if (match.next_match_id) {
    const field = match.next_slot === 1 ? "team1_id" : "team2_id";
    const { error: nextErr } = await supabase
      .from("matches")
      .update({ [field]: null })
      .eq("id", match.next_match_id);
    if (nextErr) throw nextErr;
  }
}
