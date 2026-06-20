// Safe win-probability tab patch.
// Replace odds_tab_patch.js with this file.
// No index.html change required.
(function () {
  'use strict';

  const TAB_ID = 'porraOddsTabButton';
  const MODAL_ID = 'porraOddsModal';
  const STYLE_ID = 'porraOddsModalStyle';

  const TEXT = {
    ca: {
      tab: 'Probabilitats de guanyar',
      title: 'Probabilitats de guanyar',
      loading: 'Monte Carlo - carregant dades...',
      missing: 'No s\'han trobat probabilitats. Comprova que odds_latest.js estigui carregat.',
      footer: 'Win % / Top 3 % son probabilitats simulades. Pich pts son punts esperats dels bonus de Pichichi.',
      simulations: 'simulacions',
      columns: { rank: '#', participant: 'Participant', win: 'Win %', top3: 'Top 3 %', avg: 'Avg pts', pich: 'Pich pts' }
    },
    es: {
      tab: 'Probabilidad de ganar',
      title: 'Probabilidad de ganar',
      loading: 'Monte Carlo - cargando datos...',
      missing: 'No se han encontrado probabilidades. Comprueba que odds_latest.js este cargado.',
      footer: 'Win % / Top 3 % son probabilidades simuladas. Pich pts son puntos esperados de los bonus de Pichichi.',
      simulations: 'simulaciones',
      columns: { rank: '#', participant: 'Participante', win: 'Win %', top3: 'Top 3 %', avg: 'Pts prom.', pich: 'Pts Pich.' }
    },
    en: {
      tab: 'Win probability',
      title: 'Win probability',
      loading: 'Monte Carlo - loading data...',
      missing: 'No probabilities found. Check that odds_latest.js is loaded.',
      footer: 'Win % / Top 3 % are simulated probabilities. Boot pts are expected points from Golden Boot bonuses.',
      simulations: 'simulations',
      columns: { rank: '#', participant: 'Player', win: 'Win %', top3: 'Top 3 %', avg: 'Avg pts', pich: 'Boot pts' }
    }
  };

  function getLang() {
    const candidates = [];
    const activeButton = document.querySelector('.lang-btn.active, .lang-btn.is-active, .lang-btn[aria-pressed="true"]');
    if (activeButton && activeButton.dataset && activeButton.dataset.lang) candidates.push(activeButton.dataset.lang);
    if (window.PORRA_LANG) candidates.push(window.PORRA_LANG);
    if (document.documentElement.lang) candidates.push(document.documentElement.lang);
    try {
      const stored = localStorage.getItem('porraLang');
      if (stored) candidates.push(stored);
    } catch (error) {}
    const raw = String(candidates.find(Boolean) || navigator.language || 'ca').toLowerCase();
    if (raw.startsWith('es')) return 'es';
    if (raw.startsWith('en')) return 'en';
    return 'ca';
  }

  function t() {
    return TEXT[getLang()] || TEXT.ca;
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function numberOr(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function val(row, keys, fallback) {
    for (const key of keys) {
      if (row && row[key] != null) return row[key];
    }
    return fallback;
  }

  const KEYS = {
    rank: ['rank', 'Rank', 'position', 'Position', 'pos'],
    name: ['player', 'Player', 'participant', 'Participant', 'displayName', 'display_name', 'name', 'Name'],
    win: ['winPct', 'WinPct', 'win_pct', 'winProbability', 'win_probability', 'probWin', 'prob_win', 'win'],
    top3: ['top3Pct', 'Top3Pct', 'top3_pct', 'top3Probability', 'top3_probability', 'probTop3', 'prob_top3'],
    avg: ['avgPoints', 'AvgPoints', 'avg_points', 'expectedPoints', 'expected_points', 'meanPoints', 'mean_points'],
    pich: ['pichichiExpPoints', 'PichichiExpPoints', 'pichichi_exp_points', 'bootExpPoints', 'boot_exp_points', 'pichPts', 'pich_pts']
  };

  function pct(value) {
    return numberOr(value, 0).toFixed(2) + '%';
  }

  function pts(value, digits) {
    return numberOr(value, 0).toFixed(digits == null ? 1 : digits);
  }

  function getOddsData() {
    return window.PORRA_ODDS_LATEST || window.PORRA_ODDS || window.odds_latest || null;
  }

  function getRows() {
    const data = getOddsData();
    if (data && Array.isArray(data.players)) return data.players.slice();
    if (data && Array.isArray(data.rows)) return data.rows.slice();
    if (data && Array.isArray(data.data)) return data.data.slice();
    if (Array.isArray(data)) return data.slice();
    return [];
  }

  function ensureModalStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .porra-odds-modal { position: fixed; inset: 0; z-index: 9999; display: none; background: rgba(15, 23, 42, .56); padding: 1rem; }
      .porra-odds-modal[aria-hidden="false"] { display: flex; align-items: center; justify-content: center; }
      .porra-odds-panel { width: min(1120px, 100%); max-height: min(88vh, 980px); overflow: hidden; border-radius: 24px; background: #fff; box-shadow: 0 28px 90px rgba(15, 23, 42, .32); border: 1px solid rgba(15, 23, 42, .10); display: flex; flex-direction: column; }
      .porra-odds-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; padding: 1.1rem 1.2rem .9rem; background: linear-gradient(135deg, #14213d, #23395d); color: white; }
      .porra-odds-title { margin: 0; font-size: clamp(1.25rem, 3.2vw, 1.8rem); line-height: 1.1; }
      .porra-odds-subtitle { margin: .35rem 0 0; color: rgba(255,255,255,.82); font-size: .92rem; }
      .porra-odds-close { border: 0; border-radius: 999px; width: 2.3rem; height: 2.3rem; font-size: 1.35rem; line-height: 1; cursor: pointer; background: rgba(255,255,255,.16); color: white; }
      .porra-odds-body { overflow: auto; padding: .85rem; }
      .porra-odds-table { width: 100%; border-collapse: separate; border-spacing: 0 .35rem; font-size: .95rem; }
      .porra-odds-table th { position: sticky; top: 0; z-index: 1; background: #f8fafc; color: #1e293b; text-align: left; padding: .7rem .6rem; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
      .porra-odds-table th.num, .porra-odds-table td.num { text-align: right; }
      .porra-odds-table td { padding: .66rem .6rem; background: #fff; border-top: 1px solid #eef2f7; border-bottom: 1px solid #eef2f7; white-space: nowrap; }
      .porra-odds-table td:first-child { border-left: 1px solid #eef2f7; border-radius: 14px 0 0 14px; }
      .porra-odds-table td:last-child { border-right: 1px solid #eef2f7; border-radius: 0 14px 14px 0; }
      .porra-odds-table tr:nth-child(-n+3) td { background: #fffbeb; }
      .porra-odds-rank { display: inline-flex; align-items: center; justify-content: center; min-width: 2.05rem; height: 2.05rem; border-radius: .75rem; background: #e2e8f0; font-weight: 800; }
      .porra-odds-table tr:nth-child(-n+3) .porra-odds-rank { background: #fcd34d; }
      .porra-odds-player { font-weight: 750; color: #0f172a; }
      .porra-odds-win { font-weight: 800; color: #0f172a; }
      .porra-odds-pich { color: #15803d; font-weight: 700; }
      .porra-odds-footer { padding: .15rem 1.2rem 1rem; color: #64748b; font-size: .86rem; }
      @media (max-width: 700px) {
        .porra-odds-modal { padding: .55rem; }
        .porra-odds-panel { max-height: 92vh; border-radius: 18px; }
        .porra-odds-body { padding: .45rem; }
        .porra-odds-table { font-size: .82rem; }
        .porra-odds-table th, .porra-odds-table td { padding: .55rem .42rem; }
        .porra-odds-optional { display: none; }
      }
    `;
    document.head.appendChild(style);
  }

  function updateText() {
    const text = t();
    const btn = document.getElementById(TAB_ID);
    if (btn && btn.textContent !== text.tab) btn.textContent = text.tab;

    const title = document.getElementById('porraOddsTitle');
    if (title && title.textContent !== text.title) title.textContent = text.title;

    const footer = document.getElementById('porraOddsFooter');
    if (footer && footer.textContent !== text.footer) footer.textContent = text.footer;

    const colMap = {
      porraOddsColRank: text.columns.rank,
      porraOddsColParticipant: text.columns.participant,
      porraOddsColWin: text.columns.win,
      porraOddsColTop3: text.columns.top3,
      porraOddsColAvg: text.columns.avg,
      porraOddsColPich: text.columns.pich
    };
    Object.keys(colMap).forEach(function (id) {
      const el = document.getElementById(id);
      if (el && el.textContent !== colMap[id]) el.textContent = colMap[id];
    });
  }

  function createModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    ensureModalStyle();
    const text = t();
    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'porra-odds-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="porra-odds-panel" role="dialog" aria-modal="true" aria-labelledby="porraOddsTitle">
        <header class="porra-odds-header">
          <div>
            <h2 class="porra-odds-title" id="porraOddsTitle">${esc(text.title)}</h2>
            <p class="porra-odds-subtitle" id="porraOddsSubtitle">${esc(text.loading)}</p>
          </div>
          <button type="button" class="porra-odds-close" aria-label="Close">&times;</button>
        </header>
        <div class="porra-odds-body">
          <table class="porra-odds-table">
            <thead>
              <tr>
                <th class="num" id="porraOddsColRank">${esc(text.columns.rank)}</th>
                <th id="porraOddsColParticipant">${esc(text.columns.participant)}</th>
                <th class="num" id="porraOddsColWin">${esc(text.columns.win)}</th>
                <th class="num" id="porraOddsColTop3">${esc(text.columns.top3)}</th>
                <th class="num porra-odds-optional" id="porraOddsColAvg">${esc(text.columns.avg)}</th>
                <th class="num" id="porraOddsColPich">${esc(text.columns.pich)}</th>
              </tr>
            </thead>
            <tbody id="porraOddsTableBody">
              <tr><td colspan="6">${esc(text.loading)}</td></tr>
            </tbody>
          </table>
        </div>
        <p class="porra-odds-footer" id="porraOddsFooter">${esc(text.footer)}</p>
      </div>
    `;

    modal.querySelector('.porra-odds-close').addEventListener('click', closeModal);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeModal();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeModal();
    });

    document.body.appendChild(modal);
    return modal;
  }

  function renderTable() {
    const text = t();
    const data = getOddsData();
    const rows = getRows().sort(function (a, b) {
      const ra = numberOr(val(a, KEYS.rank, NaN), NaN);
      const rb = numberOr(val(b, KEYS.rank, NaN), NaN);
      if (Number.isFinite(ra) && Number.isFinite(rb)) return ra - rb;
      return numberOr(val(b, KEYS.win, 0), 0) - numberOr(val(a, KEYS.win, 0), 0);
    });

    updateText();

    const subtitle = document.getElementById('porraOddsSubtitle');
    if (subtitle) {
      if (data) {
        const sim = data.simulations || data.nSims || data.num_simulations || data.numSimulations || '';
        const label = data.label || data.generatedAt || data.timestamp || '';
        subtitle.textContent = [sim ? `${sim} ${text.simulations}` : 'Monte Carlo', label].filter(Boolean).join(' - ');
      } else {
        subtitle.textContent = text.missing;
      }
    }

    const body = document.getElementById('porraOddsTableBody');
    if (!body) return;

    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="6">${esc(text.missing)}</td></tr>`;
      return;
    }

    body.innerHTML = rows.map(function (row, idx) {
      const rank = val(row, KEYS.rank, idx + 1);
      const name = val(row, KEYS.name, '');
      const winPct = val(row, KEYS.win, 0);
      const top3Pct = val(row, KEYS.top3, 0);
      const avgPoints = val(row, KEYS.avg, 0);
      const pichPtsValue = val(row, KEYS.pich, 0);
      return `
        <tr>
          <td class="num"><span class="porra-odds-rank">${esc(rank)}</span></td>
          <td class="porra-odds-player">${esc(name)}</td>
          <td class="num porra-odds-win">${esc(pct(winPct))}</td>
          <td class="num">${esc(pct(top3Pct))}</td>
          <td class="num porra-odds-optional">${esc(pts(avgPoints, 1))}</td>
          <td class="num porra-odds-pich">${esc(pts(pichPtsValue, 2))}</td>
        </tr>
      `;
    }).join('');
  }

  function openModal() {
    const modal = createModal();
    renderTable();
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function findSummaryNav() {
    return document.getElementById('porraLinksSummaryV2') ||
      document.querySelector('.summary-card .porra-links-v2') ||
      document.querySelector('.porra-links-v2--summary');
  }

  function findLiveButton(nav) {
    if (!nav) return null;
    return nav.querySelector('[data-porra-modal-v2="liveLeaderboard"]') ||
      Array.from(nav.querySelectorAll('button,a')).find(function (el) {
        return /classificaci[oó]\s+en\s+directe|clasificaci[oó]n\s+en\s+directo|live\s+leaderboard|live\s+standings|directe|directo|live/i.test(el.textContent || '');
      });
  }

  function addOrUpdateTab() {
    const nav = findSummaryNav();
    if (!nav) return false;

    let button = document.getElementById(TAB_ID);
    if (!button) {
      button = document.createElement('button');
      button.id = TAB_ID;
      button.type = 'button';
      button.setAttribute('data-porra-extra-tab', 'win-probability');
      button.addEventListener('click', openModal);
    }

    const text = t().tab;
    if (button.textContent !== text) button.textContent = text;

    if (button.parentElement !== nav) {
      const liveButton = findLiveButton(nav);
      if (liveButton && liveButton.parentElement === nav) {
        liveButton.insertAdjacentElement('afterend', button);
      } else {
        nav.appendChild(button);
      }
    }

    return true;
  }

  function start() {
    let tries = 0;
    const maxTries = 160; // 40 seconds at 250ms.

    const timer = setInterval(function () {
      tries += 1;
      const ok = addOrUpdateTab();
      if (ok || tries >= maxTries) clearInterval(timer);
    }, 250);

    addOrUpdateTab();

    document.addEventListener('click', function (event) {
      if (event.target && event.target.closest && event.target.closest('.lang-btn')) {
        setTimeout(function () {
          addOrUpdateTab();
          updateText();
        }, 0);
        setTimeout(function () {
          addOrUpdateTab();
          updateText();
        }, 100);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
