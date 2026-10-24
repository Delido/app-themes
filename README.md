# Aurora – ein Look für alle Apps

Deep-Space-Schwarz mit Aurora-Verlauf. Ursprünglich als TeamSpeak-Theme entstanden,
jetzt einheitlich für TeamSpeak, Steam, Discord, VS Code und Windows.

## Palette

| Token  | Wert      | Verwendung                  |
|--------|-----------|-----------------------------|
| au-0   | `#06070b` | tiefster Hintergrund        |
| au-1   | `#0a0c12` | Sidebars, Panels            |
| au-2   | `#0e1118` | Haupt-Hintergrund           |
| au-3   | `#12151e` | Karten                      |
| au-4   | `#171b26` | Hover, erhöhte Flächen      |
| au-5   | `#1d2230` | Dialoge, Popups             |

Text `#eceef4` / `#e6e8ef` / `#7d8499` · Status `#34d399` / `#fbbf24` / `#f43f5e`

## Varianten

| Variante | Akzent A  | Akzent B  | Hell      |
|----------|-----------|-----------|-----------|
| Ice      | `#3b82f6` | `#22d3ee` | `#93c5fd` |
| Mint     | `#14b8a6` | `#818cf8` | `#99f6e4` |
| Violet   | `#8b5cf6` | `#22d3ee` | `#c4b5fd` |
| Ember    | `#f97316` | `#f43f5e` | `#fdba74` |
| Rose     | `#ec4899` | `#a855f7` | `#f9a8d4` |

Stilregel: Flächen nie voll im Akzent einfärben. Buttons „invertiert“ – dunkle Pille,
Akzent für Icon/Text, beim Hover leichter Glow.

## Apps

| Ordner        | App        | Installation |
|---------------|------------|--------------|
| `teamspeak/`  | TeamSpeak  | Ordner nach `%APPDATA%\TeamSpeak\Default\extensions\com.mendyka.aurora` kopieren, Theme in den Einstellungen wählen |
| `steam/`      | Steam (Millennium) | `node build.js --variant ice --install` – siehe [steam/README.md](steam/README.md) |
| `discord/`    | Discord (BetterDiscord) | `Aurora.theme.css` nach `%APPDATA%\BetterDiscord\themes`, Variante oben in der Datei |
| `vscode/`     | VS Code    | `node build.js`, `npx @vscode/vsce package --allow-missing-repository --skip-license`, `code --install-extension aurora-theme-1.0.0.vsix` |
| `windows/`    | Windows 11 | `.\windows\apply.ps1 -Variant ice` (Dark Mode + Akzent, Backup in `windows\backup`), zurück mit `restore.ps1` |

## Variante wechseln

```powershell
node steam\build.js --variant mint --install
.\windows\apply.ps1 -Variant mint
# VS Code: Strg+K Strg+T -> "Aurora Mint"
# Discord: in Aurora.theme.css die Mint-Zeile aktivieren
# TeamSpeak: "Aurora Mint" in den Theme-Einstellungen
```

## Lizenz

MIT
