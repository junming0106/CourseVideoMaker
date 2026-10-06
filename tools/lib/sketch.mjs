// 手繪教室風格（所有課程共用）：版面常數、手繪外框、字幕對話框、等待鬧鐘、收斂過的字卡與動畫
//
// 為什麼抽成共用：2A1 做出這套風格花了好幾輪（使用者回報字卡太雜、對話框跑出黑板、等待時間不明顯、
// 圈選太死板），每一條都是踩出來的。新課程直接引用，就不會再從 2A5 那種「各種色塊＋全片亂飛」重走一遍。
// 完整的設計規則（為什麼這樣排）見 .claude/skills/teaching-video-pipeline/references/visual-style.md。
//
// 用法（build-composition.mjs 裡）：
//   import { LAYOUT, SKETCH_DEFS, sketchCss, makeSketchKit, clockHtml, clockTimelineJS, bubbleHtml, bubbleTimelineJS }
//     from '../../../tools/lib/sketch.mjs';
//   const { fx, fxOut, card } = makeSketchKit(hit);            // 收斂過的 fx 與字卡
//   <style>${FONT_CSS}${CARD_CSS}${POINTER_CSS}${sketchCss()}</style>
//   <body>${SKETCH_DEFS} ...                                   // SVG 濾鏡一定要放進頁面
import { makeFx, makeFxOut } from './fx.mjs';
import { makeCard } from './cards.mjs';

// ===== 版面（全部在綠色黑板內：x 280~1640、y 222~880）=====
//   標題帶  y 218~326   一次只出現一張字卡，後出現的取代先出現的
//   內容區  y 344~736   圖片、積木、示意圖。一張圖用完就收，要留的先排好位置
//   字幕帶  y 752~880   對話框，固定在黑板下緣，尖角朝說話的角色
//   等待鐘  黑板正中央 (960, 570)；有停頓的畫面，中間 x 860~1060、y 475~665 一定要留空
export const LAYOUT = {
  TITLE_Y: 218,
  MID: { cx: 960, cy: 540 },
  MAX_H: 392,
  CAPTION: { left: 470, top: 752, width: 980 },
  CLOCK: { left: 865, top: 475, size: 190 },
};
export const INK = '#4A2E14';     // 咖啡色：所有手繪線條與文字
export const PAPER = '#FFF8E6';   // 米色紙面

// ===== 動畫與字卡：收斂成少數幾種 =====
// 使用者回報「字卡不需要這麼多種類」。動畫只留 pop（字卡）、rise（圖片）、stamp（答對、章名）；
// 其他名稱一律當 pop。字卡只有 3 種顏色（重點＝橘、提示＝藍、正確＝綠）、1 種外形、3 種大小。
export const FX_ALLOWED = new Set(['pop', 'rise', 'stamp', 'fadeIn', 'draw', 'pulse', 'countdown', 'countdown4', 'countdown3', 'countdown2']);
export const TONE_MAP = { orange: 'orange', yellow: 'orange', red: 'orange', blue: 'blue', purple: 'blue', green: 'green' };

export const makeSketchKit = (hit) => {
  const fx0 = makeFx(hit);
  const fx = (type, at, extra = '') => fx0(FX_ALLOWED.has(type) ? type : 'pop', at, extra);
  const fxOut = makeFxOut(hit);
  const card0 = makeCard(fx, fxOut);
  const card = (o) => card0({ ...o, tone: TONE_MAP[o.tone ?? 'orange'], shape: 'box', size: o.size === 'xl' ? 'lg' : (o.size ?? 'md') });
  return { fx, fxOut, card };
};

// ===== 手繪濾鏡（要放在 <body> 最前面，CSS 用 url(#rough) 引用）=====
// rough：紙卡、對話框、鬧鐘的外框（歪一點）；rough2：圈選與箭頭（歪得更明顯，像麥克筆畫的圈）。
// 濾鏡只套在「外框」上，字留在外面保持清楚——整個元素套濾鏡會把字也扭歪。
export const SKETCH_DEFS = `
    <svg width="0" height="0" style="position:absolute" aria-hidden="true">
      <filter id="rough2" x="-15%" y="-25%" width="130%" height="150%">
        <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="2" seed="11" result="m" />
        <feDisplacementMap in="SourceGraphic" in2="m" scale="11" />
      </filter>
      <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="5" />
      </filter>
    </svg>`;

// ===== 共用樣式 =====
export const sketchCss = () => `
      .rowc { position: absolute; left: 0; width: 1920px; display: flex; justify-content: center; align-items: center; gap: 24px; }

      /* 圈選與箭頭：紅色麥克筆的感覺，線條用更大幅度的濾鏡畫歪 */
      .fxptr-svg { filter: url(#rough2); }
      .fxptr-line { stroke: #E8533F !important; stroke-width: 9; filter: none !important; }
      .fxptr-arrow { filter: url(#rough2) !important; --c: #E8533F !important; }

      /* ===== 手繪外框 =====
         外框（背景＋咖啡色線）畫在 ::before 上，套 SVG 濾鏡讓邊緣歪歪的像手畫；文字留在外面保持清楚。
         isolation 讓 z-index:-1 的外框停在這張卡片裡，不會掉到黑板後面。 */
      .sketch { position: relative; isolation: isolate; }
      .sketch::before { content: ""; position: absolute; inset: 0; z-index: -1; background: var(--bg, ${PAPER});
                        border: 5px solid ${INK}; border-radius: 26px 34px 24px 32px / 32px 24px 34px 26px;
                        box-shadow: 5px 6px 0 rgba(74,46,20,.30); filter: url(#rough); }
      .paper { --bg: ${PAPER}; }
      .note { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 14px;
              color: ${INK}; font-weight: 900; font-size: 36px; text-align: center; }
      .note .big { font-size: 50px; } .note b { font-weight: 900; } .note span { font-size: 30px; }

      /* 字卡（共用模組 cards.mjs）：改成手繪紙卡，只留 3 種顏色 */
      .fxcard-box { position: relative; isolation: isolate; border: 0 !important; box-shadow: none !important; background: none !important;
                    text-shadow: none !important; color: ${INK} !important; }
      .fxcard-box::before { content: ""; position: absolute; inset: 0; z-index: -1; background: var(--bg);
                    border: 5px solid ${INK}; border-radius: 26px 34px 24px 32px / 32px 24px 34px 26px;
                    box-shadow: 5px 6px 0 rgba(74,46,20,.30); filter: url(#rough); }
      .fxcard-box.fxcard-orange { --bg: #FFD27F; } .fxcard-box.fxcard-blue { --bg: #BFE3F5; } .fxcard-box.fxcard-green { --bg: #C6E9AE; }
      .fxhi { color: #D9480F !important; }

      /* 對話框：黑板下緣的字幕帶，手繪外框，尖角朝說話的角色 */
      .bubble { position: absolute; left: ${LAYOUT.CAPTION.left}px; top: ${LAYOUT.CAPTION.top}px; width: ${LAYOUT.CAPTION.width}px; min-height: 118px;
                padding: 24px 40px 20px; display: flex; align-items: center; font-size: 40px; font-weight: 900; color: ${INK};
                line-height: 1.4; isolation: isolate; }
      .bframe { position: absolute; inset: 0; z-index: -1; background: ${PAPER}; border: 5px solid var(--bc);
                border-radius: 30px 36px 28px 34px / 34px 28px 36px 30px; box-shadow: 5px 6px 0 rgba(74,46,20,.28); filter: url(#rough); }
      .bframe::after { content: ""; position: absolute; top: 50%; width: 34px; height: 34px; margin-top: -17px; background: ${PAPER};
                border: 5px solid var(--bc); transform: rotate(45deg); }
      .bubble-left .bframe::after { left: -19px; border-right: 0; border-top: 0; }
      .bubble-right .bframe::after { right: -19px; border-left: 0; border-bottom: 0; }
      .bname { position: absolute; top: -22px; left: 26px; color: #fff; background: var(--bc); font-size: 26px; font-weight: 900;
               padding: 3px 18px; border-radius: 999px; white-space: nowrap; border: 3px solid ${INK}; }

      /* 等待鬧鐘 */
      .clock { position: absolute; left: ${LAYOUT.CLOCK.left}px; top: ${LAYOUT.CLOCK.top}px; width: ${LAYOUT.CLOCK.size}px; height: ${LAYOUT.CLOCK.size}px; visibility: hidden; }
      .clocknum { position: absolute; inset: 0; }
      .cdn { position: absolute; left: 0; right: 0; top: 50%; height: 70px; margin-top: -33px; line-height: 70px; text-align: center;
             font-size: 54px; font-weight: 900; color: ${INK}; visibility: hidden; }
`;

// ===== 等待鬧鐘 =====
// 手繪鬧鐘：兩個鈴鐺、兩隻腳、圓臉＋12 根刻度；紅色秒針每秒轉一圈，數字在正中央。
export const clockSVG = (id) => `<svg viewBox="0 0 200 200" width="${LAYOUT.CLOCK.size}" height="${LAYOUT.CLOCK.size}" style="position:absolute;inset:0;overflow:visible">
  <g filter="url(#rough)" stroke="${INK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="48" cy="40" r="22" fill="#F4A259"/><circle cx="152" cy="40" r="22" fill="#F4A259"/>
    <path d="M62 170 L44 192 M138 170 L156 192" fill="none"/>
    <circle cx="100" cy="108" r="76" fill="${PAPER}" stroke-width="7"/>
    ${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6, r1 = i % 3 === 0 ? 56 : 62; return `<line x1="${(100 + 70 * Math.sin(a)).toFixed(1)}" y1="${(108 - 70 * Math.cos(a)).toFixed(1)}" x2="${(100 + r1 * Math.sin(a)).toFixed(1)}" y2="${(108 - r1 * Math.cos(a)).toFixed(1)}" stroke-width="${i % 3 === 0 ? 6 : 4}"/>`; }).join('')}
  </g>
  <g id="${id}-hand"><line x1="100" y1="108" x2="100" y2="48" stroke="#E8533F" stroke-width="7" stroke-linecap="round"/></g>
  <circle cx="100" cy="108" r="36" fill="${PAPER}" stroke="${INK}" stroke-width="5" filter="url(#rough)"/>
</svg>`;

/**
 * 鬧鐘的 HTML。數字不用 fx.mjs 的 countdown（那個用 innerText 補間，渲染是逐格「跳著抓」畫面，
 * 跳著抓時會顯示成 0）；改成「每個數字一個元素、到時間才顯示」，不管怎麼抓都是對的。
 * @param id  唯一 id（例如 `${seg.id}-clk0`）
 * @param n   倒數幾秒（最多 5）
 */
export const clockHtml = (id, n) =>
  `<div id="${id}" class="clock">${clockSVG(id)}<div class="clocknum">${Array.from({ length: n }, (_, i) => `<span id="${id}-d${n - i}" class="cdn">${n - i}</span>`).join('')}</div></div>`;

/** 鬧鐘的 GSAP 時間軸。at 是絕對秒數（鬧鐘開始出現的時刻） */
export const clockTimelineJS = ({ id, at, n }, f2 = (x) => x.toFixed(2)) => {
  const lines = [`  tl.fromTo('#${id}',{autoAlpha:0,scale:0.4},{autoAlpha:1,scale:1,duration:0.4,ease:'back.out(2)'},${f2(at)});`];
  for (let i = 0; i < n; i++) {
    const k = n - i, ti = at + 0.4 + i;
    lines.push(`  tl.set('#${id}-d${k}',{autoAlpha:1},${f2(ti)});`);
    lines.push(`  tl.fromTo('#${id}-d${k}',{scale:1.5},{scale:1,duration:0.3,ease:'back.out(3)'},${f2(ti)});`);
    lines.push(`  tl.set('#${id}-d${k}',{autoAlpha:0},${f2(ti + 1)});`);
  }
  lines.push(`  tl.fromTo('#${id}-hand',{rotation:0,svgOrigin:'100 108'},{rotation:${360 * n},svgOrigin:'100 108',duration:${n},ease:'none'},${f2(at + 0.4)});`);
  lines.push(`  tl.to('#${id}',{autoAlpha:0,duration:0.3},${f2(at + 0.4 + n)});`);
  lines.push(`  tl.set('#${id}',{autoAlpha:0},${f2(at + 0.8 + n)});`);
  return lines.join('\n');
};

// ===== 字幕對話框 =====
/** side：Cooper（老師）在左、學生在右，尖角朝說話的角色。color 是角色代表色。 */
export const bubbleHtml = (id, { who, text, color }) => {
  const side = who === 'Cooper' ? 'left' : 'right';
  return `
    <div id="${id}" class="bubble bubble-${side}" style="--bc:${color}">
      <div class="bframe"></div>
      <span class="bname">${who === 'Cooper' ? 'Cooper 老師' : who}</span><span class="btxt">${text}</span>
    </div>`;
};
/** 淡入、淡出整段留在該句自己的時間窗內（接話間隔只有 0.2 秒，尾巴跨過下一句起點 lint 會報缺 hard kill） */
export const bubbleTimelineJS = ({ sel, at, dur }, f2 = (x) => x.toFixed(2)) =>
  `  tl.fromTo('${sel}',{autoAlpha:0,scale:.9,y:14},{autoAlpha:1,scale:1,y:0,duration:.25,ease:'back.out(1.5)'},${f2(at)});
  tl.to('${sel}',{autoAlpha:0,duration:.14},${f2(at + dur - 0.18)});
  tl.set('${sel}',{autoAlpha:0},${f2(at + dur - 0.02)});`;
