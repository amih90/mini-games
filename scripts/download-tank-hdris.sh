#!/bin/bash
# Download Poly Haven HDRIs (CC0) for Merge Tank Tactics battlefield environments
# Usage: bash scripts/download-tank-hdris.sh

set -e

DEST="public/textures/merge-tank"
BASE="https://dl.polyhaven.com/file/ph-assets/HDRIs/hdr/1k"

mkdir -p "$DEST"

download_hdri() {
  local env="$1"
  local slug="$2"
  local file="$DEST/${env}.hdr"
  if [ -f "$file" ]; then
    echo "OK  $env already exists, skipping."
    return
  fi
  echo "    Downloading $env ($slug)..."
  if curl -L --fail --silent --show-error \
    "$BASE/${slug}_1k.hdr" \
    -o "$file"; then
    echo "OK  $env downloaded"
  else
    echo "ERR $env - try: $BASE/${slug}_1k.hdr"
  fi
}

download_hdri "desert_storm"       "goegap"
download_hdri "european_theater"   "soliltude"
download_hdri "arctic_front"       "snowy_field"
download_hdri "urban_rubble"       "derelict_highway_midday"
download_hdri "night_battle"       "narrow_moonlit_road"

echo ""
echo "Done. Files in $DEST:"
ls -lh "$DEST"/*.hdr 2>/dev/null || echo "No .hdr files found."
