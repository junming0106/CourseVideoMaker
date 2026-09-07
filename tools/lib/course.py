"""解析「現在在跑哪一門課」（Python 版，對應 course.mjs）。

共用腳本放在 tools/（analyze／produce／qc 三層），但一律從 lessons/<slug>/scripts/ 底下執行，
所以課程脈絡全部由 cwd 推導。
"""
import json
import os

COURSE_DIR = os.getcwd()

with open(os.path.join(COURSE_DIR, "course.json"), encoding="utf-8") as f:
    cfg = json.load(f)

PROJ = os.path.normpath(os.path.join(COURSE_DIR, "../../../hyperframes-project"))


def here(*p):
    return os.path.join(COURSE_DIR, *p)


def proj(*p):
    return os.path.join(PROJ, *p)
