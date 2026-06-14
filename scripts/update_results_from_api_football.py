#!/usr/bin/env python3
"""Update resultats.js from API-Football / API-SPORTS."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Optional, Tuple


ENTRY_RE = re.compile(
    r'(?P<prefix>//\s*(?P<label>[^/"\n]*?\s+vs\s+[^/"\n]*?)\s*)'
    r'"(?P<id>[^"]+)":\s*\{\s*'
    r'homeScore:\s*(?P<homeScore>null|-?\d+),\s*'
    r'awayScore:\s*(?P<awayScore>null|-?\d+),\s*'
    r'penHome:\s*(?P<penHome>null|-?\d+),\s*'
    r'penAway:\s*(?P<penAway>null|-?\d+),\s*'
    r'date:\s*"(?P<date>[^"]+)",\s*'
    r'sortOrder:\s*(?P<sortOrder>\d+)'
    r'(?:,\s*status:\s*"(?P<status>[^"]*)")?'
    r'\s*\}',
    re.IGNORECASE,
)

SCORING_STATUSES = {
    "1H", "HT", "2H", "ET", "BT", "P", "LIVE",
    "FT", "AET", "PEN", "SUSP", "INT",
}

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
    "canada": "CAN",
    "colombia": "COL",
    "congo dr": "COD",
    "dr congo": "COD",
    "democratic republic of the congo": "COD",
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


def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-zA-Z0-9]+", " ", value).strip().lower()
    return re.sub(r"\s+", " ", value)


def canonical_team(name: str) -> Optional[str]:
    cleaned = normalize_text(name)
    if cleaned in TEAM_ALIASES:
        return TEAM_ALIASES[cleaned]

    compact = cleaned.replace(" ", "")
    for key, value in TEAM_ALIASES.items():
        if normalize_text(key).replace(" ", "") == compact:
            return value

    return None


def parse_js_value(value: str) -> Optional[int]:
    value = value.strip()
    if value == "null":
        return None
    return int(value)


def js_value(value: Optional[int]) -> str:
    return "null" if value is None else str(value)


def site_status(api_short: str) -> str:
    api_short = (api_short or "").upper()

    if api_short in {"FT", "AET", "PEN"}:
        return "FINISHED"
    if api_short in {"1H", "2H", "LIVE"}:
        return "IN_PLAY"
    if api_short == "HT":
        return "PAUSED"
    if api_short == "ET":
        return "EXTRA_TIME"
    if api_short == "P":
        return "PENALTY_SHOOTOUT"
    if api_short in {"SUSP", "INT"}:
        return "SUSPENDED"

    return api_short


def api_get(api_key: str, path: str, params: Dict[str, str]) -> Dict[str, Any]:
    url = "https://v3.football.api-sports.io/" + path.lstrip("/")
    url += "?" + urllib.parse.urlencode(params)

    print(f"Fetching {url}")

    request = urllib.request.Request(
        url,
        headers={
            "x-apisports-key": api_key,
            "User-Agent": "porra-mundial-2026-github-action/1.0",
        },
    )

    last_error = None

    for attempt in range(1, 4):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                payload = json.loads(response.read().decode("utf-8"))

            if payload.get("errors"):
                raise RuntimeError(f"API-Football errors: {payload.get('errors')}")

            return payload

        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, RuntimeError) as exc:
            last_error = exc
            if attempt == 3:
                raise

            wait_seconds = attempt * 10
            print(
                f"Warning: API-Football request failed: {exc}; retrying in {wait_seconds}s",
                file=sys.stderr,
            )
            time.sleep(wait_seconds)

    raise RuntimeError(f"API request failed: {last_error}")


def load_local_matches(text: str) -> Dict[Tuple[str, str], Dict[str, Any]]:
    local = {}

    for match in ENTRY_RE.finditer(text):
        label = match.group("label").strip()

        parts = re.split(r"\s+vs\s+", label, maxsplit=1, flags=re.IGNORECASE)
        if len(parts) != 2:
            continue

        home_code = canonical_team(parts[0])
        away_code = canonical_team(parts[1])

        if not home_code or not away_code:
            continue

        local[(home_code, away_code)] = {
            "id": match.group("id"),
            "label": label,
            "date": match.group("date"),
            "sortOrder": match.group("sortOrder"),
            "oldHome": parse_js_value(match.group("homeScore")),
            "oldAway": parse_js_value(match.group("awayScore")),
            "oldPenHome": parse_js_value(match.group("penHome")),
            "oldPenAway": parse_js_value(match.group("penAway")),
            "oldStatus": match.group("status") or "",
        }

    return local


def score_from_fixture(fixture: Dict[str, Any]) -> Optional[Tuple[int, int, Optional[int], Optional[int]]]:
    goals = fixture.get("goals") or {}
    home = goals.get("home")
    away = goals.get("away")

    if home is None or away is None:
        return None

    score = fixture.get("score") or {}
    penalty = score.get("penalty") or {}

    pen_home = penalty.get("home")
    pen_away = penalty.get("away")

    return int(home), int(away), pen_home, pen_away


def build_updates(fixtures: list, local: Dict[Tuple[str, str], Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    updates = {}
    unmatched = []

    for fixture in fixtures:
        fixture_info = fixture.get("fixture") or {}
        status_info = fixture_info.get("status") or {}
        short_status = (status_info.get("short") or "").upper()

        if short_status not in SCORING_STATUSES:
            continue

        score = score_from_fixture(fixture)
        if score is None:
            continue

        teams = fixture.get("teams") or {}
        api_home_name = ((teams.get("home") or {}).get("name") or "").strip()
        api_away_name = ((teams.get("away") or {}).get("name") or "").strip()

        api_home_code = canonical_team(api_home_name)
        api_away_code = canonical_team(api_away_name)

        if not api_home_code or not api_away_code:
            unmatched.append(f"Could not map API teams: {api_home_name} vs {api_away_name}")
            continue

        local_match = local.get((api_home_code, api_away_code))
        reversed_match = False

        if not local_match:
            local_match = local.get((api_away_code, api_home_code))
            reversed_match = bool(local_match)

        if not local_match:
            unmatched.append(f"No local match for: {api_home_name} vs {api_away_name}")
            continue

        home_score, away_score, pen_home, pen_away = score

        if reversed_match:
            home_score, away_score = away_score, home_score
            pen_home, pen_away = pen_away, pen_home

        updates[local_match["id"]] = {
            "homeScore": home_score,
            "awayScore": away_score,
            "penHome": pen_home,
            "penAway": pen_away,
            "status": site_status(short_status),
            "apiLabel": f"{api_home_name} vs {api_away_name}",
        }

    if unmatched:
        print("Unmatched scored/live API fixtures, for review:")
        for item in unmatched[:30]:
            print(f"  - {item}")

    return updates


def rewrite_resultats(text: str, updates: Dict[str, Dict[str, Any]]) -> Tuple[str, list]:
    changed = []

    def replace_entry(match: re.Match) -> str:
        match_id = match.group("id")
        update = updates.get(match_id)

        if not update:
            return match.group(0)

        old_home = parse_js_value(match.group("homeScore"))
        old_away = parse_js_value(match.group("awayScore"))
        old_pen_home = parse_js_value(match.group("penHome"))
        old_pen_away = parse_js_value(match.group("penAway"))
        old_status = match.group("status") or ""

        new_home = update["homeScore"]
        new_away = update["awayScore"]
        new_pen_home = update["penHome"]
        new_pen_away = update["penAway"]
        new_status = update["status"]

        if (
            old_home == new_home
            and old_away == new_away
            and old_pen_home == new_pen_home
            and old_pen_away == new_pen_away
            and old_status == new_status
        ):
            return match.group(0)

        changed.append(
            f"{match_id}: {old_home}-{old_away} -> {new_home}-{new_away} "
            f"[{old_status or 'no status'} -> {new_status}; {update['apiLabel']}]"
        )

        return (
            f'{match.group("prefix")}"{match_id}": {{ '
            f'homeScore: {js_value(new_home)}, '
            f'awayScore: {js_value(new_away)}, '
            f'penHome: {js_value(new_pen_home)}, '
            f'penAway: {js_value(new_pen_away)}, '
            f'date: "{match.group("date")}", '
            f'sortOrder: {match.group("sortOrder")}, '
            f'status: "{new_status}" '
            f"}}"
        )

    new_text = ENTRY_RE.sub(replace_entry, text)
    return new_text, changed


def main() -> int:
    parser = argparse.ArgumentParser(description="Update resultats.js from API-Football")
    parser.add_argument("--resultats", default="resultats.js")
    parser.add_argument("--league", default=os.getenv("API_FOOTBALL_LEAGUE", "1"))
    parser.add_argument("--season", default=os.getenv("API_FOOTBALL_SEASON", "2026"))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    api_key = os.getenv("API_FOOTBALL_KEY")
    if not api_key:
        print("Missing API_FOOTBALL_KEY environment variable", file=sys.stderr)
        return 2

    with open(args.resultats, "r", encoding="utf-8") as f:
        original_text = f.read()

    local = load_local_matches(original_text)
    print(f"Loaded {len(local)} local group-stage matches from {args.resultats}")

    payload = api_get(
        api_key,
        "fixtures",
        {
            "league": str(args.league),
            "season": str(args.season),
            "timezone": "America/New_York",
        },
    )

    fixtures = list(payload.get("response") or [])
    print(f"Fetched {len(fixtures)} API-Football fixtures")

    updates = build_updates(fixtures, local)

    new_text, changed = rewrite_resultats(original_text, updates)

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
