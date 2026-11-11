#!/usr/bin/env bash
# Arma el ZIP para subir a itch.io: el contenido de sitio/ con index.html en la raíz.
# Uso: ./empaquetar.sh   →   dist/torre-patitos-v2.0-itch.zip
set -euo pipefail
cd "$(dirname "$0")"
version=$(grep -o 'versión [0-9][0-9.]*' sitio/index.html | head -1 | cut -d' ' -f2)
out="dist/torre-patitos-v${version}-itch.zip"
node --test tests/ > /dev/null || { echo "Las pruebas fallan: no se empaqueta." >&2; exit 1; }
mkdir -p dist && rm -f "$out"
(cd sitio && zip -qr "../$out" . -x 'netlify.toml' -x '.*' -x '*/.*')
echo "Listo: $out ($(du -h "$out" | cut -f1))"
if grep -q "SUPABASE_URL: ''" sitio/config.js; then echo "Aviso: config.js no tiene las llaves de Supabase; cada jugador verá solo sus partidas."; fi
