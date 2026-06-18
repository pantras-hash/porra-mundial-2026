Ranking history manual update + automation package
=================================================

No index.html is included.

Upload/replace these files:

1. ranking_history_latest.js
   - Manual one-time update through the latest finished match in current resultats.js.

2. ranking_history_drawer_patch.js
   - Beautified version of the player-drawer graph.

3. scripts/generate_ranking_history.py
   - Rebuilds ranking_history_latest.js from resultats.js and monte_carlo_data.json.

4. monte_carlo_data.json
   - Static prediction/scoring data used by the ranking-history generator.

5. .github/workflows/ranking-history.yml
   - Lets you manually regenerate ranking history from GitHub Actions.
   - Also runs after manual pushes to resultats.js / prediccions.js / generator/data files.

6. .github/workflows/api-football-results.yml
   - Patched copy of your existing API update workflow.
   - It regenerates ranking_history_latest.js after updating resultats.js,
     then commits resultats.js and ranking_history_latest.js together.

Optional:
7. odds_leaderboard_patch.js
   - Same odds patch, but with a bit more left padding on the Win%/Prob. column and note.

After upload:
- Do not touch index.html if it already loads:
    ranking_history_latest.js
    ranking_history_drawer_patch.js
- To manually update the graph later, run the "Regenerate ranking history" workflow from GitHub Actions.
- The API workflow should update the graph automatically whenever it commits new results.
