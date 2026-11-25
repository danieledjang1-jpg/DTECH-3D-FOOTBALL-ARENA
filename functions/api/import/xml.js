function unescapeXml(s) { return s.replaceAll("&lt;","<").replaceAll("&gt;",">").replaceAll("&quot;",'"').replaceAll("&apos;","'").replaceAll("&amp;","&"); }
function getTag(xml, tag) { const m = xml.match(new RegExp(`<${tag}>([\\\\s\\\\S]*?)</${tag}>`)); return m ? unescapeXml(m[1]) : ""; }
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const xml = body.xml;
    if (typeof xml !== "string" || !xml.includes("<matches")) return Response.json({ error: "Expected a matches XML document." }, { status: 400 });
    const matches = [...xml.matchAll(/<match>([\s\S]*?)<\/match>/g)].map(m => m[1]);
    let imported = 0;
    for (const item of matches) {
      const matchId = getTag(item,"matchId");
      if (!matchId) continue;
      const homeTeam = getTag(item,"homeTeam") || "Imported team";
      const awayTeam = getTag(item,"awayTeam") || "Imported team";
      const homeScore = Number(getTag(item,"homeScore") || 0);
      const awayScore = Number(getTag(item,"awayScore") || 0);
      const status = getTag(item,"status") || "Imported";
      const duration = getTag(item,"duration") || "Imported";
      const playedAt = getTag(item,"playedAt") || new Date().toISOString();
      const result = await env.DB.prepare("INSERT OR IGNORE INTO matches (match_id, home_team, away_team, home_score, away_score, status, duration, played_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(matchId, homeTeam, awayTeam, homeScore, awayScore, status, duration, playedAt).run();
      imported += result.meta.changes || 0;
    }
    return Response.json({ message: `Imported ${imported} new match(es).` });
  } catch {
    return Response.json({ error: "Could not import this XML." }, { status: 400 });
  }
}
