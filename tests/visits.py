# Run: python3 tests/visits.py
import os, sqlite3, sys, tempfile
from datetime import datetime, timezone
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tools"))
import visits

now = datetime(2026, 11, 9, tzinfo=timezone.utc)
f = os.path.join(tempfile.mkdtemp(), "h.sqlite")
db = sqlite3.connect(f)
db.executescript(open(os.path.join(os.path.dirname(__file__), "..", "worker", "migrations", "0001_hits.sql")).read())
rows = [("2026-11-08T10:00:00Z", "/", "news.ycombinator.com", "AE", "AS", "Dubai", "desktop", "Etisalat", "a", None),
        ("2026-11-07T10:00:00Z", "/", "", "AE", "AS", "Dubai", "mobile", "Etisalat", "a", None),
        ("2026-11-06T10:00:00Z", "/work.html", "", "DE", "EU", "Berlin", "desktop", "Telekom", "b", None),
        ("2026-10-20T10:00:00Z", "/", "", "US", "NA", "Austin", "desktop", "Comcast", "c", None),
        ("2026-11-08T10:00:30Z", "/", "", "AE", "AS", "Dubai", "desktop", "Etisalat", "a", 30000)]
db.executemany("INSERT INTO hits (ts,path,referrer_host,country,continent,city,device,as_org,visitor,dwell_ms) VALUES (?,?,?,?,?,?,?,?,?,?)", rows)
db.commit()
out = visits.report(visits.local_query(f), now)
assert "last  7 days: 3 visits, 2 unique" in out, out
assert "last 30 days: 4 visits, 3 unique" in out, out
assert "Middle East" in out and "Europe" in out and "News" not in out
assert "news.ycombinator.com" in out and "30s" in out
print("visits ok")
