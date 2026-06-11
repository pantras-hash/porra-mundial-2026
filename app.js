const state = { data: null, leaderFilter: "", predictionFilter: "" };

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function num(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function display(value, fallback = "Per definir") {
  if (value === null || value === undefined || value === "" || value === "#N/A") return fallback;
  if (String(value).trim().toUpperCase() === "TBD") return fallback;
  return value;
}

function translateGroupName(value) {
  const text = String(value ?? "");
  const match = text.match(/^GROUP\s+([A-L])$/i);
  return match ? `Grup ${match[1].toUpperCase()}` : text;
}

function translateThirdGroup(value) {
  const text = String(value ?? "");
  const match = text.match(/^3([A-L])$/i);
  return match ? `3r del grup ${match[1].toUpperCase()}` : display(value, "");
}

function translateStatus(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (/QUALIFIED/i.test(text)) return "✓ Classificat";
  if (/ELIMINATED/i.test(text)) return "Eliminat";
  return text;
}

function translateRoundName(value) {
  const map = {
    "Round of 32": "Setzens de final",
    "Round of 16": "Vuitens de final",
    "Quarter-finals": "Quarts de final",
    "Semi-finals": "Semifinals",
    "Third place": "Partit pel tercer lloc",
    "Final": "Final",
  };
  return map[value] || value;
}

function score(homeScore, awayScore) {
  if (homeScore === null || homeScore === undefined || homeScore === "") return "–";
  if (awayScore === null || awayScore === undefined || awayScore === "") return "–";
  return `${homeScore}–${awayScore}`;
}

function percentageWidth(value, max) {
  if (!max) return 0;
  return Math.max(4, Math.round((value / max) * 100));
}

async function loadData() {
  const cfg = window.SHEET_CONFIG || {};
  const tabValues = cfg.tabs ? Object.values(cfg.tabs) : [];
  const hasLiveConfig = cfg.sheetId && tabValues.length && tabValues.every(Boolean);

  if (!hasLiveConfig) {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No s’ha pogut carregar data.json. Serveix aquesta carpeta amb un servidor web local o publica-la en línia.");
    const data = await res.json();
    data.meta = data.meta || {};
    data.meta.source = "data.json inclòs";
    return data;
  }

  const rows = {};
  for (const [name, gid] of Object.entries(cfg.tabs)) {
    const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(cfg.sheetId)}/export?format=csv&gid=${encodeURIComponent(gid)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`No s’ha pogut carregar la pestanya de Google Sheets: ${name}`);
    rows[name] = parseCsv(await res.text());
  }
  return buildDataFromRows(rows, "Google Sheets");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(clean(field));
      field = "";
    } else if (ch === "\n") {
      row.push(clean(field));
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  row.push(clean(field));
  rows.push(row);
  return rows;
}

function clean(value) {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed.replace(/,/g, ""));
  if (Number.isFinite(numeric) && /^-?\d+(\.\d+)?$/.test(trimmed.replace(/,/g, ""))) return numeric;
  return trimmed;
}

function cell(rows, r, c) {
  return rows?.[r - 1]?.[c - 1] ?? null;
}

function buildDataFromRows(raw, source) {
  return {
    meta: { source, generatedAt: new Date().toISOString(), mode: "google-sheets-csv" },
    leaderboard: parseLeaderboard(raw.classificacio),
    stats: parseStats(raw.estadistica),
    groups: parseGroups(raw.faseGrups),
    thirdPlaces: parseThirds(raw.thirds),
    knockout: parseKnockout(raw.eliminatories),
  };
}

function parseLeaderboard(rows) {
  const headers = [...(rows?.[0] || [])];
  if (!headers[0]) headers[0] = "Participant";
  const out = [];
  for (const row of (rows || []).slice(1, 250)) {
    const name = row[0];
    if (!name) continue;
    const breakdown = {};
    headers.slice(3).forEach((header, i) => {
      if (header) breakdown[String(header)] = num(row[i + 3]);
    });
    out.push({ name, paid: row[1], total: num(row[2]), breakdown });
  }
  out.sort((a, b) => b.total - a.total || String(a.name).localeCompare(String(b.name)));
  let lastTotal = null;
  let rank = 0;
  out.forEach((row, index) => {
    if (row.total !== lastTotal) {
      rank = index + 1;
      lastTotal = row.total;
    }
    row.rank = rank;
  });
  return out;
}

function parseStats(rows) {
  const predictions = [];
  const teamSummary = [];
  const scorerSummary = [];
  for (const row of (rows || []).slice(1, 250)) {
    if (row[0]) {
      predictions.push({
        name: row[0], champion: row[1], runnerUp: row[2], third: row[3], fourth: row[4],
        topScorer: row[5], topScorerGoals: row[6],
      });
    }
    if (row[8]) {
      teamSummary.push({ team: row[8], champion: num(row[9]), runnerUp: num(row[10]), third: num(row[11]), fourth: num(row[12]), total: num(row[13]) });
    }
    if (row[14]) scorerSummary.push({ player: row[14], count: num(row[15]) });
  }
  teamSummary.sort((a, b) => b.total - a.total || a.team.localeCompare(b.team));
  scorerSummary.sort((a, b) => b.count - a.count || a.player.localeCompare(b.player));
  return { predictions, teamSummary, scorerSummary };
}

function parseGroups(rows) {
  const groups = [];
  for (let i = 1; i <= (rows || []).length; i += 1) {
    const label = cell(rows, i, 1);
    if (typeof label !== "string" || !label.toUpperCase().startsWith("GROUP ")) continue;
    const group = { name: label, matches: [], standings: [] };
    for (let r = i + 3; r <= i + 8; r += 1) {
      if (cell(rows, r, 1) && cell(rows, r, 6)) {
        group.matches.push({ home: cell(rows, r, 1), homeScore: cell(rows, r, 3), awayScore: cell(rows, r, 5), away: cell(rows, r, 6), winner: cell(rows, r, 8) });
      }
    }
    for (let r = i + 12; r <= i + 15; r += 1) {
      if (cell(rows, r, 2)) {
        group.standings.push({ pos: num(cell(rows, r, 1)), team: cell(rows, r, 2), played: num(cell(rows, r, 3)), wins: num(cell(rows, r, 4)), draws: num(cell(rows, r, 5)), losses: num(cell(rows, r, 6)), gf: num(cell(rows, r, 7)), ga: num(cell(rows, r, 8)), gd: num(cell(rows, r, 9)), pts: num(cell(rows, r, 10)), rank: num(cell(rows, r, 11)) });
      }
    }
    groups.push(group);
  }
  return groups;
}

function parseThirds(rows) {
  const out = [];
  for (let r = 5; r <= Math.min((rows || []).length, 80); r += 1) {
    const group = cell(rows, r, 1);
    const team = cell(rows, r, 2);
    if (!group || !team || typeof group !== "string" || !group.startsWith("3")) continue;
    out.push({ group, team, played: num(cell(rows, r, 3)), wins: num(cell(rows, r, 4)), draws: num(cell(rows, r, 5)), losses: num(cell(rows, r, 6)), gf: num(cell(rows, r, 7)), ga: num(cell(rows, r, 8)), gd: num(cell(rows, r, 9)), pts: num(cell(rows, r, 10)), qualified: cell(rows, r, 11), rank: num(cell(rows, r, 12)) });
  }
  out.sort((a, b) => a.rank - b.rank || b.pts - a.pts || b.gd - a.gd || a.team.localeCompare(b.team));
  return out;
}

function parseKnockout(rows) {
  const roundNames = {
    "ROUND OF 32": "Setzens de final",
    "ROUND OF 16": "Vuitens de final",
    "QUARTER-FINALS": "Quarts de final",
    "SEMI-FINALS": "Semifinals",
    "THIRD PLACE MATCH": "Partit pel tercer lloc",
    "🏆 FINAL 🏆": "Final",
  };
  const rounds = [];
  let current = null;
  for (let i = 1; i <= Math.min((rows || []).length, 140); i += 1) {
    const label = cell(rows, i, 1);
    if (roundNames[label]) {
      current = { name: roundNames[label], matches: [] };
      rounds.push(current);
      continue;
    }
    if (!current || typeof label !== "string" || !/^M\d+$/.test(label)) continue;
    current.matches.push({ id: label, home: cell(rows, i, 2), homeSeed: cell(rows, i, 3), homeScore: cell(rows, i, 4), awayScore: cell(rows, i, 5), away: cell(rows, i, 6), awaySeed: cell(rows, i, 7), winner: cell(rows, i, 8), penHome: cell(rows, i, 9), penAway: cell(rows, i, 10), otherResult: cell(rows, i, 11) });
  }
  const qualifiers = [];
  for (let r = 6; r <= 17; r += 1) {
    if (cell(rows, r, 1)) qualifiers.push({ group: cell(rows, r, 1), winner: cell(rows, r, 2), runnerUp: cell(rows, r, 4), third: cell(rows, r, 6), thirdPts: num(cell(rows, r, 7)), thirdGd: num(cell(rows, r, 8)) });
  }
  return {
    rounds,
    qualifiers,
    results: { fourth: cell(rows, 77, 2), third: cell(rows, 78, 2), runnerUp: cell(rows, 79, 2), champion: cell(rows, 80, 2), topScorer: cell(rows, 79, 6), topScorerGoals: cell(rows, 80, 6) },
  };
}

function render() {
  const data = state.data;
  renderKpis(data);
  renderBars("#championPicks", data.stats.teamSummary.slice(0, 8), "team", "total");
  renderBars("#scorerPicks", data.stats.scorerSummary.slice(0, 8), "player", "count");
  renderTopLeaders(data.leaderboard.slice(0, 5));
  renderLeaderboard(data.leaderboard);
  renderPredictions(data.stats.predictions);
  renderGroups(data.groups);
  renderThirds(data.thirdPlaces);
  renderBracket(data.knockout);
  renderSource(data.meta);
}

function renderKpis(data) {
  const gamesPlayed = data.groups.flatMap(g => g.matches).filter(m => m.homeScore !== null && m.homeScore !== undefined && m.awayScore !== null && m.awayScore !== undefined).length;
  const paid = data.leaderboard.filter(p => String(p.paid || "").toLowerCase().includes("fet")).length;
  const leader = data.leaderboard[0];
  const kpis = [
    ["Participants", data.leaderboard.length],
    ["Pagats", `${paid}/${data.leaderboard.length}`],
    ["Partits amb resultat", gamesPlayed],
    ["Líder actual", leader ? `${leader.name} (${leader.total})` : "Per definir"],
  ];
  $("#kpis").innerHTML = kpis.map(([label, value]) => `<article class="kpi"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`).join("");
}

function renderBars(selector, rows, labelKey, valueKey) {
  const max = Math.max(...rows.map(r => num(r[valueKey])), 0);
  $(selector).innerHTML = rows.map(row => {
    const value = num(row[valueKey]);
    return `<div class="bar-row">
      <div class="bar-row__top"><span>${escapeHtml(row[labelKey])}</span><strong>${value}</strong></div>
      <div class="bar"><span style="width:${percentageWidth(value, max)}%"></span></div>
    </div>`;
  }).join("") || `<p class="muted">Encara no hi ha dades.</p>`;
}

function renderTopLeaders(rows) {
  $("#topLeaders").innerHTML = rows.map(row => `<div class="podium-card">
    <span class="rank">#${row.rank}</span>
    <strong>${escapeHtml(row.name)}</strong>
    <span>${row.total} punts</span>
  </div>`).join("");
}

function table(headers, rows) {
  return `<thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody>`;
}

function renderLeaderboard(rows) {
  const filter = state.leaderFilter.toLowerCase();
  const visible = rows.filter(row => row.name.toLowerCase().includes(filter));
  const allBreakdowns = [...new Set(rows.flatMap(row => Object.keys(row.breakdown || {})))].slice(0, 12);
  const headers = ["Pos.", "Participant", "Pagat", "Total", ...allBreakdowns];
  const body = visible.map(row => `<tr>
    <td><span class="pill">${row.rank}</span></td>
    <td><strong>${escapeHtml(row.name)}</strong></td>
    <td>${row.paid ? `<span class="paid">${escapeHtml(row.paid)}</span>` : ""}</td>
    <td><strong>${row.total}</strong></td>
    ${allBreakdowns.map(key => `<td>${num(row.breakdown[key])}</td>`).join("")}
  </tr>`);
  $("#leaderboardTable").innerHTML = table(headers, body);
}

function renderPredictions(rows) {
  const filter = state.predictionFilter.toLowerCase();
  const visible = rows.filter(row => Object.values(row).join(" ").toLowerCase().includes(filter));
  const body = visible.map(row => `<tr>
    <td><strong>${escapeHtml(row.name)}</strong></td>
    <td>${escapeHtml(display(row.champion))}</td>
    <td>${escapeHtml(display(row.runnerUp))}</td>
    <td>${escapeHtml(display(row.third))}</td>
    <td>${escapeHtml(display(row.fourth))}</td>
    <td>${escapeHtml(display(row.topScorer))}</td>
    <td>${escapeHtml(display(row.topScorerGoals, ""))}</td>
  </tr>`);
  $("#predictionsTable").innerHTML = table(["Participant", "Campió", "Subcampió", "3r", "4t", "Màxim golejador", "Gols"], body);
}

function renderGroups(groups) {
  $("#groupsGrid").innerHTML = groups.map(group => `<article class="card group-card">
    <div class="card__header"><h2>${escapeHtml(translateGroupName(group.name))}</h2></div>
    <div class="mini-table"><table>${table(["#", "Equip", "PJ", "DG", "Pts"], group.standings.map(row => `<tr><td>${row.pos}</td><td>${escapeHtml(row.team)}</td><td>${row.played}</td><td>${row.gd}</td><td><strong>${row.pts}</strong></td></tr>`))}</table></div>
    <div class="matches">${group.matches.map(match => `<div class="match-line"><span>${escapeHtml(match.home)}</span><strong>${score(match.homeScore, match.awayScore)}</strong><span>${escapeHtml(match.away)}</span></div>`).join("")}</div>
  </article>`).join("");
}

function renderThirds(rows) {
  const body = rows.map(row => `<tr>
    <td><span class="pill">${row.rank}</span></td><td>${escapeHtml(translateThirdGroup(row.group))}</td><td><strong>${escapeHtml(row.team)}</strong></td><td>${row.played}</td><td>${row.gd}</td><td>${row.pts}</td><td>${escapeHtml(translateStatus(row.qualified))}</td>
  </tr>`);
  $("#thirdsTable").innerHTML = table(["Pos.", "Grup", "Equip", "PJ", "DG", "Pts", "Estat"], body);
}

function renderBracket(knockout) {
  const results = knockout.results || {};
  const resultItems = [
    ["Campió", display(results.champion)],
    ["Subcampió", display(results.runnerUp)],
    ["Tercer lloc", display(results.third)],
    ["Quart lloc", display(results.fourth)],
    ["Màxim golejador", display(results.topScorer)],
    ["Gols del màxim golejador", display(results.topScorerGoals, "Per definir")],
  ];
  $("#tournamentResults").innerHTML = resultItems.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");

  $("#bracketGrid").innerHTML = (knockout.rounds || []).map(round => `<article class="round-card">
    <h2>${escapeHtml(translateRoundName(round.name))}</h2>
    ${round.matches.map(match => `<div class="knockout-match">
      <div class="match-meta"><span>${escapeHtml(match.id)}</span><span>${escapeHtml(match.homeSeed || "")}${match.awaySeed ? " contra " + escapeHtml(match.awaySeed) : ""}</span></div>
      <div class="teams"><span>${escapeHtml(display(match.home))}</span><strong>${score(match.homeScore, match.awayScore)}</strong><span>${escapeHtml(display(match.away))}</span></div>
      <div class="winner">Guanyador: <strong>${escapeHtml(display(match.winner))}</strong></div>
    </div>`).join("")}
  </article>`).join("");
}

function renderSource(meta) {
  const generated = meta.generatedAt ? new Date(meta.generatedAt).toLocaleString() : "hora desconeguda";
  $("#sourceLabel").textContent = `${meta.source || meta.sourceFile || "Dades"} · actualitzat ${generated}`;
}

function activateTab(target) {
  $$(".tab").forEach(tab => tab.classList.toggle("is-active", tab.dataset.target === target));
  $$(".panel").forEach(panel => panel.classList.toggle("is-active", panel.id === target));
  history.replaceState(null, "", `#${target}`);
}

async function init() {
  $$(".tab").forEach(tab => tab.addEventListener("click", () => activateTab(tab.dataset.target)));
  $$('[data-jump]').forEach(link => link.addEventListener("click", (event) => { event.preventDefault(); activateTab(link.dataset.jump); }));
  $("#leaderSearch").addEventListener("input", event => { state.leaderFilter = event.target.value; renderLeaderboard(state.data.leaderboard); });
  $("#predictionSearch").addEventListener("input", event => { state.predictionFilter = event.target.value; renderPredictions(state.data.stats.predictions); });
  $("#refreshBtn").addEventListener("click", refresh);
  await refresh();
  const initial = location.hash.replace("#", "");
  if (initial && $(`#${initial}`)) activateTab(initial);
  const minutes = Number(window.SHEET_CONFIG?.refreshMinutes || 0);
  if (minutes > 0) setInterval(refresh, minutes * 60 * 1000);
}

async function refresh() {
  try {
    $("#sourceLabel").textContent = "Actualitzant…";
    state.data = await loadData();
    render();
  } catch (error) {
    console.error(error);
    $("#sourceLabel").textContent = "Error carregant les dades";
    document.querySelector("main").insertAdjacentHTML("afterbegin", `<div class="error">${escapeHtml(error.message)}</div>`);
  }
}

init();
