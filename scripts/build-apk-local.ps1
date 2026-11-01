<#
.SYNOPSIS
  Plan C: TrackFit-APK lokal auf dem PC bauen (ohne EAS-Cloud) - signiert mit dem
  EAS-Schluessel, damit sie sich UEBER die installierte App installieren laesst.

.DESCRIPTION
  Fuer den Fall, dass expo.dev / EAS Build nicht erreichbar ist. Ablauf:
    1. npx expo prebuild  -> erzeugt android\ (ist in .gitignore, package.json bleibt unveraendert)
    2. Update-Channel "preview" eintragen, damit die App weiter OTA-Updates bekommt
    3. Gradle: :app:assembleRelease
    4. Mit dem EAS-Keystore aus credentials.json neu signieren (apksigner)
    5. Ergebnis nach releases\TrackFit-<version>-local-<datum>.apk
    6. optional (-Install) direkt per USB installieren

  Einmalige Voraussetzungen auf dem PC:
    - Node.js LTS, JDK 17+ und das Android SDK (am einfachsten: Android Studio installieren)
    - credentials.json + Keystore von EAS herunterladen, SOLANGE EAS ERREICHBAR IST:
        eas credentials --platform android
        -> Profil "preview" -> "credentials.json: Upload/Download credentials ..."
        -> "Download credentials from EAS to credentials.json"
      Ohne diesen Schluessel kann keine APK gebaut werden, die sich ueber die
      installierte App installieren laesst (siehe -AllowDebugKey).

.PARAMETER Credentials
  Pfad zur credentials.json (Standard: credentials.json im Projektordner).
.PARAMETER Channel
  EAS-Update-Channel, den die App abfragt (Standard: preview, wie der EAS-Build).
.PARAMETER VersionCode
  Android-versionCode ueberschreiben (nur noetig bei INSTALL_FAILED_VERSION_DOWNGRADE).
.PARAMETER Architectures
  CPU-Architekturen (Standard: arm64-v8a,armeabi-v7a = alle echten Handys; schneller Build).
.PARAMETER AllowDebugKey
  Ohne credentials.json mit dem Debug-Schluessel signieren. So eine APK laesst sich NICHT
  ueber eine EAS-Installation installieren - nur auf Geraeten ohne TrackFit (oder nach
  Deinstallation = Datenverlust). Nur als allerletzter Ausweg.
.PARAMETER PrepareOnly
  Nur android\ erzeugen und vorbereiten (z. B. um in Android Studio zu bauen).
.PARAMETER Install
  Nach dem Build direkt scripts\usb-install.ps1 mit der neuen APK starten.

.EXAMPLE
  .\scripts\build-apk-local.ps1 -Install
#>
[CmdletBinding()]
param(
  [string]$Credentials = 'credentials.json',
  [string]$Channel = 'preview',
  [int]$VersionCode = 0,
  [string]$Architectures = 'arm64-v8a,armeabi-v7a',
  [switch]$AllowDebugKey,
  [switch]$PrepareOnly,
  [switch]$Install
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '_common.ps1')

$app = Get-AppConfig
$androidDir = [IO.Path]::Combine($RepoRoot, 'android')

function ConvertTo-SafeVersion([string]$Text) {
  $m = [regex]::Match($Text, '^\d+(\.\d+){0,3}')
  if (-not $m.Success) { return [version]'0.0' }
  $v = $m.Value
  if ($v -notmatch '\.') { $v = "$v.0" }
  return [version]$v
}

function Find-Java {
  $java = Find-Executable 'java'
  $exe = if ($IsWin) { 'java.exe' } else { 'java' }
  if (-not $java -and $env:JAVA_HOME) {
    $p = [IO.Path]::Combine($env:JAVA_HOME, 'bin', $exe)
    if (Test-Path -LiteralPath $p) { $java = $p }
  }
  if (-not $java -and $IsWin) {
    # Android Studio bringt ein passendes JDK mit ("jbr")
    $jbr = [IO.Path]::Combine($env:ProgramFiles, 'Android', 'Android Studio', 'jbr')
    $p = [IO.Path]::Combine($jbr, 'bin', $exe)
    if (Test-Path -LiteralPath $p) {
      $env:JAVA_HOME = $jbr
      $java = $p
    }
  }
  return $java
}

function Find-AndroidSdk {
  $candidates = @($env:ANDROID_HOME, $env:ANDROID_SDK_ROOT)
  if ($env:LOCALAPPDATA) { $candidates += [IO.Path]::Combine($env:LOCALAPPDATA, 'Android', 'Sdk') }
  if ($HOME) { $candidates += [IO.Path]::Combine($HOME, 'Android', 'Sdk') }
  foreach ($c in $candidates) { if ($c -and (Test-Path -LiteralPath $c -PathType Container)) { return $c } }
  return $null
}

function Find-ApkSigner([string]$Sdk) {
  $root = [IO.Path]::Combine($Sdk, 'build-tools')
  if (-not (Test-Path -LiteralPath $root)) { return $null }
  $name = if ($IsWin) { 'apksigner.bat' } else { 'apksigner' }
  $dirs = Get-ChildItem -LiteralPath $root -Directory | Sort-Object { ConvertTo-SafeVersion $_.Name } -Descending
  foreach ($d in $dirs) {
    $p = [IO.Path]::Combine($d.FullName, $name)
    if (Test-Path -LiteralPath $p) { return $p }
  }
  return $null
}

Write-Host ''
Write-Host "TrackFit - lokaler APK-Build (ohne EAS-Cloud)  |  Version $($app.Version), Paket $($app.Package)" -ForegroundColor White

# ------------------------------------------------------------------------------------
# 1. Voraussetzungen
# ------------------------------------------------------------------------------------
Write-Step 'Pruefe Voraussetzungen ...'

$npx = Find-Executable 'npx'
$npm = Find-Executable 'npm'
if (-not $npx -or -not $npm) { Stop-WithError 'Node.js (npm/npx) nicht gefunden.' @('Node.js LTS installieren: https://nodejs.org') }
Write-Ok "Node.js: $npx"

$keystore = $null
if (-not $PrepareOnly) {
  $java = Find-Java
  if (-not $java) {
    Stop-WithError 'Java (JDK 17+) nicht gefunden.' @(
      'Android Studio installieren (bringt ein JDK mit) - oder z. B. "Microsoft Build of OpenJDK 17"',
      'danach PowerShell neu oeffnen')
  }
  $javaVersion = (Invoke-Native $java @('-version')).Text
  $versionText = Get-Match $javaVersion 'version "(1\.\d+|\d+)'   # "1.8.0_x" (alt) oder "17.0.x"
  $major = 0
  if ($versionText -match '^1\.(\d+)$') { $major = [int]$Matches[1] } elseif ($versionText -match '^\d+$') { $major = [int]$versionText }
  if ($major -lt 17) { Stop-WithError "Java '$versionText' ist zu alt oder unbekannt - benoetigt wird JDK 17 oder neuer." @("Gefunden: $java") }
  Write-Ok "Java ${major}: $java"

  $sdk = Find-AndroidSdk
  if (-not $sdk) {
    Stop-WithError 'Android SDK nicht gefunden.' @(
      'Android Studio installieren und einmal starten (installiert das SDK nach %LOCALAPPDATA%\Android\Sdk)',
      'oder die Umgebungsvariable ANDROID_HOME auf den SDK-Ordner setzen')
  }
  $env:ANDROID_HOME = $sdk
  Write-Ok "Android SDK: $sdk"

  $credPath = if ([IO.Path]::IsPathRooted($Credentials)) { $Credentials } else { [IO.Path]::Combine($RepoRoot, $Credentials) }
  if (Test-Path -LiteralPath $credPath -PathType Leaf) {
    $ks = (Get-Content -LiteralPath $credPath -Raw -Encoding UTF8 | ConvertFrom-Json).android.keystore
    if (-not $ks -or -not $ks.keystorePath -or -not $ks.keyAlias -or -not $ks.keystorePassword) {
      Stop-WithError "$credPath enthaelt keinen vollstaendigen Android-Keystore (android.keystore.*)."
    }
    $ksPath = [string]$ks.keystorePath
    if (-not [IO.Path]::IsPathRooted($ksPath)) { $ksPath = [IO.Path]::Combine((Split-Path -Parent $credPath), $ksPath) }
    if (-not (Test-Path -LiteralPath $ksPath -PathType Leaf)) { Stop-WithError "Keystore-Datei nicht gefunden: $ksPath" }
    $keyPassword = if ($ks.keyPassword) { [string]$ks.keyPassword } else { [string]$ks.keystorePassword }
    $keystore = [pscustomobject]@{ Path = $ksPath; Alias = [string]$ks.keyAlias; StorePass = [string]$ks.keystorePassword; KeyPass = $keyPassword }
    Write-Ok "Signatur-Schluessel (EAS): $ksPath (Alias $($keystore.Alias))"
  } elseif ($AllowDebugKey) {
    Write-Warn 'Keine credentials.json -> Signatur mit DEBUG-Schluessel (-AllowDebugKey).'
    Write-Warn 'Diese APK laesst sich NICHT ueber eine von EAS gebaute TrackFit-App installieren!'
  } else {
    Stop-WithError "credentials.json nicht gefunden ($credPath)." @(
      'Ohne den EAS-Schluessel bekommt die APK eine andere Signatur und laesst sich NICHT ueber die vorhandene App installieren (nur nach Deinstallation = Verlust aller Trainingsdaten).',
      'Schluessel holen (braucht einmal Internet): eas credentials --platform android -> preview -> "credentials.json: Upload/Download ..." -> "Download credentials from EAS to credentials.json"',
      'Nur fuer Geraete OHNE TrackFit: erneut mit -AllowDebugKey starten')
  }

  if ($IsWin) {
    $longPaths = (Get-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name LongPathsEnabled -ErrorAction SilentlyContinue).LongPathsEnabled
    if ($longPaths -ne 1 -and $RepoRoot.Length -gt 40) {
      Write-Warn "Langer Projektpfad ($($RepoRoot.Length) Zeichen) und Windows-'Long Paths' sind aus."
      Write-Warn 'Der native Build kann dann mit "Filename longer than 260 characters" scheitern.'
      Write-Warn 'Abhilfe: Projekt nach z. B. C:\dev\TrackFit klonen - oder als Admin ausfuehren:'
      Write-Info "  New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force"
    }
  }
}

$git = Find-Executable 'git'
if ($git) {
  $dirty = (Invoke-Native $git @('-C', $RepoRoot, 'status', '--porcelain', '--untracked-files=no')).Text.Trim()
  if ($dirty) { Write-Warn 'Es gibt nicht committete Aenderungen - sie landen mit in der APK.' }
  $commit = (Invoke-Native $git @('-C', $RepoRoot, 'rev-parse', '--short', 'HEAD')).Text.Trim()
  Write-Info "Code-Stand: Commit $commit"
}

# ------------------------------------------------------------------------------------
# 2. Abhaengigkeiten + nativer Android-Ordner
# ------------------------------------------------------------------------------------
if (-not (Test-Path -LiteralPath ([IO.Path]::Combine($RepoRoot, 'node_modules')))) {
  Write-Step 'Installiere npm-Abhaengigkeiten (npm ci) ...'
  if ((Invoke-Streamed $npm @('ci', '--no-audit', '--no-fund')) -ne 0) { Stop-WithError 'npm ci ist fehlgeschlagen.' }
}

Write-Step 'Erzeuge android\ (expo prebuild --clean) ...'
# prebuild schreibt die Skripte in package.json um -> vorher sichern, danach zurueckspielen.
$packageJson = [IO.Path]::Combine($RepoRoot, 'package.json')
$packageBackup = [IO.Path]::GetTempFileName()
Copy-Item -LiteralPath $packageJson -Destination $packageBackup -Force
$oldCI = $env:CI
$oldNoGitStatus = $env:EXPO_NO_GIT_STATUS
$env:CI = '1'                   # keine Rueckfragen
$env:EXPO_NO_GIT_STATUS = '1'   # nicht wegen uncommitteter Aenderungen nachfragen
try {
  $code = Invoke-Streamed $npx @('expo', 'prebuild', '--platform', 'android', '--clean', '--no-install')
} finally {
  $env:CI = $oldCI
  $env:EXPO_NO_GIT_STATUS = $oldNoGitStatus
  Copy-Item -LiteralPath $packageBackup -Destination $packageJson -Force
  Remove-Item -LiteralPath $packageBackup -ErrorAction SilentlyContinue
}
if ($code -ne 0) { Stop-WithError "expo prebuild ist fehlgeschlagen (Exit-Code $code)." }
Write-Ok 'android\ erzeugt (package.json unveraendert)'

# Update-Channel: EAS Build traegt ihn automatisch ein, ein lokaler Build nicht. Ohne
# Channel wuerde die App keine OTA-Updates (eas update --branch preview) mehr finden.
$manifestPath = [IO.Path]::Combine($androidDir, 'app', 'src', 'main', 'AndroidManifest.xml')
$manifest = [IO.File]::ReadAllText($manifestPath)
$headerKey = 'expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY'
if ($manifest.Contains($headerKey)) {
  Write-Info 'Update-Header sind bereits in app.json konfiguriert - unveraendert uebernommen.'
} else {
  $anchor = [regex]::Match($manifest, '<meta-data android:name="expo\.modules\.updates\.EXPO_UPDATE_URL"[^>]*/>')
  if (-not $anchor.Success) { Stop-WithError 'EXPO_UPDATE_URL nicht im AndroidManifest gefunden - ist expo-updates noch konfiguriert?' }
  $headerValue = '{&quot;expo-channel-name&quot;:&quot;' + $Channel + '&quot;}'
  $entry = "`n    <meta-data android:name=`"$headerKey`" android:value=`"$headerValue`"/>"
  $manifest = $manifest.Insert($anchor.Index + $anchor.Length, $entry)
  [IO.File]::WriteAllText($manifestPath, $manifest)
  Write-Ok "Update-Channel '$Channel' eingetragen"
}

$gradleFile = [IO.Path]::Combine($androidDir, 'app', 'build.gradle')
$gradle = [IO.File]::ReadAllText($gradleFile)
if ($VersionCode -gt 0) {
  if ($gradle -notmatch 'versionCode\s+\d+') { Stop-WithError 'versionCode nicht in android\app\build.gradle gefunden.' }
  $gradle = [regex]::Replace($gradle, 'versionCode\s+\d+', "versionCode $VersionCode")
  [IO.File]::WriteAllText($gradleFile, $gradle)
}
$currentVersionCode = Get-Match $gradle 'versionCode\s+(\d+)'
Write-Info "versionName $($app.Version)  |  versionCode $currentVersionCode  |  runtimeVersion $($app.Version)  |  Channel $Channel"

if ($PrepareOnly) {
  Write-Host ''
  Write-Ok "Vorbereitet: $androidDir  (z. B. in Android Studio oeffnen und 'Build > Generate Signed App Bundle / APK')"
  exit 0
}

# ------------------------------------------------------------------------------------
# 3. Gradle-Build
# ------------------------------------------------------------------------------------
Write-Step "Baue Release-APK mit Gradle ($Architectures) - beim ersten Mal 10-30 Minuten ..."
$gradlew = if ($IsWin) { [IO.Path]::Combine($androidDir, 'gradlew.bat') } else { [IO.Path]::Combine($androidDir, 'gradlew') }
$code = Invoke-Streamed $gradlew @(':app:assembleRelease', "-PreactNativeArchitectures=$Architectures") -WorkingDirectory $androidDir
if ($code -ne 0) {
  Stop-WithError "Gradle-Build fehlgeschlagen (Exit-Code $code)." @(
    'Fehlermeldung oben lesen; haeufig: fehlende SDK-Pakete -> Android Studio > SDK Manager',
    'Windows: "Filename longer than 260 characters" -> Projekt in kurzen Pfad (C:\dev\TrackFit) legen')
}
$builtApk = [IO.Path]::Combine($androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
if (-not (Test-Path -LiteralPath $builtApk)) { Stop-WithError "Build-Ergebnis nicht gefunden: $builtApk" }

# ------------------------------------------------------------------------------------
# 4. Signieren
# ------------------------------------------------------------------------------------
if (-not (Test-Path -LiteralPath $ReleasesDir)) { New-Item -ItemType Directory -Path $ReleasesDir | Out-Null }
$stamp = Get-Date -Format 'yyyyMMdd-HHmm'

if ($keystore) {
  Write-Step 'Signiere mit dem EAS-Schluessel ...'
  $apksigner = Find-ApkSigner $sdk
  if (-not $apksigner) {
    Stop-WithError 'apksigner nicht gefunden.' @('Android Studio > SDK Manager > SDK Tools > "Android SDK Build-Tools" installieren')
  }
  $dest = [IO.Path]::Combine($ReleasesDir, "TrackFit-$($app.Version)-local-$stamp.apk")
  # Passwoerter ueber Umgebungsvariablen statt Kommandozeile (nicht in Prozessliste sichtbar)
  $env:TRACKFIT_KS_PASS = $keystore.StorePass
  $env:TRACKFIT_KEY_PASS = $keystore.KeyPass
  try {
    $code = Invoke-Streamed $apksigner @('sign', '--ks', $keystore.Path, '--ks-key-alias', $keystore.Alias,
      '--ks-pass', 'env:TRACKFIT_KS_PASS', '--key-pass', 'env:TRACKFIT_KEY_PASS', '--out', $dest, $builtApk)
  } finally {
    Remove-Item Env:TRACKFIT_KS_PASS, Env:TRACKFIT_KEY_PASS -ErrorAction SilentlyContinue
  }
  if ($code -ne 0) { Stop-WithError 'Signieren fehlgeschlagen - stimmen Passwort/Alias in credentials.json?' }
  $verify = Invoke-Native $apksigner @('verify', '--print-certs', $dest)
  if ($verify.ExitCode -ne 0) { Stop-WithError "Signatur-Pruefung fehlgeschlagen: $($verify.Text)" }
  Write-Ok "Signatur ok - Zertifikat SHA-256: $(Get-Match $verify.Text 'SHA-256 digest:\s*([0-9a-fA-F]+)')"
} else {
  $dest = [IO.Path]::Combine($ReleasesDir, "TrackFit-$($app.Version)-local-DEBUGKEY-$stamp.apk")
  Copy-Item -LiteralPath $builtApk -Destination $dest -Force
  Write-Warn 'Mit DEBUG-Schluessel signiert - nur fuer Geraete ohne (EAS-)TrackFit geeignet!'
}

Write-Host ''
Write-Ok ('Fertig: {0} ({1:N1} MB)' -f $dest, ((Get-Item -LiteralPath $dest).Length / 1MB))

if ($Install) {
  & (Join-Path $PSScriptRoot 'usb-install.ps1') -Apk $dest
  exit $LASTEXITCODE
}
Write-Info 'Installieren per USB:  .\scripts\usb-install.ps1   (nimmt automatisch die neueste APK aus releases\)'
exit 0
