# Aurora für BookStack

## Installieren
Inhalt von `aurora-head.html` kopieren und in BookStack unter
Einstellungen → Anpassung → **Benutzerdefinierter HTML-Head-Inhalt** einfügen.
Das Theme wirkt im **Dunklen Modus** (Benutzermenü → „Dunkler Modus“).

## Variante wechseln / nach BookStack-Updates neu bauen
    node build.js --url https://wiki.example.org --variant mint

Alternativ mit einer lokal gespeicherten `styles.css`: `node build.js --css styles.css`.
Danach `aurora-head.html` erneut einfügen. Die Datei im Repo ist für Ice gebaut.

## Aufbau
BookStack hat CSS-Variablen nur für Akzent- und Statusfarben. Hintergründe, Karten,
Texte und Ränder sind im Dark-Mode fest eingetragen. `build.js` liest deshalb
BookStacks `dist/styles.css`, bildet jeden dieser Grautöne auf die Aurora-Palette ab
(getrennt nach Fläche, Rand und Text) und behält `@media`-Bedingungen bei.

- `base.css` – handgeschriebener Teil: dunkle Kopfleiste statt Akzentfläche,
  Karten mit Glow, getönte Cover-Platzhalter, Fokus, breitere Inhaltsspalte
  (`--au-content-width`, ab 1700px Fensterbreite)
- `build.js` – Generator, Varianten oben im Skript
- `aurora-head.html` – fertiges Ergebnis zum Einfügen

Nicht erfasst: Inhalt im WYSIWYG-Editor (eigenes iframe) und Syntaxfarben in Code-Blöcken.
