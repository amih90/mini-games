#!/usr/bin/env bash
# One-time setup: download CC BY 4.0 planet textures from solarsystemscope.com
# Attribution: Textures by Solar System Scope (solarsystemscope.com), CC BY 4.0

set -e

DEST="public/textures/planets"
BASE="https://www.solarsystemscope.com/textures/download"

mkdir -p "$DEST"

TEXTURES=(
  "2k_sun.jpg"
  "2k_mercury.jpg"
  "2k_venus_surface.jpg"
  "2k_earth_daymap.jpg"
  "2k_earth_nightmap.jpg"
  "2k_earth_clouds.jpg"
  "2k_earth_normal_map.jpg"
  "2k_mars.jpg"
  "2k_jupiter.jpg"
  "2k_saturn.jpg"
  "2k_saturn_ring_alpha.png"
  "2k_uranus.jpg"
  "2k_neptune.jpg"
  "2k_moon.jpg"
  "2k_stars_milky_way.jpg"
)

for tex in "${TEXTURES[@]}"; do
  TARGET="$DEST/$tex"
  if [ -f "$TARGET" ]; then
    echo "✓ already exists: $tex"
  else
    echo "↓ downloading: $tex"
    curl -fsSL -o "$TARGET" "$BASE/$tex" || echo "✗ failed: $tex"
  fi
done

echo ""
echo "Done! Textures saved to $DEST/"
echo "Attribution: Textures by Solar System Scope (solarsystemscope.com) — CC BY 4.0"
