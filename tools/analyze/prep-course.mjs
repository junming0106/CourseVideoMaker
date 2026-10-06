// 丟一份教案 pptx 進來，把「動手寫講稿之前」的機械工作一次做完。
//
// 用法：node tools/analyze/prep-course.mjs <教案.pptx> [slug]
//   slug 省略時用檔名（例如 2A6.pptx → 2A6）
//   --summary-only  只快速分析教案內容，輸出一份摘要 md 到目前目錄，
//                   不建課程資料夾、不搬動原檔、不抽素材（想先看看這份教案在教什麼時用）
//
// 做這些事：
//   1. 建 lessons/<slug>/{slides,scripts,output}，把 pptx 收進 slides/（原檔不改）
//   2. 解壓 pptx，逐頁抽出文字與圖片對應，寫成 scripts/教案摘要.md
//   3. 把所有圖片與影片抽到 assets/<slug>/raw/，附上尺寸與長寬比
//   4. 產生 course.json（路徑都帶 slug）
//   5. 產生 script-data.mjs 骨架（含 speechText/voiceId，直接可跑）
//
// 刻意不做的事：寫講稿、設計版面。那兩件要看著教案判斷，不是腳本能生的。
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const SUMMARY_ONLY = argv.includes('--summary-only');
const [src, slugArg] = argv.filter((a) => !a.startsWith('--'));
if (!src) {
  console.error('用法：node tools/analyze/prep-course.mjs <教案.pptx> [slug] [--summary-only]');
  process.exit(1);
}
const SRC = resolve(src);
if (!existsSync(SRC)) throw new Error(`找不到教案：${SRC}`);
const SLUG = slugArg ?? basename(SRC, extname(SRC));
if (!/^[A-Za-z0-9_-]+$/.test(SLUG)) throw new Error(`slug 只能用英數與 -_：${SLUG}`);

// 路徑含中文／空白時 URL.pathname 會是 percent-encoded，直接 resolve 會建出一整棵假的目錄樹
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));   // tools/analyze/ → 專案根
const LESSONS = join(ROOT, 'lessons');
const PROJ = join(ROOT, 'hyperframes-project');
const DIR = join(LESSONS, SLUG);
const SCRIPTS = join(DIR, 'scripts');
const RAW = join(PROJ, 'assets', SLUG, 'raw');

if (!SUMMARY_ONLY && existsSync(SCRIPTS) && existsSync(join(SCRIPTS, 'script-data.mjs'))) {
  console.error(`⚠ ${SLUG} 已經有 script-data.mjs 了，不覆蓋。要重來請先手動刪掉 lessons/${SLUG}/。`);
  process.exit(1);
}
if (!SUMMARY_ONLY) {
  for (const d of ['slides', 'scripts', 'output']) mkdirSync(join(DIR, d), { recursive: true });
  mkdirSync(RAW, { recursive: true });
}

// --- 1. 收進 slides/（同一顆磁碟就用搬的，跨磁碟才複製） ---
// --summary-only 只是讀一讀，原檔留在原地不動
let kept = SRC;
if (!SUMMARY_ONLY) {
  kept = join(DIR, 'slides', basename(SRC));
  if (resolve(kept) !== SRC) {
    try { renameSync(SRC, kept); } catch { cpSync(SRC, kept); }
  }
  console.log(`教案 → ${kept.replace(ROOT + '/', '')}`);
}

// --- 2. 解壓 ---
const TMP = SUMMARY_ONLY ? mkdtempSync(join(tmpdir(), 'pptx-')) : join(DIR, '.pptx');
execFileSync('unzip', ['-q', '-o', kept, '-d', TMP]);

const slideFiles = readdirSync(join(TMP, 'ppt', 'slides'))
  .filter((f) => /^slide\d+\.xml$/.test(f))
  .sort((a, b) => +a.match(/\d+/)[0] - +b.match(/\d+/)[0]);

// --- 3. 抽媒體，記錄尺寸（尺寸決定它能不能當程式碼展示用） ---
const mediaDir = join(TMP, 'ppt', 'media');
const media = {};
if (existsSync(mediaDir)) {
  for (const f of readdirSync(mediaDir)) {
    const from = join(mediaDir, f);
    if (!SUMMARY_ONLY) cpSync(from, join(RAW, f));
    let dim = '';
    try {
      const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', from], { encoding: 'utf-8' }).trim();
      if (out) {
        const [w, h] = out.split('x').map(Number);
        dim = `${w}×${h}（比例 ${(w / h).toFixed(2)}）`;
      }
    } catch { /* 非影像檔就留空 */ }
    media[f] = dim;
  }
}

// --- 4. 逐頁抽文字 + 對應圖片 ---
const pages = [];
for (const f of slideFiles) {
  const n = +f.match(/\d+/)[0];
  const xml = readFileSync(join(TMP, 'ppt', 'slides', f), 'utf-8');
  const texts = [...xml.matchAll(/<a:t>(.*?)<\/a:t>/gs)].map((m) => m[1].trim()).filter(Boolean);
  const relPath = join(TMP, 'ppt', 'slides', '_rels', `${f}.rels`);
  const imgs = existsSync(relPath)
    ? [...new Set([...readFileSync(relPath, 'utf-8').matchAll(/Target="\.\.\/media\/([^"]+)"/g)].map((m) => m[1]))]
    : [];
  pages.push({ n, texts, imgs });
}

const md = [
  `# ${SLUG} 教案摘要`,
  '',
  '> 由 `prep-course.mjs` 從 pptx 自動抽出，**寫講稿前先看過這份**。',
  SUMMARY_ONLY
    ? '> `--summary-only` 模式：只讀不寫，圖片沒有落地，下方只標尺寸。'
    : `> 圖片與影片都已抽到 \`assets/${SLUG}/raw/\`，尺寸標在下方。`,
  '',
  '## 寫講稿前必做',
  '',
  SUMMARY_ONLY
    ? '- [ ] 正式開課後（不帶 `--summary-only` 再跑一次）**逐張看過 raw/ 裡的圖**，分辨哪些是「學生要照著排的程式截圖」、哪些只是角色圖或裝飾'
    : '- [ ] **逐張看過 raw/ 裡的圖**，分辨哪些是「學生要照著排的程式截圖」、哪些只是角色圖或裝飾',
  '- [ ] 程式截圖用 `Image.getbbox()` 裁到內容邊界，再放進 `assets/<slug>/`',
  '- [ ] **確認教案提到的角色／背景在學生系統裡還找得到**（名稱也要一致）',
  '- [ ] 找出成品展示影片（`media*.mov/mp4`），排在第一部分結尾',
  '- [ ] 注意 raw/ 裡可能有版權素材（卡通、電影片段），那些不要用',
  '',
  `共 ${pages.length} 頁。`,
  '',
];
for (const p of pages) {
  md.push(`## p.${p.n}`, '');
  md.push(p.texts.length ? p.texts.map((t) => `- ${t}`).join('\n') : '_（無文字）_');
  if (p.imgs.length) {
    md.push('', '圖片：');
    for (const i of p.imgs) md.push(`- \`${i}\`${media[i] ? ` — ${media[i]}` : ''}`);
  }
  md.push('');
}
const mdPath = SUMMARY_ONLY
  ? resolve(process.cwd(), `${SLUG}-教案摘要.md`)
  : join(SCRIPTS, '教案摘要.md');
writeFileSync(mdPath, md.join('\n'));

if (SUMMARY_ONLY) {
  execFileSync('rm', ['-rf', TMP]);
  console.log(`\n✅ ${mdPath}（${pages.length} 頁，${Object.keys(media).length} 個媒體檔）`);
  console.log('   要正式開課再跑一次，不要帶 --summary-only。');
  process.exit(0);
}

// --- 5. course.json ---
writeFileSync(join(SCRIPTS, 'course.json'), JSON.stringify({
  slug: SLUG,
  title: `${SLUG} — 1~3 年級教學影片講稿`,
  grade: '1~3 年級',
  scriptMd: 'grade1-3.md',
  voiceDir: `assets/${SLUG}/voice`,
  bgmMusic: `assets/${SLUG}/bgm-music.m4a`,
  bgm: `assets/${SLUG}/bgm.m4a`,
  stepsDir: `assets/${SLUG}/steps`,
  minDuration: 900,   // 成品抽驗的片長下限（秒）；這門課預期多短就改多少，設 0 關閉
  capture: { dpr: 2, box: [0, 46, 1248, 702] },
  checkIns: ['準備好了嗎', '一樣嗎', '卡進去了嗎', '做出來了嗎', '打開了嗎', '做到了嗎', '排排看', '跟著做一次'],
}, null, 2) + '\n');

// --- 6. script-data.mjs 骨架 ---
writeFileSync(join(SCRIPTS, 'script-data.mjs'), `// ${SLUG} — 1~3 年級教學影片講稿資料（單一事實來源）
// 由 prep-course.mjs 產生骨架，內容要自己寫。寫之前先讀：
//   - scripts/教案摘要.md              這門課的教案內容
//   - .claude/skills/teaching-video-pipeline/references/teaching-rhythm.md   節奏與四拍法則
import { createHash } from 'node:crypto';

// tone／lead 是可選的配音語氣（見 SKILL.md「配音語氣」），沒寫就跟舊的雜湊一樣，既有音檔快取不會失效
export const voiceId = (t, ln = {}) => createHash('sha1')
  .update(speechText(t) + (ln.lead ? '|lead:' + ln.lead : '') + (ln.tone ? '|tone:' + ln.tone : ''))
  .digest('hex').slice(0, 10);

export const speechText = (t) =>
  t
    .replace(/[「」『』（）《》〈〉]/g, '')   // 引號會讓 TTS 在中間硬停一拍
    .replace(/＿+/g, '什麼')                  // 填空底線唸不出來，改成疑問詞
    .replace(/[—–]+/g, '，')                  // 破折號改成短停頓
    .replace(/[…⋯]+/g, '，')                  // 刪節號同上
    .replace(/，{2,}/g, '，')
    .replace(/[。，、]+$/, '')                 // 句尾句號會拖出一段長尾音
    .trim();

export const SEGS = [
  { id: 'c1', title: '章節卡：TODO', part: '第一部分：開場與引起動機', vis: 'chapter', chapter: true,
    chapNo: '1', chapTitle: 'TODO', lines: [
    { who: 'Cooper', action: 'talking', text: '第一章，TODO。' },
  ]},
];
`);

// 清掉解壓暫存
execFileSync('rm', ['-rf', TMP]);

console.log(`
✅ ${SLUG} 已就緒

  lessons/${SLUG}/scripts/教案摘要.md    ← 先讀這份（${pages.length} 頁，${Object.keys(media).length} 個媒體檔）
  lessons/${SLUG}/scripts/course.json
  lessons/${SLUG}/scripts/script-data.mjs（骨架）
  assets/${SLUG}/raw/                     教案抽出的原始圖片與影片

接下來（這兩步要人／Agent 判斷，不是腳本能生的）：
  1. 讀教案摘要 → 寫 script-data.mjs
  2. 寫 build-composition.mjs（從 lessons/_reference-2A5/scripts/ 那份改）
  然後跑：cd lessons/${SLUG}/scripts && node ../../../tools/run-pipeline.mjs
`);
