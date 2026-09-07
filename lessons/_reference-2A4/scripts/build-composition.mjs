// 由 script-data.mjs 產生 HyperFrames composition（2A4 變數魔法師）
// 用法：node build-composition.mjs <輸出的 index.html 路徑>
//
// 規則備忘（2A5 踩過的坑，這裡沿用）：
// - clip 內的圖片一律用 div + background-image，用 <img> 會被框架媒體探索接管而不渲染
// - 角色 clip 必須排在全屏段落 clip 之後，否則被背景蓋掉（堆疊看 DOM 順序）
// - 時間一律先 r2 再輸出，否則 toFixed 捨入會讓同軌 clip 重疊
// - 畫面完全不使用 emoji：Scratch 素材 + 教案原始截圖 + CSS 繪製
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SEGS, voiceId } from './script-data.mjs';
// 路徑（語音、音樂床）的單一事實來源：course.json，共用腳本也讀同一份
const CFG = JSON.parse(readFileSync(new URL('course.json', import.meta.url), 'utf-8'));

// 角色配音（voai TTS）。有配音的角色用實際語音長度排時間，沒有的維持字數估算。
const VOICE_DIR = CFG.voiceDir;
const voiceDur = {};
for (const who of ['Cooper', 'Max', 'Cora']) {
  const f = fileURLToPath(new URL(`voice-durations-${who}.json`, import.meta.url));
  if (existsSync(f)) voiceDur[who] = JSON.parse(readFileSync(f, 'utf-8'));
}

// ===== 節奏參數（調這裡控制總長）=====
const INTRO = 10.0;     // 片頭（opening.mp4 實長 10.048 秒，取整避免尾端黑格）
const LEAD = 0.6;       // 每段開場緩衝
const TAIL = 1.0;       // 每段收尾留白
const GAP = 0.2;        // 每句講完的留白（換人接話的間隔）
const VOICE_PAD = 0.05; // 語音檔尾端的安全邊界
const PER_CHAR = 0.15;  // 以下三個只在沒有配音檔時才用到
const BASE = 1.7;
const MIN_LINE = 3.0;

const r2 = (n) => Math.round(n * 100) / 100;
const durOf = (t) => r2(Math.max(MIN_LINE, BASE + t.length * PER_CHAR));

const CHAR_COLORS = { Cooper: '#2F5FC0', Max: '#B85C06', Cora: '#B02F68' };
const ASSET_ROOT = 'assets/characters';
const PROJ = new URL('../../../hyperframes-project/', import.meta.url);
// 每個角色只有特定幾個動作，用不存在的組合會讓畫面開天窗，這裡直接擋下來
const ACTIONS = {
  Cooper: ['greeting', 'talking', 'thinking', 'guide_left', 'guide_right', 'goodbye'],
  Cora: ['greeting', 'talking', 'listening', 'encourage', 'goodbye'],
  Max: ['greeting', 'talking', 'thinking', 'eureka', 'goodbye'],
};
const badActions = [];
const timingOf = (who, action) => {
  if (!ACTIONS[who]?.includes(action)) badActions.push(`${who}.${action}`);
  return JSON.parse(readFileSync(new URL(`${ASSET_ROOT}/${who}/${action}/timing.json`, PROJ), 'utf-8'));
};
const kfSrc = (who, action, i) => `${ASSET_ROOT}/${who}/${action}/keyframes/keyframe_0${i + 1}.png`;

// Scratch 素材路徑
const sp = (folder, file) => `assets/scratch角色素材/${folder}/${file}`;
const bgd = (file) => `assets/scratch背景素材/${file}`;
const blk = (p) => `assets/scratch-blocks/${p}.svg`;

// Scratch 角色 SVG 的長寬比差很多（貓咪是 133×72 的橫長形），
// 塞進正方形容器再 contain 會只用到中間一小條、看起來像縮成一點。
// 一律從 SVG 的 width/height 換算實際容器尺寸。
const svgDims = {};
const spriteBox = (src, h) => {
  const [w0, h0] = (svgDims[src] ??= readFileSync(new URL(src, PROJ), 'utf-8')
    .match(/width="([\d.]+)"\s+height="([\d.]+)"/).slice(1).map(Number));
  return [Math.round(h * (w0 / h0)), h];
};
// 依高度擺放角色圖，寬度由原圖比例決定
const spriteArt = (src, h, style = '', attrs = '') => {
  const [w, hh] = spriteBox(src, h);
  return art(src, w, hh, style, attrs);
};

const SPRITE = {
  cat: sp('043_Cat_2', '01_cat_2.svg'),
  star: sp('217_Star', '01_star.svg'),
  flag: sp('114_Green_Flag', '01_green_flag.svg'),
  stop: sp('219_Stop', '01_stop.svg'),
  ball: sp('214_Soccer_Ball', '01_soccer_ball.svg'),
  balloon: sp('015_Balloon1', '01_balloon1-a.svg'),
  arrow: sp('010_Arrow1', '01_arrow1-a.svg'),
};
const BACKDROP = { soccer: bgd('061_Soccer_2.png') };

// 教案 PPT 內的原始 Scratch 程式截圖 —— 學生要照著排的最終程式，一定要放出來。
// 全部已用 Image.getbbox() 裁到內容邊界，紅框百分比才不會被透明邊拉歪。
const CODE = {
  init: ['assets/code2a4/code_init.png', 393, 397],
  speedup: ['assets/code2a4/code_speedup.png', 217, 456],
  slowdown: ['assets/code2a4/code_slowdown.png', 386, 430],
  full: ['assets/code2a4/code_full.png', 178, 566],
};
// 教案投影片裡的真實 Scratch 介面截圖（英文版）。
// 講到工具介面時一律用這些，不要用自己畫的示意圖——學生照著操作才不會困惑。
const UI = {
  varPanel: ['assets/code2a4/ui_variables_panel.png', 390, 602],
  stage: ['assets/code2a4/ui_stage_controls.png', 984, 820],
  controlsBar: ['assets/code2a4/ui_controls_bar.png', 197, 70],
  stepsMonitor: ['assets/code2a4/ui_steps_monitor.png', 218, 55],
  // 教案的角色卡寫 Sprite1，但學生系統的角色庫沒有經典 Scratch 貓（商標素材已下架），
  // 只有 Cat 2；用實拍的卡片才跟學生螢幕對得起來。
  pickCat: ['assets/code2a4/pick_cat2.png', 210, 214],
  pickSoccer: ['assets/code2a4/pick_soccer2_real.png', 210, 214],
  stageSoccer: ['assets/code2a4/stage_soccer.png', 480, 362],
  blkSetSteps: ['assets/code2a4/blk_setsteps.png', 421, 114],
  blkRotation: ['assets/code2a4/blk_rotation.png', 506, 114],
  blkBounce: ['assets/code2a4/blk_bounce.png', 310, 114],
  blkChange: ['assets/code2a4/blk_changesteps.png', 473, 114],
  // 從教案的程式截圖裁出的單塊積木。通用的 Scratch SVG 上面寫的是
  // 「my variable」「score」，跟學生螢幕上的 steps 對不起來，一律改用這些原圖。
  blkMove: ['assets/code2a4/blk_movesteps.png', 284, 81],
  blkChangeM1: ['assets/code2a4/blk_change_m1.png', 361, 82],
  speedLoop: ['assets/code2a4/code_speedup_loop.png', 217, 238],
};
// 通用積木裡唯一需要改名的是那顆橘色橢圓（my variable → steps）
const VAR_OVAL = 'data2a4/data_variable_steps';
// 複習題用哪一塊積木（原始截圖，不套白卡——積木本身就有形狀與顏色）
const REVIEW_BLOCK = {
  setsteps: UI.blkSetSteps,
  rotation: UI.blkRotation,
  bounce: UI.blkBounce,
  changesteps: UI.blkChange,
};

// 真實截圖以「指定高度」放置，寬度由原始比例換算
const shot = ([src, iw, ih], h, attrs = '', style = '') =>
  `<div ${attrs} style="width:${Math.round(h * (iw / ih))}px;height:${h}px;background:url('${src}') center/contain no-repeat;${style}"></div>`;

// 依台詞內容找句子。用 L[3] 這種索引綁定，只要講稿中間插一句話，
// 後面每個紅框都會對錯句子——找不到就當場爆掉，比渲染 20 分鐘後才發現便宜太多。
const say = (L, kw) => {
  const ln = L.find((l) => l.text.includes(kw));
  if (!ln) throw new Error(`紅框對不到台詞：「${kw}」`);
  return ln;
};

const shotFades = [];
const marks = [];
// 紅框：講到哪一塊積木就把它框起來。box 是相對於容器的百分比 [x, y, w, h]。
const hl = ([x, y, w, h], at, until, arrow = null) => {
  const id = `mk${marks.length}`;
  // 紅框至少要停 1.2 秒，否則進場還沒完就開始淡出（lint 的 overlapping_gsap_tweens）
  const A = r2(CUR.start + at), U = r2(CUR.start + Math.max(until, at + 1.2));
  marks.push({ id, at: A, until: U, scale: true });
  hit('pop', at);
  const box = `<div id="${id}" class="hl" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"></div>`;
  if (!arrow) return box;
  // 箭頭的定位 transform 放在外層 wrapper，內層才不會跟 GSAP 的 transform 打架
  const aid = `${id}a`;
  marks.push({ id: aid, at: r2(A + 0.15), until: U, scale: false });
  // border-right 產生的三角形朝左、border-left 才朝右：
  // 擺在目標左側的箭頭要指向右邊，所以用未翻轉的 .arrow（尖端在右）
  const pos = arrow === 'left'
    ? `left:${x}%;top:${y + h / 2}%;transform:translate(-106%,-50%)`
    : `left:${x + w}%;top:${y + h / 2}%;transform:translate(6%,-50%) scaleX(-1)`;
  return box + `<div id="${aid}" class="arrowwrap" style="${pos}"><div class="arrow"><i></i><b></b></div></div>`;
};

// 程式碼截圖卡：白底、圓角、陰影，讓積木在綠板上清楚可讀
const codeCard = ([src, iw, ih], h, attrs = '', label = '', hls = '') => {
  const w = Math.round(h * (iw / ih));
  return `<div ${attrs} class="codecard" style="width:${w + 44}px;height:${h + (label ? 50 : 0) + 32}px">
     ${label ? `<span class="codelabel">${label}</span>` : ''}
     <div style="position:relative;width:${w}px;height:${h}px;background:url('${src}') center/contain no-repeat">${hls}</div>
   </div>`;
};

// ===== 音效 =====
// 每個進場動畫配一顆音效。fx() 在產生 HTML 的同時把絕對時間記下來，
// 稍後只輸出 sfx-cues.json，由 mk-audio-bed.py 預混進背景音樂——
// 逐顆掛 <audio> 會讓 composition 的元素數量爆掉。
const SFX = {
  pop: { file: 'pop', dur: 0.16, vol: 0.30 },
  swoosh: { file: 'swoosh', dur: 0.34, vol: 0.22 },
  ding: { file: 'ding', dur: 0.85, vol: 0.28 },
  tick: { file: 'tick', dur: 0.10, vol: 0.18 },
  magic: { file: 'magic', dur: 0.70, vol: 0.26 },
  question: { file: 'question', dur: 0.45, vol: 0.30 },
  click: { file: 'click', dur: 0.12, vol: 0.34 },
};
const FX_SFX = { pop: 'pop', flip: 'pop', stamp: 'ding', rise: 'swoosh', float: 'magic', twinkle: 'magic', qmark: 'question' };
const sfxHits = [];
let CUR = null;  // 目前正在產生的段落，fx() 靠它換算絕對時間
const hit = (kind, at) => sfxHits.push({ kind, at: r2(CUR.start + at) });
const fx = (type, at, extra = '') => {
  if (CUR) {
    if (FX_SFX[type]) hit(FX_SFX[type], at);
    else if (type === 'countdown' || type === 'countdown4') {
      const n = type === 'countdown' ? 5 : 4;
      for (let i = 0; i < n; i++) hit('tick', at + 0.4 + i);
      hit('ding', at + 0.4 + n);
    }
  }
  return `data-fx="${type}" data-at="${at.toFixed(2)}" ${extra}`;
};

// Scratch 素材圖：用 div + background-image
const art = (src, w, h, style = '', attrs = '') =>
  `<div ${attrs} style="width:${w}px;height:${h}px;background:url('${src}') center/contain no-repeat;${style}"></div>`;
// 積木圖：每塊 SVG 的 viewBox 比例都不一樣（0.29~0.71），
// 尺寸一律從 viewBox 換算、共用同一個放大倍率，字級才會一致、形狀不會被壓扁。
const BLOCK_UNIT = 2.15;
const vbCache = {};
const viewBox = (p) => (vbCache[p] ??= readFileSync(new URL(`assets/scratch-blocks/${p}.svg`, PROJ), 'utf-8')
  .match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  .slice(1)
  .map(Number));
const block = (path, scale = 1, attrs = '', style = '') => {
  const [w0, h0] = viewBox(path);
  const w = Math.round(w0 * BLOCK_UNIT * scale);
  const h = Math.round(h0 * BLOCK_UNIT * scale);
  return `<div ${attrs} style="width:${w}px;height:${h}px;background:url('${blk(path)}') center/contain no-repeat;${style}"></div>`;
};

// ===== 實作示範的操作截圖 =====
// 每張 = { file, cap（字幕下方的步驟說明）, on（對應的台詞關鍵字）, box（紅框百分比）, arrow }
// 截圖尚未拍攝時自動改畫「待補」卡，讓時間軸與預覽先成立，補圖後重跑 build 即可。
const STEPS_DIR = 'assets/steps2a4';
const DEMOS = {
  stage: [
    { file: 'A01-playground.jpg', cap: '打開 Scratch 的程式畫面', on: '說完了' },
    { file: 'A02-sprite-button.jpg', cap: '按右下角的「加入角色」', on: '角色按鈕' },
    { file: 'A03-sprite-library.jpg', cap: '在角色庫裡找到貓咪', on: '找到這隻貓咪' },
    { file: 'A04-cat-added.jpg', cap: '貓咪出現在舞台上', on: '跑到舞台上' },
    { file: 'A05-backdrop-button.jpg', cap: '按最右邊的「加入背景」', on: '背景按鈕' },
    { file: 'A06-soccer2-picked.jpg', cap: '選 Soccer 2 這個足球場', on: '按一下' },
    { file: 'A07-stage-ready.jpg', cap: '舞台完成：貓咪站在球場上', on: '球場中間' },
  ],
  makevar: [
    { file: 'B01-variables-category.jpg', cap: '左邊點開橘色的「變數」', on: '真的來做一個變數' },
    { file: 'B02-make-variable-btn.jpg', cap: '按「建立一個變數」', on: '按下建立' },
    { file: 'B03-new-variable-dialog.jpg', cap: '跳出輸入名字的小視窗', on: '小視窗' },
    { file: 'B04-typed-steps.jpg', cap: '打上 steps，按確定', on: '按確定' },
    { file: 'B05-steps-created.jpg', cap: '橘色的 steps 出現了', on: '出現在下面' },
    { file: 'B06-monitor-on-stage.jpg', cap: '舞台左上角也出現 steps', on: '舞台左上角也跑出' },
  ],
  init: [
    { file: 'C01-events-palette.jpg', cap: '從「事件」拖出綠旗積木', on: '拖出當綠旗被點擊' },
    { file: 'C02-goto-dragged.jpg', cap: '從「動作」拖出「移到位置」', on: '移到位置' },
    { file: 'C03-xy-typed.jpg', cap: '把數字改成 0 和 -55', on: '負五十五' },
    { file: 'C04-field-editing.jpg', cap: '按白色圈圈才能打字', on: '白色的圈圈' },
    { file: 'C05-rotation-style.jpg', cap: '設定旋轉方式選 left-right', on: '選左右翻轉' },
    { file: 'C06-init-complete.jpg', cap: '五塊積木黏成一串', on: '尺寸六十' },
  ],
  speedup: [
    { file: 'D01-control-palette.jpg', cap: '從「控制」拖出「重複」', on: '拖出重複十次' },
    { file: 'D02-repeat-300.jpg', cap: '把 10 改成 300', on: '把十改成三百' },
    { file: 'D03-move-inside.jpg', cap: '把「移動」放進重複的肚子裡', on: '放進肚子' },
    { file: 'D04-steps-into-slot.jpg', cap: '把橘色 steps 拖進格子裡', on: '拖進格子裡' },
    { file: 'D05-loop-complete.jpg', cap: '補上改變、反彈、下一個造型', on: '下一個造型' },
    { file: 'D06-running.jpg', cap: '按綠旗，貓咪越跑越快', on: '按綠旗跑跑看' },
  ],
  slowdown: [
    { file: 'E01-second-repeat.jpg', cap: '再拖一塊「重複 300」接在下面', on: '接在下面' },
    { file: 'E02-copy-inside.jpg', cap: '肚子裡的四塊跟上面一樣', on: '完全一樣' },
    { file: 'E03-typed-minus-one.jpg', cap: '把 1 改成 -1', on: '改成負一' },
    { file: 'E04-final-run.jpg', cap: '按綠旗，貓咪衝出去再停下', on: '按下綠旗看看' },
  ],
};
const missingShots = [];
// 一段實作示範：依台詞依序切換截圖，切換時交叉淡入
const demoShots = (L, seg) => {
  const list = DEMOS[seg.demo];
  const items = list.map((s, i) => {
    const start = say(L, s.on).rel;
    const next = list[i + 1] ? say(L, list[i + 1].on).rel : seg.dur - 0.4;
    const id = `${seg.id}-sh${i}`;
    shotFades.push({ id, at: r2(CUR.start + start), until: r2(CUR.start + next) });
    const src = `${STEPS_DIR}/${s.file}`;
    if (!existsSync(new URL(src, PROJ))) missingShots.push(s.file);
    const has = existsSync(new URL(src, PROJ));
    const inner = has
      ? `<div class="demoshot" style="background-image:url('${src}')"></div>`
      : `<div class="demoshot pending"><span>操作截圖待補</span><b>${s.file}</b></div>`;
    return `<div id="${id}" class="demolayer">${inner}<span class="democap">${s.cap}</span></div>`;
  }).join('');
  return `<div class="vis"><div class="demowrap">${items}</div></div>`;
};

// ===== 計算時間軸 =====
let t = INTRO;
for (const seg of SEGS) {
  seg.start = r2(t);
  let cur = LEAD;
  seg.L = seg.lines.map((ln) => {
    const key = voiceId(ln.text);
    const vd = voiceDur[ln.who]?.[key];
    const d = vd ? r2(vd + VOICE_PAD) : durOf(ln.text);
    const o = { ...ln, rel: r2(cur), dur: d, voice: vd ? `${VOICE_DIR}/${ln.who}/${key}.m4a` : null };
    cur = r2(cur + d + GAP + (ln.hold ?? 0));
    return o;
  });
  seg.dur = r2(cur + TAIL);
  t = r2(t + seg.dur);
}
const TOTAL = Math.ceil(t * 10) / 10;

// ===== 角色逐格動畫 =====
const charLayers = [];
function charClip(domId, who, action, start, dur, side) {
  const tm = timingOf(who, action);
  const order = tm.keyframe_order_zero_based;
  const step = 1 / tm.fps;
  const switches = [];
  order.forEach((k, i) => { if (i === 0 || k !== order[i - 1]) switches.push({ k, at: r2(i * step) }); });
  charLayers.push({ domId, switches, cycle: tm.duration_seconds, start, dur });
  const layers = [0, 1, 2, 3].map((i) =>
    `<div id="${domId}-k${i}" style="position:absolute;inset:0;background:url('${kfSrc(who, action, i)}') center bottom/contain no-repeat"></div>`
  ).join('');
  return `
  <div id="${domId}" class="clip" data-start="${start.toFixed(2)}" data-duration="${dur.toFixed(2)}" data-track-index="${side === 'left' ? 3 : 4}"
    style="position:absolute;${side === 'left' ? 'left:10px' : 'right:10px'};bottom:0;width:420px;height:420px">${layers}</div>`;
}

// 倒數圈：出題後給學生真正的思考時間
const countdown = (at, n = 5) =>
  `<div ${fx(n === 5 ? 'countdown' : 'countdown4', at)} class="cdring"><span class="cdnum">${n}</span></div>`;

// 成品影片卡：影片本身 21.67 秒，段落塞不下就截短
const DEMO_LEN = 21.66;
const vidCard = (id, seg, at, caption) => {
  const dur = Math.min(DEMO_LEN, r2(seg.dur - at - 0.4));
  return `
    <div class="vis">
      <div class="stagebox">
        <video id="${id}" class="clip demovid" data-start="${r2(seg.start + at).toFixed(2)}"
          data-duration="${dur.toFixed(2)}" data-track-index="2" src="assets/demo-2a4.mp4" muted></video>
      </div>
      <div ${fx('rise', at + 0.4)} class="minicard" style="margin-top:16px">${caption}</div>
    </div>`;
};

// ===== 各段中央視覺 =====
const V = {
  // 章節大圖卡：從左邊滑進來、停一下、再滑出去，同時由 Cooper 唸出章名
  chapter: (_L, seg) => `
    <div class="vis">
      <div id="${seg.id}-card" class="chapcard">
        <span class="chapnum">${seg.chapNo}</span>
        <span class="chaptxt">${seg.chapTitle}</span>
      </div>
    </div>`,

  title: (L) => `
    <div class="vis">
      <div ${fx('pop', 0.3)} class="kicker">2A4 常規系統課程</div>
      <div ${fx('stamp', say(L, '變數魔法師').rel + 0.3)} class="bigtitle">變數魔法師</div>
      <div ${fx('rise', say(L, '閃電貓飆速').rel + 0.2)} class="tagline dark">專題：閃電貓飆速</div>
      <div class="row" style="margin-top:20px;gap:26px">
        <div id="tl-lines" class="speedlines dark"><i></i><i></i><i></i></div>
        ${spriteArt(SPRITE.cat, 150, '', 'id="tl-cat"')}
      </div>
      ${art(SPRITE.star, 84, 84, 'position:absolute;left:30px;top:-16px', fx('twinkle', say(L, '閃電貓飆速').rel + 0.6))}
      ${art(SPRITE.star, 64, 64, 'position:absolute;right:50px;top:36px', fx('twinkle', say(L, '閃電貓飆速').rel + 0.9))}
    </div>`,

  goals: (L) => `
    <div class="vis">
      <div class="goalgrid">
        ${[['1', '認識積木'], ['2', '練習表達'], ['3', '專題製作'], ['4', '複習時間']].map(([n, s], i) =>
          `<div ${fx('flip', L[i + 1].rel)} class="goalcard"><span class="goalnum">${n}</span><span class="goaltxt">${s}</span></div>`
        ).join('')}
      </div>
    </div>`,

  fastest: (L) => `
    <div class="vis">
      <div ${fx('qmark', 0.4)} class="qmark">？</div>
      <div ${fx('pop', say(L, '哪個角色跑得最快').rel + 0.2)} class="quizq">誰跑得最快？</div>
      <div class="runwrap" style="margin-top:26px">
        <div id="fa-lines" class="speedlines big dark"><i></i><i></i><i></i><i></i></div>
        ${spriteArt(SPRITE.cat, 130, '', 'id="fa-cat"')}
      </div>
      <div ${fx('rise', say(L, '越來越快').rel + 0.2)} class="minicard" style="margin-top:16px">先慢慢跑　→　越來越快</div>
    </div>`,

  demoVideo: (L, seg) => vidCard('dv1', seg, say(L, '做完長什麼樣子').rel, '今天要做出來的樣子'),
  demoVideo2: (L, seg) => vidCard('dv2', seg, say(L, '看完成的樣子').rel, '成果展示：閃電貓飆速'),

  // 變數＝收納箱。玩具散在外面 → 收進箱子裡
  varBox: (L) => `
    <div class="vis">
      <div class="row" style="gap:70px">
        <div id="vb-mess" class="messwrap">
          <div class="toy toy-car"></div><div class="toy toy-book"></div><div class="toy toy-ball"></div>
        </div>
        <div ${fx('pop', say(L, '電腦裡面的一個箱子').rel + 0.2)} class="crate">
          <div class="cratelid"></div>
          <span class="cratename">變數</span>
          <div class="row" style="gap:10px"><div class="toy toy-car mini"></div><div class="toy toy-ball mini"></div></div>
        </div>
      </div>
      <div ${fx('stamp', say(L, '存東西的箱子').rel + 0.3)} class="keyword" style="margin-top:26px">變數 ＝ 存東西的箱子</div>
    </div>`,

  // 箱子裡的數字會換掉
  varSwap: (L) => `
    <div class="vis">
      <div class="crate big">
        <div class="cratelid"></div>
        <span class="cratename">steps</span>
        <span id="vs-num" class="cratenum">5</span>
      </div>
      <div ${fx('rise', say(L, '會改變的意思').rel + 0.2)} class="row" style="margin-top:26px;gap:22px">
        <div class="minicard">變</div>
        <div class="ifarrow side"></div>
        <div class="minicard">會改變</div>
        <div class="ifarrow side"></div>
        <div class="minicard hot">變數</div>
      </div>
    </div>`,

  varLife: (L) => `
    <div class="vis">
      <div class="row" style="gap:34px">
        ${[['年紀', '生日就加一歲', 'age', '八'], ['班上人數', '有人轉走就變少', 'people', '二十六'], ['心情', '肚子餓就不開心', 'mood', '？']]
          .map(([a, b, cls, v], i) => `
          <div ${fx('rise', say(L, ['你的年紀', '你們班上有幾個人', '你現在的心情'][i]).rel + 0.2)} class="lifecard">
            <div class="ico ico-${cls}"></div>
            <div class="lifetitle">${a}</div>
            <div class="lifeval">${v}</div>
            <div class="lifenote">${b}</div>
          </div>`).join('')}
      </div>
    </div>`,

  quizVarLife: (L) => `
    <div class="vis">
      <div ${fx('pop', 0.3)} class="quizq">哪一個是變數？</div>
      <div class="row" style="margin-top:24px;gap:56px">
        <div id="qv-a" class="optcard wide"><span class="optlab">A</span><span>你的名字</span><span class="optsub">小明</span></div>
        <div id="qv-b" class="optcard wide"><span class="optlab">B</span><span>你的身高</span><span class="optsub">一點三公尺</span></div>
      </div>
      ${countdown(say(L, 'A 是你的名字').rel + 0.6)}
      <div ${fx('stamp', say(L, '答對了！會改變的').rel + 0.2)} class="answer">會改變的才是變數<span class="tick"></span></div>
    </div>`,

  deskShelf: (L) => `
    <div class="vis">
      <div class="row" style="gap:70px;align-items:flex-end">
        <div ${fx('rise', say(L, '放在桌上').rel + 0.2)} class="deskwrap">
          <div class="deskbooks"><i></i><i></i></div>
          <div class="desktop"></div><div class="desklegs"><i></i><i></i></div>
          <div class="placetag hot">桌上：馬上要用</div>
        </div>
        <div ${fx('rise', say(L, '放在書架上').rel + 0.2)} class="shelfwrap">
          <div class="shelfrow"><i></i><i></i><i></i><i></i><i></i></div>
          <div class="shelfrow"><i></i><i></i><i></i><i></i></div>
          <div class="placetag">書架：等一下才用</div>
        </div>
      </div>
      <div ${fx('stamp', say(L, '變數就放在它的桌上').rel + 0.3)} class="keyword" style="margin-top:22px">變數放在電腦的「桌上」</div>
    </div>`,

  dataTypes: (L) => `
    <div class="vis">
      <div class="typegrid">
        ${[['文字', 'Cora', 'txt'], ['整數', '3　4　50', 'int'], ['小數', '1.3', 'flt'], ['是或不是', '是／不是', 'bool']]
          .map(([a, b, cls], i) => `
          <div ${fx('flip', say(L, ['第一種，文字', '第二種，整數', '第三種，有小數點', '第四種比較特別'][i]).rel + 0.2)} class="typecard ${cls}">
            <span class="typename">${a}</span><span class="typeval">${b}</span>
          </div>`).join('')}
      </div>
    </div>`,

  boolTF: (L) => `
    <div class="vis">
      <div ${fx('pop', 0.4)} class="quizq">你現在肚子餓嗎？</div>
      <div class="row" style="margin-top:28px;gap:70px">
        <div id="tf-yes" class="tfcard yes"><span class="tfbig">是</span><span class="tfen">True</span></div>
        <div id="tf-switch" class="switch"><i></i></div>
        <div id="tf-no" class="tfcard no"><span class="tfbig">不是</span><span class="tfen">False</span></div>
      </div>
      <div ${fx('rise', say(L, '像一個開關').rel + 0.2)} class="minicard" style="margin-top:24px">只有兩個答案，就像一個開關</div>
    </div>`,

  quizType: (L) => `
    <div class="vis">
      <div ${fx('pop', 0.3)} class="quizq">「你今年幾歲」是哪一種？</div>
      <div class="row" style="margin-top:24px;gap:34px">
        ${['文字', '整數', '小數'].map((s, i) =>
          `<div id="qt-${i}" class="optcard"><span class="optlab">${'ABC'[i]}</span><span>${s}</span></div>`).join('')}
      </div>
      ${countdown(say(L, '是哪一種東西呢').rel + 0.6)}
      <div ${fx('stamp', say(L, '歲數是整數').rel + 0.2)} class="answer">歲數是整數<span class="tick"></span></div>
    </div>`,

  pickStage: (L) => `
    <div class="vis">
      <div class="row" style="gap:26px">
        <div ${fx('pop', say(L, '橘色的貓咪').rel + 0.2)} class="shotcard">${shot(UI.pickCat, 160)}</div>
        <div ${fx('pop', say(L, '綠色的足球場').rel + 0.1)} class="plus"></div>
        <div ${fx('pop', say(L, '綠色的足球場').rel + 0.2)} class="shotcard">${shot(UI.pickSoccer, 160)}</div>
      </div>
      <div ${fx('pop', say(L, '舞台就完成了').rel + 0.1)} class="eqdown"></div>
      <div ${fx('pop', say(L, '舞台就完成了').rel + 0.3)} class="shotcard">${shot(UI.stageSoccer, 250)}</div>
    </div>`,

  demoShots: (L, seg) => demoShots(L, seg),

  // 變數面板：教案原始截圖，紅框指出「建立一個變數」與預設的 my variable
  makeVar: (L) => {
    const hls = hl([4, 15, 62, 8], say(L, '建立一個變數').rel + 0.4, say(L, 'my variable').rel, 'right')
      + hl([28, 23, 42, 8], say(L, 'my variable').rel + 0.3, say(L, '不用它').rel + 1.4, 'right')
      + hl([2, 60, 12, 12], say(L, '橘色的變數').rel + 0.3, say(L, '建立一個變數').rel, 'right');
    return `
    <div class="vis">
      <div class="row" style="gap:44px">
        ${codeCard(UI.varPanel, 500, fx('rise', 0.3), '變數積木區', hls)}
        <div class="stack" style="gap:18px">
          <div ${fx('pop', say(L, '名字叫做 steps').rel + 0.2)} class="crate">
            <div class="cratelid"></div>
            <span class="cratename">steps</span>
            <span class="cratenum sm">0</span>
          </div>
          <div ${fx('rise', say(L, '步數的意思').rel + 0.2)} class="minicard">steps ＝ 步數</div>
        </div>
      </div>
    </div>`;
  },

  monitorShow: (L) => {
    const hls = hl([3, 14, 30, 72], say(L, '箱子的名字').rel + 0.3, say(L, '橘色的地方').rel)
      + hl([49, 14, 45, 72], say(L, '橘色的地方').rel + 0.3, say(L, '裡面放著十').rel + 1.6);
    return `
    <div class="vis">
      ${codeCard(UI.stepsMonitor, 230, fx('pop', 0.4), '舞台左上角的變數牌子', hls)}
      <div class="row" style="margin-top:26px;gap:28px">
        <div ${fx('rise', say(L, '箱子的名字').rel + 0.4)} class="minicard">左邊＝箱子的名字</div>
        <div ${fx('rise', say(L, '橘色的地方').rel + 0.4)} class="minicard hot">右邊＝箱子裡的東西</div>
      </div>
    </div>`;
  },

  blockFlag: (L) => `
    <div class="vis">
      ${block('event/event_whenflagclicked', 1.35, fx('rise', say(L, '當綠旗被點擊').rel + 0.2))}
      <div class="row" style="margin-top:34px;gap:40px">
        <div ${fx('pop', say(L, '舞台的右上角').rel + 0.3)} class="shotcard">${shot(UI.controlsBar, 110)}</div>
        <div class="stack" style="gap:12px">
          <div ${fx('rise', say(L, '舞台的右上角').rel + 0.5)} class="minicard">綠旗＝開始</div>
          <div ${fx('rise', say(L, '紅色的是停止').rel + 0.2)} class="minicard">紅色＝停下來</div>
        </div>
      </div>
    </div>`,

  initBlocks: (L) => `
    <div class="vis">
      <div class="blockgrid">
        ${[
          ['motion/motion_gotoxy', '走到球場正中間', '第一件，走到球場正中間'],
          ['motion/motion_setrotationstyle', '只能左右轉', '第二件，只能左右轉'],
          [UI.blkSetSteps, '把數字設成零', '第三件，把箱子裡的數字設成零'],
          ['looks/looks_setsizeto', '縮小成六十趴', '第四件，把貓咪縮小成六十趴'],
        ].map(([p, cap, kw]) => `
          <div ${fx('rise', say(L, kw).rel + 0.2)} class="blockcell">
            ${Array.isArray(p) ? shot(p, 62) : block(p, 0.82)}
            <span class="blockcap">${cap}</span>
          </div>`).join('')}
      </div>
    </div>`,

  codeInit: (L) => {
    const hls =
      hl([0, 1, 60, 23], say(L, '最上面是當綠旗被點擊').rel + 0.3, say(L, '移到中間').rel)
      + hl([0, 25, 76, 16], say(L, '移到中間').rel + 0.3, say(L, '負五十五').rel + 1.6)
      + hl([0, 43, 97, 17], say(L, '設定旋轉方式').rel + 0.3, say(L, 'steps 設為零').rel)
      + hl([0, 62, 84, 18], say(L, 'steps 設為零').rel + 0.3, say(L, '尺寸設為六十趴').rel)
      + hl([0, 82, 64, 17], say(L, '尺寸設為六十趴').rel + 0.3, say(L, '五塊積木').rel);
    return `<div class="vis">${codeCard(CODE.init, 520, fx('rise', 0.3), '出發的程式（照著排）', hls)}</div>`;
  },

  quizZero: (L) => `
    <div class="vis">
      <div ${fx('pop', 0.3)} class="quizq">為什麼一開始要設成零？</div>
      <div class="row" style="margin-top:24px;gap:56px">
        <div id="qz-a" class="optcard wide"><span class="optlab">A</span><span>想讓貓咪</span><span>站著不動</span></div>
        <div id="qz-b" class="optcard wide"><span class="optlab">B</span><span>想讓貓咪</span><span>跑很快</span></div>
      </div>
      ${countdown(say(L, 'A 是想讓貓咪站著不動').rel + 0.6)}
      <div ${fx('stamp', say(L, '答對了，先站好').rel + 0.2)} class="answer">零步＝一步都不走<span class="tick"></span></div>
    </div>`,

  repeatIntro: (L) => `
    <div class="vis">
      <div class="row" style="gap:80px">
        <div class="track">
          <div id="ri-orbit" class="orbit">${spriteArt(SPRITE.cat, 74, 'position:absolute;left:50%;top:-52px;margin-left:-68px')}</div>
          <span class="tracklab">跑一圈<br />再一圈</span>
        </div>
        <div class="stack" style="gap:20px">
          ${block('control/control_repeat', 1.2, fx('rise', say(L, '它叫做重複').rel + 0.2))}
          <div ${fx('pop', say(L, '做三百次').rel + 0.2)} class="minicard hot">改成重複三百次</div>
          <div ${fx('rise', say(L, '肚子裡的積木').rel + 0.2)} class="minicard">肚子裡的積木＝重複做的事</div>
        </div>
      </div>
    </div>`,

  moveSteps: (L) => `
    <div class="vis">
      <div class="row" style="gap:34px;align-items:center">
        <div class="shotcard sm" ${fx('rise', 0.3)}>${shot(UI.blkMove, 130)}</div>
        <div ${fx('pop', say(L, '橘色的 steps').rel + 0.2)} class="slotwrap">
          ${block(VAR_OVAL, 1.5)}
        </div>
      </div>
      <div class="row" style="margin-top:34px;gap:44px">
        ${[['2', '走兩步'], ['10', '走十步']].map(([n, s], i) => `
          <div ${fx('flip', say(L, ['箱子裡放二', '箱子裡放十'][i]).rel + 0.2)} class="crate small">
            <div class="cratelid"></div><span class="cratename">steps</span>
            <span class="cratenum sm">${n}</span><span class="cratenote">${s}</span>
          </div>`).join('')}
      </div>
    </div>`,

  changeSteps: (L) => `
    <div class="vis">
      <div class="shotcard sm" ${fx('rise', 0.3)}>${shot(UI.blkChange, 130)}</div>
      <div class="row" style="margin-top:30px;gap:22px">
        <div class="crate small">
          <div class="cratelid"></div><span class="cratename">steps</span>
          <span id="cs-num" class="cratenum">0</span>
        </div>
        <div class="stack" style="gap:14px">
          <div ${fx('pop', say(L, '零變一').rel + 0.2)} class="minicard">零 → 一 → 二 → 三</div>
          <div id="cs-fast" class="minicard hot">每一圈都多走一步</div>
        </div>
      </div>
      <div class="runwrap" style="margin-top:18px">
        <div id="cs-lines" class="speedlines"><i></i><i></i><i></i></div>
        ${spriteArt(SPRITE.cat, 96, '', 'id="cs-cat"')}
      </div>
    </div>`,

  bounce: (L) => `
    <div class="vis">
      ${block('motion/motion_ifonedgebounce', 1.25, fx('rise', say(L, '碰到邊緣就反彈').rel + 0.2))}
      <div class="stagebox" style="margin-top:20px">
        <div class="stageinner" style="background:url('${BACKDROP.soccer}') center/cover no-repeat">
          <div id="bo-wall-l" class="wallflash left"></div>
          <div id="bo-wall-r" class="wallflash right"></div>
          ${spriteArt(SPRITE.cat, 96, 'position:absolute;left:36px;bottom:40px', 'id="bo-cat"')}
        </div>
      </div>
    </div>`,

  nextCostume: (L, seg) => `
    <div class="vis">
      <div class="row" style="gap:40px">
        ${block('looks/looks_nextcostume', 1.25, fx('rise', 0.3))}
        <div class="stagebox small">
          <div class="stageinner" style="background:url('${BACKDROP.soccer}') center/cover no-repeat">
            <video id="nc-vid" class="clip demovid inner" data-start="${r2(seg.start + say(L, '兩張圖片').rel).toFixed(2)}"
              data-duration="${Math.min(8, r2(seg.dur - say(L, '兩張圖片').rel - 0.4)).toFixed(2)}" data-track-index="2"
              src="assets/demo-2a4-run.mp4" muted></video>
          </div>
        </div>
      </div>
      <div ${fx('rise', say(L, '一張左腳在前').rel + 0.2)} class="minicard" style="margin-top:18px">兩張圖片換來換去 ＝ 走路</div>
    </div>`,

  // 整支加速程式只有 217px 寬，整張放大到滿版字還是糊的。
  // 拆成「出發五塊」與「加速迴圈」兩張高解析原圖並排，積木上的字才看得清楚。
  codeSpeedUp: (L) => {
    const hlA = hl([0, 0, 100, 100], say(L, '上面五塊').rel + 0.3, say(L, '排好了').rel + 1.2);
    const hlB =
      hl([0, 2, 62, 16], say(L, '重複三百次').rel + 0.3, say(L, '肚子裡放四塊').rel)
      + hl([7, 20, 71, 15], say(L, '肚子裡放四塊').rel + 0.3, say(L, '順序可以換嗎').rel)
      + hl([7, 37, 91, 17], say(L, '肚子裡放四塊').rel + 0.7, say(L, '順序可以換嗎').rel)
      + hl([7, 56, 63, 14], say(L, '肚子裡放四塊').rel + 1.1, say(L, '順序可以換嗎').rel)
      + hl([7, 71, 47, 16], say(L, '肚子裡放四塊').rel + 1.5, say(L, '順序可以換嗎').rel)
      + hl([7, 20, 71, 15], say(L, '要先走').rel + 0.3, say(L, '順序換了').rel, 'left');
    return `
    <div class="vis">
      <div class="row" style="gap:34px;align-items:flex-start">
        ${codeCard(CODE.init, 420, fx('rise', 0.3), '① 出發五塊', hlA)}
        ${codeCard(UI.speedLoop, 460, fx('rise', 0.5), '② 加速迴圈', hlB)}
      </div>
    </div>`;
  },

  quizChange: (L) => `
    <div class="vis">
      <div ${fx('pop', 0.3)} class="quizq">如果改成「改變 2」呢？</div>
      <div class="row" style="margin-top:24px;gap:56px">
        <div id="qc-a" class="optcard wide"><span class="optlab">A</span><span>加速變得</span><span>更快</span></div>
        <div id="qc-b" class="optcard wide"><span class="optlab">B</span><span>貓咪</span><span>停下來</span></div>
      </div>
      ${countdown(say(L, 'A 是加速變得更快').rel + 0.6)}
      <div ${fx('stamp', say(L, '加得越多').rel + 0.2)} class="answer">加得越多，衝得越快<span class="tick"></span></div>
    </div>`,

  minusOne: (L) => `
    <div class="vis">
      <div class="row" style="gap:34px;align-items:center">
        <div class="stack" style="gap:12px">
          <div class="shotcard sm" ${fx('rise', say(L, '改變負一').rel + 0.2)}>${shot(UI.blkChangeM1, 124)}</div>
          <span class="blockcap">把一改成負一</span>
        </div>
        <div class="crate small">
          <div class="cratelid"></div><span class="cratename">steps</span>
          <span id="mo-num" class="cratenum">10</span>
        </div>
      </div>
      <div class="row" style="margin-top:26px;gap:34px">
        <div ${fx('rise', say(L, '加一是變多').rel + 0.2)} class="minicard">加一 ＝ 變多</div>
        <div ${fx('rise', say(L, '加一是變多').rel + 0.5)} class="minicard hot">負一 ＝ 變少</div>
        <div ${fx('pop', say(L, '貓咪就停下來').rel + 0.2)} class="minicard">變成零 ＝ 停下來</div>
      </div>
    </div>`,

  codeSlowDown: (L) => {
    const hls =
      hl([0, 0, 64, 15], say(L, '一樣是重複三百次').rel + 0.3, say(L, '移動 steps 步').rel)
      + hl([6, 17, 72, 17], say(L, '移動 steps 步').rel + 0.3, say(L, '只有這裡不一樣').rel)
      + hl([6, 35, 92, 17], say(L, '只有這裡不一樣').rel + 0.3, say(L, '只差一個減號').rel)
      + hl([81, 38, 16, 12], say(L, '只差一個減號').rel + 0.2, say(L, '從加速變減速').rel, 'left');
    return `<div class="vis">${codeCard(CODE.slowdown, 500, fx('rise', 0.3), '減速的那一段', hls)}</div>`;
  },

  // 課程尾聲的總覽：三段程式並排，比把 178px 寬的整支程式縮成一條清楚得多
  codeFull: (L) => {
    const secs = [
      [CODE.init, 355, '① 出發前的準備', '出發前的準備', 'a'],
      [UI.speedLoop, 380, '② 越跑越快', '越跑越快', 'b'],
      [CODE.slowdown, 370, '③ 慢慢停下來', '慢慢停下來', 'c'],
    ];
    return `
    <div class="vis">
      <div class="row" style="gap:22px;align-items:flex-start">
        ${secs.map(([img, h, label, kw, k]) => {
          const box = hl([0, 0, 100, 100], say(L, kw).rel + 0.3, say(L, '三段合起來').rel + 1.6);
          return `<div class="seccol s-${k}">${codeCard(img, h, fx('rise', say(L, kw).rel + 0.15), label, box)}</div>`;
        }).join('')}
      </div>
    </div>`;
  },

  quizStop: (L) => `
    <div class="vis">
      <div ${fx('pop', 0.3)} class="quizq">箱子裡變成 0，貓咪會？</div>
      <div class="row" style="margin-top:24px;gap:56px">
        <div id="qs-a" class="optcard wide"><span class="optlab">A</span><span>停住</span><span>不動</span></div>
        <div id="qs-b" class="optcard wide"><span class="optlab">B</span><span>倒著</span><span>走回去</span></div>
      </div>
      ${countdown(say(L, 'A 是貓咪停住').rel + 0.6)}
      <div ${fx('stamp', say(L, '走零步').rel + 0.2)} class="answer">走零步＝停在原地<span class="tick"></span></div>
    </div>`,

  manner: (L) => `
    <div class="vis">
      <div class="spotlight">
        ${spriteArt(SPRITE.cat, 108, 'position:absolute;left:50%;bottom:92px;margin-left:-100px;z-index:2')}
        <div class="podium"></div>
      </div>
      <div ${fx('stamp', say(L, '禮貌是一個人最基本').rel + 0.3)} class="keyword" style="margin-top:14px">禮貌</div>
      <div class="row" style="margin-top:18px;gap:34px">
        <div ${fx('rise', say(L, '上台的人有禮貌').rel + 0.2)} class="minicard">上台的人</div>
        <div ${fx('rise', say(L, '上台的人有禮貌').rel + 0.5)} class="minicard">台下的人</div>
      </div>
    </div>`,

  posture: (L) => `
    <div class="vis">
      <div class="row" style="gap:54px">
        <div class="figwrap">
          <div class="fig"><i class="head"></i><i class="body"></i><i class="arm l"></i><i class="arm r"></i><i class="leg l"></i><i class="leg r"></i></div>
          <div id="po-width" class="widthbar"></div>
        </div>
        <div class="stack" style="gap:14px">
          ${['兩腳與肩同寬', '背挺直、頭抬起', '肩膀放輕鬆', '手放在身體兩邊', '眼睛看前面']
            .map((s, i) => `<div ${fx('rise', say(L, ['兩腳張開', '背挺直', '肩膀放輕鬆', '手自然放在', '眼睛看著前面'][i]).rel + 0.2)} class="steprow"><span class="stepnum">${i + 1}</span>${s}</div>`).join('')}
        </div>
      </div>
    </div>`,

  audience: (L) => `
    <div class="vis">
      <div class="stack" style="gap:20px">
        ${[['坐好，手放在腿上', '坐姿'], ['別人講話不插話', '不插話'], ['講完拍拍手', '給鼓勵']]
          .map(([s, tag], i) => `
          <div ${fx('rise', say(L, ['坐好，兩隻手放在腿上', '不要插話', '拍拍手給他鼓勵'][i]).rel + 0.2)} class="audrow">
            <span class="audtag">${tag}</span><span class="audtxt">${s}</span>
          </div>`).join('')}
      </div>
      <div id="au-claps" class="claprow">${[0, 1, 2, 3, 4].map(() => '<i></i>').join('')}</div>
    </div>`,

  // 複習：一次一塊積木 → 猜用途 → 說出答案
  reviewQ: (L, seg) => `
    <div class="vis">
      <div ${fx('qmark', L[seg.qLine].rel)} class="qmark small">？</div>
      <div ${fx('pop', 0.4)} class="shotcard sm">${shot(REVIEW_BLOCK[seg.blockKey], 190)}</div>
      ${countdown(L[seg.qLine].rel + 0.5)}
      <div ${fx('stamp', L[seg.aLine].rel + 0.3)} class="answer">${seg.answer}<span class="tick"></span></div>
    </div>`,

  summary: (L) => `
    <div class="vis">
      <div class="stack" style="gap:22px">
        ${[
          [UI.blkSetSteps, '做一個箱子', '變數就是一個可以存東西的箱子'],
          [UI.blkChange, '換掉裡面的數字', '箱子裡的數字可以一直改變'],
          [UI.blkMove, '讓貓咪變快變慢', '換數字就能讓貓咪變快變慢'],
        ].map(([p, cap, kw]) => `
          <div ${fx('rise', say(L, kw).rel + 0.2)} class="blockcell row wide">
            <div class="shotcard sm">${shot(p, 112)}</div>
            <span class="blockcap">${cap}</span>
          </div>`).join('')}
      </div>
      <div ${fx('stamp', say(L, '變數魔法師了').rel + 0.3)} class="keyword" style="margin-top:26px">你就是變數魔法師！</div>
    </div>`,

  ending: (L) => `
    <div class="vis">
      <div ${fx('stamp', 0.4)} class="bigtitle">下次見！</div>
      <div class="row" style="margin-top:22px;gap:30px">
        ${art(SPRITE.star, 100, 100, '', fx('twinkle', say(L, '今天大家都好棒').rel))}
        ${spriteArt(SPRITE.cat, 140, '', fx('pop', say(L, '今天大家都好棒').rel + 0.2))}
        ${art(SPRITE.star, 80, 80, '', fx('twinkle', say(L, '今天大家都好棒').rel + 0.4))}
      </div>
      <div ${fx('pop', say(L, '下次見囉').rel + 0.2)} class="kicker" style="margin-top:18px">記得回家再做一次喔</div>
    </div>`,
};

// ===== 各段客製動畫 =====
const customJS = (seg) => {
  const S = seg.start, L = seg.L, E = seg.dur;
  const on = (kw, off = 0) => r2(S + say(L, kw).rel + off).toFixed(2);
  switch (seg.vis) {
    case 'chapter':
      return `
  tl.fromTo('#${seg.id}-card',{x:-1500},{x:0,duration:0.9,ease:'power3.out'},${S.toFixed(2)});
  tl.to('#${seg.id}-card',{x:1500,duration:0.7,ease:'power3.in'},${r2(S + E - 0.8).toFixed(2)});`;

    case 'title':
      return `
  tl.set('#tl-lines',{autoAlpha:0},0);
  tl.to('#tl-lines',{autoAlpha:1,duration:0.3},${on('閃電貓飆速', 0.4)});
  tl.fromTo('#tl-cat',{x:-40},{x:40,duration:1.1,yoyo:true,repeat:5,ease:'sine.inOut'},${on('閃電貓飆速', 0.4)});
  tl.to('#tl-lines',{autoAlpha:0,duration:0.3},${r2(S + E - 1.0).toFixed(2)});
  tl.set('#tl-lines',{autoAlpha:0},${r2(S + E - 0.6).toFixed(2)});`;

    case 'fastest':
      // 先慢慢跑，再加上速度線衝出去——動的是貓，不是背景
      return `
  tl.set('#fa-lines',{autoAlpha:0},0);
  tl.fromTo('#fa-cat',{x:-300},{x:0,duration:3.6,ease:'none'},${on('哪個角色跑得最快', 0.4)});
  tl.to('#fa-lines',{autoAlpha:1,duration:0.25},${on('速度線', 0.2)});
  tl.fromTo('#fa-cat',{x:-320},{x:320,duration:0.9,ease:'power1.in'},${on('速度線', 0.2)});
  tl.fromTo('#fa-cat',{x:-320},{x:320,duration:0.7,ease:'power1.in'},${on('速度線', 1.3)});
  tl.to('#fa-lines',{autoAlpha:0,duration:0.3},${on('先慢慢跑', 0.2)});
  tl.set('#fa-lines',{autoAlpha:0},${on('先慢慢跑', 0.6)});
  tl.fromTo('#fa-cat',{x:-320},{x:320,duration:${r2(E - say(L, '先慢慢跑').rel - 1.2).toFixed(2)},ease:'power1.in'},${on('先慢慢跑', 0.6)});`;

    case 'varBox':
      // 散在外面的玩具收進箱子裡
      return `
  tl.to('#vb-mess .toy-car',{x:330,y:60,scale:0.5,autoAlpha:0,duration:0.9,ease:'power2.in'},${on('電腦裡面的一個箱子', 0.6)});
  tl.to('#vb-mess .toy-book',{x:250,y:52,scale:0.5,autoAlpha:0,duration:0.9,ease:'power2.in'},${on('電腦裡面的一個箱子', 0.85)});
  tl.to('#vb-mess .toy-ball',{x:150,y:56,scale:0.5,autoAlpha:0,duration:0.9,ease:'power2.in'},${on('電腦裡面的一個箱子', 1.1)});
  tl.set('#vb-mess .toy-car',{autoAlpha:0},${on('電腦裡面的一個箱子', 1.6)});
  tl.set('#vb-mess .toy-book',{autoAlpha:0},${on('電腦裡面的一個箱子', 1.8)});
  tl.set('#vb-mess .toy-ball',{autoAlpha:0},${on('電腦裡面的一個箱子', 2.1)});`;

    case 'varSwap': {
      let js = '';
      [['5', '現在放五'], ['10', '換成十']].forEach(([n], i) => {
        js += `
  tl.set('#vs-num',{innerText:'${n}'},${on('現在放五', 0.6 + i * 1.5)});
  tl.fromTo('#vs-num',{scale:1.7,rotation:-8},{scale:1,rotation:0,duration:0.45,ease:'back.out(3)'},${on('現在放五', 0.6 + i * 1.5)});`;
      });
      return js;
    }

    case 'boolTF':
      return `
  tl.set(['#tf-no'],{opacity:0.35},0);
  tl.to('#tf-switch i',{x:52,duration:0.4,ease:'back.out(2)'},${on('餓！或是不餓', 0.3)});
  tl.to('#tf-yes',{opacity:0.35,duration:0.4},${on('餓！或是不餓', 0.3)});
  tl.to('#tf-no',{opacity:1,duration:0.4},${on('餓！或是不餓', 0.3)});
  tl.to('#tf-switch i',{x:0,duration:0.4,ease:'back.out(2)'},${on('答案只有兩種', 0.3)});
  tl.to('#tf-yes',{opacity:1,duration:0.4},${on('答案只有兩種', 0.3)});
  tl.to('#tf-no',{opacity:0.35,duration:0.4},${on('答案只有兩種', 0.3)});`;

    case 'quizVarLife':
      return `
  tl.to('#qv-a',{opacity:0.35,duration:0.4},${on('名字從小到大都一樣', 0.3)});
  tl.fromTo('#qv-b',{scale:1},{scale:1.1,duration:0.4,ease:'back.out(2)'},${on('身高會一直長高', 0.2)});`;

    case 'quizType':
      return `
  tl.to(['#qt-0','#qt-2'],{opacity:0.35,duration:0.4},${on('歲數是用數的', 0.3)});
  tl.fromTo('#qt-1',{scale:1},{scale:1.12,duration:0.4,ease:'back.out(2)'},${on('八歲、九歲', 0.2)});`;

    case 'quizZero':
      return `
  tl.to('#qz-b',{opacity:0.35,duration:0.4},${on('我選 A 才對', 0.2)});
  tl.fromTo('#qz-a',{scale:1},{scale:1.12,duration:0.4,ease:'back.out(2)'},${on('我選 A 才對', 0.2)});`;

    case 'quizChange':
      return `
  tl.to('#qc-b',{opacity:0.35,duration:0.4},${on('數字變大是走更多步', 0.3)});
  tl.fromTo('#qc-a',{scale:1},{scale:1.12,duration:0.4,ease:'back.out(2)'},${on('一次加二會更快', 0.2)});`;

    case 'quizStop':
      return `
  tl.to('#qs-b',{opacity:0.35,duration:0.4},${on('零不是負的', 0.3)});
  tl.fromTo('#qs-a',{scale:1},{scale:1.12,duration:0.4,ease:'back.out(2)'},${on('走零步就是不動', 0.2)});`;

    case 'repeatIntro':
      // 跑者繞著跑道跑，不是跑道在轉——旋轉外層 wrapper 帶著貓走
      return `
  tl.fromTo('#ri-orbit',{rotation:0},{rotation:1440,duration:${r2(E - say(L, '跑完一圈').rel - 1.2).toFixed(2)},ease:'none'},${on('跑完一圈', 0.3)});`;

    case 'changeSteps': {
      let js = `
  tl.set('#cs-lines',{autoAlpha:0},0);
  tl.set('#cs-fast',{autoAlpha:0},0);`;
      [0, 1, 2, 3].forEach((n, i) => {
        js += `
  tl.set('#cs-num',{innerText:'${n}'},${on('零變一', 0.3 + i * 0.55)});
  tl.fromTo('#cs-num',{scale:1.6},{scale:1,duration:0.3,ease:'back.out(3)'},${on('零變一', 0.3 + i * 0.55)});`;
      });
      js += `
  tl.to('#cs-fast',{autoAlpha:1,duration:0.35},${on('每跑一次', 0.3)});
  tl.to('#cs-lines',{autoAlpha:1,duration:0.3},${on('會越跑越快', 0.2)});
  tl.fromTo('#cs-cat',{x:-260},{x:260,duration:2.6,ease:'none'},${on('每跑一次', 0.4)});
  tl.fromTo('#cs-cat',{x:-260},{x:260,duration:1.1,ease:'none'},${on('會越跑越快', 0.2)});
  tl.fromTo('#cs-cat',{x:-260},{x:260,duration:0.8,ease:'none'},${on('會越跑越快', 1.4)});
  tl.to('#cs-lines',{autoAlpha:0,duration:0.3},${r2(S + E - 1.0).toFixed(2)});
  tl.set('#cs-lines',{autoAlpha:0},${r2(S + E - 0.6).toFixed(2)});
  tl.to('#cs-fast',{autoAlpha:0,duration:0.3},${r2(S + E - 1.0).toFixed(2)});
  tl.set('#cs-fast',{autoAlpha:0},${r2(S + E - 0.6).toFixed(2)});`;
      return js;
    }

    case 'bounce': {
      // 貓撞左牆 → 翻面 → 撞右牆 → 翻面，牆上閃一下
      const t0 = say(L, '碰到邊緣就反彈').rel + 0.6;
      let js = `
  tl.set(['#bo-wall-l','#bo-wall-r'],{autoAlpha:0},0);
  tl.set('#bo-cat',{scaleX:1},0);`;
      const legs = [[0, 440, 2.0, 'r'], [440, 0, 2.0, 'l'], [0, 440, 1.6, 'r'], [440, 0, 1.6, 'l']];
      let acc = t0;
      for (const [from, to, dur, side] of legs) {
        js += `
  tl.fromTo('#bo-cat',{x:${from}},{x:${to},duration:${dur},ease:'none',overwrite:'auto'},${r2(S + acc).toFixed(2)});
  tl.fromTo('#bo-wall-${side}',{autoAlpha:0},{autoAlpha:1,duration:0.14},${r2(S + acc + dur - 0.1).toFixed(2)});
  tl.to('#bo-wall-${side}',{autoAlpha:0,duration:0.26},${r2(S + acc + dur + 0.05).toFixed(2)});
  tl.set('#bo-wall-${side}',{autoAlpha:0},${r2(S + acc + dur + 0.34).toFixed(2)});
  tl.to('#bo-cat',{scaleX:${side === 'r' ? -1 : 1},duration:0.16},${r2(S + acc + dur).toFixed(2)});`;
        acc = r2(acc + dur);
      }
      return js;
    }

    case 'minusOne': {
      let js = '';
      [10, 9, 8, 7, 0].forEach((n, i) => {
        const kw = i < 4 ? '十變九' : '貓咪就停下來';
        const off = i < 4 ? 0.3 + i * 0.6 : 0.3;
        js += `
  tl.set('#mo-num',{innerText:'${n}'},${on(kw, off)});
  tl.fromTo('#mo-num',{scale:1.6},{scale:1,duration:0.3,ease:'back.out(3)'},${on(kw, off)});`;
      });
      return js;
    }

    case 'posture':
      return `
  tl.fromTo('#po-width',{scaleX:0.2,autoAlpha:0},{scaleX:1,autoAlpha:1,duration:0.6,ease:'back.out(2)'},${on('兩腳張開', 0.3)});
  tl.to('#po-width',{autoAlpha:0,duration:0.4},${on('肩膀放輕鬆', 0.2)});
  tl.set('#po-width',{autoAlpha:0},${on('肩膀放輕鬆', 0.7)});`;

    case 'audience': {
      let js = `  tl.set('#au-claps',{autoAlpha:0},0);
  tl.to('#au-claps',{autoAlpha:1,duration:0.3},${on('拍拍手給他鼓勵', 0.2)});`;
      [0, 1, 2, 3, 4].forEach((i) => {
        js += `
  tl.fromTo('#au-claps i:nth-of-type(${i + 1})',{scale:0.4,y:20},{scale:1,y:0,duration:0.4,ease:'back.out(3)'},${on('拍拍手給他鼓勵', 0.3 + i * 0.12)});`;
      });
      return js;
    }

    default:
      return '';
  }
};

// ===== 組裝 HTML =====
let clips = '';
const bubbles = [];

for (const seg of SEGS) {
  CUR = seg;
  const background = seg.chapter
    ? `<div style="position:absolute;inset:0;background:linear-gradient(135deg,#FF9F1C,#FFBF69 55%,#FFD166)"></div>
       <div class="chapstripes"></div>`
    : seg.teach
    ? `<div style="position:absolute;inset:0;background:#1E7A4F url('assets/backgrounds/classroom-board.svg') center/cover no-repeat"></div>`
    : `<div style="position:absolute;inset:0;background:linear-gradient(180deg,#FFE9A8,#FFD166)"></div>
      <div class="deco d1"></div><div class="deco d2"></div><div class="deco d3"></div><div class="deco d4"></div>`;

  const cooperAction = seg.lines.find((l) => l.who === 'Cooper')?.action ?? 'talking';
  let charClips = seg.chapter ? '' : charClip(`${seg.id}-cooper`, 'Cooper', cooperAction, seg.start, seg.dur, 'left');

  let run = null;
  const runs = [];
  for (const ln of seg.chapter ? [] : seg.L) {
    if (ln.who === 'Cooper') { run = null; continue; }
    if (run && run.who === ln.who && run.action === ln.action) run.end = r2(ln.rel + ln.dur + GAP);
    else { run = { who: ln.who, action: ln.action, start: ln.rel, end: r2(ln.rel + ln.dur + GAP) }; runs.push(run); }
  }
  runs.forEach((r, i) => {
    charClips += charClip(`${seg.id}-side${i}`, r.who, r.action, r2(seg.start + r.start), r2(r.end - r.start), 'right');
  });

  seg.L.forEach((ln, i) => {
    if (!ln.voice) return;
    charClips += `
  <audio id="${seg.id}-v${i}" class="clip" data-start="${r2(seg.start + ln.rel).toFixed(2)}" data-duration="${ln.dur.toFixed(2)}"
    data-track-index="7" src="${ln.voice}" data-volume="1"></audio>`;
  });

  const segBubbles = (seg.chapter ? [] : seg.L).map((ln, i) => {
    const side = ln.who === 'Cooper' ? 'left' : 'right';
    bubbles.push({ sel: `#${seg.id}-b${i}`, at: r2(seg.start + ln.rel), dur: ln.dur });
    return `
    <div id="${seg.id}-b${i}" class="bubble bubble-${side}" style="border-color:${CHAR_COLORS[ln.who]}">
      <span class="bubble-name" style="background:${CHAR_COLORS[ln.who]}">${ln.who === 'Cooper' ? 'Cooper 老師' : ln.who}</span>${ln.text}
    </div>`;
  }).join('');

  clips += `
  <div id="${seg.id}" class="clip" data-start="${seg.start.toFixed(2)}" data-duration="${seg.dur.toFixed(2)}" data-track-index="1"
    style="position:absolute;inset:0;width:1920px;height:1080px">
    ${background}
    ${V[seg.vis](seg.L, seg)}
    ${segBubbles}
  </div>${charClips}`;
}

// 操作截圖的切換：同一段裡前後兩張交叉淡入，不要黑掉再亮
const shotJS = shotFades.map((s) => `
  gsap.set('#${s.id}',{autoAlpha:0});
  tl.to('#${s.id}',{autoAlpha:1,duration:.35},${s.at.toFixed(2)});
  tl.to('#${s.id}',{autoAlpha:0,duration:.3},${r2(s.until - 0.15).toFixed(2)});`).join('\n');

const markJS = marks.map((m) => {
  const inTween = m.scale
    ? `  tl.fromTo('#${m.id}',{autoAlpha:0,scale:1.4},{autoAlpha:1,scale:1,duration:.4,ease:'back.out(2)'},${m.at.toFixed(2)});`
    : `  tl.fromTo('#${m.id}',{autoAlpha:0},{autoAlpha:1,duration:.3},${m.at.toFixed(2)});`;
  return `${inTween}
  tl.to('#${m.id}',{autoAlpha:0,duration:.25},${r2(m.until - 0.3).toFixed(2)});
  tl.set('#${m.id}',{autoAlpha:0},${r2(m.until - 0.02).toFixed(2)});`;
}).join('\n');

const bubbleJS = bubbles.map((b) =>
  // 淡出整段留在該句自己的時間窗內：接話間隔只剩 0.2 秒，
  // 尾巴若跨過下一句的起點，lint 會判定為缺 hard kill
  `  tl.fromTo('${b.sel}',{autoAlpha:0,scale:.6,y:24},{autoAlpha:1,scale:1,y:0,duration:.3,ease:'back.out(1.7)'},${b.at.toFixed(2)});
  tl.to('${b.sel}',{autoAlpha:0,duration:.16},${r2(b.at + b.dur - 0.2).toFixed(2)});
  tl.set('${b.sel}',{autoAlpha:0},${r2(b.at + b.dur - 0.02).toFixed(2)});`
).join('\n');

const charJS = charLayers.map((c) => {
  const reps = Math.max(0, Math.ceil(c.dur / c.cycle) - 1);
  const out = [`  {`, `    const sub = gsap.timeline({ repeat: ${reps} });`];
  out.push(`    sub.set([${[0, 1, 2, 3].map((i) => `'#${c.domId}-k${i}'`).join(',')}], { autoAlpha: 0 }, 0);`);
  for (const sw of c.switches) {
    const others = [0, 1, 2, 3].filter((i) => i !== sw.k);
    out.push(`    sub.set([${others.map((i) => `'#${c.domId}-k${i}'`).join(',')}], { autoAlpha: 0 }, ${sw.at});`);
    out.push(`    sub.set('#${c.domId}-k${sw.k}', { autoAlpha: 1 }, ${sw.at});`);
  }
  // 一輪結尾補一組「重置回第一幀」，讓子 timeline 長度剛好等於 cycle、repeat 能無縫接續。
  // 不可用 sub.set({}, {}, cycle) 這種空目標補長度——會讓整條子 timeline 失效、角色完全不出現。
  const first = c.switches[0].k;
  const rest = [0, 1, 2, 3].filter((i) => i !== first);
  out.push(`    sub.set([${rest.map((i) => `'#${c.domId}-k${i}'`).join(',')}], { autoAlpha: 0 }, ${c.cycle});`);
  out.push(`    sub.set('#${c.domId}-k${first}', { autoAlpha: 1 }, ${c.cycle});`);
  out.push(`    tl.add(sub, ${c.start.toFixed(2)});`);
  out.push(`  }`);
  return out.join('\n');
}).join('\n');

const customAll = SEGS.map(customJS).filter(Boolean).join('\n');

// 音效不掛成獨立的 <audio>：composition 每多一個長音訊元素就會載入逾時，
// 所以只輸出觸發時間，由 mk-audio-bed.py 事先混進背景音樂床。
// 一定要放在 customJS 跑完之後——點擊音效是在那裡登記的。
const cues = sfxHits
  .filter((h) => h.at >= 0 && h.at + SFX[h.kind].dur < TOTAL)
  .sort((a, b) => a.at - b.at)
  .map((h) => ({ file: SFX[h.kind].file, vol: SFX[h.kind].vol, at: h.at }));
writeFileSync(fileURLToPath(new URL('sfx-cues.json', import.meta.url)),
  JSON.stringify({ total: TOTAL, cues }, null, 2));

const CSS = `
      @font-face { font-family: "Yuanti TC"; src: local("Yuanti TC"); }
      @font-face { font-family: "PingFang TC"; src: local("PingFang TC"); }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: #000; }
      body { font-family: "Yuanti TC", "PingFang TC", sans-serif; }

      /* 教室綠板的可用範圍是 y 196~904（中心 550），版面對齊板心才不會整片偏上 */
      .vis { position: absolute; left: 50%; top: 230px; height: 640px; transform: translateX(-50%); display: flex;
             flex-direction: column; align-items: center; justify-content: center; width: 1120px; }
      .row { display: flex; align-items: center; justify-content: center; }
      .stack { display: flex; flex-direction: column; align-items: center; }

      .bubble { position: absolute; bottom: 400px; width: 540px; background: #fff; border: 7px solid; border-radius: 30px;
                padding: 26px 30px 22px; font-size: 38px; font-weight: 800; color: #333; line-height: 1.45; }
      .bubble-left { left: 44px; } .bubble-right { right: 44px; }
      .bubble-left::after, .bubble-right::after { content: ""; position: absolute; bottom: -26px; width: 0; height: 0;
                border-left: 18px solid transparent; border-right: 18px solid transparent; border-top: 28px solid #fff; }
      .bubble-left::after { left: 70px; } .bubble-right::after { right: 70px; }
      .bubble-name { position: absolute; top: -26px; left: 24px; color: #fff; font-size: 26px; font-weight: 900;
                padding: 4px 18px; border-radius: 999px; white-space: nowrap; }

      .bigtitle { font-size: 118px; font-weight: 900; color: #7A2E00; text-shadow: 0 6px 0 rgba(255,255,255,.5); }
      .kicker { font-size: 44px; font-weight: 900; color: #6B2000; }
      .keyword { font-size: 74px; font-weight: 900; color: #FFE066; text-shadow: 0 6px 0 rgba(0,0,0,.35); }
      .tagline { font-size: 42px; font-weight: 900; color: #fff; margin-top: 12px; text-shadow: 0 4px 0 rgba(0,0,0,.25); }
      .tagline.dark { color: #7A2E00; text-shadow: 0 4px 0 rgba(255,255,255,.5); }
      .quizq { background: #FFF3C4; color: #6B4A00; font-size: 46px; font-weight: 900; padding: 18px 40px;
               border-radius: 24px; box-shadow: 0 8px 0 rgba(0,0,0,.18); }
      .answer { position: relative; display: flex; align-items: center; gap: 16px; margin-top: 18px;
                background: #fff; color: #1E7A4F; font-size: 50px; font-weight: 900; padding: 14px 40px;
                border-radius: 22px; box-shadow: 0 8px 0 rgba(0,0,0,.18); }
      .qmark { font-size: 118px; font-weight: 900; color: #FF4D6D; text-shadow: 0 6px 0 rgba(0,0,0,.2); }
      .qmark.small { font-size: 84px; }
      .minicard { background: #fff; border-radius: 20px; padding: 14px 30px; font-size: 34px; font-weight: 900;
                  color: #444; box-shadow: 0 8px 0 rgba(0,0,0,.16); }
      .minicard.hot { background: #FFB703; color: #5A3600; }
      .eq { font-size: 62px; font-weight: 900; color: #fff; }
      /* 兩列版的「＝」：朝下的箭頭，比橫排的等號省寬度 */
      .eqdown { width: 0; height: 0; margin: 14px 0; border-left: 26px solid transparent;
                border-right: 26px solid transparent; border-top: 30px solid #FFE066; }
      .seccol { display: flex; flex-direction: column; align-items: center; }

      .goalgrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 22px; }
      .goalcard { width: 300px; height: 210px; background: #fff; border-radius: 26px; display: flex; flex-direction: column;
                  align-items: center; justify-content: center; gap: 14px; box-shadow: 0 10px 0 rgba(0,0,0,.16); }
      .goalnum { width: 84px; height: 84px; border-radius: 50%; background: #FFB703; color: #fff; font-size: 48px;
                 font-weight: 900; display: flex; align-items: center; justify-content: center; }
      .goaltxt { font-size: 36px; font-weight: 900; color: #444; }

      .optcard { width: 250px; height: 230px; background: #fff; border-radius: 24px; display: flex; flex-direction: column;
                 align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 0 rgba(0,0,0,.16);
                 color: #444; font-weight: 900; font-size: 36px; position: relative; }
      .optcard.wide { width: 330px; height: 210px; }
      .optlab { position: absolute; top: -18px; left: -14px; width: 60px; height: 60px; border-radius: 50%;
                background: #4C97FF; color: #fff; font-size: 34px; display: flex; align-items: center; justify-content: center; }
      .optsub { font-size: 28px; color: #888; }
      .tick { width: 34px; height: 20px; border-left: 8px solid #35C46B; border-bottom: 8px solid #35C46B;
              transform: rotate(-45deg); margin-top: -8px; }
      .cdring { width: 132px; height: 132px; border-radius: 50%; border: 12px solid #FFB703; background: rgba(255,255,255,.92);
                display: flex; align-items: center; justify-content: center; margin-top: 18px; }
      .cdnum { font-size: 62px; font-weight: 900; color: #6B4A00; }

      /* ===== 速度線：貓咪衝出去時的殘影 ===== */
      .runwrap { position: relative; display: flex; align-items: center; justify-content: center; height: 180px; }
      .speedlines { display: flex; flex-direction: column; gap: 12px; }
      .speedlines i { display: block; width: 92px; height: 8px; background: #fff; border-radius: 4px; opacity: .85; }
      .speedlines i:nth-of-type(2) { width: 130px; }
      .speedlines i:nth-of-type(3) { width: 74px; }
      .speedlines.dark i { background: #C1440E; opacity: .95; }
      .speedlines.big i { height: 10px; width: 120px; }
      .speedlines.big i:nth-of-type(2) { width: 168px; }
      .speedlines.big i:nth-of-type(4) { width: 96px; }

      /* ===== 收納箱＝變數 ===== */
      .crate { position: relative; width: 270px; height: 240px; background: #C68B4E; border-radius: 14px; display: flex;
               flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #fff;
               font-size: 34px; font-weight: 900; box-shadow: 0 10px 0 rgba(0,0,0,.2); }
      .crate.big { width: 340px; height: 280px; }
      .crate.small { width: 220px; height: 200px; }
      .cratelid { position: absolute; top: -18px; left: -10px; right: -10px; height: 34px; background: #A9713B; border-radius: 10px; }
      .cratename { background: #fff; color: #8A5A2B; font-size: 30px; padding: 4px 22px; border-radius: 999px; }
      .cratenum { font-size: 74px; font-weight: 900; color: #FFE066; }
      .cratenum.sm { font-size: 52px; }
      .cratenote { font-size: 26px; opacity: .92; }
      .messwrap { position: relative; width: 380px; height: 220px; }
      .toy { position: absolute; }
      /* 賽車：車身 + 車頂 + 車窗 + 輪子，不要只有一個紅色方塊 */
      .toy-car { width: 124px; height: 46px; left: 10px; top: 34px; border-radius: 10px 18px 8px 8px;
                  background: linear-gradient(180deg,#F0596A,#E63946 55%,#B5202D);
                  box-shadow: 0 4px 0 rgba(0,0,0,.22); }
      .toy-car::before { content: ""; position: absolute; left: 26px; top: -24px; width: 62px; height: 28px;
                  border-radius: 12px 14px 0 0; background: linear-gradient(180deg,#F0596A,#D62839);
                  box-shadow: inset 12px 6px 0 rgba(255,255,255,.55); }
      .toy-car::after { content: ""; position: absolute; left: 14px; bottom: -13px; width: 26px; height: 26px;
                  border-radius: 50%; background: #2B2B2B; box-shadow: 62px 0 0 #2B2B2B,
                  inset 0 0 0 7px #8A8A8A, 62px 0 0 7px #8A8A8A inset; }
      /* 書本：書背 + 書頁 + 一條書籤 */
      .toy-book { width: 98px; height: 74px; left: 196px; top: 30px; border-radius: 4px 8px 8px 4px;
                  background: linear-gradient(90deg,#1F7A6E 0 16px,#2A9D8F 16px);
                  box-shadow: 0 4px 0 rgba(0,0,0,.22); }
      .toy-book::before { content: ""; position: absolute; left: 22px; top: 6px; right: 6px; bottom: 6px;
                  background: repeating-linear-gradient(180deg,#fff 0 4px,#E7EFEE 4px 9px); border-radius: 2px; }
      .toy-book::after { content: ""; position: absolute; right: 22px; top: -4px; width: 12px; height: 34px;
                  background: #E9C46A; border-radius: 0 0 3px 3px; }
      /* 球：加高光與底部陰影，才不是一個橘色圓 */
      .toy-ball { width: 78px; height: 78px; left: 72px; top: 124px; border-radius: 50%;
                  background: radial-gradient(circle at 34% 30%,#FFD9A8,#F4A259 45%,#C97B32);
                  box-shadow: 0 5px 0 rgba(0,0,0,.2); }
      .toy-ball::after { content: ""; position: absolute; left: 16px; top: 14px; width: 20px; height: 13px;
                  border-radius: 50%; background: rgba(255,255,255,.75); transform: rotate(-22deg); }
      .toy.mini { position: static; transform: scale(.5); margin: -18px -12px; }

      /* ===== 生活裡的變數 ===== */
      .lifecard { width: 300px; height: 330px; background: #fff; border-radius: 26px; display: flex; flex-direction: column;
                  align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 0 rgba(0,0,0,.16); padding: 16px; }
      .lifetitle { font-size: 36px; font-weight: 900; color: #444; }
      .lifeval { font-size: 46px; font-weight: 900; color: #FF6B35; }
      .lifenote { font-size: 26px; font-weight: 800; color: #888; text-align: center; }
      .ico { width: 84px; height: 84px; position: relative; }
      .ico-age::before { content: ""; position: absolute; left: 10px; top: 26px; width: 64px; height: 44px;
                background: #F4A259; border-radius: 8px 8px 10px 10px; }
      .ico-age::after { content: ""; position: absolute; left: 22px; top: 8px; width: 12px; height: 24px;
                background: #E63946; border-radius: 6px; box-shadow: 18px 0 0 #E63946, 36px 0 0 #E63946; }
      .ico-people::before { content: ""; position: absolute; left: 14px; top: 12px; width: 26px; height: 26px;
                border-radius: 50%; background: #4C97FF; box-shadow: 30px 0 0 #7EC9F5; }
      .ico-people::after { content: ""; position: absolute; left: 8px; top: 44px; width: 38px; height: 30px;
                border-radius: 14px 14px 6px 6px; background: #4C97FF; box-shadow: 30px 0 0 #7EC9F5; }
      .ico-mood::before { content: ""; position: absolute; left: 10px; top: 10px; width: 64px; height: 64px;
                border-radius: 50%; background: #FFD166; }
      .ico-mood::after { content: ""; position: absolute; left: 26px; top: 30px; width: 10px; height: 10px;
                border-radius: 50%; background: #7A5200; box-shadow: 22px 0 0 #7A5200, 11px 22px 0 #7A5200; }

      /* ===== 桌上 vs 書架 ===== */
      .deskwrap, .shelfwrap { position: relative; width: 340px; display: flex; flex-direction: column;
                align-items: center; }
      .deskbooks { display: flex; gap: 14px; align-items: flex-end; height: 80px; }
      .deskbooks i { width: 54px; height: 68px; background: #2A9D8F; border-radius: 4px; }
      .deskbooks i:nth-of-type(2) { height: 54px; background: #E76F51; }
      .desktop { width: 300px; height: 22px; background: #C68B4E; border-radius: 6px; }
      .desklegs { width: 300px; display: flex; justify-content: space-between; }
      .desklegs i { width: 20px; height: 76px; background: #A9713B; border-radius: 0 0 4px 4px; }
      .shelfrow { width: 300px; height: 84px; background: #A9713B; border-radius: 6px; display: flex; align-items: flex-end;
                gap: 8px; padding: 0 12px 8px; margin-bottom: 8px; }
      .shelfrow i { width: 34px; height: 62px; background: #6D9DC5; border-radius: 3px; }
      .shelfrow i:nth-of-type(2n) { height: 54px; background: #E9C46A; }
      .shelfrow i:nth-of-type(3n) { height: 66px; background: #C77DFF; }
      .placetag { margin-top: 14px; background: #fff; color: #555; font-size: 30px; font-weight: 900;
                padding: 10px 22px; border-radius: 999px; box-shadow: 0 6px 0 rgba(0,0,0,.16); }
      .placetag.hot { background: #FFB703; color: #5A3600; }

      /* ===== 資料型態 ===== */
      .typegrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
      .typecard { width: 340px; height: 170px; border-radius: 24px; display: flex; flex-direction: column;
                align-items: center; justify-content: center; gap: 10px; box-shadow: 0 10px 0 rgba(0,0,0,.18); color: #fff; }
      .typecard.txt { background: #4C97FF; } .typecard.int { background: #FF8C1A; }
      .typecard.flt { background: #9966FF; } .typecard.bool { background: #35C46B; }
      .typename { font-size: 40px; font-weight: 900; }
      .typeval { font-size: 34px; font-weight: 800; background: rgba(255,255,255,.92); color: #333;
                padding: 6px 26px; border-radius: 999px; }

      /* ===== 是／不是 開關 ===== */
      .tfcard { width: 260px; height: 200px; background: #fff; border-radius: 24px; display: flex; flex-direction: column;
                align-items: center; justify-content: center; gap: 8px; box-shadow: 0 10px 0 rgba(0,0,0,.16); }
      .tfbig { font-size: 62px; font-weight: 900; }
      .tfcard.yes .tfbig { color: #35C46B; } .tfcard.no .tfbig { color: #E86A6A; }
      .tfen { font-size: 28px; font-weight: 900; color: #999; }
      .switch { width: 128px; height: 68px; border-radius: 999px; background: #fff; position: relative;
                box-shadow: inset 0 4px 0 rgba(0,0,0,.12); }
      .switch i { position: absolute; left: 8px; top: 8px; width: 52px; height: 52px; border-radius: 50%; background: #FFB703; }

      /* ===== 積木格 ===== */
      .blockgrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 22px 40px; }
      .blockcell { display: flex; flex-direction: column; align-items: center; gap: 10px; }
      .blockcell.wide { width: 700px; flex-direction: row; justify-content: flex-start; gap: 26px; }
      .blockcell.wide .blockcap { text-align: left; }
      .blockcap { font-size: 30px; font-weight: 900; color: #fff; text-shadow: 0 3px 0 rgba(0,0,0,.3); text-align: center; }
      .slotwrap { padding: 12px 16px; border: 5px dashed #FFE066; border-radius: 18px; }

      /* ===== 跑道：跑者繞著跑道跑，不是跑道在轉 ===== */
      .track { position: relative; width: 300px; height: 300px; border: 10px dashed #FFE066; border-radius: 50%;
               display: flex; align-items: center; justify-content: center; }
      .orbit { position: absolute; inset: 0; }
      .tracklab { font-size: 32px; font-weight: 900; color: #fff; text-align: center; line-height: 1.4; }

      /* ===== 舞台 ===== */
      .stagebox { padding: 12px; background: #fff; border-radius: 22px; box-shadow: 0 10px 0 rgba(0,0,0,.16); }
      .stageinner { position: relative; width: 700px; height: 380px; border-radius: 14px; overflow: hidden; }
      .stagebox.small .stageinner { width: 480px; height: 300px; }
      .demovid { display: block; width: 620px; height: 516px; border-radius: 14px; object-fit: contain; background: #d8e6f5; }
      .demovid.inner { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: 0; }
      .wallflash { position: absolute; top: 0; bottom: 0; width: 22px; background: #FFE066; }
      .wallflash.left { left: 0; } .wallflash.right { right: 0; }

      /* ===== 實機操作截圖 ===== */
      /* 截圖只保留該步驟的重點區域，長寬比每張不同，
         所以卡片固定大小、圖片一律 contain 置中，不要 cover（會把重點裁掉） */
      .demowrap { position: relative; width: 920px; height: 570px; background: #fff; border-radius: 16px;
                  box-shadow: 0 14px 34px rgba(0,0,0,.32); overflow: hidden; }
      .demolayer { position: absolute; inset: 0; }
      .demoshot { position: absolute; left: 0; right: 0; top: 0; bottom: 62px;
                  background-size: contain; background-position: center;
                  background-repeat: no-repeat; }
      .demoshot.pending { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
                  background: repeating-linear-gradient(45deg,#F1F4F8 0 26px,#E4EAF2 26px 52px); }
      .demoshot.pending span { font-size: 46px; font-weight: 900; color: #7C8CA0; }
      .demoshot.pending b { font-size: 28px; font-weight: 800; color: #A6B3C4; }
      .democap { position: absolute; left: 0; right: 0; bottom: 0; height: 62px; background: #2B3648; color: #fff;
                  font-size: 30px; font-weight: 900; text-align: center; display: flex;
                  align-items: center; justify-content: center; }

      /* ===== 上台 ===== */
      .spotlight { position: relative; width: 460px; height: 250px; background: radial-gradient(ellipse at 50% 0%,
                  rgba(255,255,255,.85), rgba(255,255,255,0) 70%); display: flex; align-items: flex-end; justify-content: center; }
      .podium { position: relative; width: 230px; height: 96px; border-radius: 12px 12px 0 0;
                  background: linear-gradient(180deg,#A1785F,#8D6E63 40%,#6D4C41); box-shadow: 0 10px 0 rgba(0,0,0,.22); }
      .podium::before { content: ""; position: absolute; left: 14px; right: 14px; top: 18px; height: 6px;
                  background: rgba(255,255,255,.22); border-radius: 3px; box-shadow: 0 22px 0 rgba(255,255,255,.14); }
      .figwrap { position: relative; width: 260px; height: 340px; display: flex; align-items: center; justify-content: center; }
      .fig { position: relative; width: 160px; height: 300px; }
      .fig .head { position: absolute; left: 50%; top: 0; margin-left: -34px; width: 68px; height: 68px;
                  border-radius: 50%; background: #FFD9A0; }
      .fig .body { position: absolute; left: 50%; top: 74px; margin-left: -40px; width: 80px; height: 120px;
                  border-radius: 20px; background: #4C97FF; }
      .fig .arm { position: absolute; top: 84px; width: 20px; height: 100px; border-radius: 10px; background: #3B7FE0; }
      .fig .arm.l { left: 24px; } .fig .arm.r { right: 24px; }
      .fig .head::after { content: ""; position: absolute; left: -4px; top: -6px; width: 76px; height: 38px;
                  border-radius: 38px 38px 0 0; background: #5A3A22; }
      .fig .body::before { content: ""; position: absolute; left: 50%; top: -12px; margin-left: -16px;
                  width: 32px; height: 16px; background: #FFD9A0; border-radius: 0 0 8px 8px; }
      .fig .leg { position: absolute; top: 194px; width: 26px; height: 96px; border-radius: 12px 12px 0 0; background: #37474F; }
      .fig .leg.l { left: 42px; } .fig .leg.r { right: 42px; }
      .fig .leg::after { content: ""; position: absolute; left: -8px; bottom: -14px; width: 46px; height: 18px;
                  border-radius: 10px 14px 6px 6px; background: #263238; }
      .fig .arm::after { content: ""; position: absolute; left: -3px; bottom: -12px; width: 26px; height: 26px;
                  border-radius: 50%; background: #FFD9A0; }
      .widthbar { position: absolute; bottom: 6px; width: 130px; height: 10px; background: #FF4D6D; border-radius: 5px; }
      .steprow { display: flex; align-items: center; gap: 16px; background: #fff; border-radius: 18px; padding: 12px 28px;
                  font-size: 34px; font-weight: 900; color: #444; box-shadow: 0 8px 0 rgba(0,0,0,.16); width: 460px; }
      .stepnum { width: 48px; height: 48px; border-radius: 50%; background: #FFB703; color: #fff; font-size: 28px;
                  display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }
      .audrow { display: flex; align-items: center; gap: 20px; background: #fff; border-radius: 20px; padding: 16px 30px;
                  box-shadow: 0 8px 0 rgba(0,0,0,.16); width: 620px; }
      .audtag { background: #4C97FF; color: #fff; font-size: 28px; font-weight: 900; padding: 6px 20px; border-radius: 999px; }
      .audtxt { font-size: 36px; font-weight: 900; color: #444; }
      .claprow { display: flex; gap: 22px; margin-top: 22px; }
      .claprow i { width: 40px; height: 40px; border-radius: 50%; background: #FFE066; box-shadow: 0 5px 0 rgba(0,0,0,.18); }

      .seclabel { display: flex; align-items: center; gap: 18px; background: #fff; border-radius: 20px; padding: 16px 32px;
                  font-size: 36px; font-weight: 900; color: #444; box-shadow: 0 8px 0 rgba(0,0,0,.16); width: 380px; }
      .secnum { width: 52px; height: 52px; border-radius: 50%; color: #fff; font-size: 30px; flex: 0 0 auto;
                  display: flex; align-items: center; justify-content: center; }
      .s-a .secnum { background: #4C97FF; } .s-b .secnum { background: #FF8C1A; } .s-c .secnum { background: #9966FF; }

      .plus { width: 46px; height: 46px; position: relative; }
      .plus::before, .plus::after { content: ""; position: absolute; background: #fff; border-radius: 4px; }
      .plus::before { left: 50%; top: 0; width: 10px; height: 100%; margin-left: -5px; }
      .plus::after { top: 50%; left: 0; height: 10px; width: 100%; margin-top: -5px; }
      .plus.dark::before, .plus.dark::after { background: #fff; }
      .ifarrow { width: 0; height: 0; border-left: 14px solid transparent; border-right: 14px solid transparent;
                 border-top: 20px solid #FFB703; }
      /* border-left 產生的三角形朝右，用來當「→」 */
      .ifarrow.side { border-top: 14px solid transparent; border-bottom: 14px solid transparent;
                 border-left: 20px solid #FFB703; border-right: none; }

      .codecard { position: relative; background: #fff; border-radius: 20px; padding: 16px 22px;
                  box-shadow: 0 10px 0 rgba(0,0,0,.18); display: flex; flex-direction: column;
                  align-items: center; justify-content: flex-start; }
      .codelabel { font-size: 32px; font-weight: 900; color: #2F6FD0; margin-bottom: 8px; }
      /* 真實介面截圖的白底卡 */
      .shotcard { position: relative; background: #fff; border-radius: 20px; padding: 16px;
                  box-shadow: 0 10px 0 rgba(0,0,0,.18); }
      /* 積木截圖本身就有形狀與顏色，套白卡反而多一圈礙眼的白框 */
      .shotcard.sm { background: none; padding: 0; box-shadow: none;
                  filter: drop-shadow(0 8px 10px rgba(0,0,0,.32)); }
      /* 積木堆疊區的插槽框，放大後的橢圓要塞得下 */
      .slotwrap { padding: 14px 20px; }

      /* ===== 章節大圖卡 ===== */
      .chapcard { display: flex; align-items: center; gap: 52px; background: #fff; border-radius: 48px;
                  padding: 56px 92px; box-shadow: 0 18px 0 rgba(0,0,0,.18); }
      .chapnum { width: 172px; height: 172px; border-radius: 46px; background: #FF6B35; color: #fff;
                 font-size: 110px; font-weight: 900; display: flex; align-items: center; justify-content: center;
                 box-shadow: 0 10px 0 rgba(0,0,0,.16); }
      .chaptxt { font-size: 92px; font-weight: 900; color: #7A2E00; white-space: nowrap; }
      .chapstripes { position: absolute; inset: 0; opacity: .18;
                 background: repeating-linear-gradient(115deg, #fff 0 46px, transparent 46px 120px); }

      /* ===== 紅框與指標箭頭：講到哪裡就框哪裡 ===== */
      .hl { position: absolute; border: 7px solid #FF2D20; border-radius: 16px;
            box-shadow: 0 0 0 5px rgba(255,45,32,.22), inset 0 0 0 3px rgba(255,255,255,.85); }
      .arrowwrap { position: absolute; width: 104px; height: 56px; }
      .arrow { position: relative; width: 104px; height: 56px; }
      .arrow i { position: absolute; right: 0; top: 50%; margin-top: -22px; width: 0; height: 0;
                 border-top: 22px solid transparent; border-bottom: 22px solid transparent;
                 border-left: 34px solid #FF2D20; filter: drop-shadow(0 3px 0 rgba(0,0,0,.2)); }
      .arrow b { position: absolute; left: 0; top: 50%; margin-top: -8px; width: 74px; height: 16px;
                 background: #FF2D20; border-radius: 8px; }

      .deco { position: absolute; border-radius: 50%; opacity: .5; }
      .d1 { width: 90px; height: 90px; left: 80px; top: 80px; background: #FF6B6B; }
      .d2 { width: 60px; height: 60px; right: 120px; top: 120px; background: #4ECDC4; }
      .d3 { width: 46px; height: 46px; left: 180px; bottom: 160px; background: #5B8DEF; }
      .d4 { width: 74px; height: 74px; right: 190px; bottom: 200px; background: #FFB703; }
`;

const html = `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"><\/script>
    <style>${CSS}</style>
  </head>
  <body>
    <div
      id="root"
      data-composition-id="2A4-grade1-3"
      data-start="0"
      data-duration="${TOTAL}"
      data-width="1920"
      data-height="1080"
      style="position: relative; width: 1920px; height: 1080px; background: #1E7A4F"
    >
      <video id="intro" class="clip" data-start="0" data-duration="${INTRO}" data-track-index="0" data-has-audio="true"
        src="assets/opening.mp4" style="position:absolute;inset:0;width:1920px;height:1080px;object-fit:cover"></video>
${clips}
      <audio id="bgm" class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="8"
        src="${CFG.bgm}" data-volume="0.68"></audio>
      <img id="codepro-watermark" class="clip" data-start="0" data-duration="${TOTAL}" data-track-index="9"
        src="assets/codepro_logo_white.webp"
        style="position: absolute; right: 40px; bottom: 40px; width: 160px; height: 50px; opacity: 0.85; z-index: 999" />
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
${shotJS}
${bubbleJS}
${markJS}
      document.querySelectorAll('[data-fx]').forEach((el) => {
        const seg = el.closest('.clip');
        const at = parseFloat(seg.dataset.start) + parseFloat(el.dataset.at);
        const type = el.dataset.fx;
        if (type === 'pop') tl.fromTo(el, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(2)' }, at);
        else if (type === 'stamp') tl.fromTo(el, { autoAlpha: 0, scale: 2.6 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'power4.in' }, at);
        else if (type === 'rise') tl.fromTo(el, { autoAlpha: 0, y: 46 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power2.out' }, at);
        else if (type === 'flip') tl.fromTo(el, { autoAlpha: 0, rotationY: 90 }, { autoAlpha: 1, rotationY: 0, duration: 0.55, ease: 'back.out(1.6)' }, at);
        else if (type === 'float') { tl.fromTo(el, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'back.out(2)' }, at); tl.to(el, { y: -18, duration: 0.9, yoyo: true, repeat: 3, ease: 'sine.inOut' }, at + 0.7); }
        else if (type === 'twinkle') { tl.fromTo(el, { autoAlpha: 0, scale: 0.2, rotation: -30 }, { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)' }, at); tl.to(el, { rotation: 18, duration: 0.5, yoyo: true, repeat: 3 }, at + 0.6); }
        else if (type === 'qmark') { tl.fromTo(el, { autoAlpha: 0, y: 60, scale: 0.4 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(2)' }, at); tl.to(el, { y: -14, duration: 0.6, yoyo: true, repeat: 3, ease: 'sine.inOut' }, at + 0.7); }
        else if (type === 'countdown' || type === 'countdown4') {
          const n = type === 'countdown' ? 5 : 4;
          const num = el.querySelector('.cdnum');
          tl.fromTo(el, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, at);
          for (let i = 0; i < n; i++) {
            tl.set(num, { innerText: String(n - i) }, at + 0.4 + i);
            tl.fromTo(num, { scale: 1.5 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, at + 0.4 + i);
          }
          tl.to(el, { autoAlpha: 0, duration: 0.3 }, at + 0.4 + n);
          tl.set(el, { autoAlpha: 0 }, at + 0.8 + n);
        }
      });
${charJS}
${customAll}
      // 背景音樂：片頭原音期間壓低，之後回到墊底音量，結尾淡出
      tl.set('#bgm', { volume: 0.22 }, 0);
      tl.to('#bgm', { volume: 0.68, duration: 1.5 }, ${INTRO} - 0.5);
      tl.to('#bgm', { volume: 0, duration: 4 }, ${TOTAL} - 4.5);
      window.__timelines['2A4-grade1-3'] = tl;
    <\/script>
  </body>
</html>
`;

writeFileSync(process.argv[2], html);
if (badActions.length) {
  // 不存在的角色動作會讓那一格畫面開天窗，一定要當成錯誤擋下來
  console.error('無效的角色動作：', [...new Set(badActions)].join('、'));
  process.exitCode = 1;
}
const mm = Math.floor(TOTAL / 60), ss = Math.round(TOTAL % 60);
console.log(`總長 ${TOTAL}s（${mm} 分 ${ss} 秒）／ ${SEGS.length} 段 ／ ${bubbles.length} 句對白 ／ ${marks.length} 個紅框 ／ ${cues.length} 顆音效`);
if (missingShots.length) {
  console.log(`\n⚠ 尚未拍攝的操作截圖 ${missingShots.length} 張（畫面先用「待補」卡）：`);
  console.log('  ' + missingShots.join('\n  '));
}
