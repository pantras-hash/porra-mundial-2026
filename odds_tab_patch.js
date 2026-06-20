// Adds a full odds/probabilities leaderboard tab.
// Safe patch: no index.html replacement. Add one script tag to current index.html:
// <script src="odds_tab_patch.js" defer></script>
(function () {
  const TAB_ID = "porraOddsTabButton";
  const MODAL_ID = "porraOddsModal";
  const STYLE_ID = "porraOddsTabStyle";
  function porraLang() {
  const raw =
    (document.documentElement.lang ||
      window.PORRA_LANG ||
      localStorage.g:contentReference[oaicite:0]{index=0}ator.language ||
      "ca").toLowerCase();

  if (raw.startsWith("es")) return "es";
  if (raw.startsWith("en")) return "en";
  return "ca";
}

const PORRA_TEXT = {
  ca: {
    oddsTab: "Probabilitats",
    oddsTitle: "Probabilitats de guanyar",
    loading: "Monte Carlo · carregant dades…",
    footer: "Win % / Top 3 % són probabilitats simulades. Pich pts són punts esperats dels bonus de Pichichi."
  },
  es: {
    oddsTab: "Probabilidad",
    oddsTitle: "Probabilidad de ganar",
    loading: "Monte Carlo · cargando datos…",
    footer: "Win % / Top 3 % son probabilidades simuladas. Pich pts son puntos esperados de los bonus de Pichichi."
  },
  en: {
    oddsTab: "Win probability",
    oddsTitle: "Win probability",
    loading: "Monte Carlo · loading data…",
    footer: "Win % / Top 3 % are simulated probabilities. Pich pts are expected points from Golden Boot bonuses."
  }
};

const T = PORRA_TEXT[porraLang()];
const TAB_LABEL = T.oddsTab;

  function getOddsData() {
    return window.PORRA_ODDS_LATEST || null;
  }

  function getRows() {
    const data = getOddsData();
    return data && Array.isArray(data.players) ? data.players.slice() : [];
  }

  function pct(value) {
    const n = Number(value || 0);
    return n.toFixed(2) + "%";
  }

  function pts(value) {
    const n = Number(value || 0);
    return n.toFixed(1);
  }

  function pichPts(value) {
    const n = Number(value || 0);
    return n.toFixed(2);
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .porra-odds-tab-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: .35rem;
        padding: .65rem 1rem;
        border-radius: 999px;
        border: 1px solid rgba(15, 23, 42, .14);
        background: #fff;
        color: inherit;
        text-decoration: none;
        font: inherit;
        font-weight: 700;
        white-space: nowrap;
        cursor: pointer;
      }
      .porra-odds-tab-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 20px rgba(15, 23, 42, .10);
      }
      .porra-odds-modal {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: none;
        background: rgba(15, 23, 42, .56);
        padding: 1rem;
      }
      .porra-odds-modal[aria-hidden="false"] {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .porra-odds-panel {
        width: min(1120px, 100%);
        max-height: min(88vh, 980px);
        overflow: hidden;
        border-radius: 24px;
        background: #fff;
        box-shadow: 0 28px 90px rgba(15, 23, 42, .32);
        border: 1px solid rgba(15, 23, 42, .10);
        display: flex;
        flex-direction: column;
      }
      .porra-odds-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.1rem 1.2rem .9rem;
        background: linear-gradient(135deg, #14213d, #23395d);
        color: white;
      }
      .porra-odds-title {
        margin: 0;
        font-size: clamp(1.25rem, 3.2vw, 1.8rem);
        line-height: 1.1;
      }
      .porra-odds-subtitle {
        margin: .35rem 0 0;
        color: rgba(255,255,255,.82);
        font-size: .92rem;
      }
      .porra-odds-close {
        border: 0;
        border-radius: 999px;
        width: 2.3rem;
        height: 2.3rem;
        font-size: 1.35rem;
        line-height: 1;
        cursor: pointer;
        background: rgba(255,255,255,.16);
        color: white;
      }
      .porra-odds-body {
        overflow: auto;
        padding: .85rem;
      }
      .porra-odds-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0 .35rem;
        font-size: .95rem;
      }
      .porra-odds-table th {
        position: sticky;
        top: 0;
        z-index: 1;
        background: #f8fafc;
        color: #1e293b;
        text-align: left;
        padding: .7rem .6rem;
        border-bottom: 1px solid #e2e8f0;
        white-space: nowrap;
      }
      .porra-odds-table th.num,
      .porra-odds-table td.num {
        text-align: right;
      }
      .porra-odds-table td {
        padding: .66rem .6rem;
        background: #fff;
        border-top: 1px solid #eef2f7;
        border-bottom: 1px solid #eef2f7;
        white-space: nowrap;
      }
      .porra-odds-table td:first-child {
        border-left: 1px solid #eef2f7;
        border-radius: 14px 0 0 14px;
      }
      .porra-odds-table td:last-child {
        border-right: 1px solid #eef2f7;
        border-radius: 0 14px 14px 0;
      }
      .porra-odds-table tr:nth-child(-n+3) td {
        background: #fffbeb;
      }
      .porra-odds-rank {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2.05rem;
        height: 2.05rem;
        border-radius: .75rem;
        background: #e2e8f0;
        font-weight: 800;
      }
      .porra-odds-table tr:nth-child(-n+3) .porra-odds-rank {
        background: #fcd34d;
      }
      .porra-odds-player {
        font-weight: 750;
        color: #0f172a;
      }
      .porra-odds-win {
        font-weight: 800;
        color: #0f172a;
      }
      .porra-odds-pich {
        color: #15803d;
        font-weight: 700;
      }
      .porra-odds-footer {
        padding: .15rem 1.2rem 1rem;
        color: #64748b;
        font-size: .86rem;
      }
      @media (max-width: 700px) {
        .porra-odds-modal { padding: .55rem; }
        .porra-odds-panel { max-height: 92vh; border-radius: 18px; }
        .porra-odds-body { padding: .45rem; }
        .porra-odds-table { font-size: .82rem; }
        .porra-odds-table th,
        .porra-odds-table td { padding: .55rem .42rem; }
        .porra-odds-optional { display: none; }
      }
    `;
    document.head.appendChild(style);
  }

  function createModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    ensureStyle();

    modal = document.createElement("div");
    modal.id = MODAL_ID;
    modal.className = "porra-odds-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="porra-odds-panel" role="dialog" aria-modal="true" aria-labelledby="porraOddsTitle">
        <div class="porra-odds-header">
          <div>
           <h2 class="porra-odds-title" id="porraOddsTitle">${esc(T.oddsTitle)}</h2>
           <p class="porra-odds-subtitle" id="porraOddsSubtitle">${esc(T.loading)}</p>
          </div>
          <button class="porra-odds-close" type="button" aria-label="Tancar">×</button>
        </div>
        <div class="porra-odds-body">
          <table class="porra-odds-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Participant</th>
                <th class="num">Win %</th>
                <th class="num">Top 3 %</th>
                <th class="num porra-odds-optional">Avg pts</th>
                <th class="num porra-odds-optional">Pich pts</th>
              </tr>
            </thead>
            <tbody id="porraOddsTableBody">
              <tr><td colspan="6">Carregant…</td></tr>
            </tbody>
          </table>
        </div>
        <div class="porra-odds-footer">
          ${esc(T.footer)}
        </div>
      </div>
    `;

    modal.querySelector(".porra-odds-close").addEventListener("click", closeModal);
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeModal();
    });

    document.body.appendChild(modal);
    return modal;
  }

  function renderTable() {
    const data = getOddsData();
    const rows = getRows().sort(function (a, b) {
      return Number(a.rank || 9999) - Number(b.rank || 9999);
    });
    const body = document.getElementById("porraOddsTableBody");
    const subtitle = document.getElementById("porraOddsSubtitle");

    if (subtitle) {
      if (data) {
        subtitle.textContent = `${data.simulations || ""} simulacions · ${data.label || data.generatedAt || ""}`;
      } else {
        subtitle.textContent = "No s'ha trobat odds_latest.js";
      }
    }

    if (!body) return;

    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="6">No s'han trobat probabilitats. Comprova que odds_latest.js estigui carregat.</td></tr>`;
      return;
    }

    body.innerHTML = rows.map(function (row, idx) {
      const rank = row.rank || (idx + 1);
      const name = row.player || row.displayName || "";
      return `
        <tr>
          <td><span class="porra-odds-rank">${esc(rank)}</span></td>
          <td class="porra-odds-player">${esc(name)}</td>
          <td class="num porra-odds-win">${pct(row.winPct)}</td>
          <td class="num">${pct(row.top3Pct)}</td>
          <td class="num porra-odds-optional">${pts(row.avgPoints)}</td>
          <td class="num porra-odds-optional porra-odds-pich">${pichPts(row.pichichiExpPoints)}</td>
        </tr>
      `;
    }).join("");
  }

  function openModal() {
    const modal = createModal();
    renderTable();
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function findNavAndLiveButton() {
    const nav = document.getElementById("porraLinksSummaryV2");
    if (nav) {
      const live = nav.querySelector('[data-porra-modal-v2="liveLeaderboard"]') ||
        Array.from(nav.querySelectorAll("button,a")).find(el => /directe/i.test(el.textContent || ""));
      return { nav, live };
    }

    const live = Array.from(document.querySelectorAll("button,a")).find(el =>
      /classificaci[oó]\s+en\s+directe|directe/i.test(el.textContent || "")
    );
    return { nav: live ? live.parentElement : null, live };
  }

  function addTab() {
    if (document.getElementById(TAB_ID)) return true;

    const found = findNavAndLiveButton();
    if (!found.nav) return false;

    ensureStyle();

    const btn = document.createElement("button");
    btn.id = TAB_ID;
    btn.type = "button";
    btn.textContent = TAB_LABEL;
    btn.className = found.live && found.live.className ? found.live.className : "porra-odds-tab-button";
    btn.classList.add("porra-odds-tab-button");
    btn.addEventListener("click", openModal);

    if (found.live && found.live.parentElement === found.nav && found.live.nextSibling) {
      found.nav.insertBefore(btn, found.live.nextSibling);
    } else if (found.live && found.live.parentElement === found.nav) {
      found.nav.appendChild(btn);
    } else {
      found.nav.appendChild(btn);
    }

    return true;
  }

  const timer = setInterval(function () {
    if (addTab()) clearInterval(timer);
  }, 200);

  setTimeout(function () {
    clearInterval(timer);
    addTab();
  }, 12000);
})();
