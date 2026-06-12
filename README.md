# Porra Mundial 2026

Web estàtica per a GitHub Pages.

## Actualitzar resultats

Edita només `resultats.js` des de GitHub. Canvia `null` pel resultat real:

```js
"G-A-1": { homeScore: 2, awayScore: 1, penHome: null, penAway: null, date: "2026-06-11", sortOrder: 1 },
```

En eliminatòries, omple `penHome` i `penAway` només si el partit acaba empatat abans dels penals.

## Idiomes

La web té Català, Castellà i Anglès. El català és l'idioma per defecte. El selector d'idioma és a la part superior dreta.

## Enllaç directe a GitHub

La web intenta detectar automàticament l'usuari i el repositori de GitHub Pages per crear l'enllaç directe a `resultats.js`.

Si no ho detecta bé, edita el bloc següent a `index.html`:

```html
<script>
  window.PORRA_GITHUB = { username: "el-teu-usuari", repo: "el-teu-repositori", branch: "main" };
</script>
```

## Canvis d'aquesta versió

- Els pronòstics de cada participant es mostren en ordre cronològic.
- Els penals només es mostren en eliminatòries quan el pronòstic del partit és un empat.
- S'ha afegit un peu de pàgina amb enllaços a GitHub i a l'edició de `resultats.js`.
- S'han afegit traduccions al català, castellà i anglès.
