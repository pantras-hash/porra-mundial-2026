// Mode opcional amb Google Sheets en directe.
// Deixa sheetId buit per fer servir el data.json inclòs, generat a partir de l’Excel pujat.
// Per activar dades en directe: publica cada pestanya rellevant al web i omple aquest fitxer.
window.SHEET_CONFIG = {
  sheetId: "",
  refreshMinutes: 0,
  tabs: {
    classificacio: "",       // gid de "Classificació"
    estadistica: "",         // gid de "Estadística"
    faseGrups: "",           // gid de "Fase Grups"
    eliminatories: "",       // gid de "Eliminatòries"
    thirds: ""                // gid de "3ers Classificats"
  }
};
