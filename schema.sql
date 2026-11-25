CREATE TABLE IF NOT EXISTS matches (
  match_id TEXT PRIMARY KEY,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  status TEXT NOT NULL,
  duration TEXT NOT NULL,
  played_at TEXT NOT NULL
);
