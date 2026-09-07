// 產生一份「動畫與字卡總覽」的預覽網頁，用瀏覽器打開就能看到每個效果實際跑起來的樣子。
//
// 用法：node tools/preview-kit.mjs [輸出.html]     （預設 ./kit-preview.html）
//
// 為什麼要這支：效果名稱看字面猜不出來差別（rise 和 drop、pop 和 bounce）。
// 寫講稿的人要能先看過一輪，才知道這一句該配哪個效果。
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FX, makeFx, makeFxOut, fxRuntimeJS, entrances, exits } from './lib/fx.mjs';
import { TONES, SIZES, HL, makeCard, hi, CARD_CSS } from './lib/cards.mjs';
import { POINTER_COLORS, makePointers, POINTER_CSS } from './lib/pointers.mjs';

const OUT = resolve(process.argv[2] ?? 'kit-preview.html');

// 預覽不需要音效，hit 傳 null
const fx = makeFx(null);
const fxOut = makeFxOut(null);
const card = makeCard(fx, fxOut);
const { arrow, circle, underline } = makePointers(fx, fxOut);

// 每個效果錯開 0.35 秒進場，一眼看得出差別；太密會分不清誰是誰
const STAGGER = 0.35;

const note = (name) => {
  const d = FX[name];
  if (d.countdown) return `倒數 ${d.countdown} 秒`;
  const bits = [];
  if (d.then) bits.push('進場後持續');
  bits.push(d.sfx ? `音效 ${d.sfx}` : '無聲');
  return bits.join('・');
};

const tile = (name, body, extra = '') => `
    <div class="tile">
      <div class="tile-stage">${body}</div>
      <div class="tile-name">${name}</div>
      <div class="tile-note">${extra || note(name)}</div>
    </div>`;

// ---- 進場效果 ----
const inNames = entrances();
const inTiles = inNames.map((name, i) => {
  const at = 0.5 + i * STAGGER;
  const body = FX[name].countdown
    ? `<div ${fx(name, at)} class="cd"><span class="cdnum">5</span></div>`
    : name === 'draw'
      // draw 是給 SVG 線條用的，套在字卡上看不出效果，改畫一個圈選
      ? `<div class="ptrbox">${circle({ x: 100, y: 46, w: 170, h: 74, at })}</div>`
      : card({ text: name, tone: 'orange', size: 'sm', fx: name, at });
  return tile(name, body);
}).join('');

// ---- 離場效果：一定要先進場才看得到離場，所以每個都配一個 fadeIn ----
const outStart = 0.5 + inNames.length * STAGGER + 0.5;
const outNames = exits();
const outTiles = outNames.map((name, i) => {
  const at = outStart + i * 0.5;
  return tile(name,
    card({ text: name, tone: 'blue', size: 'sm', fx: 'fadeIn', at, out: name, outAt: at + 1.2 }),
    `進場 fadeIn → 1.2 秒後 ${name}`);
}).join('');

// ---- 兩種形態並排比較 ----
const shapeStart = outStart + outNames.length * 0.5 + 1.6;
const shapes = ['box', 'text'].map((shape, i) => `
    <div class="row">${card({ text: '按下綠旗', tone: 'orange', size: 'lg', shape, fx: 'pop', at: shapeStart + i * 0.4 })}
      <span class="row-name">shape: ${shape}${shape === 'text' ? '（純文字＋白描邊，不擋畫面）' : '（實心方塊＋白框）'}</span></div>`).join('');

// ---- 字卡語意色：兩種形態各一排 ----
const toneStart = shapeStart + 1.4;
const toneCards = Object.entries(TONES).map(([tone, t], i) =>
  tile(`tone: ${tone}`,
    card({ text: t.label, tone, size: 'sm', fx: 'pop', at: toneStart + i * 0.3 }), t.label)).join('');
const toneTextStart = toneStart + Object.keys(TONES).length * 0.3 + 0.5;
const toneTextCards = Object.entries(TONES).map(([tone, t], i) =>
  tile(`tone: ${tone}`,
    card({ text: t.label, tone, size: 'sm', shape: 'text', fx: 'pop', at: toneTextStart + i * 0.3 }), t.label)).join('');

// ---- 尺寸 ----
const sizeStart = toneTextStart + Object.keys(TONES).length * 0.3 + 0.6;
const sizeCards = Object.keys(SIZES).map((size, i) => `
    <div class="row">${card({ text: '變數就是一個箱子', tone: 'yellow', size, fx: 'slideL', at: sizeStart + i * 0.35 })}
      <span class="row-name">size: ${size}（${SIZES[size].font}px）</span></div>`).join('');

// ---- 組合範例 ----
const comboStart = sizeStart + Object.keys(SIZES).length * 0.35 + 0.8;
const combo = `
    <div class="row">${card({ text: '按下綠旗', sub: '程式就會開始跑', tone: 'blue', size: 'md', fx: 'bounce', at: comboStart })}
      <span class="row-name">主標 + 副標</span></div>
    <div class="row">${card({ text: '小心！這裡最容易錯', tone: 'red', size: 'md', fx: 'shake', at: comboStart + 0.6 })}
      <span class="row-name">警告卡（紅 + shake）</span></div>
    <div class="row">${card({ text: '答對了！', tone: 'green', size: 'lg', shape: 'text', fx: 'stamp', at: comboStart + 1.2 })}
      <span class="row-name">答對（綠字白邊 + stamp）</span></div>
    <div class="row">${card({ text: '變數', tone: 'orange', size: 'xl', shape: 'text', fx: 'slideL', at: comboStart + 1.8, out: 'slideOutR', outAt: comboStart + 4 })}
      <span class="row-name">關鍵詞（左滑進 → 右滑出）</span></div>`;

// ---- 句內關鍵字強調 ----
const hiStart = comboStart + 5.0;
const hiRows = `
    <div class="row">${card({ text: `為什麼你背了 ${hi('一百個單字')}，隔天就忘光？`, tone: 'red', size: 'md', fx: 'shake', at: hiStart })}
      <span class="row-name">痛點開場（紅底 + 黃色關鍵字）</span></div>
    <div class="row">${card({ text: `程式要寫在 ${hi('貓咪', 'white')} 身上`, tone: 'orange', size: 'md', fx: 'pop', at: hiStart + 0.6 })}
      <span class="row-name">hi(text, 'white')</span></div>
    <div class="row">${card({ text: `一秒等於 ${hi('十', 'navy')} 格`, tone: 'yellow', size: 'md', fx: 'pop', at: hiStart + 1.2 })}
      <span class="row-name">黃底卡片只能配 navy</span></div>
    <div class="row">${card({ text: `這就是 ${hi('迴圈', 'red')}`, tone: 'purple', size: 'lg', shape: 'text', fx: 'slideL', at: hiStart + 1.8 })}
      <span class="row-name">純文字也能標關鍵字</span></div>
    <div class="row">${card({ text: `答對了 ${hi('三', { scale: 1.9 })} 題`, tone: 'green', size: 'md', fx: 'pop', at: hiStart + 2.4 })}
      <span class="row-name">hi(text, { scale: 1.9 })　放大倍率可調</span></div>
    <div class="row">${card({ text: `按 ${hi('綠旗', '#7CFF6B')} 開始`, tone: 'blue', size: 'md', fx: 'pop', at: hiStart + 3.0 })}
      <span class="row-name">直接給色碼</span></div>`;

// ---- 視線引導 ----
const ptrStart = hiStart + 4.2;
const ptrRows = `
    <div class="row"><div class="ptrbox ptrwide"><span class="target">按這裡</span>
      ${arrow({ x: 250, y: 60, dir: 'right', at: ptrStart })}</div>
      <span class="row-name">arrow（箭尖指到 x,y，箭身往反方向長）</span></div>
    <div class="row"><div class="ptrbox ptrwide"><span class="target">重複 10 次</span>
      ${circle({ x: 300, y: 60, w: 260, h: 96, at: ptrStart + 0.8 })}</div>
      <span class="row-name">circle（圈住一小群東西）</span></div>
    <div class="row"><div class="ptrbox ptrwide"><span class="target">變數要先建立</span>
      ${underline({ x: 168, y: 84, w: 270, at: ptrStart + 1.6 })}</div>
      <span class="row-name">underline（強調一行字）</span></div>`;
const ptrTones = Object.keys(POINTER_COLORS).map((tone, i) =>
  tile(`tone: ${tone}`, `<div class="ptrbox">${circle({ x: 100, y: 46, w: 160, h: 70, at: ptrStart + 2.6 + i * 0.3, tone })}</div>`,
    '引導線顏色')).join('');

const TOTAL = ptrStart + 6.0;

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<title>動畫與字卡總覽</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<style>
  body { margin: 0; background: #1b1630; color: #fff;
         font-family: "PingFang TC", "Noto Sans TC", system-ui, sans-serif; }
  .bar { position: fixed; top: 0; left: 0; right: 0; z-index: 99; display: flex; gap: 16px;
         align-items: center; padding: 14px 24px; background: rgba(0,0,0,.55); backdrop-filter: blur(8px); }
  .bar button { font: inherit; font-weight: 700; padding: 8px 20px; border: 0; border-radius: 999px;
                background: #FF9F1C; color: #fff; cursor: pointer; }
  .bar input { flex: 1; }
  .wrap { padding: 80px 40px 60px; }
  h2 { font-size: 24px; margin: 44px 0 18px; color: #FFD166; }
  h2:first-child { margin-top: 0; }
  h2 small { font-weight: 400; font-size: 15px; color: rgba(255,255,255,.5); margin-left: 10px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px; }
  .tile { background: rgba(255,255,255,.06); border-radius: 16px; padding: 16px; }
  .tile-stage { height: 96px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .tile-name { font-family: ui-monospace, monospace; font-size: 15px; color: #7EC9F5; margin-top: 8px; }
  .tile-note { font-size: 12px; color: rgba(255,255,255,.5); margin-top: 3px; }
  .row { display: flex; align-items: center; gap: 24px; min-height: 120px; }
  .row-name { font-family: ui-monospace, monospace; font-size: 15px; color: rgba(255,255,255,.55); }
  /* runtime 掃描要靠 .clip 換算時間；預覽整頁當成一個從 0 開始的段落 */
  .clip { display: contents; }
  .cd { width: 92px; height: 92px; border-radius: 50%; background: #FF4D6D; border: 6px solid #fff;
        display: flex; align-items: center; justify-content: center; font-size: 44px; font-weight: 900;
        visibility: hidden; opacity: 0; }
${CARD_CSS}
${POINTER_CSS}
  /* 引導線是 position:absolute，預覽要給它一個定位容器 */
  .ptrbox { position: relative; width: 200px; height: 92px; }
  .ptrbox.ptrwide { width: 560px; height: 120px; display: flex; align-items: center; }
  .target { font-size: 34px; font-weight: 900; color: #fff; margin-left: 40px; }
</style>
</head>
<body>
<div class="bar">
  <button id="replay">重播</button>
  <input id="scrub" type="range" min="0" max="${TOTAL.toFixed(2)}" step="0.01" value="0">
  <span id="t" style="font-family:ui-monospace,monospace;font-size:14px">0.00s</span>
</div>
<div class="clip" data-start="0">
<div class="wrap">
  <h2>進場效果 <small>fx('名稱', 秒數)　共 ${inNames.length} 種</small></h2>
  <div class="grid">${inTiles}</div>

  <h2>離場效果 <small>fxOut('名稱', 秒數)　要搭配一個進場才看得到</small></h2>
  <div class="grid">${outTiles}</div>

  <h2>兩種形態 <small>shape</small></h2>
  ${shapes}

  <h2>語意色・方塊 <small>shape: 'box'</small></h2>
  <div class="grid">${toneCards}</div>

  <h2>語意色・純文字 <small>shape: 'text'</small></h2>
  <div class="grid">${toneTextCards}</div>

  <h2>尺寸 <small>size</small></h2>
  ${sizeCards}

  <h2>組合範例</h2>
  ${combo}

  <h2>句內關鍵字 <small>hi('字', 顏色 或 { color, scale, weight, stroke })　一句只標一個詞</small></h2>
  ${hiRows}

  <h2>視線引導 <small>arrow / circle / underline</small></h2>
  ${ptrRows}
  <div class="grid">${ptrTones}</div>
</div>
</div>
<script>
  window.__timelines = {};
  const tl = gsap.timeline({ paused: true });
${fxRuntimeJS()}
  window.__timelines['kit'] = tl;

  const scrub = document.getElementById('scrub');
  const label = document.getElementById('t');
  tl.eventCallback('onUpdate', () => {
    scrub.value = tl.time();
    label.textContent = tl.time().toFixed(2) + 's';
  });
  scrub.addEventListener('input', () => { tl.pause(); tl.seek(+scrub.value); });
  document.getElementById('replay').addEventListener('click', () => { tl.restart(); });
  tl.play();
<\/script>
</body>
</html>
`;

writeFileSync(OUT, html);
console.log(`已寫出 ${OUT}`);
console.log(`  進場 ${inNames.length} 種／離場 ${outNames.length} 種／字卡色 ${Object.keys(TONES).length} 種／尺寸 ${Object.keys(SIZES).length} 級／形態 2 種`);
console.log(`  關鍵字色 ${Object.keys(HL).length} 種（可給色碼、倍率可調）／引導線 3 種 × ${Object.keys(POINTER_COLORS).length} 色`);
console.log('  用瀏覽器打開，可拖時間軸逐格看。');
