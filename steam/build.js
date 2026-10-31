// Nocturne-Generator
// Liest Steams eigene CSS-Dateien, rechnet deren fest eingetragene Farben auf die
// Nocturne-Palette um und schreibt Overrides nach libraryroot.custom.css / friends.custom.css.
// Nach Steam-Updates einfach erneut ausfuehren:  node build.js [--variant ice] [--install]

const fs = require('fs');
const path = require('path');

const STEAM = process.env.STEAM_PATH || 'C:\\Program Files (x86)\\Steam';
const SRC_DIR = path.join(STEAM, 'steamui', 'css');
const THEME_DIR = path.join(STEAM, 'millennium', 'themes', 'Nocturne');
const HERE = __dirname;

// ---- Palette ---------------------------------------------------------------
// Abgestimmt auf das TeamSpeak-Theme "Aurora" (com.mendyka.aurora): gleiche Flaechen
// (--au-0 .. --au-5) und gleiche Akzent-Paare (--au-a -> --au-b) je Variante.
// Steam-Schiefer (blaugrau, dunkel)  -> Aurora-Deep-Space
// Steam-Blau (Akzent)                -> Akzent A
// Play-Gruen                         -> Akzent B
// kuehles Grau (Texte)               -> Aurora-Grau
const VARIANTS = {
  ice:    { a: '#3b82f6', b: '#22d3ee' },
  mint:   { a: '#14b8a6', b: '#818cf8' },
  violet: { a: '#8b5cf6', b: '#22d3ee' },
  ember:  { a: '#f97316', b: '#f43f5e' },
  rose:   { a: '#ec4899', b: '#a855f7' },
};
const argVal = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const VARIANT = argVal('--variant') || 'ice';
if (!VARIANTS[VARIANT]) throw new Error(`Unbekannte Variante "${VARIANT}", erlaubt: ${Object.keys(VARIANTS).join(', ')}`);

const SLATE = { h: 225, s: 0.25, lScale: 0.5 };
const GREY = { h: 220, s: 0.12 };

const COLOR_PROPS = new Set([
  'color', 'background', 'background-color', 'background-image',
  'border', 'border-color', 'border-top', 'border-bottom', 'border-left', 'border-right',
  'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color',
  'outline', 'outline-color', 'box-shadow', 'fill', 'stroke', 'caret-color',
  'text-decoration-color', 'scrollbar-color',
]);

// ---- Farbumrechnung ----------------------------------------------------------
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
}

function hslToRgb(h, s, l) {
  h /= 360;
  const f = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) return [l, l, l].map(v => Math.round(v * 255));
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)].map(v => Math.round(v * 255));
}

const hexToRgb = hx => [1, 3, 5].map(i => parseInt(hx.slice(i, i + 2), 16));
const ACCENT = rgbToHsl(...hexToRgb(VARIANTS[VARIANT].a));
const ACCENT_B = rgbToHsl(...hexToRgb(VARIANTS[VARIANT].b));

// Liefert [r,g,b] der Nocturne-Variante oder null, wenn die Farbe bleiben soll.
function mapRgb(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b);
  const coolHue = h >= 190 && h <= 235;

  // Steam-Blau: kraeftig, mittlere Helligkeit -> Akzent A, Helligkeitsstufen bleiben erhalten
  if (coolHue && s >= 0.55 && l >= 0.3 && l <= 0.8) return hslToRgb(ACCENT.h, ACCENT.s, ACCENT.l + (l - 0.55) * 0.6);
  // Play-Button-Gruen (#59bf40, #70d61d ...) -> Akzent B
  if (h >= 85 && h <= 125 && s >= 0.5 && l >= 0.35 && l <= 0.6) return hslToRgb(ACCENT_B.h, ACCENT_B.s, ACCENT_B.l + (l - 0.5) * 0.6);
  // Schiefer-Hintergruende
  if (coolHue && s <= 0.45 && l < 0.4) return hslToRgb(SLATE.h, SLATE.s, l * SLATE.lScale);
  // kuehle Grautoene (Sekundaertext, Icons)
  if (coolHue && s <= 0.3 && l >= 0.4 && l <= 0.92) return hslToRgb(GREY.h, GREY.s, l);
  return null;
}

const hex2 = v => v.toString(16).padStart(2, '0');

function mapValue(value) {
  let changed = false;
  let out = value.replace(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g, (m, hx) => {
    if (hx.length <= 4) hx = hx.split('').map(c => c + c).join('');
    const r = parseInt(hx.slice(0, 2), 16), g = parseInt(hx.slice(2, 4), 16), b = parseInt(hx.slice(4, 6), 16);
    const mapped = mapRgb(r, g, b);
    if (!mapped) return m;
    changed = true;
    return '#' + mapped.map(hex2).join('') + (hx.length === 8 ? hx.slice(6) : '');
  });
  out = out.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[\d.]+%?\s*)?\)/g, (m, r, g, b, a) => {
    const mapped = mapRgb(+r, +g, +b);
    if (!mapped) return m;
    changed = true;
    return a ? `rgba(${mapped.join(', ')}${a.replace(/\s+$/, '')})` : `rgb(${mapped.join(', ')})`;
  });
  return changed ? out : null;
}

// ---- Minimaler CSS-Parser ----------------------------------------------------
// Liefert Regeln als { wrappers: ['@media ...'], selector, body }.
function* parseRules(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const stack = [];
  let i = 0, start = 0;
  while (i < css.length) {
    const ch = css[i];
    if (ch === '\\') { i += 2; continue; } // maskierte Zeichen wie "KeyTheme_\{" sind Teil des Selektors
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
      // Normale Regel (oder @keyframes/@font-face): bis zur passenden Klammer lesen
      let depth = 1, j = i + 1;
      while (j < css.length && depth > 0) {
        const c = css[j];
        if (c === '\\') { j += 2; continue; }
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
    if (ch === ';' && css.slice(start, i).trim().startsWith('@')) { i++; start = i; continue; } // @import, @charset
    i++;
  }
}

function splitDecls(body) {
  const decls = [];
  let depth = 0, cur = '';
  for (const c of body) {
    if (c === '(') depth++;
    else if (c === ')') depth--;
    if (c === ';' && depth === 0) { decls.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) decls.push(cur);
  return decls;
}

// ---- Klassennamen aufloesen ----------------------------------------------------------
// Steams JS enthaelt Objekte wie {GameListEntryName:"_2SXJ...",Selected:"_1UBp..."}.
// In base.css steht {{Name}} bzw. {{Name@Nachbar}} (Name aus dem Objekt, das auch Nachbar enthaelt)
// und wird hier durch den aktuellen Hash ersetzt - so ueberleben die Regeln Steam-Updates.
function loadClassMaps() {
  const dir = path.join(STEAM, 'steamui');
  const maps = [];
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
    const js = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of js.matchAll(/\{((?:[\w$]+|"[^"]*"):"[^"]*"(?:,(?:[\w$]+|"[^"]*"):"[^"]*")*)\}/g)) {
      const o = {};
      for (const p of m[1].matchAll(/([\w$]+|"[^"]*"):"([^"]*)"/g)) o[p[1].replace(/"/g, '')] = p[2];
      maps.push(o);
    }
  }
  return maps;
}

function resolveClasses(css) {
  if (!css.includes('{{')) return css;
  const maps = loadClassMaps();
  const missing = [];
  const out = css.replace(/\{\{([\w-]+)(?:@([\w-]+))?\}\}/g, (m, key, anchor) => {
    const hits = new Set(maps.filter(o => key in o && (!anchor || anchor in o)).map(o => o[key]));
    if (hits.size === 1) return [...hits][0];
    missing.push(`${m} (${hits.size} Treffer)`);
    return `nc-missing-${key}`; // trifft nichts, die Regel bleibt wirkungslos statt falsch
  });
  if (missing.length) console.warn(`Nicht eindeutig aufgeloest: ${missing.join(', ')}`);
  return out;
}

// ---- Generierung -----------------------------------------------------------------
function generate() {
  const files = fs.readdirSync(SRC_DIR).filter(f => f.endsWith('.css'));
  const out = [];
  let count = 0;
  for (const f of files) {
    const css = fs.readFileSync(path.join(SRC_DIR, f), 'utf8');
    for (const rule of parseRules(css)) {
      const changed = [];
      for (const d of splitDecls(rule.body)) {
        const idx = d.indexOf(':');
        if (idx < 0) continue;
        const prop = d.slice(0, idx).trim().toLowerCase();
        if (!COLOR_PROPS.has(prop)) continue;
        const value = d.slice(idx + 1).replace(/!important/i, '').trim();
        if (value.includes('var(')) continue;
        const mapped = mapValue(value);
        if (!mapped) continue;
        // "background: <Farbe>" als !important wuerde auch Steams background-image (Lupe, Icons)
        // aus spezifischeren Regeln loeschen - reine Farben deshalb nur als background-color
        const plainColor = prop === 'background' && !/gradient|url\(/i.test(mapped);
        changed.push(`${plainColor ? 'background-color' : prop}:${mapped}!important`);
      }
      if (!changed.length) continue;
      let block = `${rule.selector}{${changed.join(';')}}`;
      for (const w of [...rule.wrappers].reverse()) block = `${w}{${block}}`;
      out.push(block);
      count++;
    }
  }
  return { css: out.join('\n'), count, files: files.length };
}

function paletteCss() {
  const { a, b } = VARIANTS[VARIANT];
  const shade = (dl) => '#' + hslToRgb(ACCENT.h, ACCENT.s, Math.max(0, Math.min(1, ACCENT.l + dl))).map(hex2).join('');
  return `:root {
  /* Aurora ${VARIANT} */
  --nc-bg0: #06070b;
  --nc-bg1: #0a0c12;
  --nc-bg2: #12151e;
  --nc-bg3: #1d2230;
  --nc-line: rgba(255, 255, 255, .08);
  --nc-text: #e0e0e0;
  --nc-muted: #8a96ab;
  --nc-accent: ${a};
  --nc-accent-b: ${b};
  --nc-accent-hi: ${shade(0.12)};
  --nc-accent-deep: ${shade(-0.18)};
  --nc-accent-18: color-mix(in srgb, ${a} 18%, transparent);
  --nc-grad: linear-gradient(120deg, ${a} 0%, ${b} 100%);
  --nc-font: "Segoe UI Variable Text", "Segoe UI", "Inter", sans-serif;
}
`;
}

const { css, count, files } = generate();
const stamp = `generiert von build.js am ${new Date().toISOString().slice(0, 10)}, Variante ${VARIANT}`;
const base = resolveClasses(fs.readFileSync(path.join(HERE, 'base.css'), 'utf8'));
const result = `/* Nocturne - ${stamp}, aus ${files} Steam-CSS-Dateien (${count} Regeln). Nicht von Hand bearbeiten, base.css aendern. */\n`
  + paletteCss() + '\n/* ---- generierte Farb-Overrides ---- */\n' + css
  + '\n\n/* ---- base.css (zuletzt, damit sie die generierten Farben schlagen kann) ---- */\n' + base + '\n';

for (const name of ['libraryroot.custom.css', 'friends.custom.css']) {
  fs.writeFileSync(path.join(HERE, name), result);
}
const webkit = fs.readFileSync(path.join(HERE, 'webkit.base.css'), 'utf8');
fs.writeFileSync(path.join(HERE, 'webkit.css'), `/* Nocturne - ${stamp}. Nicht von Hand bearbeiten, webkit.base.css aendern. */\n` + paletteCss() + webkit);
console.log(`Variante ${VARIANT}: ${count} Regeln erzeugt, ${(result.length / 1024).toFixed(0)} KB`);

if (process.argv.includes('--install')) {
  fs.mkdirSync(THEME_DIR, { recursive: true });
  for (const name of ['skin.json', 'libraryroot.custom.css', 'friends.custom.css', 'webkit.css']) {
    fs.copyFileSync(path.join(HERE, name), path.join(THEME_DIR, name));
  }
  for (const old of ['client.css']) {
    fs.rmSync(path.join(THEME_DIR, old), { force: true });
  }
  console.log(`Installiert nach ${THEME_DIR}`);
}
