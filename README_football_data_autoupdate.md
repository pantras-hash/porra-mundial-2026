# Automatic results from football-data.org

This patch adds a GitHub Action that updates `resultats.js` from the football-data.org API.

## Files in this patch

- `.github/workflows/update-results.yml` — scheduled GitHub Action.
- `scripts/update_results_from_football_data.py` — Python updater script.
- `README_football_data_autoupdate.md` — these instructions.

## One-time setup

1. Create a football-data.org account and get an API token.
2. In your GitHub repository, go to **Settings > Secrets and variables > Actions**.
3. Click **New repository secret**.
4. Name it exactly:

```text
FOOTBALL_DATA_TOKEN
```

5. Paste your football-data.org token as the secret value.
6. Upload the files in this patch to the root of your repository.

## How it works

The Action runs every 5 minutes and fetches World Cup matches using:

```text
/v4/competitions/WC/matches?season=2026&dateFrom=2026-06-11&dateTo=2026-07-20
```

It updates only the score fields in `resultats.js`:

```js
homeScore
awayScore
penHome
penAway
```

It leaves `prediccions.js` and the rest of the website unchanged.

## Manual test

After adding the secret and files, go to **Actions > Update results from football-data.org > Run workflow**.

You can also choose `final_only = true` if you want to update only completed matches. The default updates live/running scores when football-data.org provides them.

## Notes

- Scheduled GitHub Actions can run at most every 5 minutes.
- Scheduled jobs may sometimes be delayed by GitHub.
- If the API returns an unexpected team name, the script prints unmatched matches in the workflow log so you can review them.
- For knockout rounds, the script first tries to match by teams; if the site still has placeholder labels, it falls back to matching by date and order.
