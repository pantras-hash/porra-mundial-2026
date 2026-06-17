Porra odds column upload package
================================

Upload these files preserving the paths in this ZIP:

1. index.html
   - Replaces your current index.html.
   - The only intended change is in the <head>:
       <script src="odds_latest.js"></script>
       <script src="odds_leaderboard_patch.js" defer></script>
   - The existing dynamic loader for prediccions.js, resultats.js, app_new.js, and porra_extras_v2.js is left unchanged.

2. odds_latest.js
   - Put this in the root of the repo.
   - This is the only odds file the live website reads.
   - It includes all 57 players.
   - The `player` field keeps the exact internal name.
   - The `displayName` field uses first name + last initial.

3. odds_leaderboard_patch.js
   - Put this in the root of the repo.
   - It adds a new "Prob." / "Win %" column after "Punts".
   - It does not modify app_new.js.

4. odds_history/
   - Keep these timestamped files as an archive.
   - The website does not read them.
   - When you rerun the model later, add new timestamped files here and replace odds_latest.js.

Manual update later:
- Replace odds_latest.js with the new latest model output.
- Add the new CSV/JSON/JS outputs to odds_history/.
- Commit everything.
