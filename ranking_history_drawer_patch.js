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
        source: 'Historial reconstruït a partir dels resultats oficials actuals.'
      },
      es: {
        title: 'Evolución de la posición',
        empty: 'Todavía no hay suficiente historial para mostrar el gráfico.',
        best: 'Mejor',
        current: 'Actual',
        points: 'puntos',
        after: 'después de',
        source: 'Historial reconstruido a partir de los resultados oficiales actuales.'
      },
      en: {
        title: 'Position over time',
        empty: 'Not enough history yet to show the chart.',
        best: 'Best',
        current: 'Current',
        points: 'points',
        after: 'after',
        source: 'History reconstructed from the current official results.'
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
        border: 1px solid rgba(148, 163, 184, 0.28);
        border-radius: 16px;
        padding: 14px 14px 10px;
        margin: 0 0 18px;
        background: rgba(15, 23, 42, 0.035);
      }
      .ranking-history-card h3 {
        margin: 0 0 8px;
        font-size: 1rem;
      }
      .ranking-history-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 14px;
        margin: 8px 0 0;
        font-size: 0.82rem;
        opacity: 0.8;
      }
      .ranking-history-chart {
        width: 100%;
        max-width: 100%;
        height: auto;
        display: block;
      }
      .ranking-history-line {
        fill: none;
        stroke: currentColor;
        stroke-width: 2.5;
        vector-effect: non-scaling-stroke;
      }
      .ranking-history-dot {
        fill: currentColor;
      }
      .ranking-history-axis,
      .ranking-history-grid {
        stroke: currentColor;
        opacity: 0.18;
        stroke-width: 1;
        vector-effect: non-scaling-stroke;
      }
      .ranking-history-label {
        fill: currentColor;
        opacity: 0.72;
        font-size: 11px;
      }
      .ranking-history-empty {
        margin: 0;
        opacity: 0.75;
        font-size: 0.9rem;
      }
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function playerName() {
    const title = document.getElementById('drawerTitle');
    return title ? title.textContent.trim() : '';
  }

  function seriesFor(name) {
    const d = data();
    if (!d || !d.seriesByPlayer) return [];
    return d.seriesByPlayer[name] || [];
  }

  function snapshotFor(x) {
    const d = data();
    return d && Array.isArray(d.snapshots) ? d.snapshots[x] : null;
  }

  function makeChart(series) {
    const width = 620, height = 170;
    const left = 34, right = 12, top = 16, bottom = 28;
    const innerW = width - left - right;
    const innerH = height - top - bottom;
    const maxRank = Math.max(1, ...series.map(p => p.rank));
    const maxX = Math.max(1, series.length - 1);

    function sx(x) { return left + (x / maxX) * innerW; }
    function sy(rank) {
      if (maxRank <= 1) return top + innerH / 2;
      return top + ((rank - 1) / (maxRank - 1)) * innerH;
    }

    const points = series.map(p => `${sx(p.x).toFixed(1)},${sy(p.rank).toFixed(1)}`).join(' ');
    const last = series[series.length - 1];
    const best = Math.min(...series.map(p => p.rank));
    const firstSnap = snapshotFor(series[0].x);
    const lastSnap = snapshotFor(last.x);

    const dots = series.map((p, i) => {
      const snap = snapshotFor(p.x);
      const show = i === 0 || i === series.length - 1 || p.rank === best;
      if (!show) return '';
      const title = snap ? `${snap.label}: #${p.rank}, ${p.points} ${text('points')}` : `#${p.rank}`;
      return `<circle class="ranking-history-dot" cx="${sx(p.x).toFixed(1)}" cy="${sy(p.rank).toFixed(1)}" r="3.5"><title>${escapeHtml(title)}</title></circle>`;
    }).join('');

    return `
      <svg class="ranking-history-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(text('title'))}">
        <line class="ranking-history-axis" x1="${left}" y1="${top}" x2="${left}" y2="${top + innerH}" />
        <line class="ranking-history-axis" x1="${left}" y1="${top + innerH}" x2="${left + innerW}" y2="${top + innerH}" />
        <line class="ranking-history-grid" x1="${left}" y1="${top}" x2="${left + innerW}" y2="${top}" />
        <text class="ranking-history-label" x="${left - 8}" y="${top + 4}" text-anchor="end">#1</text>
        <text class="ranking-history-label" x="${left - 8}" y="${top + innerH + 4}" text-anchor="end">#${maxRank}</text>
        <polyline class="ranking-history-line" points="${points}"></polyline>
        ${dots}
        <text class="ranking-history-label" x="${left}" y="${height - 8}" text-anchor="start">${escapeHtml(firstSnap ? firstSnap.matchId : '')}</text>
        <text class="ranking-history-label" x="${left + innerW}" y="${height - 8}" text-anchor="end">${escapeHtml(lastSnap ? lastSnap.matchId : '')}</text>
      </svg>
      <div class="ranking-history-meta">
        <span>${escapeHtml(text('best'))}: #${best}</span>
        <span>${escapeHtml(text('current'))}: #${last.rank}</span>
        <span>${escapeHtml(last.points)} ${escapeHtml(text('points'))}</span>
        ${lastSnap ? `<span>${escapeHtml(text('after'))} ${escapeHtml(lastSnap.matchId)}</span>` : ''}
      </div>
    `;
  }

  function renderCard() {
    ensureStyle();
    const content = document.getElementById('drawerContent');
    if (!content) return;

    const name = playerName();
    if (!name) return;

    const old = document.getElementById(CARD_ID);
    if (old) old.remove();

    const series = seriesFor(name);
    if (!series || series.length < 2) return;

    const card = document.createElement('section');
    card.id = CARD_ID;
    card.className = 'ranking-history-card';
    card.innerHTML = `
      <h3>${escapeHtml(text('title'))}</h3>
      ${series.length >= 2 ? makeChart(series) : `<p class="ranking-history-empty">${escapeHtml(text('empty'))}</p>`}
      <div class="ranking-history-meta"><span>${escapeHtml(text('source'))}</span></div>
    `;
    content.insertBefore(card, content.firstChild);
  }

  let scheduled = false;
  function scheduleRender() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      renderCard();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleRender);
  } else {
    scheduleRender();
  }

  const drawerContent = () => document.getElementById('drawerContent');
  const observer = new MutationObserver(scheduleRender);
  const start = () => {
    const node = drawerContent();
    if (node) observer.observe(node, { childList: true, subtree: false });
  };
  start();
  document.addEventListener('click', event => {
    if (event.target && event.target.closest && event.target.closest('tr[data-player]')) {
      setTimeout(scheduleRender, 0);
    }
    if (event.target && event.target.closest && event.target.closest('[data-lang]')) {
      setTimeout(scheduleRender, 0);
    }
  });
})();
