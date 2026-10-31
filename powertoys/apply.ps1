# Aurora fuer PowerToys
# PowerToys selbst folgt Dunkelmodus + Windows-Akzent (siehe windows\apply.ps1). Hier werden
# die Module mit eigenen Farben (FancyZones, Maus-Werkzeuge, Bildschirmlineal) eingefaerbt.
# Vorherige settings.json werden nach .\backup gesichert, zuruecksetzen mit .\restore.ps1
param(
    [ValidateSet('ice', 'mint', 'violet', 'ember', 'rose')]
    [string]$Variant = 'ice'
)

$ErrorActionPreference = 'Stop'
$root = Join-Path $env:LOCALAPPDATA 'Microsoft\PowerToys'
$backup = Join-Path $PSScriptRoot 'backup'
# Befehlspalette ist ein eigenes Paket mit eigener settings.json
$cmdPal = Join-Path $env:LOCALAPPDATA 'Packages\Microsoft.CommandPalette_8wekyb3d8bbwe\LocalState\settings.json'

# Akzent-Paare wie in Aurora (--au-a -> --au-b)
$variants = @{
    ice    = '3b82f6', '22d3ee'
    mint   = '14b8a6', '818cf8'
    violet = '8b5cf6', '22d3ee'
    ember  = 'f97316', 'f43f5e'
    rose   = 'ec4899', 'a855f7'
}
$a, $b = $variants[$Variant]

# Modul -> Eigenschaft -> Wert (nur Farben, alles andere bleibt wie eingestellt)
$colors = [ordered]@{
    'FancyZones' = @{
        fancyzones_systemTheme        = $false      # sonst ignoriert FancyZones die eigenen Farben
        fancyzones_zoneHighlightColor = "#$a"
        fancyzones_zoneColor          = '#12151e'   # --au-3
        fancyzones_zoneBorderColor    = "#$b"
        fancyzones_zoneNumberColor    = '#e6e8ef'
    }
    'FindMyMouse' = @{
        background_color = '#06070b'                # --au-0
        spotlight_color  = "#$b"
    }
    'MouseHighlighter' = @{
        left_button_click_color  = "#a6$a"          # a6 = Deckkraft wie im Standard
        right_button_click_color = "#a6$b"
    }
    'MousePointerCrosshairs' = @{
        crosshairs_color        = "#$b"
        crosshairs_border_color = '#06070b'
    }
    'Measure Tool' = @{
        MeasureCrossColor = "#$b"
    }
}

# Nur beim ersten Mal sichern, damit ein zweiter Lauf das Original nicht ueberschreibt
if (-not (Test-Path $backup)) {
    New-Item -ItemType Directory $backup | Out-Null
    foreach ($m in $colors.Keys) {
        $src = Join-Path $root "$m\settings.json"
        if (Test-Path $src) { Copy-Item $src (Join-Path $backup "$m.json") }
    }
    Write-Host "Backup angelegt: $backup"
}
if ((Test-Path $cmdPal) -and -not (Test-Path (Join-Path $backup 'CmdPal.json'))) {
    Copy-Item $cmdPal (Join-Path $backup 'CmdPal.json')
}

# PowerToys beenden, sonst ueberschreibt es die Dateien beim naechsten Speichern
$exe = (Get-Process PowerToys -ErrorAction SilentlyContinue | Select-Object -First 1).Path
if (-not $exe) { $exe = Join-Path $env:LOCALAPPDATA 'PowerToys\PowerToys.exe' }
Get-Process PowerToys*, Microsoft.CmdPal.UI -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 800

# Befehlspalette: Acrylic-Flaeche voll mit --au-2 toenen (wie der VS-Code-Hintergrund)
if (Test-Path $cmdPal) {
    $json = Get-Content $cmdPal -Raw | ConvertFrom-Json
    $json.ColorizationMode = 'CustomColor'
    $json.CustomThemeColor = [pscustomobject]@{ A = 255; R = 0x0e; G = 0x11; B = 0x18 }
    $json.CustomThemeColorIntensity = 100
    $json | ConvertTo-Json -Depth 50 | Set-Content $cmdPal -Encoding utf8NoBOM
    Write-Host 'Befehlspalette eingefaerbt'
}

foreach ($m in $colors.Keys) {
    $file = Join-Path $root "$m\settings.json"
    if (-not (Test-Path $file)) { Write-Warning "$m nicht gefunden, uebersprungen"; continue }
    $json = Get-Content $file -Raw | ConvertFrom-Json
    foreach ($p in $colors[$m].GetEnumerator()) {
        if ($json.properties.PSObject.Properties[$p.Key]) { $json.properties.($p.Key).value = $p.Value }
        else { $json.properties | Add-Member $p.Key ([pscustomobject]@{ value = $p.Value }) }
    }
    $json | ConvertTo-Json -Depth 20 -Compress | Set-Content $file -Encoding utf8NoBOM
    Write-Host "$m eingefaerbt"
}

if (Test-Path $exe) { Start-Process $exe; Write-Host "PowerToys neu gestartet ($Variant)" }
else { Write-Warning "PowerToys.exe nicht gefunden - bitte selbst starten" }
