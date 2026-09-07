// 成品抽驗：把 SKILL.md「渲染後」那張檢查表變成可執行的判定。
//
// 用法（在 lessons/<slug>/scripts/ 底下）：node ../../../tools/qc/verify-output.mjs <mp4>
//
// 檢查項目：
//   1. 時長與 sfx-cues.json 的 total 一致（差 >0.5 秒代表時間軸與影片對不上）
//   2. 全片峰值 ≤ 0 dBFS（破音）
//   3. 人聲平均 -15~-19 dB
//   4. 純音樂停頓比人聲低 ≥12 dB（取樣點挑「沒有音效的 hold」，挑到倒數計時會誤判）
//   5. 抽 8 格存檔供人目視
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cfg, here, loadScript } from '../lib/course.mjs';

const F = process.argv[2];
if (!F || !existsSync(F)) { console.error('用法：verify-output.mjs <mp4>'); process.exit(1); }

const fails = [];
const ok = (pass, msg) => { console.log(`  ${pass ? '✅' : '❌'} ${msg}`); if (!pass) fails.push(msg); };
// volumedetect 把結果印在 stderr，execFileSync 回傳的是 stdout，一定要用 spawnSync 讀 stderr
const vol = (extra = []) => spawnSync('ffmpeg',
  ['-hide_banner', ...extra, '-i', F, '-af', 'volumedetect', '-f', 'null', '/dev/null'],
  { encoding: 'utf-8' }).stderr ?? '';
const meanDb = (at, dur) =>
  parseFloat(vol(['-ss', String(at), '-t', String(dur)]).match(/mean_volume:\s*(-?[\d.]+)/)?.[1] ?? 'NaN');

// --- 1. 時長 ---
const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration',
  '-of', 'default=nw=1:nk=1', F], { encoding: 'utf-8' }).trim());
const cues = JSON.parse(readFileSync(here('sfx-cues.json'), 'utf-8'));
console.log(`\n=== ${cfg.slug} 成品抽驗 ===`);
console.log(`  影片 ${(dur / 60).toFixed(1)} 分（${dur.toFixed(1)}s）／時間軸 ${cues.total}s`);
ok(Math.abs(dur - cues.total) <= 0.5, `時長與時間軸一致（差 ${Math.abs(dur - cues.total).toFixed(2)}s）`);
// 片長下限寫在 course.json 的 minDuration（秒）。每門課長度不同，寫死會誤判短課。
const MIN = cfg.minDuration ?? 0;
if (MIN) ok(dur >= MIN, `片長 ≥ ${(MIN / 60).toFixed(0)} 分鐘（${(dur / 60).toFixed(1)} 分）`);

// --- 2. 峰值 ---
const peak = parseFloat(vol().match(/max_volume:\s*(-?[\d.]+)/)?.[1] ?? 'NaN');
ok(peak <= 0, `全片峰值 ${peak} dBFS ≤ 0（未破音）`);

// --- 3~4. 人聲 vs 純音樂停頓 ---
// 取樣點要從講稿重算：純音樂空檔＝「沒有音效的 hold」，挑到倒數計時的滴答會誤判成沒壓低
const { SEGS, voiceId } = await loadScript();
const vd = {};
for (const w of ['Cooper', 'Max', 'Cora']) {
  const f = here(`voice-durations-${w}.json`);
  if (existsSync(f)) vd[w] = JSON.parse(readFileSync(f, 'utf-8'));
}
const INTRO = 5, LEAD = 0.6, TAIL = 1, GAP = 0.2, PAD = 0.05;
const r2 = (n) => Math.round(n * 100) / 100;
let t = INTRO;
const holes = [];   // 只有音樂的空檔
const voices = [];  // 有人聲的區段
for (const s of SEGS) {
  let cur = LEAD;
  for (const l of s.lines) {
    const d = r2((vd[l.who]?.[voiceId(l.text)] ?? 3) + PAD);
    const start = r2(t + cur), end = r2(start + d);
    if (d >= 3) voices.push(r2(start + 0.3));
    if (l.hold >= 5 && !s.quiz) holes.push({ at: r2(end + 0.8), win: l.hold - 1.5 });
    cur = r2(cur + d + GAP + (l.hold ?? 0));
  }
  t = r2(t + cur + TAIL);
}
const vSamples = [0.25, 0.5, 0.75].map((p) => voices[Math.floor(voices.length * p)]).filter(Boolean);
const vDb = vSamples.map((at) => meanDb(at, 8)).filter((n) => !Number.isNaN(n));
const vAvg = vDb.reduce((a, b) => a + b, 0) / (vDb.length || 1);
ok(vAvg >= -19 && vAvg <= -15, `人聲平均 ${vAvg.toFixed(1)} dB（目標 -15~-19）`);

if (!holes.length) {
  console.log('  ⚠ 找不到「沒有音效的 hold」，跳過停頓音量檢查');
} else {
  const hDb = holes.slice(0, 4).map((h) => meanDb(h.at, Math.min(h.win, 4))).filter((n) => !Number.isNaN(n));
  const hAvg = hDb.reduce((a, b) => a + b, 0) / (hDb.length || 1);
  ok(vAvg - hAvg >= 12, `純音樂停頓 ${hAvg.toFixed(1)} dB，比人聲低 ${(vAvg - hAvg).toFixed(1)} dB（要求 ≥12）`);
}

// --- 5. 抽格 ---
const shotDir = join(here(), '..', 'output', 'verify-frames');
mkdirSync(shotDir, { recursive: true });
const marks = [3, ...[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((p) => r2(dur * p)), r2(dur - 6)];
for (const [i, at] of marks.entries()) {
  execFileSync('ffmpeg', ['-v', 'error', '-ss', String(at), '-i', F, '-frames:v', '1',
    join(shotDir, `${String(i).padStart(2, '0')}-${at}s.jpg`), '-y']);
}
console.log(`  📷 已抽 ${marks.length} 格到 output/verify-frames/（章節卡、紅框、截圖要人目視確認）`);

console.log(fails.length ? `\n❌ ${fails.length} 項未過` : '\n✅ 全部通過');
process.exitCode = fails.length ? 1 : 0;
