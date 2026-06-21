#!/usr/bin/env python3
"""Generate ranking_history_latest.js for the World Cup porra.

This script precomputes the position-over-time data shown in the participant drawer.
It reads:
  - monte_carlo_data.json
  - resultats.js

and writes:
  - ranking_history_latest.js

The website only needs ranking_history_latest.js. Timestamped archive files are intentionally not written.
"""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

FINAL_STATUSES = {"FINISHED", "AWARDED", "FINISHED_PEN", "AFTER_PENALTIES"}
GROUP_LETTERS = list("ABCDEFGHIJKL")


def norm_team(t: Optional[str]) -> Optional[str]:
    if t is None:
        return None
    s = str(t).strip()
    if not s or s in ("#N/A", "TBD", "None", "null"):
        return None
    repl = {
        "South Korea": "Korea Republic",
        "United States": "USA",
        "Turkey": "Türkiye",
        "Turkiye": "Türkiye",
        "Ivory Coast": "Côte d'Ivoire",
        "Côte d’Ivoire": "Côte d'Ivoire",
        "Cote d'Ivoire": "Côte d'Ivoire",
        "Iran": "IR Iran",
        "Cape Verde": "Cabo Verde",
        "Bosnia and Herzegovina": "Bosnia-Herzegovina",
        "Bosnia Herzegovina": "Bosnia-Herzegovina",
        "Panam": "Panama",
        "Curacao": "Curaçao",
    }
    return repl.get(s, s)


def display_name(name: str, all_names: List[str]) -> str:
    def base(n: str) -> str:
        parts = str(n).strip().split()
        if len(parts) < 2:
            return str(n).strip()
        return f"{parts[0]} {parts[1][0].upper()}."

    bases = {n: base(n) for n in all_names}
    counts = Counter(bases.values())
    if counts[bases[name]] == 1:
        return bases[name]

    parts = str(name).strip().split()
    if len(parts) >= 2:
        return f"{parts[0]} {parts[1][:2].title()}."
    return bases[name]


def parse_js_field(body: str, name: str) -> Any:
    m = re.search(rf'{name}\s*:\s*("[^"]*"|null|-?\d+(?:\.\d+)?)', body)
    if not m:
        return None
    raw = m.group(1)
    if raw == "null":
        return None
    if raw.startswith('"'):
        return raw.strip('"')
    try:
        return int(float(raw))
    except Exception:
        return None


def parse_resultats(path: Path) -> Dict[str, Dict[str, Any]]:
    text = path.read_text(encoding="utf-8")
    out: Dict[str, Dict[str, Any]] = {}
    entry_re = re.compile(r'"(?P<id>[^"]+)"\s*:\s*\{(?P<body>.*?)\}', re.S)

    for m in entry_re.finditer(text):
        mid = m.group("id")
        body = m.group("body")
        out[mid] = {
            "homeScore": parse_js_field(body, "homeScore"),
            "awayScore": parse_js_field(body, "awayScore"),
            "penHome": parse_js_field(body, "penHome"),
            "penAway": parse_js_field(body, "penAway"),
            "date": parse_js_field(body, "date"),
            "sortOrder": parse_js_field(body, "sortOrder"),
            "status": parse_js_field(body, "status") or "",
        }
    return out


def finished_result(row: Dict[str, Any]) -> bool:
    return (
        isinstance(row.get("homeScore"), int)
        and isinstance(row.get("awayScore"), int)
        and row.get("status") in FINAL_STATUSES
    )


def outcome(home_score: int, away_score: int, home: str, away: str) -> str:
    if home_score > away_score:
        return home
    if away_score > home_score:
        return away
    return "Empat"


def result_winner(home: str, away: str, row: Dict[str, Any]) -> Optional[str]:
    hs = row.get("homeScore")
    aw = row.get("awayScore")
    if not isinstance(hs, int) or not isinstance(aw, int):
        return None
    if hs > aw:
        return home
    if aw > hs:
        return away
    ph = row.get("penHome")
    pa = row.get("penAway")
    if isinstance(ph, int) and isinstance(pa, int):
        if ph > pa:
            return home
        if pa > ph:
            return away
    return None


def rank_key_table(row: Dict[str, Any]) -> Tuple[int, int, int, str]:
    # Higher points, GD, GF, then alphabetical for deterministic reconstruction.
    return (-row["pts"], -(row["gf"] - row["ga"]), -row["gf"], row["team"])


def compute_group_table(group: str, data: Dict[str, Any], results: Dict[str, Dict[str, Any]], upto_sort: int) -> Optional[List[Dict[str, Any]]]:
    teams = [norm_team(t) for t in data["groups"][group]]
    table = {t: {"team": t, "pts": 0, "gf": 0, "ga": 0} for t in teams}

    group_matches = [
        m for m in data["matches"]
        if m.get("type") == "group" and m.get("group") == group
    ]

    finished = 0
    for m in group_matches:
        row = results.get(m["id"], {})
        sort_order = row.get("sortOrder") or m.get("sortOrder") or 999
        if sort_order > upto_sort or not finished_result(row):
            continue

        home = norm_team(m["home"])
        away = norm_team(m["away"])
        hs = row["homeScore"]
        aw = row["awayScore"]
        table[home]["gf"] += hs
        table[home]["ga"] += aw
        table[away]["gf"] += aw
        table[away]["ga"] += hs
        if hs > aw:
            table[home]["pts"] += 3
        elif aw > hs:
            table[away]["pts"] += 3
        else:
            table[home]["pts"] += 1
            table[away]["pts"] += 1
        finished += 1

    if finished < len(group_matches):
        return None

    return sorted(table.values(), key=rank_key_table)


def compute_all_group_tables(data: Dict[str, Any], results: Dict[str, Dict[str, Any]], upto_sort: int) -> Dict[str, Optional[List[Dict[str, Any]]]]:
    return {g: compute_group_table(g, data, results, upto_sort) for g in GROUP_LETTERS}


def best_third_groups(tables: Dict[str, Optional[List[Dict[str, Any]]]]) -> List[str]:
    thirds = []
    for g, table in tables.items():
        if table and len(table) >= 3:
            r = dict(table[2])
            r["group"] = g
            thirds.append(r)
    thirds.sort(key=rank_key_table)
    return [r["group"] for r in thirds[:8]]


def resolve_group_slot(slot: str, tables: Dict[str, Optional[List[Dict[str, Any]]]], third_matrix: Dict[str, Dict[str, str]]) -> Optional[str]:
    slot = str(slot)
    if re.fullmatch(r"[123][A-L]", slot):
        pos = int(slot[0]) - 1
        group = slot[1]
        table = tables.get(group)
        if table and len(table) > pos:
            return table[pos]["team"]
        return None

    if slot.startswith("third:"):
        first_slot = slot.split(":", 1)[1]
        third_groups = best_third_groups(tables)
        if len(third_groups) < 8:
            return None
        key = "".join(sorted(third_groups))
        mapping = third_matrix.get(key)
        if not mapping:
            return None
        mapped = mapping.get(first_slot)
        if not mapped:
            return None
        return resolve_group_slot(mapped, tables, third_matrix)

    return None


def resolve_knockout_match(mid: str, data: Dict[str, Any], results: Dict[str, Dict[str, Any]], upto_sort: int, tables: Dict[str, Optional[List[Dict[str, Any]]]], cache: Dict[str, Tuple[Optional[str], Optional[str]]]) -> Tuple[Optional[str], Optional[str]]:
    if mid in cache:
        return cache[mid]

    match_by_id = {m["id"]: m for m in data["matches"]}
    m = match_by_id.get(mid)
    if not m:
        cache[mid] = (None, None)
        return cache[mid]

    def resolve_slot(slot: str) -> Optional[str]:
        slot = str(slot)
        if slot.startswith("W") or slot.startswith("L"):
            prior_id = "M" + slot[1:] if not slot[1:].startswith("M") else slot[1:]
            prior_home, prior_away = resolve_knockout_match(prior_id, data, results, upto_sort, tables, cache)
            row = results.get(prior_id, {})
            prior_m = match_by_id.get(prior_id, {})
            prior_sort = row.get("sortOrder") or prior_m.get("sortOrder") or 999
            if prior_sort > upto_sort or not prior_home or not prior_away or not finished_result(row):
                return None
            winner = result_winner(prior_home, prior_away, row)
            if not winner:
                return None
            if slot.startswith("W"):
                return winner
            return prior_away if winner == prior_home else prior_home
        return resolve_group_slot(slot, tables, data.get("thirdPlaceMatrix", {}))

    home = resolve_slot(m.get("homeSlot"))
    away = resolve_slot(m.get("awaySlot"))
    cache[mid] = (home, away)
    return cache[mid]


def score_player(player: Dict[str, Any], data: Dict[str, Any], results: Dict[str, Dict[str, Any]], upto_sort: int) -> int:
    points = 0

    # Group-match points.
    for pred in player.get("groupMatches", []):
        mid = pred["id"]
        row = results.get(mid, {})
        m = next((x for x in data["matches"] if x["id"] == mid), None)
        if not m:
            continue
        sort_order = row.get("sortOrder") or m.get("sortOrder") or 999
        if sort_order > upto_sort or not finished_result(row):
            continue

        home = norm_team(m["home"])
        away = norm_team(m["away"])
        actual_hs = row["homeScore"]
        actual_as = row["awayScore"]
        actual_outcome = outcome(actual_hs, actual_as, home, away)

        if norm_team(pred.get("winner")) == actual_outcome:
            points += 3
        if pred.get("homeScore") == actual_hs:
            points += max(2, actual_hs)
        if pred.get("awayScore") == actual_as:
            points += max(2, actual_as)

    # Group-standings points, awarded only once the whole group is complete.
    tables = compute_all_group_tables(data, results, upto_sort)
    group_preds = player.get("groupStandings", {})
    for g, table in tables.items():
        if not table:
            continue
        preds = group_preds.get(g, [])
        for pos in range(min(4, len(table), len(preds))):
            actual = table[pos]
            pred = preds[pos]
            if norm_team(pred.get("team")) == actual["team"]:
                points += 4
            if pred.get("gf") == actual["gf"]:
                points += 4
            if pred.get("pts") == actual["pts"]:
                points += 4

    # Knockout points for finished knockout games. This will matter later.
    match_by_id = {m["id"]: m for m in data["matches"]}
    kpreds = {p["id"]: p for p in player.get("knockoutMatches", [])}
    tables_for_slots = tables
    cache: Dict[str, Tuple[Optional[str], Optional[str]]] = {}

    stage_cfg = [
        ([f"M{i}" for i in range(73, 89)], 4, 4, 4),
        ([f"M{i}" for i in range(89, 97)], 6, 6, None),
        ([f"M{i}" for i in range(97, 101)], 8, 6, None),
        ([f"M{i}" for i in range(101, 103)], 10, 8, None),
    ]

    for mids, team_pts, goal_pts, goal_min in stage_cfg:
        actual_stage_teams = set()
        actual_by_mid = {}
        for mid in mids:
            m = match_by_id.get(mid)
            row = results.get(mid, {})
            sort_order = row.get("sortOrder") or (m or {}).get("sortOrder") or 999
            if sort_order > upto_sort or not finished_result(row):
                continue
            home, away = resolve_knockout_match(mid, data, results, upto_sort, tables_for_slots, cache)
            if home and away:
                actual_stage_teams.update([home, away])
                actual_by_mid[mid] = (home, away, row)

        for mid in mids:
            pred = kpreds.get(mid)
            if not pred:
                continue
            ph = norm_team(pred.get("home"))
            pa = norm_team(pred.get("away"))
            if ph in actual_stage_teams:
                points += team_pts
            if pa in actual_stage_teams:
                points += team_pts
            if mid in actual_by_mid:
                ah, aa, row = actual_by_mid[mid]
                if ph == ah:
                    points += team_pts
                if pa == aa:
                    points += team_pts
                if pred.get("homeScore") == row.get("homeScore"):
                    points += max(goal_min, row["homeScore"]) if goal_min is not None else goal_pts
                if pred.get("awayScore") == row.get("awayScore"):
                    points += max(goal_min, row["awayScore"]) if goal_min is not None else goal_pts

    # Final / third-place special points if they are finished.
    for mid, finalist_pts, goals_pts in [("M103", 12, 10), ("M104", 15, 10)]:
        m = match_by_id.get(mid)
        row = results.get(mid, {})
        sort_order = row.get("sortOrder") or (m or {}).get("sortOrder") or 999
        if not m or sort_order > upto_sort or not finished_result(row):
            continue

        home, away = resolve_knockout_match(mid, data, results, upto_sort, tables_for_slots, cache)
        pred = kpreds.get(mid)
        if not pred or not home or not away:
            continue

        ph = norm_team(pred.get("home"))
        pa = norm_team(pred.get("away"))
        if ph in {home, away}:
            points += finalist_pts
        if pa in {home, away}:
            points += finalist_pts
        if pred.get("homeScore") == row.get("homeScore"):
            points += goals_pts
        if pred.get("awayScore") == row.get("awayScore"):
            points += goals_pts

    # Medal/champion points if final/third-place are finished.
    row103 = results.get("M103", {})
    row104 = results.get("M104", {})
    if finished_result(row103) and finished_result(row104):
        home103, away103 = resolve_knockout_match("M103", data, results, upto_sort, tables_for_slots, cache)
        home104, away104 = resolve_knockout_match("M104", data, results, upto_sort, tables_for_slots, cache)
        if home103 and away103 and home104 and away104:
            third = result_winner(home103, away103, row103)
            fourth = away103 if third == home103 else home103 if third == away103 else None
            champion = result_winner(home104, away104, row104)
            runner = away104 if champion == home104 else home104 if champion == away104 else None
            summary = player.get("summary", {})
            if norm_team(summary.get("third")) == third:
                points += 20
            if norm_team(summary.get("fourth")) == fourth:
                points += 15
            if norm_team(summary.get("champion")) == champion:
                points += 50
            if norm_team(summary.get("runnerUp")) == runner:
                points += 30

    return int(points)


def score_all_players(data: Dict[str, Any], results: Dict[str, Dict[str, Any]], upto_sort: int) -> Dict[str, int]:
    scores = {}
    for player in data["players"]:
        scores[player["name"]] = score_player(player, data, results, upto_sort)
    return scores


def ranks_from_scores(scores: Dict[str, int]) -> Dict[str, int]:
    ordered = sorted(scores.items(), key=lambda kv: (-kv[1], kv[0]))
    ranks = {}
    prev_score = None
    current_rank = 0
    for idx, (name, score) in enumerate(ordered, start=1):
        if score != prev_score:
            current_rank = idx
            prev_score = score
        ranks[name] = current_rank
    return ranks


def match_label(match: Dict[str, Any], result: Dict[str, Any]) -> str:
    home = norm_team(match.get("home")) or match.get("homeSlot") or "Home"
    away = norm_team(match.get("away")) or match.get("awaySlot") or "Away"
    hs = result.get("homeScore")
    aw = result.get("awayScore")
    return f"{home} {hs}–{aw} {away}"


def build_history(data: Dict[str, Any], results: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    match_by_id = {m["id"]: m for m in data["matches"]}
    finished = []
    for mid, row in results.items():
        if mid not in match_by_id or not finished_result(row):
            continue
        sort_order = row.get("sortOrder") or match_by_id[mid].get("sortOrder") or 999
        finished.append((sort_order, mid, row))
    finished.sort(key=lambda x: (x[0], x[1]))

    player_names = [p["name"] for p in data["players"]]
    short_map = {n: display_name(n, player_names) for n in player_names}
    series_by_player = {short_map[n]: [] for n in player_names}
    snapshots = []

    for idx, (sort_order, mid, row) in enumerate(finished):
        scores = score_all_players(data, results, sort_order)
        ranks = ranks_from_scores(scores)
        m = match_by_id[mid]
        snapshot = {
            "index": idx,
            "matchId": mid,
            "date": row.get("date"),
            "sortOrder": sort_order,
            "label": match_label(m, row),
        }
        snapshots.append(snapshot)
        for full_name in player_names:
            short = short_map[full_name]
            series_by_player[short].append({
                "x": idx,
                "matchId": mid,
                "rank": ranks[full_name],
                "points": scores[full_name],
            })

    now = datetime.now(timezone.utc)
    return {
        "generatedAt": now.isoformat(timespec="seconds").replace("+00:00", "Z"),
        "label": now.strftime("%d %b %Y, %H:%M UTC"),
        "source": "Reconstructed from current official results in resultats.js, replayed in match order",
        "snapshotCount": len(snapshots),
        "playerCount": len(player_names),
        "lastMatchId": snapshots[-1]["matchId"] if snapshots else None,
        "lastMatchLabel": snapshots[-1]["label"] if snapshots else None,
        "snapshots": snapshots,
        "players": [
            {"id": f"p{i+1:02d}", "name": short_map[n], "fullName": n}
            for i, n in enumerate(player_names)
        ],
        "seriesByPlayer": series_by_player,
    }


def write_outputs(history: Dict[str, Any], out_dir: Path, timestamp: Optional[str] = None) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)

    # The website reads only ranking_history_latest.js. Do not write timestamped
    # archive files into ranking_history/, because that folder can grow very large
    # and slow down GitHub Pages deployments.
    js_text = "window.PORRA_RANKING_HISTORY = " + json.dumps(history, ensure_ascii=False, indent=2) + ";\n"

    (out_dir / "ranking_history_latest.js").write_text(js_text, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="monte_carlo_data.json")
    parser.add_argument("--resultats", default="resultats.js")
    parser.add_argument("--out-dir", default=".")
    parser.add_argument("--timestamp", default=None)
    args = parser.parse_args()

    data = json.loads(Path(args.data).read_text(encoding="utf-8"))
    results = parse_resultats(Path(args.resultats))
    history = build_history(data, results)
    write_outputs(history, Path(args.out_dir), args.timestamp)

    print(
        f"Wrote ranking_history_latest.js with "
        f"{history['snapshotCount']} snapshots and {history['playerCount']} players. "
        f"Last match: {history.get('lastMatchId')} {history.get('lastMatchLabel')}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
