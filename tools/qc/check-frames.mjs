// 抽出「每個紅框出現的那一格」存成圖片，供人或審核 Agent 檢查框有沒有標到重點。
//
// 為什麼要這支：紅框只在它出現的那 0.5~3 秒有意義，
// 整支片渲染出來有四萬多張影格，逐張看不切實際；
// 但只抽紅框那幾格，這次就抓到 3 個真錯誤（指向空白、沒指到目標、被對話框遮住）。
// 而且是在 render 之前跑，改完重建即可，不用重跑 18 分鐘的渲染。
//
// 用法：node check-frames.mjs [輸出目錄]
//
// 實作備忘：
// - 不裝 puppeteer，直接用 hyperframes already 下載的 chrome-headless-shell + CDP
//   （Node 22+ 內建 WebSocket，不需要任何相依套件）
// - 檢查前會把所有 <audio> 拿掉：這支片有三百多個語音元素，
//   帶著它們載入會超過瀏覽器的導覽逾時，而檢查畫面根本不需要聲音
// - 一次只顯示一個段落的 clip：直接開 index.html 沒有框架的 runtime，
//   所有段落會疊在一起，看到的會是最後一段
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { globSync } from 'node:fs';
import { cfg } from '../lib/course.mjs';

// 共用腳本：課程脈絡由 cwd 推導，不能用 import.meta.url（那是 tools/qc/ 自己）
const HERE = process.cwd();
const PROJ = join(HERE, '../../../hyperframes-project');
const OUT = process.argv[2] ?? join(HERE, '../output/frame-check');

// ── 1. 找出紅框與它們所屬的段落 ────────────────────────────────
const html = readFileSync(join(PROJ, 'index.html'), 'utf-8');

// index.html 全產線共用一份，別門課建過就會被換掉。
// 不驗的話這一關會安靜地去檢查別門課的紅框，然後回報「全部 OK」。
const stamped = html.slice(0, 120).match(/^<!-- course: ([\w-]+) -->/)?.[1];
if (stamped && stamped !== cfg.slug) {
  console.error(`✗ index.html 現在是「${stamped}」這門課的，不是「${cfg.slug}」`);
  console.error('  先在這門課的 scripts/ 底下跑 run-pipeline.mjs --from build --to build 重建');
  process.exit(1);
}

// 時間軸 id 由各課的 build-composition.mjs 決定，從產出的 html 讀回來——
// 寫死會變成「換一門課就靜默截到全黑畫面」。
const TL_ID = html.match(/window\.__timelines\['([^']+)'\]/)?.[1];
if (!TL_ID) {
  console.error('index.html 裡找不到 window.__timelines[...]，先跑 build-composition.mjs');
  process.exit(1);
}

// 主軌（track 1）的段落，用來判斷每個紅框屬於哪一段
const segs = [...html.matchAll(
  /<div id="([\w-]+)" class="clip" data-start="([\d.]+)" data-duration="([\d.]+)" data-track-index="1"/g,
)].map((m) => ({ id: m[1], start: +m[2], dur: +m[3] }));

// 紅框的淡入時間
const marks = [...html.matchAll(
  /#(mk\d+)',\{autoAlpha:0,scale:1\.4\},\{[^}]*\},([\d.]+)\)/g,
)].map((m) => ({ id: m[1], at: +m[2] }));

const shots = marks.map((mk) => {
  const seg = segs.find((s) => mk.at >= s.start && mk.at <= s.start + s.dur);
  // +0.8 秒：紅框的彈入動畫要 0.4 秒，太早截會拍到還在放大的中途
  return { ...mk, seg: seg?.id ?? 'unknown', t: +(mk.at + 0.8).toFixed(2) };
});

if (!shots.length) {
  console.error('找不到任何紅框，先跑 build-composition.mjs');
  process.exit(1);
}
console.log(`找到 ${shots.length} 個紅框，分佈在 ${new Set(shots.map((s) => s.seg)).size} 個段落`);

// ── 2. 產生一份「拿掉聲音」的檢查用 HTML ──────────────────────
const CHECK_DIR = join(PROJ, '.frame-check');
rmSync(CHECK_DIR, { recursive: true, force: true });
mkdirSync(CHECK_DIR, { recursive: true });
const stripped = html
  .replace(/<audio\b[^>]*><\/audio>/g, '')
  .replace(/<audio\b[^>]*\/?>/g, '');
// 放在專案根目錄下的子資料夾，assets/ 的相對路徑要往上一層
writeFileSync(join(CHECK_DIR, 'index.html'), stripped.replaceAll('assets/', '../assets/'));

// ── 3. 開瀏覽器（CDP，不用 puppeteer）─────────────────────────
const chromeGlob = join(homedir(), '.cache/hyperframes/chrome/chrome-headless-shell/*/chrome-headless-shell-*/chrome-headless-shell');
const [CHROME] = globSync(chromeGlob);
if (!CHROME) {
  console.error('找不到 chrome-headless-shell，先跑過一次 npm run render 讓 hyperframes 下載');
  process.exit(1);
}

const chrome = spawn(CHROME, [
  '--headless=new', '--remote-debugging-port=0', '--no-sandbox',
  '--hide-scrollbars', '--mute-audio', '--disable-gpu-vsync',
  '--window-size=1920,1080', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

const wsUrl = await new Promise((res, rej) => {
  const timer = setTimeout(() => rej(new Error('等不到瀏覽器啟動')), 20000);
  chrome.stderr.on('data', (b) => {
    const m = String(b).match(/ws:\/\/[^\s]+/);
    if (m) { clearTimeout(timer); res(m[0]); }
  });
});

const ws = new WebSocket(wsUrl);
await new Promise((res) => ws.addEventListener('open', res, { once: true }));

let msgId = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}, sessionId) => new Promise((res) => {
  const id = ++msgId;
  pending.set(id, res);
  ws.send(JSON.stringify({ id, method, params, sessionId }));
});

const { result: target } = await send('Target.createTarget', { url: 'about:blank' });
const { result: attached } = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
const S = attached.sessionId;

await send('Page.enable', {}, S);
await send('Runtime.enable', {}, S);
// 影片是 1920×1080，用裝置模擬鎖住尺寸，才不會受實際視窗高度限制
await send('Emulation.setDeviceMetricsOverride',
  { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false }, S);

const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, S);
  return r.result?.result?.value;
};

await send('Page.navigate', { url: `file://${join(CHECK_DIR, 'index.html')}` }, S);
// 等 GSAP 時間軸註冊完成
for (let i = 0; i < 40; i++) {
  if (await evaluate(`!!(window.__timelines && window.__timelines['${TL_ID}'])`)) break;
  await new Promise((r) => setTimeout(r, 500));
}

// ── 4. 逐個紅框截圖 ───────────────────────────────────────────
mkdirSync(OUT, { recursive: true });
for (const s of shots) {
  await evaluate(`(() => {
    document.querySelectorAll('.clip').forEach(e => {
      e.style.display = (e.id === '${s.seg}' || e.id.startsWith('${s.seg}-')) ? '' : 'none';
    });
    const tl = window.__timelines['${TL_ID}'];
    tl.pause(); tl.seek(${s.t});
  })()`);
  await new Promise((r) => setTimeout(r, 220));
  const { result } = await send('Page.captureScreenshot', { format: 'png' }, S);
  const name = `${s.seg}_${s.id}_${s.t}s.png`;
  writeFileSync(join(OUT, name), Buffer.from(result.data, 'base64'));
  console.log(`  ${name}`);
}

ws.close();
chrome.kill();
rmSync(CHECK_DIR, { recursive: true, force: true });
console.log(`\n完成：${shots.length} 張存到 ${OUT}`);
