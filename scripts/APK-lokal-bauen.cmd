@echo off
rem Doppelklick-Start: TrackFit-APK lokal bauen (ohne EAS-Cloud) und danach per USB installieren.
rem Startet scripts\build-apk-local.ps1 -Install (ExecutionPolicy nur fuer diesen Aufruf umgangen).
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-apk-local.ps1" -Install %*
set "TF_EXIT=%ERRORLEVEL%"
echo.
pause
exit /b %TF_EXIT%
