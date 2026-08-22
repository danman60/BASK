#!/usr/bin/env bash
# Phase 1: extract 16kHz mono FLAC from source A/V on FIRMAMENT.
set -u
OUT='C:\uvalux-audio'
LOG=/home/danman60/projects/uvalux-platform/data/salon-transcripts/extract.log
ssh -o BatchMode=yes firmament "if not exist \"$OUT\" mkdir \"$OUT\"" >/dev/null 2>&1

run() { # run <src-win-path> <out-basename> <audio-stream-index>
  local src="$1" name="$2" idx="$3"
  local t0=$(date +%s)
  ssh -o BatchMode=yes firmament "ffmpeg -y -v error -i \"$src\" -map 0:a:$idx -vn -ac 1 -ar 16000 -c:a flac -compression_level 5 \"$OUT\\\\$name.flac\"" 2>&1 | sed "s|^|[$name] |" | tee -a "$LOG"
  local rc=${PIPESTATUS[0]} t1=$(date +%s)
  local sz=$(ssh -o BatchMode=yes firmament "for %F in (\"$OUT\\\\$name.flac\") do @echo %~zF" 2>/dev/null | tr -d '\r')
  echo "$(date -Is) DONE $name rc=$rc secs=$((t1-t0)) bytes=${sz:-0}" | tee -a "$LOG"
}

echo "$(date -Is) === Phase 1 extraction start ===" | tee -a "$LOG"
run 'J:\UvaSummer25\REC00241.WAV'  uvasummer25_REC00241 0
run 'J:\UvaSummer25\REC00242.WAV'  uvasummer25_REC00242 0
run 'J:\UvaSummer25\REC00243.WAV'  uvasummer25_REC00243 0
run 'J:\UvaSummer25\REC00244.WAV'  uvasummer25_REC00244 0
run 'J:\UvaSummer25\REC00334.WAV'  uvasummer25_REC00334 0
run 'J:\UvaSummer25\REC00335.WAV'  uvasummer25_REC00335 0
run 'J:\UvaSummer25\REC00336.WAV'  uvasummer25_REC00336 0
run 'J:\UvaSummer25\REC00337.WAV'  uvasummer25_REC00337 0
run 'M:\UVASummer24\FullAudio.wav' uvasummer24_FullAudio 0
run 'J:\Uvalux26\RoomBLocked\P1060686.MOV' uvalux26_P1060686 0
run 'J:\Uvalux26\RoomBLocked\P1060687.MOV' uvalux26_P1060687 0
run 'J:\Uvalux26\RoomBLocked\P1060688.MOV' uvalux26_P1060688 0
run 'J:\Uvalux26\RoomBLocked\P1060690.MOV' uvalux26_P1060690 0
for i in 0 1 2 3; do run 'J:\Uvalux26\RoomBLocked\P1060689.MOV' "uvalux26_P1060689_a$i" $i; done
run 'J:\Uva25\Uvalux46RoomB_All_Presentations.mov' uva25_RoomB_AllPresentations 0
echo "$(date -Is) === Phase 1 extraction complete ===" | tee -a "$LOG"
