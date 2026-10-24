# Nocturne fuer Windows 11 - Stufe 1 (Bordmittel)
# Dunkler Modus + Akzent passend zur TeamSpeak-Aurora-Variante.
# Vorherige Werte werden nach .\backup gesichert, zuruecksetzen mit .\restore.ps1
param(
    [ValidateSet('ice', 'mint', 'violet', 'ember', 'rose')]
    [string]$Variant = 'ice',
    [switch]$AccentOnTaskbar,   # Taskleiste/Start dunkel-teal einfaerben
    [switch]$AccentOnTitleBars  # Titelleisten + Fensterrahmen in Teal
)

$ErrorActionPreference = 'Stop'
$backup = Join-Path $PSScriptRoot 'backup'

$keys = @{
    'Personalize' = 'HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize'
    'Accent'      = 'HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Accent'
    'DWM'         = 'HKCU\Software\Microsoft\Windows\DWM'
    'Desktop'     = 'HKCU\Control Panel\Desktop'
}

# Nur beim ersten Mal sichern, damit ein zweiter Lauf das Original nicht ueberschreibt
if (-not (Test-Path $backup)) {
    New-Item -ItemType Directory $backup | Out-Null
    foreach ($k in $keys.GetEnumerator()) {
        reg export $k.Value (Join-Path $backup "$($k.Key).reg") /y | Out-Null
    }
    Write-Host "Backup angelegt: $backup"
}

# Akzent-Paare wie in Aurora (--au-a -> --au-b)
$variants = @{
    ice    = '3b82f6', '22d3ee'
    mint   = '14b8a6', '818cf8'
    violet = '8b5cf6', '22d3ee'
    ember  = 'f97316', 'f43f5e'
    rose   = 'ec4899', 'a855f7'
}
$hexA, $hexB = $variants[$Variant]
$rgb = { param($hex) 0, 2, 4 | ForEach-Object { [Convert]::ToByte($hex.Substring($_, 2), 16) } }
$mix = { param($c, $to, $t) for ($i = 0; $i -lt 3; $i++) { [byte][Math]::Round($c[$i] + ($to[$i] - $c[$i]) * $t) } }
$a = & $rgb $hexA
$white = 255, 255, 255
$space = 6, 7, 11   # Aurora --au-0

# Palette (hell -> dunkel), je RGBA. Die dunklen Stufen laufen ins Aurora-Schwarz,
# damit Taskleiste/Start mit -AccentOnTaskbar nur dezent getoent werden.
$shades = @(
    (& $mix $a $white 0.60), (& $mix $a $white 0.40), (& $mix $a $white 0.20), $a,
    (& $mix $a $space 0.35), (& $mix $a $space 0.70), (& $mix $a $space 0.85), (& $rgb $hexB)
)
$palette = foreach ($s in $shades) { $s[0], $s[1], $s[2], 0 }

$dword = { param($hex) [Convert]::ToUInt32($hex, 16) }
$abgr = { param($c) & $dword ('FF{0:X2}{1:X2}{2:X2}' -f $c[2], $c[1], $c[0]) }
$accentAbgr = & $abgr $a
$accentArgb = & $dword ('C4{0:X2}{1:X2}{2:X2}' -f $a[0], $a[1], $a[2])

$p = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize'
Set-ItemProperty $p AppsUseLightTheme 0 -Type DWord
Set-ItemProperty $p SystemUsesLightTheme 0 -Type DWord
Set-ItemProperty $p EnableTransparency 1 -Type DWord
Set-ItemProperty $p ColorPrevalence ([int][bool]$AccentOnTaskbar) -Type DWord

$k = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Accent'
if (-not (Test-Path $k)) { New-Item $k -Force | Out-Null }
Set-ItemProperty $k AccentPalette ([byte[]]$palette) -Type Binary
Set-ItemProperty $k AccentColorMenu $accentAbgr -Type DWord
Set-ItemProperty $k StartColorMenu (& $abgr $shades[5]) -Type DWord   # dark 2

$d = 'HKCU:\Software\Microsoft\Windows\DWM'
Set-ItemProperty $d AccentColor $accentAbgr -Type DWord
Set-ItemProperty $d ColorizationColor $accentArgb -Type DWord
Set-ItemProperty $d ColorizationAfterglow $accentArgb -Type DWord
Set-ItemProperty $d ColorPrevalence ([int][bool]$AccentOnTitleBars) -Type DWord

# Akzentfarbe nicht mehr automatisch aus dem Hintergrundbild ableiten
Set-ItemProperty 'HKCU:\Control Panel\Desktop' AutoColorization 0 -Type DWord

# Explorer neu starten, damit Taskleiste/Start die Farben uebernehmen
Stop-Process -Name explorer -Force
Start-Sleep -Milliseconds 800
if (-not (Get-Process explorer -ErrorAction SilentlyContinue)) { Start-Process explorer }

Write-Host "Nocturne ($Variant, #$hexA) angewendet. Einige Apps uebernehmen die Farbe erst nach einem Neustart der App."
