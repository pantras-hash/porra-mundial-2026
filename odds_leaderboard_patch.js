(function () {
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
      if (row.player) map.set(normalizeName(row.player), row);
      if (row.displayName) map.set(normalizeName(row.displayName), row);
    });
    return map;
  }

  function currentLang() {
    return localStorage.getItem('porraLang') || document.documentElement.lang || 'ca';
  }

  function columnLabel() {
    const labels = { ca: 'Prob.', es: 'Prob.', en: 'Win %' };
    return labels[currentLang()] || labels.ca;
  }

  function noteText() {
    const data = oddsData();
    const label = data && data.label ? data.label : '';
    const texts = {
      ca: `Prob.: probabilitat estimada de guanyar segons l’última simulació Monte Carlo${label ? ` (${label})` : ''}.`,
      es: `Prob.: probabilidad estimada de ganar según la última simulación Monte Carlo${label ? ` (${label})` : ''}.`,
      en: `Win %: estimated probability of winning from the latest Monte Carlo simulation${label ? ` (${label})` : ''}.`
    };
    return texts[currentLang()] || texts.ca;
  }

  function formatWinPct(row) {
    if (!row || typeof row.winPct !== 'number' || !Number.isFinite(row.winPct)) return '—';
    return `${row.winPct.toFixed(2)}%`;
  }

  function pointsColumnIndex(headerRow) {
    const cells = Array.from(headerRow.cells || []);
    const byI18n = cells.findIndex(cell => cell.getAttribute('data-i18n') === 'colPoints');
    if (byI18n >= 0) return byI18n;

    const byText = cells.findIndex(cell => /punts|puntos|points/i.test(cell.textContent || ''));
    return byText >= 0 ? byText : 3;
  }

  function playerNameFromRow(row) {
    if (!row || row.cells.length < 3) return '';
    return normalizeName(row.cells[2].textContent);
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
      }

      #leaderboardTable .odds-cell {
        font-variant-numeric: tabular-nums;
      }

      .odds-note {
        margin: 0.75rem 0 0;
        font-size: 0.85rem;
        opacity: 0.75;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureHeader(table) {
    if (!table || !table.tHead || !table.tHead.rows.length) return;

    const headerRow = table.tHead.rows[0];
    const existing = headerRow.querySelector('[data-odds-column="true"]');

    if (existing) {
      existing.textContent = columnLabel();
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
        row.cells[0].colSpan = Math.max(Number(row.cells[0].colSpan || 1), 8);
        return;
      }

      const playerName = playerNameFromRow(row);
      const odds = map.get(playerName);
      const value = formatWinPct(odds);

      let cell = row.querySelector('[data-odds-column="true"]');
      if (!cell) {
        cell = document.createElement('td');
        cell.className = 'num odds-cell';
        cell.dataset.oddsColumn = 'true';
        row.insertBefore(cell, row.cells[pointsIndex + 1] || null);
      }

      cell.textContent = value;
      if (odds && odds.avgPoints !== undefined) {
        cell.title = `Top 3: ${Number(odds.top3Pct || 0).toFixed(2)}% · Avg pts: ${Number(odds.avgPoints || 0).toFixed(1)}`;
      } else {
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
      if (wrap && wrap.parentNode) {
        wrap.parentNode.insertBefore(note, wrap.nextSibling);
      }
    }

    note.textContent = noteText();
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
    window.requestAnimationFrame(function () {
      scheduled = false;
      patchLeaderboard();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', patchLeaderboard);
  } else {
    patchLeaderboard();
  }

  const observer = new MutationObserver(schedulePatch);
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('storage', schedulePatch);
  document.addEventListener('click', function (event) {
    if (event.target && event.target.closest && event.target.closest('[data-lang]')) {
      setTimeout(schedulePatch, 0);
    }
  });
})();
