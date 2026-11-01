<#
.SYNOPSIS
  TrackFit per USB-C auf ein oder mehrere Android-Handys installieren bzw. aktualisieren.

.DESCRIPTION
  Notfall-Weg, wenn das automatische Online-Update (EAS Update) nicht ankommt oder ein
  neuer nativer Build noetig ist. Installiert mit "adb install -r": die App wird
  UEBER die vorhandene App installiert - Trainings, Plaene und Profil bleiben ERHALTEN.

  Woher kommt die APK?
    (ohne Angabe)  neueste APK im Ordner releases\  (oder Angebot zum Download)
    -Apk <Pfad>    genau diese APK-Datei
    -Download      neuesten fertigen EAS-Build (Profil "preview") herunterladen
    -Build         neuen EAS-Cloud-Build starten, abwarten und herunterladen

  adb (Android platform-tools) wird gesucht und bei Bedarf automatisch von Google
  nach tools\platform-tools\ geladen.

.PARAMETER NoInstall
  Nur die APK nach releases\ holen (Vorbereitung), nichts installieren.
.PARAMETER Serial
  Nur auf dieses Geraet installieren (Seriennummer aus "adb devices").
  Standard: alle per USB verbundenen Geraete nacheinander.
.PARAMETER Reinstall
  App vorher DEINSTALLIEREN. Loescht ALLE App-Daten auf dem Geraet! Nur noetig, wenn
  die APK mit einem anderen Schluessel signiert ist. Verlangt eine getippte Bestaetigung.
.PARAMETER NoLaunch
  App nach der Installation nicht automatisch starten.
.PARAMETER Yes
  Keine Rueckfragen (ausser bei -Reinstall).

.EXAMPLE
  .\scripts\usb-install.ps1
.EXAMPLE
  .\scripts\usb-install.ps1 -Download
.EXAMPLE
  .\scripts\usb-install.ps1 -Download -NoInstall
.EXAMPLE
  .\scripts\usb-install.ps1 -Apk "$HOME\Downloads\trackfit.apk"
#>
[CmdletBinding()]
param(
  [string]$Apk,
  [switch]$Download,
  [switch]$Build,
  [switch]$NoInstall,
  [string]$Serial,
  [switch]$Reinstall,
  [switch]$NoLaunch,
  [switch]$Yes
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'  # Invoke-WebRequest ist in PS 5.1 sonst extrem langsam
. (Join-Path $PSScriptRoot '_common.ps1')

$app = Get-AppConfig
$BuildProfile = 'preview'
$PlatformToolsUrl = 'https://dl.google.com/android/repository/platform-tools-latest-windows.zip'

# ------------------------------------------------------------------------------------
# APK beschaffen
# ------------------------------------------------------------------------------------

function Get-EasCli {
  $eas = Find-Executable 'eas'
  if ($eas) { return [pscustomobject]@{ Exe = $eas; Prefix = @() } }
  $npx = Find-Executable 'npx'
  if ($npx) { return [pscustomobject]@{ Exe = $npx; Prefix = @('--yes', 'eas-cli') } }
  Stop-WithError 'Weder "eas" noch "npx" gefunden.' @(
    'Node.js LTS installieren: https://nodejs.org',
    'danach im Terminal:  npm install -g eas-cli',
    'und einmalig:        eas login')
}

# Fuehrt eas mit --json aus. stdout = JSON, Fortschritt (stderr) laeuft sichtbar in die Konsole.
function Invoke-EasJson([string[]]$EasArgs) {
  $cli = Get-EasCli
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  Push-Location -LiteralPath $RepoRoot
  try {
    $out = & $cli.Exe @($cli.Prefix + $EasArgs)
    $code = $LASTEXITCODE
  } finally {
    Pop-Location
    $ErrorActionPreference = $prev
  }
  if ($code -ne 0) {
    Stop-WithError "eas $($EasArgs[0]) ist fehlgeschlagen (Exit-Code $code)." @(
      'Bei EAS eingeloggt?  ->  eas login',
      'Ist expo.dev erreichbar? Falls nicht: APK lokal bauen ->  .\scripts\build-apk-local.ps1')
  }
  $text = ($out | Out-String)
  $start = $text.IndexOfAny([char[]]'[{')
  if ($start -lt 0) { Stop-WithError 'eas hat kein JSON geliefert.' }
  try {
    return ($text.Substring($start) | ConvertFrom-Json)
  } catch {
    Stop-WithError "Antwort von eas konnte nicht gelesen werden: $($_.Exception.Message)"
  }
}

function Get-ArtifactUrl($BuildInfo) {
  if ($BuildInfo.artifacts) {
    if ($BuildInfo.artifacts.applicationArchiveUrl) { return [string]$BuildInfo.artifacts.applicationArchiveUrl }
    if ($BuildInfo.artifacts.buildUrl) { return [string]$BuildInfo.artifacts.buildUrl }
  }
  return $null
}

function Save-Apk([string]$Url, [string]$FileName) {
  if (-not (Test-Path -LiteralPath $ReleasesDir)) { New-Item -ItemType Directory -Path $ReleasesDir | Out-Null }
  $dest = [IO.Path]::Combine($ReleasesDir, $FileName)
  if (Test-Path -LiteralPath $dest) {
    Write-Ok "Schon vorhanden, kein erneuter Download: $dest"
    return $dest
  }
  Write-Info "Lade herunter: $Url"
  if ($IsWin) {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
  }
  $part = "$dest.part"
  try {
    Invoke-WebRequest -Uri $Url -OutFile $part -UseBasicParsing
  } catch {
    Remove-Item -LiteralPath $part -ErrorAction SilentlyContinue
    Stop-WithError "Download fehlgeschlagen: $($_.Exception.Message)" @(
      'Internetverbindung pruefen',
      'Alternativ die APK im Browser von expo.dev laden und mit -Apk <Pfad> installieren')
  }
  Move-Item -LiteralPath $part -Destination $dest
  Write-Ok ('Gespeichert: {0} ({1:N1} MB)' -f $dest, ((Get-Item -LiteralPath $dest).Length / 1MB))
  return $dest
}

function Get-EasApk([switch]$NewBuild) {
  if ($NewBuild) {
    Write-Step "Starte neuen EAS-Cloud-Build (Profil '$BuildProfile') - dauert meist 10-20 Minuten ..."
    $builds = @(Invoke-EasJson @('build', '--platform', 'android', '--profile', $BuildProfile, '--non-interactive', '--wait', '--json'))
  } else {
    Write-Step "Suche den neuesten fertigen EAS-Build (Profil '$BuildProfile') ..."
    $builds = @(Invoke-EasJson @('build:list', '--platform', 'android', '--status', 'finished', '--limit', '20', '--json', '--non-interactive'))
  }
  $build = $builds | Where-Object {
    ((-not $_.buildProfile) -or $_.buildProfile -eq $BuildProfile) -and ((Get-ArtifactUrl $_) -match '\.apk(\?|$)')
  } | Select-Object -First 1
  if (-not $build) {
    Stop-WithError "Kein fertiger APK-Build mit Profil '$BuildProfile' gefunden." @(
      'Neuen Build starten:  .\scripts\usb-install.ps1 -Build   (oder: npm run build:apk)',
      'Ohne EAS-Cloud:       .\scripts\build-apk-local.ps1')
  }
  $commit = if ($build.gitCommitHash) { ([string]$build.gitCommitHash).Substring(0, 7) } else { '?' }
  # PS 7 liefert completedAt schon als DateTime, PS 5.1 als ISO-Text
  $done = $build.completedAt
  if ($done -and -not ($done -is [datetime])) {
    try { $done = [datetime]::Parse([string]$done, [Globalization.CultureInfo]::InvariantCulture) } catch { $done = [string]$done }
  }
  $done = if ($done -is [datetime]) { $done.ToLocalTime().ToString('dd.MM.yyyy HH:mm') } elseif ($done) { $done } else { '?' }
  Write-Info ("Build {0}  |  Version {1}  |  Runtime {2}  |  Channel {3}  |  Commit {4}  |  fertig {5}" -f `
      $build.id, $build.appVersion, $build.runtimeVersion, $build.channel, $commit, $done)
  if ($build.runtimeVersion -and $build.runtimeVersion -ne $app.Version) {
    Write-Warn "Dieser Build hat runtimeVersion $($build.runtimeVersion), app.json steht auf $($app.Version)."
    Write-Warn "OTA-Updates (eas update) erreichen nur Builds mit gleicher runtimeVersion."
  }
  $id = [string]$build.id
  $short = if ($id) { $id.Substring(0, [Math]::Min(8, $id.Length)) } else { Get-Date -Format 'yyyyMMdd-HHmm' }
  $version = if ($build.appVersion) { $build.appVersion } else { $app.Version }
  return (Save-Apk (Get-ArtifactUrl $build) "TrackFit-$version-eas-$short.apk")
}

function Get-NewestReleaseApk {
  if (-not (Test-Path -LiteralPath $ReleasesDir)) { return $null }
  $file = Get-ChildItem -LiteralPath $ReleasesDir -Filter '*.apk' -File |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if ($file) { return $file.FullName }
  return $null
}

# ------------------------------------------------------------------------------------
# adb + Geraete
# ------------------------------------------------------------------------------------

function Find-Adb {
  $onPath = Find-Executable 'adb'
  if ($onPath) { return $onPath }
  $exe = if ($IsWin) { 'adb.exe' } else { 'adb' }
  $roots = @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT)
  if ($env:LOCALAPPDATA) { $roots += [IO.Path]::Combine($env:LOCALAPPDATA, 'Android', 'Sdk') }
  $candidates = @()
  foreach ($r in $roots) { if ($r) { $candidates += [IO.Path]::Combine($r, 'platform-tools', $exe) } }
  $candidates += [IO.Path]::Combine($RepoRoot, 'tools', 'platform-tools', $exe)
  foreach ($c in $candidates) { if (Test-Path -LiteralPath $c -PathType Leaf) { return $c } }
  return $null
}

function Install-PlatformTools {
  if (-not $IsWin) {
    Stop-WithError 'adb nicht gefunden.' @('Android platform-tools installieren (z. B. ueber Android Studio oder den Paketmanager).')
  }
  Write-Warn 'adb (Android platform-tools) ist nicht installiert.'
  Write-Info 'Download von Google (ca. 10 MB) nach tools\platform-tools\ - mit dem Download'
  Write-Info 'akzeptierst du die Lizenzbedingungen des Android SDK.'
  if (-not ($Yes -or (Confirm-Yes 'Jetzt herunterladen?'))) {
    Stop-WithError 'Ohne adb ist keine USB-Installation moeglich.' @("Manuell: $PlatformToolsUrl entpacken nach tools\")
  }
  $toolsDir = [IO.Path]::Combine($RepoRoot, 'tools')
  $zip = [IO.Path]::Combine($env:TEMP, 'platform-tools-latest-windows.zip')
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
  try {
    Invoke-WebRequest -Uri $PlatformToolsUrl -OutFile $zip -UseBasicParsing
    Expand-Archive -LiteralPath $zip -DestinationPath $toolsDir -Force
  } catch {
    Stop-WithError "platform-tools konnten nicht geladen werden: $($_.Exception.Message)" @("Manuell: $PlatformToolsUrl entpacken nach tools\")
  } finally {
    Remove-Item -LiteralPath $zip -ErrorAction SilentlyContinue
  }
  $adbPath = [IO.Path]::Combine($toolsDir, 'platform-tools', 'adb.exe')
  if (-not (Test-Path -LiteralPath $adbPath)) { Stop-WithError "adb.exe nach dem Entpacken nicht gefunden ($adbPath)." }
  Write-Ok "adb installiert: $adbPath"
  return $adbPath
}

function Get-AdbDevices {
  $r = Invoke-Native $script:Adb @('devices')
  foreach ($line in $r.Lines) {
    if ($line -match '^(\S+)\s+(device|unauthorized|offline|authorizing|recovery|sideload|bootloader|no permissions.*)\s*$') {
      [pscustomobject]@{ Serial = $Matches[1]; State = $Matches[2] }
    }
  }
}

function Show-ConnectChecklist {
  Write-Warn 'Kein Handy gefunden. Bitte pruefen:'
  Write-Info '1. Handy per USB-C verbunden - mit einem DATEN-Kabel (reine Ladekabel gehen nicht)'
  Write-Info '2. Entwickleroptionen aktiv: Einstellungen > Telefoninfo (> Softwareinformationen)'
  Write-Info '   > 7x auf "Buildnummer" tippen'
  Write-Info '3. Einstellungen > Entwickleroptionen > "USB-Debugging" einschalten'
  Write-Info '4. Handy entsperren, Meldung "USB-Debugging zulassen?" mit "Zulassen" bestaetigen'
  Write-Info '5. Erscheint nichts: Kabel neu einstecken, USB-Modus "Dateiuebertragung" waehlen,'
  Write-Info '   bei Samsung ggf. den "Samsung USB Driver" fuer Windows installieren'
}

function Wait-ForDevices {
  while ($true) {
    $all = @(Get-AdbDevices)
    if ($Serial) { $all = @($all | Where-Object { $_.Serial -eq $Serial }) }
    $ready = @($all | Where-Object { $_.State -eq 'device' })
    foreach ($d in @($all | Where-Object { $_.State -ne 'device' })) {
      switch -Wildcard ($d.State) {
        'unauthorized' { Write-Warn "$($d.Serial): nicht freigegeben -> Handy entsperren und 'USB-Debugging zulassen?' bestaetigen ('Immer zulassen' anhaken)." }
        'authorizing'  { Write-Warn "$($d.Serial): wartet auf Freigabe am Handy." }
        'offline'      { Write-Warn "$($d.Serial): offline -> Kabel neu einstecken." }
        default        { Write-Warn "$($d.Serial): Zustand '$($d.State)' - wird uebersprungen." }
      }
    }
    if ($ready.Count -gt 0) { return $ready }
    if ($all.Count -eq 0) {
      if ($Serial) { Write-Warn "Geraet '$Serial' ist nicht verbunden." } else { Show-ConnectChecklist }
    }
    if ($Yes) { Stop-WithError 'Kein installationsbereites Geraet gefunden.' }
    $answer = Read-Host 'Enter = erneut pruefen, q = abbrechen'
    if ($answer -match '^\s*[qQnN]') { Stop-WithError 'Abgebrochen - es wurde nichts installiert.' }
  }
}

function Get-Prop([string]$DeviceSerial, [string]$Name) {
  return (Invoke-Native $script:Adb @('-s', $DeviceSerial, 'shell', 'getprop', $Name)).Text.Trim()
}

function Get-InstalledApp([string]$DeviceSerial) {
  $list = Invoke-Native $script:Adb @('-s', $DeviceSerial, 'shell', 'pm', 'list', 'packages', $app.Package)
  $installed = @($list.Lines | ForEach-Object { $_.Trim() }) -contains "package:$($app.Package)"
  if (-not $installed) { return $null }
  $info = (Invoke-Native $script:Adb @('-s', $DeviceSerial, 'shell', 'dumpsys', 'package', $app.Package)).Text
  [pscustomobject]@{
    VersionName = Get-Match $info 'versionName=(\S+)'
    VersionCode = Get-Match $info 'versionCode=(\d+)'
    LastUpdate  = Get-Match $info 'lastUpdateTime=([^\r\n]+)'
  }
}

function Show-InstallError([string]$Output) {
  Write-Host "    adb meldet: $($Output.Trim())" -ForegroundColor Red
  if ($Output -match 'INSTALL_FAILED_UPDATE_INCOMPATIBLE|signatures do not match') {
    Write-Warn 'Die APK ist mit einem ANDEREN Schluessel signiert als die installierte App.'
    Write-Warn 'Android erlaubt dann kein Drueber-Installieren. NICHT einfach deinstallieren -'
    Write-Warn 'dabei gehen alle Trainingsdaten verloren! Stattdessen:'
    Write-Info '  a) eine von EAS gebaute APK nehmen:  .\scripts\usb-install.ps1 -Download'
    Write-Info '  b) lokal bauen MIT dem EAS-Schluessel (credentials.json): .\scripts\build-apk-local.ps1'
    Write-Info '  c) nur wenn Datenverlust egal ist:   .\scripts\usb-install.ps1 -Reinstall'
  } elseif ($Output -match 'INSTALL_FAILED_VERSION_DOWNGRADE') {
    Write-Warn 'Auf dem Handy ist ein hoeherer versionCode installiert als in dieser APK.'
    Write-Info 'Neuere APK verwenden - bzw. beim lokalen Build: .\scripts\build-apk-local.ps1 -VersionCode <hoeher>'
  } elseif ($Output -match 'INSTALL_FAILED_USER_RESTRICTED|INSTALL_FAILED_ABORTED|INSTALL_CANCELED_BY_USER') {
    Write-Warn 'Die Installation wurde am Handy blockiert oder nicht bestaetigt.'
    Write-Info 'Auf eine Rueckfrage am Display achten. Xiaomi/Redmi/POCO: Entwickleroptionen >'
    Write-Info '"Ueber USB installieren" aktivieren (braucht dort ggf. SIM + Mi-Konto).'
  } elseif ($Output -match 'INSTALL_FAILED_INSUFFICIENT_STORAGE') {
    Write-Warn 'Zu wenig freier Speicher auf dem Handy.'
  } elseif ($Output -match 'INSTALL_FAILED_NO_MATCHING_ABIS') {
    Write-Warn 'Die APK enthaelt keinen Code fuer den Prozessor dieses Handys.'
    Write-Info 'Lokaler Build: -Architectures "arm64-v8a,armeabi-v7a,x86_64" angeben.'
  } elseif ($Output -match 'INSTALL_FAILED_OLDER_SDK') {
    Write-Warn 'Die Android-Version des Handys ist zu alt fuer diese App.'
  } elseif ($Output -match 'INSTALL_PARSE_FAILED|INSTALL_FAILED_INVALID_APK|INSTALL_FAILED_INVALID_URI') {
    Write-Warn 'Die APK-Datei ist beschaedigt oder unvollstaendig - bitte neu herunterladen/bauen.'
  }
}

# ------------------------------------------------------------------------------------
# Ablauf
# ------------------------------------------------------------------------------------

Write-Host ''
Write-Host "TrackFit - Installation/Update per USB  (Paket $($app.Package))" -ForegroundColor White

$sourceCount = @($Apk, $Download.IsPresent, $Build.IsPresent) | Where-Object { $_ } | Measure-Object
if ($sourceCount.Count -gt 1) { Stop-WithError 'Bitte nur EINE Quelle angeben: -Apk, -Download oder -Build.' }

if ($Build) {
  $apkPath = Get-EasApk -NewBuild
} elseif ($Download) {
  $apkPath = Get-EasApk
} elseif ($Apk) {
  if (-not (Test-Path -LiteralPath $Apk -PathType Leaf)) { Stop-WithError "APK nicht gefunden: $Apk" }
  $apkPath = (Resolve-Path -LiteralPath $Apk).Path
} else {
  $apkPath = Get-NewestReleaseApk
  if (-not $apkPath) {
    Write-Warn 'Im Ordner releases\ liegt noch keine APK.'
    if ($Yes -or (Confirm-Yes 'Neuesten EAS-Build jetzt herunterladen?')) {
      $apkPath = Get-EasApk
    } else {
      Stop-WithError 'Keine APK ausgewaehlt.' @(
        'APK von EAS laden:   .\scripts\usb-install.ps1 -Download',
        'Bestimmte Datei:     .\scripts\usb-install.ps1 -Apk <Pfad>',
        'Ohne EAS-Cloud:      .\scripts\build-apk-local.ps1')
    }
  }
}
if ($apkPath -notmatch '\.apk$') { Stop-WithError "Das ist keine .apk-Datei: $apkPath" }

$apkItem = Get-Item -LiteralPath $apkPath
Write-Step 'APK'
Write-Info ('{0}  ({1:N1} MB, Stand {2:dd.MM.yyyy HH:mm})' -f $apkItem.FullName, ($apkItem.Length / 1MB), $apkItem.LastWriteTime)

if ($NoInstall) {
  Write-Ok 'APK liegt bereit. Installation spaeter mit:  .\scripts\usb-install.ps1'
  exit 0
}

Write-Step 'Suche adb ...'
$script:Adb = Find-Adb
if (-not $script:Adb) { $script:Adb = Install-PlatformTools }
Write-Ok $script:Adb

Write-Step 'Suche per USB verbundene Handys ...'
$devices = @(Wait-ForDevices)
foreach ($d in $devices) {
  $d | Add-Member -NotePropertyName Label -NotePropertyValue ('{0} {1} (Android {2}, {3})' -f `
      (Get-Prop $d.Serial 'ro.product.manufacturer'), (Get-Prop $d.Serial 'ro.product.model'),
      (Get-Prop $d.Serial 'ro.build.version.release'), $d.Serial)
  Write-Ok $d.Label
}

if ($Reinstall) {
  Write-Host ''
  Write-Host '    ACHTUNG: -Reinstall DEINSTALLIERT TrackFit vorher. Alle Trainings, Plaene und' -ForegroundColor Red
  Write-Host '    das Profil auf den oben genannten Geraeten werden UNWIDERRUFLICH geloescht!' -ForegroundColor Red
  $confirm = Read-Host 'Zum Bestaetigen LOESCHEN eintippen'
  if ($confirm -cne 'LOESCHEN') { Stop-WithError 'Abgebrochen - es wurde nichts veraendert.' }
} elseif (-not $Yes) {
  if (-not (Confirm-Yes "APK jetzt auf $($devices.Count) Geraet(en) installieren?")) {
    Stop-WithError 'Abgebrochen - es wurde nichts installiert.'
  }
}

$failed = 0
foreach ($d in $devices) {
  Write-Step "Installiere auf $($d.Label)"
  $before = Get-InstalledApp $d.Serial
  if ($before) {
    Write-Info "Vorher: Version $($before.VersionName) (Code $($before.VersionCode)), zuletzt aktualisiert $($before.LastUpdate)"
  } else {
    Write-Info 'TrackFit ist hier noch nicht installiert -> Neuinstallation.'
  }

  if ($Reinstall -and $before) {
    Write-Warn 'Deinstalliere TrackFit (App-Daten werden geloescht) ...'
    $u = Invoke-Native $script:Adb @('-s', $d.Serial, 'uninstall', $app.Package)
    if ($u.Text -notmatch 'Success') {
      Write-Host "    Deinstallation fehlgeschlagen: $($u.Text.Trim())" -ForegroundColor Red
      $failed++
      continue
    }
  }

  if ($Reinstall) { Write-Info 'adb install ...' } else { Write-Info 'adb install -r  (App-Daten bleiben erhalten) ...' }
  $r = Invoke-Native $script:Adb @('-s', $d.Serial, 'install', '-r', $apkItem.FullName)
  if ($r.ExitCode -eq 0 -and $r.Text -match '(?m)^Success') {
    $after = Get-InstalledApp $d.Serial
    if ($after) {
      Write-Ok "Installiert: Version $($after.VersionName) (Code $($after.VersionCode)), $($after.LastUpdate)"
    } else {
      Write-Ok 'Installiert.'
    }
    if (-not $NoLaunch) {
      Invoke-Native $script:Adb @('-s', $d.Serial, 'shell', 'monkey', '-p', $app.Package, '-c', 'android.intent.category.LAUNCHER', '1') | Out-Null
      Write-Ok 'App gestartet.'
    }
  } else {
    $failed++
    Show-InstallError $r.Text
  }
}

Write-Host ''
if ($failed -gt 0) {
  Write-Host "Fertig mit Fehlern: $($devices.Count - $failed) von $($devices.Count) Geraet(en) aktualisiert." -ForegroundColor Red
  exit 1
}
Write-Host "Fertig: TrackFit auf $($devices.Count) Geraet(en) installiert/aktualisiert." -ForegroundColor Green
Write-Info 'Kuenftige JS-Updates kommen wieder automatisch online (eas update), sobald das Handy Internet hat.'
exit 0
