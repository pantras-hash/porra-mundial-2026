(function () {
  'use strict';

  const PICHICHI_URL = 'https://oddspedia.com/insights/football/world-cup-2026-top-scorer-odds';
  const LINK_ID = 'porraPichichiExternalLink';

  function installStyle() {
    if (document.getElementById('porraPichichiExternalStyle')) return;
    const style = document.createElement('style');
    style.id = 'porraPichichiExternalStyle';
    style.textContent = `
      .porra-links-v2 a.porra-pichichi-link-v2 {
        border-bottom: 1px solid currentColor;
        color: var(--accent, #0b63f6);
        font: inherit;
        font-size: .9rem;
        font-weight: 900;
        padding: 0;
        text-decoration: none;
      }
      .porra-links-v2 a.porra-pichichi-link-v2:hover,
      .porra-links-v2 a.porra-pichichi-link-v2:focus-visible {
        color: var(--navy, #061a36);
        outline: none;
      }
    `;
    document.head.appendChild(style);
  }

  function ensurePichichiLink() {
    installStyle();

    const summaryLinks = document.getElementById('porraLinksSummaryV2');
    if (!summaryLinks) return false;

    let link = document.getElementById(LINK_ID);
    if (!link) {
      link = document.createElement('a');
      link.id = LINK_ID;
      link.className = 'porra-pichichi-link-v2';
      link.href = PICHICHI_URL;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = 'Pichichi';
      link.setAttribute('aria-label', 'Pichichi odds, external link');
    }

    const liveButton = summaryLinks.querySelector('[data-porra-modal-v2="liveLeaderboard"]');
    if (liveButton && link.nextElementSibling !== liveButton) {
      summaryLinks.insertBefore(link, liveButton);
    } else if (!link.parentNode) {
      summaryLinks.appendChild(link);
    }

    return true;
  }

  function start() {
    if (ensurePichichiLink()) return;

    const observer = new MutationObserver(function () {
      if (ensurePichichiLink()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
