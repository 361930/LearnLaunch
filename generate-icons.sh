#!/bin/bash

# Script to generate app icons for PWA from a base icon
# Requires ImageMagick to be installed

BASE_ICON="generated-icon.png"  # Source icon file
OUTPUT_DIR="client/public/icons"

# Check if ImageMagick is installed
if ! [ -x "$(command -v convert)" ]; then
  echo "Error: ImageMagick is required but not installed." >&2
  echo "Please install ImageMagick first." >&2
  exit 1
fi

# Check if source icon exists
if [ ! -f "$BASE_ICON" ]; then
  echo "Error: Source icon file '$BASE_ICON' not found." >&2
  echo "Please provide a base icon in PNG format." >&2
  exit 1
fi

# Create the output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Icon sizes needed for PWA
SIZES=(72 96 128 144 152 192 384 512)

echo "Generating icons for GlobalEduConnect..."

# Generate icons in different sizes
for size in "${SIZES[@]}"; do
  echo "Creating ${size}x${size} icon..."
  convert "$BASE_ICON" -resize ${size}x${size} "$OUTPUT_DIR/icon-${size}x${size}.png"
done

echo "Icons generated successfully!"
echo "Location: $OUTPUT_DIR"