(function () {
  'use strict';

  const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT']);
  const FINAL_STATUSES = new Set(['FINISHED', 'AWARDED']);
  const NON_FINAL_STATUSES = new Set(['SCHEDULED', 'TIMED', 'POSTPONED', 'SUSPENDED', 'CANCELED', ...LIVE_STATUSES]);

  const I18N = {
    ca: {
      finishedResults: 'Resultats jugats',
      groupStandings: 'Classificacions de grups',
      topScorers: 'Pichichis',
      liveLeaderboard: 'Classificació en directe',
      pointsSystem: 'Com funciona el sistema de punts',
      close: 'Tancar',
      date: 'Data',
      stage: 'Fase',
      match: 'Partit',
      score: 'Resultat',
      status: 'Estat',
      group: 'Grup',
      team: 'Equip',
      player: 'Participant',
      pos: 'Pos.',
      move: 'Mov.',
      points: 'Punts',
      played: 'PJ',
      won: 'G',
      drawn: 'E',
      lost: 'P',
      gf: 'GF',
      ga: 'GC',
      gd: 'DG',
      tie: 'empat',
      noFinished: 'Encara no hi ha partits finalitzats.',
      noScorers: 'Encara no hi ha una taula de golejadors a resultats.js.',
      scorerHint: 'Afegeix window.PORRA_RESULTATS.topScorers = [{ name, team, goals }] o una propietat topScorers dins PORRA_RESULTATS.',
      liveHint: 'Inclou els partits finalitzats i també els marcadors dels partits en joc.',
      rulesIntro: 'Resum dels punts configurats a prediccions.js.',
      exactResult: 'Resultat exacte / gols',
      outcome: 'Guanyador o empat',
      groupTable: 'Classificació de grup',
      knockoutTeams: 'Equips i posicions en eliminatòries',
      finalAwards: 'Premis finals'
    },
    es: {
      finishedResults: 'Resultados jugados',
      groupStandings: 'Clasificaciones de grupos',
      topScorers: 'Pichichis',
      liveLeaderboard: 'Clasificación en directo',
      pointsSystem: 'Cómo funciona el sistema de puntos',
      close: 'Cerrar',
      date: 'Fecha',
      stage: 'Fase',
      match: 'Partido',
      score: 'Resultado',
      status: 'Estado',
      group: 'Grupo',
      team: 'Equipo',
      player: 'Participante',
      pos: 'Pos.',
      move: 'Mov.',
      points: 'Puntos',
      played: 'PJ',
      won: 'G',
      drawn: 'E',
      lost: 'P',
      gf: 'GF',
      ga: 'GC',
      gd: 'DG',
      tie: 'empate',
      noFinished: 'Todavía no hay partidos finalizados.',
      noScorers: 'Todavía no hay una tabla de goleadores en resultats.js.',
      scorerHint: 'Añade window.PORRA_RESULTATS.topScorers = [{ name, team, goals }] o una propiedad topScorers dentro de PORRA_RESULTATS.',
      liveHint: 'Incluye los partidos finalizados y también los marcadores de los partidos en juego.',
      rulesIntro: 'Resumen de los puntos configurados en prediccions.js.',
      exactResult: 'Resultado exacto / goles',
      outcome: 'Ganador o empate',
      groupTable: 'Clasificación de grupo',
      knockoutTeams: 'Equipos y posiciones en eliminatorias',
      finalAwards: 'Premios finales'
    },
    en: {
      finishedResults: 'Finished results',
      groupStandings: 'Group standings',
      topScorers: 'Top scorers',
      liveLeaderboard: 'Live leaderboard',
      pointsSystem: 'How the points system works',
      close: 'Close',
      date: 'Date',
      stage: 'Stage',
      match: 'Match',
      score: 'Score',
      status: 'Status',
      group: 'Group',
      team: 'Team',
      player: 'Player',
      pos: 'Pos.',
      move: 'Move',
      points: 'Points',
      played: 'P',
      won: 'W',
      drawn: 'D',
      lost: 'L',
      gf: 'GF',
      ga: 'GA',
      gd: 'GD',
      tie: 'tie',
      noFinished: 'No matches have finished yet.',
      noScorers: 'There is not yet a top-scorers table in resultats.js.',
      scorerHint: 'Add window.PORRA_RESULTATS.topScorers = [{ name, team, goals }] or a topScorers property inside PORRA_RESULTATS.',
      liveHint: 'Includes finished matches plus current scores for matches in play.',
      rulesIntro: 'Summary of the points configured in prediccions.js.',
      exactResult: 'Exact score / goals',
      outcome: 'Winner or tie',
      groupTable: 'Group table',
      knockoutTeams: 'Knockout teams and positions',
      finalAwards: 'Final awards'
    }
  };

  const STAGE_CONFIG = {
    r32: { keys: rangeKeys(73, 88), team: 'E16', pos: 'E16P', goals: 'G16', teamPts: 4, posPts: 4, goalPts: 4, goalMin: 4 },
    r16: { keys: rangeKeys(89, 96), team: 'E8', pos: 'E8P', goals: 'G8', teamPts: 6, posPts: 6, goalPts: 6 },
    qf: { keys: rangeKeys(97, 100), team: 'E4', pos: 'E4P', goals: 'G4', teamPts: 8, posPts: 8, goalPts: 6 },
    sf: { keys: rangeKeys(101, 102), team: 'ES', pos: 'ESP', goals: 'GS', teamPts: 10, posPts: 10, goalPts: 8 }
  };

  let applyingPredictionEnhancement = false;

  function rangeKeys(a, b) {
    const out = [];
    for (let i = a; i <= b; i += 1) out.push('M' + i);
    return out;
  }

  function lang() {
    const stored = localStorage.getItem('porraLang');
    if (I18N[stored]) return stored;
    const docLang = (document.documentElement.lang || '').slice(0, 2);
    return I18N[docLang] ? docLang : 'ca';
  }

  function t(key) {
    return (I18N[lang()] && I18N[lang()][key]) || I18N.ca[key] || key;
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function isNum(v) {
    return typeof v === 'number' && Number.isFinite(v);
  }

  function display(value, fallback = '—') {
    if (value === null || value === undefined || value === '') return fallback;
    const s = String(value).trim();
    if (!s || s === '#N/A' || s.toUpperCase() === 'TBD') return fallback;
    return s;
  }

  function data() {
    return window.PORRA_DATA || { players: [], matches: [], groups: {}, rules: {}, thirdPlaceMatrix: {} };
  }

  function results() {
    return window.PORRA_RESULTATS || { matches: {}, final: {}, groupRankingOverrides: {} };
  }

  function matchStatus(m) {
    return String((m && m.status) || '').trim().toUpperCase();
  }

  function hasMatchScore(m) {
    return !!m && isNum(m.homeScore) && isNum(m.awayScore);
  }

  function isMatchFinal(m) {
    const status = matchStatus(m);
    if (FINAL_STATUSES.has(status)) return true;
    if (NON_FINAL_STATUSES.has(status)) return false;
    return hasMatchScore(m);
  }

  function isMatchLive(m) {
    return LIVE_STATUSES.has(matchStatus(m));
  }

  function isMatchCounted(m, includeLive) {
    if (!hasMatchScore(m)) return false;
    if (isMatchFinal(m)) return true;
    return !!includeLive && isMatchLive(m);
  }

  function scoreText(m) {
    if (!hasMatchScore(m)) return '—';
    let s = `${m.homeScore}–${m.awayScore}`;
    if (isNum(m.penHome) && isNum(m.penAway)) s += ` (${m.penHome}–${m.penAway})`;
    return s;
  }

  function matchLabel(m) {
    if (!m) return '—';
    return `${display(m.home)} vs ${display(m.away)}`;
  }

  function matchChronology(m) {
    if (m && typeof m.sortOrder === 'number') return m.sortOrder;
    if (m && m.date) {
      const parsed = Date.parse(`${m.date}T00:00:00Z`);
      if (Number.isFinite(parsed)) return parsed / 86400000;
    }
    return m && typeof m.order === 'number' ? m.order + 100000 : Number.MAX_SAFE_INTEGER;
  }

  function allMatchesMerged() {
    const d = data();
    const resultMap = results().matches || {};
    return (d.matches || []).map(m => ({ ...m, ...(resultMap[m.id] || {}) }));
  }

  function chronologicalMatches(matches) {
    return [...matches].sort((a, b) => matchChronology(a) - matchChronology(b));
  }

  function nextMatches(count) {
    return chronologicalMatches(allMatchesMerged())
      .filter(m => !isSeedLike(m.home) && !isSeedLike(m.away) && !isMatchFinal(m))
      .slice(0, count);
  }

  function playerPredictionFor(player, match) {
    if (!player || !match) return null;
    const list = match.type === 'group' ? player.groupMatches : player.knockoutMatches;
    return (list || []).find(m => m.id === match.id) || null;
  }

  function predictedOutcomeLabel(pred) {
    if (!pred || !hasMatchScore(pred)) return '—';
    if (pred.homeScore === pred.awayScore) return t('tie');
    return pred.homeScore > pred.awayScore ? display(pred.home) : display(pred.away);
  }

  function enhancePredictionCells() {
    if (applyingPredictionEnhancement) return;
    applyingPredictionEnhancement = true;
    try {
      const tbody = document.getElementById('leaderboardBody');
      if (!tbody) return;
      const d = data();
      const playersById = new Map((d.players || []).map(p => [p.id, p]));
      const matches = nextMatches(2);
      tbody.querySelectorAll('tr[data-player]').forEach(tr => {
        const player = playersById.get(tr.dataset.player);
        if (!player) return;
        const cells = tr.querySelectorAll('td.prediction-cell');
        cells.forEach((cell, idx) => {
          const pred = playerPredictionFor(player, matches[idx]);
          const score = scoreText(pred);
          const outcome = predictedOutcomeLabel(pred);
          cell.innerHTML = `<span class="porra-pred-score-v2">${escapeHtml(score)}</span><span class="porra-pred-winner-v2">${escapeHtml(outcome)}</span>`;
        });
      });
    } finally {
      applyingPredictionEnhancement = false;
    }
  }

  function installLinks() {
    const summary = document.querySelector('.summary-card');
    if (summary && !document.getElementById('porraLinksSummaryV2')) {
      const wrap = document.createElement('div');
      wrap.id = 'porraLinksSummaryV2';
      wrap.className = 'porra-links-v2 porra-links-v2--summary';
      wrap.innerHTML = ['finishedResults', 'groupStandings', 'topScorers', 'liveLeaderboard']
        .map(type => `<button type="button" data-porra-modal-v2="${type}">${escapeHtml(t(type))}</button>`)
        .join('');
      summary.appendChild(wrap);
    }

    const tableCard = document.querySelector('.table-card');
    if (tableCard && !document.getElementById('porraLinksPointsV2')) {
      const wrap = document.createElement('div');
      wrap.id = 'porraLinksPointsV2';
      wrap.className = 'porra-links-v2 porra-links-v2--points';
      wrap.innerHTML = `<button type="button" data-porra-modal-v2="pointsSystem">${escapeHtml(t('pointsSystem'))}</button>`;
      tableCard.insertAdjacentElement('afterend', wrap);
    }

    if (!document.getElementById('porraModalV2')) {
      const modal = document.createElement('div');
      modal.id = 'porraModalV2';
      modal.className = 'porra-modal-v2';
      modal.hidden = true;
      modal.innerHTML = `<div class="porra-modal-v2__backdrop" data-porra-close-v2></div><div class="porra-modal-v2__panel" role="dialog" aria-modal="true" aria-labelledby="porraModalTitleV2"><button type="button" class="porra-modal-v2__close" data-porra-close-v2 aria-label="${escapeHtml(t('close'))}">×</button><h2 id="porraModalTitleV2"></h2><div id="porraModalBodyV2"></div></div>`;
      document.body.appendChild(modal);
    }
  }

  function bindEvents() {
    document.addEventListener('click', event => {
      const openBtn = event.target.closest('[data-porra-modal-v2]');
      if (openBtn) {
        openModal(openBtn.getAttribute('data-porra-modal-v2'));
        return;
      }
      if (event.target.closest('[data-porra-close-v2]')) closeModal();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeModal();
    });
  }

  function openModal(type) {
    const modal = document.getElementById('porraModalV2');
    const title = document.getElementById('porraModalTitleV2');
    const body = document.getElementById('porraModalBodyV2');
    if (!modal || !title || !body) return;
    title.textContent = t(type);
    body.innerHTML = renderModal(type);
    modal.hidden = false;
    document.body.classList.add('porra-modal-v2-open');
  }

  function closeModal() {
    const modal = document.getElementById('porraModalV2');
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove('porra-modal-v2-open');
  }

  function tableHtml(headers, rows) {
    return `<div class="porra-popup-table-wrap-v2"><table class="porra-popup-table-v2"><thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  }

  function renderModal(type) {
    if (type === 'finishedResults') return renderFinishedResults();
    if (type === 'groupStandings') return renderGroupStandings();
    if (type === 'topScorers') return renderTopScorers();
    if (type === 'liveLeaderboard') return renderLiveLeaderboard();
    if (type === 'pointsSystem') return renderPointsSystem();
    return '';
  }

  function renderFinishedResults() {
    const rows = chronologicalMatches(allMatchesMerged())
      .filter(m => isMatchFinal(m) && hasMatchScore(m))
      .map(m => `<tr><td>${escapeHtml(display(m.date))}</td><td>${escapeHtml(display(m.round))}</td><td>${escapeHtml(matchLabel(m))}</td><td>${escapeHtml(scoreText(m))}</td><td>${escapeHtml(matchStatus(m).toLowerCase())}</td></tr>`);
    if (!rows.length) return `<p>${escapeHtml(t('noFinished'))}</p>`;
    return tableHtml([t('date'), t('stage'), t('match'), t('score'), t('status')], rows);
  }

  function computeGroupTables(includeLive) {
    const d = data();
    const groupMatches = allMatchesMerged().filter(m => m.type === 'group');
    const out = {};
    for (const [g, teams] of Object.entries(d.groups || {})) {
      const table = Object.fromEntries(teams.map(team => [team, { team, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }]));
      groupMatches.filter(m => m.group === g).forEach(m => {
        if (!isMatchCounted(m, includeLive)) return;
        const h = table[m.home];
        const a = table[m.away];
        if (!h || !a) return;
        h.p += 1; a.p += 1;
        h.gf += m.homeScore; h.ga += m.awayScore;
        a.gf += m.awayScore; a.ga += m.homeScore;
        if (m.homeScore > m.awayScore) { h.w += 1; a.l += 1; h.pts += 3; }
        else if (m.awayScore > m.homeScore) { a.w += 1; h.l += 1; a.pts += 3; }
        else { h.d += 1; a.d += 1; h.pts += 1; a.pts += 1; }
      });
      let arr = Object.values(table).map(r => ({ ...r, gd: r.gf - r.ga }));
      arr.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team));
      arr.forEach((r, idx) => { r.pos = idx + 1; });
      out[g] = arr;
    }
    return out;
  }

  function renderGroupStandings() {
    const groups = computeGroupTables(true);
    return Object.entries(groups).map(([g, rows]) => {
      const body = rows.map(r => `<tr><td>${escapeHtml(r.pos)}</td><td>${escapeHtml(display(r.team))}</td><td>${escapeHtml(r.p)}</td><td>${escapeHtml(r.w)}</td><td>${escapeHtml(r.d)}</td><td>${escapeHtml(r.l)}</td><td>${escapeHtml(r.gf)}</td><td>${escapeHtml(r.ga)}</td><td>${escapeHtml(r.gd)}</td><td>${escapeHtml(r.pts)}</td></tr>`);
      return `<h3>${escapeHtml(t('group'))} ${escapeHtml(g)}</h3>${tableHtml([t('pos'), t('team'), t('played'), t('won'), t('drawn'), t('lost'), t('gf'), t('ga'), t('gd'), t('points')], body)}`;
    }).join('');
  }

  function renderTopScorers() {
    const r = results();
    const scorers = Array.isArray(r.topScorers) ? r.topScorers : (Array.isArray(r.scorers) ? r.scorers : []);
    if (!scorers.length) {
      const final = r.final || {};
      const known = final.topScorer ? `<p><strong>${escapeHtml(display(final.topScorer))}</strong>${isNum(final.topScorerGoals) ? ` · ${escapeHtml(final.topScorerGoals)} ${escapeHtml(t('points'))}` : ''}</p>` : '';
      return `${known}<p>${escapeHtml(t('noScorers'))}</p><p class="porra-muted-v2">${escapeHtml(t('scorerHint'))}</p>`;
    }
    const sorted = scorers.slice().sort((a, b) => (Number(b.goals) || 0) - (Number(a.goals) || 0) || display(a.name).localeCompare(display(b.name)));
    const rows = sorted.map((s, idx) => `<tr><td>${escapeHtml(idx + 1)}</td><td>${escapeHtml(display(s.name))}</td><td>${escapeHtml(display(s.team))}</td><td>${escapeHtml(display(s.goals, 0))}</td></tr>`);
    return tableHtml([t('pos'), t('player'), t('team'), 'Goals'], rows);
  }

  function groupWinner(m, includeLive) {
    if (!isMatchCounted(m, includeLive)) return null;
    if (m.homeScore > m.awayScore) return m.home;
    if (m.awayScore > m.homeScore) return m.away;
    return 'Empat';
  }

  function koWinner(m, includeLive) {
    if (!isMatchCounted(m, includeLive)) return null;
    if (m.homeScore > m.awayScore) return m.home;
    if (m.awayScore > m.homeScore) return m.away;
    if (isNum(m.penHome) && isNum(m.penAway)) {
      if (m.penHome > m.penAway) return m.home;
      if (m.penAway > m.penHome) return m.away;
    }
    return null;
  }

  function koLoser(m, includeLive) {
    const w = koWinner(m, includeLive);
    if (!w) return null;
    if (w === m.home) return m.away;
    if (w === m.away) return m.home;
    return null;
  }

  function computeThirdPlaces(groups) {
    const rows = Object.entries(groups).map(([g, obj]) => ({ ...obj.table[2], group: g, seed: '3' + g, complete: obj.complete }));
    const sorted = rows.slice().sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team));
    sorted.forEach((r, idx) => { r.thirdRank = idx + 1; r.qualified = idx < 8 && r.complete; });
    return sorted;
  }

  function computeThirdMap(third) {
    const d = data();
    const qualified = third.filter(t => t.qualified).map(t => t.group).sort().join('');
    const matrixRow = (d.thirdPlaceMatrix || {})[qualified] || {};
    const map = {};
    for (const [paired, seed] of Object.entries(matrixRow)) {
      const team = third.find(t => t.seed === seed && t.qualified);
      if (team) map[paired] = { seed, team: team.team };
    }
    return map;
  }

  function resolveSlot(slot, groups, third, thirdMap, byId, includeLive) {
    if (!slot) return null;
    if (slot.startsWith && slot.startsWith('third:')) {
      const paired = slot.split(':')[1];
      return thirdMap[paired] ? thirdMap[paired].team : null;
    }
    const groupSeed = String(slot).match(/^([123])([A-L])$/);
    if (groupSeed) {
      const pos = Number(groupSeed[1]);
      const group = groups[groupSeed[2]];
      if (!group || !group.complete) return slot;
      return group.table[pos - 1] ? group.table[pos - 1].team : null;
    }
    const w = String(slot).match(/^W(\d+)$/);
    if (w) return byId['M' + w[1]] ? byId['M' + w[1]].winner : slot;
    const l = String(slot).match(/^L(\d+)$/);
    if (l) return byId['M' + l[1]] ? byId['M' + l[1]].loser : slot;
    return slot;
  }

  function isSeedLike(v) {
    return typeof v === 'string' && (/^[123][A-L]$/.test(v) || /^W\d+$/.test(v) || /^L\d+$/.test(v));
  }

  function buildActual(includeLive) {
    const d = data();
    const r = results();
    const resultMap = r.matches || {};
    const groupMatches = (d.matches || []).filter(m => m.type === 'group').map(m => ({ ...m, ...(resultMap[m.id] || {}) }));
    const groups = {};
    for (const [g, teams] of Object.entries(d.groups || {})) {
      const table = Object.fromEntries(teams.map(team => [team, { team, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }]));
      const matches = groupMatches.filter(m => m.group === g);
      matches.forEach(m => {
        if (!isMatchCounted(m, includeLive)) return;
        const h = table[m.home];
        const a = table[m.away];
        if (!h || !a) return;
        h.p += 1; a.p += 1;
        h.gf += m.homeScore; h.ga += m.awayScore;
        a.gf += m.awayScore; a.ga += m.homeScore;
        if (m.homeScore > m.awayScore) { h.w += 1; a.l += 1; h.pts += 3; }
        else if (m.awayScore > m.homeScore) { a.w += 1; h.l += 1; a.pts += 3; }
        else { h.d += 1; a.d += 1; h.pts += 1; a.pts += 1; }
      });
      let arr = Object.values(table).map(row => ({ ...row, gd: row.gf - row.ga }));
      arr.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team));
      const override = (r.groupRankingOverrides || {})[g];
      if (Array.isArray(override) && override.length) {
        const order = new Map(override.map((team, idx) => [team, idx]));
        arr.sort((a, b) => (order.has(a.team) ? order.get(a.team) : 999) - (order.has(b.team) ? order.get(b.team) : 999));
      }
      arr.forEach((row, idx) => { row.pos = idx + 1; });
      const complete = matches.length === 6 && matches.every(m => isMatchFinal(m));
      groups[g] = { table: arr, matches, complete };
    }

    const third = computeThirdPlaces(groups);
    const thirdMap = computeThirdMap(third);
    const all = [];
    const byId = {};
    for (const gm of groupMatches) {
      const m = { ...gm, winner: groupWinner(gm, includeLive) };
      byId[m.id] = m;
      all.push(m);
    }
    for (const tmpl of (d.matches || []).filter(m => m.type === 'knockout')) {
      const base = resultMap[tmpl.id] || {};
      const home = resolveSlot(tmpl.homeSlot, groups, third, thirdMap, byId, includeLive);
      const away = resolveSlot(tmpl.awaySlot, groups, third, thirdMap, byId, includeLive);
      const km = { ...tmpl, home, away, ...base };
      km.winner = koWinner(km, includeLive);
      km.loser = koLoser(km, includeLive);
      byId[km.id] = km;
      all.push(km);
    }
    return { matches: all, byId, groups, third, final: r.final || {} };
  }

  function teamSet(actual, keys) {
    const set = new Set();
    keys.forEach(key => {
      const m = actual.byId[key];
      if (!m) return;
      if (m.home && !isSeedLike(m.home)) set.add(m.home);
      if (m.away && !isSeedLike(m.away)) set.add(m.away);
    });
    return set;
  }

  function scorePlayer(player, actual, includeLive) {
    const rules = data().rules || {};
    const bd = { '1X2': 0, G1: 0, CTG: 0, GTG: 0, PTG: 0, E16: 0, E16P: 0, G16: 0, E8: 0, E8P: 0, G8: 0, E4: 0, E4P: 0, G4: 0, ES: 0, ESP: 0, GS: 0, EF: 0, EC: 0, GC: 0, '4rt': 0, '3er': 0, GF: 0, '2on': 0, '1er': 0, PCH: 0, GPCH: 0 };
    const pGroupById = Object.fromEntries((player.groupMatches || []).map(m => [m.id, m]));

    actual.matches.filter(m => m.type === 'group').forEach(am => {
      if (!isMatchCounted(am, includeLive)) return;
      const pm = pGroupById[am.id];
      if (!pm) return;
      if (pm.winner === groupWinner(am, includeLive)) bd['1X2'] += rules['1X2'] || 0;
      if (pm.homeScore === am.homeScore) bd.G1 += Math.max(rules.G1_MIN || 0, am.homeScore);
      if (pm.awayScore === am.awayScore) bd.G1 += Math.max(rules.G1_MIN || 0, am.awayScore);
    });

    Object.entries(actual.groups).forEach(([g, obj]) => {
      if (!obj.complete) return;
      const predRows = (player.groupStandings || {})[g] || [];
      for (let i = 0; i < 4; i += 1) {
        const ar = obj.table[i];
        const pr = predRows[i];
        if (!ar || !pr) continue;
        if (pr.team === ar.team) bd.CTG += rules.CTG || 0;
        if (pr.gf === ar.gf) bd.GTG += rules.GTG || 0;
        if (pr.pts === ar.pts) bd.PTG += rules.PTG || 0;
      }
    });

    const pKoById = Object.fromEntries((player.knockoutMatches || []).map(m => [m.id, m]));
    Object.values(STAGE_CONFIG).forEach(cfg => {
      const actualSet = teamSet(actual, cfg.keys);
      cfg.keys.forEach(key => {
        const am = actual.byId[key];
        const pm = pKoById[key];
        if (!am || !pm) return;
        ['home', 'away'].forEach(side => {
          const pTeam = pm[side];
          const aTeam = am[side];
          if (pTeam && actualSet.has(pTeam)) bd[cfg.team] += cfg.teamPts;
          if (pTeam && aTeam && pTeam === aTeam) bd[cfg.pos] += cfg.posPts;
        });
        if (isMatchCounted(am, includeLive)) {
          if (pm.homeScore === am.homeScore) bd[cfg.goals] += cfg.goalMin ? Math.max(cfg.goalMin, am.homeScore) : cfg.goalPts;
          if (pm.awayScore === am.awayScore) bd[cfg.goals] += cfg.goalMin ? Math.max(cfg.goalMin, am.awayScore) : cfg.goalPts;
        }
      });
    });

    const finalM = actual.byId.M104;
    const consM = actual.byId.M103;
    const pFinal = pKoById.M104;
    const pCons = pKoById.M103;
    if (finalM && pFinal) {
      const finalSet = new Set([finalM.home, finalM.away].filter(Boolean));
      [pFinal.home, pFinal.away].forEach(team => { if (finalSet.has(team)) bd.EF += rules.EF || 0; });
      if (isMatchCounted(finalM, includeLive)) {
        if (pFinal.homeScore === finalM.homeScore) bd.GF += rules.GF || 0;
        if (pFinal.awayScore === finalM.awayScore) bd.GF += rules.GF || 0;
      }
    }
    if (consM && pCons) {
      const consSet = new Set([consM.home, consM.away].filter(Boolean));
      [pCons.home, pCons.away].forEach(team => { if (consSet.has(team)) bd.EC += rules.EC || 0; });
      if (isMatchCounted(consM, includeLive)) {
        if (pCons.homeScore === consM.homeScore) bd.GC += rules.GC || 0;
        if (pCons.awayScore === consM.awayScore) bd.GC += rules.GC || 0;
      }
    }

    if (consM && koWinner(consM, includeLive)) {
      if ((player.summary || {}).third === consM.winner) bd['3er'] += rules['3er'] || 0;
      if ((player.summary || {}).fourth === consM.loser) bd['4rt'] += rules['4rt'] || 0;
    }
    if (finalM && koWinner(finalM, includeLive)) {
      if ((player.summary || {}).champion === finalM.winner) bd['1er'] += rules['1er'] || 0;
      if ((player.summary || {}).runnerUp === finalM.loser) bd['2on'] += rules['2on'] || 0;
      if (actual.final.topScorer && (player.summary || {}).topScorer === actual.final.topScorer) bd.PCH += rules.PCH || 0;
      if (isNum(actual.final.topScorerGoals) && (player.summary || {}).topScorerGoals === actual.final.topScorerGoals) bd.GPCH += rules.GPCH || 0;
    }

    return Object.values(bd).reduce((sum, value) => sum + value, 0);
  }

  function computeLeaderboard(includeLive) {
    const actual = buildActual(includeLive);
    const rows = (data().players || []).map(player => ({ id: player.id, name: player.name, total: scorePlayer(player, actual, includeLive) }));
    rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
    let last = null;
    let rank = 0;
    rows.forEach((row, idx) => {
      row.position = idx + 1;
      if (row.total !== last) {
        rank = idx + 1;
        last = row.total;
      }
      row.rank = rank;
    });
    return rows;
  }

  function movementLabel(row, prevById) {
    const prev = prevById.get(row.id);
    if (!prev) return { cls: 'same', label: '—' };
    const delta = prev.position - row.position;
    if (delta === 0) return { cls: 'same', label: '—' };
    if (delta > 0) return { cls: 'up', label: `▲ ${delta}` };
    return { cls: 'down', label: `▼ ${Math.abs(delta)}` };
  }

  function renderLiveLeaderboard() {
    const baseRows = computeLeaderboard(false);
    const liveRows = computeLeaderboard(true);
    const prevById = new Map(baseRows.map(row => [row.id, row]));
    const rows = liveRows.map(row => {
      const move = movementLabel(row, prevById);
      return `<tr><td><span class="rank-pill">#${escapeHtml(row.rank)}</span></td><td><span class="move ${escapeHtml(move.cls)}">${escapeHtml(move.label)}</span></td><td>${escapeHtml(display(row.name))}</td><td class="num">${escapeHtml(row.total)}</td></tr>`;
    });
    return `<p class="porra-muted-v2">${escapeHtml(t('liveHint'))}</p>${tableHtml([t('pos'), t('move'), t('player'), t('points')], rows)}`;
  }

  function renderPointsSystem() {
    const rules = data().rules || {};
    const rows = [
      [t('outcome'), '1X2', rules['1X2']],
      [t('exactResult'), 'G1_MIN', rules.G1_MIN],
      [t('groupTable'), 'CTG / GTG / PTG', `${display(rules.CTG, 0)} / ${display(rules.GTG, 0)} / ${display(rules.PTG, 0)}`],
      [t('knockoutTeams'), 'E16 / E8 / E4 / ES', `${display(rules.E16, 0)} / ${display(rules.E8, 0)} / ${display(rules.E4, 0)} / ${display(rules.ES, 0)}`],
      [t('knockoutTeams'), 'E16P / E8P / E4P / ESP', `${display(rules.E16P, 0)} / ${display(rules.E8P, 0)} / ${display(rules.E4P, 0)} / ${display(rules.ESP, 0)}`],
      [t('exactResult'), 'G16 / G8 / G4 / GS', `${display(rules.G16, 0)} / ${display(rules.G8, 0)} / ${display(rules.G4, 0)} / ${display(rules.GS, 0)}`],
      [t('finalAwards'), 'EF / EC / GC / GF', `${display(rules.EF, 0)} / ${display(rules.EC, 0)} / ${display(rules.GC, 0)} / ${display(rules.GF, 0)}`],
      [t('finalAwards'), '1er / 2on / 3er / 4rt', `${display(rules['1er'], 0)} / ${display(rules['2on'], 0)} / ${display(rules['3er'], 0)} / ${display(rules['4rt'], 0)}`],
      [t('topScorers'), 'PCH / GPCH', `${display(rules.PCH, 0)} / ${display(rules.GPCH, 0)}`]
    ].map(parts => `<tr><td>${escapeHtml(parts[0])}</td><td>${escapeHtml(parts[1])}</td><td>${escapeHtml(display(parts[2], 0))}</td></tr>`);
    return `<p class="porra-muted-v2">${escapeHtml(t('rulesIntro'))}</p>${tableHtml([t('stage'), 'Code', t('points')], rows)}`;
  }

  function refreshDynamicLabels() {
    const summary = document.getElementById('porraLinksSummaryV2');
    if (summary) {
      const types = ['finishedResults', 'groupStandings', 'topScorers', 'liveLeaderboard'];
      summary.querySelectorAll('[data-porra-modal-v2]').forEach((btn, idx) => { btn.textContent = t(types[idx]); });
    }
    const points = document.querySelector('#porraLinksPointsV2 [data-porra-modal-v2]');
    if (points) points.textContent = t('pointsSystem');
  }

  function boot() {
    installLinks();
    bindEvents();
    enhancePredictionCells();
    refreshDynamicLabels();

    const tbody = document.getElementById('leaderboardBody');
    if (tbody) {
      const observer = new MutationObserver(() => {
        refreshDynamicLabels();
        enhancePredictionCells();
      });
      observer.observe(tbody, { childList: true, subtree: true });
    }

    document.querySelectorAll('[data-lang]').forEach(btn => {
      btn.addEventListener('click', () => setTimeout(() => {
        refreshDynamicLabels();
        enhancePredictionCells();
      }, 0));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0));
  } else {
    setTimeout(boot, 0);
  }
})();
