# 把背景音樂與所有音效預先混成一條 course.json 指定的音樂床。
#
# 為什麼要預混：composition 每多一個長音訊元素，載入就會超過框架的 10 秒導覽上限
# （實測過，跟檔案大小無關，是元素數量）。所以音效不能逐顆掛 <audio>，
# 也不能單獨開一條音效軌，只能併進既有的音樂床。
#
# 輸入：course.json 的 bgmMusic（純音樂）＋ sfx-cues.json（build-composition.mjs 產生）
# 用法：python3 mk-audio-bed.py
import array
import json
import os
import subprocess
import wave

import sys as _sys, os as _os
_sys.path.insert(0, _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "..", "lib"))
from course import cfg, here, proj, PROJ

SFX_DIR = proj("assets/sfx")
SR = 44100
TMP = here("_bed")

# composition 會把 #bgm 的音量推到 0.68；音效要按設計音量播出，得先除掉這個係數
BGM_GAIN = 0.68

with open(here("sfx-cues.json"), encoding="utf-8") as f:
    spec = json.load(f)
total = spec["total"]
n = int(total * SR)

os.makedirs(TMP, exist_ok=True)


def decode(src, out):
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src,
                    "-ac", "1", "-ar", str(SR), "-t", f"{total:.3f}", out], check=True)
    with wave.open(out) as w:
        a = array.array("h")
        a.frombytes(w.readframes(w.getnframes()))
    return a


music = decode(proj(cfg["bgmMusic"]), os.path.join(TMP, "music.wav"))
buf = [0.0] * n
for i in range(min(n, len(music))):
    buf[i] = music[i] / 32768.0

samples = {}
for name in {c["file"] for c in spec["cues"]}:
    with wave.open(os.path.join(SFX_DIR, name + ".wav")) as w:
        a = array.array("h")
        a.frombytes(w.readframes(w.getnframes()))
        samples[name] = [v / 32768.0 for v in a]

for c in spec["cues"]:
    src = samples[c["file"]]
    off = int(c["at"] * SR)
    g = c["vol"] / BGM_GAIN
    for i, v in enumerate(src):
        if off + i < n:
            buf[off + i] += v * g

peak = max(abs(v) for v in buf)
if peak > 0.98:
    k = 0.98 / peak
    buf = [v * k for v in buf]
    print(f"混音峰值 {peak:.2f} → 全軌衰減 {k:.3f}")

raw = os.path.join(TMP, "bed.wav")
with wave.open(raw, "w") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(array.array("h", (int(max(-1.0, min(1.0, v)) * 32767) for v in buf)).tobytes())

dst = proj(cfg["bgm"])
subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", raw, "-c:a", "aac", "-b:a", "128k", dst], check=True)
for f in os.listdir(TMP):
    os.remove(os.path.join(TMP, f))
os.rmdir(TMP)
print(f"音樂 + {len(spec['cues'])} 顆音效 → {dst}（{total:.1f}s）")
