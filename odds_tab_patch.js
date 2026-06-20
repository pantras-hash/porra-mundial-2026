// Adds a full odds/probabilities leaderboard tab.
// Safe patch: no index.html replacement.
// Add this line to the current live index.html, near the bottom before </body>:
// <script src="odds_tab_patch.js" defer></script>
(function () {
  const TAB_ID = "porraOddsTabButton";
  const MODAL_ID = "porraOddsModal";
  const STYLE_ID = "porraOddsTabStyle";

  window.porraPatchLang = window.porraPatchLang || function () {
    const candidates = [];

    if (window.PORRA_LANG) candidates.push(window.PORRA_LANG);
    if (document.documentElement.lang) candidates.push(document.documentElement.lang);

    try {
      const keys = ["porraLang", "PORRA_LANG", "lang", "language", "locale"];
      keys.forEach(function (key) {
        const value = localStorage.getItem(key);
        if (value) candidates.push(value);
      });
    } catch (error) {}

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("lang")) candidates.push(params.get("lang"));
    } catch (error) {}

    const raw = String(candidates.find(Boolean) || navigator.language || "ca").toLowerCase();

    if (raw.startsWith("es") || raw.includes("spanish") || raw.includes("castell")) return "es";
    if (raw.startsWith("en") || raw.includes("english") || raw.includes("angl")) return "en";
    return "ca";
  };

  const TEXT = {
    ca: {
      tab: "Probabilitats de guanyar",
      title: "Probabilitats de guanyar",
      loading: "Monte Carlo · carregant dades…",
      missing: "No s'han trobat probabilitats. Comprova que odds_latest.js estigui carregat.",
      footer: "Win % / Top 3 % són probabilitats simulades. Pich pts són punts esperats dels bonus de Pichichi.",
      columns: {
        participant: "Participant",
        win: "Win %",
        top3: "Top 3 %",
        avg: "Avg pts",
        pich: "Pich pts"
      }
    },
    es: {
      tab: "Probabilidad de ganar",
      title: "Probabilidad de ganar",
      loading: "Monte Carlo · cargando datos…",
      missing: "No se han encontrado probabilidades. Comprueba que odds_latest.js esté cargado.",
      footer: "Win % / Top 3 % son probabilidades simuladas. Pich pts son puntos esperados de los bonus de Pichichi.",
      columns: {
        participant: "Participante",
        win: "Win %",
        top3: "Top 3 %",
        avg: "Pts prom.",
        pich: "Pts Pich."
      }
    },
    en: {
      tab: "Win probability",
      title: "Win probability",
      loading: "Monte Carlo · loading data…",
      missing: "No probabilities found. Check that odds_latest.js is loaded.",
      footer: "Win % / Top 3 % are simulated probabilities. Pich pts are expected points from Golden Boot bonuses.",
      columns: {
        participant: "Player",
        win: "Win %",
        top3: "Top 3 %",
        avg: "Avg pts",
        pich: "Boot pts"
      }
    }
  };

  function t() {
    return TEXT[window.porraPatchLang()] || TEXT.ca;
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getOddsData() {
    return window.PORRA_ODDS_LATEST || null;
  }

  function getRows() {
    const data = getOddsData();

    // Current generated format.
    if (data && Array.isArray(data.players)) return data.players.slice();

    // Fallbacks in case the generated object uses a different key.
    if (data && Array.isArray(data.rows)) return data.rows.slice();
    if (data && Array.isArray(data.data)) return data.data.slice();

    return [];
  }

  function val(row, keys, fallback) {
    for (const key of keys) {
      if (row && row[key] != null) return row[key];
    }
    return fallback;
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

  function updateText() {
    const text = t();

    const btn = document.getElementById(TAB_ID);
    if (btn) btn.textContent = text.tab;

    const title = document.getElementById("porraOddsTitle");
    if (title) title.textContent = text.title;

    const footer = document.getElementById("porraOddsFooter");
    if (footer) footer.textContent = text.footer;

    const colParticipant = document.getElementById("porraOddsColParticipant");
    const colWin = document.getElementById("porraOddsColWin");
    const colTop3 = document.getElementById("porraOddsColTop3");
    const colAvg = document.getElementById("porraOddsColAvg");
    const colPich = document.getElementById("porraOddsColPich");

    if (colParticipant) colParticipant.textContent = text.columns.participant;
    if (colWin) colWin.textContent = text.columns.win;
    if (colTop3) colTop3.textContent = text.columns.top3;
    if (colAvg) colAvg.textContent = text.columns.avg;
    if (colPich) colPich.textContent = text.columns.pich;
  }

  function createModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    ensureStyle();
    const text = t();

    modal = document.createElement("div");
    modal.id = MODAL_ID;
    modal.className = "porra-odds-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="porra-odds-panel" role="dialog" aria-modal="true" aria-labelledby="porraOddsTitle">
        <div class="porra-odds-header">
          <div>
            <h2 class="porra-odds-title" id="porraOddsTitle">${esc(text.title)}</h2>
            <p class="porra-odds-subtitle" id="porraOddsSubtitle">${esc(text.loading)}</p>
          </div>
          <button class="porra-odds-close" type="button" aria-label="Tancar">×</button>
        </div>
        <div class="porra-odds-body">
          <table class="porra-odds-table">
            <thead>
              <tr>
                <th>#</th>
                <th id="porraOddsColParticipant">${esc(text.columns.participant)}</th>
                <th id="porraOddsColWin" class="num">${esc(text.columns.win)}</th>
                <th id="porraOddsColTop3" class="num">${esc(text.columns.top3)}</th>
                <th id="porraOddsColAvg" class="num porra-odds-optional">${esc(text.columns.avg)}</th>
                <th id="porraOddsColPich" class="num porra-odds-optional">${esc(text.columns.pich)}</th>
              </tr>
            </thead>
            <tbody id="porraOddsTableBody">
              <tr><td colspan="6">${esc(text.loading)}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="porra-odds-footer" id="porraOddsFooter">${esc(text.footer)}</div>
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
    const text = t();
    const data = getOddsData();
    const rows = getRows().sort(function (a, b) {
      return Number(val(a, ["rank", "Rank"], 9999)) - Number(val(b, ["rank", "Rank"], 9999));
    });
    const body = document.getElementById("porraOddsTableBody");
    const subtitle = document.getElementById("porraOddsSubtitle");

    updateText();

    if (subtitle) {
      if (data) {
        const sim = data.simulations || data.nSims || data.num_simulations || "";
        const label = data.label || data.generatedAt || data.timestamp || "";
        subtitle.textContent = [sim ? `${sim} simulacions` : "Monte Carlo", label].filter(Boolean).join(" · ");
      } else {
        subtitle.textContent = text.missing;
      }
    }

    if (!body) return;

    if (!rows.length) {
      body.innerHTML = `<tr><td colspan="6">${esc(text.missing)}</td></tr>`;
      return;
    }

    body.innerHTML = rows.map(function (row, idx) {
      const rank = val(row, ["rank", "Rank"], idx + 1);
      const name = val(row, ["player", "Player", "displayName", "name"], "");
      const winPct = val(row, ["winPct", "WinPct", "win_pct"], 0);
      const top3Pct = val(row, ["top3Pct", "Top3Pct", "top3_pct"], 0);
      const avgPoints = val(row, ["avgPoints", "AvgPoints", "avg_points"], 0);
      const pichPtsValue = val(row, ["pichichiExpPoints", "PichichiExpPoints", "pichichi_exp_points"], 0);

      return `
        <tr>
          <td><span class="porra-odds-rank">${esc(rank)}</span></td>
          <td class="porra-odds-player">${esc(name)}</td>
          <td class="num porra-odds-win">${pct(winPct)}</td>
          <td class="num">${pct(top3Pct)}</td>
          <td class="num porra-odds-optional">${pts(avgPoints)}</td>
          <td class="num porra-odds-optional porra-odds-pich">${pichPts(pichPtsValue)}</td>
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
      const live =
        nav.querySelector('[data-porra-modal-v2="liveLeaderboard"]') ||
        Array.from(nav.querySelectorAll("button,a")).find(function (el) {
          return /classificaci[oó]\s+en\s+directe|clasificaci[oó]n\s+en\s+directo|live\s+standings|directe|directo|live/i.test(el.textContent || "");
        });
      return { nav, live };
    }

    const live = Array.from(document.querySelectorAll("button,a")).find(function (el) {
      return /classificaci[oó]\s+en\s+directe|clasificaci[oó]n\s+en\s+directo|live\s+standings|directe|directo|live/i.test(el.textContent || "");
    });

    return { nav: live ? live.parentElement : null, live };
  }

  function addTab() {
    const found = findNavAndLiveButton();
    if (!found.nav) return false;

    ensureStyle();

    let btn = document.getElementById(TAB_ID);
    if (!btn) {
      btn = document.createElement("button");
      btn.id = TAB_ID;
      btn.type = "button";
      btn.className = found.live && found.live.className ? found.live.className : "porra-odds-tab-button";
      btn.classList.add("porra-odds-tab-button");
      btn.addEventListener("click", openModal);

      // Place immediately to the right of "Classificació en directe".
      if (found.live && found.live.parentElement === found.nav && found.live.nextSibling) {
        found.nav.insertBefore(btn, found.live.nextSibling);
      } else if (found.live && found.live.parentElement === found.nav) {
        found.nav.appendChild(btn);
      } else {
        found.nav.appendChild(btn);
      }
    }

    updateText();
    return true;
  }

  const timer = setInterval(function () {
    if (addTab()) clearInterval(timer);
  }, 200);

  setTimeout(function () {
    clearInterval(timer);
    addTab();
  }, 12000);

  // If the site changes language after load, this quietly refreshes labels.
  setInterval(function () {
    if (document.getElementById(TAB_ID)) {
      updateText();
    }
  }, 1000);
})();
