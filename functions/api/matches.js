export async function onRequestGet({ env }) {
  const { results = [] } = await env.DB.prepare(
    "SELECT match_id AS matchId, home_team AS homeTeam, away_team AS awayTeam, home_score AS homeScore, away_score AS awayScore, status, duration, played_at AS playedAt FROM matches ORDER BY played_at DESC"
  ).all();
  return Response.json(results);
}
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { homeTeam, awayTeam, homeScore, awayScore, duration } = body;
    if (typeof homeTeam !== "string" || typeof awayTeam !== "string" ||
        !Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
      return Response.json({ error: "Invalid match result." }, { status: 400 });
    }
    const match = {
      matchId: "DTECH-" + crypto.randomUUID(),
      homeTeam, awayTeam, homeScore, awayScore,
      status: "Completed", duration: String(duration || "2 minutes"),
      playedAt: new Date().toISOString()
    };
    await env.DB.prepare("INSERT INTO matches (match_id, home_team, away_team, home_score, away_score, status, duration, played_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(match.matchId, match.homeTeam, match.awayTeam, match.homeScore, match.awayScore, match.status, match.duration, match.playedAt).run();
    return Response.json({ message: "Match saved.", match }, { status: 201 });
  } catch {
    return Response.json({ error: "Could not save match." }, { status: 500 });
  }
}
