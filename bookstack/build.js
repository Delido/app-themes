// Aurora-Generator fuer BookStack
// BookStack hat CSS-Variablen nur fuer Akzent- und Statusfarben; Hintergruende, Karten,
// Texte und Raender sind im Dark-Mode fest eingetragen. Dieses Skript liest BookStacks
// styles.css, bildet jede dieser Farben auf die Aurora-Palette ab und schreibt
// aurora-head.html (Inhalt fuer "Benutzerdefinierter HTML-Head-Inhalt").
// Nach BookStack-Updates erneut ausfuehren:
//   node build.js --url https://wiki.example.org [--variant ice]
//   node build.js --css styles.css [--variant ice]

const fs = require('fs');
const path = require('path');

const HERE = __dirname;

// ---- Palette ---------------------------------------------------------------
const VARIANTS = {
  ice:    { a: '#3b82f6', b: '#22d3ee', light: '#93c5fd' },
  mint:   { a: '#14b8a6', b: '#818cf8', light: '#99f6e4' },
  violet: { a: '#8b5cf6', b: '#22d3ee', light: '#c4b5fd' },
  ember:  { a: '#f97316', b: '#f43f5e', light: '#fdba74' },
  rose:   { a: '#ec4899', b: '#a855f7', light: '#f9a8d4' },
};
const argVal = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const VARIANT = argVal('--variant') || 'ice';
if (!VARIANTS[VARIANT]) throw new Error(`Unbekannte Variante "${VARIANT}", erlaubt: ${Object.keys(VARIANTS).join(', ')}`);

// BookStack-Grautoene -> Aurora, getrennt nach Einsatz (Flaeche, Rand, Text)
const BG = {
  '#000000': 'var(--au-0)', '#111111': 'var(--au-2)', '#222222': 'var(--au-3)', '#292929': 'var(--au-5)',
  '#2b2b2b': 'var(--au-1)', '#2d2d2d': 'var(--au-4)', '#313335': 'var(--au-4)', '#333333': 'var(--au-4)',
  '#444444': 'var(--au-5)', '#555555': 'var(--au-line-strong)', '#666666': 'rgba(255,255,255,.16)',
  '#001825': 'color-mix(in srgb, var(--color-info) 12%, var(--au-3))',
  '#122913': 'color-mix(in srgb, var(--color-positive) 12%, var(--au-3))',
  '#250505': 'color-mix(in srgb, var(--color-negative) 12%, var(--au-3))',
  '#30170a': 'color-mix(in srgb, var(--color-warning) 12%, var(--au-3))',
};
const BORDER = {
  '#000000': 'var(--au-line)', '#111111': 'var(--au-line)', '#333333': 'var(--au-line-strong)',
  '#444444': 'var(--au-line-strong)', '#555555': 'rgba(255,255,255,.14)', '#666666': 'rgba(255,255,255,.18)',
  '#0288d1': 'var(--color-info)', '#4aa850': 'var(--color-positive)', '#de8a5a': 'var(--color-warning)',
  '#e85c5b': 'var(--color-negative)',
};
const TEXT = {
  '#aaaaaa': 'var(--au-text)', '#bbbbbb': 'var(--au-text-strong)', '#cccccc': 'var(--au-text)',
  '#dddddd': 'var(--au-text)', '#eeeeee': 'var(--au-text-strong)', '#888888': 'var(--au-text-secondary)',
  '#999999': 'var(--au-text-muted)', '#666666': 'var(--au-text-disabled)', '#dbdbdb': 'var(--au-text-muted)',
  '#111111': 'var(--au-3)', '#0288d1': 'var(--color-info)', '#4aa850': 'var(--color-positive)',
  '#de8a5a': 'var(--color-warning)', '#e85c5b': 'var(--color-negative)',
};
const SPECIAL = {
  'rgba(80,80,80,.85)': 'rgba(29,34,48,.88)',
  'rgb(17, 17, 17)': 'rgb(14, 17, 24)',
  'rgba(17, 17, 17, 0)': 'rgba(14, 17, 24, 0)',
};

function tableFor(prop) {
  if (prop === 'color' || prop === 'fill') return TEXT;
  if (prop.startsWith('border') || prop === 'outline-color') return BORDER;
  return BG; // background*, box-shadow
}

const unmapped = new Set();

function mapValue(prop, value) {
  let out = value;
  for (const [k, v] of Object.entries(SPECIAL)) out = out.split(k).join(v);
  const table = tableFor(prop);
  out = out.replace(/#[0-9a-fA-F]{3,6}\b/g, m => {
    let hx = m.slice(1).toLowerCase();
    if (hx.length === 3) hx = hx.split('').map(c => c + c).join('');
    const mapped = table['#' + hx];
    if (!mapped) unmapped.add(`${prop}: #${hx}`);
    return mapped || m;
  });
  return out === value ? null : out;
}

// ---- Minimaler CSS-Parser (wie steam/build.js) -------------------------------
// Liefert Regeln als { wrappers: ['@media ...'], selector, body }.
function* parseRules(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const stack = [];
  let i = 0, start = 0;
  while (i < css.length) {
    const ch = css[i];
    if (ch === '"' || ch === "'") {
      const end = css.indexOf(ch, i + 1);
      i = end < 0 ? css.length : end + 1;
      continue;
    }
    if (ch === '{') {
      const prelude = css.slice(start, i).trim();
      if (/^@(media|supports|container|layer)/.test(prelude)) {
        stack.push(prelude);
        i++; start = i;
        continue;
      }
      let depth = 1, j = i + 1;
      while (j < css.length && depth > 0) {
        const c = css[j];
        if (c === '"' || c === "'") { const e = css.indexOf(c, j + 1); j = e < 0 ? css.length : e + 1; continue; }
        if (c === '{') depth++;
        else if (c === '}') depth--;
        j++;
      }
      if (!prelude.startsWith('@')) yield { wrappers: [...stack], selector: prelude, body: css.slice(i + 1, j - 1) };
      i = j; start = i;
      continue;
    }
    if (ch === '}') {
      stack.pop();
      i++; start = i;
      continue;
    }
    if (ch === ';' && css.slice(start, i).trim().startsWith('@')) { i++; start = i; continue; }
    i++;
  }
}

// Trennt an Kommas/Semikolons ausserhalb von Klammern
function splitTop(s, sep) {
  const parts = [];
  let depth = 0, cur = '';
  for (const c of s) {
    if (c === '(') depth++;
    else if (c === ')') depth--;
    if (c === sep && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
}

// ---- Generierung -----------------------------------------------------------------
function generate(css) {
  // data:-URLs enthalten Hex-Farben, die keine CSS-Farben sind
  css = css.replace(/url\("data:[^"]*"\)/g, 'url()');
  const out = [];
  const groups = new Map(); // @media-Prelude -> Regeln, Reihenfolge bleibt erhalten
  for (const rule of parseRules(css)) {
    if (!rule.selector.includes('dark-mode')) continue;
    const changed = [];
    for (const d of splitTop(rule.body, ';')) {
      const idx = d.indexOf(':');
      if (idx < 0) continue;
      const prop = d.slice(0, idx).trim().toLowerCase();
      if (prop.startsWith('--') || prop === 'color-scheme') continue;
      const mapped = mapValue(prop, d.slice(idx + 1).trim());
      if (mapped) changed.push(`${prop}:${mapped}`);
    }
    if (!changed.length) continue;
    // html.dark-mode / .dark-mode -> :root.dark-mode, damit die Regel sicher gewinnt
    const selector = splitTop(rule.selector, ',')
      .map(p => p.trim().replace(/^(html)?\.dark-mode/, ':root.dark-mode'))
      .join(',');
    const line = `${selector}{${changed.join(';')}}`;
    const key = rule.wrappers.join(' ');
    if (!key) { out.push(line); continue; }
    if (!groups.has(key)) { groups.set(key, []); out.push({ key }); }
    groups.get(key).push(line);
  }
  const lines = out.map(o => typeof o === 'string' ? o : `${o.key}{\n${groups.get(o.key).join('\n')}\n}`);
  const count = out.reduce((n, o) => n + (typeof o === 'string' ? 1 : groups.get(o.key).length), 0);
  return { css: lines.join('\n'), count };
}

function paletteCss() {
  const { a, b, light } = VARIANTS[VARIANT];
  return `:root.dark-mode {
  /* Aurora ${VARIANT} */
  --au-accent: ${a};
  --au-accent-2: ${b};
  --au-accent-light: ${light};

  --au-0: #06070b; --au-1: #0a0c12; --au-2: #0e1118;
  --au-3: #12151e; --au-4: #171b26; --au-5: #1d2230;
  --au-line: rgba(255,255,255,.06);
  --au-line-strong: rgba(255,255,255,.10);
  --au-text-strong: #eceef4; --au-text: #e6e8ef; --au-text-muted: #a3a9ba;
  --au-text-secondary: #7d8499; --au-text-disabled: #565d70;
  --au-glow: 0 0 0 1px color-mix(in srgb, var(--au-accent) 45%, transparent),
             0 6px 24px -6px color-mix(in srgb, var(--au-accent) 55%, transparent);

  --color-primary: var(--au-accent);
  --color-primary-light: color-mix(in srgb, var(--au-accent) 15%, transparent);
  --color-link: var(--au-accent-light);
  --editor-color-primary: var(--au-accent);
  /* Inhaltstypen: die fuenf hellen Aurora-Akzente, unabhaengig von der Variante */
  --color-bookshelf: #f9a8d4;
  --color-book: #99f6e4;
  --color-chapter: #fdba74;
  --color-page: #93c5fd;
  --color-page-draft: #c4b5fd;
  --color-positive: #34d399;
  --color-warning: #fbbf24;
  --color-negative: #f43f5e;
  --color-info: #93c5fd;
  --font-body: "Segoe UI Variable Text", "Segoe UI", sans-serif;
  --font-heading: var(--font-body);
}
`;
}

async function loadCss() {
  const file = argVal('--css');
  if (file) return { css: fs.readFileSync(file, 'utf8'), version: 'lokale styles.css' };
  const url = (argVal('--url') || process.env.BOOKSTACK_URL || '').replace(/\/+$/, '');
  if (!url) throw new Error('Quelle fehlt: --url https://wiki.example.org oder --css styles.css');
  const login = await (await fetch(`${url}/login`)).text();
  const m = login.match(/dist\/styles\.css\?version=([\w.-]+)/);
  const css = await (await fetch(`${url}/dist/styles.css${m ? `?version=${m[1]}` : ''}`)).text();
  return { css, version: m ? `BookStack ${m[1]}` : url };
}

(async () => {
  const { css: source, version } = await loadCss();
  const { css, count } = generate(source);
  const base = fs.readFileSync(path.join(HERE, 'base.css'), 'utf8');
  const stamp = `generiert von build.js am ${new Date().toISOString().slice(0, 10)} aus ${version}, Variante ${VARIANT}`;
  const result = `<!-- Aurora für BookStack – ${stamp} (${count} Regeln).
     Einfügen unter: Einstellungen → Anpassung → "Benutzerdefinierter HTML-Head-Inhalt".
     Wirkt im Dunklen Modus. Nicht von Hand bearbeiten, base.css ändern und neu bauen. -->
<style id="aurora-theme">
${paletteCss()}
/* ---- generierte Farb-Overrides ---- */
${css}

${base}</style>
`;
  fs.writeFileSync(path.join(HERE, 'aurora-head.html'), result);
  console.log(`Variante ${VARIANT}: ${count} Regeln erzeugt, ${(result.length / 1024).toFixed(0)} KB`);
  if (unmapped.size) console.log(`Unveraendert gelassen: ${[...unmapped].join(', ')}`);
})().catch(e => { console.error(e.message); process.exit(1); });
