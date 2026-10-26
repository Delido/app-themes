// Aurora fuer BookStack
// Liest BookStacks styles.css, nimmt jede Regel, die BookStack selbst fuer den Dunklen
// Modus ueberschreibt (= alle Flaechen mit fest eingetragenen Grautoenen), und rechnet
// sie fuer beide Modi auf Aurora-Tokens um:
//   dunkel: Wert aus der .dark-mode-Regel   -> :root.dark-mode ...
//   hell:   Wert aus der Basis-Regel         -> :root:not(.dark-mode) ...
// Ergebnis: aurora-head.html (Inhalt fuer "Benutzerdefinierter HTML-Head-Inhalt").
//   node build.js [--variant ice] [--version v26.09.2] [--src pfad/zu/styles.css]

const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const VARIANTS = {
  ice:    { name: 'Ice',    a: '#3b82f6', b: '#22d3ee', light: '#93c5fd' },
  mint:   { name: 'Mint',   a: '#14b8a6', b: '#818cf8', light: '#99f6e4' },
  violet: { name: 'Violet', a: '#8b5cf6', b: '#22d3ee', light: '#c4b5fd' },
  ember:  { name: 'Ember',  a: '#f97316', b: '#f43f5e', light: '#fdba74' },
  rose:   { name: 'Rose',   a: '#ec4899', b: '#a855f7', light: '#f9a8d4' },
};
const argVal = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const VARIANT = argVal('--variant') || 'ice';
const VERSION = argVal('--version') || 'v26.09.2';
const SRC = argVal('--src');
if (!VARIANTS[VARIANT]) throw new Error(`Unbekannte Variante "${VARIANT}", erlaubt: ${Object.keys(VARIANTS).join(', ')}`);

// ---- Farbzuordnung ---------------------------------------------------------
// Je Eigenschaftsart (Flaeche / Linie / Text) eine Tabelle BookStack-Wert -> Aurora.
const v = name => `var(--au-${name})`;
const MAP = {
  dark: {
    bg: {
      '#000': v(0), '#2b2b2b': v(1), '#111': v(2), '#222': v(3),
      '#333': v(4), '#2d2d2d': v(4), '#313335': v(4), '#444': v(5), '#292929': v(5),
      '#555': v('line-strong'), '#666': 'rgba(255,255,255,.16)',
    },
    line: {
      '#000': v('line'), '#111': v('line'), '#333': v('line-strong'), '#444': v('line-strong'),
      '#555': 'rgba(255,255,255,.14)', '#666': 'rgba(255,255,255,.18)',
    },
    text: {
      '#eee': v('text-strong'), '#bbb': v('text-strong'), '#ddd': v('text'), '#ccc': v('text'),
      '#aaa': v('text'), '#dbdbdb': v('text-muted'), '#999': v('text-muted'),
      '#888': v('text-secondary'), '#666': v('text-disabled'),
      '#111': v(3), // Verlauf am Kartenrand (currentColor)
    },
  },
  light: {
    bg: {
      '#fff': v(3), '#fafafa': v(1), '#f8f8f8': v(1), '#f6f6f6': v(1), '#f5f5f5': v(1),
      '#f2f2f2': v(2), '#eee': v(4), '#eaeaea': v(4), '#e2e2e2': v(5), '#ddd': v(5),
      '#ccc': v('text-disabled'), '#bbb': v('text-disabled'),
      '#ceebff': 'var(--color-primary-light)',
    },
    line: {
      '#fff': v('line'), '#eee': v('line'), '#e2e2e2': v('line'), '#ddd': v('line'),
      '#d4d4d4': v('line-strong'), '#ccc': v('line-strong'), '#bbb': v('line-strong'),
    },
    text: {
      '#000': v('text-strong'), '#111': v('text-strong'), '#222': v('text-strong'),
      '#333': v('text'), '#444': v('text'),
      '#555': v('text-muted'), '#575757': v('text-muted'), '#666': v('text-muted'),
      '#777': v('text-secondary'), '#888': v('text-secondary'),
      '#999': v('text-disabled'), '#aaa': v('text-disabled'),
      '#f2f2f2': v(2), // Verlauf am Seitenrand (currentColor)
    },
  },
};
const CALLOUT = { success: 'positive', danger: 'negative', info: 'info', warning: 'warning' };

const kind = prop =>
  prop === 'color' || prop === 'fill' ? 'text'
  : /^(background|box-shadow)/.test(prop) ? 'bg'
  : /^(border|outline)/.test(prop) ? 'line' : null;
const COLOR_RE = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|\bwhite\b|\bblack\b/gi;
const hex = c => ({ white: '#fff', black: '#000' })[c.toLowerCase()] || c.toLowerCase();

// Ersetzt alle Farben in einem Wert; null, wenn eine davon nicht zugeordnet ist.
function mapValue(mode, prop, value) {
  const k = kind(prop);
  if (!k) return null;
  const table = MAP[mode][k];
  let ok = true;
  const out = value.replace(COLOR_RE, c => {
    const m = table[hex(c)];
    if (!m) ok = false;
    return m || c;
  });
  return ok && out !== value ? out : null;
}

// ---- CSS-Parser (genuegt fuer BookStacks minifizierte styles.css) -----------
function parse(css) {
  const s = css.replace(/^﻿/, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  let i = 0;
  (function block(media) {
    while (i < s.length) {
      while (/\s/.test(s[i])) i++;
      if (s[i] === '}') { i++; return; }
      if (i >= s.length) return;
      const open = s.indexOf('{', i);
      const pre = s.slice(i, open).trim();
      i = open + 1;
      if (/^@(media|supports|layer)/.test(pre)) { block(pre); continue; }
      if (pre.startsWith('@')) { for (let d = 1; d; i++) d += s[i] === '{' ? 1 : s[i] === '}' ? -1 : 0; continue; }
      let k = i, d = 0;
      for (; d || s[k] !== '}'; k++) d += s[k] === '{' ? 1 : s[k] === '}' ? -1 : 0;
      rules.push({ media, sel: pre, decls: decls(s.slice(i, k)) });
      i = k + 1;
    }
  })(null);
  return rules;
}
function decls(body) {
  return body.split(/;(?![^(]*\))/)
    .map(d => d.match(/^\s*([a-z-]+)\s*:([\s\S]*)$/))
    .filter(Boolean)
    .map(([, prop, val]) => {
      val = val.trim();
      const important = /!important$/.test(val);
      return { prop, val: val.replace(/\s*!important$/, ''), important };
    });
}

// ---- Erzeugen ----------------------------------------------------------------
const DARK = ':root.dark-mode';
const LIGHT = ':root:not(.dark-mode)';

// "html.dark-mode .card" -> ".card", "html.dark-mode" -> "html"
const baseSel = sel => sel
  .replace(/^html\.markdown-editor-display\.dark-mode/, 'html.markdown-editor-display')
  .replace(/^html\.dark-mode\s*/, '').replace(/^\.dark-mode\s+/, '').trim() || 'html';
const scoped = (prefix, sel) =>
  sel === 'html' ? prefix
  : sel.startsWith('html.markdown-editor-display') ? sel.replace('html.markdown-editor-display', `html.markdown-editor-display${prefix.slice(5)}`)
  : `${prefix} ${sel}`;

// Selektorliste an Kommas teilen, aber nicht innerhalb von :not(...) / :is(...)
const splitSel = sel => sel.split(/,(?![^(]*\))/);

// Basis-Deklarationen je "media|selektor": prop -> { val, important, order }
function indexBase(rules) {
  const idx = {};
  let order = 0;
  for (const r of rules) {
    if (r.sel.includes('dark-mode')) continue;
    for (const one of splitSel(r.sel)) {
      const key = `${r.media || ''}|${one.trim()}`;
      for (const d of r.decls) (idx[key] ||= {})[d.prop] = { ...d, order: order++ };
    }
  }
  return idx;
}
// Kandidaten, aus denen der helle Wert einer Eigenschaft stammen kann (Kurzschreibweisen).
const families = prop =>
  prop === 'background-color' || prop === 'background' ? ['background-color', 'background']
  : prop === 'outline-color' ? ['outline-color', 'outline']
  : /^border-[a-z-]+-color$/.test(prop) ? [prop, prop.replace(/-color$/, ''), 'border-color', 'border']
  : prop === 'border-color' || prop === 'border' ? ['border-color', 'border']
  : [prop];
function lightValue(base, media, sel, prop) {
  const decl = base[`${media || ''}|${sel}`];
  if (!decl) return null;
  const hit = families(prop).map(f => decl[f]).filter(Boolean).sort((a, b) => b.order - a.order)[0];
  if (!hit) return null;
  const color = (hit.val.match(COLOR_RE) || [])[0];
  if (!color) return null;
  // Eigenschaft wie im Dark-Mode-Override, Farbe aus der Basis (Schatten komplett)
  return { val: prop === 'box-shadow' ? hit.val : color, important: hit.important };
}

function generate(rules) {
  const base = indexBase(rules);
  const out = { dark: [], light: [] };
  for (const r of rules) {
    if (!r.sel.includes('dark-mode') || r.sel.startsWith(':root')) continue;
    const sels = splitSel(r.sel).map(s => baseSel(s.trim()));
    const callout = sels[0].match(/^\.callout\.(\w+)$/);
    const dark = [];
    const light = new Map(); // Wert -> Selektoren (Selektorlisten koennen hell verschiedene Werte haben)

    for (const d of r.decls) {
      const imp = d.important ? ' !important' : '';
      let dv;
      if (callout) {
        const c = `var(--color-${CALLOUT[callout[1]]})`;
        dv = d.prop === 'background-color' ? `color-mix(in srgb, ${c} 12%, var(--au-3))` : c;
        const lv = d.prop === 'background-color' ? `color-mix(in srgb, ${c} 10%, var(--au-3))`
          : d.prop === 'color' ? `color-mix(in srgb, ${c} 60%, var(--au-text-strong))` : c;
        light.set(`${d.prop}:${lv}`, sels);
      } else if (sels[0] === '.sticky-sidebar-header') {
        // Verlauf mit festen RGB-Werten: --au-2 dunkel = rgb(14, 17, 24)
        dv = d.val.includes('gradient')
          ? d.val.replace(/rgb\(17, 17, 17\)/, 'rgb(14, 17, 24)').replace(/rgba\(17, 17, 17, 0\)/, 'rgba(14, 17, 24, 0)')
          : mapValue('dark', d.prop, d.val);
      } else if (sels[0] === '.image-manager-filter-bar') {
        dv = 'rgba(29,34,48,.88)'; // --au-5, leicht durchscheinend
      } else {
        dv = mapValue('dark', d.prop, d.val);
      }
      if (!dv) continue;
      dark.push(`${d.prop}:${dv}${imp}`);

      if (callout) continue;
      for (const s of sels) {
        const lb = lightValue(base, r.media, s, d.prop);
        const lv = lb && mapValue('light', d.prop, lb.val);
        if (!lv) continue;
        const key = `${d.prop}:${lv}${lb.important ? ' !important' : ''}`;
        light.set(key, [...(light.get(key) || []), s]);
      }
    }
    if (dark.length) out.dark.push({ media: r.media, text: `${sels.map(s => scoped(DARK, s)).join(',')}{${dark.join(';')}}` });
    for (const [decl, ss] of light) out.light.push({ media: r.media, text: `${ss.map(s => scoped(LIGHT, s)).join(',')}{${decl}}` });
  }
  return { dark: wrapMedia(out.dark), light: wrapMedia(out.light) };
}
// Aufeinanderfolgende Regeln mit gleicher Media-Query in einen Block
function wrapMedia(list) {
  const lines = [];
  let open = null;
  for (const { media, text } of list) {
    if (media !== open) { if (open) lines.push('}'); if (media) lines.push(`${media}{`); open = media; }
    lines.push(text);
  }
  if (open) lines.push('}');
  return lines.join('\n');
}

// ---- Zusammensetzen ------------------------------------------------------------
function variantLines(key) {
  const own = VARIANTS[key];
  const others = Object.entries(VARIANTS).filter(([k]) => k !== key)
    .map(([, x], i, all) => `${i ? '     ' : '  /* '}${x.name.padEnd(6)} ${x.a} ${x.b} ${x.light}${i === all.length - 1 ? ' */' : ''}`);
  return [
    `  /* Variante: ${own.name} */`,
    `  --au-accent: ${own.a};`,
    `  --au-accent-2: ${own.b};`,
    `  --au-accent-light: ${own.light};`,
    ...others,
  ].join('\n');
}

async function main() {
  let css;
  if (SRC) css = fs.readFileSync(SRC, 'utf8');
  else {
    const url = `https://raw.githubusercontent.com/BookStackApp/BookStack/${VERSION}/public/dist/styles.css`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    css = await res.text();
  }
  const { dark, light } = generate(parse(css));
  const html = fs.readFileSync(path.join(HERE, 'template.html'), 'utf8')
    .replace('{{VERSION}}', VERSION)
    .replace('{{VARIANT}}', variantLines(VARIANT))
    .replace('{{DARK}}', dark)
    .replace('{{LIGHT}}', light);
  const target = path.join(HERE, 'aurora-head.html');
  fs.writeFileSync(target, html);
  console.log(`${path.relative(process.cwd(), target)}: ${VARIANTS[VARIANT].name}, BookStack ${VERSION}, `
    + `${dark.split('\n').length} dunkle + ${light.split('\n').length} helle Regeln`);
}
main().catch(e => { console.error(e.message); process.exit(1); });
