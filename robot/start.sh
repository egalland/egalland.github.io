#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
rover_config="${XDG_CONFIG_HOME:-$HOME/.config}/rover-link.env"
if [[ ! -f "$rover_config" ]]; then
  printf 'Configuration manquante. Suis GUIDE.html pour créer %s\n' "$rover_config"
  exit 1
fi
set -a
source "$rover_config"
set +a
exec python3 server.py
