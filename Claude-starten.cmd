@echo off
rem Doppelklick: Claude Code in diesem Projektordner starten.
rem Claude begruesst dich, prueft die Einrichtung und fragt, was geaendert werden soll.
cd /d "%~dp0"
where claude >/dev/null 2>nul
if errorlevel 1 goto noclaude
claude "Hallo! Ich bin neu im TrackFit-Projekt. Bitte starte das Onboarding."
exit /b %ERRORLEVEL%

:noclaude
echo.
echo Claude Code wurde nicht gefunden.
echo.
echo So installierst du es (einmalig):
echo   1. Startmenue oeffnen, "PowerShell" eintippen und starten
echo   2. Diese Zeile eingeben und Enter druecken:
echo        irm https://claude.ai/install.ps1 ^| iex
echo   3. Danach dieses Fenster schliessen und Claude-starten.cmd erneut doppelklicken
echo.
echo Mehr dazu in ANLEITUNG.md, Schritt 2.
echo.
pause
exit /b 1
