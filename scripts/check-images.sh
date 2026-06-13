#!/usr/bin/env bash
# check-images.sh
# Spot-check that Telugu / Devanagari / Latin titles are embedded
# in every generated stotram image.
#
# Usage:
#   ./scripts/check-images.sh            # check all stotrams, variant -01
#   ./scripts/check-images.sh 03         # check all stotrams, variant -03
#   ./scripts/check-images.sh 01 08      # check variants 01 through 08
#   ./scripts/check-images.sh vishnu-sahasranamam   # one slug, all variants

IMAGES="assets/images"
VARIANT_FROM="${1:-01}"
VARIANT_TO="${2:-$VARIANT_FROM}"
FILTER_SLUG="${3:-}"

# If first arg looks like a slug (contains a letter that isn't a digit), treat it as slug filter
if [[ "$1" =~ [a-zA-Z] && ! "$1" =~ ^[0-9]+$ ]]; then
  FILTER_SLUG="$1"
  VARIANT_FROM="01"
  VARIANT_TO="08"
fi

slugs=(
  vishnu-sahasranamam lalita-sahasranamam soundaryalahari
  surya-siddhanta nava-graha-stotram krishna-ashtakam
  sarasvati-dvadasha nataraja nava-ratnamala
  kalabhairava-ashtakam toTaka surya
)

pass=0; fail=0

for slug in "${slugs[@]}"; do
  [[ -n "$FILTER_SLUG" && "$slug" != "$FILTER_SLUG" ]] && continue

  for v in $(seq -f "%02g" "$VARIANT_FROM" "$VARIANT_TO"); do
    file="$IMAGES/${slug}-${v}.svg"

    if [[ ! -f "$file" ]]; then
      echo "MISSING  $file"
      ((fail++)); continue
    fi

    # Extract text content from SVG (everything between > and <)
    texts=$(grep -oP '(?<=>)[^<]{2,}' "$file" | grep -v '^[[:space:]]*$')

    te=$(echo "$texts" | grep -P '[\x{0C00}-\x{0C7F}]' | head -1)
    sa=$(echo "$texts" | grep -P '[\x{0900}-\x{097F}]' | grep -v 'ॐ' | head -1)
    en=$(echo "$texts" | grep -P '^[A-Z\x{0100}-\x{024F}Ā-ž ]{3,}$' | head -1)

    ok=true
    [[ -z "$te" ]] && { echo "  ✗ Telugu missing"; ok=false; }
    [[ -z "$sa" ]] && { echo "  ✗ Devanagari missing"; ok=false; }

    if $ok; then
      echo "OK  ${slug}-${v}.svg"
      echo "    te › $te"
      echo "    sa › $sa"
      [[ -n "$en" ]] && echo "    en › $en"
      ((pass++))
    else
      echo "FAIL ${file}"
      ((fail++))
    fi
  done
done

echo ""
echo "────────────────────────────────"
echo "  passed: $pass   failed: $fail"
echo "────────────────────────────────"
