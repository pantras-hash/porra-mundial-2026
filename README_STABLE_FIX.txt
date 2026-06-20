STABLE FIX - 2026-06-20

Upload these files to the root of the GitHub repo, replacing the existing files:

- index.html
- porra_extras_v2.js
- porra_extras_v2.css
- odds_leaderboard_patch.js
- ranking_history_drawer_patch.js
- pichichi_link_patch.js
- odds_tab_patch.js

What this fixes:
1. Pichichi and Win Probability tabs are now created inside porra_extras_v2.js, together with the other tabs.
2. pichichi_link_patch.js and odds_tab_patch.js are no longer used by index.html; they remain harmless no-op files.
3. index.html now loads optional enhancement scripts through the same cache-busting dynamic loader as the main app.
4. odds_leaderboard_patch.js no longer observes the whole page, so it cannot retrigger itself forever.
5. ranking_history_drawer_patch.js no longer observes the whole page or replaces its own card forever.

After upload:
- Commit to main.
- Wait for the GitHub Pages deploy to finish.
- On phone, clear website data for pantras-hash.github.io or open a private/incognito tab once.
