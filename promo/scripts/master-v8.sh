#!/usr/bin/env bash
# Master the PromoV8 renders to v7's level (whole-file mean ~-16 dB; v7 measured -15.3).
# The composition already ducks the bed under the read; this only adds make-up
# gain and a brick-wall limiter, applied identically to the bgm and no-bgm cuts.
#   scripts/master-v8.sh <raw.mp4> <out.mp4> [gain_dB]
set -euo pipefail
IN="$1"; OUT="$2"; GAIN="${3:-4}"
ffmpeg -v error -y -i "$IN" -af "volume=${GAIN}dB,alimiter=limit=0.89:attack=5:release=60:level=false" \
  -map 0:v -map 0:a -c:v copy -c:a aac -b:a 192k -movflags +faststart "$OUT"
ffmpeg -i "$OUT" -af volumedetect -f null - 2>&1 | grep -E "mean_volume|max_volume" | sed 's/.*\] //'
