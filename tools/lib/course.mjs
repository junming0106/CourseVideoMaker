// 解析「現在在跑哪一門課」。
//
// 共用腳本放在 tools/（analyze／produce／qc 三層），但一律從 lessons/<slug>/scripts/ 底下執行，
// 所以課程脈絡全部由 cwd 推導：course.json 與 script-data.mjs 都在 cwd。
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const COURSE_DIR = process.cwd();

export const cfg = JSON.parse(readFileSync(join(COURSE_DIR, 'course.json'), 'utf-8'));

/** 專案根（影片素材/），共用素材與 .env 都在這 */
export const ROOT = pathToFileURL(join(COURSE_DIR, '../../../'));

/** hyperframes-project/ 底下的路徑 */
export const proj = (...p) => join(COURSE_DIR, '../../../hyperframes-project', ...p);

/** 課程 scripts/ 底下的路徑（voice-durations、sfx-cues 都寫在這） */
export const here = (...p) => join(COURSE_DIR, ...p);

/** 動態載入這門課的講稿（不能用靜態 import，檔案不在共用腳本旁邊） */
export const loadScript = () => import(pathToFileURL(join(COURSE_DIR, 'script-data.mjs')).href);
