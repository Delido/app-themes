# Aurora – ein Look für alle Apps

Deep-Space-Schwarz mit Aurora-Verlauf. Ursprünglich als TeamSpeak-Theme entstanden,
jetzt einheitlich für TeamSpeak, Steam, Discord, VS Code, Raycast, Windows,
Home Assistant und BookStack.

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
| `raycast/`    | Raycast (Pro) | Import-Link aus [raycast/links.md](raycast/links.md) öffnen |
| `windows/` (Stufe 2) | Windhawk | Mods *Windows 11 Taskbar / Start Menu / File Explorer / Settings / Notification Center Styler* installieren, dann `.\windows\windhawk.ps1 -Variant ice` (UAC) |
| `windows/` (Explorer-Flächen) | Windhawk, lokaler Mod | `node windows\build-modernizer.js` erzeugt *Win32 UI Modernizer (Aurora)*; in Windhawk „Neuen Mod erstellen“, Inhalt einfügen, kompilieren – Einstellungen setzt `windhawk.ps1` |
| `windows/` (Hintergrund) | Mica-Tönung | `.\windows\wallpaper.ps1 -Variant ice` – dunkles Aurora-Bild als Windows-Hintergrund (liegt unter Lively), Backup in `windows\backup` |
| `windows/`    | Windows 11 | `.\windows\apply.ps1 -Variant ice` (Dark Mode + Akzent, Backup in `windows\backup`), zurück mit `restore.ps1` |
| `home-assistant/` | Home Assistant | `aurora.yaml` nach `/config/themes/`, `frontend.reload_themes`, im Profil wählen – siehe [home-assistant/README.md](home-assistant/README.md) |
| `bookstack/`  | BookStack  | `aurora-head.html` in Einstellungen → Anpassung → Benutzerdefinierter HTML-Head-Inhalt – siehe [bookstack/README.md](bookstack/README.md) |

## Variante wechseln

```powershell
node steam\build.js --variant mint --install
.\windows\apply.ps1 -Variant mint
# VS Code: Strg+K Strg+T -> "Aurora Mint"
# Discord: in Aurora.theme.css die Mint-Zeile aktivieren
# TeamSpeak: "Aurora Mint" in den Theme-Einstellungen
# Home Assistant: Profil -> Design -> "Aurora Mint"
node bookstack\build.js --url https://wiki.example.org --variant mint
```

## Lizenz

MIT
