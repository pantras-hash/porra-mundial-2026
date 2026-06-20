(function () {
  'use strict';

  const STYLE_ID = 'porra-odds-leaderboard-style';
  const NOTE_ID = 'porra-odds-note';

  function oddsData() {
    return window.PORRA_ODDS_LATEST || null;
  }

  function oddsRows() {
    const data = oddsData();
    return data && Array.isArray(data.players) ? data.players : [];
  }

  function normalizeName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function oddsMap() {
    const map = new Map();
    oddsRows().forEach(row => {
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

  function columnLabel() {
    return ({ ca: 'Prob.', es: 'Prob.', en: 'Win %' }[currentLang()] || 'Prob.');
  }

  function noteText() {
    const data = oddsData();
    const label = data && data.label ? data.label : '';
    const texts = {
      ca: `Prob.: probabilitat estimada de guanyar segons l'última simulació Monte Carlo${label ? ` (${label})` : ''}.`,
      es: `Prob.: probabilidad estimada de ganar según la última simulación Monte Carlo${label ? ` (${label})` : ''}.`,
      en: `Win %: estimated probability of winning from the latest Monte Carlo simulation${label ? ` (${label})` : ''}.`
    };
    return texts[currentLang()] || texts.ca;
  }

  function formatWinPct(row) {
    const value = row && Number(row.winPct);
    return Number.isFinite(value) ? `${value.toFixed(2)}%` : '—';
  }

  function pointsColumnIndex(headerRow) {
    const cells = Array.from(headerRow.cells || []);
    const byOdds = cells.findIndex(cell => cell.dataset && cell.dataset.oddsColumn === 'true');
    if (byOdds >= 0) return byOdds - 1;
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
    const existing = headerRow.querySelector('[data-odds-column="true"]');
    if (existing) {
      setTextIfChanged(existing, columnLabel());
      return;
    }
    const th = document.createElement('th');
    th.className = 'num odds-header';
    th.dataset.oddsColumn = 'true';
    th.textContent = columnLabel();
    const pointsIndex = pointsColumnIndex(headerRow);
    headerRow.insertBefore(th, headerRow.cells[pointsIndex + 1] || null);
  }

  function ensureBodyCells(table) {
    if (!table || !table.tBodies || !table.tBodies.length) return;
    const map = oddsMap();
    const headerRow = table.tHead && table.tHead.rows.length ? table.tHead.rows[0] : null;
    const pointsIndex = headerRow ? pointsColumnIndex(headerRow) : 3;

    Array.from(table.tBodies[0].rows).forEach(row => {
      if (row.cells.length === 1) {
        const desired = Math.max(Number(row.cells[0].colSpan || 1), 8);
        if (row.cells[0].colSpan !== desired) row.cells[0].colSpan = desired;
        return;
      }

      const odds = map.get(playerNameFromRow(row));
      const value = formatWinPct(odds);
      let cell = row.querySelector('[data-odds-column="true"]');
      if (!cell) {
        cell = document.createElement('td');
        cell.className = 'num odds-cell';
        cell.dataset.oddsColumn = 'true';
        row.insertBefore(cell, row.cells[pointsIndex + 1] || null);
      }
      setTextIfChanged(cell, value);

      const title = odds && odds.avgPoints !== undefined
        ? `Top 3: ${Number(odds.top3Pct || 0).toFixed(2)}% · Avg pts: ${Number(odds.avgPoints || 0).toFixed(1)}`
        : '';
      if (title) {
        if (cell.title !== title) cell.title = title;
      } else if (cell.hasAttribute('title')) {
        cell.removeAttribute('title');
      }
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
