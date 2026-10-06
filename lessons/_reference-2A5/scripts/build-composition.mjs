// 由 script-data.mjs 產生 HyperFrames composition
// 用法：node build-composition.mjs <輸出的 index.html 路徑>
//
// 規則備忘（踩過的坑）：
// - clip 內的圖片一律用 div + background-image，用 <img> 會被框架媒體探索接管而不渲染
// - 角色 clip 必須排在全屏段落 clip 之後，否則被背景蓋掉（堆疊看 DOM 順序）
// - 時間一律先 r2 再輸出，否則 toFixed 捨入會讓同軌 clip 重疊
// - 畫面完全不使用 emoji：Scratch 素材 + CSS 繪製
import { writeFileSync, readFileSync } from 'node:fs';
import { SEGS, voiceId } from './script-data.mjs';
// 路徑（語音、音樂床）的單一事實來源：course.json，共用腳本也讀同一份
const CFG = JSON.parse(readFileSync(new URL('course.json', import.meta.url), 'utf-8'));
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// 角色配音（Gemini TTS）。有配音的角色用實際語音長度排時間，沒有的維持字數估算。
const VOICE_DIR = CFG.voiceDir;
const voiceDur = {};
for (const who of ['Cooper', 'Max', 'Cora']) {
  const f = fileURLToPath(new URL(`voice-durations-${who}.json`, import.meta.url));
  if (existsSync(f)) voiceDur[who] = JSON.parse(readFileSync(f, 'utf-8'));
}

// ===== 節奏參數（調這裡控制總長）=====
// 有配音的句子一律用實際語音長度排時間，只留極短的尾巴，
// 對話才會像「A 講完 B 馬上接」，不會每句之間都掉下去。
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
const bg = (file) => `assets/scratch背景素材/${file}`;
const blk = (p) => `assets/scratch-blocks/${p}.svg`;

const SPRITE = {
  cat: sp('043_Cat_2', '01_cat_2.svg'),
  mouseA: sp('162_Mouse1', '01_mouse1-a.svg'),
  tree: sp('232_Trees', '01_trees-a.svg'),
  bread: sp('029_Bread', '01_bread.svg'),
  bell: sp('025_Bell', '01_bell1.svg'),
  star: 'assets/doodles/star.svg',
  flag: sp('114_Green_Flag', '01_green_flag.svg'),
  stop: sp('219_Stop', '01_stop.svg'),
  balloon: sp('015_Balloon1', '01_balloon1-a.svg'),
  gift: sp('107_Gift', '01_gift-a.svg'),
};
const BACKDROP = { woods: bg('082_Woods_And_Bench.png') };
// 教案 PPT 內的原始 Scratch 程式截圖 —— 學生要照著排的最終程式，一定要放出來
const CODE = {
  mouseShow: ['assets/code/code_mouse_show.png', 402, 596],
  mouseGoto: ['assets/code/code_mouse_goto.png', 402, 662],
  catChase: ['assets/code/code_cat_chase.png', 450, 510],
  catSpin: ['assets/code/code_cat_spin.png', 450, 684],
  score: ['assets/code/code_score.png', 510, 564],
  pickSprite: 'assets/code/pick_sprite1.png',
  pickMouse: 'assets/code/pick_mouse1.png',
  pickBackdrop: 'assets/code/pick_backdrop.png',
  stageResult: 'assets/code/stage_result.png',
};
// 教案投影片裡的真實 Scratch 介面／積木截圖（英文版）。
// 講到工具介面時一律用這些，不要用自己畫的示意圖——學生照著操作才不會困惑。
const UI = {
  stageControls: ['assets/code/ui_stage_controls.png', 984, 820],
  ifElse: ['assets/code/ui_if_else.png', 318, 322],
  gotoMouse: ['assets/code/ui_goto_mouse.png', 429, 116],
  touching: ['assets/code/ui_touching.png', 453, 84],
  pointTowards: ['assets/code/ui_point_towards.png', 556, 116],
  turn15: ['assets/code/ui_turn15.png', 390, 116],
  controlsBar: ['assets/code/ui_controls_bar.png', 190, 52],
  editor: ['assets/Scratch編輯器介面.png', 3022, 1606],
};
// 真實截圖以「指定高度」放置，寬度由原始比例換算
const shot = ([src, iw, ih], h, attrs = '', style = '') =>
  `<div ${attrs} style="width:${Math.round(h * (iw / ih))}px;height:${h}px;background:url('${src}') center/contain no-repeat;${style}"></div>`;// 紅框：講到哪一塊積木就把它框起來。box 是相對於容器的百分比 [x, y, w, h]。
// at / until 是相對於段落起點的秒數，容器要自己是 position:relative。
// 依台詞內容找句子。用 L[3] 這種索引綁定，只要講稿中間插一句話，
// 後面每個紅框都會對錯句子（踩過這個坑：加了互動句之後計分那頁全錯行）。
const say = (L, kw) => {
  const ln = L.find((l) => l.text.includes(kw));
  if (!ln) throw new Error(`紅框對不到台詞：「${kw}」`);
  return ln;
};

// 實機操作截圖：一段裡依台詞依序切換畫面，切換時交叉淡入
const shotFades = [];

const marks = [];
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
  const pos = arrow === 'left'
    ? `left:${x}%;top:${y + h / 2}%;transform:translate(-106%,-50%)`
    : `left:${x + w}%;top:${y + h / 2}%;transform:translate(6%,-50%) scaleX(-1)`;
  return box + `<div id="${aid}" class="arrowwrap" style="${pos}"><div class="arrow"><i></i><b></b></div></div>`;
};

// 程式碼截圖卡：白底、圓角、陰影，讓積木在綠板上清楚可讀
// hls = 要疊在截圖上的紅框（用 hl() 產生的 HTML 字串）
const codeCard = ([src, iw, ih], h, attrs = '', label = '', hls = '') => {
  const w = Math.round(h * (iw / ih));
  return `<div ${attrs} class="codecard" style="width:${w + 44}px;height:${h + (label ? 58 : 0) + 32}px">
     ${label ? `<span class="codelabel">${label}</span>` : ''}
     <div style="position:relative;width:${w}px;height:${h}px;background:url('${src}') center/contain no-repeat">${hls}</div>
   </div>`;
};

// ===== 小工具 =====
// 每個進場動畫配一顆音效。fx() 在產生 HTML 的同時把絕對時間記下來，
// 稍後統一產生 <audio> clip（瀏覽器端的 data-fx 掃描拿不到建構期的時間）。
const SFX = {
  pop:      { file: 'pop',      dur: 0.16, vol: 0.30 },
  swoosh:   { file: 'swoosh',   dur: 0.34, vol: 0.22 },
  ding:     { file: 'ding',     dur: 0.85, vol: 0.28 },
  tick:     { file: 'tick',     dur: 0.10, vol: 0.18 },
  magic:    { file: 'magic',    dur: 0.70, vol: 0.26 },
  question: { file: 'question', dur: 0.45, vol: 0.30 },
  click:    { file: 'click',    dur: 0.12, vol: 0.34 },
};
const FX_SFX = { pop: 'pop', flip: 'pop', stamp: 'ding', rise: 'swoosh', float: 'magic', twinkle: 'magic', qmark: 'question' };
const sfxHits = [];
let CUR = null;  // 目前正在產生的段落，fx() 靠它換算絕對時間
const hit = (kind, at) => sfxHits.push({ kind, at: r2(CUR.start + at) });
// 客製動畫（customJS）是在段落組裝之後才跑的，那時 CUR 已經沒有意義，
// 所以那邊的音效一律用絕對時間登記
const hitAbs = (kind, at) => sfxHits.push({ kind, at: r2(at) });
const fx = (type, at, extra = '') => {
  if (CUR) {
    if (FX_SFX[type]) hit(FX_SFX[type], at);
    else if (type === 'countdown' || type === 'countdown4') {
      // 倒數每秒一聲滴答，數完補一聲鈴
      const n = type === 'countdown' ? 5 : 4;
      for (let i = 0; i < n; i++) hit('tick', at + 0.4 + i);
      hit('ding', at + 0.4 + n);
    }
  }
  return `data-fx="${type}" data-at="${at.toFixed(2)}" ${extra}`;
};
// ===== 游標 =====
// 三種狀態畫在同一個容器：箭頭（預設）、張開手掌（可以抓了）、握住（拖曳中）。
// 尺寸 92px 是刻意放大的——實際大小的游標在影片裡根本看不見。
const CURSOR_PATHS = {
  arrow: 'M5.04 3.36 L5.04 20.2 L9.5 16.0 L12.3 22.2 L15.1 20.9 L12.3 14.8 L18.6 14.8 Z',
  open: 'M7.6 16.9 C6.5 16.0 5.2 15.0 5.7 13.9 C6.1 13.1 7.2 13.4 7.9 14.4 L8.2 14.9 L8.2 7.1 '
      + 'A1.1 1.1 0 0 1 10.4 7.1 L10.4 11.4 L10.7 11.0 L10.7 6.1 A1.1 1.1 0 0 1 12.9 6.1 L12.9 11.6 '
      + 'L13.2 11.2 L13.2 6.7 A1.1 1.1 0 0 1 15.4 6.7 L15.4 12.0 L15.7 11.6 L15.7 8.3 '
      + 'A1.05 1.05 0 0 1 17.8 8.3 L17.8 14.6 C17.8 18.0 15.5 20.6 12.4 20.6 C9.5 20.6 7.6 18.6 7.6 16.9 Z',
  grab: 'M7.4 17.0 C6.3 16.2 5.1 15.3 5.6 14.2 C6.0 13.5 7.0 13.7 7.7 14.6 L7.9 14.9 L7.9 10.6 '
      + 'A1.1 1.1 0 0 1 10.1 10.6 L10.1 12.4 L10.4 12.1 L10.4 9.5 A1.1 1.1 0 0 1 12.6 9.5 L12.6 12.5 '
      + 'L12.9 12.2 L12.9 9.8 A1.1 1.1 0 0 1 15.1 9.8 L15.1 12.8 L15.4 12.5 L15.4 10.6 '
      + 'A1.05 1.05 0 0 1 17.5 10.6 L17.5 14.8 C17.5 18.2 15.2 20.7 12.2 20.7 C9.3 20.7 7.4 18.7 7.4 17.0 Z',
};
const cursor = (id, style = '') => {
  const svg = (cls, d, sw) => `<svg class="${cls}" viewBox="0 0 24 24"><path d="${d}" fill="#fff"`
    + ` stroke="#1c1c1c" stroke-width="${sw}" stroke-linejoin="round"/></svg>`;
  return `<div id="${id}-ring" class="clickring" style="${style}"><i></i></div>
    <div id="${id}" class="cursor" style="${style}">
      ${svg('c-arrow', CURSOR_PATHS.arrow, 1.15)}
      ${svg('c-open', CURSOR_PATHS.open, 1.1)}
      ${svg('c-grab', CURSOR_PATHS.grab, 1.1)}
    </div>`;
};
// 點擊：不對稱的壓縮／回彈（1:2 才像真的按下去）＋ 漣漪，並記一顆點擊音效
const clickAt = (id, at) => {
  hitAbs('click', at);
  const t = (n) => r2(at + n).toFixed(2);
  return `
  tl.to('#${id}',{scale:0.84,duration:0.1,ease:'power2.in',transformOrigin:'21% 14%'},${t(0)});
  tl.to('#${id}',{scale:1,duration:0.22,ease:'power2.out',transformOrigin:'21% 14%'},${t(0.1)});
  tl.fromTo('#${id}-ring',{opacity:.85,scale:.35},{opacity:0,scale:1.5,duration:0.45,ease:'power2.out',transformOrigin:'21% 14%'},${t(0)});
  tl.set('#${id}-ring',{opacity:0},${t(0.5)});`;
};
// 切換游標形狀：'arrow' | 'open' | 'grab'
const cursorTo = (id, kind, at) => {
  const map = { arrow: '.c-arrow', open: '.c-open', grab: '.c-grab' };
  return Object.entries(map).map(([k, sel]) =>
    `  tl.to('#${id} ${sel}',{autoAlpha:${k === kind ? 1 : 0},duration:0.12},${at.toFixed(2)});`
  ).join('\n');
};

// Scratch 素材圖：用 div + background-image
const art = (src, w, h, style = '', attrs = '') =>
  `<div ${attrs} style="width:${w}px;height:${h}px;background:url('${src}') center/contain no-repeat;${style}"></div>`;
// 積木圖：每塊 SVG 的 viewBox 比例都不一樣（0.29~0.71），
// 所以尺寸一律從 viewBox 換算，全部共用同一個放大倍率，
// 積木上的字級才會一致，形狀也不會被壓扁。
const BLOCK_UNIT = 2.15;
const vbCache = {};
const viewBox = (p) => (vbCache[p] ??= readFileSync(new URL(`assets/scratch-blocks/${p}.svg`, PROJ), 'utf-8')
  .match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/)
  .slice(1)
  .map(Number));
// scale 只在版面塞不下時才調小（例如選項卡內、積木堆疊區）
const block = (path, scale = 1, attrs = '', style = '') => {
  const [w0, h0] = viewBox(path);
  const w = Math.round(w0 * BLOCK_UNIT * scale);
  const h = Math.round(h0 * BLOCK_UNIT * scale);
  return `<div ${attrs} style="width:${w}px;height:${h}px;background:url('${blk(path)}') center/contain no-repeat;${style}"></div>`;
};

// ===== 計算時間軸 =====
let t = INTRO;
for (const seg of SEGS) {
  seg.start = r2(t);
  let cur = LEAD;
  seg.L = seg.lines.map((ln, i) => {
    const key = voiceId(ln.text, ln);
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

// ===== 各段中央視覺 =====
const V = {
  // 章節大圖卡：從左邊滑進來、停一下、再滑出去，同時由 Cooper 唸出章名
  chapter: (L, seg) => `
    <div class="vis">
      <div id="${seg.id}-card" class="chapcard">
        <span class="chapnum">${seg.chapNo}</span>
        <span class="chaptxt">${seg.chapTitle}</span>
      </div>
    </div>`,

  title: (L) => `
    <div class="vis">
      <div ${fx('pop', 0.3)} class="kicker">2A5 常規系統課程</div>
      <div ${fx('stamp', L[4].rel + 0.3)} class="bigtitle">貓抓老鼠</div>
      <div class="row" style="margin-top:22px">
        ${art(SPRITE.cat, 150, 150, '', fx('pop', L[4].rel + 0.9))}
        <div ${fx('pop', L[4].rel + 1.1)} class="dashline"></div>
        ${art(SPRITE.mouseA, 110, 110, '', fx('pop', L[4].rel + 1.3))}
      </div>
      ${art(SPRITE.star, 90, 90, 'position:absolute;left:20px;top:-30px', fx('twinkle', L[5].rel))}
      ${art(SPRITE.star, 70, 70, 'position:absolute;right:40px;top:40px', fx('twinkle', L[5].rel + 0.3))}
    </div>`,

  goals: (L) => `
    <div class="vis">
      <div class="goalgrid">
        ${[['1', '認識積木'], ['2', '練習表達'], ['3', '專題製作'], ['4', '複習時間']].map(([n, s], i) =>
          `<div ${fx('flip', L[i + 1].rel)} class="goalcard"><span class="goalnum">${n}</span><span class="goaltxt">${s}</span></div>`
        ).join('')}
      </div>
    </div>`,

  chase: (L) => `
    <div class="vis">
      <div ${fx('pop', 0.3)} class="bigtitle" style="font-size:86px">Tom &amp; Jerry</div>
      <div class="stagebox" style="margin-top:22px">
        <div class="stageinner" style="background:url('${BACKDROP.woods}') center/cover no-repeat">
          ${art(SPRITE.mouseA, 150, 150, 'position:absolute;left:430px;bottom:80px', 'id="chase-mouse"')}
          ${art(SPRITE.cat, 200, 200, 'position:absolute;left:150px;bottom:64px', 'id="chase-cat"')}
        </div>
      </div>
    </div>`,

  ifIntro: (L) => `
    <div class="vis">
      <div ${fx('qmark', 0.5)} class="qmark">？</div>
      <div ${fx('stamp', L[3].rel + 0.3)} class="keyword">如果⋯⋯就⋯⋯</div>
      <div class="row" style="margin-top:22px;gap:40px">
        <div ${fx('pop', L[5].rel + 0.2)} class="pathcard"><span class="arrowhead left"></span>這條路</div>
        <div ${fx('pop', L[5].rel + 0.5)} class="pathcard"><span class="arrowhead right"></span>那條路</div>
      </div>
      ${block('control/control_if', 1, fx('rise', L[6].rel + 0.2), 'margin-top:22px')}
    </div>`,

  lifeIf: (L) => `
    <div class="vis">
      <div class="row" style="gap:30px">
        ${[[1, 'rain', '下雨', '帶雨傘'], [2, 'hungry', '肚子餓', '去吃飯'], [3, 'sleep', '在睡覺', '小小聲']].map(([i, cls, a, b]) =>
          `<div ${fx('rise', L[i].rel + 0.2)} class="ifcard">
             <div class="ico ico-${cls}"></div>
             <div class="ifa">如果 ${a}</div>
             <div class="ifarrow"></div>
             <div class="ifb">就 ${b}</div>
           </div>`).join('')}
      </div>
    </div>`,

  flow: (L) => `
    <div class="vis">
      <div ${fx('pop', L[1].rel + 0.2)} class="diamond"><span>早餐在桌上？</span></div>
      <div class="flowsplit">
        <div class="flowbranch">
          <div ${fx('pop', L[2].rel)} class="flowline"></div>
          <div ${fx('pop', L[3].rel)} class="yes">YES</div>
          <div ${fx('pop', L[3].rel + 0.3)} class="flowbox">
            ${art(SPRITE.bread, 78, 78)}<span>吃光光</span>
          </div>
        </div>
        <div class="flowbranch">
          <div ${fx('pop', L[4].rel)} class="flowline"></div>
          <div ${fx('pop', L[5].rel)} class="no">NO</div>
          <div ${fx('pop', L[5].rel + 0.3)} class="flowbox">
            <div class="ico ico-shop"></div><span>出去買</span>
          </div>
        </div>
      </div>
      <div ${fx('stamp', L[6].rel + 0.3)} class="tagline">這叫做「流程圖」</div>
    </div>`,

  quizLight: (L) => `
    <div class="vis">
      <div ${fx('pop', 0.3)} class="quizq">如果紅綠燈是紅燈，我就＿＿？</div>
      <div class="row" style="margin-top:22px;gap:50px;align-items:center">
        <div ${fx('pop', L[1].rel + 0.2)} class="trafficlight"><i class="on"></i><i></i><i></i></div>
        <div ${fx('countdown', L[2].rel + 0.4)} class="cdring"><span class="cdnum">5</span></div>
      </div>
      <div ${fx('stamp', L[3].rel + 0.3)} class="answer">停下來<span class="tick"></span></div>
    </div>`,

  scratchUI: (L) => `
    <div class="vis">
      <div class="shotcard" ${fx('rise', 0.3)}>
        ${shot(UI.editor, 520, '', 'border-radius:10px')}
        ${hl([4, 6, 16, 92], L[1].rel + 0.3, L[2].rel)}
        ${hl([20, 6, 47, 92], L[2].rel + 0.3, L[3].rel)}
        ${hl([67, 3, 29, 95], L[3].rel + 0.3, L[4].rel)}
      </div>
    </div>`,

  dragBlock: (L) => `
    <div class="vis">
      <div class="dragwrap">
        <div class="dragfrom">${block('motion/motion_movesteps', 1)}</div>
        <div id="drag-block" class="dragmoving">${block('motion/motion_movesteps', 1)}</div>
        ${cursor('drag-cursor')}
        <div class="dragto"><span>放這裡</span></div>
      </div>
      <div ${fx('pop', L[3].rel + 0.3)} class="tagline">積木會自己黏在一起</div>
    </div>`,

  greenFlag: (L) => `
    <div class="vis">
      <div class="shotcard">
        ${shot(UI.controlsBar, 104, '', 'border-radius:8px')}
        ${hl([4, 13, 23, 80], L[1].rel + 0.3, L[4].rel, 'left')}
        ${hl([71, 13, 25, 80], L[5].rel + 0.3, L[6].rel + 1.5, 'right')}
      </div>
      <div class="shotcard" style="margin-top:16px">${shot(UI.stageControls, 260, '', 'border-radius:10px')}</div>
      ${block('event/event_whenflagclicked', 0.9, fx('rise', L[3].rel + 0.2), 'margin-top:16px')}
    </div>`,

  quizFlag: (L) => `
    <div class="vis">
      <div ${fx('pop', 0.3)} class="quizq">想讓遊戲開始，要按哪一個？</div>
      <div class="row" style="margin-top:24px;gap:60px">
        <div ${fx('pop', L[1].rel)} class="optcard" id="opt-green"><span class="optlab">A</span>${art(SPRITE.flag, 90, 90)}</div>
        <div ${fx('pop', L[1].rel + 0.3)} class="optcard" id="opt-red"><span class="optlab">B</span>${art(SPRITE.stop, 90, 90)}</div>
      </div>
      <div ${fx('countdown', L[2].rel + 0.3)} class="cdring" style="margin-top:20px"><span class="cdnum">5</span></div>
    </div>`,

  stage: (L) => `
    <div class="vis">
      <div class="row" style="gap:22px">
        ${art(CODE.pickSprite, 250, 270, '', fx('pop', L[1].rel))}
        <div ${fx('pop', L[2].rel - 0.2)} class="plus"></div>
        ${art(CODE.pickMouse, 250, 270, '', fx('pop', L[2].rel))}
        <div ${fx('pop', L[3].rel - 0.2)} class="plus"></div>
        ${art(CODE.pickBackdrop, 270, 270, '', fx('pop', L[3].rel))}
      </div>
      <div ${fx('stamp', L[4].rel + 0.4)} class="tagline dark">舞台準備好了</div>
    </div>`,

  doorbell: (L) => `
    <div class="vis">
      <div class="doorwrap">
        <div class="door"><div id="door-panel" class="doorpanel"></div><div class="doorknob"></div></div>
        ${art(SPRITE.bell, 130, 130, 'position:absolute;right:120px;top:120px', 'id="bell"')}
        <div id="bell-ring" class="ringwave"></div>
      </div>
      <div ${fx('stamp', L[6].rel + 0.3)} class="keyword" style="font-size:60px;margin-top:16px">偵測</div>
    </div>`,

  mousedown: (L) => `
    <div class="vis">
      ${block('sensing/sensing_mousedown', 0.75, fx('rise', L[1].rel + 0.2))}
      <div class="shotcard sm" style="margin-top:12px" ${fx('rise', L[3].rel + 0.2)}>${shot(UI.ifElse, 240)}</div>
      <div class="row" style="margin-top:22px;gap:50px">
        <div ${fx('pop', L[4].rel + 0.2)} class="statecard">
          <div class="statebox">${art(SPRITE.mouseA, 80, 80)}</div><span>按下＝出現</span>
        </div>
        <div ${fx('pop', L[5].rel + 0.2)} class="statecard">
          <div class="statebox"><div class="ghost"></div></div><span>放開＝躲起來</span>
        </div>
      </div>
    </div>`,

  goto: (L) => `
    <div class="vis">
      <div class="shotcard sm">${shot(UI.gotoMouse, 120)}</div>
      <div class="playbox" style="margin-top:18px">
        ${cursor('goto-cursor')}
        ${art(SPRITE.mouseA, 120, 120, 'position:absolute;left:130px;top:140px', 'id="goto-mouse"')}
      </div>
    </div>`,

  quizGoto: (L) => `
    <div class="vis">
      <div ${fx('pop', 0.3)} class="quizq">把「移到滑鼠游標」拿掉會怎樣？</div>
      <div ${fx('countdown', L[2].rel + 0.3)} class="cdring" style="margin-top:18px"><span class="cdnum">5</span></div>
      <div class="row" style="margin-top:18px;gap:40px">
        <div ${fx('pop', L[4].rel + 0.3)} class="cmpcard ok"><span class="cmptag">有積木</span>${art(SPRITE.mouseA, 70, 70)}<span>跟著跑</span></div>
        <div ${fx('pop', L[4].rel + 0.6)} class="cmpcard bad"><span class="cmptag">沒積木</span>${art(SPRITE.mouseA, 70, 70)}<span>不會動</span></div>
      </div>
    </div>`,

  loopIntro: (L) => `
    <div class="vis">
      <div id="blockpile" class="blockpile">
        ${Array.from({ length: 7 }, (_, i) => `<div class="pilebar" style="width:${230 - i * 12}px"></div>`).join('')}
      </div>
      <div ${fx('stamp', L[5].rel + 0.2)} class="keyword">迴圈</div>
    </div>`,

  loopTrack: (L) => `
    <div class="vis">
      <div class="track">
        <div id="loop-orbit" class="orbit"><div class="runner"></div></div>
        <div class="trackarrow a1"></div><div class="trackarrow a2"></div>
      </div>
      <div ${fx('pop', L[2].rel + 0.3)} class="tagline">跑完一圈，再跑一圈</div>
      ${block('control/control_forever', 0.85, fx('rise', L[5].rel + 0.2), 'margin-top:14px')}
    </div>`,

  catChase: (L) => `
    <div class="vis">
      <div class="row" style="gap:34px;align-items:flex-start">
        <div class="stack">
          ${block('control/control_forever', 0.8, fx('rise', L[0].rel + 0.3))}
          <div class="stackin">
            <div class="shotcard sm" ${fx('rise', L[1].rel + 0.2)}>${shot(UI.pointTowards, 76)}</div>
            ${block('motion/motion_movesteps', 0.8, fx('rise', L[2].rel + 0.2))}
            ${block('looks/looks_nextcostume', 0.8, fx('rise', L[3].rel + 0.2))}
          </div>
        </div>
        <div class="stagebox small">
          <div class="stageinner" style="background:url('${BACKDROP.woods}') center/cover no-repeat">
            ${art(SPRITE.mouseA, 120, 120, 'position:absolute;right:76px;bottom:62px')}
            ${art(SPRITE.cat, 172, 172, 'position:absolute;left:30px;bottom:54px', 'id="cc-cat"')}
          </div>
        </div>
      </div>
    </div>`,

  speed: (L) => `
    <div class="vis">
      <div class="speedrow">
        <span class="speedlab">走幾步</span>
        <div id="speed-num" class="speednum">2</div>
      </div>
      <div class="speedtrack">
        ${art(SPRITE.cat, 100, 100, 'position:absolute;left:0;bottom:0', 'id="speed-cat"')}
        <div id="speed-lines" class="speedlines"><i></i><i></i><i></i></div>
      </div>
      <div class="row" style="gap:40px;margin-top:10px">
        <div ${fx('pop', L[1].rel + 0.3)} class="minicard">數字大＝快</div>
        <div ${fx('pop', L[2].rel + 0.3)} class="minicard">數字小＝慢</div>
      </div>
    </div>`,

  spin: (L) => `
    <div class="vis">
      <div id="think-cloud" class="thoughtcloud"><span>Z z z</span><i></i><i></i></div>
      ${art(SPRITE.cat, 150, 150, 'margin-top:8px', 'id="spin-cat"')}
      ${block('control/control_repeat_until', 0.85, fx('rise', L[3].rel + 0.2), 'margin-top:14px')}
      <div class="shotcard sm" style="margin-top:10px" ${fx('rise', L[4].rel + 0.2)}>${shot(UI.turn15, 88)}</div>
      <div ${fx('stamp', L[5].rel + 0.3)} class="tagline">按下！衝啊</div>
    </div>`,

  quizLoop: (L) => `
    <div class="vis">
      <div ${fx('pop', 0.3)} class="quizq">要一直追老鼠，用哪一塊？</div>
      <div class="row" style="margin-top:20px;gap:44px;align-items:stretch">
        <div ${fx('pop', L[2].rel)} class="optcard wide" id="opt-a"><span class="optlab">A</span>${block('control/control_wait', 0.7)}</div>
        <div ${fx('pop', L[2].rel + 0.3)} class="optcard wide" id="opt-b"><span class="optlab">B</span>${block('control/control_forever', 0.7)}</div>
      </div>
      <div ${fx('countdown', L[2].rel + 0.8)} class="cdring" style="margin-top:16px"><span class="cdnum">5</span></div>
    </div>`,

  toysMess: (L) => `
    <div class="vis">
      <div class="messwrap">
        <div class="toy toy-car"></div><div class="toy toy-book"></div><div class="toy toy-ball"></div>
        <div class="toy toy-car t2"></div><div class="toy toy-book t2"></div><div class="toy toy-ball t2"></div>
      </div>
      <div ${fx('qmark', L[3].rel + 0.3)} class="qmark" style="font-size:104px">？</div>
    </div>`,

  toyBox: (L) => `
    <div class="vis">
      <div class="row" style="gap:44px">
        <div ${fx('pop', L[0].rel + 0.2)} class="crate"><div class="cratelid"></div><div class="toy toy-car mini"></div><span>賽車箱</span></div>
        <div ${fx('pop', L[1].rel + 0.2)} class="crate"><div class="cratelid"></div><div class="toy toy-book mini"></div><span>書箱</span></div>
        <div ${fx('stamp', L[3].rel + 0.4)} class="crate score"><div class="cratelid"></div><div class="cratenum">0</div><span>score 箱</span></div>
      </div>
      <div ${fx('pop', L[4].rel + 0.3)} class="tagline">變數＝幫電腦存東西的箱子</div>
    </div>`,

  makeVar: (L) => `
    <div class="vis">
      <div class="crate score big"><div class="cratelid"></div><div class="cratenum" id="mv-num">0</div><span>score</span></div>
      ${block('data/data_setvariableto', 1, fx('rise', L[3].rel + 0.2), 'margin-top:26px')}
      <div ${fx('pop', L[3].rel + 0.7)} class="tagline">一開始是零分</div>
    </div>`,

  addScore: (L) => `
    <div class="vis">
      <div class="stagebox small">
        <div class="stageinner" style="background:url('${BACKDROP.woods}') center/cover no-repeat">
          <div class="scoreboard"><span>score</span><b id="as-num">0</b></div>
          ${art(SPRITE.mouseA, 120, 120, 'position:absolute;right:86px;bottom:62px', 'id="as-mouse"')}
          ${art(SPRITE.cat, 172, 172, 'position:absolute;left:40px;bottom:54px', 'id="as-cat"')}
        </div>
      </div>
      <div class="row" style="gap:16px;margin-top:16px">
        <div class="shotcard sm" ${fx('rise', L[0].rel + 0.3)}>${shot(UI.touching, 80)}</div>
        ${block('data/data_changevariableby', 1, fx('rise', L[1].rel + 0.2))}
      </div>
    </div>`,

  quizVar: (L) => `
    <div class="vis">
      <div ${fx('pop', 0.3)} class="quizq">變數 score 是用來裝什麼的？</div>
      <div class="row" style="margin-top:22px;gap:50px">
        <div ${fx('pop', L[2].rel)} class="optcard" id="qv-a"><span class="optlab">A</span><div class="cratenum sm">20</div><span>分數</span></div>
        <div ${fx('pop', L[2].rel + 0.3)} class="optcard" id="qv-b"><span class="optlab">B</span>${art(SPRITE.cat, 72, 72)}<span>貓咪</span></div>
      </div>
      <div ${fx('countdown', L[2].rel + 0.7)} class="cdring" style="margin-top:16px"><span class="cdnum">5</span></div>
    </div>`,

  // 開課前先看完成品，學生才知道自己要做出什麼
  demoVideo: (L, seg) => `
    <div class="vis">
      <div class="shotcard">
        <video id="${seg.id}-vid" class="clip" data-start="${r2(seg.start + L[1].rel).toFixed(2)}"
          data-duration="8.53" data-track-index="2" src="assets/demo-game.mp4" muted
          style="display:block;width:600px;height:500px;object-fit:cover;border-radius:10px"></video>
      </div>
    </div>`,

  demo: (L) => `
    <div class="vis">
      <div class="stagebox">
        <div class="stageinner" style="background:#F0D5D5 url('${CODE.stageResult}') center/contain no-repeat">
          <div class="scoreboard"><span>score</span><b id="dm-num">0</b></div>
        </div>
      </div>
      <div ${fx('stamp', L[3].rel + 0.3)} class="tagline dark">完成！</div>
    </div>`,

  stageFright: (L) => `
    <div class="vis">
      <div class="spotlight"><div class="podium"></div></div>
      <div ${fx('pop', L[2].rel + 0.2)} class="heartline"><span class="hb"></span><span class="hb"></span><span class="hb"></span></div>
      <div ${fx('pop', L[4].rel + 0.3)} class="tagline">會緊張是正常的</div>
    </div>`,

  breath: (L) => `
    <div class="vis">
      <div id="breath-circle" class="breathcircle"><span id="breath-label">呼吸</span></div>
      <div class="row" style="gap:26px;margin-top:26px">
        <div ${fx('pop', L[1].rel + 0.2)} class="btag">吸氣 4 秒</div>
        <div ${fx('pop', L[1].rel + 0.5)} class="btag">憋住 2 秒</div>
        <div ${fx('pop', L[1].rel + 0.8)} class="btag">吐氣 6 秒</div>
      </div>
      <div id="fly-away" class="flyword">緊張</div>
    </div>`,

  // 複習：一次只問一塊積木——先放大顯示，讓學生猜用途，再由角色說出答案
  reviewQ: (L, seg) => `
    <div class="vis">
      <div ${fx('qmark', 0.4)} class="qmark" style="font-size:92px">？</div>
      <div ${fx('rise', 0.7)} style="margin-top:10px">${shot(UI[seg.blockKey], 190)}</div>
      <div ${fx('countdown', L[seg.qLine].rel + 0.4)} class="cdring small" style="margin-top:16px"><span class="cdnum">5</span></div>
      <div ${fx('stamp', L[seg.aLine].rel + 0.3)} class="answer">${seg.answer}<span class="tick"></span></div>
    </div>`,

  summary: (L) => `
    <div class="vis">
      <div class="row" style="gap:40px">
        <div ${fx('stamp', L[1].rel + 0.2)} class="keycard">${block('control/control_if', 0.62)}<span>如果</span></div>
        <div ${fx('stamp', L[2].rel + 0.2)} class="keycard">${block('control/control_forever', 0.62)}<span>迴圈</span></div>
        <div ${fx('stamp', L[3].rel + 0.2)} class="keycard">${block('data/data_setvariableto', 0.62)}<span>變數</span></div>
      </div>
    </div>`,

  codeMouseShow: (L) => `
    <div class="vis">
      ${codeCard(CODE.mouseShow, 500, fx('rise', 0.3), '老鼠的程式',
        hl([6, 4, 53, 18], say(L, '當綠旗被點擊').rel + 0.3, say(L, '百分之八十').rel, 'right') +
        hl([6, 18.5, 58, 15], say(L, '百分之八十').rel + 0.3, say(L, '重複無限次').rel, 'right') +
        hl([6, 29.5, 89, 67], say(L, '重複無限次').rel + 0.3, say(L, '滑鼠按下就顯示').rel) +
        hl([10.5, 39.5, 84, 56], say(L, '滑鼠按下就顯示').rel + 0.3, say(L, '照著這樣排').rel))}
    </div>`,

  codeMouseGoto: (L) => `
    <div class="vis">
      ${codeCard(CODE.mouseGoto, 500, fx('rise', 0.3), '老鼠的程式（完成）',
        hl([16.5, 46, 74, 14], say(L, '移到滑鼠游標').rel + 0.3, say(L, '跟著你跑').rel, 'right'))}
    </div>`,

  codeCatChase: (L) => `
    <div class="vis">
      ${codeCard(CODE.catChase, 480, fx('rise', 0.3), '貓咪的程式',
        hl([13, 46.5, 82, 43], say(L, '裡面放三塊積木').rel + 0.3, say(L, '面向滑鼠').rel) +
        hl([14, 47, 81, 17], say(L, '面向滑鼠').rel + 0.3, say(L, '面向滑鼠').rel + 2.2, 'right') +
        hl([14, 60, 34, 17], say(L, '面向滑鼠').rel + 2.4, say(L, '面向滑鼠').rel + 4.2, 'right') +
        hl([14, 72.5, 45, 17], say(L, '面向滑鼠').rel + 4.4, say(L, '照著排').rel, 'right'))}
    </div>`,

  codeCatSpin: (L) => `
    <div class="vis">
      ${codeCard(CODE.catSpin, 500, fx('rise', 0.3), '貓咪的程式（完成）',
        hl([9.5, 63, 78, 33], say(L, '重複直到滑鼠鍵被按下').rel + 0.3, say(L, '右轉十五度').rel, 'left') +
        hl([14.5, 72.5, 61, 14], say(L, '右轉十五度').rel + 0.3, say(L, '一直轉').rel, 'left'))}
    </div>`,

  codeScore: (L) => `
    <div class="vis">
      ${codeCard(CODE.score, 500, fx('rise', 0.3), '計分的程式',
        hl([5, 19.5, 57, 13.5], say(L, 'score 設成零').rel + 0.3, say(L, '重複直到').rel, 'right') +
        hl([5.5, 31, 90, 65], say(L, '重複直到').rel + 0.3, say(L, '這裡的二十').rel) +
        hl([64, 33, 15, 12], say(L, '這裡的二十').rel + 0.3, say(L, '碰到貓咪').rel, 'right') +
        hl([21, 45.5, 62, 12], say(L, '碰到貓咪').rel + 0.3, say(L, '碰到貓咪').rel + 2.6, 'right') +
        hl([12, 56, 66, 16], say(L, '碰到貓咪').rel + 2.8, say(L, '停止全部').rel, 'right') +
        hl([5, 84, 34, 13], say(L, '停止全部').rel + 0.3, say(L, '停止全部').rel + 3, 'right'))}
    </div>`,

  // 實機操作示範：整段就是一張張真實截圖，配紅框指出「現在要點哪裡」。
  // shots 的 on 是台詞關鍵字，畫面跟著那句話出現，講稿改了也不會對錯行。
  demoSteps: (L, seg) => {
    const shots = seg.shots.map((s, i) => {
      const line = say(L, s.on);
      const next = seg.shots[i + 1] ? say(L, seg.shots[i + 1].on).rel : seg.dur - TAIL;
      shotFades.push({ id: `${seg.id}-sh${i}`, at: r2(seg.start + line.rel), until: r2(seg.start + next) });
      if (i === 0) hit('swoosh', line.rel);
      const box = s.box ? hl(s.box, line.rel + 0.45, next - 0.2, s.arrow ?? null) : '';
      return `<div id="${seg.id}-sh${i}" class="demoshot"
                style="background-image:url('assets/steps/${s.img}')">${box}</div>`;
    }).join('');
    return `
    <div class="vis">
      <div class="demowrap">${shots}</div>
      ${seg.caption ? `<div ${fx('pop', 0.4)} class="tagline" style="margin-top:14px">${seg.caption}</div>` : ''}
    </div>`;
  },

  codeReview: (L) => `
    <div class="vis">
      <div class="row" style="gap:18px;align-items:flex-end">
        ${codeCard(CODE.mouseGoto, 430, fx('rise', L[1].rel), '老鼠')}
        ${codeCard(CODE.catSpin, 430, fx('rise', L[2].rel), '貓咪')}
        ${codeCard(CODE.score, 430, fx('rise', L[3].rel), '計分')}
      </div>
    </div>`,

  ending: (L) => `
    <div class="vis">
      <div ${fx('stamp', 0.4)} class="bigtitle">下次見！</div>
      <div class="row" style="margin-top:24px;gap:30px">
        ${art(SPRITE.balloon, 100, 130, '', fx('float', L[2].rel))}
        ${art(SPRITE.star, 90, 90, '', fx('twinkle', L[2].rel + 0.3))}
        ${art(SPRITE.gift, 100, 100, '', fx('float', L[3].rel))}
      </div>
      <div ${fx('pop', L[1].rel + 0.3)} class="kicker" style="margin-top:18px">記得回家練習做一次喔</div>
    </div>`,
};

// ===== 各段客製動畫 =====
const customJS = (seg) => {
  const S = seg.start, L = seg.L, E = seg.dur;
  const at = (i, off = 0) => r2(S + L[i].rel + off).toFixed(2);
  switch (seg.vis) {
    case 'chapter':
      return `
  tl.fromTo('#${seg.id}-card',{x:-1500},{x:0,duration:0.9,ease:'power3.out'},${S.toFixed(2)});
  tl.to('#${seg.id}-card',{x:1500,duration:0.7,ease:'power3.in'},${r2(S + E - 0.8).toFixed(2)});`;
    case 'chase':
      return `
  tl.fromTo('#chase-mouse',{x:0},{x:210,duration:3.4,ease:'power1.inOut'},${at(1)});
  tl.fromTo('#chase-cat',{x:0},{x:210,duration:3.4,ease:'power1.inOut'},${at(1, 0.35)});
  tl.to('#chase-mouse',{x:-330,duration:3.4,ease:'power1.inOut'},${at(2, 0.6)});
  tl.to('#chase-cat',{x:-120,duration:3.4,ease:'power1.inOut'},${at(2, 0.95)});
  tl.to('#chase-mouse',{x:0,duration:2.4,ease:'power1.inOut'},${at(4, 0.2)});
  tl.to('#chase-cat',{x:0,duration:2.4,ease:'power1.inOut'},${at(4, 0.5)});`;
    case 'dragBlock':
      // 箭頭滑過去 → 到積木上變張開的手掌 → 按下變握住 → 拖 → 放開回箭頭
      return `
  tl.set('#drag-block',{autoAlpha:0},0);
  tl.set(['#drag-cursor','#drag-cursor-ring'],{x:-140,y:-40},0);
  tl.to(['#drag-cursor','#drag-cursor-ring'],{x:34,y:14,duration:0.9,ease:'power3.out'},${at(0, 0.4)});
${cursorTo('drag-cursor', 'open', r2(S + L[0].rel + 1.2))}
${clickAt('drag-cursor', r2(S + L[0].rel + 1.45))}
${cursorTo('drag-cursor', 'grab', r2(S + L[0].rel + 1.5))}
  tl.set('#drag-block',{autoAlpha:1},${at(0, 1.5)});
  tl.fromTo('#drag-block',{x:0,y:0},{x:475,y:96,duration:1.8,ease:'power2.inOut'},${at(1, 0.2)});
  tl.to(['#drag-cursor','#drag-cursor-ring'],{x:509,y:110,duration:1.8,ease:'power2.inOut'},${at(1, 0.2)});
  tl.to('#drag-block',{scale:1.08,duration:0.2,yoyo:true,repeat:1},${at(1, 2.0)});
${cursorTo('drag-cursor', 'arrow', r2(S + L[1].rel + 2.2))}
  tl.to(['#drag-cursor','#drag-cursor-ring'],{x:640,y:30,duration:0.7,ease:'power2.inOut'},${at(1, 2.4)});`;
    case 'doorbell':
      return `
  tl.to('#bell',{scale:1.18,duration:0.16,yoyo:true,repeat:5},${at(4, 0.6)});
  tl.fromTo('#bell-ring',{scale:0.8,opacity:0.9},{scale:2.2,opacity:0,duration:1.0,ease:'power2.out'},${at(4, 0.6)});
  tl.fromTo('#bell-ring',{scale:0.8,opacity:0.9},{scale:2.2,opacity:0,duration:1.0,ease:'power2.out'},${at(4, 1.1)});
  tl.set('#bell-ring',{opacity:0},${at(4, 2.2)});
  tl.fromTo('#door-panel',{rotationY:0},{rotationY:-72,duration:1.1,ease:'power2.out'},${at(4, 1.6)});`;
    case 'goto':
      return `
  tl.set(['#goto-cursor','#goto-cursor-ring'],{x:0,y:0},0);
  tl.to(['#goto-cursor','#goto-cursor-ring'],{x:430,y:52,duration:1.7,ease:'power2.inOut'},${at(0, 0.8)});
  tl.fromTo('#goto-mouse',{x:0,y:0},{x:388,y:-32,duration:0.3,ease:'power4.in'},${at(0, 2.2)});
  tl.fromTo('#goto-mouse',{scale:1.45},{scale:1,duration:0.45,ease:'back.out(3)'},${at(0, 2.5)});
  tl.to(['#goto-cursor','#goto-cursor-ring'],{x:120,y:150,duration:1.6,ease:'power2.inOut'},${at(2, 0.3)});
  tl.to('#goto-mouse',{x:78,y:66,duration:0.3,ease:'power4.in'},${at(2, 1.6)});`;
    case 'loopIntro':
      return `
  tl.fromTo('#blockpile',{autoAlpha:0,scale:0.4},{autoAlpha:1,scale:1,duration:0.6,ease:'back.out(2)'},${at(0, 0.3)});
  tl.to('#blockpile',{autoAlpha:0,scale:0.2,rotation:12,duration:0.5,ease:'power2.in'},${at(4, 0.3)});
  tl.set('#blockpile',{autoAlpha:0},${at(4, 0.9)});`;
    case 'loopTrack':
      return `
  tl.fromTo('#loop-orbit',{rotation:0},{rotation:1440,duration:${r2(E - L[1].rel - 1).toFixed(2)},ease:'none'},${at(1, 0.3)});`;
    case 'catChase':
      return `
  tl.fromTo('#cc-cat',{x:0},{x:250,duration:3.0,ease:'power1.inOut'},${at(4, 0.3)});
  tl.to('#cc-cat',{x:0,duration:2.6,ease:'power1.inOut'},${at(5, 0.3)});`;
    case 'speed':
      return `
  tl.fromTo('#speed-cat',{x:0},{x:520,duration:3.4,ease:'none'},${at(0, 0.6)});
  tl.set('#speed-num',{innerText:'10'},${at(1, 0.2)});
  tl.set('#speed-cat',{x:0},${at(1, 0.2)});
  tl.fromTo('#speed-lines',{autoAlpha:0},{autoAlpha:1,duration:0.3},${at(1, 0.2)});
  tl.to('#speed-cat',{x:520,duration:1.1,ease:'none'},${at(1, 0.4)});
  tl.set('#speed-num',{innerText:'2'},${at(2, 0.2)});
  tl.set('#speed-cat',{x:0},${at(2, 0.2)});
  tl.to('#speed-lines',{autoAlpha:0,duration:0.3},${at(2, 0.2)});
  tl.to('#speed-cat',{x:520,duration:4.0,ease:'none'},${at(2, 0.4)});`;
    case 'spin':
      return `
  tl.fromTo('#think-cloud',{autoAlpha:0,scale:0.3},{autoAlpha:1,scale:1,duration:0.5,ease:'back.out(2)'},${at(1)});
  tl.to('#think-cloud',{autoAlpha:0,scale:0.2,duration:0.4},${at(2, 0.2)});
  tl.set('#think-cloud',{autoAlpha:0},${at(2, 0.8)});
  tl.fromTo('#spin-cat',{rotation:0},{rotation:1080,duration:4.0,ease:'power1.inOut'},${at(2, 0.6)});
  tl.fromTo('#spin-cat',{x:0},{x:430,duration:0.8,ease:'power3.in'},${at(5, 0.5)});`;
    case 'quizLoop':
      return `
  tl.fromTo('#opt-b',{scale:1},{scale:1.1,duration:0.4,ease:'back.out(2)'},${at(4, 0.2)});
  tl.to('#opt-a',{opacity:0.35,duration:0.4},${at(4, 0.2)});`;
    case 'quizFlag':
      return `
  tl.to('#opt-red',{opacity:0.35,duration:0.4},${at(3, 0.3)});
  tl.fromTo('#opt-green',{scale:1},{scale:1.12,duration:0.4,ease:'back.out(2)'},${at(3, 0.3)});`;
    case 'quizVar':
      return `
  tl.to('#qv-b',{opacity:0.35,duration:0.4},${at(3, 0.2)});
  tl.fromTo('#qv-a',{scale:1},{scale:1.12,duration:0.4,ease:'back.out(2)'},${at(3, 0.2)});`;
    case 'makeVar':
      return `
  tl.fromTo('#mv-num',{scale:0.4,autoAlpha:0},{scale:1,autoAlpha:1,duration:0.5,ease:'back.out(2)'},${at(3, 0.3)});`;
    case 'addScore': {
      let js = `
  tl.fromTo('#as-cat',{x:0},{x:210,duration:2.2,ease:'power1.inOut'},${at(0, 0.4)});`;
      [1, 2, 3].forEach((n, i) => {
        js += `
  tl.set('#as-num',{innerText:'${n}'},${at(2, 0.5 + i * 0.7)});
  tl.fromTo('#as-num',{scale:1.5},{scale:1,duration:0.3,ease:'back.out(3)'},${at(2, 0.5 + i * 0.7)});`;
      });
      js += `
  tl.set('#as-num',{innerText:'20'},${at(3, 0.6)});
  tl.fromTo('#as-num',{scale:1.8},{scale:1,duration:0.4,ease:'back.out(3)'},${at(3, 0.6)});`;
      return js;
    }
    case 'demo': {
      let js = '';
      [5, 11, 18, 20].forEach((n, i) => {
        js += `
  tl.set('#dm-num',{innerText:'${n}'},${at(2, 0.3 + i * 0.6)});
  tl.fromTo('#dm-num',{scale:1.5},{scale:1,duration:0.3,ease:'back.out(3)'},${at(2, 0.3 + i * 0.6)});`;
      });
      return js;
    }
    case 'breath': {
      let js = '';
      [2, 3].forEach((li) => {
        const b = r2(S + L[li].rel + L[li].dur + 0.2);
        js += `
  tl.set('#breath-label',{innerText:'吸氣'},${b.toFixed(2)});
  tl.fromTo('#breath-circle',{scale:1},{scale:1.5,duration:4,ease:'sine.inOut'},${b.toFixed(2)});
  tl.set('#breath-label',{innerText:'憋住'},${r2(b + 4).toFixed(2)});
  tl.set('#breath-label',{innerText:'吐氣'},${r2(b + 6).toFixed(2)});
  tl.to('#breath-circle',{scale:1,duration:6,ease:'sine.inOut'},${r2(b + 6).toFixed(2)});
  tl.set('#breath-label',{innerText:'呼吸'},${r2(b + 12).toFixed(2)});`;
      });
      js += `
  tl.fromTo('#fly-away',{y:0,autoAlpha:1},{y:-190,autoAlpha:0,duration:2,ease:'power1.in'},${at(4, 0.3)});
  tl.set('#fly-away',{autoAlpha:0},${at(4, 2.5)});`;
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
    : `<div style="position:absolute;inset:0;background:${
        seg.vis === 'breath' || seg.vis === 'stageFright'
          ? 'linear-gradient(180deg,#BDE8FF,#7EC9F5)'
          : seg.vis === 'ending' || seg.vis === 'title'
          ? 'linear-gradient(180deg,#FFE9A8,#FFD166)'
          : 'linear-gradient(180deg,#FFE9A8,#FFD166)'
      }"></div>
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
  tl.set('#${s.id}',{autoAlpha:0},0);
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
      .stack { display: flex; flex-direction: column; align-items: flex-start; }
      .stackin { margin-left: 34px; margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }

      .bubble { position: absolute; bottom: 400px; width: 540px; background: #fff; border: 7px solid; border-radius: 30px;
                padding: 26px 30px 22px; font-size: 38px; font-weight: 800; color: #333; line-height: 1.45; }
      .bubble-left { left: 44px; } .bubble-right { right: 44px; }
      .bubble-left::after, .bubble-right::after { content: ""; position: absolute; bottom: -26px; width: 0; height: 0;
                border-left: 18px solid transparent; border-right: 18px solid transparent; border-top: 28px solid #fff; }
      .bubble-left::after { left: 70px; } .bubble-right::after { right: 70px; }
      .bubble-name { position: absolute; top: -26px; left: 24px; color: #fff; font-size: 26px; font-weight: 900;
                padding: 4px 18px; border-radius: 999px; white-space: nowrap; }

      .bigtitle { font-size: 126px; font-weight: 900; color: #7A2E00; text-shadow: 0 6px 0 rgba(255,255,255,.5); }
      .kicker { font-size: 46px; font-weight: 900; color: #6B2000; }
      .keyword { font-size: 80px; font-weight: 900; color: #FFE066; text-shadow: 0 6px 0 rgba(0,0,0,.35); }
      .tagline { font-size: 44px; font-weight: 900; color: #fff; margin-top: 16px; text-shadow: 0 4px 0 rgba(0,0,0,.25); }
      .tagline.dark { color: #7A2E00; text-shadow: 0 4px 0 rgba(255,255,255,.5); }
      .quizq { background: #FFF3C4; color: #6B4A00; font-size: 46px; font-weight: 900; padding: 18px 40px;
               border-radius: 24px; box-shadow: 0 8px 0 rgba(0,0,0,.18); }
      .answer { position: relative; display: flex; align-items: center; gap: 16px; margin-top: 18px;
                background: #fff; color: #1E7A4F; font-size: 52px; font-weight: 900; padding: 14px 40px;
                border-radius: 22px; box-shadow: 0 8px 0 rgba(0,0,0,.18); }
      .qmark { font-size: 124px; font-weight: 900; color: #FF4D6D; text-shadow: 0 6px 0 rgba(0,0,0,.2); }
      .flyword { font-size: 54px; font-weight: 900; color: #2F5068; margin-top: 18px; }

      .goalgrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 22px; }
      .goalcard { width: 300px; height: 210px; background: #fff; border-radius: 26px; display: flex; flex-direction: column;
                  align-items: center; justify-content: center; gap: 14px; box-shadow: 0 10px 0 rgba(0,0,0,.16); }
      .goalnum { width: 84px; height: 84px; border-radius: 50%; background: #FFB703; color: #fff; font-size: 48px;
                 font-weight: 900; display: flex; align-items: center; justify-content: center; }
      .goaltxt { font-size: 36px; font-weight: 900; color: #444; }
      .matcard, .optcard, .keycard, .statecard, .cmpcard, .ctrlcard, .minicard, .ifcard, .flowbox {
                  background: #fff; border-radius: 24px; display: flex; flex-direction: column; align-items: center;
                  justify-content: center; box-shadow: 0 10px 0 rgba(0,0,0,.16); color: #444; font-weight: 900; }
      .matcard { width: 230px; height: 250px; gap: 8px; font-size: 38px; }
      .keycard { width: 290px; height: 290px; gap: 16px; font-size: 48px; }
      .optcard { width: 250px; height: 250px; gap: 10px; font-size: 36px; position: relative; }
      .optcard.wide { width: 340px; height: 210px; }
      .optlab { position: absolute; top: -18px; left: -14px; width: 60px; height: 60px; border-radius: 50%;
                background: #4C97FF; color: #fff; font-size: 34px; display: flex; align-items: center; justify-content: center; }
      .statecard { width: 260px; height: 210px; gap: 8px; font-size: 30px; }
      .statebox { width: 120px; height: 100px; border-radius: 16px; background: #F1F4F8; display: flex;
                  align-items: center; justify-content: center; }
      .ghost { width: 60px; height: 60px; border-radius: 50%; border: 5px dashed #B6C2CF; }
      .cmpcard { width: 320px; height: 240px; gap: 10px; font-size: 34px; position: relative; }
      .cmpcard.ok { border: 6px solid #35C46B; } .cmpcard.bad { border: 6px solid #E86A6A; }
      .cmptag { position: absolute; top: -20px; background: #444; color: #fff; font-size: 24px; padding: 4px 16px; border-radius: 999px; }
      .ctrlcard { width: 290px; height: 240px; gap: 12px; font-size: 36px; }
      .minicard { padding: 14px 30px; font-size: 34px; }
      .ifcard { width: 320px; height: 330px; gap: 10px; font-size: 34px; padding: 18px; }
      .ifa { color: #C1121F; } .ifb { color: #1E7A4F; }
      .ifarrow { width: 0; height: 0; border-left: 14px solid transparent; border-right: 14px solid transparent;
                 border-top: 20px solid #FFB703; margin: 4px 0; }
      .plus { width: 46px; height: 46px; position: relative; }
      .plus::before, .plus::after { content: ""; position: absolute; background: #fff; border-radius: 4px; }
      .plus::before { left: 50%; top: 0; width: 10px; height: 100%; margin-left: -5px; }
      .plus::after { top: 50%; left: 0; height: 10px; width: 100%; margin-top: -5px; }
      .dashline { width: 90px; height: 0; border-top: 8px dashed #fff; }

      .ico { width: 86px; height: 86px; position: relative; }
      .ico-rain::before { content: ""; position: absolute; left: 8px; top: 14px; width: 70px; height: 34px;
                 background: #9DB6C9; border-radius: 30px 30px 18px 18px; }
      .ico-rain::after { content: ""; position: absolute; left: 24px; top: 54px; width: 8px; height: 24px;
                 background: #4C97FF; border-radius: 4px; box-shadow: 22px 6px 0 #4C97FF, 44px -4px 0 #4C97FF; }
      .ico-hungry::before { content: ""; position: absolute; left: 12px; top: 16px; width: 62px; height: 52px;
                 background: #F4A259; border-radius: 50% 50% 46% 46%; }
      .ico-hungry::after { content: ""; position: absolute; left: 12px; top: 44px; width: 62px; height: 26px;
                 background: #E07A5F; border-radius: 0 0 30px 30px; }
      .ico-sleep::before { content: ""; position: absolute; left: 16px; top: 30px; width: 56px; height: 34px;
                 background: #7EA8D6; border-radius: 18px; }
      .ico-sleep::after { content: "z"; position: absolute; right: 4px; top: 2px; font-size: 34px; font-weight: 900; color: #2F5068; }
      .ico-shop::before { content: ""; position: absolute; left: 14px; top: 26px; width: 58px; height: 46px;
                 background: #F6C177; border-radius: 6px; }
      .ico-shop::after { content: ""; position: absolute; left: 8px; top: 14px; width: 70px; height: 16px;
                 background: #E07A5F; border-radius: 8px; }
      .ico-fork::before { content: ""; position: absolute; left: 39px; bottom: 2px; width: 9px; height: 40px;
                 background: #FFB703; border-radius: 4px; }
      .ico-fork i { position: absolute; bottom: 38px; left: 42px; width: 9px; height: 42px; background: #FFB703;
                 border-radius: 4px; transform-origin: bottom center; }
      .ico-fork i:nth-of-type(1) { transform: rotate(-38deg); }
      .ico-fork i:nth-of-type(2) { transform: rotate(38deg); }
      .ico-loop { border: 9px solid #4C97FF; border-radius: 50%; border-right-color: transparent; }
      .ico-crate::before { content: ""; position: absolute; left: 8px; top: 24px; width: 70px; height: 52px;
                 background: #C68B4E; border-radius: 6px; }
      .ico-crate::after { content: ""; position: absolute; left: 2px; top: 14px; width: 82px; height: 18px;
                 background: #A9713B; border-radius: 6px; }
      .tick, .cross { width: 56px; height: 56px; flex: none; background: center/contain no-repeat; }
      .tick { background-image: url('assets/doodles/tick.svg'); }
      .cross { background-image: url('assets/doodles/cross.svg'); }

      .diamond { width: 470px; height: 136px; background: #FFB703; display: flex; align-items: center; justify-content: center;
                 border-radius: 18px; box-shadow: 0 8px 0 rgba(0,0,0,.18); }
      .diamond span { font-size: 40px; font-weight: 900; color: #5A3600; }
      .flowsplit { display: flex; gap: 130px; margin-top: 8px; }
      .flowbranch { display: flex; flex-direction: column; align-items: center; }
      .flowline { width: 8px; height: 42px; background: #fff; border-radius: 4px; }
      .yes, .no { font-size: 34px; font-weight: 900; padding: 6px 24px; border-radius: 999px; margin: 8px 0; }
      .yes { background: #35C46B; color: #fff; } .no { background: #E86A6A; color: #fff; }
      .flowbox { width: 270px; height: 200px; gap: 8px; font-size: 36px; }

      .trafficlight { width: 136px; padding: 14px 0; background: #37474F; border-radius: 20px; display: flex;
                 flex-direction: column; align-items: center; gap: 12px; }
      .trafficlight i { width: 78px; height: 78px; border-radius: 50%; background: #58666E; display: block; }
      .trafficlight i.on { background: #FF4D4D; box-shadow: 0 0 26px #FF4D4D; }
      .cdring { width: 132px; height: 132px; border-radius: 50%; border: 12px solid #FFB703; background: rgba(255,255,255,.92);
                display: flex; align-items: center; justify-content: center; }
      .cdring.small { width: 104px; height: 104px; border-width: 10px; margin-top: 14px; }
      .cdnum { font-size: 62px; font-weight: 900; color: #6B4A00; }
      .cdring.small .cdnum { font-size: 48px; }

      .uiwrap { display: flex; gap: 18px; background: #fff; padding: 18px; border-radius: 22px; box-shadow: 0 10px 0 rgba(0,0,0,.16); }
      .uipal, .uicode, .uistage { position: relative; border-radius: 14px; padding-top: 40px; }
      .uilabel { position: absolute; top: 8px; left: 50%; transform: translateX(-50%); font-size: 26px; font-weight: 900; color: #667; }
      .uipal { width: 210px; height: 340px; background: #F1F4F8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
      .uipal i { width: 130px; height: 34px; border-radius: 8px; display: block; }
      .uicode { width: 350px; height: 340px; background: #FAFBFC; border: 3px dashed #C9D3DD; }
      .uistage { width: 400px; height: 340px; background: #F1F4F8; }
      .uistageinner { width: 356px; height: 276px; margin: 0 auto; border-radius: 10px; }

      .dragwrap { position: relative; width: 820px; height: 270px; }
      .dragfrom { position: absolute; left: 0; top: 0; opacity: .45; }
      .dragmoving { position: absolute; left: 0; top: 0; }
      .dragto { position: absolute; right: 60px; top: 80px; width: 300px; height: 106px; border: 5px dashed #FFE066;
                border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #6B4A00;
                background: rgba(255,255,255,.92); font-size: 32px; font-weight: 900; }
      /* 游標：箭頭＝移動與點擊，手掌＝抓取。三種狀態疊在同一個容器裡切換，
         位移只動容器，形狀切換只改 opacity，這樣 GSAP 的 transform 不會打架。
         尖端在 21% 14%，縮放要以尖端為支點，按下去才不會整顆位移。 */
      /* 實機操作截圖：截圖是 16:9，用白卡框住，在綠板上才看得清楚 */
      .demowrap { position: relative; width: 1080px; height: 608px; background: #fff; border-radius: 16px;
                  box-shadow: 0 14px 34px rgba(0,0,0,.32); overflow: hidden; }
      .demoshot { position: absolute; inset: 0; background-size: cover; background-position: center;
                  background-repeat: no-repeat; }

      .cursor { position: absolute; left: 0; top: 0; width: 92px; height: 92px; z-index: 6;
                filter: drop-shadow(0 4px 6px rgba(0,0,0,.35)); pointer-events: none; will-change: transform; }
      .cursor > svg { position: absolute; inset: 0; width: 100%; height: 100%; }
      .cursor .c-open, .cursor .c-grab { opacity: 0; }
      /* 點擊時擴散出去的漣漪，中心對準箭頭尖端 */
      .clickring { position: absolute; left: 0; top: 0; width: 92px; height: 92px; z-index: 5;
                   pointer-events: none; opacity: 0; }
      .clickring i { position: absolute; left: 21%; top: 14%; width: 64px; height: 64px; margin: -32px 0 0 -32px;
                     border: 5px solid #FF4D4D; border-radius: 50%; }

      .doorwrap { position: relative; width: 620px; height: 400px; display: flex; justify-content: flex-start;
                  padding-left: 40px; }
      .door { position: relative; width: 280px; height: 400px; background: #8D5A2B; border: 10px solid #6E4420;
                  border-radius: 12px 12px 0 0; }
      .doorpanel { position: absolute; inset: 12px; background: #C68B4E; border-radius: 8px; transform-origin: left center; }
      .doorknob { position: absolute; right: 30px; top: 50%; width: 26px; height: 26px; border-radius: 50%; background: #FFE066; }
      .ringwave { position: absolute; right: 120px; top: 120px; width: 130px; height: 130px; border-radius: 50%;
              border: 8px solid #FFE066; opacity: 0; }

      .stagebox { padding: 12px; background: #fff; border-radius: 22px; box-shadow: 0 10px 0 rgba(0,0,0,.16); }
      .stageinner { position: relative; width: 840px; height: 420px; border-radius: 14px; overflow: hidden; }
      .stagebox.small .stageinner { width: 600px; height: 320px; }
      .playbox { position: relative; width: 820px; height: 320px; background: rgba(255,255,255,.14);
                 border: 5px dashed rgba(255,255,255,.5); border-radius: 18px; }
      .scoreboard { position: absolute; left: 16px; top: 14px; background: #FFB703; color: #5A3600; border-radius: 12px;
                 padding: 6px 18px; font-size: 30px; font-weight: 900; display: flex; gap: 12px; align-items: center; }
      .scoreboard b { font-size: 36px; }

      .track { position: relative; width: 300px; height: 300px; border: 10px dashed #FFE066; border-radius: 50%; }
      .orbit { position: absolute; inset: 0; }
      .runner { position: absolute; left: 50%; top: -24px; margin-left: -24px; width: 48px; height: 48px;
                border-radius: 50%; background: #FF6B6B; box-shadow: 0 6px 0 rgba(0,0,0,.2); }
      .trackarrow { position: absolute; width: 0; height: 0; border-left: 20px solid #FFE066;
                border-top: 13px solid transparent; border-bottom: 13px solid transparent; }
      .trackarrow.a1 { right: -14px; top: 50%; margin-top: -13px; }
      .trackarrow.a2 { left: -14px; top: 50%; margin-top: -13px; transform: rotate(180deg); }
      .blockpile { display: flex; flex-direction: column; gap: 6px; align-items: center; }
      .pilebar { height: 26px; background: #4C97FF; border-radius: 6px; box-shadow: 0 3px 0 rgba(0,0,0,.18); }

      .speedrow { display: flex; align-items: center; gap: 18px; }
      .speedlab { font-size: 40px; font-weight: 900; color: #fff; }
      .speednum { width: 96px; height: 74px; background: #fff; border-radius: 14px; color: #4C97FF; font-size: 46px;
                  font-weight: 900; display: flex; align-items: center; justify-content: center; }
      .speedtrack { position: relative; width: 700px; height: 128px; margin-top: 14px;
                  border-bottom: 8px solid rgba(255,255,255,.6); }
      .speedlines { position: absolute; left: 0; bottom: 30px; }
      .speedlines i { display: block; width: 60px; height: 6px; background: #fff; border-radius: 3px; margin-bottom: 12px; opacity: .8; }

      .thoughtcloud { position: relative; background: #fff; border-radius: 40px; padding: 18px 40px; color: #667;
                  font-size: 38px; font-weight: 900; }
      .thoughtcloud i { position: absolute; background: #fff; border-radius: 50%; }
      .thoughtcloud i:nth-of-type(1) { width: 26px; height: 26px; bottom: -20px; left: 40px; }
      .thoughtcloud i:nth-of-type(2) { width: 16px; height: 16px; bottom: -38px; left: 24px; }

      .messwrap { position: relative; width: 760px; height: 260px; }
      .toy { position: absolute; }
      .toy-car { width: 120px; height: 62px; background: #E63946; border-radius: 12px 16px 8px 8px; left: 20px; top: 20px; }
      .toy-car::after { content: ""; position: absolute; left: 12px; bottom: -12px; width: 22px; height: 22px;
                  border-radius: 50%; background: #333; box-shadow: 62px 0 0 #333; }
      .toy-book { width: 98px; height: 74px; background: #2A9D8F; border-radius: 6px; left: 300px; top: 34px; }
      .toy-book::after { content: ""; position: absolute; left: 10px; top: 0; width: 10px; height: 74px; background: #fff; opacity: .6; }
      .toy-ball { width: 80px; height: 80px; border-radius: 50%; background: #F4A259; left: 560px; top: 26px; }
      .toy.t2 { top: 140px; left: 140px; transform: scale(.8) rotate(12deg); }
      .toy-book.t2 { left: 400px; } .toy-ball.t2 { left: 620px; }
      .toy.mini { position: static; transform: scale(.7); margin-bottom: 4px; }
      .crate { position: relative; width: 280px; height: 245px; background: #C68B4E; border-radius: 14px; display: flex;
                  flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: #fff;
                  font-size: 34px; font-weight: 900; box-shadow: 0 10px 0 rgba(0,0,0,.2); }
      .cratelid { position: absolute; top: -18px; left: -10px; right: -10px; height: 34px; background: #A9713B; border-radius: 10px; }
      .crate.score { background: #FFB703; color: #5A3600; }
      .crate.big { width: 330px; height: 275px; }
      .cratenum { font-size: 62px; font-weight: 900; }
      .cratenum.sm { font-size: 46px; color: #5A3600; }

      .spotlight { position: relative; width: 480px; height: 290px; background: radial-gradient(ellipse at 50% 0%,
                  rgba(255,255,255,.85), rgba(255,255,255,0) 70%); display: flex; align-items: flex-end; justify-content: center; }
      .podium { width: 200px; height: 90px; background: #8D6E63; border-radius: 10px 10px 0 0; }
      .heartline { display: flex; gap: 26px; margin-top: 26px; }
      .hb { width: 34px; height: 34px; background: #FF6B8A; transform: rotate(45deg); position: relative; }
      .hb::before, .hb::after { content: ""; position: absolute; width: 34px; height: 34px; border-radius: 50%; background: #FF6B8A; }
      .hb::before { left: -17px; } .hb::after { top: -17px; }
      .breathcircle { width: 340px; height: 340px; border-radius: 50%; background: radial-gradient(circle,#4A9FE8,#1D6FB8);
                  display: flex; align-items: center; justify-content: center; font-size: 46px; font-weight: 900; color: #fff; }
      .btag { background: #fff; color: #1D6FB8; font-size: 34px; font-weight: 900; padding: 12px 26px; border-radius: 999px;
                  box-shadow: 0 8px 0 rgba(0,0,0,.12); }

      .pathcard { position: relative; background: #fff; color: #444; font-size: 34px; font-weight: 900;
                  padding: 14px 30px 14px 54px; border-radius: 16px; box-shadow: 0 8px 0 rgba(0,0,0,.16); }
      .arrowhead { position: absolute; left: 18px; top: 50%; margin-top: -11px; width: 0; height: 0;
                  border-top: 11px solid transparent; border-bottom: 11px solid transparent; }
      .arrowhead.left { border-right: 18px solid #4C97FF; }
      .arrowhead.right { border-left: 18px solid #FFB703; }

      .codecard { position: relative; background: #fff; border-radius: 20px; padding: 16px 22px;
                  box-shadow: 0 10px 0 rgba(0,0,0,.18); display: flex; flex-direction: column;
                  align-items: center; justify-content: flex-start; }
      .codelabel { font-size: 32px; font-weight: 900; color: #2F6FD0; margin-bottom: 8px; }

      /* ===== 章節大圖卡 ===== */
      .chapcard { display: flex; align-items: center; gap: 52px; background: #fff; border-radius: 48px;
                  padding: 60px 96px; box-shadow: 0 18px 0 rgba(0,0,0,.18); }
      .chapnum { width: 180px; height: 180px; border-radius: 46px; background: #FF6B35; color: #fff;
                 font-size: 116px; font-weight: 900; display: flex; align-items: center; justify-content: center;
                 box-shadow: 0 10px 0 rgba(0,0,0,.16); }
      .chaptxt { font-size: 100px; font-weight: 900; color: #7A2E00; white-space: nowrap; }
      .chapstripes { position: absolute; inset: 0; opacity: .18;
                 background: repeating-linear-gradient(115deg, #fff 0 46px, transparent 46px 120px); }

      /* ===== 紅框與指標箭頭：講到哪裡就框哪裡 ===== */
      .hl { position: absolute; border: 7px solid #FF2D20; border-radius: 16px;
            box-shadow: 0 0 0 5px rgba(255,45,32,.22), inset 0 0 0 3px rgba(255,255,255,.85); }
      .uimarks { position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; }
      .arrowwrap { position: absolute; width: 104px; height: 56px; }
      .arrow { position: relative; width: 104px; height: 56px; }
      .arrow i { position: absolute; right: 0; top: 50%; margin-top: -22px; width: 0; height: 0;
                 border-top: 22px solid transparent; border-bottom: 22px solid transparent;
                 border-left: 34px solid #FF2D20; filter: drop-shadow(0 3px 0 rgba(0,0,0,.2)); }
      .arrow b { position: absolute; left: 0; top: 50%; margin-top: -8px; width: 74px; height: 16px;
                 background: #FF2D20; border-radius: 8px; }

      /* 真實介面截圖的白底卡 */
      .shotcard { position: relative; background: #fff; border-radius: 20px; padding: 16px;
                  box-shadow: 0 10px 0 rgba(0,0,0,.18); }
      /* 積木截圖本身就有形狀與顏色，套白卡反而多一圈礙眼的白框 */
      .shotcard.sm { position: relative; background: none; padding: 0; box-shadow: none; }

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
      data-composition-id="2A5-grade1-3"
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
      window.__timelines['2A5-grade1-3'] = tl;
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
console.log(`總長 ${TOTAL}s（${mm} 分 ${ss} 秒）／ ${SEGS.length} 段 ／ ${bubbles.length} 句對白 ／ ${cues.length} 顆音效`);
