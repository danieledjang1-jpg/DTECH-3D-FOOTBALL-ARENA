export async function onRequestGet({ env }) {
  const { results = [] } = await env.DB.prepare(
    "SELECT match_id AS matchId, home_team AS homeTeam, away_team AS awayTeam, home_score AS homeScore, away_score AS awayScore, status, duration, played_at AS playedAt FROM matches ORDER BY played_at DESC"
  ).all();
  return new Response(JSON.stringify(results, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": "attachment; filename=matches.json" }
  });
}
