Porra Mundial 2026 Monte Carlo update with Pichichi proxy bonuses

As-of: 19 Jun 2026, after Mexico 1-0 Korea Republic
Simulations: 100,000
Finished scores loaded: 28
Seed: 20260619

Patch files to upload, preserving paths:
- odds_latest.js
- odds_history/porra_odds_2026-06-19_1108_100000_pichichi_100000.csv
- odds_history/porra_odds_2026-06-19_1108_100000_pichichi_100000.json
- odds_history/porra_odds_2026-06-19_1108_100000_pichichi_100000.js
- scripts/run_monte_carlo_odds_fast.py
- pichichi_current.json

The simulation now includes:
- PCH = 15 points for correctly picking a tracked Pichichi / top scorer.
- GPCH = 10 points for correctly picking the final number of goals by any tracked top scorer.

Pichichi proxy model:
For each tracked scorer and each simulation:
    proxy final goals = current goals + future matches played by that player's team.
The simulated top-scorer goal total is the maximum proxy final goals among tracked scorers.
A top-scorer pick is marked correct if the picked player is tied for that maximum.

Current top-scorer inputs are stored in pichichi_current.json.
