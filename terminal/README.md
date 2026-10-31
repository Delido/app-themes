# Aurora für Windows Terminal

    node build.js --variant ice --install

Trägt die Farbschemata und Fenster-Themes **Aurora Ice / Mint / Violet / Ember / Rose**
in `%LOCALAPPDATA%\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json`
ein und setzt die gewählte Variante als Standard (`profiles.defaults.colorScheme` und `theme`).
Das Terminal lädt die Datei sofort neu.

- Terminal-Farben wie im VS-Code-Theme (Hintergrund au-1, ANSI-Farben identisch)
- Tab-Leiste au-0, aktiver Tab verschmilzt mit der Terminal-Fläche, kein Mica
- Beim ersten `--install` wird die Original-`settings.json` nach `backup/` gesichert
- Ohne `--install` entstehen nur die JSON-Schnipsel unter `themes/`

Variante wechseln geht auch ohne Skript: Einstellungen → Darstellung → Theme bzw.
Profil → Darstellung → Farbschema.
