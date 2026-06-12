# Porra Mundial 2026

Web estàtica per publicar a GitHub Pages. La predicció inicial surt de l'Excel, però els resultats es poden actualitzar sense tocar Google Sheets.

## Com actualitzar un resultat

1. Ves al repositori de GitHub.
2. Obre `resultats.js`.
3. Fes clic al llapis d'edició.
4. Busca el partit, per exemple `G-A-1`.
5. Canvia `null` pel marcador real.

```js
"G-A-1": { homeScore: 2, awayScore: 1, penHome: null, penAway: null },
```

En eliminatòries, si el partit va a penals, omple també `penHome` i `penAway`.

```js
"M73": { homeScore: 1, awayScore: 1, penHome: 4, penAway: 3 },
```

Després fes **Commit changes**. GitHub Pages publicarà l'actualització.

## Fitxers importants

- `index.html`: pàgina principal.
- `prediccions.js`: prediccions extretes de l'Excel. No cal tocar-lo.
- `resultats.js`: únic fitxer que cal editar durant el Mundial.
- `app.js`: calcula la classificació i les fletxes de moviment.
- `styles.css`: disseny visual.
- `index_standalone.html`: previsualització d'un sol fitxer per obrir localment.
