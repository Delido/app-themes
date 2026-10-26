# Aurora für BookStack

Wirkt im Hellen und im Dunklen Modus, also auch auf der Login-Seite für Gäste.

## Installieren
Inhalt von [aurora-head.html](aurora-head.html) in BookStack unter
**Einstellungen → Anpassung → Benutzerdefinierter HTML-Head-Inhalt** einfügen und speichern.
Auf der Anpassungsseite selbst lädt BookStack diesen Inhalt absichtlich nicht.

Optional kannst du den Dunklen Modus für alle (auch Gäste) zum Standard machen.
Dafür in der `.env` von BookStack:

    APP_DEFAULT_DARK_MODE=true

## Bauen
    node build.js [--variant ice] [--version v26.09.2] [--src styles.css]

Das Skript lädt BookStacks `public/dist/styles.css` der angegebenen Version von GitHub
(oder nimmt `--src`). Daraus nimmt es jede Regel, die BookStack für den Dunklen Modus
mit festen Grautönen überschreibt, und schreibt sie zweimal auf Aurora-Tokens um:

- **dunkel:** aus dem Wert der `.dark-mode`-Regel → `:root.dark-mode …`
- **hell:** aus dem Basiswert derselben Regel → `:root:not(.dark-mode) …`

Übrig bleibt nur die Zuordnung der Farbwerte in `build.js` (`MAP`). Tokens und Feinschliff
stehen in [template.html](template.html). Nach einem BookStack-Update genügt es, das Skript
mit der neuen Version erneut auszuführen.

## Tokens
| Token              | Hell      | Dunkel    |
|--------------------|-----------|-----------|
| au-0 Kopfleiste    | `#ffffff` | `#06070b` |
| au-1 eingelassen   | `#f7f8fb` | `#0a0c12` |
| au-2 Hintergrund   | `#f1f3f8` | `#0e1118` |
| au-3 Karten        | `#ffffff` | `#12151e` |
| au-4 Hover         | `#eceff5` | `#171b26` |
| au-5 Popups        | `#e3e7ef` | `#1d2230` |
| Text               | `#0e1220` / `#262b3a` | `#eceef4` / `#e6e8ef` |

Im Hellen Modus wird der Akzent für Schrift und Buttons um 30 % abgedunkelt
(`--au-accent-text`), damit weiße Button-Schrift und Links lesbar bleiben.
