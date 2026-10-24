// Erzeugt "Win32 UI Modernizer (Aurora)" - einen lokalen Windhawk-Mod auf Basis von
// win32-ui-modernizer (crazyboyybs, ramensoftware/windhawk-mods). Geaendert werden nur die
// dunklen Flaechen-Tokens, damit Explorer-Dateiliste, Navigation, Dialoge und Menues die
// Aurora-Flaechen bekommen statt Windows-Grau. Der Akzent kommt ueber die Mod-Einstellung.
//
//   node build-modernizer.js            -> holt die aktuelle Upstream-Version
//   node build-modernizer.js <datei>    -> nimmt eine lokale Quelldatei

const fs = require('fs');
const path = require('path');

const UPSTREAM = 'https://raw.githubusercontent.com/ramensoftware/windhawk-mods/main/mods/win32-ui-modernizer.wh.cpp';
const OUT = path.join(__dirname, 'win32-ui-modernizer-aurora.wh.cpp');

// Aurora-Flaechen (--au-0 .. --au-5)
const rgb = hex => `RGB(0x${hex.slice(1, 3)}, 0x${hex.slice(3, 5)}, 0x${hex.slice(5, 7)})`;
const AU = { 0: '#06070b', 1: '#0a0c12', 2: '#0e1118', 3: '#12151e', 4: '#171b26', 5: '#1d2230' };

// WinUI-Token -> neuer Dunkel-Wert (nur der erste, dunkle RGB-Wert der X()-Zeile)
const TOKENS = {
  SolidBackgroundFillColorBase:        AU[2],     // Dateiliste, Basis aller Fuellungen
  SolidBackgroundFillColorTransparent: AU[2],
  SolidBackgroundFillColorSecondary:   AU[1],
  SolidBackgroundFillColorTertiary:    AU[3],
  SolidBackgroundFillColorQuarternary: AU[4],     // schwebende Flaechen (Menues, Tooltips)
  SolidBackgroundFillColorQuinary:     AU[5],
  SolidBackgroundFillColorSenary:      '#232938',
  SolidBackgroundFillColorBaseAlt:     AU[0],
  LayerOnMicaBaseAltFillColorTertiary: AU[4],
  ControlSolidFillColorDefault:        '#2a3042',
};

function patch(src) {
  const replace = (label, re, to) => {
    const n = (src.match(new RegExp(re.source, re.flags + 'g')) || []).length;
    if (n !== 1) throw new Error(`${label}: ${n} Treffer statt 1 - Upstream hat sich geaendert, Muster pruefen`);
    src = src.replace(re, to);
  };

  replace('@id', /^\/\/ @id\s+win32-ui-modernizer$/m, '// @id              win32-ui-modernizer-aurora');
  replace('@name', /^\/\/ @name\s+Win32 UI Modernizer$/m, '// @name            Win32 UI Modernizer (Aurora)');

  for (const [token, hex] of Object.entries(TOKENS)) {
    replace(token, new RegExp(`(X\\(${token},\\s*)RGB\\([^)]*\\)`), `$1${rgb(hex)}`);
  }
  // Navigation / klassische Shell-Flaeche (DarkMode::ItemsView, ExplorerNavPane)
  replace('ExplorerDarkColor',
    /static constexpr COLORREF ExplorerDarkColor = RGB\([^)]*\);/,
    `static constexpr COLORREF ExplorerDarkColor = ${rgb(AU[1])};`);
  // Upstream prueft die abgeleiteten Grauwerte per static_assert gegen Windows-Messwerte -
  // die aendern sich hier absichtlich mit
  for (const name of ['kElevatedPaneDark', 'kFilePickerChromeDark', 'kRgDkLVBk']) {
    replace(`static_assert ${name}`,
      new RegExp(`^static_assert\\(${name} == RGB\\([^)]*\\)\\);`, 'm'),
      m => `// Aurora: ${m}`);
  }
  // Desktop-Icon-Liste nicht doppelt puffern: mit einem Hintergrund-Fenster (Lively) dahinter
  // kann sie den Hintergrund nicht selbst nachzeichnen -> Markierungsrahmen unsichtbar bzw. Streifen
  replace('ListView double-buffer',
    /\/\/ ListView — enable double-buffer \(modern marquee selection\)\n    if \(isListView\) \{/,
    '// ListView — enable double-buffer (modern marquee selection)\n' +
    '    // Aurora: nicht auf dem Desktop (Lively-Hintergrund -> Markierung unsichtbar/Streifen)\n' +
    '    if (isListView && !IsInsideDesktop(hwnd)) {');
  // Die Desktop-Icon-Liste zeichnet ihren Markierungsrahmen per DrawFocusRect (XOR, zweiter Aufruf
  // loescht). Upstream unterdrueckt das fuer SysListView32 (unsichtbar) bzw. ersetzt es durch einen
  // nicht-XOR-Rahmen (Streifen) -> auf dem Desktop immer die Original-Funktion nehmen
  replace('DrawFocusRect desktop',
    /(BOOL WINAPI DrawFocusRect_hook\(HDC hdc, CONST RECT\* lprc\)\n\{[\s\S]*?GetClassNameW\(hwnd, cls, ARRAYSIZE\(cls\)\);\n)/,
    '$1\n' +
    '        // Aurora: Markierungsrahmen auf dem Desktop nativ lassen\n' +
    '        if (_wcsicmp(cls, L"SysListView32") == 0 && IsInsideDesktop(hwnd))\n' +
    '            [[clang::musttail]] return DrawFocusRect_orig(hdc, lprc);\n');
  // Basis der "Fake Mica"-Faerbung
  replace('micaBase',
    /const COLORREF micaBase = dark \? RGB\(0x16, 0x16, 0x16\)/,
    `const COLORREF micaBase = dark ? ${rgb(AU[1])}`);

  return `// Aurora-Fork, erzeugt von app-themes/windows/build-modernizer.js am ${new Date().toISOString().slice(0, 10)}.\n` + src;
}

(async () => {
  const src = process.argv[2]
    ? fs.readFileSync(process.argv[2], 'utf8')
    : await (await fetch(UPSTREAM)).text();
  const version = (src.match(/^\/\/ @version\s+(\S+)/m) || [])[1];
  fs.writeFileSync(OUT, patch(src));
  console.log(`Basis win32-ui-modernizer ${version} -> ${path.basename(OUT)}`);
})().catch(e => { console.error(e.message); process.exit(1); });
