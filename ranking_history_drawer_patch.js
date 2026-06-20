(function () {
  const STYLE_ID = 'porra-ranking-history-style';
  const CARD_ID = 'porra-ranking-history-card';

  function data() {
    return window.PORRA_RANKING_HISTORY || null;
  }

  function currentLang() {
    return localStorage.getItem('porraLang') || document.documentElement.lang || 'ca';
  }

  function text(key) {
    const dict = {
      ca: {
        title: 'Evolució de la posició',
        empty: 'Encara no hi ha prou historial per mostrar el gràfic.',
        best: 'Millor',
        current: 'Actual',
        points: 'punts',
        after: 'després de',
        latest: 'Últim partit',
        updated: 'Actualitzat'
      },
      es: {
        title: 'Evolución de la posición',
        empty: 'Todavía no hay suficiente historial para mostrar el gráfico.',
        best: 'Mejor',
        current: 'Actual',
        points: 'puntos',
        after: 'después de',
        latest: 'Último partido',
        updated: 'Actualizado'
      },
      en: {
        title: 'Position over time',
        empty: 'Not enough history yet to show the chart.',
        best: 'Best',
        current: 'Current',
        points: 'points',
        after: 'after',
        latest: 'Latest match',
        updated: 'Updated'
      }
    };
    const lang = currentLang();
    return (dict[lang] && dict[lang][key]) || dict.ca[key] || key;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .ranking-history-card {
        border: 1px solid rgba(148, 163, 184, 0.30);
        border-radius: 18px;
        padding: 14px 14px 12px;
        margin: 0 0 18px;
        background:
          radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 34%),
          linear-gradient(180deg, rgba(255,255,255,0.78), rgba(248,250,252,0.54));
        box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
      }
      .ranking-history-topline {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
      }
      .ranking-history-card h3 {
        margin: 0;
        font-size: 1rem;
        letter-spacing: -0.01em;
      }
      .ranking-history-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: flex-end;
      }
      .ranking-history-badge {
        border: 1px solid rgba(148, 163, 184, 0.35);
        border-radius: 999px;
        padding: 3px 8px;
        font-size: 0.74rem;
        font-weight: 700;
        background: rgba(255,255,255,0.76);
        color: rgb(51, 65, 85);
        white-space: nowrap;
      }
      .ranking-history-badge strong {
        color: rgb(15, 23, 42);
      }
      .ranking-history-chart-wrap {
        overflow: hidden;
        border-radius: 14px;
        background: rgba(255,255,255,0.60);
        border: 1px solid rgba(226, 232, 240, 0.95);
      }
      .ranking-history-chart {
        display: block;
        width: 100%;
        height: auto;
      }
      .ranking-history-axis {
        fill: rgb(100, 116, 139);
        font-size: 10px;
        font-weight: 600;
      }
      .ranking-history-grid {
        stroke: rgba(148, 163, 184, 0.30);
        stroke-width: 1;
        shape-rendering: crispEdges;
      }
      .ranking-history-area {
        fill: rgba(37, 99, 235, 0.08);
      }
      .ranking-history-line {
        fill: none;
        stroke: rgb(37, 99, 235);
        stroke-width: 3;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: drop-shadow(0 2px 3px rgba(37, 99, 235, 0.22));
      }
      .ranking-history-dot {
        fill: white;
        stroke: rgb(37, 99, 235);
        stroke-width: 2.2;
      }
      .ranking-history-dot-end {
        fill: rgb(37, 99, 235);
        stroke: white;
        stroke-width: 2.8;
      }
      .ranking-history-footer {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 8px;
        color: rgb(100, 116, 139);
        font-size: 0.76rem;
        line-height: 1.35;
      }
      .ranking-history-footer span:last-child {
        text-align: right;
      }
      @media (max-width: 560px) {
        .ranking-history-topline,
        .ranking-history-footer {
          flex-direction: column;
          align-items: stretch;
        }
        .ranking-history-badges {
          justify-content: flex-start;
        }
        .ranking-history-footer span:last-child {
          text-align: left;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function normalizeName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  function candidates(raw) {
    const s = normalizeName(raw);
    const out = [s];
    if (s.endsWith('.')) out.push(s.slice(0, -1));
    else out.push(`${s}.`);
    return Array.from(new Set(out));
  }

  function drawerPlayerName() {
    const title = document.getElementById('drawerTitle');
    return title ? normalizeName(title.textContent) : '';
  }

  function seriesFor(playerName) {
    const d = data();
    if (!d || !d.seriesByPlayer || !playerName) return null;
    for (const c of candidates(playerName)) {
      if (d.seriesByPlayer[c]) return d.seriesByPlayer[c];
    }
    return null;
  }

  function pathFrom(points) {
    return points.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  }

  function render(series, history) {
    if (!series || series.length < 2) {
      return `<div class="ranking-history-card" id="${CARD_ID}"><h3>${text('title')}</h3><p>${text('empty')}</p></div>`;
    }

    const width = 620, height = 178;
    const left = 38, right = 16, top = 16, bottom = 28;
    const plotW = width - left - right;
    const plotH = height - top - bottom;
    const maxRank = Math.max(10, ...series.map(d => d.rank));

    const x = i => left + (series.length === 1 ? plotW : (i / (series.length - 1)) * plotW);
    const y = rank => top + ((rank - 1) / (maxRank - 1 || 1)) * plotH;

    const pts = series.map((d, i) => ({
      x: x(i), y: y(d.rank), rank: d.rank, points: d.points, matchId: d.matchId
    }));
    const line = pathFrom(pts);
    const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${(top + plotH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(top + plotH).toFixed(1)} Z`;

    const current = series[series.length - 1];
    const best = Math.min(...series.map(d => d.rank));
    const latest = history.snapshots && history.snapshots.length ? history.snapshots[history.snapshots.length - 1] : null;
    const latestLabel = latest ? latest.label : (history.lastMatchLabel || '');

    const gridRanks = Array.from(new Set([1, 10, 20, 30, 40, 50, maxRank].filter(r => r >= 1 && r <= maxRank))).sort((a,b) => a-b);
    const grid = gridRanks.map(r => {
      const yy = y(r);
      return `
        <line class="ranking-history-grid" x1="${left}" y1="${yy.toFixed(1)}" x2="${width - right}" y2="${yy.toFixed(1)}"></line>
        <text class="ranking-history-axis" x="${left - 8}" y="${(yy + 3).toFixed(1)}" text-anchor="end">#${r}</text>
      `;
    }).join('');

    const dots = pts.map((p, i) => {
      const snap = history.snapshots && history.snapshots[i] ? history.snapshots[i] : {};
      const cls = i === pts.length - 1 ? 'ranking-history-dot-end' : 'ranking-history-dot';
      const rr = i === pts.length - 1 ? 5.2 : 3.6;
      const tip = `${text('after')} ${snap.label || p.matchId}: #${p.rank}, ${p.points} ${text('points')}`;
      return `<circle class="${cls}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${rr}"><title>${tip}</title></circle>`;
    }).join('');

    return `
      <div class="ranking-history-card" id="${CARD_ID}">
        <div class="ranking-history-topline">
          <h3>${text('title')}</h3>
          <div class="ranking-history-badges">
            <span class="ranking-history-badge">${text('current')} <strong>#${current.rank}</strong></span>
            <span class="ranking-history-badge">${text('best')} <strong>#${best}</strong></span>
          </div>
        </div>
        <div class="ranking-history-chart-wrap">
          <svg class="ranking-history-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${text('title')}">
            ${grid}
            <text class="ranking-history-axis" x="${left}" y="${height - 8}" text-anchor="start">M1</text>
            <text class="ranking-history-axis" x="${width - right}" y="${height - 8}" text-anchor="end">M${series.length}</text>
            <path class="ranking-history-area" d="${area}"></path>
            <path class="ranking-history-line" d="${line}"></path>
            ${dots}
          </svg>
        </div>
        <div class="ranking-history-footer">
          <span>${text('latest')}: ${latestLabel || '—'}</span>
          <span>${text('updated')}: ${history.label || history.generatedAt || '—'}</span>
        </div>
      </div>
    `;
  }

  function update() {
    ensureStyle();
    const content = document.getElementById('drawerContent');
    if (!content) return;

    const player = drawerPlayerName();
    const history = data();
    const series = seriesFor(player);
    const lang = currentLang();
    if (!history || !series || !player) return;

    const existing = document.getElementById(CARD_ID);
    const version = String(history.label || history.generatedAt || '');
    if (existing && existing.dataset.player === player && existing.dataset.lang === lang && existing.dataset.version === version) {
      return;
    }

    const html = render(series, history);
    if (existing) existing.outerHTML = html;
    else content.insertAdjacentHTML('afterbegin', html);

    const card = document.getElementById(CARD_ID);
    if (card) {
      card.dataset.player = player;
      card.dataset.lang = lang;
      card.dataset.version = version;
    }
  }

  let scheduled = false;
  function schedule(delay) {
    if (scheduled && !delay) return;
    const run = () => {
      if (scheduled && !delay) scheduled = false;
      update();
    };
    if (delay) {
      setTimeout(update, delay);
      return;
    }
    scheduled = true;
    requestAnimationFrame(run);
  }

  function boot() {
    schedule();

    const content = document.getElementById('drawerContent');
    if (content) {
      const contentObserver = new MutationObserver(() => schedule());
      contentObserver.observe(content, { childList: true });
    }

    const drawer = document.getElementById('playerDrawer');
    if (drawer) {
      const drawerObserver = new MutationObserver(() => schedule());
      drawerObserver.observe(drawer, { attributes: true, attributeFilter: ['aria-hidden', 'class'] });
    }

    document.addEventListener('click', event => {
      if (event.target && event.target.closest && event.target.closest('tr[data-player]')) {
        schedule(0);
        schedule(80);
        schedule(180);
      }
      if (event.target && event.target.closest && event.target.closest('[data-lang]')) {
        schedule(0);
        schedule(80);
      }
    });

    document.addEventListener('keydown', event => {
      const row = event.target && event.target.closest && event.target.closest('tr[data-player]');
      if (row && (event.key === 'Enter' || event.key === ' ')) {
        schedule(0);
        schedule(80);
        schedule(180);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
