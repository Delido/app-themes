# Aurora für Home Assistant

## Installieren
1. `aurora.yaml` nach `/config/themes/` kopieren (Unterordner sind erlaubt).
2. In `configuration.yaml` muss stehen:

       frontend:
         themes: !include_dir_merge_named themes

3. Aktion `frontend.reload_themes` ausführen (oder HA neu starten).
4. Profil → **Design** → „Aurora Ice“ (bzw. Mint, Violet, Ember, Rose).

Die Themes haben nur `modes: dark`, HA schaltet bei Auswahl automatisch in den Dark-Mode.

## Aufbau
- „Aurora Ice“ definiert die gemeinsame Basis als YAML-Anker `&aurora`, die anderen
  Varianten übernehmen sie mit `<<: *aurora` und setzen nur vier Werte:
  `au-accent`, `au-accent-2`, `au-accent-light`, `au-on-accent`.
- Ab HA 2025/2026 hängen `--primary-color`, Buttons, Switches und Dialoge am
  `--ha-color-*`-Token-System. Das Theme setzt deshalb die Primär-, Neutral- und
  Status-Skalen, Akzent-Tönungen per `color-mix()` aus `au-accent`.
- Dialoge mit Frosted Glass (`--ha-dialog-surface-backdrop-filter`), ohne card-mod.
- Mushroom-Karten werden über `--mush-rgb-*` mitgefärbt.

Geprüft gegen HA 2026.10.3 (Frontend 20260930.5). Der Block „Legacy“ enthält
Variablen, die diese Version nicht mehr liest – nur für ältere Custom Cards.
