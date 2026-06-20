// Robust Pichichi / Golden Boot tab patch.
// Replace the existing pichichi_link_patch.js with this file.
// It does not require any index.html change.
(function () {
  'use strict';

  const LINK_ID = 'pichichiOddsLink';
  const STYLE_ID = 'porraTabsRobustPatchStyle';
  const PICHICHI_URL = 'https://oddspedia.com/insights/football/world-cup-2026-top-scorer-odds';

  const TEXT = {
    ca: { label: 'Pichichi', title: 'Odds del Pichichi' },
    es: { label: 'Pichichi', title: 'Odds del Pichichi' },
    en: { label: 'Golden Boot', title: 'Golden Boot odds' }
  };

  window.porraPatchLang = window.porraPatchLang || function () {
    const candidates = [];

    const activeButton = document.querySelector('.lang-btn.active, .lang-btn.is-active, .lang-btn[aria-pressed="true"]');
    if (activeButton && activeButton.dataset && activeButton.dataset.lang) candidates.push(activeButton.dataset.lang);
    if (window.PORRA_LANG) candidates.push(window.PORRA_LANG);
    if (document.documentElement.lang) candidates.push(document.documentElement.lang);

    try {
      ['porraLang', 'PORRA_LANG', 'lang', 'language', 'locale'].forEach(function (key) {
        const value = localStorage.getItem(key);
        if (value) candidates.push(value);
      });
    } catch (error) {}

    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('lang')) candidates.push(params.get('lang'));
    } catch (error) {}

    const raw = String(candidates.find(Boolean) || navigator.language || 'ca').toLowerCase();
    if (raw.startsWith('es') || raw.includes('spanish') || raw.includes('castell')) return 'es';
    if (raw.startsWith('en') || raw.includes('english') || raw.includes('angl')) return 'en';
    return 'ca';
  };

  function currentText() {
    return TEXT[window.porraPatchLang()] || TEXT.ca;
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .porra-links-v2 #pichichiOddsLink,
      .porra-links-v2 #porraOddsTabButton {
        appearance: none !important;
        border: 0 !important;
        border-bottom: 1px solid currentColor !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        color: var(--accent, #0b63f6) !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: .35rem !important;
        padding: 0 !important;
        font: inherit !important;
        font-size: .9rem !important;
        font-weight: 900 !important;
        line-height: inherit !important;
        white-space: nowrap !important;
        text-decoration: none !important;
        cursor: pointer !important;
        transform: none !important;
      }
      .porra-links-v2 #pichichiOddsLink:hover,
      .porra-links-v2 #pichichiOddsLink:focus-visible,
      .porra-links-v2 #porraOddsTabButton:hover,
      .porra-links-v2 #porraOddsTabButton:focus-visible {
        color: var(--navy, #061a36) !important;
        outline: none !important;
        box-shadow: none !important;
        transform: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function findNavAndLiveButton() {
    const nav =
      document.getElementById('porraLinksSummaryV2') ||
      document.querySelector('.porra-links-v2--summary') ||
      document.querySelector('.porra-links-v2');

    if (nav) {
      const live =
        nav.querySelector('[data-porra-modal-v2="liveLeaderboard"]') ||
        Array.from(nav.querySelectorAll('button,a')).find(function (el) {
          return /classificaci[o\u00f3]\s+en\s+directe|clasificaci[o\u00f3]n\s+en\s+directo|live\s+standings|directe|directo|live/i.test(el.textContent || '');
        });
      return { nav: nav, live: live };
    }

    const live = Array.from(document.querySelectorAll('button,a')).find(function (el) {
      return /classificaci[o\u00f3]\s+en\s+directe|clasificaci[o\u00f3]n\s+en\s+directo|live\s+standings|directe|directo|live/i.test(el.textContent || '');
    });
    return { nav: live ? live.parentElement : null, live: live };
  }

  function addOrUpdatePichichiTab() {
    const found = findNavAndLiveButton();
    if (!found.nav) return false;

    ensureStyle();

    let link = document.getElementById(LINK_ID);
    if (!link) {
      link = document.createElement('a');
      link.id = LINK_ID;
      link.href = PICHICHI_URL;
      link.target = '_blank';
      link.rel = 'noopener';
      link.className = 'porra-tab-patch porra-pichichi-link';
    }

    const text = currentText();
    link.textContent = text.label;
    link.title = text.title;
    link.setAttribute('aria-label', text.title);

    if (link.parentElement !== found.nav) {
      if (found.live && found.live.parentElement === found.nav) {
        found.nav.insertBefore(link, found.live);
      } else {
        found.nav.appendChild(link);
      }
    }

    return true;
  }

  function start() {
    addOrUpdatePichichiTab();

    const observer = new MutationObserver(addOrUpdatePichichiTab);
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });

    setInterval(addOrUpdatePichichiTab, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
