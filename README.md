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


## Si la web no s'actualitza

Aquesta versió carrega `resultats.js` amb un paràmetre anti-cache automàtic. Després de fer un canvi a GitHub:

1. Comprova que has fet **Commit changes** al branch que publica GitHub Pages, normalment `main`.
2. Mira la pestanya **Actions** o **Settings > Pages** per confirmar que el desplegament ha acabat correctament.
3. Obre la web i força una recàrrega: `Cmd+Shift+R` a Mac o `Ctrl+F5` a Windows.
4. Si encara no es veu, obre directament `https://EL-TEU-USUARI.github.io/EL-REPO/resultats.js?v=test` i comprova que surt el marcador nou.


Nota tecnica: aquesta versio evita la cache de resultats.js i inicialitza la pagina encara que app.js es carregui despres del DOMContentLoaded.


## Ordre cronologic dels partits

`resultats.js` inclou els camps `date` i `sortOrder` per a cada partit. Aquests camps serveixen per detectar el proper partit pendent segons el calendari, no segons l'ordre intern de la fulla de calcul. Quan actualitzis resultats, edita nomes `homeScore`, `awayScore`, `penHome` i `penAway`; no modifiquis `date` ni `sortOrder`.
