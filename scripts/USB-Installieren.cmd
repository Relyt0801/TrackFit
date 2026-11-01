@echo off
rem Doppelklick-Start: TrackFit per USB-C auf das Handy installieren/aktualisieren.
rem Startet scripts\usb-install.ps1 (ExecutionPolicy nur fuer diesen Aufruf umgangen).
rem Parameter werden durchgereicht, z. B.:  USB-Installieren.cmd -Download
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0usb-install.ps1" %*
set "TF_EXIT=%ERRORLEVEL%"
echo.
pause
exit /b %TF_EXIT%
