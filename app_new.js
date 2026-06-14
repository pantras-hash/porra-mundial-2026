(function () {
  const data = window.PORRA_DATA;
  const resultats = window.PORRA_RESULTATS || { matches: {}, final: {}, groupRankingOverrides: {} };
  const state = { filter: '', computed: null, lang: localStorage.getItem('porraLang') || 'ca' };
  const els = {
    status: document.getElementById('dataStatus'),
    nextTitle: document.getElementById('nextMatchTitle'),
    nextMeta: document.getElementById('nextMatchMeta'),
    nextHeader: document.getElementById('nextPredictionHeader'),
    body: document.getElementById('leaderboardBody'),
    search: document.getElementById('searchInput'),
    drawer: document.getElementById('playerDrawer'),
    closeDrawer: document.getElementById('closeDrawer'),
    drawerTitle: document.getElementById('drawerTitle'),
    drawerRank: document.getElementById('drawerRank'),
    drawerSubtitle: document.getElementById('drawerSubtitle'),
    drawerContent: document.getElementById('drawerContent'),
    langButtons: document.querySelectorAll('[data-lang]'),
    githubAccount: document.getElementById('githubAccountLink'),
    resultsEdit: document.getElementById('resultsEditLink')
  };
  const stageConfig = {
    r32: { keys: rangeKeys(73, 88), team: 'E16', pos: 'E16P', goals: 'G16', teamPts: 4, posPts: 4, goalPts: 4, goalMin: 4 },
    r16: { keys: rangeKeys(89, 96), team: 'E8', pos: 'E8P', goals: 'G8', teamPts: 6, posPts: 6, goalPts: 6 },
    qf:  { keys: rangeKeys(97, 100), team: 'E4', pos: 'E4P', goals: 'G4', teamPts: 8, posPts: 8, goalPts: 6 },
    sf:  { keys: rangeKeys(101, 102), team: 'ES', pos: 'ESP', goals: 'GS', teamPts: 10, posPts: 10, goalPts: 8 }
  };

  const SCHEDULE_META = {
    "G-A-1": {
        "date": "2026-06-11",
        "sortOrder": 1,
        "kickoffUtc": "2026-06-11T19:00:00Z"
    },
    "G-A-2": {
        "date": "2026-06-11",
        "sortOrder": 2,
        "kickoffUtc": "2026-06-12T02:00:00Z"
    },
    "G-B-1": {
        "date": "2026-06-12",
        "sortOrder": 3,
        "kickoffUtc": "2026-06-12T19:00:00Z"
    },
    "G-D-1": {
        "date": "2026-06-12",
        "sortOrder": 4,
        "kickoffUtc": "2026-06-13T01:00:00Z"
    },
    "G-B-2": {
        "date": "2026-06-13",
        "sortOrder": 5,
        "kickoffUtc": "2026-06-13T19:00:00Z"
    },
    "G-C-1": {
        "date": "2026-06-13",
        "sortOrder": 6,
        "kickoffUtc": "2026-06-13T22:00:00Z"
    },
    "G-C-2": {
        "date": "2026-06-13",
        "sortOrder": 7,
        "kickoffUtc": "2026-06-14T01:00:00Z"
    },
    "G-D-2": {
        "date": "2026-06-14",
        "sortOrder": 8,
        "kickoffUtc": "2026-06-14T04:00:00Z"
    },
    "G-E-1": {
        "date": "2026-06-14",
        "sortOrder": 9,
        "kickoffUtc": "2026-06-14T17:00:00Z"
    },
    "G-F-1": {
        "date": "2026-06-14",
        "sortOrder": 10,
        "kickoffUtc": "2026-06-14T20:00:00Z"
    },
    "G-E-2": {
        "date": "2026-06-14",
        "sortOrder": 11,
        "kickoffUtc": "2026-06-14T23:00:00Z"
    },
    "G-F-2": {
        "date": "2026-06-14",
        "sortOrder": 12,
        "kickoffUtc": "2026-06-15T02:00:00Z"
    },
    "G-H-1": {
        "date": "2026-06-15",
        "sortOrder": 13,
        "kickoffUtc": "2026-06-15T16:00:00Z"
    },
    "G-G-1": {
        "date": "2026-06-15",
        "sortOrder": 14,
        "kickoffUtc": "2026-06-15T19:00:00Z"
    },
    "G-H-2": {
        "date": "2026-06-15",
        "sortOrder": 15,
        "kickoffUtc": "2026-06-15T22:00:00Z"
    },
    "G-G-2": {
        "date": "2026-06-15",
        "sortOrder": 16,
        "kickoffUtc": "2026-06-16T01:00:00Z"
    },
    "G-I-1": {
        "date": "2026-06-16",
        "sortOrder": 17,
        "kickoffUtc": "2026-06-16T19:00:00Z"
    },
    "G-I-2": {
        "date": "2026-06-16",
        "sortOrder": 18,
        "kickoffUtc": "2026-06-16T22:00:00Z"
    },
    "G-J-1": {
        "date": "2026-06-16",
        "sortOrder": 19,
        "kickoffUtc": "2026-06-17T01:00:00Z"
    },
    "G-J-2": {
        "date": "2026-06-17",
        "sortOrder": 20,
        "kickoffUtc": "2026-06-17T04:00:00Z"
    },
    "G-K-1": {
        "date": "2026-06-17",
        "sortOrder": 21,
        "kickoffUtc": "2026-06-17T17:00:00Z"
    },
    "G-L-1": {
        "date": "2026-06-17",
        "sortOrder": 22,
        "kickoffUtc": "2026-06-17T20:00:00Z"
    },
    "G-L-2": {
        "date": "2026-06-17",
        "sortOrder": 23,
        "kickoffUtc": "2026-06-17T23:00:00Z"
    },
    "G-K-2": {
        "date": "2026-06-17",
        "sortOrder": 24,
        "kickoffUtc": "2026-06-18T02:00:00Z"
    },
    "G-A-4": {
        "date": "2026-06-18",
        "sortOrder": 25,
        "kickoffUtc": "2026-06-18T16:00:00Z"
    },
    "G-B-4": {
        "date": "2026-06-18",
        "sortOrder": 26,
        "kickoffUtc": "2026-06-18T19:00:00Z"
    },
    "G-B-3": {
        "date": "2026-06-18",
        "sortOrder": 27,
        "kickoffUtc": "2026-06-18T22:00:00Z"
    },
    "G-A-3": {
        "date": "2026-06-18",
        "sortOrder": 28,
        "kickoffUtc": "2026-06-19T01:00:00Z"
    },
    "G-D-3": {
        "date": "2026-06-19",
        "sortOrder": 29,
        "kickoffUtc": "2026-06-19T19:00:00Z"
    },
    "G-C-4": {
        "date": "2026-06-19",
        "sortOrder": 30,
        "kickoffUtc": "2026-06-19T22:00:00Z"
    },
    "G-C-3": {
        "date": "2026-06-19",
        "sortOrder": 31,
        "kickoffUtc": "2026-06-20T00:30:00Z"
    },
    "G-D-4": {
        "date": "2026-06-19",
        "sortOrder": 32,
        "kickoffUtc": "2026-06-20T03:00:00Z"
    },
    "G-F-3": {
        "date": "2026-06-20",
        "sortOrder": 33,
        "kickoffUtc": "2026-06-20T17:00:00Z"
    },
    "G-E-3": {
        "date": "2026-06-20",
        "sortOrder": 34,
        "kickoffUtc": "2026-06-20T20:00:00Z"
    },
    "G-E-4": {
        "date": "2026-06-20",
        "sortOrder": 35,
        "kickoffUtc": "2026-06-21T00:00:00Z"
    },
    "G-F-4": {
        "date": "2026-06-21",
        "sortOrder": 36,
        "kickoffUtc": "2026-06-21T04:00:00Z"
    },
    "G-H-3": {
        "date": "2026-06-21",
        "sortOrder": 37,
        "kickoffUtc": "2026-06-21T16:00:00Z"
    },
    "G-G-3": {
        "date": "2026-06-21",
        "sortOrder": 38,
        "kickoffUtc": "2026-06-21T19:00:00Z"
    },
    "G-H-4": {
        "date": "2026-06-21",
        "sortOrder": 39,
        "kickoffUtc": "2026-06-21T22:00:00Z"
    },
    "G-G-4": {
        "date": "2026-06-21",
        "sortOrder": 40,
        "kickoffUtc": "2026-06-22T01:00:00Z"
    },
    "G-J-3": {
        "date": "2026-06-22",
        "sortOrder": 41,
        "kickoffUtc": "2026-06-22T17:00:00Z"
    },
    "G-I-3": {
        "date": "2026-06-22",
        "sortOrder": 42,
        "kickoffUtc": "2026-06-22T21:00:00Z"
    },
    "G-I-4": {
        "date": "2026-06-22",
        "sortOrder": 43,
        "kickoffUtc": "2026-06-23T00:00:00Z"
    },
    "G-J-4": {
        "date": "2026-06-22",
        "sortOrder": 44,
        "kickoffUtc": "2026-06-23T03:00:00Z"
    },
    "G-K-3": {
        "date": "2026-06-23",
        "sortOrder": 45,
        "kickoffUtc": "2026-06-23T17:00:00Z"
    },
    "G-L-3": {
        "date": "2026-06-23",
        "sortOrder": 46,
        "kickoffUtc": "2026-06-23T20:00:00Z"
    },
    "G-L-4": {
        "date": "2026-06-23",
        "sortOrder": 47,
        "kickoffUtc": "2026-06-23T23:00:00Z"
    },
    "G-K-4": {
        "date": "2026-06-23",
        "sortOrder": 48,
        "kickoffUtc": "2026-06-24T02:00:00Z"
    },
    "G-B-5": {
        "date": "2026-06-24",
        "sortOrder": 49,
        "kickoffUtc": "2026-06-24T19:00:00Z"
    },
    "G-B-6": {
        "date": "2026-06-24",
        "sortOrder": 50,
        "kickoffUtc": "2026-06-24T19:00:00Z"
    },
    "G-C-5": {
        "date": "2026-06-24",
        "sortOrder": 51,
        "kickoffUtc": "2026-06-24T22:00:00Z"
    },
    "G-C-6": {
        "date": "2026-06-24",
        "sortOrder": 52,
        "kickoffUtc": "2026-06-24T22:00:00Z"
    },
    "G-A-5": {
        "date": "2026-06-24",
        "sortOrder": 53,
        "kickoffUtc": "2026-06-25T01:00:00Z"
    },
    "G-A-6": {
        "date": "2026-06-24",
        "sortOrder": 54,
        "kickoffUtc": "2026-06-25T01:00:00Z"
    },
    "G-E-5": {
        "date": "2026-06-25",
        "sortOrder": 55,
        "kickoffUtc": "2026-06-25T20:00:00Z"
    },
    "G-E-6": {
        "date": "2026-06-25",
        "sortOrder": 56,
        "kickoffUtc": "2026-06-25T20:00:00Z"
    },
    "G-F-5": {
        "date": "2026-06-25",
        "sortOrder": 57,
        "kickoffUtc": "2026-06-25T23:00:00Z"
    },
    "G-F-6": {
        "date": "2026-06-25",
        "sortOrder": 58,
        "kickoffUtc": "2026-06-25T23:00:00Z"
    },
    "G-D-5": {
        "date": "2026-06-25",
        "sortOrder": 59,
        "kickoffUtc": "2026-06-26T02:00:00Z"
    },
    "G-D-6": {
        "date": "2026-06-25",
        "sortOrder": 60,
        "kickoffUtc": "2026-06-26T02:00:00Z"
    },
    "G-I-5": {
        "date": "2026-06-26",
        "sortOrder": 61,
        "kickoffUtc": "2026-06-26T19:00:00Z"
    },
    "G-I-6": {
        "date": "2026-06-26",
        "sortOrder": 62,
        "kickoffUtc": "2026-06-26T19:00:00Z"
    },
    "G-H-5": {
        "date": "2026-06-26",
        "sortOrder": 63,
        "kickoffUtc": "2026-06-27T00:00:00Z"
    },
    "G-H-6": {
        "date": "2026-06-26",
        "sortOrder": 64,
        "kickoffUtc": "2026-06-27T00:00:00Z"
    },
    "G-G-5": {
        "date": "2026-06-26",
        "sortOrder": 65,
        "kickoffUtc": "2026-06-27T03:00:00Z"
    },
    "G-G-6": {
        "date": "2026-06-26",
        "sortOrder": 66,
        "kickoffUtc": "2026-06-27T03:00:00Z"
    },
    "G-L-5": {
        "date": "2026-06-27",
        "sortOrder": 67,
        "kickoffUtc": "2026-06-27T21:00:00Z"
    },
    "G-L-6": {
        "date": "2026-06-27",
        "sortOrder": 68,
        "kickoffUtc": "2026-06-27T21:00:00Z"
    },
    "G-K-5": {
        "date": "2026-06-27",
        "sortOrder": 69,
        "kickoffUtc": "2026-06-27T23:30:00Z"
    },
    "G-K-6": {
        "date": "2026-06-27",
        "sortOrder": 70,
        "kickoffUtc": "2026-06-27T23:30:00Z"
    },
    "G-J-5": {
        "date": "2026-06-27",
        "sortOrder": 71,
        "kickoffUtc": "2026-06-28T02:00:00Z"
    },
    "G-J-6": {
        "date": "2026-06-27",
        "sortOrder": 72,
        "kickoffUtc": "2026-06-28T02:00:00Z"
    },
    "M73": {
        "date": "2026-06-28",
        "sortOrder": 73
    },
    "M74": {
        "date": "2026-06-29",
        "sortOrder": 74
    },
    "M75": {
        "date": "2026-06-29",
        "sortOrder": 75
    },
    "M76": {
        "date": "2026-06-29",
        "sortOrder": 76
    },
    "M77": {
        "date": "2026-06-30",
        "sortOrder": 77
    },
    "M78": {
        "date": "2026-06-30",
        "sortOrder": 78
    },
    "M79": {
        "date": "2026-06-30",
        "sortOrder": 79
    },
    "M80": {
        "date": "2026-07-01",
        "sortOrder": 80
    },
    "M81": {
        "date": "2026-07-01",
        "sortOrder": 81
    },
    "M82": {
        "date": "2026-07-01",
        "sortOrder": 82
    },
    "M83": {
        "date": "2026-07-02",
        "sortOrder": 83
    },
    "M84": {
        "date": "2026-07-02",
        "sortOrder": 84
    },
    "M85": {
        "date": "2026-07-02",
        "sortOrder": 85
    },
    "M86": {
        "date": "2026-07-03",
        "sortOrder": 86
    },
    "M87": {
        "date": "2026-07-03",
        "sortOrder": 87
    },
    "M88": {
        "date": "2026-07-03",
        "sortOrder": 88
    },
    "M89": {
        "date": "2026-07-04",
        "sortOrder": 89
    },
    "M90": {
        "date": "2026-07-04",
        "sortOrder": 90
    },
    "M91": {
        "date": "2026-07-05",
        "sortOrder": 91
    },
    "M92": {
        "date": "2026-07-05",
        "sortOrder": 92
    },
    "M93": {
        "date": "2026-07-06",
        "sortOrder": 93
    },
    "M94": {
        "date": "2026-07-06",
        "sortOrder": 94
    },
    "M95": {
        "date": "2026-07-07",
        "sortOrder": 95
    },
    "M96": {
        "date": "2026-07-07",
        "sortOrder": 96
    },
    "M97": {
        "date": "2026-07-09",
        "sortOrder": 97
    },
    "M98": {
        "date": "2026-07-10",
        "sortOrder": 98
    },
    "M99": {
        "date": "2026-07-11",
        "sortOrder": 99
    },
    "M100": {
        "date": "2026-07-11",
        "sortOrder": 100
    },
    "M101": {
        "date": "2026-07-14",
        "sortOrder": 101
    },
    "M102": {
        "date": "2026-07-15",
        "sortOrder": 102
    },
    "M103": {
        "date": "2026-07-18",
        "sortOrder": 103
    },
    "M104": {
        "date": "2026-07-19",
        "sortOrder": 104
    }
};
  const I18N = {
    ca: {
      title: 'Classificació', nextPendingLabel: 'Pròxim partit pendent', nextMetaHint: 'La columna de la taula mostra el pronòstic de cada participant per a aquest partit.', localTimeNote: 'Horaris en la teva hora local ({tz})',
      legendUp: '▲ puja', legendDown: '▼ baixa', legendSame: '— igual', fullTableTitle: 'Taula completa', clickHint: 'Fes clic en un participant per veure tots els seus pronòstics.',
      searchLabel: 'Buscar', searchPlaceholder: 'Nom...', colPosition: 'Pos.', colMovement: 'Mov.', colParticipant: 'Participant', colPoints: 'Punts', colChampion: 'Campió', colTopScorer: 'Pichichi',
      nextMatchColumn: 'Pròxim partit', predictionFor: 'Pronòstic: {home} – {away}', allMatchesHaveResults: 'Tots els partits tenen resultat', noPendingMatches: 'No queda cap partit pendent.',
      initialData: 'Dades inicials: {date}', noPlayerFound: 'No s’ha trobat cap participant.', points: 'punts', matchPredictions: 'pronòstics de partit',
      champion: 'Campió', finalist: 'Finalista', third: 'Tercer', topScorer: 'Pichichi', goals: 'gols', nextPredictionTitle: 'Pronòstic del pròxim partit', pointsBreakdown: 'Desglossament de punts', matchPredictionsTitle: 'Pronòstics de partits',
      stage: 'Fase', date: 'Data', match: 'Partit', result: 'Resultat', winner: 'Guanyador', penalty: 'pen.', close: 'Tancar',
      updateTitle: 'Com actualitzar resultats a GitHub', updateInstructions: 'Edita només <code>resultats.js</code>. Busca el partit, canvia <code>null</code> pel resultat real i fes <strong>Commit changes</strong>. GitHub Pages actualitzarà la web després de publicar el canvi.',
      footerText: 'Actualització de resultats:', githubAccount: 'GitHub', editResultsFile: 'Editar resultats.js', group: 'Grup', groups: 'Grups', r32: 'Setzens de final', r16: 'Vuitens de final', qf: 'Quarts de final', sf: 'Semifinals', thirdPlace: 'Tercer lloc', final: 'Final'
    },
    es: {
      title: 'Clasificación', nextPendingLabel: 'Próximo partido pendiente', nextMetaHint: 'La columna de la tabla muestra el pronóstico de cada participante para este partido.', localTimeNote: 'Horarios en tu hora local ({tz})',
      legendUp: '▲ sube', legendDown: '▼ baja', legendSame: '— igual', fullTableTitle: 'Tabla completa', clickHint: 'Haz clic en un participante para ver todos sus pronósticos.',
      searchLabel: 'Buscar', searchPlaceholder: 'Nombre...', colPosition: 'Pos.', colMovement: 'Mov.', colParticipant: 'Participante', colPoints: 'Puntos', colChampion: 'Campeón', colTopScorer: 'Pichichi',
      nextMatchColumn: 'Próximo partido', predictionFor: 'Pronóstico: {home} – {away}', allMatchesHaveResults: 'Todos los partidos tienen resultado', noPendingMatches: 'No queda ningún partido pendiente.',
      initialData: 'Datos iniciales: {date}', noPlayerFound: 'No se ha encontrado ningún participante.', points: 'puntos', matchPredictions: 'pronósticos de partidos',
      champion: 'Campeón', finalist: 'Finalista', third: 'Tercero', topScorer: 'Pichichi', goals: 'goles', nextPredictionTitle: 'Pronóstico del próximo partido', pointsBreakdown: 'Desglose de puntos', matchPredictionsTitle: 'Pronósticos de partidos',
      stage: 'Fase', date: 'Fecha', match: 'Partido', result: 'Resultado', winner: 'Ganador', penalty: 'pen.', close: 'Cerrar',
      updateTitle: 'Cómo actualizar resultados en GitHub', updateInstructions: 'Edita solo <code>resultats.js</code>. Busca el partido, cambia <code>null</code> por el resultado real y haz <strong>Commit changes</strong>. GitHub Pages actualizará la web después de publicar el cambio.',
      footerText: 'Actualización de resultados:', githubAccount: 'GitHub', editResultsFile: 'Editar resultats.js', group: 'Grupo', groups: 'Grupos', r32: 'Dieciseisavos de final', r16: 'Octavos de final', qf: 'Cuartos de final', sf: 'Semifinales', thirdPlace: 'Tercer puesto', final: 'Final'
    },
    en: {
      title: 'Leaderboard', nextPendingLabel: 'Next pending match', nextMetaHint: 'The table column shows each player’s prediction for this match.', localTimeNote: 'All times shown in your local time',
      legendUp: '▲ up', legendDown: '▼ down', legendSame: '— same', fullTableTitle: 'Full leaderboard', clickHint: 'Click a player to see all of their predictions.',
      searchLabel: 'Search', searchPlaceholder: 'Name...', colPosition: 'Pos.', colMovement: 'Move', colParticipant: 'Player', colPoints: 'Points', colChampion: 'Champion', colTopScorer: 'Top scorer',
      nextMatchColumn: 'Next match', predictionFor: 'Prediction: {home} – {away}', allMatchesHaveResults: 'All matches have a result', noPendingMatches: 'There are no pending matches.',
      initialData: 'Initial data: {date}', noPlayerFound: 'No player found.', points: 'points', matchPredictions: 'match predictions',
      champion: 'Champion', finalist: 'Runner-up', third: 'Third', topScorer: 'Top scorer', goals: 'goals', nextPredictionTitle: 'Prediction for the next match', pointsBreakdown: 'Points breakdown', matchPredictionsTitle: 'Match predictions',
      stage: 'Stage', date: 'Date', match: 'Match', result: 'Score', winner: 'Winner', penalty: 'pens', close: 'Close',
      updateTitle: 'How to update results on GitHub', updateInstructions: 'Edit only <code>resultats.js</code>. Find the match, replace <code>null</code> with the real score, and click <strong>Commit changes</strong>. GitHub Pages will update the website after the change is published.',
      footerText: 'Results updates:', githubAccount: 'GitHub', editResultsFile: 'Edit resultats.js', group: 'Group', groups: 'Groups', r32: 'Round of 32', r16: 'Round of 16', qf: 'Quarter-finals', sf: 'Semi-finals', thirdPlace: 'Third-place match', final: 'Final'
    }
  };
  const LANG_LOCALES = { ca: 'ca-ES', es: 'es-ES', en: 'en-US' };
  const USE_FLAGS = true;
  const FLAGS_BY_TEAM = {
    "Mexico": "🇲🇽",
    "South Africa": "🇿🇦",
    "South Korea": "🇰🇷",
    "Czechia": "🇨🇿",
    "Canada": "🇨🇦",
    "Bosnia and Herzegovina": "🇧🇦",
    "United States": "🇺🇸",
    "Paraguay": "🇵🇾",
    "Qatar": "🇶🇦",
    "Switzerland": "🇨🇭",
    "Brazil": "🇧🇷",
    "Morocco": "🇲🇦",
    "Haiti": "🇭🇹",
    "Scotland": "🏴",
    "Australia": "🇦🇺",
    "Turkey": "🇹🇷",
    "Türkiye": "🇹🇷",
    "Germany": "🇩🇪",
    "Curaçao": "🇨🇼",
    "Curacao": "🇨🇼",
    "Netherlands": "🇳🇱",
    "Japan": "🇯🇵",
    "Ivory Coast": "🇨🇮",
    "Côte d’Ivoire": "🇨🇮",
    "Côte d'Ivoire": "🇨🇮",
    "Ecuador": "🇪🇨",
    "Sweden": "🇸🇪",
    "Tunisia": "🇹🇳",
    "Spain": "🇪🇸",
    "Cape Verde": "🇨🇻",
    "Belgium": "🇧🇪",
    "Egypt": "🇪🇬",
    "Saudi Arabia": "🇸🇦",
    "Uruguay": "🇺🇾",
    "Iran": "🇮🇷",
    "New Zealand": "🇳🇿",
    "France": "🇫🇷",
    "Senegal": "🇸🇳",
    "Iraq": "🇮🇶",
    "Norway": "🇳🇴",
    "Argentina": "🇦🇷",
    "Algeria": "🇩🇿",
    "Austria": "🇦🇹",
    "Jordan": "🇯🇴",
    "Portugal": "🇵🇹",
    "DR Congo": "🇨🇩",
    "England": "🏴",
    "Croatia": "🇭🇷",
    "Ghana": "🇬🇭",
    "Panama": "🇵🇦",
    "Uzbekistan": "🇺🇿",
    "Colombia": "🇨🇴"
  };


  function rangeKeys(a, b) { const out = []; for (let i = a; i <= b; i++) out.push('M' + i); return out; }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
  function display(value, fallback = '—') { if (value === null || value === undefined || value === '') return fallback; const s = String(value).trim(); if (!s || s === '#N/A' || s.toUpperCase() === 'TBD') return fallback; return s; }
  function teamFlag(team) { return FLAGS_BY_TEAM[team] || ''; }
  function teamDisplay(team) {
    const name = display(team);
    if (!USE_FLAGS || name === '—') return name;
    const flag = teamFlag(name);
    return flag ? `${flag} ${name}` : name;
  }
  function teamShort(team) {
    const name = display(team);
    if (!USE_FLAGS || name === '—') return name;
    const flag = teamFlag(name);
    return flag ? `${flag} ${name}` : name;
  }
  function isNum(v) { return typeof v === 'number' && Number.isFinite(v); }
  function t(key, vars = {}) {
    const dict = I18N[state.lang] || I18N.ca;
    let text = dict[key] || I18N.ca[key] || key;
    for (const [k, v] of Object.entries(vars)) { text = text.replaceAll(`{{${k}}}`, v); text = text.replaceAll(`{${k}}`, v); }
    return text;
  }
  function scoreText(m, opts = {}) {
    if (!m || !isNum(m.homeScore) || !isNum(m.awayScore)) return '—';
    let s = `${m.homeScore}–${m.awayScore}`;
    const scoreIsTied = m.homeScore === m.awayScore;
    const showPens = isNum(m.penHome) && isNum(m.penAway) && (!opts.pensOnlyWhenTied || scoreIsTied);
    if (showPens) s += ` (${m.penHome}–${m.penAway} ${t('penalty')})`;
    return s;
  }
  function predictionScoreText(m) { return scoreText(m, { pensOnlyWhenTied: true }); }
  function matchLabel(m) { if (!m) return '—'; return `${teamDisplay(m.home)} vs ${teamDisplay(m.away)}`; }
  function matchMeta(id) {
    const fromResults = id && resultats.matches && resultats.matches[id] ? resultats.matches[id] : null;
    const canonical = SCHEDULE_META[id] || {};
    const merged = { ...(fromResults || {}) };
    // The chronology is canonical. Manual resultats.js values can keep scores/status,
    // but stale date/sortOrder values must not override the official order.
    if (canonical.date) merged.date = canonical.date;
    if (canonical.kickoffUtc) merged.kickoffUtc = canonical.kickoffUtc;
    if (typeof canonical.sortOrder === 'number') merged.sortOrder = canonical.sortOrder;
    return merged;
  }
  function matchChronology(m) {
    const meta = m && m.id ? matchMeta(m.id) : {};
    if (m && typeof m.sortOrder === 'number') return m.sortOrder;
    if (typeof meta.sortOrder === 'number') return meta.sortOrder;
    if (m && m.date) {
      const parsed = Date.parse(`${m.date}T00:00:00Z`);
      if (Number.isFinite(parsed)) return parsed / 86400000;
    }
    if (meta.date) {
      const parsed = Date.parse(`${meta.date}T00:00:00Z`);
      if (Number.isFinite(parsed)) return parsed / 86400000;
    }
    return m && typeof m.order === 'number' ? m.order + 100000 : Number.MAX_SAFE_INTEGER;
  }
  function chronologicalMatches(matches) {
    return [...matches].sort((a, b) => matchChronology(a) - matchChronology(b));
  }
  const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT']);
  const FINAL_STATUSES = new Set(['FINISHED', 'AWARDED']);
  const NON_FINAL_STATUSES = new Set(['SCHEDULED', 'TIMED', 'POSTPONED', 'SUSPENDED', 'CANCELED', ...LIVE_STATUSES]);
  function matchStatus(m) {
    const meta = m && m.id ? matchMeta(m.id) : {};
    return String((m && m.status) || meta.status || '').trim().toUpperCase();
  }
  function hasMatchScore(m) { return !!m && isNum(m.homeScore) && isNum(m.awayScore); }
  function isMatchFinal(m) {
    const status = matchStatus(m);
    if (FINAL_STATUSES.has(status)) return true;
    if (NON_FINAL_STATUSES.has(status)) return false;
    // Backwards compatible behavior: old/manual resultats.js entries had no status,
    // so a score without a status is treated as final.
    return hasMatchScore(m);
  }
  function statusLabel(status) {
    const s = String(status || '').toUpperCase();
    const labels = {
      ca: { IN_PLAY: 'en joc', PAUSED: 'descans', EXTRA_TIME: 'pròrroga', PENALTY_SHOOTOUT: 'penals', FINISHED: 'finalitzat', AWARDED: 'finalitzat' },
      es: { IN_PLAY: 'en juego', PAUSED: 'descanso', EXTRA_TIME: 'prórroga', PENALTY_SHOOTOUT: 'penaltis', FINISHED: 'finalizado', AWARDED: 'finalizado' },
      en: { IN_PLAY: 'live', PAUSED: 'half-time', EXTRA_TIME: 'extra time', PENALTY_SHOOTOUT: 'penalties', FINISHED: 'final', AWARDED: 'final' }
    };
    return (labels[state.lang] && labels[state.lang][s]) || labels.ca[s] || '';
  }
  function focusMatchMetaText(m) {
    if (!m) return t('noPendingMatches');
    const parts = [translateRound(m.round), m.id];
    const date = formatMatchDate(m);
    if (date) parts.push(date);
    if (hasMatchScore(m)) parts.push(scoreText(m));
    const label = statusLabel(matchStatus(m));
    if (label) parts.push(label);
    return parts.join(' · ');
  }
  function updateFocusMatchHeader(matches) {
    const list = Array.isArray(matches) ? matches : (matches ? [matches] : []);
    const first = list[0];
    els.nextTitle.textContent = first ? t('nextPendingLabel') : t('allMatchesHaveResults');
    if (!list.length) {
      els.nextMeta.textContent = t('noPendingMatches');
    } else {
      els.nextMeta.innerHTML = `<div class="next-time-note">${escapeHtml(t('localTimeNote', { tz: userTimeZoneLabel() }))}</div><div class="next-match-list">${list.map(m => nextMatchCardHtml(m)).join('')}</div>`;
    }
    if (els.nextHeader) {
      els.nextHeader.textContent = first ? nextColumnLabel(first) : t('nextMatchColumn');
    }
  }
  function formatMatchDate(m) {
    const meta = m && m.id ? matchMeta(m.id) : {};
    const date = (m && m.date) || meta.date;
    if (!date) return '';
    const d = new Date(`${date}T12:00:00Z`);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(LANG_LOCALES[state.lang] || 'ca-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  }
  function userTimeZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid';
  }
  function userTimeZoneLabel() {
    return userTimeZone().replace(/_/g, ' ');
  }
  function formatKickoffLocal(m) {
    const meta = m && m.id ? matchMeta(m.id) : {};
    const kickoff = (m && m.kickoffUtc) || meta.kickoffUtc;
    if (!kickoff) return formatMatchDate(m);
    const d = new Date(kickoff);
    if (Number.isNaN(d.getTime())) return formatMatchDate(m);
    return new Intl.DateTimeFormat(LANG_LOCALES[state.lang] || 'ca-ES', {
      timeZone: userTimeZone(),
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(d);
  }
  function nextColumnLabel(m) {
    if (!m) return t('nextMatchColumn');
    return `${teamShort(m.home)} – ${teamShort(m.away)}`;
  }
  function nextMatchCardHtml(m) {
    const group = translateRound(m.round);
    const time = formatKickoffLocal(m);
    const status = statusLabel(matchStatus(m));
    const score = hasMatchScore(m) ? scoreText(m) : '';
    const detailParts = [group, time, score, status].filter(Boolean);
    return `<div class="next-match-card">
      <div class="next-match-main">
        <strong>${escapeHtml(matchLabel(m))}</strong>
        <span>${escapeHtml(detailParts.join(' · '))}</span>
      </div>
    </div>`;
  }
  function predictionCellHtml(pred) {
    return `<span class="score-pill">${escapeHtml(predictionScoreText(pred))}</span>`;
  }
  function ensureSecondNextHeader() {
    if (!els.nextHeader || document.getElementById('nextPredictionHeader2')) return;
    const th = document.createElement('th');
    th.id = 'nextPredictionHeader2';
    th.textContent = t('nextMatchColumn');
    els.nextHeader.insertAdjacentElement('afterend', th);
  }
  function refreshNextHeaders(comp) {
    const nextMatches = comp && comp.nextMatches ? comp.nextMatches : [];
    if (els.nextHeader) {
      els.nextHeader.textContent = nextMatches[0] ? nextColumnLabel(nextMatches[0]) : t('nextMatchColumn');
    }
    const second = document.getElementById('nextPredictionHeader2');
    if (second) {
      second.textContent = nextMatches[1] ? nextColumnLabel(nextMatches[1]) : t('nextMatchColumn');
    }
  }
  function nextPredictionsHtml(row, comp) {
    const matches = comp.nextMatches || [comp.next].filter(Boolean);
    if (!matches.length) return `<div class="info-card"><span>${escapeHtml(t('nextMatchColumn'))}</span><strong>—</strong></div>`;
    return matches.map((m, idx) => {
      const pred = playerPredictionFor(row, m);
      return `<div class="info-card"><span>${escapeHtml(matchLabel(m))}</span><strong>${escapeHtml(predictionScoreText(pred))}</strong></div>`;
    }).join('');
  }
  function cloneResultsWithout(matchId) {
    const copy = JSON.parse(JSON.stringify(resultats));
    if (matchId && copy.matches && copy.matches[matchId]) {
      copy.matches[matchId] = { homeScore: null, awayScore: null, penHome: null, penAway: null };
    }
    return copy;
  }

  function buildActual(resultsObj) {
    const resultMap = resultsObj.matches || {};
    const groupMatches = data.matches.filter(m => m.type === 'group').map(m => ({ ...m, ...(resultMap[m.id] || {}) }));
    const groups = computeGroups(groupMatches, resultsObj.groupRankingOverrides || {});
    const third = computeThirdPlaces(groups);
    const r32ThirdMap = computeThirdMap(third);
    const allMatches = [];
    for (const gm of groupMatches) {
      allMatches.push({ ...gm, winner: groupWinner(gm) });
    }
    const byId = Object.fromEntries(allMatches.map(m => [m.id, m]));
    for (const tmpl of data.matches.filter(m => m.type === 'knockout')) {
      const base = resultMap[tmpl.id] || {};
      const home = resolveSlot(tmpl.homeSlot, groups, third, r32ThirdMap, byId, 'home');
      const away = resolveSlot(tmpl.awaySlot, groups, third, r32ThirdMap, byId, 'away');
      const km = { ...tmpl, home, away, ...base };
      km.winner = koWinner(km);
      km.loser = koLoser(km);
      byId[km.id] = km;
      allMatches.push(km);
    }
    return { matches: allMatches, byId, groups, third, final: resultsObj.final || {} };
  }

  function groupWinner(m) {
    if (!isMatchFinal(m) || !isNum(m.homeScore) || !isNum(m.awayScore)) return null;
    if (m.homeScore > m.awayScore) return m.home;
    if (m.awayScore > m.homeScore) return m.away;
    return 'Empat';
  }
  function koWinner(m) {
    if (!isMatchFinal(m) || !isNum(m.homeScore) || !isNum(m.awayScore)) return null;
    if (m.homeScore > m.awayScore) return m.home;
    if (m.awayScore > m.homeScore) return m.away;
    if (isNum(m.penHome) && isNum(m.penAway)) {
      if (m.penHome > m.penAway) return m.home;
      if (m.penAway > m.penHome) return m.away;
    }
    return null;
  }
  function koLoser(m) {
    const w = koWinner(m);
    if (!w) return null;
    if (w === m.home) return m.away;
    if (w === m.away) return m.home;
    return null;
  }

  function computeGroups(groupMatches, overrides) {
    const groups = {};
    for (const [g, teams] of Object.entries(data.groups)) {
      const table = Object.fromEntries(teams.map(t => [t, { team: t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }]));
      const matches = groupMatches.filter(m => m.group === g);
      for (const m of matches) {
        if (!isMatchFinal(m) || !isNum(m.homeScore) || !isNum(m.awayScore)) continue;
        const h = table[m.home], a = table[m.away];
        if (!h || !a) continue;
        h.p++; a.p++;
        h.gf += m.homeScore; h.ga += m.awayScore;
        a.gf += m.awayScore; a.ga += m.homeScore;
        if (m.homeScore > m.awayScore) { h.w++; a.l++; h.pts += 3; }
        else if (m.awayScore > m.homeScore) { a.w++; h.l++; a.pts += 3; }
        else { h.d++; a.d++; h.pts += 1; a.pts += 1; }
      }
      Object.values(table).forEach(t => { t.gd = t.gf - t.ga; });
      let arr = Object.values(table);
      arr.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team));
      const override = overrides[g];
      if (Array.isArray(override) && override.length) {
        const order = new Map(override.map((team, idx) => [team, idx]));
        arr.sort((a, b) => (order.has(a.team) ? order.get(a.team) : 999) - (order.has(b.team) ? order.get(b.team) : 999));
      }
      arr.forEach((t, idx) => { t.pos = idx + 1; });
      const complete = matches.length === 6 && matches.every(m => isMatchFinal(m));
      groups[g] = { table: arr, matches, complete };
    }
    return groups;
  }

  function computeThirdPlaces(groups) {
    const rows = Object.entries(groups).map(([g, obj]) => ({ ...obj.table[2], group: g, seed: '3' + g, complete: obj.complete }));
    const sorted = rows.slice().sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team));
    sorted.forEach((t, idx) => { t.thirdRank = idx + 1; t.qualified = idx < 8 && t.complete; });
    return sorted;
  }

  function computeThirdMap(third) {
    const qualified = third.filter(t => t.qualified).map(t => t.group).sort().join('');
    const matrixRow = data.thirdPlaceMatrix[qualified] || {};
    const map = {};
    for (const [paired, seed] of Object.entries(matrixRow)) {
      const team = third.find(t => t.seed === seed && t.qualified);
      if (team) map[paired] = { seed, team: team.team };
    }
    return map;
  }

  function resolveSlot(slot, groups, third, r32ThirdMap, byId) {
    if (!slot) return null;
    if (slot.startsWith('third:')) {
      const paired = slot.split(':')[1];
      return r32ThirdMap[paired] ? r32ThirdMap[paired].team : null;
    }
    const m = slot.match(/^([123])([A-L])$/);
    if (m) {
      const pos = Number(m[1]), g = m[2];
      const group = groups[g];
      if (!group || !group.complete) return slot;
      return group.table[pos - 1] ? group.table[pos - 1].team : null;
    }
    const w = slot.match(/^W(\d+)$/);
    if (w) return byId['M' + w[1]] ? byId['M' + w[1]].winner : slot;
    const l = slot.match(/^L(\d+)$/);
    if (l) return byId['M' + l[1]] ? byId['M' + l[1]].loser : slot;
    return slot;
  }

  function teamSet(matches, keys) {
    const set = new Set();
    for (const key of keys) {
      const m = matches.byId[key];
      if (m) { if (m.home && !isSeedLike(m.home)) set.add(m.home); if (m.away && !isSeedLike(m.away)) set.add(m.away); }
    }
    return set;
  }
  function isSeedLike(v) { return typeof v === 'string' && (/^[123][A-L]$/.test(v) || /^W\d+$/.test(v) || /^L\d+$/.test(v)); }

  function scorePlayer(player, actual) {
    const bd = { '1X2': 0, G1: 0, CTG: 0, GTG: 0, PTG: 0, E16: 0, E16P: 0, G16: 0, E8: 0, E8P: 0, G8: 0, E4: 0, E4P: 0, G4: 0, ES: 0, ESP: 0, GS: 0, EF: 0, EC: 0, GC: 0, '4rt': 0, '3er': 0, GF: 0, '2on': 0, '1er': 0, PCH: 0, GPCH: 0 };
    const pGroupById = Object.fromEntries(player.groupMatches.map(m => [m.id, m]));
    for (const am of actual.matches.filter(m => m.type === 'group')) {
      if (!isMatchFinal(am) || !isNum(am.homeScore) || !isNum(am.awayScore)) continue;
      const pm = pGroupById[am.id];
      if (!pm) continue;
      if (pm.winner === groupWinner(am)) bd['1X2'] += data.rules['1X2'];
      if (pm.homeScore === am.homeScore) bd.G1 += Math.max(data.rules.G1_MIN, am.homeScore);
      if (pm.awayScore === am.awayScore) bd.G1 += Math.max(data.rules.G1_MIN, am.awayScore);
    }
    for (const [g, obj] of Object.entries(actual.groups)) {
      if (!obj.complete) continue;
      const predRows = player.groupStandings[g] || [];
      for (let i = 0; i < 4; i++) {
        const ar = obj.table[i], pr = predRows[i];
        if (!ar || !pr) continue;
        if (pr.team === ar.team) bd.CTG += data.rules.CTG;
        if (pr.gf === ar.gf) bd.GTG += data.rules.GTG;
        if (pr.pts === ar.pts) bd.PTG += data.rules.PTG;
      }
    }
    const pKoById = Object.fromEntries(player.knockoutMatches.map(m => [m.id, m]));
    for (const cfg of Object.values(stageConfig)) {
      const actualSet = teamSet(actual, cfg.keys);
      for (const key of cfg.keys) {
        const am = actual.byId[key], pm = pKoById[key];
        if (!am || !pm) continue;
        for (const side of ['home', 'away']) {
          const pTeam = pm[side];
          const aTeam = am[side];
          if (pTeam && actualSet.has(pTeam)) bd[cfg.team] += cfg.teamPts;
          if (pTeam && aTeam && pTeam === aTeam) bd[cfg.pos] += cfg.posPts;
        }
        if (isMatchFinal(am) && isNum(am.homeScore) && isNum(am.awayScore)) {
          if (pm.homeScore === am.homeScore) bd[cfg.goals] += cfg.goalMin ? Math.max(cfg.goalMin, am.homeScore) : cfg.goalPts;
          if (pm.awayScore === am.awayScore) bd[cfg.goals] += cfg.goalMin ? Math.max(cfg.goalMin, am.awayScore) : cfg.goalPts;
        }
      }
    }
    // Finalists and consolation teams.
    const finalM = actual.byId.M104, consM = actual.byId.M103;
    const pFinal = pKoById.M104, pCons = pKoById.M103;
    if (finalM && pFinal) {
      const finalSet = new Set([finalM.home, finalM.away].filter(Boolean));
      for (const t of [pFinal.home, pFinal.away]) if (finalSet.has(t)) bd.EF += data.rules.EF;
      if (isMatchFinal(finalM) && isNum(finalM.homeScore) && isNum(finalM.awayScore)) {
        if (pFinal.homeScore === finalM.homeScore) bd.GF += data.rules.GF;
        if (pFinal.awayScore === finalM.awayScore) bd.GF += data.rules.GF;
      }
    }
    if (consM && pCons) {
      const consSet = new Set([consM.home, consM.away].filter(Boolean));
      for (const t of [pCons.home, pCons.away]) if (consSet.has(t)) bd.EC += data.rules.EC;
      if (isMatchFinal(consM) && isNum(consM.homeScore) && isNum(consM.awayScore)) {
        if (pCons.homeScore === consM.homeScore) bd.GC += data.rules.GC;
        if (pCons.awayScore === consM.awayScore) bd.GC += data.rules.GC;
      }
    }
    const finalPlayed = finalM && isMatchFinal(finalM) && finalM.winner;
    const thirdPlayed = consM && isMatchFinal(consM) && consM.winner;
    if (thirdPlayed) {
      const third = consM.winner, fourth = consM.loser;
      if (player.summary.third === third) bd['3er'] += data.rules['3er'];
      if (player.summary.fourth === fourth) bd['4rt'] += data.rules['4rt'];
    }
    if (finalPlayed) {
      const champion = finalM.winner, runnerUp = finalM.loser;
      if (player.summary.champion === champion) bd['1er'] += data.rules['1er'];
      if (player.summary.runnerUp === runnerUp) bd['2on'] += data.rules['2on'];
      if (actual.final.topScorer && player.summary.topScorer === actual.final.topScorer) bd.PCH += data.rules.PCH;
      if (isNum(actual.final.topScorerGoals) && player.summary.topScorerGoals === actual.final.topScorerGoals) bd.GPCH += data.rules.GPCH;
    }
    const total = Object.values(bd).reduce((a, b) => a + b, 0);
    return { breakdown: bd, total };
  }

  function computeLeaderboard(resultsObj) {
    const actual = buildActual(resultsObj);
    const rows = data.players.map(player => ({ ...player, ...scorePlayer(player, actual) }));
    rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
    let last = null, rank = 0;
    rows.forEach((r, i) => { if (r.total !== last) { rank = i + 1; last = r.total; } r.rank = rank; });
    return { actual, rows };
  }

  function findLastPlayed(actual) {
    const override = window.PORRA_ULTIM_PARTIT;
    if (override && actual.byId[override]) return actual.byId[override];
    return chronologicalMatches(actual.matches)
      .filter(m => isMatchFinal(m))
      .sort((a, b) => matchChronology(b) - matchChronology(a))[0] || null;
  }
  function findNextMatches(actual, count = 2) {
    // Show the first chronologically non-final matches. If a match is live,
    // it stays here until the API marks it FINISHED/AWARDED.
    return chronologicalMatches(actual.matches)
      .filter(m => !isSeedLike(m.home) && !isSeedLike(m.away) && !isMatchFinal(m))
      .slice(0, count);
  }
  function playerPredictionFor(player, match) {
    if (!match) return null;
    if (match.type === 'group') return player.groupMatches.find(m => m.id === match.id) || null;
    return player.knockoutMatches.find(m => m.id === match.id) || null;
  }
  function translateRound(value) {
    const s = display(value);
    if (s === '—') return s;
    const groupMatch = s.match(/^Grup ([A-L])$/);
    if (groupMatch) return `${t('group')} ${groupMatch[1]}`;
    const map = {
      'Grups': t('groups'), 'Setzens de final': t('r32'), 'Vuitens de final': t('r16'), 'Quarts de final': t('qf'),
      'Semifinals': t('sf'), 'Tercer lloc': t('thirdPlace'), 'Final': t('final')
    };
    return map[s] || s;
  }
  function applyStaticTranslations() {
    document.documentElement.lang = state.lang;
    document.title = `Porra Mundial 2026 - ${t('title')}`;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    if (els.closeDrawer) els.closeDrawer.setAttribute('aria-label', t('close'));
    els.langButtons.forEach(btn => btn.classList.toggle('is-active', btn.dataset.lang === state.lang));
    setupGitHubLinks();
  }
  function inferGitHub() {
    const cfg = window.PORRA_GITHUB || {};
    let username = cfg.username || '';
    let repo = cfg.repo || '';
    const branch = cfg.branch || 'main';
    if ((!username || !repo) && location.hostname.endsWith('.github.io')) {
      username = username || location.hostname.replace(/\.github\.io$/, '');
      const parts = location.pathname.split('/').filter(Boolean);
      repo = repo || parts[0] || `${username}.github.io`;
    }
    if (!username) username = 'pantras';
    if (!repo) repo = 'porra-mundial-2026';
    return { username, repo, branch };
  }
  function setupGitHubLinks() {
    const gh = inferGitHub();
    if (els.githubAccount) {
      els.githubAccount.href = `https://github.com/${gh.username}`;
      els.githubAccount.textContent = `GitHub @${gh.username}`;
    }
    if (els.resultsEdit) {
      els.resultsEdit.href = `https://github.com/${gh.username}/${gh.repo}/edit/${gh.branch}/resultats.js`;
      els.resultsEdit.textContent = t('editResultsFile');
    }
  }
  function setLang(lang) {
    if (!I18N[lang]) return;
    state.lang = lang;
    localStorage.setItem('porraLang', lang);
    applyStaticTranslations();
    if (state.computed) {
      updateFocusMatchHeader(state.computed.nextMatches || []);
      render();
    }
  }

  function movement(row, prevById) {
    const prev = prevById[row.id];
    if (!prev || prev.rank === row.rank) return { cls: 'same', label: '—' };
    const delta = prev.rank - row.rank;
    if (delta > 0) return { cls: 'up', label: `▲ ${delta}` };
    return { cls: 'down', label: `▼ ${Math.abs(delta)}` };
  }

  function init() {
    const current = computeLeaderboard(resultats);
    const last = findLastPlayed(current.actual);
    const previous = computeLeaderboard(cloneResultsWithout(last && last.id));
    const prevById = Object.fromEntries(previous.rows.map(r => [r.id, r]));
    const nextMatches = findNextMatches(current.actual, 2);
    const next = nextMatches[0] || null;
    state.computed = { ...current, previous, prevById, last, next, nextMatches };
    applyStaticTranslations();
    ensureSecondNextHeader();
    updateFocusMatchHeader(nextMatches);
    const generated = data.meta && data.meta.generatedAt ? new Date(data.meta.generatedAt).toLocaleString(LANG_LOCALES[state.lang] || 'ca-ES') : 'snapshot';
    els.status.textContent = t('initialData', { date: generated });
    render();
  }

  function render() {
    const comp = state.computed;
    ensureSecondNextHeader();
    refreshNextHeaders(comp);
    const q = state.filter.trim().toLowerCase();
    const rows = comp.rows.filter(row => !q || row.name.toLowerCase().includes(q));
    if (!rows.length) {
      els.body.innerHTML = `<tr><td colspan="8" class="empty">${escapeHtml(t('noPlayerFound'))}</td></tr>`;
      return;
    }
    els.body.innerHTML = rows.map(row => rowHtml(row, comp)).join('');
    els.body.querySelectorAll('tr[data-player]').forEach(tr => {
      tr.addEventListener('click', () => openPlayer(tr.dataset.player));
      tr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlayer(tr.dataset.player); } });
    });
  }
  function rowHtml(row, comp) {
    const m = movement(row, comp.prevById);
    const nextMatches = comp.nextMatches || [comp.next].filter(Boolean);
    const nextPred1 = playerPredictionFor(row, nextMatches[0]);
    const nextPred2 = playerPredictionFor(row, nextMatches[1]);
    return `<tr data-player="${escapeHtml(row.id)}" tabindex="0">
      <td><span class="rank-pill">#${escapeHtml(row.rank)}</span></td>
      <td><span class="move ${m.cls}">${escapeHtml(m.label)}</span></td>
      <td><span class="participant-cell participant-cell--plain">${escapeHtml(row.name)}</span></td>
      <td class="num"><strong>${escapeHtml(row.total)}</strong></td>
      <td class="prediction-cell">${predictionCellHtml(nextPred1)}</td>
      <td class="prediction-cell">${predictionCellHtml(nextPred2)}</td>
      <td>${escapeHtml(teamDisplay(row.summary.champion))}</td>
      <td>${escapeHtml(teamDisplay(row.summary.topScorer))}</td>
    </tr>`;
  }
  function openPlayer(id) {
    const comp = state.computed;
    const row = comp.rows.find(r => r.id === id);
    if (!row) return;
    els.drawerTitle.textContent = row.name;
    els.drawerRank.textContent = `#${row.rank}`;
    els.drawerSubtitle.textContent = `${row.total} ${t('points')} · ${row.groupMatches.length + row.knockoutMatches.length} ${t('matchPredictions')}`;
    els.drawerContent.innerHTML = `
      <div class="info-grid">
        <div class="info-card"><span>${escapeHtml(t('champion'))}</span><strong>${escapeHtml(teamDisplay(row.summary.champion))}</strong></div>
        <div class="info-card"><span>${escapeHtml(t('finalist'))}</span><strong>${escapeHtml(teamDisplay(row.summary.runnerUp))}</strong></div>
        <div class="info-card"><span>${escapeHtml(t('third'))}</span><strong>${escapeHtml(teamDisplay(row.summary.third))}</strong></div>
        <div class="info-card"><span>${escapeHtml(t('topScorer'))}</span><strong>${escapeHtml(teamDisplay(row.summary.topScorer))}${row.summary.topScorerGoals ? ` · ${escapeHtml(row.summary.topScorerGoals)} ${escapeHtml(t('goals'))}` : ''}</strong></div>
      </div>
      <div class="drawer-section"><h3>${escapeHtml(t('nextPredictionTitle'))}</h3><div class="next-prediction-grid">${nextPredictionsHtml(row, comp)}</div></div>
      <div class="drawer-section"><h3>${escapeHtml(t('pointsBreakdown'))}</h3><div class="breakdown">${Object.entries(row.breakdown).map(([k, v]) => `<span>${escapeHtml(k)} <strong>${escapeHtml(v)}</strong></span>`).join('')}</div></div>
      <div class="drawer-section"><h3>${escapeHtml(t('matchPredictionsTitle'))}</h3>${matchesTable(row)}</div>`;
    els.drawer.classList.add('is-open');
    els.drawer.setAttribute('aria-hidden', 'false');
  }
  function matchesTable(row) {
    const matches = chronologicalMatches([...row.groupMatches, ...row.knockoutMatches]);
    const body = matches.map(m => `<tr><td>${escapeHtml(formatMatchDate(m))}</td><td>${escapeHtml(translateRound(m.round))}</td><td>${escapeHtml(display(m.home))} vs ${escapeHtml(display(m.away))}</td><td><span class="score-pill">${escapeHtml(predictionScoreText(m))}</span></td><td>${escapeHtml(display(m.winner))}</td></tr>`).join('');
    return `<div class="table-wrap"><table class="pred-table"><thead><tr><th>${escapeHtml(t('date'))}</th><th>${escapeHtml(t('stage'))}</th><th>${escapeHtml(t('match'))}</th><th>${escapeHtml(t('result'))}</th><th>${escapeHtml(t('winner'))}</th></tr></thead><tbody>${body}</tbody></table></div>`;
  }
  function closeDrawer() { els.drawer.classList.remove('is-open'); els.drawer.setAttribute('aria-hidden', 'true'); }
  els.langButtons.forEach(btn => btn.addEventListener('click', () => setLang(btn.dataset.lang)));
  els.search.addEventListener('input', e => { state.filter = e.target.value; render(); });
  els.closeDrawer.addEventListener('click', closeDrawer);
  els.drawer.addEventListener('click', e => { if (e.target === els.drawer) closeDrawer(); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
