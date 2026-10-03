#!/usr/bin/env python3
"""Word anchors for the v8 film, derived from whichever read is active.

    python3 scripts/v8-anchors.py public/audio/vo/v8          # frankie read
    python3 scripts/v8-anchors.py public/audio/vo/v8-uvaint   # uvaint read

Reads <dir>/vo-timing.json (written by vo-chatterbox.py) and transcribes each
<dir>/beats/<id>.wav with faster-whisper (CPU, word timestamps, the beat's own
script as the prompt). Writes <dir>/vo-anchors.json:

    {dir, fps, totalFrames, beats: [{id, text, startFrame, durationFrames,
                                     words: [[startF, endF, word], ...]}]}

Word frames are ABSOLUTE film frames (beat startFrame + offset inside the beat
file). timelineV8.ts imports this one file, so switching the read is one import
line and every cut, including the cuts inside a beat, moves with it.
"""
import json
import os
import sys

from faster_whisper import WhisperModel

d = sys.argv[1].rstrip('/')
timing = json.load(open(os.path.join(d, 'vo-timing.json')))
fps = timing.get('fps', 30)
model = WhisperModel('small.en', device='cpu', compute_type='int8')

out = []
for b in timing['beats']:
    wav = os.path.join(d, 'beats', f"{b['id']}.wav")
    if not os.path.exists(wav):
        # no per-beat files: cut the beat out of the joined read
        import subprocess, tempfile
        wav = os.path.join(tempfile.gettempdir(), f"v8anch-{b['id']}.wav")
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(b['startFrame'] / fps), '-t',
                        str(b['durationFrames'] / fps), '-i', os.path.join(d, 'vo.wav'), wav], check=True)
    segs, _ = model.transcribe(wav, word_timestamps=True, beam_size=5, initial_prompt=b['text'])
    words = []
    for s in segs:
        for w in s.words or []:
            words.append([
                round(b['startFrame'] + w.start * fps, 1),
                round(b['startFrame'] + w.end * fps, 1),
                w.word.strip(),
            ])
    out.append({
        'id': b['id'],
        'text': b['text'],
        'startFrame': b['startFrame'],
        'durationFrames': b['durationFrames'],
        'words': words,
    })
    print(b['id'], len(words), ' '.join(w[2] for w in words)[:90], flush=True)

# The breath between two words: Whisper's word edges are approximate (and often
# touch), so each boundary also records the quietest 20 ms in a window around
# it, measured on the read itself. timelineV8 cuts on that frame.
import subprocess
import numpy as np
SR = 16000
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(d, 'vo.wav'), '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'],
                     capture_output=True, check=True).stdout
sig = np.frombuffer(pcm, np.int16).astype(float) / 32768
hop = SR // 50
rms = np.sqrt(np.add.reduceat(sig[: len(sig) // hop * hop] ** 2, np.arange(0, len(sig) // hop * hop, hop)) / hop)
for bt in out:
    ws = bt['words']
    for i in range(1, len(ws)):
        lo = min(ws[i - 1][1], ws[i][0]) - 4
        hi = ws[i][0] + 6
        a, b = int(lo / fps * 50), int(hi / fps * 50) + 1
        if b <= a or b > len(rms):
            continue
        k = a + int(np.argmin(rms[a:b]))
        ws[i].append(round((k + 0.5) / 50 * fps, 1))

rel = os.path.relpath(d, os.path.join(os.path.dirname(__file__), '..', 'public'))
json.dump(
    {'dir': rel, 'fps': fps, 'totalFrames': timing['totalFrames'], 'beats': out},
    open(os.path.join(d, 'vo-anchors.json'), 'w'),
    indent=1,
)
print('wrote', os.path.join(d, 'vo-anchors.json'))
