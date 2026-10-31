// Aurora fuer Windows Terminal: Farbschema + Fenster-Theme (Tab-Leiste) je Variante.
// Traegt alle Varianten in die settings.json ein und setzt die gewaehlte als Standard.
// Farben wie das Terminal im VS-Code-Theme (vscode/build.js).
//   node build.js [--variant ice] [--install]

const fs = require('fs');
const path = require('path');

const SETTINGS = path.join(process.env.LOCALAPPDATA, 'Packages',
  'Microsoft.WindowsTerminal_8wekyb3d8bbwe', 'LocalState', 'settings.json');

const VARIANTS = {
  ice:    { name: 'Ice',    a: '#3b82f6', b: '#22d3ee' },
  mint:   { name: 'Mint',   a: '#14b8a6', b: '#818cf8' },
  violet: { name: 'Violet', a: '#8b5cf6', b: '#22d3ee' },
  ember:  { name: 'Ember',  a: '#f97316', b: '#f43f5e' },
  rose:   { name: 'Rose',   a: '#ec4899', b: '#a855f7' },
};
const argVal = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const VARIANT = argVal('--variant') || 'ice';
if (!VARIANTS[VARIANT]) throw new Error(`Unbekannte Variante "${VARIANT}", erlaubt: ${Object.keys(VARIANTS).join(', ')}`);

// Aurora-Flaechen (--au-0 .. --au-5)
const AU = ['#06070b', '#0a0c12', '#0e1118', '#12151e', '#171b26', '#1d2230'];

function scheme(v) {
  return {
    name: `Aurora ${v.name}`,
    background: AU[1],
    foreground: '#d8dbe5',
    cursorColor: v.b,
    selectionBackground: v.a,
    black: AU[3],
    red: '#fb7185',
    green: '#34d399',
    yellow: '#fbbf24',
    blue: '#60a5fa',
    purple: '#c084fc',
    cyan: '#22d3ee',
    white: '#d8dbe5',
    brightBlack: '#4c5263',
    brightRed: '#fda4af',
    brightGreen: '#6ee7b7',
    brightYellow: '#fde68a',
    brightBlue: '#93c5fd',
    brightPurple: '#d8b4fe',
    brightCyan: '#67e8f9',
    brightWhite: '#ffffff',
  };
}

// Tab-Leiste in au-0, aktiver Tab verschmilzt mit dem Terminal-Hintergrund
function theme(v) {
  return {
    name: `Aurora ${v.name}`,
    window: { applicationTheme: 'dark', useMica: false },
    tabRow: { background: AU[0], unfocusedBackground: AU[0] },
    tab: { background: 'terminalBackground', unfocusedBackground: AU[0], showCloseButton: 'hover' },
  };
}

const outDir = path.join(__dirname, 'themes');
fs.mkdirSync(outDir, { recursive: true });
for (const [id, v] of Object.entries(VARIANTS)) {
  fs.writeFileSync(path.join(outDir, `aurora-${id}.json`),
    JSON.stringify({ scheme: scheme(v), theme: theme(v) }, null, 2) + '\n');
}
console.log(`${Object.keys(VARIANTS).length} Varianten nach ${outDir}`);

if (process.argv.includes('--install')) {
  const raw = fs.readFileSync(SETTINGS, 'utf8');
  const backup = path.join(__dirname, 'backup', 'settings.json');
  if (!fs.existsSync(backup)) { // nur beim ersten Mal, damit das Original erhalten bleibt
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.writeFileSync(backup, raw);
    console.log(`Backup angelegt: ${backup}`);
  }
  const s = JSON.parse(raw); // Terminal schreibt reines JSON, Kommentare wuerden hier auffallen
  const upsert = (list, items) => [...(list || []).filter(x => !items.some(i => i.name === x.name)), ...items];
  s.schemes = upsert(s.schemes, Object.values(VARIANTS).map(scheme));
  s.themes = upsert(s.themes, Object.values(VARIANTS).map(theme));
  s.theme = `Aurora ${VARIANTS[VARIANT].name}`;
  s.profiles.defaults = { ...s.profiles.defaults, colorScheme: `Aurora ${VARIANTS[VARIANT].name}` };
  fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 4) + '\n');
  console.log(`Installiert: Schema + Theme "Aurora ${VARIANTS[VARIANT].name}" (Terminal laedt sofort neu)`);
}
