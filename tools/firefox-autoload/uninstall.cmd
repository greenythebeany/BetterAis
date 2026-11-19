@echo off
:: Removes BetterAis autoload from Firefox. Needs admin - re-launches elevated.
net session >nul 2>&1 || (powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs" & exit /b)
set "FF=C:\Program Files\Mozilla Firefox"
del /Q "%FF%\betterais.cfg" 2>nul
del /Q "%FF%\defaults\pref\autoconfig.js" 2>nul
echo BetterAis autoload removed.
pause
