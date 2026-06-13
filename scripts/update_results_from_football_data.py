#!/usr/bin/env python3
"""Update resultats.js from football-data.org.

This script is designed for the static GitHub Pages porra site. It reads the
existing resultats.js file, fetches FIFA World Cup scores from football-data.org,
matches API fixtures to local match IDs, updates score fields plus match status, and writes
resultats.js back only when something changed.

Required environment variable:
  FOOTBALL_DATA_TOKEN  your football-data.org API token

Useful optional variables:
  FOOTBALL_DATA_COMPETITION  defaults to WC
  FOOTBALL_DATA_SEASON       defaults to 2026
  FOOTBALL_DATA_DATE_FROM    defaults to 2026-06-11
  FOOTBALL_DATA_DATE_TO      defaults to 2026-07-20 (dateTo is exclusive in API docs)
  FOOTBALL_DATA_FINAL_ONLY   set to true to update only FINISHED/AWARDED matches
  FOOTBALL_DATA_USE_DAILY    defaults to true; also fetch /v4/matches around today for live scores
  FOOTBALL_DATA_DAILY_DAYS   defaults to 1; fetch today +/- this many days from /v4/matches
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple

RESULT_LINE_RE = re.compile(
    r'^(?P<indent>\s*)"(?P<id>[^"]+)": \{ '
    r'homeScore: (?P<homeScore>[^,]+), '
    r'awayScore: (?P<awayScore>[^,]+), '
    r'penHome: (?P<penHome>[^,]+), '
    r'penAway: (?P<penAway>[^,]+), '
    r'date: "(?P<date>[^"]+)", '
    r'sortOrder: (?P<sortOrder>\d+)'
    r'(?:, status: "(?P<status>[^"]*)")? '
    r'\},(?P<trailing>.*)$'
)

SCORING_STATUSES_LIVE = {
    "IN_PLAY",
    "PAUSED",
    "EXTRA_TIME",
    "PENALTY_SHOOTOUT",
    "FINISHED",
    "AWARDED",
}
SCORING_STATUSES_FINAL_ONLY = {"FINISHED", "AWARDED"}

# Canonical TLA aliases for the teams in the 2026 World Cup site.
TEAM_ALIASES = {
    "algeria": "DZA",
    "argentina": "ARG",
    "australia": "AUS",
    "austria": "AUT",
    "belgium": "BEL",
    "bosnia herzegovina": "BIH",
    "bosnia and herzegovina": "BIH",
    "bosnia-herzegovina": "BIH",
    "brazil": "BRA",
    "cabo verde": "CPV",
    "cape verde": "CPV",
    "cape verde islands": "CPV",
    "canada": "CAN",
    "colombia": "COL",
    "cote d ivoire": "CIV",
    "cote divoire": "CIV",
    "côte d ivoire": "CIV",
    "côte d'ivoire": "CIV",
    "ivory coast": "CIV",
    "croatia": "CRO",
    "curacao": "CUW",
    "curaçao": "CUW",
    "czech republic": "CZE",
    "czechia": "CZE",
    "dr congo": "COD",
    "congo dr": "COD",
    "democratic republic of the congo": "COD",
    "d r congo": "COD",
    "ecuador": "ECU",
    "egypt": "EGY",
    "england": "ENG",
    "france": "FRA",
    "germany": "GER",
    "ghana": "GHA",
    "haiti": "HTI",
    "ir iran": "IRI",
    "iran": "IRI",
    "iraq": "IRQ",
    "japan": "JPN",
    "jordan": "JOR",
    "korea republic": "KOR",
    "south korea": "KOR",
    "mexico": "MEX",
    "morocco": "MAR",
    "netherlands": "NED",
    "new zealand": "NZL",
    "norway": "NOR",
    "panama": "PAN",
    "paraguay": "PAR",
    "portugal": "POR",
    "qatar": "QAT",
    "saudi arabia": "KSA",
    "scotland": "SCO",
    "senegal": "SEN",
    "south africa": "RSA",
    "spain": "ESP",
    "sweden": "SWE",
    "switzerland": "SUI",
    "tunisia": "TUN",
    "turkey": "TUR",
    "turkiye": "TUR",
    "türkiye": "TUR",
    "usa": "USA",
    "united states": "USA",
    "united states of america": "USA",
    "uruguay": "URU",
    "uzbekistan": "UZB",
}

@dataclass
class LocalMatch:
    match_id: str
    date: str
    sort_order: int
    home_score: Optional[int]
    away_score: Optional[int]
    pen_home: Optional[int]
    pen_away: Optional[int]
    status: str = ""
    label: str = ""
    home_tla: Optional[str] = None
    away_tla: Optional[str] = None

@dataclass
class ApiScore:
    match_id: str
    home_score: int
    away_score: int
    pen_home: Optional[int]
    pen_away: Optional[int]
    status: str
    api_home: str
    api_away: str
    api_utc_date: str


def normalize_text(value: str) -> str:
    value = value or ""
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-zA-Z0-9]+", " ", value).strip().lower()
    return re.sub(r"\s+", " ", value)


def canonical_tla_from_name(name: str) -> Optional[str]:
    if not name:
        return None
    cleaned = normalize_text(name)
    if cleaned in TEAM_ALIASES:
        return TEAM_ALIASES[cleaned]
    compact = cleaned.replace(" ", "")
    compact_aliases = {normalize_text(k).replace(" ", ""): v for k, v in TEAM_ALIASES.items()}
    return compact_aliases.get(compact)


def canonical_tla_from_team(team: Dict[str, Any]) -> Optional[str]:
    tla = (team.get("tla") or team.get("code") or "").strip().upper()
    if tla and tla not in {"TBD", "TBA", "---"}:
        # Normalize a few provider-specific alternatives.
        if tla == "IRN":
            return "IRI"
        if tla == "KOR":
            return "KOR"
        if tla == "USA":
            return "USA"
        if tla == "TUR":
            return "TUR"
        if tla == "CUR":
            return "CUW"
        if tla == "CIV":
            return "CIV"
        return tla
    for key in ("name", "shortName"):
        maybe = canonical_tla_from_name(str(team.get(key) or ""))
        if maybe:
            return maybe
    return None


def parse_js_value(value: str) -> Optional[int]:
    value = value.strip()
    if value == "null":
        return None
    return int(value)


def js_value(value: Optional[int]) -> str:
    return "null" if value is None else str(value)


def parse_local_matches(path: str) -> Tuple[List[str], List[LocalMatch]]:
    lines = open(path, "r", encoding="utf-8").read().splitlines()
    matches: List[LocalMatch] = []
    last_non_date_comment = ""
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("//"):
            text = stripped[2:].strip()
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", text) and text not in {
                "Grups",
                "Eliminatories",
                "Vuitens de final",
                "Quarts de final",
                "Semifinals",
                "Tercer lloc",
                "Final",
            }:
                last_non_date_comment = text
            continue
        m = RESULT_LINE_RE.match(line)
        if not m:
            continue
        label = last_non_date_comment
        home_tla = away_tla = None
        if " vs " in label:
            home_label, away_label = label.split(" vs ", 1)
            home_tla = canonical_tla_from_name(home_label)
            away_tla = canonical_tla_from_name(away_label)
        matches.append(
            LocalMatch(
                match_id=m.group("id"),
                date=m.group("date"),
                sort_order=int(m.group("sortOrder")),
                home_score=parse_js_value(m.group("homeScore")),
                away_score=parse_js_value(m.group("awayScore")),
                pen_home=parse_js_value(m.group("penHome")),
                pen_away=parse_js_value(m.group("penAway")),
                status=m.group("status") or "",
                label=label,
                home_tla=home_tla,
                away_tla=away_tla,
            )
        )
    return lines, matches


def football_data_get(token: str, path: str, params: Dict[str, str]) -> List[Dict[str, Any]]:
    base_url = "https://api.football-data.org/v4/" + path.lstrip("/")
    url = base_url + "?" + urllib.parse.urlencode(params)
    print(f"Fetching {url.replace(token, '***')}")
    request = urllib.request.Request(
        url,
        headers={
            "X-Auth-Token": token,
            "User-Agent": "porra-mundial-2026-github-action/1.1",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return list(payload.get("matches", []))


def fetch_api_matches(
    token: str,
    competition: str,
    season: str,
    date_from: str,
    date_to: str,
    use_daily: bool = True,
    daily_days: int = 1,
) -> List[Dict[str, Any]]:
    """Fetch competition matches plus a small daily live window.

    football-data.org's public demo page uses /v4/matches for today's live
    matches. The competition endpoint is better for the full tournament, but
    the daily endpoint can expose live games sooner. We combine both and
    deduplicate by provider id.
    """
    all_matches: List[Dict[str, Any]] = []

    # Full tournament pull. This should cover final scores and scheduled WC data.
    all_matches.extend(
        football_data_get(
            token,
            f"competitions/{urllib.parse.quote(competition)}/matches",
            {"season": season, "dateFrom": date_from, "dateTo": date_to},
        )
    )

    # Live/daily pull. This mirrors the endpoint shown on football-data.org's
    # front page and is useful when a match is IN_PLAY but not appearing through
    # the competition query quickly enough.
    if use_daily:
        today = dt.datetime.now(dt.timezone.utc).date()
        daily_from = (today - dt.timedelta(days=daily_days)).isoformat()
        daily_to = (today + dt.timedelta(days=daily_days)).isoformat()
        try:
            all_matches.extend(
                football_data_get(
                    token,
                    "matches",
                    {"dateFrom": daily_from, "dateTo": daily_to},
                )
            )
        except Exception as exc:  # Keep the competition endpoint as a fallback.
            print(f"Warning: daily /matches fetch failed: {exc}", file=sys.stderr)

    deduped: List[Dict[str, Any]] = []
    seen = set()
    for m in all_matches:
        key = m.get("id") or (m.get("utcDate"), m.get("homeTeam", {}).get("name"), m.get("awayTeam", {}).get("name"))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(m)
    return deduped


def score_from_api_match(match: Dict[str, Any]) -> Optional[Tuple[int, int, Optional[int], Optional[int]]]:
    score = match.get("score") or {}
    duration = score.get("duration")
    full_time = score.get("fullTime") or {}
    regular_time = score.get("regularTime") or {}
    extra_time = score.get("extraTime") or {}
    penalties = score.get("penalties") or {}

    def pair(node: Dict[str, Any]) -> Tuple[Optional[int], Optional[int]]:
        return node.get("home"), node.get("away")

    ft_home, ft_away = pair(full_time)

    # In live games, football-data.org normally puts the running score in
    # fullTime. If a provider response has status IN_PLAY but leaves the score
    # null, there is nothing reliable to write yet.
    if ft_home is None or ft_away is None:
        return None

    if duration == "PENALTY_SHOOTOUT":
        reg_home, reg_away = pair(regular_time)
        et_home, et_away = pair(extra_time)
        pen_home, pen_away = pair(penalties)
        if reg_home is None or reg_away is None:
            # Fallback: docs indicate fullTime may include shootout goals.
            if pen_home is not None and pen_away is not None:
                return ft_home - pen_home, ft_away - pen_away, pen_home, pen_away
            return ft_home, ft_away, pen_home, pen_away
        base_home = reg_home + (et_home or 0)
        base_away = reg_away + (et_away or 0)
        return base_home, base_away, pen_home, pen_away

    # Regular time or extra-time finish. For live games, fullTime is the running score.
    return ft_home, ft_away, None, None


def local_date_candidates(utc_date: str) -> List[str]:
    if not utc_date:
        return []
    # Keep this standard-library only: the site uses EDT-ish local dates, while the API uses UTC.
    base = dt.datetime.fromisoformat(utc_date.replace("Z", "+00:00"))
    dates = set()
    for hours in (0, -4, -5, -6, -7, -8):
        dates.add((base + dt.timedelta(hours=hours)).date().isoformat())
    return list(dates)


def group_letter(api_group: Optional[str]) -> Optional[str]:
    if not api_group:
        return None
    m = re.search(r"GROUP_([A-L])", api_group)
    return m.group(1) if m else None


def build_match_lookup(local_matches: List[LocalMatch]) -> Dict[Tuple[str, str, str, Optional[str]], LocalMatch]:
    lookup: Dict[Tuple[str, str, str, Optional[str]], LocalMatch] = {}
    for m in local_matches:
        if m.home_tla and m.away_tla:
            grp = m.match_id.split("-")[1] if m.match_id.startswith("G-") else None
            lookup[(m.date, m.home_tla, m.away_tla, grp)] = m
            lookup[(m.date, m.home_tla, m.away_tla, None)] = m
    return lookup


def map_api_to_local(api_matches: List[Dict[str, Any]], local_matches: List[LocalMatch], final_only: bool) -> Tuple[Dict[str, ApiScore], List[str]]:
    statuses = SCORING_STATUSES_FINAL_ONLY if final_only else SCORING_STATUSES_LIVE
    lookup = build_match_lookup(local_matches)
    updates: Dict[str, ApiScore] = {}
    unmatched: List[str] = []

    # First pass: exact-ish team/date/group matching. This handles all group-stage games.
    used_local_ids = set()
    for api_match in api_matches:
        status = api_match.get("status")
        if status not in statuses:
            continue
        score_tuple = score_from_api_match(api_match)
        if score_tuple is None:
            continue
        home_tla = canonical_tla_from_team(api_match.get("homeTeam") or {})
        away_tla = canonical_tla_from_team(api_match.get("awayTeam") or {})
        if not home_tla or not away_tla:
            continue
        api_group = group_letter(api_match.get("group"))
        candidates = local_date_candidates(api_match.get("utcDate") or "")
        local = None
        for d in candidates:
            local = lookup.get((d, home_tla, away_tla, api_group)) or lookup.get((d, home_tla, away_tla, None))
            if local:
                break
        if not local:
            # Try with no date if date changed due timezone/provider quirks.
            for lm in local_matches:
                if lm.home_tla == home_tla and lm.away_tla == away_tla:
                    if api_group is None or (lm.match_id.startswith("G-") and lm.match_id.split("-")[1] == api_group):
                        local = lm
                        break
        if local:
            home_score, away_score, pen_home, pen_away = score_tuple
            updates[local.match_id] = ApiScore(
                match_id=local.match_id,
                home_score=home_score,
                away_score=away_score,
                pen_home=pen_home,
                pen_away=pen_away,
                status=status,
                api_home=api_match.get("homeTeam", {}).get("name") or home_tla,
                api_away=api_match.get("awayTeam", {}).get("name") or away_tla,
                api_utc_date=api_match.get("utcDate") or "",
            )
            used_local_ids.add(local.match_id)
        else:
            unmatched.append(
                f"{api_match.get('utcDate')} {api_match.get('stage')} {api_match.get('group')}: "
                f"{api_match.get('homeTeam', {}).get('name')} vs {api_match.get('awayTeam', {}).get('name')}"
            )

    # Fallback for knockout matches with placeholder labels: map by local date/order.
    knockout_local_by_date: Dict[str, List[LocalMatch]] = {}
    for lm in local_matches:
        if not lm.match_id.startswith("G-") and lm.match_id not in used_local_ids:
            knockout_local_by_date.setdefault(lm.date, []).append(lm)
    for values in knockout_local_by_date.values():
        values.sort(key=lambda x: x.sort_order)

    api_knockout_by_date: Dict[str, List[Dict[str, Any]]] = {}
    for api_match in api_matches:
        status = api_match.get("status")
        if status not in statuses:
            continue
        if api_match.get("stage") == "GROUP_STAGE":
            continue
        if score_from_api_match(api_match) is None:
            continue
        # Use the first plausible local date; exact dates can be tweaked manually if needed.
        candidates = local_date_candidates(api_match.get("utcDate") or "")
        for d in candidates:
            if d in knockout_local_by_date:
                api_knockout_by_date.setdefault(d, []).append(api_match)
                break
    for d, api_list in api_knockout_by_date.items():
        api_list.sort(key=lambda m: m.get("utcDate") or "")
        local_list = knockout_local_by_date.get(d, [])
        for api_match, local in zip(api_list, local_list):
            if local.match_id in updates:
                continue
            score_tuple = score_from_api_match(api_match)
            if score_tuple is None:
                continue
            home_score, away_score, pen_home, pen_away = score_tuple
            updates[local.match_id] = ApiScore(
                match_id=local.match_id,
                home_score=home_score,
                away_score=away_score,
                pen_home=pen_home,
                pen_away=pen_away,
                status=api_match.get("status") or "",
                api_home=api_match.get("homeTeam", {}).get("name") or "",
                api_away=api_match.get("awayTeam", {}).get("name") or "",
                api_utc_date=api_match.get("utcDate") or "",
            )

    return updates, unmatched


def rewrite_resultats(lines: List[str], updates: Dict[str, ApiScore]) -> Tuple[str, List[str]]:
    changed: List[str] = []
    new_lines: List[str] = []
    for line in lines:
        m = RESULT_LINE_RE.match(line)
        if not m:
            new_lines.append(line)
            continue
        match_id = m.group("id")
        update = updates.get(match_id)
        if not update:
            new_lines.append(line)
            continue
        old_tuple = (
            parse_js_value(m.group("homeScore")),
            parse_js_value(m.group("awayScore")),
            parse_js_value(m.group("penHome")),
            parse_js_value(m.group("penAway")),
        )
        old_status = m.group("status") or ""
        new_status = update.status or ""
        new_tuple = (update.home_score, update.away_score, update.pen_home, update.pen_away)
        if old_tuple == new_tuple and old_status == new_status:
            new_lines.append(line)
            continue
        changed.append(
            f"{match_id}: {old_tuple[0]}-{old_tuple[1]} -> {update.home_score}-{update.away_score}"
            + (f" ({update.pen_home}-{update.pen_away} pen.)" if update.pen_home is not None and update.pen_away is not None else "")
            + f" [{old_status or 'no status'} -> {new_status}; {update.api_home} vs {update.api_away}]"
        )
        new_lines.append(
            f'{m.group("indent")}"{match_id}": {{ homeScore: {js_value(update.home_score)}, '
            f'awayScore: {js_value(update.away_score)}, penHome: {js_value(update.pen_home)}, '
            f'penAway: {js_value(update.pen_away)}, date: "{m.group("date")}", '
            f'sortOrder: {m.group("sortOrder")}, status: "{new_status}" }},{m.group("trailing")}'
        )
    return "\n".join(new_lines) + "\n", changed


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Update resultats.js from football-data.org")
    parser.add_argument("--resultats", default="resultats.js", help="Path to resultats.js")
    parser.add_argument("--competition", default=os.getenv("FOOTBALL_DATA_COMPETITION", "WC"))
    parser.add_argument("--season", default=os.getenv("FOOTBALL_DATA_SEASON", "2026"))
    parser.add_argument("--date-from", default=os.getenv("FOOTBALL_DATA_DATE_FROM", "2026-06-11"))
    parser.add_argument("--date-to", default=os.getenv("FOOTBALL_DATA_DATE_TO", "2026-07-20"))
    parser.add_argument("--final-only", action="store_true", default=os.getenv("FOOTBALL_DATA_FINAL_ONLY", "").lower() in {"1", "true", "yes"})
    parser.add_argument("--use-daily", action="store_true", default=os.getenv("FOOTBALL_DATA_USE_DAILY", "true").lower() in {"1", "true", "yes"})
    parser.add_argument("--daily-days", type=int, default=int(os.getenv("FOOTBALL_DATA_DAILY_DAYS", "1")))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)

    token = os.getenv("FOOTBALL_DATA_TOKEN")
    if not token:
        print("Missing FOOTBALL_DATA_TOKEN environment variable", file=sys.stderr)
        return 2

    lines, local_matches = parse_local_matches(args.resultats)
    print(f"Loaded {len(local_matches)} local matches from {args.resultats}")

    api_matches = fetch_api_matches(
        token,
        args.competition,
        args.season,
        args.date_from,
        args.date_to,
        use_daily=args.use_daily,
        daily_days=args.daily_days,
    )
    print(f"Fetched {len(api_matches)} API matches from football-data.org after deduping")

    active = [m for m in api_matches if m.get("status") in SCORING_STATUSES_LIVE]
    if active:
        print("Scored/live API candidates:")
        for m in active[:20]:
            home = (m.get("homeTeam") or {}).get("name")
            away = (m.get("awayTeam") or {}).get("name")
            print(f"  - {m.get('utcDate')} {m.get('status')} {home} vs {away}: {score_from_api_match(m)}")

    updates, unmatched = map_api_to_local(api_matches, local_matches, final_only=args.final_only)
    new_text, changed = rewrite_resultats(lines, updates)

    if unmatched:
        print("Unmatched scored API matches, for review:")
        for item in unmatched[:20]:
            print(f"  - {item}")
        if len(unmatched) > 20:
            print(f"  ... {len(unmatched) - 20} more")

    if not changed:
        print("No score changes found.")
        return 0

    print("Score changes:")
    for item in changed:
        print(f"  - {item}")

    if args.dry_run:
        print("Dry run: resultats.js was not modified.")
        return 0

    with open(args.resultats, "w", encoding="utf-8") as f:
        f.write(new_text)
    print(f"Updated {args.resultats}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
