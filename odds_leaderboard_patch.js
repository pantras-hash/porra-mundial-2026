(function () {
  'use strict';

  const STYLE_ID = 'porra-odds-leaderboard-style';
  const NOTE_ID = 'porra-odds-note';
  const KINDS = ['fifa', 'espn'];

  function oddsData(kind) {
    if (kind === 'espn') return window.PORRA_ODDS_ESPN || null;
    return window.PORRA_ODDS_FIFA || window.PORRA_ODDS_LATEST || null;
  }

  function oddsRows(kind) {
    const data = oddsData(kind);
    return data && Array.isArray(data.players) ? data.players : [];
  }

  function normalizeName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function oddsMap(kind) {
    const map = new Map();
    oddsRows(kind).forEach(row => {
      if (!row) return;
      const names = [row.player, row.displayName].concat(Array.isArray(row.aliases) ? row.aliases : []);
      names.forEach(name => {
        const key = normalizeName(name);
        if (key) map.set(key, row);
      });
    });
    return map;
  }

  function currentLang() {
    return localStorage.getItem('porraLang') || document.documentElement.lang || 'ca';
  }

  function columnLabel(kind) {
    return kind === 'espn' ? 'Pr. ESPN' : 'Pr. FIFA';
  }

  function noteText() {
    const fifa = oddsData('fifa');
    const espn = oddsData('espn');
    const label = (fifa && fifa.label) || (espn && espn.label) || '';
    const texts = {
      ca: `Pr. FIFA i Pr. ESPN: probabilitat estimada de guanyar segons les simulacions Monte Carlo${label ? ` (${label})` : ''}.`,
      es: `Pr. FIFA y Pr. ESPN: probabilidad estimada de ganar según las simulaciones Monte Carlo${label ? ` (${label})` : ''}.`,
      en: `Pr. FIFA and Pr. ESPN: estimated win probability from the Monte Carlo simulations${label ? ` (${label})` : ''}.`
    };
    return texts[currentLang()] || texts.ca;
  }

  function formatWinPct(row) {
    const value = row && Number(row.winPct);
    return Number.isFinite(value) ? `${value.toFixed(2)}%` : '—';
  }

  function pointsColumnIndex(headerRow) {
    const cells = Array.from(headerRow.cells || []);
    const firstOdds = cells.findIndex(cell => cell.dataset && cell.dataset.oddsColumn);
    if (firstOdds >= 0) return firstOdds - 1;
    const byI18n = cells.findIndex(cell => cell.getAttribute('data-i18n') === 'colPoints');
    if (byI18n >= 0) return byI18n;
    const byText = cells.findIndex(cell => /punts|puntos|points/i.test(cell.textContent || ''));
    return byText >= 0 ? byText : 3;
  }

  function playerNameFromRow(row) {
    if (!row || row.cells.length < 3) return '';
    return normalizeName(row.cells[2].textContent);
  }

  function setTextIfChanged(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #leaderboardTable .odds-cell,
      #leaderboardTable .odds-header {
        text-align: right;
        white-space: nowrap;
        padding-left: 0.75rem;
      }
      #leaderboardTable .odds-cell {
        font-variant-numeric: tabular-nums;
      }
      .odds-note {
        margin: 0.75rem 0 0;
        padding-left: 0.75rem;
        font-size: 0.85rem;
        opacity: 0.75;
      }
      @media (max-width: 760px) {
        #leaderboardTable .odds-header,
        #leaderboardTable .odds-cell {
          padding-left: 0.5rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureHeader(table) {
    if (!table || !table.tHead || !table.tHead.rows.length) return;
    const headerRow = table.tHead.rows[0];
    let insertAfterIndex = pointsColumnIndex(headerRow);

    KINDS.forEach(kind => {
      let th = headerRow.querySelector(`[data-odds-column="${kind}"]`);
      if (!th) {
        th = document.createElement('th');
        th.className = 'num odds-header';
        th.dataset.oddsColumn = kind;
        headerRow.insertBefore(th, headerRow.cells[insertAfterIndex + 1] || null);
      }
      setTextIfChanged(th, columnLabel(kind));
      insertAfterIndex = Array.from(headerRow.cells).indexOf(th);
    });
  }

  function ensureBodyCells(table) {
    if (!table || !table.tBodies || !table.tBodies.length) return;
    const maps = Object.fromEntries(KINDS.map(kind => [kind, oddsMap(kind)]));
    const headerRow = table.tHead && table.tHead.rows.length ? table.tHead.rows[0] : null;
    const pointsIndex = headerRow ? pointsColumnIndex(headerRow) : 3;

    Array.from(table.tBodies[0].rows).forEach(row => {
      if (row.cells.length === 1) {
        const desired = Math.max(Number(row.cells[0].colSpan || 1), 10);
        if (row.cells[0].colSpan !== desired) row.cells[0].colSpan = desired;
        return;
      }

      let insertAfterIndex = pointsIndex;
      KINDS.forEach(kind => {
        const odds = maps[kind].get(playerNameFromRow(row));
        const value = formatWinPct(odds);
        let cell = row.querySelector(`[data-odds-column="${kind}"]`);
        if (!cell) {
          cell = document.createElement('td');
          cell.className = 'num odds-cell';
          cell.dataset.oddsColumn = kind;
          row.insertBefore(cell, row.cells[insertAfterIndex + 1] || null);
        }
        setTextIfChanged(cell, value);

        const title = odds
          ? `Top 3: ${Number(odds.top3Pct || 0).toFixed(2)}% · Last: ${Number(odds.lastPct || 0).toFixed(2)}% · Cond.: ${Number(odds.conditionalChampionWinPct || 0).toFixed(2)}%`
          : '';
        if (title) {
          if (cell.title !== title) cell.title = title;
        } else if (cell.hasAttribute('title')) {
          cell.removeAttribute('title');
        }
        insertAfterIndex = Array.from(row.cells).indexOf(cell);
      });
    });
  }

  function ensureNote(table) {
    if (!table) return;
    let note = document.getElementById(NOTE_ID);
    if (!note) {
      note = document.createElement('p');
      note.id = NOTE_ID;
      note.className = 'odds-note';
      const wrap = table.closest('.table-wrap');
      if (wrap && wrap.parentNode) wrap.parentNode.insertBefore(note, wrap.nextSibling);
    }
    setTextIfChanged(note, noteText());
  }

  function patchLeaderboard() {
    ensureStyle();
    const table = document.getElementById('leaderboardTable');
    if (!table) return;
    ensureHeader(table);
    ensureBodyCells(table);
    ensureNote(table);
  }

  let scheduled = false;
  function schedulePatch() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      patchLeaderboard();
    });
  }

  function boot() {
    schedulePatch();
    const tbody = document.getElementById('leaderboardBody');
    if (tbody) {
      const observer = new MutationObserver(schedulePatch);
      observer.observe(tbody, { childList: true });
    }

    // Finite retries catch the dynamic app render without creating an endless loop.
    [100, 300, 700, 1200, 2000, 3500].forEach(ms => setTimeout(schedulePatch, ms));

    document.addEventListener('click', event => {
      if (event.target && event.target.closest && event.target.closest('[data-lang]')) {
        setTimeout(schedulePatch, 0);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
