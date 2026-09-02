#!/usr/bin/env bash
# Build the v7 voiceover master from the SFX-ONLY picture render.
#
# Why the music is applied here and not in the composition: the read is
# continuous (128.679s over a 130.0s cut), so the bed has to duck under the
# voice to stay out of its way and come back up in the breaths. Remotion can
# hold a static level but not a sidechain, so the bed is mixed here where it can
# be measured. `MainV6` still carries the correct standalone treatment for the
# captions/picture cut (startFrom 0:43, its own fades).
#
# TWO GOTCHAS, both cost a rebuild each:
#  1. A filter-graph label can feed exactly ONE input, so the VO is `asplit` into
#     a sidechain branch and a mix branch.
#  2. `sidechaincompress` stops producing output when its SIDECHAIN ends, not
#     when its main input does. Without `apad` on the VO branch the bed is cut
#     dead at the last word (measured -91 dB through the sign-off) instead of
#     ringing out under it.
#
# Levels are verified by MEASUREMENT, never by exit code:
#   ffmpeg -i <out> -af volumedetect -f null - 2>&1 | grep mean_volume
# Target is whole-file mean ~-16 dB, matching the approved v6 master (-16.4).
set -euo pipefail
cd "$(dirname "$0")/.."

TRACK="${1:-bgm-open-road.mp3}"   # or bgm-tech-house.mp3
SEEK="${2:-43}"                    # 43 for open-road (the quiet bar that climbs); 0 for tech-house
GAIN="${3:-0.50}"                  # 0.50 open-road / 0.33 tech-house — they differ ~4 dB in level
OUT="${4:-out/promo-v7-vo.mp4}"

ffmpeg -v error -y \
  -i out/promo-v7-sfxonly.mp4 \
  -i public/audio/vo/uvaint-v7.mp3 \
  -ss "$SEEK" -i "public/audio/$TRACK" \
  -filter_complex "\
[1:a]aformat=channel_layouts=stereo:sample_rates=48000,volume=1.4[vo];\
[vo]asplit=2[vo1][vo2];\
[vo1]apad=whole_dur=131[vo1p];\
[2:a]aformat=channel_layouts=stereo:sample_rates=48000,atrim=0:130,volume=$GAIN,afade=t=in:st=0:d=2,afade=t=out:st=128.5:d=1.5[mus];\
[mus][vo1p]sidechaincompress=threshold=0.06:ratio=4:attack=25:release=500[musd];\
[0:a][musd]amix=inputs=2:duration=first:normalize=0[bm];\
[bm][vo2]amix=inputs=2:duration=first:normalize=0[m];\
[m]volume=3.0dB,alimiter=limit=0.97:attack=5:release=60[mix]" \
  -map 0:v -map "[mix]" -c:v copy -c:a aac -b:a 192k "$OUT"

echo "wrote $OUT"
ffmpeg -i "$OUT" -af volumedetect -f null - 2>&1 | grep -E "mean_volume|max_volume" | sed 's/.*\] //'
