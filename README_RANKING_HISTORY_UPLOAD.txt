Ranking history drawer chart package
===================================

Upload these files only. Do NOT replace index.html.

Files to upload at repo root:
- ranking_history_latest.js
- ranking_history_drawer_patch.js

Optional archive files:
- ranking_history/ranking_history_2026-06-17_1857.js
- ranking_history/ranking_history_2026-06-17_1857.json

Then add only these two lines to the <head> of your existing index.html:

<script src="ranking_history_latest.js"></script>
<script src="ranking_history_drawer_patch.js" defer></script>

What it does:
- ranking_history_latest.js contains precomputed ranking history.
- The browser does not recompute rankings on page load.
- ranking_history_drawer_patch.js inserts a small SVG line chart at the top of the player drawer.
- It shows rank 1 at the top and the current/latest rank at the end.

Current generated file:
- snapshots: 20 completed matches
- players: 57
- generatedAt: 2026-06-17T18:57:02Z
