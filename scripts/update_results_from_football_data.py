#!/usr/bin/env python3
"""Update resultats.js from football-data.org World Cup data.

Environment variables used by the GitHub Action:
  FOOTBALL_DATA_TOKEN       required
  FOOTBALL_DATA_COMPETITION default: WC
  FOOTBALL_DATA_SEASON      default: 2026
  FOOTBALL_DATA_DATE_FROM   optional YYYY-MM-DD
  FOOTBALL_DATA_DATE_TO     optional YYYY-MM-DD
  FOOTBALL_DATA_USE_DAILY   optional true/false. If true, fetches only today +/- days.
  FOOTBALL_DATA_DAILY_DAYS  optional integer, default 1

The script updates only scores/statuses and window.PORRA_ULTIM_PARTIT.
It preserves the rest of resultats.js as much as possible.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple

API_BASE = "https://api.football-data.org/v4"

# football-data.org and FIFA/site naming are not perfectly aligned.
# Values are canonical TLA codes used for matching local resultats.js to API fixtures.
TEAM_ALIASES: Dict[str, str] = {
    # Group A
    "mexico": "MEX",
    "south africa": "RSA",
    "korea republic": "KOR",
    "south korea": "KOR",
    "czechia": "CZE",
    "czech republic": "CZE",
    # Group B
    "canada": "CAN",
    "bosnia-herzegovina": "BIH",
    "bosnia herzegovina": "BIH",
    "bosnia and herzegovina": "BIH",
    "bosnia": "BIH",
    "qatar": "QAT",
    "switzerland": "SUI",
    # Group C
    "brazil": "BRA",
    "morocco": "MAR",
    "haiti": "HTI",
    "scotland": "SCO",
    # Group D
    "usa": "USA",
    "united states": "USA",
    "united states of america": "USA",
    "paraguay": "PAR",
    "australia": "AUS",
    "turkiye": "TUR",
    "turkey": "TUR",
    # Group E
    "germany": "GER",
    "curacao": "CUW",
    "curaçao": "CUW",
    "cote divoire": "CIV",
    "cote d ivoire": "CIV",
    "cote d'ivoire": "CIV",
    "côte d'ivoire": "CIV",
    "ivory coast": "CIV",
    "ecuador": "ECU",
    # Group F
    "netherlands": "NED",
    "japan": "JPN",
    "sweden": "SWE",
    "tunisia": "TUN",
    # Group G
    "belgium": "BEL",
    "egypt": "EGY",
    "ir iran": "IRI",
    "iran": "IRI",
    "new zealand": "NZL",
    # Group H
    "spain": "ESP",
    "cabo verde": "CPV",
    "cabo verde islands": "CPV",
    "cape verde": "CPV",
    "cape verde islands": "CPV",
    "saudi arabia": "KSA",
    "uruguay": "URU",
    # Group I
    "france": "FRA",
    "senegal": "SEN",
    "iraq": "IRQ",
    "norway": "NOR",
    # Group J
    "argentina": "ARG",
    "algeria": "DZA",
    "austria": "AUT",
    "jordan": "JOR",
    # Group K
    "portugal": "POR",
    "dr congo": "COD",
    "congo dr": "COD",
    "democratic republic of the congo": "COD",
    "d r congo": "COD",
    "uzbekistan": "UZB",
    "colombia": "COL",
    # Group L
    "england": "ENG",
    "croatia": "CRO",
    "ghana": "GHA",
    "panama": "PAN",
}

# Some providers use HAI, while the site has used HTI. Treat them as the same team.
TLA_ALIASES = {
    "HAI": "HTI",
    "IRN": "IRI",
    "ALG": "DZA",
    "URY": "URU",
    "CVE": "CPV",
    "SAU": "KSA",
    "DRC": "COD",
    "CUR": "CUW",
    "ZAF": "RSA",
    "DEU": "GER",
    "NLD": "NED",
    "CHE": "SUI",
}

FINAL_STATUSES = {"FINISHED", "AWARDED"}
LIVE_STATUSES = {"IN_PLAY", "PAUSED"}
NON_FINAL_STATUSES = {"SCHEDULED", "TIMED", "POSTPONED", "SUSPENDED", "CANCELED"}
KNOWN_STATUSES = FINAL_STATUSES | LIVE_STATUSES | NON_FINAL_STATUSES

ENTRY_RE = re.compile(
    r'(?P<comments>(?:\s*//[^\n]*\n)*)'
    r'(?P<indent>\s*)"(?P<id>[^"]+)"\s*:\s*\{'
    r'(?P<body>[^}]*)\}'
    r'(?P<trailing>,?)',
    re.MULTILINE,
)

FIELD_RE = re.compile(r'(?P<name>homeScore|awayScore|penHome|penAway|date|sortOrder|status)\s*:\s*(?P<value>"[^"]*"|null|-?\d+)')


@dataclass
class LocalMatch:
    id: str
    start: int
    end: int
    full_text: str
    comments: str
    indent: str
    body: str
    trailing: str
    date: Optional[str]
    sort_order: Optional[int]
    home_name: Optional[str]
    away_name: Optional[str]
    home_tla: Optional[str]
    away_tla: Optional[str]


@dataclass
class ApiMatch:
    raw: Dict[str, Any]
    utc_date: str
    date: str
    status: str
    home_tla: Optional[str]
    away_tla: Optional[str]
    home_score: Optional[int]
    away_score: Optional[int]
    pen_home: Optional[int]
    pen_away: Optional[int]


def normalize_text(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = value.replace("’", "'").replace("`", "'").replace("´", "'")
    value = value.lower()
    value = re.sub(r"[^a-z0-9' ]+", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def canonical_tla(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    v = str(value).strip().upper()
    return TLA_ALIASES.get(v, v)


def tla_from_name(name: Optional[str]) -> Optional[str]:
    if not name:
        return None

    norm = normalize_text(name)

    # Direct lookup.
    if norm in TEAM_ALIASES:
        return TEAM_ALIASES[norm]

    # Robust lookup: compare normalized alias keys too, so
    # "Bosnia-Herzegovina" and "Bosnia Herzegovina" match.
    for alias, tla in TEAM_ALIASES.items():
        if normalize_text(alias) == norm:
            return tla

    return None


def parse_fields(body: str) -> Dict[str, str]:
    return {m.group("name"): m.group("value") for m in FIELD_RE.finditer(body)}


def js_value(value: Optional[int] | str | None) -> str:
    if value is None:
        return "null"
    if isinstance(value, int):
        return str(value)
    escaped = value.replace('\\', '\\\\').replace('"', '\\"')
    return f'"{escaped}"'


def parse_comment_pair(comments: str) -> Tuple[Optional[str], Optional[str]]:
    # Use the last comment line that looks like "A vs B".
    lines = [line.strip() for line in comments.splitlines()]
    for line in reversed(lines):
        if not line.startswith("//"):
            continue
        text = line[2:].strip()
        if " vs " in text:
            home, away = text.split(" vs ", 1)
            return home.strip(), away.strip()
    return None, None


def parse_int_value(raw: Optional[str]) -> Optional[int]:
    if raw is None or raw == "null":
        return None
    raw = raw.strip().strip('"')
    if raw == "":
        return None
    try:
        return int(raw)
    except ValueError:
        return None


def parse_str_value(raw: Optional[str]) -> Optional[str]:
    if raw is None or raw == "null":
        return None
    if raw.startswith('"') and raw.endswith('"'):
        return raw[1:-1]
    return raw


def parse_local_matches(text: str) -> List[LocalMatch]:
    out: List[LocalMatch] = []
    for m in ENTRY_RE.finditer(text):
        body = m.group("body")
        fields = parse_fields(body)
        date = parse_str_value(fields.get("date"))
        sort_order = parse_int_value(fields.get("sortOrder"))
        home_name, away_name = parse_comment_pair(m.group("comments"))
        out.append(
            LocalMatch(
                id=m.group("id"),
                start=m.start(),
                end=m.end(),
                full_text=m.group(0),
                comments=m.group("comments"),
                indent=m.group("indent"),
                body=body,
                trailing=m.group("trailing"),
                date=date,
                sort_order=sort_order,
                home_name=home_name,
                away_name=away_name,
                home_tla=tla_from_name(home_name),
                away_tla=tla_from_name(away_name),
            )
        )
    return out


def api_score(match: Dict[str, Any]) -> Tuple[Optional[int], Optional[int], Optional[int], Optional[int]]:
    score = match.get("score") or {}
    status = str(match.get("status") or "").upper()

    # football-data.org typically puts the current/final score here.
    full_time = score.get("fullTime") or {}
    regular_time = score.get("regularTime") or {}
    half_time = score.get("halfTime") or {}
    penalties = score.get("penalties") or {}

    home = full_time.get("home")
    away = full_time.get("away")

    if home is None or away is None:
        home = regular_time.get("home")
        away = regular_time.get("away")
    if (home is None or away is None) and status in LIVE_STATUSES:
        home = half_time.get("home")
        away = half_time.get("away")

    pen_home = penalties.get("home")
    pen_away = penalties.get("away")

    return (
        home if isinstance(home, int) else None,
        away if isinstance(away, int) else None,
        pen_home if isinstance(pen_home, int) else None,
        pen_away if isinstance(pen_away, int) else None,
    )


def parse_api_match(raw: Dict[str, Any]) -> ApiMatch:
    utc_date = raw.get("utcDate") or ""
    date = ""
    if utc_date:
        try:
            from zoneinfo import ZoneInfo
            date = (
                dt.datetime
                .fromisoformat(utc_date.replace("Z", "+00:00"))
                .astimezone(ZoneInfo("America/New_York"))
                .date()
                .isoformat()
            )
        except Exception:
            date = utc_date[:10] if len(utc_date) >= 10 else ""
    status = str(raw.get("status") or "").upper()
    home_team = raw.get("homeTeam") or {}
    away_team = raw.get("awayTeam") or {}
    home_tla = canonical_tla(home_team.get("tla")) or tla_from_name(home_team.get("name"))
    away_tla = canonical_tla(away_team.get("tla")) or tla_from_name(away_team.get("name"))
    hs, as_, ph, pa = api_score(raw)
    return ApiMatch(raw, utc_date, date, status, home_tla, away_tla, hs, as_, ph, pa)


def football_data_get(url: str, token: str, retries: int = 3) -> Dict[str, Any]:
    headers = {"X-Auth-Token": token, "Accept": "application/json"}
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = resp.read().decode("utf-8")
                return json.loads(body)
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", errors="replace")
            # Do not retry plan/auth/quota errors.
            if e.code in {400, 401, 403, 404, 429}:
                raise RuntimeError(f"football-data.org HTTP {e.code}: {body}") from e
            last_error = e
        except Exception as e:  # network/transient
            last_error = e
        if attempt < retries - 1:
            wait = 10 * (attempt + 1)
            print(f"Warning: football-data.org request failed: {last_error}; retrying in {wait}s", file=sys.stderr)
            time.sleep(wait)
    raise RuntimeError(f"football-data.org request failed: {last_error}")


def build_api_url() -> str:
    competition = os.getenv("FOOTBALL_DATA_COMPETITION", "WC")
    season = os.getenv("FOOTBALL_DATA_SEASON", "2026")
    params: Dict[str, str] = {"season": season}

    use_daily = os.getenv("FOOTBALL_DATA_USE_DAILY", "false").strip().lower() in {"1", "true", "yes", "y"}
    if use_daily:
        # Use New York date because the workflow window is New York based.
        try:
            from zoneinfo import ZoneInfo
            today = dt.datetime.now(ZoneInfo("America/New_York")).date()
        except Exception:
            today = dt.date.today()
        days = int(os.getenv("FOOTBALL_DATA_DAILY_DAYS", "1"))
        date_from = today - dt.timedelta(days=days)
        date_to = today + dt.timedelta(days=days)
        params["dateFrom"] = date_from.isoformat()
        params["dateTo"] = date_to.isoformat()
    else:
        date_from = os.getenv("FOOTBALL_DATA_DATE_FROM")
        date_to = os.getenv("FOOTBALL_DATA_DATE_TO")
        if date_from:
            params["dateFrom"] = date_from
        if date_to:
            params["dateTo"] = date_to

    return f"{API_BASE}/competitions/{urllib.parse.quote(competition)}/matches?" + urllib.parse.urlencode(params)


def match_by_teams(local: LocalMatch, api_matches: List[ApiMatch]) -> Optional[ApiMatch]:
    if not local.home_tla or not local.away_tla:
        return None
    for am in api_matches:
        if am.home_tla == local.home_tla and am.away_tla == local.away_tla:
            return am
        if am.home_tla == local.away_tla and am.away_tla == local.home_tla:
            # Should not happen for group-stage entries, but handle it safely.
            return am
    return None


def make_date_index(api_matches: List[ApiMatch]) -> Dict[str, List[ApiMatch]]:
    by_date: Dict[str, List[ApiMatch]] = {}
    for m in api_matches:
        if m.date:
            by_date.setdefault(m.date, []).append(m)
    for items in by_date.values():
        items.sort(key=lambda x: x.utc_date)
    return by_date


def update_entry(local: LocalMatch, api: ApiMatch) -> Tuple[str, bool]:
    fields = parse_fields(local.body)
    current = {
        "homeScore": parse_int_value(fields.get("homeScore")),
        "awayScore": parse_int_value(fields.get("awayScore")),
        "penHome": parse_int_value(fields.get("penHome")),
        "penAway": parse_int_value(fields.get("penAway")),
        "status": parse_str_value(fields.get("status")),
    }

    # Only set scores when the API has a score. Status can update without score.
    desired = dict(current)
    if api.home_score is not None and api.away_score is not None:
        desired["homeScore"] = api.home_score
        desired["awayScore"] = api.away_score
    if api.pen_home is not None and api.pen_away is not None:
        desired["penHome"] = api.pen_home
        desired["penAway"] = api.pen_away
    else:
        desired["penHome"] = None
        desired["penAway"] = None
    if api.status in KNOWN_STATUSES:
        desired["status"] = api.status

    changed = desired != current
    if not changed:
        return local.full_text, False

    # Preserve date and sortOrder from the local file.
    date = parse_str_value(fields.get("date")) or local.date or ""
    sort_order = parse_int_value(fields.get("sortOrder")) or local.sort_order or 0

    status_part = f', status: {js_value(desired["status"])}' if desired.get("status") else ""
    body = (
        f'homeScore: {js_value(desired["homeScore"])}, '
        f'awayScore: {js_value(desired["awayScore"])}, '
        f'penHome: {js_value(desired["penHome"])}, '
        f'penAway: {js_value(desired["penAway"])}, '
        f'date: {js_value(date)}, sortOrder: {sort_order}{status_part}'
    )
    new_entry = f'{local.comments}{local.indent}"{local.id}": {{ {body} }}{local.trailing}'
    return new_entry, True


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--resultats", default="resultats.js", help="Path to resultats.js")
    args = parser.parse_args()

    token = os.getenv("FOOTBALL_DATA_TOKEN")
    if not token:
        print("FOOTBALL_DATA_TOKEN is not set", file=sys.stderr)
        return 2

    path = args.resultats
    with open(path, "r", encoding="utf-8") as f:
        text = f.read()

    locals_ = parse_local_matches(text)
    print(f"Loaded {len(locals_)} local matches from {path}")

    url = build_api_url()
    print(f"Fetching {url}")
    payload = football_data_get(url, token)
    api_matches = [parse_api_match(m) for m in payload.get("matches", [])]
    print(f"Loaded {len(api_matches)} matches from football-data.org")
    for m in api_matches:
        print(
            "API match:",
            m.home_tla or "?",
            m.home_score,
            "-",
            m.away_score,
            m.away_tla or "?",
            "status=" + (m.status or "?"),
            "date=" + (m.date or "?"),
        )

    # First match by exact known teams, then by date/order for knockout matches whose local file has slots.
    date_index = make_date_index(api_matches)
    used_api_ids: set[Any] = set()
    replacements: Dict[Tuple[int, int], str] = {}
    changed_ids: List[str] = []

    for local in locals_:
        api = match_by_teams(local, api_matches)

        if api:
            used_api_ids.add(api.raw.get("id"))
        else:
            # Never use date/order fallback for group-stage matches.
            # Group-stage fixtures have real team names, so a failed exact match
            # should not risk copying another same-day score into the wrong fixture.
            if local.id.startswith("G-"):
                print(
                    f"Warning: no exact API match for {local.id} "
                    f"({local.home_name} vs {local.away_name}); skipping fallback."
                )
                continue

            # Date/order fallback: use the full same-day API list, not the already-filtered leftover list.
            if not local.date:
                continue

            date_items_all = sorted(
                date_index.get(local.date, []),
                key=lambda x: x.utc_date,
            )

            local_same_day = sorted(
                [lm for lm in locals_ if lm.date == local.date],
                key=lambda lm: lm.sort_order or 9999,
            )

            try:
                same_day_index = [lm.id for lm in local_same_day].index(local.id)
            except ValueError:
                same_day_index = -1

            if 0 <= same_day_index < len(date_items_all):
                candidate = date_items_all[same_day_index]

                if candidate.raw.get("id") not in used_api_ids:
                    api = candidate
                    used_api_ids.add(candidate.raw.get("id"))
                else:
                    continue
            else:
                continue

        new_entry, changed = update_entry(local, api)

        if changed:
            replacements[(local.start, local.end)] = new_entry
            changed_ids.append(local.id)
            print(
                f"Will update {local.id}: "
                f"{api.home_tla or '?'} {api.home_score}-{api.away_score} "
                f"{api.away_tla or '?'} status={api.status}"
            )

    if not replacements:
        print("No result changes to commit.")
        return 0

    # Apply replacements from end to start so offsets remain valid.
    new_text = text
    for (start, end), replacement in sorted(replacements.items(), reverse=True):
        new_text = new_text[:start] + replacement + new_text[end:]

    # Update PORRA_ULTIM_PARTIT to the latest changed match by sortOrder.
    latest = None
    by_id = {lm.id: lm for lm in locals_}
    for mid in changed_ids:
        lm = by_id.get(mid)
        if lm and (latest is None or (lm.sort_order or 0) > (latest.sort_order or 0)):
            latest = lm
    if latest:
        new_text = re.sub(
            r'window\.PORRA_ULTIM_PARTIT\s*=\s*"[^"]*"\s*;',
            f'window.PORRA_ULTIM_PARTIT = "{latest.id}";',
            new_text,
            count=1,
        )

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_text)

    print(f"Updated {len(changed_ids)} match entries: {', '.join(changed_ids)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
