@echo off
:: Installs BetterAis autoload into Firefox (autoconfig). Needs admin - it
:: re-launches itself elevated. Close Firefox first; changes apply on next start.
net session >nul 2>&1 || (powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs" & exit /b)
set "FF=C:\Program Files\Mozilla Firefox"
copy /Y "%~dp0betterais.cfg" "%FF%\betterais.cfg" >nul || goto :fail
copy /Y "%~dp0defaults\pref\autoconfig.js" "%FF%\defaults\pref\autoconfig.js" >nul || goto :fail
echo BetterAis autoload installed. Start Firefox - BetterAis loads automatically.
pause
exit /b 0
:fail
echo Copy failed - is Firefox installed in "%FF%"?
pause
exit /b 1
