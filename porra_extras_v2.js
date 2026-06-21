(function () {
  'use strict';

  const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT']);
  const FINAL_STATUSES = new Set(['FINISHED', 'AWARDED']);
  const NON_FINAL_STATUSES = new Set(['SCHEDULED', 'TIMED', 'POSTPONED', 'SUSPENDED', 'CANCELED', ...LIVE_STATUSES]);

  const I18N = {
    ca: {
      finishedResults: 'Resultats de partits acabats',
      groupStandings: 'Classificacions de grups',
      topScorers: 'Pichichis',
      winProbability: 'Probabilitats de victòria',
      liveLeaderboard: 'Classificació en directe',
      realTimeBracket: 'Creuaments en temps real',
      pointsSystem: 'Com funciona el sistema de punts',
      
      economistasEmporrados: 'Economistas emporrados',
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
      scorerHint: 'Afegeix pichichi_current.json o window.PORRA_RESULTATS.topScorers = [{ name, team, goals }].',
      scorerUpdated: 'Actualitzat',
      liveHint: 'Inclou els partits finalitzats i també els marcadors dels partits en joc.',
      rulesIntro: 'Resum dels punts configurats a prediccions.js.',
      exactResult: 'Resultat exacte / gols',
      outcome: 'Guanyador o empat',
      groupTable: 'Classificació de grup',
      knockoutTeams: 'Equips i posicions en eliminatòries',
      finalAwards: 'Premis finals',
      oddsUpdated: 'Actualitzat',
      oddsModel: 'Model',
      oddsWin: 'Prob. victòria',
      oddsTop3: 'Prob. top 3',
      oddsAvg: 'Punts esperats',
      oddsMax: 'Màxim',
      oddsNoData: 'Encara no hi ha dades de probabilitats de victòria disponibles.'
    },
    es: {
      finishedResults: 'Resultados de partidos acabados',
      groupStandings: 'Clasificaciones de grupos',
      topScorers: 'Pichichis',
      winProbability: 'Probabilidades de victoria',
      liveLeaderboard: 'Clasificación en directo',
      realTimeBracket: 'Cruces en tiempo real',
      pointsSystem: 'Cómo funciona el sistema de puntos',
     
      economistasEmporrados: 'Economistas emporrados',
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
      scorerHint: 'Añade pichichi_current.json o window.PORRA_RESULTATS.topScorers = [{ name, team, goals }].',
      scorerUpdated: 'Actualizado',
      liveHint: 'Incluye los partidos finalizados y también los marcadores de los partidos en juego.',
      rulesIntro: 'Resumen de los puntos configurados en prediccions.js.',
      exactResult: 'Resultado exacto / goles',
      outcome: 'Ganador o empate',
      groupTable: 'Clasificación de grupo',
      knockoutTeams: 'Equipos y posiciones en eliminatorias',
      finalAwards: 'Premios finales',
      oddsUpdated: 'Actualizado',
      oddsModel: 'Modelo',
      oddsWin: 'Prob. victoria',
      oddsTop3: 'Prob. top 3',
      oddsAvg: 'Puntos esperados',
      oddsMax: 'Máximo',
      oddsNoData: 'Todavía no hay datos de probabilidades de victoria disponibles.'
    },
    en: {
      finishedResults: 'Results of finished games',
      groupStandings: 'Group standings',
      topScorers: 'Top scorers',
      winProbability: 'Win probability',
      liveLeaderboard: 'Live leaderboard',
      realTimeBracket: 'Knock-out stage in real time',
      pointsSystem: 'How the points system works',
     
      economistasEmporrados: 'Economistas emporrados',
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
      scorerHint: 'Add pichichi_current.json or window.PORRA_RESULTATS.topScorers = [{ name, team, goals }].',
      scorerUpdated: 'Updated',
      liveHint: 'Includes finished matches plus current scores for matches in play.',
      rulesIntro: 'Summary of the points configured in prediccions.js.',
      exactResult: 'Exact score / goals',
      outcome: 'Winner or tie',
      groupTable: 'Group table',
      knockoutTeams: 'Knockout teams and positions',
      finalAwards: 'Final awards',
      oddsUpdated: 'Updated',
      oddsModel: 'Model',
      oddsWin: 'Win probability',
      oddsTop3: 'Top 3 probability',
      oddsAvg: 'Expected points',
      oddsMax: 'Max',
      oddsNoData: 'No win-probability data is available yet.'
    }
  };

  const STAGE_CONFIG = {
    r32: { keys: rangeKeys(73, 88), team: 'E16', pos: 'E16P', goals: 'G16', teamPts: 4, posPts: 4, goalPts: 4, goalMin: 4 },
    r16: { keys: rangeKeys(89, 96), team: 'E8', pos: 'E8P', goals: 'G8', teamPts: 6, posPts: 6, goalPts: 6 },
    qf: { keys: rangeKeys(97, 100), team: 'E4', pos: 'E4P', goals: 'G4', teamPts: 8, posPts: 8, goalPts: 6 },
    sf: { keys: rangeKeys(101, 102), team: 'ES', pos: 'ESP', goals: 'GS', teamPts: 10, posPts: 10, goalPts: 8 }
  };


const SUBGROUP_LEADERBOARDS = {
  

  economistasEmporrados: {
    players: ['Pol', 'Eduardo M', 'Enrique M', 'Manu GS', 'Juanma']
  }
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
          const html = `<span class="porra-pred-score-v2">${escapeHtml(score)}</span><span class="porra-pred-winner-v2">${escapeHtml(outcome)}</span>`;
          if (cell.innerHTML !== html) cell.innerHTML = html;
        });
      });
    } finally {
      applyingPredictionEnhancement = false;
    }
  }

  function loadPichichiCurrent() {
    if (!window.fetch || window.PORRA_PICHICHI_CURRENT) return;
    fetch(`pichichi_current.json?v=${Date.now()}`, { cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then(json => {
        if (json && Array.isArray(json.players)) window.PORRA_PICHICHI_CURRENT = json;
      })
      .catch(() => {});
  }

  function installLinks() {
    const summary = document.querySelector('.summary-card');
    if (summary && !document.getElementById('porraLinksSummaryV2')) {
      const wrap = document.createElement('div');
      wrap.id = 'porraLinksSummaryV2';
      wrap.className = 'porra-links-v2 porra-links-v2--summary';
      const summaryLinks = ['finishedResults', 'groupStandings', 'topScorers', 'winProbability', 'liveLeaderboard']
        .map(type => `<button type="button" data-porra-modal-v2="${type}">${escapeHtml(t(type))}</button>`);
      summaryLinks.push(`<a href="https://www.bbc.com/sport/football/world-cup/schedule#KnockoutStage" target="_blank" rel="noopener" data-porra-external-v2="realTimeBracket">${escapeHtml(t('realTimeBracket'))}</a>`);
      wrap.innerHTML = summaryLinks.join('');
      summary.appendChild(wrap);
    }

    const tableCard = document.querySelector('.table-card');
if (tableCard && !document.getElementById('porraLinksPointsV2')) {
  const wrap = document.createElement('div');
  wrap.id = 'porraLinksPointsV2';
  wrap.className = 'porra-links-v2 porra-links-v2--points';

  wrap.innerHTML = [
    `<button type="button" data-porra-modal-v2="pointsSystem">${escapeHtml(t('pointsSystem'))}</button>`,
    ...Object.keys(SUBGROUP_LEADERBOARDS).map(type =>
      `<button type="button" data-porra-modal-v2="${escapeHtml(type)}">${escapeHtml(t(type))}</button>`
    )
  ].join('');

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
    if (type === 'winProbability') return renderWinProbability();
    if (type === 'liveLeaderboard') return renderLiveLeaderboard();
    if (type === 'pointsSystem') return renderPointsSystem();
    if (SUBGROUP_LEADERBOARDS[type]) return renderSubgroupLeaderboard(type);
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

  function formatPctV2(value) {
    const n = Number(value);
    return Number.isFinite(n) ? `${n.toFixed(2)}%` : '—';
  }

  function formatNumberV2(value, digits = 1) {
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(digits) : '—';
  }

  function renderWinProbability() {
    const odds = window.PORRA_ODDS_LATEST || null;
    const rowsData = odds && Array.isArray(odds.players) ? odds.players.slice() : [];
    if (!rowsData.length) return `<p>${escapeHtml(t('oddsNoData'))}</p>`;

    rowsData.sort((a, b) => (Number(b.winPct) || 0) - (Number(a.winPct) || 0) || display(a.displayName || a.player).localeCompare(display(b.displayName || b.player)));
    const intro = [
      odds.label ? `<p class="porra-muted-v2"><strong>${escapeHtml(t('oddsUpdated'))}:</strong> ${escapeHtml(odds.label)}</p>` : '',
      odds.model ? `<p class="porra-muted-v2"><strong>${escapeHtml(t('oddsModel'))}:</strong> ${escapeHtml(odds.model)}</p>` : ''
    ].join('');

    const rows = rowsData.map((row, idx) => `
      <tr>
        <td>${escapeHtml(idx + 1)}</td>
        <td>${escapeHtml(display(row.displayName || row.player))}</td>
        <td class="num">${escapeHtml(formatPctV2(row.winPct))}</td>
        <td class="num">${escapeHtml(formatPctV2(row.top3Pct))}</td>
        <td class="num">${escapeHtml(formatNumberV2(row.avgPoints, 1))}</td>
        <td class="num">${escapeHtml(display(row.maxPoints, '—'))}</td>
      </tr>
    `);

    return `${intro}${tableHtml([t('pos'), t('player'), t('oddsWin'), t('oddsTop3'), t('oddsAvg'), t('oddsMax')], rows)}`;
  }

  function renderTopScorers() {
    const r = results();
    const current = window.PORRA_PICHICHI_CURRENT || null;
    const scorers = Array.isArray(r.topScorers) && r.topScorers.length
      ? r.topScorers
      : (Array.isArray(r.scorers) && r.scorers.length
        ? r.scorers
        : (current && Array.isArray(current.players) ? current.players : []));

    if (!scorers.length) {
      const final = r.final || {};
      const known = final.topScorer ? `<p><strong>${escapeHtml(display(final.topScorer))}</strong>${isNum(final.topScorerGoals) ? ` · ${escapeHtml(final.topScorerGoals)} ${escapeHtml(t('points'))}` : ''}</p>` : '';
      return `${known}<p>${escapeHtml(t('noScorers'))}</p><p class="porra-muted-v2">${escapeHtml(t('scorerHint'))}</p>`;
    }

    const updated = current && (current.asOf || current.source)
      ? `<p class="porra-muted-v2"><strong>${escapeHtml(t('scorerUpdated'))}:</strong> ${escapeHtml(current.asOf || current.source)}</p>`
      : '';
    const sorted = scorers.slice().sort((a, b) => (Number(b.goals) || 0) - (Number(a.goals) || 0) || display(a.name).localeCompare(display(b.name)));
    const rows = sorted.map((scorer, idx) => `<tr><td>${escapeHtml(idx + 1)}</td><td>${escapeHtml(display(scorer.name))}</td><td>${escapeHtml(display(scorer.team))}</td><td class="num">${escapeHtml(display(scorer.goals, 0))}</td></tr>`);
    return `${updated}${tableHtml([t('pos'), t('player'), t('team'), 'Goals'], rows)}`;
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
  
function normalizeParticipantName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function participantIdentifierParts(value) {
  const normalized = normalizeParticipantName(value);
  const parts = normalized.split(' ').filter(Boolean);

  if (!parts.length) {
    return { first: '', initials: '' };
  }

  return {
    first: parts[0],
    initials: parts.slice(1).map(part => part[0]).join('')
  };
}

function participantIdentifierMatches(fullName, wantedIdentifier) {
  const full = participantIdentifierParts(fullName);
  const wanted = participantIdentifierParts(wantedIdentifier);

  if (!full.first || !wanted.first) return false;

  const firstMatches =
    full.first === wanted.first ||
    full.first.startsWith(wanted.first) ||
    wanted.first.startsWith(full.first);

  if (!firstMatches) return false;

  if (!wanted.initials) return true;

  return full.initials.startsWith(wanted.initials);
}

function subgroupDisplayNameForPlayer(fullName, subgroup) {
  return subgroup.players.find(wantedIdentifier =>
    participantIdentifierMatches(fullName, wantedIdentifier)
  ) || null;
}

function renderSubgroupLeaderboard(type) {
  const subgroup = SUBGROUP_LEADERBOARDS[type];
  if (!subgroup) return '';

  const baseRows = computeLeaderboard(false);
  const liveRows = computeLeaderboard(true);
  const prevById = new Map(baseRows.map(row => [row.id, row]));

  const rows = liveRows
    .map(row => {
      const subgroupName = subgroupDisplayNameForPlayer(row.name, subgroup);
      return subgroupName ? { row, subgroupName } : null;
    })
    .filter(Boolean)
    .map(({ row, subgroupName }) => {
      const move = movementLabel(row, prevById);

      return `
        <tr>
          <td><span class="rank-pill">#${escapeHtml(row.rank)}</span></td>
          <td><span class="move ${escapeHtml(move.cls)}">${escapeHtml(move.label)}</span></td>
          <td title="${escapeHtml(row.name)}">${escapeHtml(subgroupName)}</td>
          <td class="num">${escapeHtml(row.total)}</td>
        </tr>
      `;
    });

  if (!rows.length) {
    return `
      <p class="porra-muted-v2">
        No s’ha trobat cap participant per a aquest subgrup.
        Comprova que els identificadors coincideixin amb:
        ${escapeHtml(subgroup.players.join(', '))}.
      </p>
    `;
  }

  return tableHtml([t('pos'), t('move'), t('player'), t('points')], rows);
}

function renderPointsSystem() {
  const copy = {
    ca: {
      intro: 'La classificació es calcula sumant tots els encerts de cada participant. Els punts es van activant a mesura que els partits i les classificacions esdevenen definitius: primer els resultats dels partits de grup, després les classificacions de cada grup, més endavant les rondes eliminatòries i, finalment, els premis finals del torneig.',
      groupStageTitle: 'Partits de la fase de grups',
      groupStageIntro: 'En cada partit de la fase de grups es poden sumar punts de dues maneres.',
      outcomeTitle: 'Encertar el signe del partit — 3 punts.',
      outcomeText: 'Si el participant encerta si el partit acaba amb victòria local, empat o victòria visitant, suma 3 punts. No cal encertar el resultat exacte: per exemple, si algú pronostica 2–1 i el partit acaba 1–0, igualment suma aquests 3 punts perquè ha encertat el guanyador.',
      goalsTitle: 'Encertar els gols de cada equip.',
      goalsText: 'Els gols es puntuen equip per equip. Si encertes exactament els gols d’un equip, sumes com a mínim 2 punts per aquell equip. Si l’equip marca més de 2 gols, els punts són iguals al nombre de gols. Per tant, encertar que un equip marca 0, 1 o 2 gols dona 2 punts; encertar que en marca 3 dona 3 punts; encertar-ne 4 dona 4 punts, etc. Un resultat exacte de 0–0, per exemple, dona 4 punts pels gols —2 per cada equip— més els 3 punts de l’empat.',
      groupStandingsTitle: 'Classificació dels grups',
      groupStandingsIntro: 'Quan un grup ja té tots els partits acabats, també es puntua la classificació final del grup. Per cada una de les quatre posicions del grup es poden sumar:',
      groupStandingsAfter: 'Això vol dir que no només compta haver encertat qui queda primer, segon, tercer o quart, sinó també haver previst bé els números de la classificació: els gols a favor i els punts totals. En cas d’empat entre equips, es farà servir l’ordre final que quedi fixat a la taula oficial de la porra, aplicant els desempats corresponents quan calgui.',
      knockoutTitle: 'Eliminatòries',
      knockoutIntro: 'A les eliminatòries es puntua tant haver previst quins equips arriben a cada ronda com haver-los col·locat correctament dins del quadre.',
      knockoutAfter: 'Per cada equip que arriba a una ronda, es donen punts encara que el participant l’hagi posat en una altra part del quadre. A més, hi ha punts extra si l’equip apareix exactament a la mateixa posició del quadre pronosticada.',
      knockoutGoalsIntro: 'També es poden sumar punts pels gols dels partits eliminatoris. Igual que a la fase de grups, els gols es compten per equip, no només pel resultat global. Als setzens de final, encertar els gols d’un equip dona com a mínim 4 punts, o més si l’equip marca més de 4 gols. A vuitens, quarts i semifinals, els punts per encertar els gols d’un equip són fixos:',
      penaltiesText: 'Els gols de les tandes de penals no compten com a gols del partit per a aquests punts; els penals només serveixen per determinar quin equip passa ronda quan el partit acaba empatat.',
      finalTitle: 'Final, tercer lloc i premis finals',
      finalIntro: 'A la part final del torneig hi ha punts específics pels equips que arriben a la final, pel partit pel tercer lloc, pel resultat d’aquests partits i per les posicions finals.',
      finalAfter: 'Així, la porra no premia només encertar el campió. També compta haver previst bé el recorregut dels equips, la composició de les rondes finals, els resultats dels partits importants i el màxim golejador.',
      correct: 'Encert',
      points: 'Punts',
      round: 'Ronda',
      teamReaches: 'Equip que arriba a la ronda',
      correctPosition: 'Equip en la posició correcta',
      goalsPerTeam: 'Punts per encertar els gols d’un equip',
      groupRows: [
        ['Equip en la posició correcta del grup', '4'],
        ['Gols totals a favor d’aquella posició', '4'],
        ['Punts totals d’aquella posició', '4']
      ],
      knockoutRows: [
        ['Setzens de final', '4', '4'],
        ['Vuitens de final', '6', '6'],
        ['Quarts de final', '8', '8'],
        ['Semifinals', '10', '10']
      ],
      knockoutGoalRows: [
        ['Setzens de final', 'mínim 4'],
        ['Vuitens de final', '6'],
        ['Quarts de final', '6'],
        ['Semifinals', '8']
      ],
      finalRows: [
        ['Equip finalista', '15'],
        ['Equip al partit pel tercer lloc', '12'],
        ['Gols del partit pel tercer lloc, per equip', '10'],
        ['Gols de la final, per equip', '10'],
        ['Quart classificat', '15'],
        ['Tercer classificat', '20'],
        ['Subcampió', '30'],
        ['Campió', '50'],
        ['Pichichi del torneig', '15'],
        ['Gols del pichichi', '10']
      ]
    },

    es: {
      intro: 'La clasificación se calcula sumando todos los aciertos de cada participante. Los puntos se van activando a medida que los partidos y las clasificaciones se vuelven definitivos: primero los resultados de los partidos de la fase de grupos, después las clasificaciones de cada grupo, más adelante las rondas eliminatorias y, finalmente, los premios finales del torneo.',
      groupStageTitle: 'Partidos de la fase de grupos',
      groupStageIntro: 'En cada partido de la fase de grupos se pueden sumar puntos de dos maneras.',
      outcomeTitle: 'Acertar el signo del partido — 3 puntos.',
      outcomeText: 'Si el participante acierta si el partido acaba con victoria local, empate o victoria visitante, suma 3 puntos. No hace falta acertar el resultado exacto: por ejemplo, si alguien pronostica 2–1 y el partido acaba 1–0, igualmente suma esos 3 puntos porque ha acertado el ganador.',
      goalsTitle: 'Acertar los goles de cada equipo.',
      goalsText: 'Los goles se puntúan equipo por equipo. Si aciertas exactamente los goles de un equipo, sumas como mínimo 2 puntos por ese equipo. Si el equipo marca más de 2 goles, los puntos son iguales al número de goles. Por tanto, acertar que un equipo marca 0, 1 o 2 goles da 2 puntos; acertar que marca 3 goles da 3 puntos; acertar 4 goles da 4 puntos, etc. Un resultado exacto de 0–0, por ejemplo, da 4 puntos por los goles —2 por cada equipo— más los 3 puntos del empate.',
      groupStandingsTitle: 'Clasificación de los grupos',
      groupStandingsIntro: 'Cuando un grupo ya tiene todos sus partidos terminados, también se puntúa la clasificación final del grupo. Por cada una de las cuatro posiciones del grupo se pueden sumar:',
      groupStandingsAfter: 'Esto significa que no solo cuenta haber acertado quién queda primero, segundo, tercero o cuarto, sino también haber previsto bien los números de la clasificación: los goles a favor y los puntos totales. En caso de empate entre equipos, se utilizará el orden final que quede fijado en la tabla oficial de la porra, aplicando los desempates correspondientes cuando sea necesario.',
      knockoutTitle: 'Eliminatorias',
      knockoutIntro: 'En las eliminatorias se puntúa tanto haber previsto qué equipos llegan a cada ronda como haberlos colocado correctamente dentro del cuadro.',
      knockoutAfter: 'Por cada equipo que llega a una ronda, se otorgan puntos aunque el participante lo haya colocado en otra parte del cuadro. Además, hay puntos extra si el equipo aparece exactamente en la misma posición del cuadro pronosticada.',
      knockoutGoalsIntro: 'También se pueden sumar puntos por los goles de los partidos eliminatorios. Igual que en la fase de grupos, los goles se cuentan por equipo, no solo por el resultado global. En dieciseisavos de final, acertar los goles de un equipo da como mínimo 4 puntos, o más si el equipo marca más de 4 goles. En octavos, cuartos y semifinales, los puntos por acertar los goles de un equipo son fijos:',
      penaltiesText: 'Los goles de las tandas de penaltis no cuentan como goles del partido para estos puntos; los penaltis solo sirven para determinar qué equipo pasa de ronda cuando el partido acaba empatado.',
      finalTitle: 'Final, tercer puesto y premios finales',
      finalIntro: 'En la parte final del torneo hay puntos específicos por los equipos que llegan a la final, por el partido por el tercer puesto, por el resultado de esos partidos y por las posiciones finales.',
      finalAfter: 'Así, la porra no premia solo acertar el campeón. También cuenta haber previsto bien el recorrido de los equipos, la composición de las rondas finales, los resultados de los partidos importantes y el máximo goleador.',
      correct: 'Acierto',
      points: 'Puntos',
      round: 'Ronda',
      teamReaches: 'Equipo que llega a la ronda',
      correctPosition: 'Equipo en la posición correcta',
      goalsPerTeam: 'Puntos por acertar los goles de un equipo',
      groupRows: [
        ['Equipo en la posición correcta del grupo', '4'],
        ['Goles totales a favor de esa posición', '4'],
        ['Puntos totales de esa posición', '4']
      ],
      knockoutRows: [
        ['Dieciseisavos de final', '4', '4'],
        ['Octavos de final', '6', '6'],
        ['Cuartos de final', '8', '8'],
        ['Semifinales', '10', '10']
      ],
      knockoutGoalRows: [
        ['Dieciseisavos de final', 'mínimo 4'],
        ['Octavos de final', '6'],
        ['Cuartos de final', '6'],
        ['Semifinales', '8']
      ],
      finalRows: [
        ['Equipo finalista', '15'],
        ['Equipo en el partido por el tercer puesto', '12'],
        ['Goles del partido por el tercer puesto, por equipo', '10'],
        ['Goles de la final, por equipo', '10'],
        ['Cuarto clasificado', '15'],
        ['Tercer clasificado', '20'],
        ['Subcampeón', '30'],
        ['Campeón', '50'],
        ['Pichichi del torneo', '15'],
        ['Goles del pichichi', '10']
      ]
    },

    en: {
      intro: 'The standings are calculated by adding up all the correct predictions made by each participant. Points become active as matches and standings become final: first the results of the group-stage matches, then the final standings in each group, later the knockout rounds, and finally the tournament’s end-of-competition awards.',
      groupStageTitle: 'Group-stage matches',
      groupStageIntro: 'In each group-stage match, participants can earn points in two ways.',
      outcomeTitle: 'Predicting the match outcome — 3 points.',
      outcomeText: 'If the participant correctly predicts whether the match ends in a home win, a draw, or an away win, they earn 3 points. The exact score does not have to be correct: for example, if someone predicts 2–1 and the match ends 1–0, they still earn those 3 points because they correctly predicted the winner.',
      goalsTitle: 'Predicting each team’s goals.',
      goalsText: 'Goals are scored team by team. If you correctly predict exactly how many goals a team scores, you earn at least 2 points for that team. If the team scores more than 2 goals, the number of points is equal to the number of goals. So correctly predicting that a team scores 0, 1, or 2 goals gives 2 points; correctly predicting 3 goals gives 3 points; correctly predicting 4 goals gives 4 points, and so on. An exact 0–0 prediction, for example, gives 4 points for the goals —2 for each team— plus the 3 points for correctly predicting the draw.',
      groupStandingsTitle: 'Group standings',
      groupStandingsIntro: 'Once all matches in a group have been completed, the final group standings are also scored. For each of the four positions in the group, participants can earn:',
      groupStandingsAfter: 'This means that it is not only important to predict who finishes first, second, third, or fourth, but also to predict the numbers in the standings correctly: goals scored and total points. If teams are tied, the final order used will be the one fixed in the official pool standings table, applying the relevant tiebreakers when necessary.',
      knockoutTitle: 'Knockout rounds',
      knockoutIntro: 'In the knockout rounds, points are awarded both for predicting which teams reach each round and for placing them correctly within the bracket.',
      knockoutAfter: 'For every team that reaches a round, points are awarded even if the participant placed that team in a different part of the bracket. In addition, there are extra points if the team appears in exactly the same bracket position as predicted.',
      knockoutGoalsIntro: 'Participants can also earn points for goals scored in knockout matches. As in the group stage, goals are counted team by team, not only by the overall scoreline. In the Round of 32, correctly predicting a team’s goals gives at least 4 points, or more if the team scores more than 4 goals. In the Round of 16, quarter-finals, and semi-finals, the points for correctly predicting a team’s goals are fixed:',
      penaltiesText: 'Goals scored in penalty shootouts do not count as match goals for these points; penalties only determine which team advances when a match ends in a draw.',
      finalTitle: 'Final, third-place match, and final awards',
      finalIntro: 'At the end of the tournament, there are specific points for the teams that reach the final, the teams that play the third-place match, the results of those matches, and the final finishing positions.',
      finalAfter: 'So the pool does not only reward predicting the champion. It also rewards correctly predicting each team’s path through the tournament, the composition of the final rounds, the results of the most important matches, and the tournament’s top scorer.',
      correct: 'Correct prediction',
      points: 'Points',
      round: 'Round',
      teamReaches: 'Team reaches the round',
      correctPosition: 'Team in the correct position',
      goalsPerTeam: 'Points for correctly predicting one team’s goals',
      groupRows: [
        ['Team in the correct group position', '4'],
        ['Total goals scored by that position', '4'],
        ['Total points earned by that position', '4']
      ],
      knockoutRows: [
        ['Round of 32', '4', '4'],
        ['Round of 16', '6', '6'],
        ['Quarter-finals', '8', '8'],
        ['Semi-finals', '10', '10']
      ],
      knockoutGoalRows: [
        ['Round of 32', 'minimum 4'],
        ['Round of 16', '6'],
        ['Quarter-finals', '6'],
        ['Semi-finals', '8']
      ],
      finalRows: [
        ['Finalist', '15'],
        ['Team in the third-place match', '12'],
        ['Goals in the third-place match, per team', '10'],
        ['Goals in the final, per team', '10'],
        ['Fourth place', '15'],
        ['Third place', '20'],
        ['Runner-up', '30'],
        ['Champion', '50'],
        ['Tournament top scorer', '15'],
        ['Top scorer’s number of goals', '10']
      ]
    }
  };

  const c = copy[lang()] || copy.ca;

  const twoColRows = rows => rows.map(([a, b]) =>
    `<tr><td>${escapeHtml(a)}</td><td class="num">${escapeHtml(b)}</td></tr>`
  );

  const threeColRows = rows => rows.map(([a, b, d]) =>
    `<tr><td>${escapeHtml(a)}</td><td class="num">${escapeHtml(b)}</td><td class="num">${escapeHtml(d)}</td></tr>`
  );

  return `
    <div class="porra-rules-prose-v2">
      <p>${escapeHtml(c.intro)}</p>

      <h3>${escapeHtml(c.groupStageTitle)}</h3>
      <p>${escapeHtml(c.groupStageIntro)}</p>

      <p>
        <strong>${escapeHtml(c.outcomeTitle)}</strong>
        ${escapeHtml(c.outcomeText)}
      </p>

      <p>
        <strong>${escapeHtml(c.goalsTitle)}</strong>
        ${escapeHtml(c.goalsText)}
      </p>

      <h3>${escapeHtml(c.groupStandingsTitle)}</h3>
      <p>${escapeHtml(c.groupStandingsIntro)}</p>

      ${tableHtml([c.correct, c.points], twoColRows(c.groupRows))}

      <p>${escapeHtml(c.groupStandingsAfter)}</p>

      <h3>${escapeHtml(c.knockoutTitle)}</h3>
      <p>${escapeHtml(c.knockoutIntro)}</p>
      <p>${escapeHtml(c.knockoutAfter)}</p>

      ${tableHtml([c.round, c.teamReaches, c.correctPosition], threeColRows(c.knockoutRows))}

      <p>${escapeHtml(c.knockoutGoalsIntro)}</p>

      ${tableHtml([c.round, c.goalsPerTeam], twoColRows(c.knockoutGoalRows))}

      <p>${escapeHtml(c.penaltiesText)}</p>

      <h3>${escapeHtml(c.finalTitle)}</h3>
      <p>${escapeHtml(c.finalIntro)}</p>

      ${tableHtml([c.correct, c.points], twoColRows(c.finalRows))}

      <p>${escapeHtml(c.finalAfter)}</p>
    </div>
  `;
}
  
  function refreshDynamicLabels() {
    const summary = document.getElementById('porraLinksSummaryV2');
    if (summary) {
      summary.querySelectorAll('[data-porra-modal-v2]').forEach(btn => {
        const type = btn.getAttribute('data-porra-modal-v2');
        btn.textContent = t(type);
      });
      summary.querySelectorAll('[data-porra-external-v2]').forEach(link => {
        const type = link.getAttribute('data-porra-external-v2');
        link.textContent = t(type);
      });
    }
   const pointsWrap = document.getElementById('porraLinksPointsV2');

if (pointsWrap) {
  pointsWrap.querySelectorAll('[data-porra-modal-v2]').forEach(btn => {
    const type = btn.getAttribute('data-porra-modal-v2');
    btn.textContent = t(type);
  });
}
  }

    const DRAWER_I18N_V2 = {
    ca: {
      predictedGroupTables: 'Classificacions de grup previstes',
      knockoutRun: 'Eliminatòries previstes',
      noGroupPredictions: 'No hi ha pronòstics de grup disponibles.',
      noKnockoutPredictions: 'No hi ha pronòstics d’eliminatòries disponibles.',
      winner: 'Guanyador',
      r32: 'Setzens',
      r16: 'Vuitens',
      qf: 'Quarts',
      sf: 'Semifinals',
      thirdPlace: 'Tercer lloc',
      final: 'Final'
    },
    es: {
      predictedGroupTables: 'Clasificaciones de grupo previstas',
      knockoutRun: 'Eliminatorias previstas',
      noGroupPredictions: 'No hay pronósticos de grupo disponibles.',
      noKnockoutPredictions: 'No hay pronósticos de eliminatorias disponibles.',
      winner: 'Ganador',
      r32: 'Dieciseisavos',
      r16: 'Octavos',
      qf: 'Cuartos',
      sf: 'Semifinales',
      thirdPlace: 'Tercer puesto',
      final: 'Final'
    },
    en: {
      predictedGroupTables: 'Predicted group tables',
      knockoutRun: 'Predicted knockout run',
      noGroupPredictions: 'No group-stage predictions available.',
      noKnockoutPredictions: 'No knockout predictions available.',
      winner: 'Winner',
      r32: 'Round of 32',
      r16: 'Round of 16',
      qf: 'Quarter-finals',
      sf: 'Semi-finals',
      thirdPlace: 'Third-place match',
      final: 'Final'
    }
  };

  function drawerTextV2(key) {
    const l = lang();
    return (DRAWER_I18N_V2[l] && DRAWER_I18N_V2[l][key]) ||
      (DRAWER_I18N_V2.ca && DRAWER_I18N_V2.ca[key]) ||
      key;
  }

  function drawerMatchNumberV2(id) {
    const match = String(id || '').match(/^M(\d+)$/);
    return match ? Number(match[1]) : 0;
  }

  function drawerStageLabelV2(match) {
    const n = drawerMatchNumberV2(match && match.id);

    if (n >= 73 && n <= 88) return drawerTextV2('r32');
    if (n >= 89 && n <= 96) return drawerTextV2('r16');
    if (n >= 97 && n <= 100) return drawerTextV2('qf');
    if (n >= 101 && n <= 102) return drawerTextV2('sf');
    if (n === 103) return drawerTextV2('thirdPlace');
    if (n === 104) return drawerTextV2('final');

    return display(match && match.round);
  }

  function drawerPredictedWinnerV2(match) {
    if (!match) return '—';

    if (match.winner) return display(match.winner);

    if (isNum(match.homeScore) && isNum(match.awayScore)) {
      if (match.homeScore > match.awayScore) return display(match.home);
      if (match.awayScore > match.homeScore) return display(match.away);

      if (isNum(match.penHome) && isNum(match.penAway)) {
        if (match.penHome > match.penAway) return display(match.home);
        if (match.penAway > match.penHome) return display(match.away);
      }

      return t('tie');
    }

    return '—';
  }

  function drawerGroupFromMatchIdV2(id) {
  const match = String(id || '').match(/^G-([A-L])-/);
  return match ? match[1] : '';
}

function drawerMatchTemplateV2(id) {
  return (data().matches || []).find(match => match.id === id) || {};
}
  
  function drawerPredictedGroupTablesV2(player) {
    const d = data();
    const groups = d.groups || {};
    const tables = {};

    Object.entries(groups).forEach(([groupName, teams]) => {
      tables[groupName] = Object.fromEntries(
        teams.map(team => [team, {
          team,
          p: 0,
          w: 0,
          d: 0,
          l: 0,
          gf: 0,
          ga: 0,
          gd: 0,
          pts: 0
        }])
      );
    });

  (player.groupMatches || []).forEach(match => {
  if (!match || !isNum(match.homeScore) || !isNum(match.awayScore)) return;

  const template = drawerMatchTemplateV2(match.id);
  const groupName = match.group || template.group || drawerGroupFromMatchIdV2(match.id);
  const homeName = match.home || template.home;
  const awayName = match.away || template.away;

  if (!groupName || !homeName || !awayName) return;

  const table = tables[groupName];
  if (!table) return;

  const home = table[homeName];
  const away = table[awayName];
  if (!home || !away) return;

  home.p += 1;
  away.p += 1;

  home.gf += match.homeScore;
  home.ga += match.awayScore;
  away.gf += match.awayScore;
  away.ga += match.homeScore;

  if (match.homeScore > match.awayScore) {
    home.w += 1;
    away.l += 1;
    home.pts += 3;
  } else if (match.awayScore > match.homeScore) {
    away.w += 1;
    home.l += 1;
    away.pts += 3;
  } else {
    home.d += 1;
    away.d += 1;
    home.pts += 1;
    away.pts += 1;
  }
});
    const groupTablesHtml = Object.entries(tables).map(([groupName, tableObj]) => {
      let rows = Object.values(tableObj).map(row => ({
        ...row,
        gd: row.gf - row.ga
      }));

      const predictedOrder = (player.groupStandings && player.groupStandings[groupName]) || [];
      const order = new Map(predictedOrder.map((row, idx) => [row.team, idx]));

      if (order.size) {
        rows.sort((a, b) => {
          const ai = order.has(a.team) ? order.get(a.team) : 999;
          const bi = order.has(b.team) ? order.get(b.team) : 999;
          return ai - bi;
        });
      } else {
        rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team));
      }

      const body = rows.map((row, idx) => `<tr>
        <td>${escapeHtml(idx + 1)}</td>
        <td>${escapeHtml(display(row.team))}</td>
        <td>${escapeHtml(row.p)}</td>
        <td>${escapeHtml(row.w)}</td>
        <td>${escapeHtml(row.d)}</td>
        <td>${escapeHtml(row.l)}</td>
        <td>${escapeHtml(row.gf)}</td>
        <td>${escapeHtml(row.ga)}</td>
        <td>${escapeHtml(row.gd)}</td>
        <td>${escapeHtml(row.pts)}</td>
      </tr>`);

      return `<div class="porra-drawer-group-v2">
        <h4>${escapeHtml(t('group'))} ${escapeHtml(groupName)}</h4>
        ${tableHtml(
          [t('pos'), t('team'), t('played'), t('won'), t('drawn'), t('lost'), t('gf'), t('ga'), t('gd'), t('points')],
          body
        )}
      </div>`;
    }).join('');

    if (!groupTablesHtml) return `<p class="porra-muted-v2">${escapeHtml(drawerTextV2('noGroupPredictions'))}</p>`;

    return `<section class="porra-drawer-section-v2">
      <h3>${escapeHtml(drawerTextV2('predictedGroupTables'))}</h3>
      <div class="porra-drawer-groups-v2">${groupTablesHtml}</div>
    </section>`;
  }

  function drawerKnockoutRunV2(player) {
    const matches = (player.knockoutMatches || [])
      .slice()
      .sort((a, b) => drawerMatchNumberV2(a.id) - drawerMatchNumberV2(b.id));

    if (!matches.length) {
      return `<section class="porra-drawer-section-v2">
        <h3>${escapeHtml(drawerTextV2('knockoutRun'))}</h3>
        <p class="porra-muted-v2">${escapeHtml(drawerTextV2('noKnockoutPredictions'))}</p>
      </section>`;
    }

    const rows = matches.map(match => `<tr>
      <td>${escapeHtml(drawerStageLabelV2(match))}</td>
      <td>${escapeHtml(display(match.id))}</td>
      <td>${escapeHtml(display(match.home))} vs ${escapeHtml(display(match.away))}</td>
      <td>${escapeHtml(scoreText(match))}</td>
      <td>${escapeHtml(drawerPredictedWinnerV2(match))}</td>
    </tr>`);

    return `<section class="porra-drawer-section-v2">
      <h3>${escapeHtml(drawerTextV2('knockoutRun'))}</h3>
      ${tableHtml([t('stage'), 'ID', t('match'), t('score'), drawerTextV2('winner')], rows)}
    </section>`;
  }

  function enhancePlayerDrawerV2() {
    const drawerContent = document.getElementById('drawerContent');
    const drawerTitle = document.getElementById('drawerTitle');

    if (!drawerContent || !drawerTitle) return;
    if (drawerContent.querySelector('#porraDrawerExtrasV2')) return;

    const playerName = drawerTitle.textContent.trim();
    if (!playerName) return;

    const player = (data().players || []).find(p => p.name === playerName);
    if (!player) return;

    const html = `<div id="porraDrawerExtrasV2" class="porra-drawer-extras-v2">
  ${drawerPredictedGroupTablesV2(player)}
</div>`;

    drawerContent.insertAdjacentHTML('beforeend', html);
  }

  function installPlayerDrawerEnhancementV2() {
    document.addEventListener('click', event => {
      if (event.target.closest('tr[data-player]')) {
        setTimeout(enhancePlayerDrawerV2, 0);
      }
    });

    document.addEventListener('keydown', event => {
      const row = event.target.closest && event.target.closest('tr[data-player]');
      if (row && (event.key === 'Enter' || event.key === ' ')) {
        setTimeout(enhancePlayerDrawerV2, 0);
      }
    });

    const drawerContent = document.getElementById('drawerContent');
    if (drawerContent) {
      let queued = false;

      const observer = new MutationObserver(() => {
        if (drawerContent.querySelector('#porraDrawerExtrasV2')) return;
        if (queued) return;

        queued = true;
        requestAnimationFrame(() => {
          queued = false;
          enhancePlayerDrawerV2();
        });
      });

      observer.observe(drawerContent, { childList: true });
    }
  }
  
  function boot() {
    loadPichichiCurrent();
    installLinks();
    bindEvents();
    enhancePredictionCells();
    refreshDynamicLabels();
    installPlayerDrawerEnhancementV2();

    const tbody = document.getElementById('leaderboardBody');
    if (tbody) {
      let refreshQueued = false;
      const scheduleRefresh = () => {
        if (refreshQueued) return;
        refreshQueued = true;
        requestAnimationFrame(() => {
          refreshQueued = false;
          refreshDynamicLabels();
          enhancePredictionCells();
        });
      };

      const observer = new MutationObserver(scheduleRefresh);
      observer.observe(tbody, { childList: true });
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
