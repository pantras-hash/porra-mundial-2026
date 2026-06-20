// Adds the external Pichichi / Golden Boot tab.
// Safe patch: no index.html replacement.
// Add this line to the current live index.html, near the bottom before </body>:
// <script src="pichichi_link_patch.js" defer></script>
(function () {
  const LINK_ID = "pichichiOddsLink";
  const PICHICHI_URL = "https://oddspedia.com/insights/football/world-cup-2026-top-scorer-odds";

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
    ca: { label: "Pichichi", title: "Odds del Pichichi" },
    es: { label: "Pichichi", title: "Odds del Pichichi" },
    en: { label: "Golden Boot", title: "Golden Boot odds" }
  };

  function t() {
    return TEXT[window.porraPatchLang()] || TEXT.ca;
  }

  function ensureStyle() {
    if (document.getElementById("pichichiLinkPatchStyle")) return;
    const style = document.createElement("style");
    style.id = "pichichiLinkPatchStyle";
    style.textContent = `
      .porra-pichichi-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: .65rem 1rem;
        border-radius: 999px;
        border: 1px solid rgba(15, 23, 42, .14);
        background: #fff;
        color: inherit;
        text-decoration: none;
        font: inherit;
        font-weight: 700;
        white-space: nowrap;
      }
      .porra-pichichi-link:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 20px rgba(15, 23, 42, .10);
      }
    `;
    document.head.appendChild(style);
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

  function addPichichiTab() {
    const found = findNavAndLiveButton();
    if (!found.nav) return false;

    ensureStyle();

    let link = document.getElementById(LINK_ID);
    if (!link) {
      link = document.createElement("a");
      link.id = LINK_ID;
      link.href = PICHICHI_URL;
      link.target = "_blank";
      link.rel = "noopener";
      link.className = found.live && found.live.className ? found.live.className : "porra-pichichi-link";
      link.classList.add("porra-pichichi-link");

      // Place immediately before "Classificació en directe".
      if (found.live && found.live.parentElement === found.nav) {
        found.nav.insertBefore(link, found.live);
      } else {
        found.nav.appendChild(link);
      }
    }

    link.textContent = t().label;
    link.title = t().title;
    return true;
  }

  const timer = setInterval(function () {
    if (addPichichiTab()) clearInterval(timer);
  }, 200);

  setTimeout(function () {
    clearInterval(timer);
    addPichichiTab();
  }, 12000);

  // If the site changes language after load, this quietly refreshes the label.
  setInterval(function () {
    const link = document.getElementById(LINK_ID);
    if (link) {
      link.textContent = t().label;
      link.title = t().title;
    }
  }, 1000);
})();
