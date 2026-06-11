# Tauler de la porra del Mundial 2026

Aquest és un web estàtic per seguir la porra del Mundial 2026 a partir del full de càlcul existent.

## Què inclou

- `index.html` - la pàgina principal del tauler.
- `styles.css` - estils responsius.
- `app.js` - renderització del tauler i càrrega opcional des de Google Sheets.
- `data.json` - dades extretes del fitxer Excel pujat.
- `extract_data.py` - utilitat per regenerar `data.json` des d’una còpia local de l’Excel.
- `config.js` - configuració opcional per connectar amb Google Sheets en directe.
- `config.example.js` - exemple de configuració.
- `index_standalone.html` - versió d’un sol fitxer per previsualitzar fàcilment.

## Previsualització més fàcil

Obre `index_standalone.html` fent doble clic. Aquest fitxer ja porta les dades incrustades, de manera que hauries de veure els noms dels participants i les taules sense haver d’arrencar cap servidor local.

Per a la versió normal amb diversos fitxers, segueix les instruccions següents.

## Executar en local

Des d’aquesta carpeta:

```bash
python -m http.server 8000
```

Després obre:

```text
http://localhost:8000
```

No és ideal obrir `index.html` directament des del sistema de fitxers, perquè les regles de seguretat del navegador sovint bloquegen `fetch("data.json")` en fitxers locals.

## Fer servir la instantània de l’Excel

El `data.json` actual s’ha generat a partir del llibre Excel pujat.

Per regenerar-lo després de descarregar una còpia nova de l’Excel:

```bash
python extract_data.py "AA Classificació Porra Mundial 2026.xlsx"
```

L’extractor llegeix els valors calculats i guardats al fitxer. Si els valors semblen desactualitzats, obre el llibre a Excel o Google Sheets, deixa que recalculi, desa/exporta el fitxer i torna a executar l’script.

## Fer servir dades en directe de Google Sheets

Aquesta és la configuració recomanada a llarg termini.

1. Mantén Google Sheets com a font de veritat.
2. A Google Sheets, ves a **Fitxer > Comparteix > Publica al web**.
3. Publica les pestanyes rellevants com a dades públiques compatibles amb CSV:
   - `Classificació`
   - `Estadística`
   - `Fase Grups`
   - `Eliminatòries`
   - `3ers Classificats`
4. Copia l’ID del full de càlcul des de l’URL de Google Sheets.
5. Per a cada pestanya, copia el seu `gid` des de l’URL mentre tens oberta aquella pestanya.
6. Omple `config.js`:

```js
window.SHEET_CONFIG = {
  sheetId: "ID_DEL_TEU_GOOGLE_SHEET",
  refreshMinutes: 5,
  tabs: {
    classificacio: "GID_DE_CLASSIFICACIO",
    estadistica: "GID_D_ESTADISTICA",
    faseGrups: "GID_DE_FASE_GRUPS",
    eliminatories: "GID_D_ELIMINATORIES",
    thirds: "GID_DE_3ERS_CLASSIFICATS"
  }
};
```

Si `sheetId` és buit, el web fa servir `data.json`. Quan tots els valors estan omplerts, el web carrega les dades CSV de Google Sheets quan s’obre la pàgina i cada vegada que es prem **Actualitzar dades**.

## Publicar gratis amb GitHub Pages

L’opció més senzilla és GitHub Pages:

1. Crea un repositori a GitHub, per exemple `porra-mundial-2026`.
2. Puja tots els fitxers d’aquesta carpeta a l’arrel del repositori.
3. A GitHub, entra al repositori i ves a **Settings > Pages**.
4. A **Build and deployment**, tria **Deploy from a branch**.
5. A **Branch**, tria `main` i la carpeta `/root`, i desa.
6. Al cap d’una estona, GitHub et mostrarà l’URL públic del web.

Normalment l’URL tindrà aquest format:

```text
https://EL_TEU_USUARI.github.io/porra-mundial-2026/
```

## Notes

- Si no vols que el Google Sheet sigui públic, no el publiquis al web. En aquest cas, fes servir el flux de `data.json` o caldrà construir un petit backend amb autenticació.
- El full de càlcul continua sent la font de veritat. El web només mostra els valors calculats.
