// Pure helper functions for building and reading single-elimination bracket data.
// No Supabase calls in here, so it's easy to reason about / unit test separately.

export const ALLOWED_TEAM_COUNTS = [4, 8, 16, 32];

// Returns e.g. for 16 teams: [{round:0, matchCount:8, label:"1/8"}, {round:1, matchCount:4, label:"1/4"}, {round:2, matchCount:2, label:"1/2"}, {round:3, matchCount:1, label:"FINAL"}]
export function getRoundPlan(numTeams) {
  const totalRounds = Math.log2(numTeams);
  const plan = [];
  let matchCount = numTeams / 2;
  for (let round = 0; round < totalRounds; round++) {
    plan.push({
      round,
      matchCount,
      label: matchCount === 1 ? "FINAL" : `1/${matchCount}`
    });
    matchCount = matchCount / 2;
  }
  return plan;
}

// Groups flat matches (from the DB) into rounds, each round sorted by match_index.
export function groupMatchesByRound(matches) {
  const byRound = new Map();
  for (const match of matches) {
    if (!byRound.has(match.round)) byRound.set(match.round, []);
    byRound.get(match.round).push(match);
  }
  for (const list of byRound.values()) {
    list.sort((a, b) => a.match_index - b.match_index);
  }
  return [...byRound.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([round, roundMatches]) => ({ round, matches: roundMatches }));
}

export function getTeamById(teams, id) {
  if (!id) return null;
  return teams.find((t) => t.id === id) || null;
}

// Builds the insert payloads for a brand-new tournament: teams + every match
// across every round, fully linked via next_match_id / next_slot.
// This only returns plain objects — the caller is responsible for the actual
// Supabase inserts (see admin dashboard "create tournament" action).
export function buildNewTournamentPayload({ tournamentId, numTeams }) {
  const teamIds = Array.from({ length: numTeams }, () => cryptoRandomId());
  const teams = teamIds.map((id, i) => ({
    id,
    tournament_id: tournamentId,
    name: `Team ${i + 1}`,
    logo_url: null,
    seed: i + 1
  }));

  const plan = getRoundPlan(numTeams);
  const roundsMatchIds = []; // roundsMatchIds[round] = [matchId, matchId, ...]
  const matches = [];

  plan.forEach(({ round, matchCount }) => {
    const idsThisRound = [];
    for (let i = 0; i < matchCount; i++) {
      const id = cryptoRandomId();
      idsThisRound.push(id);

      const isFirstRound = round === 0;
      matches.push({
        id,
        tournament_id: tournamentId,
        round,
        match_index: i,
        team1_id: isFirstRound ? teamIds[i * 2] : null,
        team2_id: isFirstRound ? teamIds[i * 2 + 1] : null,
        score1: null,
        score2: null,
        winner_id: null,
        next_match_id: null,
        next_slot: null
      });
    }
    roundsMatchIds.push(idsThisRound);
  });

  // Link each match to where its winner goes next.
  for (let round = 0; round < roundsMatchIds.length - 1; round++) {
    const currentRoundIds = roundsMatchIds[round];
    const nextRoundIds = roundsMatchIds[round + 1];
    currentRoundIds.forEach((matchId, i) => {
      const match = matches.find((m) => m.id === matchId);
      match.next_match_id = nextRoundIds[Math.floor(i / 2)];
      match.next_slot = i % 2 === 0 ? 1 : 2;
    });
  }

  return { teams, matches };
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback (very unlikely to be needed in modern Node/browser runtimes).
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
