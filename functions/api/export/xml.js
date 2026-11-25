function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}
export async function onRequestGet({ env }) {
  const { results = [] } = await env.DB.prepare(
    "SELECT match_id AS matchId, home_team AS homeTeam, away_team AS awayTeam, home_score AS homeScore, away_score AS awayScore, status, duration, played_at AS playedAt FROM matches ORDER BY played_at DESC"
  ).all();
  const records = results.map(m => `<match><matchId>${esc(m.matchId)}</matchId><homeTeam>${esc(m.homeTeam)}</homeTeam><awayTeam>${esc(m.awayTeam)}</awayTeam><homeScore>${m.homeScore}</homeScore><awayScore>${m.awayScore}</awayScore><status>${esc(m.status)}</status><duration>${esc(m.duration)}</duration><playedAt>${esc(m.playedAt)}</playedAt></match>`).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<matches>${records}</matches>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Content-Disposition": "attachment; filename=matches.xml" } });
}
