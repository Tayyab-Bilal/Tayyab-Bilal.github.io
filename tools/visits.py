#!/usr/bin/env python3
"""Visitor stats for the portfolio. Usage:
  python3 tools/visits.py hits.sqlite            # local sqlite (e.g. from a D1 export)
  python3 tools/visits.py --remote [--db bolt-hits]   # queries D1 through wrangler (run from site/worker or anywhere with the config)
Page views are rows with dwell_ms NULL; dwell rows only feed the average time on page."""
import argparse, json, sqlite3, subprocess, sys
from datetime import datetime, timedelta, timezone

CONTINENTS = {"AS": "Asia", "EU": "Europe", "NA": "North America", "SA": "South America", "AF": "Africa", "OC": "Oceania", "AN": "Antarctica"}
MIDDLE_EAST = {"AE", "SA", "QA", "KW", "BH", "OM", "JO", "LB", "IL", "IQ", "IR", "EG", "TR"}


def area(country, continent):
    return "Middle East" if country in MIDDLE_EAST else CONTINENTS.get(continent, continent or "Unknown")


def local_query(path):
    db = sqlite3.connect(path)
    db.row_factory = sqlite3.Row
    return lambda sql: [dict(r) for r in db.execute(sql)]


def remote_query(name):
    def q(sql):
        out = subprocess.run(["npx", "wrangler", "d1", "execute", name, "--remote", "--json", "--command", sql],
                             capture_output=True, text=True, check=True).stdout
        return json.loads(out)[0]["results"]
    return q


def report(q, now=None):
    now = now or datetime.now(timezone.utc)
    since = lambda d: (now - timedelta(days=d)).strftime("%Y-%m-%dT%H:%M:%SZ")
    views = "dwell_ms IS NULL"
    lines = []

    def table(title, sql, key, n=10):
        rows = q(sql)
        lines.append(f"\n== {title} ==")
        for r in rows[:n]:
            lines.append(f"  {r['n']:>5}  {r[key] or '(none)'}")
        if not rows:
            lines.append("  (no data)")

    lines.append("== Totals ==")
    for d in (7, 30):
        r = q(f"SELECT COUNT(*) v, COUNT(DISTINCT visitor) u FROM hits WHERE {views} AND ts >= '{since(d)}'")[0]
        lines.append(f"  last {d:>2} days: {r['v']} visits, {r['u']} unique visitor-days")
    avg = q(f"SELECT AVG(dwell_ms) a FROM hits WHERE dwell_ms IS NOT NULL AND ts >= '{since(30)}'")[0]["a"]
    if avg:
        lines.append(f"  avg time on page (30d): {avg / 1000:.0f}s")
    w = f"{views} AND ts >= '{since(30)}'"  # everything below: last 30 days
    lines.append("\n(below: last 30 days)")
    table("Top pages", f"SELECT path k, COUNT(*) n FROM hits WHERE {w} GROUP BY path ORDER BY n DESC", "k")
    table("Top referrers", f"SELECT referrer_host k, COUNT(*) n FROM hits WHERE {w} AND referrer_host != '' GROUP BY k ORDER BY n DESC", "k")
    table("By country", f"SELECT country k, COUNT(*) n FROM hits WHERE {w} GROUP BY country ORDER BY n DESC", "k")
    groups = {}
    for r in q(f"SELECT country, continent, COUNT(*) n FROM hits WHERE {w} GROUP BY country, continent"):
        a = area(r["country"], r["continent"])
        groups[a] = groups.get(a, 0) + r["n"]
    lines.append("\n== By region ==")
    for a, n in sorted(groups.items(), key=lambda x: -x[1]):
        lines.append(f"  {n:>5}  {a}")
    table("Top cities", f"SELECT city || ', ' || country k, COUNT(*) n FROM hits WHERE {w} AND city != '' GROUP BY k ORDER BY n DESC", "k")
    table("Devices", f"SELECT device k, COUNT(*) n FROM hits WHERE {w} GROUP BY device ORDER BY n DESC", "k")
    table("Top networks", f"SELECT as_org k, COUNT(*) n FROM hits WHERE {w} AND as_org != '' GROUP BY as_org ORDER BY n DESC", "k")
    return "\n".join(lines)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("sqlite", nargs="?", help="local sqlite file")
    ap.add_argument("--remote", action="store_true", help="query D1 via wrangler")
    ap.add_argument("--db", default="bolt-hits", help="D1 database name (with --remote)")
    a = ap.parse_args()
    if a.remote == bool(a.sqlite):
        sys.exit("give either a sqlite path or --remote")
    print(report(remote_query(a.db) if a.remote else local_query(a.sqlite)))
