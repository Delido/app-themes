# Aurora für Raycast

Eigene Themes sind in Raycast ein **Pro-Feature** (Mac und Windows).

## Installieren
Import-Link aus [links.md](links.md) im Browser oder per `Win+R` öffnen – Raycast fragt
dann, ob das Theme übernommen werden soll. Alternativ in Raycast **Show Theme Studio**
öffnen und die Farben aus `themes/aurora-<variante>.json` eintragen.

## Bauen
    node build.js

Erzeugt `themes/*.json` und `links.md`. Format wie themes.ray.so:
`raycast://theme?...&colors=` mit zwölf Farben in fester Reihenfolge
(background, backgroundSecondary, text, selection, loader, red, orange, yellow,
green, blue, purple, magenta).
