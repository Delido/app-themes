# Aurora für Steam (Millennium-Theme „Nocturne“)

## Voraussetzung
[Millennium](https://steambrew.app) installieren (Steam vorher beenden).

## Bauen & installieren
    node build.js --variant ice --install

Installiert nach `C:\Program Files (x86)\Steam\millennium\themes\Nocturne`.
Danach in Steam: Einstellungen → Millennium → Themes → **Nocturne**.

## Aufbau
Steam färbt seinen Client mit fest eingetragenen Farben und zufälligen Klassennamen,
eigene CSS-Variablen greifen dort kaum. `build.js` liest deshalb Steams CSS
(`steamui\css\*.css`), rechnet jede Farbe auf die Aurora-Palette um und erzeugt
`libraryroot.custom.css` / `friends.custom.css` / `webkit.css` (nicht im Repo).

- `base.css` – handgeschriebener Teil (Scrollbars, Fokus, Auswahl …)
- `webkit.base.css` – Store & Community (handgeschrieben)
- `build.js` – Generator, Varianten oben im Skript

## Nach Steam-Updates
Valve würfelt die Klassennamen bei Updates neu – einfach `node build.js --install`
erneut ausführen und das Theme in Steam neu laden.
