# Aurora fuer Windhawk - Stufe 2
# Schreibt die Einstellungen der Styler-Mods (Taskleiste, Startmenue, Explorer, Info-Center)
# direkt in Windhawks Registry und stoesst das Neuladen an. Die Mods muessen vorher in
# Windhawk installiert sein; nicht installierte werden uebersprungen.
#
# Element-Pfade stammen aus den Readmes/Built-in-Themes der Mods (ramensoftware/windhawk-mods).
# Windhawk speichert unter HKLM -> das Skript fordert bei Bedarf Admin-Rechte an (UAC).
param(
    [ValidateSet('ice', 'mint', 'violet', 'ember', 'rose')]
    [string]$Variant = 'ice',
    [string]$LogPath   # intern: Ausgabe des erhoehten Laufs
)

$ErrorActionPreference = 'Stop'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    $log = Join-Path $env:TEMP 'aurora-windhawk.log'
    Remove-Item $log -ErrorAction SilentlyContinue
    $pwsh = (Get-Process -Id $PID).Path
    $p = Start-Process $pwsh -Verb RunAs -Wait -PassThru -WindowStyle Hidden -ArgumentList @(
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"", '-Variant', $Variant, '-LogPath', "`"$log`"")
    if (Test-Path $log) { Get-Content $log }
    exit $p.ExitCode
}
if ($LogPath) { Start-Transcript -Path $LogPath -UseMinimalHeader | Out-Null }
trap { Write-Host "FEHLER: $_"; if ($LogPath) { Stop-Transcript | Out-Null }; exit 1 }

$variants = @{
    ice    = '#3b82f6', '#22d3ee'
    mint   = '#14b8a6', '#818cf8'
    violet = '#8b5cf6', '#22d3ee'
    ember  = '#f97316', '#f43f5e'
    rose   = '#ec4899', '#a855f7'
}
$A, $B = $variants[$Variant]

# Aurora-Bausteine als XAML
$glass     = '<WindhawkBlur BlurAmount="25" TintColor="#E60A0C12"/>'    # --au-1, fast deckend
$glassDeep = '<WindhawkBlur BlurAmount="25" TintColor="#EB06070B"/>'    # --au-0
$line      = '<SolidColorBrush Color="#FFFFFF" Opacity="0.08"/>'
$field     = '<SolidColorBrush Color="#06070B" Opacity="0.7"/>'
$tint      = { param($o) "<SolidColorBrush Color=`"$A`" Opacity=`"$o`"/>" }
$white     = { param($o) "<SolidColorBrush Color=`"#FFFFFF`" Opacity=`"$o`"/>" }
$grad      = "<LinearGradientBrush StartPoint=`"0,0.5`" EndPoint=`"1,0.5`"><GradientStop Offset=`"0`" Color=`"$A`"/><GradientStop Offset=`"1`" Color=`"$B`"/></LinearGradientBrush>"

$mods = [ordered]@{
    'windows-11-taskbar-styler' = @{
        controlStyles = @(
            @{ t = 'Taskbar.TaskbarFrame > Grid#RootGrid > Taskbar.TaskbarBackground > Grid > Rectangle#BackgroundFill'
               s = @("Fill:=$glassDeep") }
            @{ t = 'Taskbar.TaskbarFrame > Grid#RootGrid > Taskbar.TaskbarBackground > Grid > Rectangle#BackgroundStroke'
               s = @("Fill:=$line") }
            # App-Buttons: invertiert - nur getoent, aktive App mit Akzent-Hauch
            @{ t = 'Grid#IconPanel@CommonStates > Border#BackgroundElement, Taskbar.TaskListLabeledButtonPanel@CommonStates > Border#BackgroundElement'
               s = @(
                   "Background@ActiveNormal:=$(& $tint 0.16)",
                   "Background@ActivePointerOver:=$(& $tint 0.26)",
                   "Background@ActivePressed:=$(& $tint 0.32)",
                   "Background@InactivePointerOver:=$(& $white 0.06)",
                   "Background@InactivePressed:=$(& $white 0.10)",
                   'CornerRadius=8') }
            # Laufende Apps: Strich in B, aktive App im Aurora-Verlauf
            @{ t = 'Grid#IconPanel@RunningIndicatorStates > Rectangle#RunningIndicator, Taskbar.TaskListLabeledButtonPanel@RunningIndicatorStates > Rectangle#RunningIndicator'
               s = @(
                   "Fill:=<SolidColorBrush Color=`"$B`" Opacity=`"0.55`"/>",
                   "Fill@ActiveRunningIndicator:=$grad",
                   'Width@ActiveRunningIndicator=18',
                   'RadiusX=1.5', 'RadiusY=1.5') }
            @{ t = 'Taskbar.TaskListButton'; s = @('CornerRadius=8') }
            @{ t = 'Taskbar.ExperienceToggleButton'; s = @('CornerRadius=8') }
            # Vorschau-Flyout beim Hover
            @{ t = 'Taskbar.TaskbarBackground#HoverFlyoutBackgroundControl > Grid > Rectangle#BackgroundFill'
               s = @("Fill:=$glass") }
        )
    }
    'windows-11-start-menu-styler' = @{
        controlStyles = @(
            @{ t = 'Border#AcrylicBorder'
               s = @("Background:=$glass", 'BorderThickness=1', "BorderBrush:=$line", 'CornerRadius=14') }
            @{ t = 'Border#AcrylicOverlay'; s = @('Visibility=Collapsed') }
            @{ t = 'Border#AppBorder'
               s = @("Background:=$glass", 'BorderThickness=1', "BorderBrush:=$line", 'CornerRadius=14') }
            @{ t = 'Border#dropshadow'; s = @('CornerRadius=15', 'Margin=-1') }
            @{ t = 'Border#StartDropShadow'; s = @('CornerRadius=14', 'Margin=-1') }
            # Suchfeld: dunkle Pille mit Akzentkante (neues und klassisches Layout)
            @{ t = 'StartMenu.SearchBoxToggleButton > Grid > Border#BorderElement, StartDocked.SearchBoxToggleButton > Grid > Border#BorderElement'
               s = @("Background:=$field", "BorderBrush:=$(& $tint 0.35)", 'BorderThickness=1', 'CornerRadius=10') }
            @{ t = 'MenuFlyoutPresenter > Border'
               s = @("Background:=$glass", 'CornerRadius=10') }
            @{ t = 'StartMenu.FolderModal > Grid > Border'
               s = @("Background:=$glass", 'CornerRadius=14') }
        )
    }
    'windows-11-file-explorer-styler' = @{
        # Mica nur im Kopfbereich (Tabs, Adresse, Befehlsleiste). Ueber das ganze Fenster wurden
        # Navigation und Dateiliste auf Build 26300 heller grau (#3a3a3e) statt dunkler.
        # (micaAlt ueber das ganze Fenster: ebenfalls hellgrau)
        backgroundTranslucentEffect = 'mica'
        backgroundTranslucentEffectRegion = 'explorerFrame'
        controlStyles = @(
            @{ t = 'FileExplorerExtensions.CommandBarControl_Wave1 > Grid, Grid#CommandBarControlRootGrid'
               s = @('Background=Transparent') }
            @{ t = 'CommandBar#FileExplorerCommandBar'
               s = @('Background=Transparent', 'BorderThickness=0,0,0,1', "BorderBrush:=$line") }
            @{ t = 'Grid#NavigationBarControlGrid'; s = @('Background=Transparent') }
            @{ t = 'Grid#PART_LayoutRoot'
               s = @("Background:=$field", 'CornerRadius=8') }
            @{ t = 'AutoSuggestBox#FileExplorerSearchBox > Grid#LayoutRoot > TextBox > Grid@CommonStates > Border#BorderElement'
               s = @("Background:=$field", 'CornerRadius=8', 'BorderThickness=0') }
            @{ t = 'TabViewItem > Grid#LayoutRoot > Canvas > Microsoft.UI.Xaml.Shapes.Path#SelectedBackgroundPath'
               s = @("Fill:=$(& $tint 0.16)") }
        )
    }
    'windows-11-notification-center-styler' = @{
        controlStyles = @(
            @{ t = 'Grid#NotificationCenterGrid, Grid#CalendarCenterGrid, Grid#ControlCenterRegion, Windows.UI.Xaml.Controls.Grid#MediaTransportControlsRegion, Border#JumpListRestyledAcrylic'
               s = @("Background:=$glass", 'BorderThickness=1', "BorderBrush:=$line", 'CornerRadius=14') }
        )
    }
}

$root = 'HKLM:\SOFTWARE\Windhawk\Engine\Mods'
foreach ($id in $mods.Keys) {
    $modKey = Join-Path $root $id
    if (-not (Test-Path $modKey)) { Write-Host "uebersprungen (nicht installiert): $id"; continue }

    # Wie Windhawk selbst: Settings komplett neu schreiben, damit keine alten Indizes stehen bleiben
    $settingsKey = Join-Path $modKey 'Settings'
    if (Test-Path $settingsKey) { Remove-Item $settingsKey -Recurse -Force }
    New-Item $settingsKey -Force | Out-Null

    $cfg = $mods[$id]
    New-ItemProperty $settingsKey 'theme' -Value '' -PropertyType String | Out-Null
    foreach ($k in $cfg.Keys | Where-Object { $_ -ne 'controlStyles' }) {
        New-ItemProperty $settingsKey $k -Value $cfg[$k] -PropertyType String | Out-Null
    }
    for ($i = 0; $i -lt $cfg.controlStyles.Count; $i++) {
        $cs = $cfg.controlStyles[$i]
        New-ItemProperty $settingsKey "controlStyles[$i].target" -Value $cs.t -PropertyType String | Out-Null
        for ($j = 0; $j -lt $cs.s.Count; $j++) {
            New-ItemProperty $settingsKey "controlStyles[$i].styles[$j]" -Value $cs.s[$j] -PropertyType String | Out-Null
        }
    }

    # Engine benachrichtigen: SettingsChangeTime muss sich aendern
    $old = (Get-ItemProperty $modKey -Name SettingsChangeTime -ErrorAction SilentlyContinue).SettingsChangeTime
    $stamp = [int]([DateTimeOffset]::UtcNow.ToUnixTimeSeconds() -band 0x7FFFFFFF)
    if ($old -and $stamp -le $old) { $stamp = $old + 1 }
    New-ItemProperty $modKey 'SettingsChangeTime' -Value $stamp -PropertyType DWord -Force | Out-Null
    Write-Host "gesetzt: $id ($($cfg.controlStyles.Count) Regeln, Variante $Variant)"
}
if ($LogPath) { Stop-Transcript | Out-Null }
