@echo off
where node >nul 2>nul
if errorlevel 1 (
  echo Installez Node.js 20 ou plus recent pour lancer le service.
  pause
  exit /b 1
)
node "%~dp0serveur.cjs" --ouvrir
if errorlevel 1 pause
