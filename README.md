# Porra Mundial 2026

Web estàtica per a GitHub Pages. Aquesta versió s'ha regenerat a partir de `AA Classificació Porra Mundial 2026 (3).xlsx`.

## Fitxers importants

- `index.html`: pàgina principal.
- `prediccions.js`: pronòstics extrets del full de càlcul. Substitueix-lo quan actualitzis la plantilla de participants/pronòstics.
- `resultats.js`: únic fitxer que cal editar durant el Mundial per introduir resultats.
- `app.js`: lògica de classificació i visualització.
- `styles.css`: disseny.

## Actualitzar resultats

Edita `resultats.js`, busca el partit i canvia `null` pel resultat real. No canviïs `date` ni `sortOrder`.

Exemple:

```js
"G-A-1": { homeScore: 2, awayScore: 1, penHome: null, penAway: null, date: "2026-06-11", sortOrder: 1 },
```

En eliminatòries amb penals, omple també `penHome` i `penAway`.

## Actualitzar des d'un nou Excel

Si només has corregit pronòstics o participants, substitueix `prediccions.js` i, si vols treure les rodones d'inicials, també `app.js` i `styles.css`.

Si també has canviat l'estructura de partits, substitueix `resultats.js`, però copia abans els resultats que ja hagis introduït.
