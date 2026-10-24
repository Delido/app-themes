// Erzeugt die Aurora-Themes fuer Raycast (Theme Studio, Pro) als JSON + Import-Links.
// Format wie themes.ray.so: raycast://theme?...&colors=<12 Farben in fester Reihenfolge>
//   node build.js

const fs = require('fs');
const path = require('path');

const VARIANTS = {
  ice:    { name: 'Ice',    a: '#3b82f6', b: '#22d3ee' },
  mint:   { name: 'Mint',   a: '#14b8a6', b: '#818cf8' },
  violet: { name: 'Violet', a: '#8b5cf6', b: '#22d3ee' },
  ember:  { name: 'Ember',  a: '#f97316', b: '#f43f5e' },
  rose:   { name: 'Rose',   a: '#ec4899', b: '#a855f7' },
};

const ORDER = ['background', 'backgroundSecondary', 'text', 'selection', 'loader',
  'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'magenta'];

function theme(v) {
  return {
    author: 'Sebastian Mendyka',
    authorUsername: 'delido',
    version: '1',
    name: `Aurora ${v.name}`,
    appearance: 'dark',
    colors: {
      background: '#0a0c12',          // --au-1
      backgroundSecondary: '#171b26', // --au-4
      text: '#e6e8ef',
      selection: v.a,
      loader: v.b,
      red: '#f43f5e',
      orange: '#fb923c',
      yellow: '#fbbf24',
      green: '#34d399',
      blue: '#60a5fa',
      purple: '#a78bfa',
      magenta: '#f472b6',
    },
  };
}

function importUrl(t) {
  const { colors, ...rest } = t;
  const params = Object.entries(rest).map(([k, val]) => `${encodeURIComponent(k)}=${encodeURIComponent(val)}`);
  params.push(`colors=${ORDER.map(k => encodeURIComponent(colors[k])).join(',')}`);
  return `raycast://theme?${params.join('&')}`;
}

const dir = path.join(__dirname, 'themes');
fs.mkdirSync(dir, { recursive: true });
const links = [];
for (const [id, v] of Object.entries(VARIANTS)) {
  const t = theme(v);
  fs.writeFileSync(path.join(dir, `aurora-${id}.json`), JSON.stringify(t, null, 2) + '\n');
  links.push(`| ${t.name} | \`${importUrl(t)}\` |`);
}
fs.writeFileSync(path.join(__dirname, 'links.md'), '| Theme | Import-Link |\n|---|---|\n' + links.join('\n') + '\n');
console.log(links.join('\n'));
