(function () {
  const data = window.PORRA_DATA;
  const resultats = window.PORRA_RESULTATS || { matches: {}, final: {}, groupRankingOverrides: {} };
  const state = { filter: '', computed: null };
  const els = {
    status: document.getElementById('dataStatus'),
    nextTitle: document.getElementById('nextMatchTitle'),
    nextMeta: document.getElementById('nextMatchMeta'),
    nextHeader: document.getElementById('nextPredictionHeader'),
    body: document.getElementById('leaderboardBody'),
    search: document.getElementById('searchInput'),
    drawer: document.getElementById('playerDrawer'),
    closeDrawer: document.getElementById('closeDrawer'),
    drawerTitle: document.getElementById('drawerTitle'),
    drawerRank: document.getElementById('drawerRank'),
    drawerSubtitle: document.getElementById('drawerSubtitle'),
    drawerContent: document.getElementById('drawerContent')
  };
  const stageConfig = {
    r32: { keys: rangeKeys(73, 88), team: 'E16', pos: 'E16P', goals: 'G16', teamPts: 4, posPts: 4, goalPts: 4, goalMin: 4 },
    r16: { keys: rangeKeys(89, 96), team: 'E8', pos: 'E8P', goals: 'G8', teamPts: 6, posPts: 6, goalPts: 6 },
    qf:  { keys: rangeKeys(97, 100), team: 'E4', pos: 'E4P', goals: 'G4', teamPts: 8, posPts: 8, goalPts: 6 },
    sf:  { keys: rangeKeys(101, 102), team: 'ES', pos: 'ESP', goals: 'GS', teamPts: 10, posPts: 10, goalPts: 8 }
  };

  function rangeKeys(a, b) { const out = []; for (let i = a; i <= b; i++) out.push('M' + i); return out; }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
  function display(value, fallback = '—') { if (value === null || value === undefined || value === '') return fallback; const s = String(value).trim(); if (!s || s === '#N/A' || s.toUpperCase() === 'TBD') return fallback; return s; }
  function isNum(v) { return typeof v === 'number' && Number.isFinite(v); }
  function scoreText(m) { if (!m || !isNum(m.homeScore) || !isNum(m.awayScore)) return '—'; let s = `${m.homeScore}–${m.awayScore}`; if (isNum(m.penHome) && isNum(m.penAway)) s += ` (${m.penHome}–${m.penAway} pen.)`; return s; }
  function initials(name) { return String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase(); }
  function matchLabel(m) { if (!m) return '—'; return `${display(m.home)} vs ${display(m.away)}`; }
  function matchChronology(m) {
    if (m && typeof m.sortOrder === 'number') return m.sortOrder;
    if (m && m.date) {
      const parsed = Date.parse(`${m.date}T00:00:00Z`);
      if (Number.isFinite(parsed)) return parsed / 86400000;
    }
    return m && typeof m.order === 'number' ? m.order + 100000 : Number.MAX_SAFE_INTEGER;
  }
  function chronologicalMatches(matches) {
    return [...matches].sort((a, b) => matchChronology(a) - matchChronology(b));
  }
  function formatMatchDate(m) {
    if (!m || !m.date) return '';
    const d = new Date(`${m.date}T12:00:00Z`);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('ca-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  }
  function cloneResultsWithout(matchId) {
    const copy = JSON.parse(JSON.stringify(resultats));
    if (matchId && copy.matches && copy.matches[matchId]) {
      copy.matches[matchId] = { homeScore: null, awayScore: null, penHome: null, penAway: null };
    }
    return copy;
  }

  function buildActual(resultsObj) {
    const resultMap = resultsObj.matches || {};
    const groupMatches = data.matches.filter(m => m.type === 'group').map(m => ({ ...m, ...(resultMap[m.id] || {}) }));
    const groups = computeGroups(groupMatches, resultsObj.groupRankingOverrides || {});
    const third = computeThirdPlaces(groups);
    const r32ThirdMap = computeThirdMap(third);
    const allMatches = [];
    for (const gm of groupMatches) {
      allMatches.push({ ...gm, winner: groupWinner(gm) });
    }
    const byId = Object.fromEntries(allMatches.map(m => [m.id, m]));
    for (const tmpl of data.matches.filter(m => m.type === 'knockout')) {
      const base = resultMap[tmpl.id] || {};
      const home = resolveSlot(tmpl.homeSlot, groups, third, r32ThirdMap, byId, 'home');
      const away = resolveSlot(tmpl.awaySlot, groups, third, r32ThirdMap, byId, 'away');
      const km = { ...tmpl, home, away, ...base };
      km.winner = koWinner(km);
      km.loser = koLoser(km);
      byId[km.id] = km;
      allMatches.push(km);
    }
    return { matches: allMatches, byId, groups, third, final: resultsObj.final || {} };
  }

  function groupWinner(m) {
    if (!isNum(m.homeScore) || !isNum(m.awayScore)) return null;
    if (m.homeScore > m.awayScore) return m.home;
    if (m.awayScore > m.homeScore) return m.away;
    return 'Empat';
  }
  function koWinner(m) {
    if (!isNum(m.homeScore) || !isNum(m.awayScore)) return null;
    if (m.homeScore > m.awayScore) return m.home;
    if (m.awayScore > m.homeScore) return m.away;
    if (isNum(m.penHome) && isNum(m.penAway)) {
      if (m.penHome > m.penAway) return m.home;
      if (m.penAway > m.penHome) return m.away;
    }
    return null;
  }
  function koLoser(m) {
    const w = koWinner(m);
    if (!w) return null;
    if (w === m.home) return m.away;
    if (w === m.away) return m.home;
    return null;
  }

  function computeGroups(groupMatches, overrides) {
    const groups = {};
    for (const [g, teams] of Object.entries(data.groups)) {
      const table = Object.fromEntries(teams.map(t => [t, { team: t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }]));
      const matches = groupMatches.filter(m => m.group === g);
      for (const m of matches) {
        if (!isNum(m.homeScore) || !isNum(m.awayScore)) continue;
        const h = table[m.home], a = table[m.away];
        if (!h || !a) continue;
        h.p++; a.p++;
        h.gf += m.homeScore; h.ga += m.awayScore;
        a.gf += m.awayScore; a.ga += m.homeScore;
        if (m.homeScore > m.awayScore) { h.w++; a.l++; h.pts += 3; }
        else if (m.awayScore > m.homeScore) { a.w++; h.l++; a.pts += 3; }
        else { h.d++; a.d++; h.pts += 1; a.pts += 1; }
      }
      Object.values(table).forEach(t => { t.gd = t.gf - t.ga; });
      let arr = Object.values(table);
      arr.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team));
      const override = overrides[g];
      if (Array.isArray(override) && override.length) {
        const order = new Map(override.map((team, idx) => [team, idx]));
        arr.sort((a, b) => (order.has(a.team) ? order.get(a.team) : 999) - (order.has(b.team) ? order.get(b.team) : 999));
      }
      arr.forEach((t, idx) => { t.pos = idx + 1; });
      const complete = matches.length === 6 && matches.every(m => isNum(m.homeScore) && isNum(m.awayScore));
      groups[g] = { table: arr, matches, complete };
    }
    return groups;
  }

  function computeThirdPlaces(groups) {
    const rows = Object.entries(groups).map(([g, obj]) => ({ ...obj.table[2], group: g, seed: '3' + g, complete: obj.complete }));
    const sorted = rows.slice().sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team));
    sorted.forEach((t, idx) => { t.thirdRank = idx + 1; t.qualified = idx < 8 && t.complete; });
    return sorted;
  }

  function computeThirdMap(third) {
    const qualified = third.filter(t => t.qualified).map(t => t.group).sort().join('');
    const matrixRow = data.thirdPlaceMatrix[qualified] || {};
    const map = {};
    for (const [paired, seed] of Object.entries(matrixRow)) {
      const team = third.find(t => t.seed === seed && t.qualified);
      if (team) map[paired] = { seed, team: team.team };
    }
    return map;
  }

  function resolveSlot(slot, groups, third, r32ThirdMap, byId) {
    if (!slot) return null;
    if (slot.startsWith('third:')) {
      const paired = slot.split(':')[1];
      return r32ThirdMap[paired] ? r32ThirdMap[paired].team : null;
    }
    const m = slot.match(/^([123])([A-L])$/);
    if (m) {
      const pos = Number(m[1]), g = m[2];
      const group = groups[g];
      if (!group || !group.complete) return slot;
      return group.table[pos - 1] ? group.table[pos - 1].team : null;
    }
    const w = slot.match(/^W(\d+)$/);
    if (w) return byId['M' + w[1]] ? byId['M' + w[1]].winner : slot;
    const l = slot.match(/^L(\d+)$/);
    if (l) return byId['M' + l[1]] ? byId['M' + l[1]].loser : slot;
    return slot;
  }

  function teamSet(matches, keys) {
    const set = new Set();
    for (const key of keys) {
      const m = matches.byId[key];
      if (m) { if (m.home && !isSeedLike(m.home)) set.add(m.home); if (m.away && !isSeedLike(m.away)) set.add(m.away); }
    }
    return set;
  }
  function isSeedLike(v) { return typeof v === 'string' && (/^[123][A-L]$/.test(v) || /^W\d+$/.test(v) || /^L\d+$/.test(v)); }

  function scorePlayer(player, actual) {
    const bd = { '1X2': 0, G1: 0, CTG: 0, GTG: 0, PTG: 0, E16: 0, E16P: 0, G16: 0, E8: 0, E8P: 0, G8: 0, E4: 0, E4P: 0, G4: 0, ES: 0, ESP: 0, GS: 0, EF: 0, EC: 0, GC: 0, '4rt': 0, '3er': 0, GF: 0, '2on': 0, '1er': 0, PCH: 0, GPCH: 0 };
    const pGroupById = Object.fromEntries(player.groupMatches.map(m => [m.id, m]));
    for (const am of actual.matches.filter(m => m.type === 'group')) {
      if (!isNum(am.homeScore) || !isNum(am.awayScore)) continue;
      const pm = pGroupById[am.id];
      if (!pm) continue;
      if (pm.winner === groupWinner(am)) bd['1X2'] += data.rules['1X2'];
      if (pm.homeScore === am.homeScore) bd.G1 += Math.max(data.rules.G1_MIN, am.homeScore);
      if (pm.awayScore === am.awayScore) bd.G1 += Math.max(data.rules.G1_MIN, am.awayScore);
    }
    for (const [g, obj] of Object.entries(actual.groups)) {
      if (!obj.complete) continue;
      const predRows = player.groupStandings[g] || [];
      for (let i = 0; i < 4; i++) {
        const ar = obj.table[i], pr = predRows[i];
        if (!ar || !pr) continue;
        if (pr.team === ar.team) bd.CTG += data.rules.CTG;
        if (pr.gf === ar.gf) bd.GTG += data.rules.GTG;
        if (pr.pts === ar.pts) bd.PTG += data.rules.PTG;
      }
    }
    const pKoById = Object.fromEntries(player.knockoutMatches.map(m => [m.id, m]));
    for (const cfg of Object.values(stageConfig)) {
      const actualSet = teamSet(actual, cfg.keys);
      for (const key of cfg.keys) {
        const am = actual.byId[key], pm = pKoById[key];
        if (!am || !pm) continue;
        for (const side of ['home', 'away']) {
          const pTeam = pm[side];
          const aTeam = am[side];
          if (pTeam && actualSet.has(pTeam)) bd[cfg.team] += cfg.teamPts;
          if (pTeam && aTeam && pTeam === aTeam) bd[cfg.pos] += cfg.posPts;
        }
        if (isNum(am.homeScore) && isNum(am.awayScore)) {
          if (pm.homeScore === am.homeScore) bd[cfg.goals] += cfg.goalMin ? Math.max(cfg.goalMin, am.homeScore) : cfg.goalPts;
          if (pm.awayScore === am.awayScore) bd[cfg.goals] += cfg.goalMin ? Math.max(cfg.goalMin, am.awayScore) : cfg.goalPts;
        }
      }
    }
    // Finalists and consolation teams.
    const finalM = actual.byId.M104, consM = actual.byId.M103;
    const pFinal = pKoById.M104, pCons = pKoById.M103;
    if (finalM && pFinal) {
      const finalSet = new Set([finalM.home, finalM.away].filter(Boolean));
      for (const t of [pFinal.home, pFinal.away]) if (finalSet.has(t)) bd.EF += data.rules.EF;
      if (isNum(finalM.homeScore) && isNum(finalM.awayScore)) {
        if (pFinal.homeScore === finalM.homeScore) bd.GF += data.rules.GF;
        if (pFinal.awayScore === finalM.awayScore) bd.GF += data.rules.GF;
      }
    }
    if (consM && pCons) {
      const consSet = new Set([consM.home, consM.away].filter(Boolean));
      for (const t of [pCons.home, pCons.away]) if (consSet.has(t)) bd.EC += data.rules.EC;
      if (isNum(consM.homeScore) && isNum(consM.awayScore)) {
        if (pCons.homeScore === consM.homeScore) bd.GC += data.rules.GC;
        if (pCons.awayScore === consM.awayScore) bd.GC += data.rules.GC;
      }
    }
    const finalPlayed = finalM && finalM.winner;
    const thirdPlayed = consM && consM.winner;
    if (thirdPlayed) {
      const third = consM.winner, fourth = consM.loser;
      if (player.summary.third === third) bd['3er'] += data.rules['3er'];
      if (player.summary.fourth === fourth) bd['4rt'] += data.rules['4rt'];
    }
    if (finalPlayed) {
      const champion = finalM.winner, runnerUp = finalM.loser;
      if (player.summary.champion === champion) bd['1er'] += data.rules['1er'];
      if (player.summary.runnerUp === runnerUp) bd['2on'] += data.rules['2on'];
      if (actual.final.topScorer && player.summary.topScorer === actual.final.topScorer) bd.PCH += data.rules.PCH;
      if (isNum(actual.final.topScorerGoals) && player.summary.topScorerGoals === actual.final.topScorerGoals) bd.GPCH += data.rules.GPCH;
    }
    const total = Object.values(bd).reduce((a, b) => a + b, 0);
    return { breakdown: bd, total };
  }

  function computeLeaderboard(resultsObj) {
    const actual = buildActual(resultsObj);
    const rows = data.players.map(player => ({ ...player, ...scorePlayer(player, actual) }));
    rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
    let last = null, rank = 0;
    rows.forEach((r, i) => { if (r.total !== last) { rank = i + 1; last = r.total; } r.rank = rank; });
    return { actual, rows };
  }

  function findLastPlayed(actual) {
    const override = window.PORRA_ULTIM_PARTIT;
    if (override && actual.byId[override]) return actual.byId[override];
    return chronologicalMatches(actual.matches)
      .filter(m => isNum(m.homeScore) && isNum(m.awayScore))
      .sort((a, b) => matchChronology(b) - matchChronology(a))[0] || null;
  }
  function findNextMatch(actual) {
    return chronologicalMatches(actual.matches)
      .find(m => !isSeedLike(m.home) && !isSeedLike(m.away) && (!isNum(m.homeScore) || !isNum(m.awayScore))) || null;
  }
  function playerPredictionFor(player, match) {
    if (!match) return null;
    if (match.type === 'group') return player.groupMatches.find(m => m.id === match.id) || null;
    return player.knockoutMatches.find(m => m.id === match.id) || null;
  }
  function movement(row, prevById) {
    const prev = prevById[row.id];
    if (!prev || prev.rank === row.rank) return { cls: 'same', label: '—' };
    const delta = prev.rank - row.rank;
    if (delta > 0) return { cls: 'up', label: `▲ ${delta}` };
    return { cls: 'down', label: `▼ ${Math.abs(delta)}` };
  }

  function init() {
    const current = computeLeaderboard(resultats);
    const last = findLastPlayed(current.actual);
    const previous = computeLeaderboard(cloneResultsWithout(last && last.id));
    const prevById = Object.fromEntries(previous.rows.map(r => [r.id, r]));
    const next = findNextMatch(current.actual);
    state.computed = { ...current, previous, prevById, last, next };
    els.nextTitle.textContent = next ? matchLabel(next) : 'Tots els partits tenen resultat';
    els.nextMeta.textContent = next ? `${display(next.round)} · ${next.id}${formatMatchDate(next) ? ' · ' + formatMatchDate(next) : ''}` : 'No queda cap partit pendent.';
    els.nextHeader.textContent = next ? `Pronòstic: ${display(next.home)} – ${display(next.away)}` : 'Pròxim partit';
    const generated = data.meta && data.meta.generatedAt ? new Date(data.meta.generatedAt).toLocaleString('ca-ES') : 'snapshot';
    els.status.textContent = `Dades inicials: ${generated}`;
    render();
  }

  function render() {
    const comp = state.computed;
    const q = state.filter.trim().toLowerCase();
    const rows = comp.rows.filter(row => !q || row.name.toLowerCase().includes(q));
    if (!rows.length) {
      els.body.innerHTML = '<tr><td colspan="7" class="empty">No s’ha trobat cap participant.</td></tr>';
      return;
    }
    els.body.innerHTML = rows.map(row => rowHtml(row, comp)).join('');
    els.body.querySelectorAll('tr[data-player]').forEach(tr => {
      tr.addEventListener('click', () => openPlayer(tr.dataset.player));
      tr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlayer(tr.dataset.player); } });
    });
  }
  function rowHtml(row, comp) {
    const m = movement(row, comp.prevById);
    const nextPred = playerPredictionFor(row, comp.next);
    return `<tr data-player="${escapeHtml(row.id)}" tabindex="0">
      <td><span class="rank-pill">#${escapeHtml(row.rank)}</span></td>
      <td><span class="move ${m.cls}">${escapeHtml(m.label)}</span></td>
      <td><span class="participant-cell"><span class="avatar">${escapeHtml(initials(row.name))}</span>${escapeHtml(row.name)}</span></td>
      <td class="num"><strong>${escapeHtml(row.total)}</strong></td>
      <td><span class="score-pill">${escapeHtml(scoreText(nextPred))}</span>${nextPred && nextPred.winner ? `<span class="winner-pill">${escapeHtml(nextPred.winner)}</span>` : ''}</td>
      <td>${escapeHtml(display(row.summary.champion))}</td>
      <td>${escapeHtml(display(row.summary.topScorer))}</td>
    </tr>`;
  }
  function openPlayer(id) {
    const comp = state.computed;
    const row = comp.rows.find(r => r.id === id);
    if (!row) return;
    const nextPred = playerPredictionFor(row, comp.next);
    els.drawerTitle.textContent = row.name;
    els.drawerRank.textContent = `#${row.rank}`;
    els.drawerSubtitle.textContent = `${row.total} punts · ${row.groupMatches.length + row.knockoutMatches.length} pronòstics de partit`;
    els.drawerContent.innerHTML = `
      <div class="info-grid">
        <div class="info-card"><span>Campió</span><strong>${escapeHtml(display(row.summary.champion))}</strong></div>
        <div class="info-card"><span>Finalista</span><strong>${escapeHtml(display(row.summary.runnerUp))}</strong></div>
        <div class="info-card"><span>Tercer</span><strong>${escapeHtml(display(row.summary.third))}</strong></div>
        <div class="info-card"><span>Pichichi</span><strong>${escapeHtml(display(row.summary.topScorer))}${row.summary.topScorerGoals ? ` · ${escapeHtml(row.summary.topScorerGoals)} gols` : ''}</strong></div>
      </div>
      <div class="drawer-section"><h3>Pronòstic del pròxim partit</h3><div class="info-card"><span>${escapeHtml(matchLabel(comp.next))}</span><strong>${escapeHtml(scoreText(nextPred))}${nextPred && nextPred.winner ? ` · ${escapeHtml(nextPred.winner)}` : ''}</strong></div></div>
      <div class="drawer-section"><h3>Desglossament de punts</h3><div class="breakdown">${Object.entries(row.breakdown).map(([k, v]) => `<span>${escapeHtml(k)} <strong>${escapeHtml(v)}</strong></span>`).join('')}</div></div>
      <div class="drawer-section"><h3>Pronòstics de partits</h3>${matchesTable(row)}</div>`;
    els.drawer.classList.add('is-open');
    els.drawer.setAttribute('aria-hidden', 'false');
  }
  function matchesTable(row) {
    const matches = [...row.groupMatches, ...row.knockoutMatches];
    const body = matches.map(m => `<tr><td>${escapeHtml(display(m.round))}</td><td>${escapeHtml(display(m.home))} vs ${escapeHtml(display(m.away))}</td><td><span class="score-pill">${escapeHtml(scoreText(m))}</span></td><td>${escapeHtml(display(m.winner))}</td></tr>`).join('');
    return `<div class="table-wrap"><table class="pred-table"><thead><tr><th>Fase</th><th>Partit</th><th>Resultat</th><th>Guanyador</th></tr></thead><tbody>${body}</tbody></table></div>`;
  }
  function closeDrawer() { els.drawer.classList.remove('is-open'); els.drawer.setAttribute('aria-hidden', 'true'); }
  els.search.addEventListener('input', e => { state.filter = e.target.value; render(); });
  els.closeDrawer.addEventListener('click', closeDrawer);
  els.drawer.addEventListener('click', e => { if (e.target === els.drawer) closeDrawer(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
