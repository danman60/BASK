#!/usr/bin/env python3
"""DEV ONLY: estimated vo-anchors.json from v8/voiceover.txt, for building the
v8 timeline before the real read exists. Never render a deliverable from it.

    python3 scripts/v8-est-anchors.py   ->  public/audio/vo/v8-est/vo-anchors.json

~2.6 words/s, +6f after a comma, +12f after a full stop, 10f between beats.
"""
import json
import os

root = os.path.join(os.path.dirname(__file__), '..')
paras = [p.strip() for p in open(os.path.join(root, 'v8', 'voiceover.txt')).read().split('\n\n') if p.strip()]
FPS = 30
WF = FPS / 2.6
t = 0.0
beats = []
for i, p in enumerate(paras):
    start = t
    words = []
    for w in p.split():
        words.append([round(t, 1), round(t + WF * 0.85, 1), w])
        t += WF
        if w.endswith(','):
            t += 6
        elif w[-1] in '.?!':
            t += 12
    end = t - 12
    beats.append({'id': f'b{i + 1:02d}', 'text': p, 'startFrame': round(start),
                  'durationFrames': round(end - start), 'words': words})
    t = end + 10
out = os.path.join(root, 'public', 'audio', 'vo', 'v8-est')
os.makedirs(out, exist_ok=True)
json.dump({'dir': 'audio/vo/v8-est', 'fps': FPS, 'totalFrames': round(t), 'beats': beats, 'estimate': True},
          open(os.path.join(out, 'vo-anchors.json'), 'w'), indent=1)
print(len(beats), 'beats, est total', round(t), 'f')
