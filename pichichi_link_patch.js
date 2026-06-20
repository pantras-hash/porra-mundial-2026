// Safe Pichichi / Golden Boot tab patch.
// Replace pichichi_link_patch.js with this file.
// No index.html change required.
(function () {
  'use strict';

  const BUTTON_ID = 'pichichiOddsLink';
  const PICHICHI_URL = 'https://oddspedia.com/insights/football/world-cup-2026-top-scorer-odds';
  const TEXT = {
    ca: { label: 'Pichichi', title: 'Odds del Pichichi' },
    es: { label: 'Pichichi', title: 'Odds del Pichichi' },
    en: { label: 'Golden Boot', title: 'Golden Boot odds' }
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

  function label() {
    return TEXT[getLang()] || TEXT.ca;
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

  function updateButtonText(button) {
    const text = label();
    if (button.textContent !== text.label) button.textContent = text.label;
    if (button.title !== text.title) button.title = text.title;
    if (button.getAttribute('aria-label') !== text.title) button.setAttribute('aria-label', text.title);
  }

  function addOrUpdateTab() {
    const nav = findSummaryNav();
    if (!nav) return false;

    let button = document.getElementById(BUTTON_ID);
    if (!button) {
      button = document.createElement('button');
      button.id = BUTTON_ID;
      button.type = 'button';
      button.setAttribute('data-porra-extra-tab', 'pichichi');
      button.addEventListener('click', function () {
        window.open(PICHICHI_URL, '_blank', 'noopener');
      });
    }

    updateButtonText(button);

    if (button.parentElement !== nav) {
      const liveButton = findLiveButton(nav);
      if (liveButton && liveButton.parentElement === nav) {
        nav.insertBefore(button, liveButton);
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
        setTimeout(addOrUpdateTab, 0);
        setTimeout(addOrUpdateTab, 100);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
