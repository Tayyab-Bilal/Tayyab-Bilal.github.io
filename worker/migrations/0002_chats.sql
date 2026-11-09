-- One row per answered Bolt question. No IP, no lat/long. visitor = same daily anonymous hash as hits.
CREATE TABLE chats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  page TEXT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  source TEXT,   -- ai | validator-fallback | error | dunno | injection
  country TEXT,
  city TEXT,
  visitor TEXT
);
CREATE INDEX chats_ts ON chats (ts);
