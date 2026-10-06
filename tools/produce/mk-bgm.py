"""合成背景音樂：輕快悠閑的兒童卡通風格（木琴旋律＋彈跳低音＋反拍和弦＋沙鈴與木魚），接長到整支影片的長度。

為什麼不用音樂盒：上一版是慢板、單音琶音、長衰減，使用者回報「讓人想睡覺」。
這一版的做法：
  - 速度 116 BPM，直拍，每小節有明確的「低音—和弦—低音—和弦」彈跳（oom-pah）
  - 旋律用木琴（短促、泛音亮），音域在 G5~D6，句尾上揚，每 4 小節換一個句子
  - 反拍和弦用烏克麗麗式的短撥奏，沙鈴每個八分音符，木魚落在 2、4 拍
  - 和弦走 C–G–Am–F、C–G–F–G、F–C–G–Am、C–Am–F–G，全是大調明亮的進行，16 小節（約 33 秒）一圈
純合成、不用外部素材。音量由 mk-audio-bed.py 依 RMS 正規化，墊在人聲下面。

輸出：course.json 的 bgmMusic（assets/<slug>/bgm-music.m4a，純音樂），長度取 sfx-cues.json 的 total 再多 6 秒；
另外輸出 36 秒預聽檔到 lessons/<slug>/output/bgm-sample.m4a（不影響產線）。
所以要先跑 build-composition.mjs。

用法：cd lessons/<slug>/scripts && python3 ../../../tools/produce/mk-bgm.py
（run-pipeline 在 build 之後、混音樂床之前，會在缺音樂或音樂比片短時自動跑）
"""
import json
import os
import subprocess
import wave

import numpy as np

import sys as _sys
_sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "lib"))
from course import cfg, here, proj

SR = 44100
BPM = 116
BEAT = 60 / BPM
EIGHTH = BEAT / 2
BAR = 4 * BEAT

_SEMI = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def hz(name):
    """'C5' / 'F#4' / 'Bb3' → 頻率"""
    n = _SEMI[name[0]]
    i = 1
    if name[1] in "#b":
        n += 1 if name[1] == "#" else -1
        i = 2
    octave = int(name[i:])
    return 440.0 * 2 ** ((n + (octave - 4) * 12 - 9) / 12)


# ---------- 樂器 ----------
def env_exp(n, tau, attack=0.004):
    t = np.arange(n) / SR
    e = np.exp(-t / tau)
    a = max(1, int(SR * attack))
    e[:a] *= np.linspace(0, 1, a)   # 起音只留 4ms：太慢會變得軟綿綿，太硬會有爆音
    return e


def marimba(f, dur, amp):
    n = int(SR * dur)
    t = np.arange(n) / SR
    # 木琴的特徵：基音 + 約 4 倍頻的亮泛音（泛音衰減得很快，所以是「叩」一聲）
    w = np.sin(2 * np.pi * f * t) * env_exp(n, 0.20) + 0.45 * np.sin(2 * np.pi * f * 3.97 * t) * env_exp(n, 0.045)
    return amp * w


def pluck_bass(f, dur, amp):
    n = int(SR * dur)
    t = np.arange(n) / SR
    return amp * (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2 * t)) * env_exp(n, 0.16, 0.006)


def strum(freqs, amp, spread=0.010):
    """烏克麗麗式反拍：幾條弦隔一點點時間依序撥出，短促"""
    n = int(SR * 0.28)
    out = np.zeros(n + int(SR * spread * len(freqs)))
    for k, f in enumerate(freqs):
        t = np.arange(n) / SR
        w = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2 * t) + 0.15 * np.sin(2 * np.pi * f * 3 * t)) * env_exp(n, 0.07, 0.003)
        s = int(SR * spread * k)
        out[s:s + n] += amp * w / len(freqs) * 1.6
    return out


_rng = np.random.default_rng(3)


def shaker(amp):
    n = int(SR * 0.07)
    noise = _rng.standard_normal(n)
    hp = np.diff(noise, prepend=0)          # 簡易高通：只留沙沙的高頻
    return amp * hp * env_exp(n, 0.022, 0.002)


def wood(amp):
    n = int(SR * 0.09)
    t = np.arange(n) / SR
    return amp * (np.sin(2 * np.pi * 1050 * t) * env_exp(n, 0.03, 0.001) + 0.25 * np.diff(_rng.standard_normal(n), prepend=0) * env_exp(n, 0.01, 0.001))


def kick(amp):
    n = int(SR * 0.22)
    t = np.arange(n) / SR
    f = 55 + 70 * np.exp(-t / 0.04)         # 頻率從 125 掉到 55 Hz：「咚」
    return amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.09, 0.002)


# ---------- 譜 ----------
CHORD = {
    "C":  (["C2", "G2"], ["C4", "E4", "G4"]),
    "G":  (["G2", "D3"], ["B3", "D4", "G4"]),
    "Am": (["A2", "E3"], ["A3", "C4", "E4"]),
    "F":  (["F2", "C3"], ["A3", "C4", "F4"]),
}
PROG = ["C", "G", "Am", "F",   "C", "G", "F", "G",   "F", "C", "G", "Am",   "C", "Am", "F", "G"]
_ = None
MELODY = [
    ["G5", _, "E5", "G5", "C6", _, "G5", _],    "B5 _ G5 B5 D6 _ B5 _".split(),
    "A5 _ E5 A5 C6 _ A5 G5".split(),            "F5 _ A5 C6 A5 _ G5 _".split(),
    "G5 _ E5 G5 C6 _ E6 _".split(),             "D6 _ B5 G5 B5 _ D6 _".split(),
    "C6 _ A5 F5 A5 _ C6 _".split(),             "B5 A5 G5 A5 B5 _ D6 _".split(),
    "A5 _ C6 A5 F5 _ A5 _".split(),             "G5 E5 G5 C6 E6 _ C6 _".split(),
    "D6 _ B5 D6 B5 _ G5 _".split(),             "E6 _ C6 A5 C6 _ E6 _".split(),
    "G5 _ E5 G5 C6 _ G5 E5".split(),            "A5 _ C6 E6 C6 _ A5 _".split(),
    "A5 C6 F6 C6 A5 _ F5 _".split(),            "G5 _ B5 D6 B5 _ G5 _".split(),
]
MELODY = [[None if x in (None, "_") else x for x in bar] for bar in MELODY]

total_len = int(SR * BAR * len(PROG)) + SR
loop = np.zeros(total_len)


def add(sig, t0):
    s = int(SR * t0)
    e = min(len(loop), s + len(sig))
    loop[s:e] += sig[: e - s]


for b, ch in enumerate(PROG):
    t0 = b * BAR
    bass, chord = CHORD[ch]
    for i in range(8):
        t = t0 + i * EIGHTH
        # 低音：第 1、3 拍（八分音符 0、4），第 3 拍改彈五度，聽起來才有「咚—啪—咚—啪」的彈跳
        if i == 0:
            add(pluck_bass(hz(bass[0]), 0.38, 0.34), t)
            add(kick(0.20), t)
        elif i == 4:
            add(pluck_bass(hz(bass[1]), 0.38, 0.28), t)
            add(kick(0.14), t)
        # 反拍和弦：八分音符 1、3、5、7（正拍之間）
        if i % 2 == 1:
            add(strum([hz(n) for n in chord], 0.20), t)
        # 木魚：第 2、4 拍（八分音符 2、6）
        if i in (2, 6):
            add(wood(0.16), t)
        # 沙鈴：每個八分音符，反拍稍微重一點
        add(shaker(0.075 if i % 2 else 0.045), t)
        # 旋律（木琴）：短促的音，音長一個八分音符加一點尾巴
        nm = MELODY[b][i]
        if nm:
            add(marimba(hz(nm), 0.45, 0.30), t)
            if b >= 8 and b < 12:                                  # B 段：疊一個低八度，聽起來比較厚、有變化
                add(marimba(hz(nm) / 2, 0.40, 0.12), t)

loop = loop[: int(SR * BAR * len(PROG))]
loop = loop / np.abs(loop).max() * 0.6

tmp = here("_bgm")
os.makedirs(tmp, exist_ok=True)
wav = os.path.join(tmp, "loop.wav")
with wave.open(wav, "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((loop * 32767).astype(np.int16).tobytes())

AF = "aecho=0.85:0.5:55:0.22,highpass=f=70"   # 很短的回音讓聲音不乾，但不拖尾（長混響會變成想睡覺的感覺）
total = json.load(open(here("sfx-cues.json"), encoding="utf-8"))["total"] + 6
out = proj(cfg["bgmMusic"])
os.makedirs(os.path.dirname(out), exist_ok=True)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-stream_loop", "-1", "-i", wav, "-t", f"{total:.2f}",
                "-af", f"{AF},afade=t=in:st=0:d=1.5,afade=t=out:st={total - 4:.2f}:d=4",
                "-c:a", "aac", "-b:a", "128k", out], check=True)
print(f"已寫出 {out}（{total:.0f} 秒；一圈 {BAR * len(PROG):.1f} 秒）")

# 預聽檔拉大音量（+10dB）；實際影片裡音樂是墊在人聲下面的小聲
sample = here("..", "output", "bgm-sample.m4a")
os.makedirs(os.path.dirname(sample), exist_ok=True)
subprocess.run(["ffmpeg", "-y", "-v", "error", "-stream_loop", "-1", "-i", wav, "-t", "36",
                "-af", f"{AF},volume=10dB,afade=t=out:st=33:d=3", "-c:a", "aac", "-b:a", "128k", sample], check=True)
print(f"預聽檔：{sample}")
