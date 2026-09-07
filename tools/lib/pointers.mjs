// 視線引導（所有課程共用）
//
// 為什麼要這支：學生的眼睛不會自己找到重點。畫面上一次有五樣東西時，
// 純文字說明沒有用——要有一個動態的東西「指過去」，眼睛才會跟。
//
// 用法：在課程的 build-composition.mjs 裡
//
//   import { makeFx, makeFxOut } from '../../../tools/lib/fx.mjs';
//   import { makePointers, POINTER_CSS } from '../../../tools/lib/pointers.mjs';
//   const fx = makeFx(hit), fxOut = makeFxOut(hit);
//   const { arrow, circle, underline } = makePointers(fx, fxOut);
//   ...
//   ${arrow({ x: 820, y: 430, dir: 'right', at: 3.2, out: 'fadeOut', outAt: 6 })}
//   ${circle({ x: 640, y: 380, w: 300, h: 160, at: 4.0 })}
//   ${underline({ x: 500, y: 700, w: 420, at: 2.5 })}
//   ...
//   <style>${POINTER_CSS}</style>
//
// 座標一律是 1920×1080 畫布上的絕對位置（px），x/y 是「要指的那個東西的中心」。
// 三種各有分工，不要混用：
//   arrow      指單一小目標（一顆積木、一個按鈕）
//   circle     框住一小群東西（一整段程式、一組數字）
//   underline  強調一行字（標題、句子裡的關鍵詞）
//
// 圈選與底線刻意畫得歪一點（手繪感）——正圓與直線看起來像 UI 元件，
// 手繪感看起來像老師拿筆在螢幕上畫，學生的注意力會跟過去。

/** 引導線的顏色。預設紅色是因為它在 Scratch 的彩色介面上對比最強。 */
export const POINTER_COLORS = {
  red:    '#FF2D55',
  orange: '#FF9F1C',
  yellow: '#FFD166',
  green:  '#22C55E',
  blue:   '#2F80ED',
};

const color = (c) => {
  if (!POINTER_COLORS[c]) throw new Error(`未知的引導線顏色：${c}\n可用：${Object.keys(POINTER_COLORS).join('、')}`);
  return POINTER_COLORS[c];
};

// 箭頭指向哪邊：箭尖朝目標，所以整支箭要從反方向轉進來
const DIRS = { right: 0, down: 90, left: 180, up: -90 };

/**
 * 產生課程用的三個引導函式。
 * @param fx    makeFx() 的產物（進場）
 * @param fxOut makeFxOut() 的產物（離場）；沒傳就不能用 out
 */
export const makePointers = (fx, fxOut) => {
  const guardOut = (out) => {
    if (out && !fxOut) throw new Error('要用 out 就得把 fxOut 傳給 makePointers(fx, fxOut)');
  };

  /**
   * 動態箭頭：彈出來後持續輕微脈動，直到離場。
   * x/y 是箭尖要指的位置；箭身往 dir 的反方向長出去，不會壓到目標本身。
   */
  const arrow = ({ x, y, dir = 'right', at, out = '', outAt = 0, tone = 'red', len = 150, id = '' }) => {
    if (!(dir in DIRS)) throw new Error(`未知的箭頭方向：${dir}\n可用：${Object.keys(DIRS).join('、')}`);
    guardOut(out);
    const c = color(tone);
    // 外層 wrapper 只負責定位與旋轉；GSAP 動的是內層，兩層 transform 才不會打架
    return `<div class="fxptr-wrap" style="left:${x}px;top:${y}px;transform:translate(-100%,-50%) rotate(${DIRS[dir]}deg);transform-origin:100% 50%">`
      + `<div ${id ? `id="${id}"` : ''} ${fx('pulse', at)} ${out ? fxOut(out, outAt) : ''} class="fxptr-arrow" style="width:${len}px;--c:${c}">`
      + `<i></i><b></b></div></div>`;
  };

  /**
   * 手繪感圈選：橢圓一圈一圈畫出來。
   * x/y 是要圈的東西的中心，w/h 是圈的大小（要比目標大一點，否則會壓在字上）。
   */
  const circle = ({ x, y, w, h, at, out = '', outAt = 0, tone = 'red', id = '' }) => {
    guardOut(out);
    // rx/ry 留 6px 給線寬，不然筆畫會被 SVG 邊界切掉
    const rx = w / 2 - 6, ry = h / 2 - 6;
    return `<svg class="fxptr-svg" style="left:${x - w / 2}px;top:${y - h / 2}px" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
      + `<ellipse ${id ? `id="${id}"` : ''} ${fx('draw', at)} ${out ? fxOut(out, outAt) : ''}`
      + ` class="fxptr-line" pathLength="1000" cx="${w / 2}" cy="${h / 2}" rx="${rx}" ry="${ry}"`
      // 轉個 -4 度，正圓看起來像 UI 外框，歪一點才像手畫的
      + ` transform="rotate(-4 ${w / 2} ${h / 2})" style="stroke:${color(tone)}"/></svg>`;
  };

  /**
   * 手繪感底線：一條略帶弧度的線由左往右畫出來。
   * x/y 是線的左端；y 要放在字的基線下方約 8~12px。
   */
  const underline = ({ x, y, w, at, out = '', outAt = 0, tone = 'red', id = '' }) => {
    guardOut(out);
    const h = 22;
    // 二次貝茲：中間往下墜 7px，看起來才像一筆帶過而不是尺畫的
    return `<svg class="fxptr-svg" style="left:${x}px;top:${y}px" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`
      + `<path ${id ? `id="${id}"` : ''} ${fx('draw', at)} ${out ? fxOut(out, outAt) : ''}`
      + ` class="fxptr-line" pathLength="1000" d="M4 6 Q ${w / 2} 13 ${w - 4} 5" style="stroke:${color(tone)}"/></svg>`;
  };

  return { arrow, circle, underline };
};

/** 內嵌進 composition 的 <style>。 */
export const POINTER_CSS = `
      /* ===== 視線引導（由 tools/lib/pointers.mjs 產生，不要手改）===== */
      .fxptr-wrap, .fxptr-svg { position: absolute; pointer-events: none; }
      .fxptr-svg { overflow: visible; }

      /* SVG 線條：pathLength="1000" 讓 dasharray/offset 不必管實際長度。
         用 1000 而不是 1，是因為 GSAP 會把 px 值四捨五入成整數（見 fx.mjs 的 draw） */
      .fxptr-line { fill: none; stroke-width: 9; stroke-linecap: round;
                    stroke-dasharray: 1000 1000; stroke-dashoffset: 1000;
                    filter: drop-shadow(0 3px 6px rgba(0,0,0,.35));
                    visibility: hidden; }

      /* 箭頭＝一根桿子(i) + 一個三角頭(b)，用 CSS 畫，不進圖檔 */
      .fxptr-arrow { position: relative; height: 22px; visibility: hidden; opacity: 0;
                     filter: drop-shadow(0 4px 8px rgba(0,0,0,.35)); }
      .fxptr-arrow i { position: absolute; left: 0; top: 5px; right: 26px; height: 12px;
                       background: var(--c); border-radius: 6px; }
      .fxptr-arrow b { position: absolute; right: 0; top: 50%; transform: translateY(-50%);
                       width: 0; height: 0; border-top: 20px solid transparent;
                       border-bottom: 20px solid transparent; border-left: 30px solid var(--c); }
`;
