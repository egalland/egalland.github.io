#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v node >/dev/null
command -v codex >/dev/null
config_dir="${XDG_CONFIG_HOME:-$HOME/.config}/reserve-ia"
umask 077
mkdir -p "$config_dir"
chmod 700 "$config_dir"
if [ ! -f "$config_dir/panel-token" ]; then
  node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))" > "$config_dir/panel-token"
fi
chmod 600 "$config_dir/panel-token"
export PANEL_TOKEN="$(cat "$config_dir/panel-token")"
printf 'Jeton conserve dans %s/panel-token ; ne pas partager.\n' "$config_dir"
exec node bridge/server.mjs
