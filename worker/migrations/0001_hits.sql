-- One row per page view (dwell_ms NULL) or per dwell beacon (dwell_ms set). No IP, no lat/long.
CREATE TABLE hits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer_host TEXT,
  country TEXT,
  is_eu INTEGER,
  continent TEXT,
  region TEXT,
  city TEXT,
  postal_code TEXT,
  timezone TEXT,
  asn INTEGER,
  as_org TEXT,
  colo TEXT,
  device TEXT,
  browser TEXT,
  os TEXT,
  lang TEXT,
  visitor TEXT,
  dwell_ms INTEGER
);
CREATE INDEX hits_ts ON hits (ts);
