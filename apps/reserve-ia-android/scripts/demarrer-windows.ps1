$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
Get-Command node -ErrorAction Stop | Out-Null
$codexRoot = (& npm.cmd root -g).Trim()
if ($LASTEXITCODE -ne 0) { throw "npm root a echoue" }
$env:CODEX_SCRIPT = Join-Path $codexRoot "@openai/codex/bin/codex.js"
if (!(Test-Path $env:CODEX_SCRIPT)) { throw "Installer Codex CLI avec npm install -g @openai/codex" }
$keyFile = Join-Path $env:LOCALAPPDATA "ReserveIA/panel-token.txt"
if (!(Test-Path $keyFile)) {
  New-Item -ItemType Directory -Force (Split-Path $keyFile) | Out-Null
  $key = & node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
  if ($LASTEXITCODE -ne 0) { throw "Generation du jeton impossible" }
  [IO.File]::WriteAllText($keyFile, $key.Trim())
  $who = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
  & icacls.exe $keyFile /inheritance:r /grant:r "${who}:(F)" | Out-Null
  if ($LASTEXITCODE -ne 0) { Remove-Item $keyFile; throw "Protection du jeton impossible" }
}
$env:PANEL_TOKEN = [IO.File]::ReadAllText($keyFile).Trim()
Write-Host "Jeton conserve dans $keyFile (a saisir sur le telephone, ne pas partager)."
Write-Host "Garder cette fenetre ouverte. Arret : Ctrl+C."
& node bridge/server.mjs
if ($LASTEXITCODE -ne 0) { throw "Le relais s'est arrete en erreur" }
