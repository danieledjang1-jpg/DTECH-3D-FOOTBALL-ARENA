const express = require("express");
const fs = require("fs");
const path = require("path");
const { XMLBuilder, XMLParser } = require("fast-xml-parser");

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, "data");
const jsonFile = path.join(dataDir, "matches.json");
const xmlFile = path.join(dataDir, "matches.xml");

fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(jsonFile)) fs.writeFileSync(jsonFile, "[]", "utf8");
if (!fs.existsSync(xmlFile)) fs.writeFileSync(xmlFile, '<?xml version="1.0" encoding="UTF-8"?>\n<matches></matches>\n', "utf8");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

function readMatches() {
  const rows = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  return Array.isArray(rows) ? rows : [];
}
function writeMatches(rows) {
  fs.writeFileSync(jsonFile, JSON.stringify(rows, null, 2), "utf8");
  const builder = new XMLBuilder({ format: true });
  const xml = builder.build({ matches: { match: rows } });
  fs.writeFileSync(xmlFile, '<?xml version="1.0" encoding="UTF-8"?>\n' + xml, "utf8");
}
app.get("/api/health", (req, res) => res.json({ ok: true, service: "DTECH 3D Football Arena API" }));
app.get("/api/matches", (req, res) => {
  try { res.json(readMatches()); }
  catch { res.status(500).json({ error: "Could not read match database." }); }
});
app.post("/api/matches", (req, res) => {
  const { homeTeam, awayTeam, homeScore, awayScore, duration } = req.body || {};
  if (typeof homeTeam !== "string" || typeof awayTeam !== "string" ||
      !Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
    return res.status(400).json({ error: "Invalid match result." });
  }
  try {
    const rows = readMatches();
    const match = {
      matchId: "DTECH-" + Date.now(),
      homeTeam, awayTeam, homeScore, awayScore,
      status: "Completed",
      duration: String(duration || "2 minutes"),
      playedAt: new Date().toISOString()
    };
    rows.unshift(match);
    writeMatches(rows);
    res.status(201).json({ message: "Saved to JSON and XML.", match });
  } catch { res.status(500).json({ error: "Could not save match." }); }
});
app.get("/api/export/json", (req, res) => res.download(jsonFile, "matches.json"));
app.get("/api/export/xml", (req, res) => {
  try { writeMatches(readMatches()); res.download(xmlFile, "matches.xml"); }
  catch { res.status(500).send("Could not export XML."); }
});
app.post("/api/import/xml", (req, res) => {
  try {
    const xml = req.body && req.body.xml;
    if (typeof xml !== "string" || !xml.trim()) return res.status(400).json({ error: "Paste XML content first." });
    const parsed = new XMLParser().parse(xml);
    let incoming = parsed.matches?.match || [];
    if (!Array.isArray(incoming)) incoming = [incoming];
    const existing = readMatches();
    const known = new Set(existing.map(x => String(x.matchId)));
    const additions = incoming.filter(x => x && x.matchId && !known.has(String(x.matchId))).map(x => ({
      matchId: String(x.matchId), homeTeam: String(x.homeTeam || "Imported team"),
      awayTeam: String(x.awayTeam || "Imported team"), homeScore: Number(x.homeScore || 0),
      awayScore: Number(x.awayScore || 0), status: String(x.status || "Imported"),
      duration: String(x.duration || "Imported"), playedAt: String(x.playedAt || new Date().toISOString())
    }));
    const combined = [...additions, ...existing];
    writeMatches(combined);
    res.json({ message: `Imported ${additions.length} new match(es).`, matches: combined });
  } catch { res.status(400).json({ error: "Invalid XML or unsupported XML structure." }); }
});
app.listen(PORT, () => console.log(`DTECH 3D Football Arena running at http://localhost:${PORT}`));
