# _common.ps1 - gemeinsame Hilfsfunktionen fuer die TrackFit-PowerShell-Skripte.
# Wird per Dot-Sourcing geladen:  . (Join-Path $PSScriptRoot '_common.ps1')
#
# Bewusst nur ASCII-Zeichen (ae/oe/ue statt Umlauten): Windows PowerShell 5.1 liest
# .ps1-Dateien ohne BOM als ANSI - Umlaute wuerden sonst verstuemmelt angezeigt.
# Bewusst kompatibel mit Windows PowerShell 5.1 (vorinstalliert auf jedem Windows 10/11).

$script:IsWin = ($env:OS -eq 'Windows_NT')
$script:RepoRoot = Split-Path -Parent $PSScriptRoot
$script:ReleasesDir = [IO.Path]::Combine($script:RepoRoot, 'releases')

function Write-Step([string]$Message) {
  Write-Host ''
  Write-Host "==> $Message" -ForegroundColor Cyan
}
function Write-Ok([string]$Message) { Write-Host "    OK  $Message" -ForegroundColor Green }
function Write-Info([string]$Message) { Write-Host "    $Message" }
function Write-Warn([string]$Message) { Write-Host "    !!  $Message" -ForegroundColor Yellow }

function Stop-WithError([string]$Message, [string[]]$Hints = @()) {
  Write-Host ''
  Write-Host "FEHLER: $Message" -ForegroundColor Red
  foreach ($h in $Hints) { Write-Host "  - $h" -ForegroundColor Yellow }
  exit 1
}

function Confirm-Yes([string]$Question) {
  $answer = Read-Host "$Question (j/n)"
  return ($answer -match '^\s*[jJyY]')
}

# Liest Name, Version und Android-Paketname aus app.json (eine Quelle der Wahrheit).
function Get-AppConfig {
  $path = [IO.Path]::Combine($script:RepoRoot, 'app.json')
  $expo = (Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json).expo
  [pscustomobject]@{
    Name    = [string]$expo.name
    Version = [string]$expo.version
    Package = [string]$expo.android.package
  }
}

# Erster Treffer eines Regex (Gruppe 1) oder '?'.
function Get-Match([string]$Text, [string]$Pattern) {
  $m = [regex]::Match($Text, $Pattern)
  if ($m.Success) { return $m.Groups[1].Value.Trim() }
  return '?'
}

function Find-Executable([string]$Name) {
  $cmd = Get-Command $Name -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($cmd) { return $cmd.Path }
  return $null
}

# Native Programme (adb, java, ...) ausfuehren und Ausgabe + Exit-Code einsammeln.
# stderr wird mit eingesammelt; ErrorActionPreference wird dafuer kurz auf 'Continue'
# gesetzt, weil Windows PowerShell 5.1 sonst bei jeder stderr-Zeile abbricht.
function Invoke-Native {
  param([Parameter(Mandatory)][string]$FilePath, [string[]]$ArgumentList = @())
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $lines = @(& $FilePath @ArgumentList 2>&1 | ForEach-Object { "$_" })
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $prev
  }
  [pscustomobject]@{ ExitCode = $code; Lines = $lines; Text = ($lines -join "`n") }
}

# Wie Invoke-Native, aber die Ausgabe laeuft live in die Konsole (lange Builds).
# Gibt nur den Exit-Code zurueck.
function Invoke-Streamed {
  param(
    [Parameter(Mandatory)][string]$FilePath,
    [string[]]$ArgumentList = @(),
    [string]$WorkingDirectory = $script:RepoRoot
  )
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  Push-Location -LiteralPath $WorkingDirectory
  try {
    & $FilePath @ArgumentList 2>&1 | ForEach-Object { Write-Host "    $_" }
    return $LASTEXITCODE
  } finally {
    Pop-Location
    $ErrorActionPreference = $prev
  }
}
