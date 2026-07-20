Minimal Pichichi points patch
=============================

Upload/replace ONLY:

  resultats.js

No layout/cosmetic changes. No odds changes.

Why this patch is needed
------------------------
The live leaderboard scoring code awards Pichichi points from:

  window.PORRA_RESULTATS.final.topScorer
  window.PORRA_RESULTATS.final.topScorerGoals

It does not use pichichi_current.json for points. That file is only for displaying the top-scorer table.

This patch sets:

  window.PORRA_ULTIM_PARTIT = "M104";
  final: { topScorer: "Kylian Mbappé", topScorerGoals: 10 }

Expected scoring effect
-----------------------
+15 to participants who picked Kylian Mbappé / Mbappé as Pichichi.
+0 for exact goals, because nobody picked exactly 10.

Expected final top 3:
1. Oriol Oltra — 1212
2. Isra — 1189
3. Oscar Bordas — 1184
