# Current-match display patch

This patch changes the leaderboard's "next match" logic so a live match stays visible until it is marked final.

## Files to replace

Replace these files in your GitHub repository:

```text
app.js
scripts/update_results_from_football_data.py
```

The ZIP also includes the current recommended workflow file:

```text
.github/workflows/update-results.yml
```

Replace it too if you have not already installed the latest football-data.org workflow with the `Show trigger` step and the explicit 5-minute cron.

## What changes

- The site now treats matches with `status: "IN_PLAY"`, `"PAUSED"`, `"EXTRA_TIME"`, or `"PENALTY_SHOOTOUT"` as not final.
- The top prediction column therefore remains on the current live match until the API marks it `FINISHED` or `AWARDED`.
- Older manual scores with no `status` field are still treated as final, preserving backward compatibility.
- The football-data.org updater now writes `status` into `resultats.js` along with the score.

Example during a live game:

```js
"G-D-1": { homeScore: 1, awayScore: 0, penHome: null, penAway: null, date: "2026-06-12", sortOrder: 4, status: "IN_PLAY" },
```

When the match is over, the updater changes it to:

```js
"G-D-1": { homeScore: 1, awayScore: 0, penHome: null, penAway: null, date: "2026-06-12", sortOrder: 4, status: "FINISHED" },
```

Only after that will the website advance to the next match.

## Important

Do not replace `resultats.js`. The updater will add/update statuses automatically as matches are fetched.
