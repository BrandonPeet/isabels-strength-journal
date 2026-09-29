#!/bin/sh
# Regenerates PWA icons from scripts/icon-source.png (requires ImageMagick)
cd "$(dirname "$0")/../public"
S=../scripts/icon-source.png
convert $S -resize 512x512 icon-512.png
convert $S -resize 192x192 icon-192.png
convert $S -resize 180x180 apple-touch-icon.png
convert $S -resize 400x400 -gravity center -background "#f5ede0" -extent 512x512 icon-maskable-512.png
