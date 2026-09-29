# CodeBrainy 實機截圖 runbook

在 CodeBrainy 練習場實機操作一輪，逐步截圖，補上講稿實作段落要用的「照著排」素材。

**這份是可攜的**——換一台電腦、換一門課都照這份走。所有數字都已在 2A4 實測過。

> 時序鐵則：**講稿定稿才開拍。**
> 2A5 邊拍邊想，拍了 37 張只用約 30 張——稿定了才知道哪一步只講一句、不需要單獨一張圖。

---

## 前置（換機器一定要先確認這四件事）

| 項目 | 說明 |
|---|---|
| **chrome-devtools MCP** | 必須裝。`take_screenshot` 帶 `filePath` 會寫出原始解析度 PNG，`crop-step.py` 才吃得到 |
| **登入** | 要人工登入。**用示範帳號，不要用真人學生帳號**——會拍到姓名與等級 |
| **介面語言／主題** | 中文或英文、深色或淺色，先講定。2A5 沒先問，重拍了兩輪 |
| **教案素材還在不在** | 2A4 踩過：教案寫的 `Sprite1` 已因商標下架，系統裡只剩 `Cat 2` |

### ⚠️ 不能用內建瀏覽器拍

`mcp__Claude_Browser__*` 的 `computer{screenshot}` 只回**縮圖**給模型看、不落檔，拿不到 2496px 原圖。
只能看，不能拍。

### ⚠️ 這條線不能拆給多個 Agent

操作截圖是一條**連續的狀態流**——先刪角色才能加貓、先加貓才能寫貓的程式。
兩個 Agent 同時操作同一個專案只會互相破壞。內部必須串行。

---

## 環境

```text
網址    https://exam.codepro123.online/playground/practice/
編輯器  TurboWarp
容器    同源 iframe #pg-scratch-iframe
入口    iframe.contentWindow 上直接有 vm、ScratchBlocks
```

同源代表可以直接進 `contentWindow` 取 `vm` 與 `ScratchBlocks`，不需要跨框架的特殊處理。

---

## 一、把畫面調成 16:9

**只能改寬度。** 編輯器高度被外層 `.content-wrapper`（`overflow:hidden`）鎖死在 **702px**——
把 iframe 或視窗調高沒有用：DOM 會回報新高度，但畫面只畫 702px，下面整片黑。

```js
document.querySelector('#pg-scratch-iframe').style.width = '1248px';
// → 1248 × 702，剛好 16:9
```

對應 `course.json`：

```json
"capture": { "dpr": 2, "box": [0, 46, 1248, 702] }
```

`box` 是 **CSS px** 的 `[x, y, w, h]`，`y=46` 是頁面上方工具列的高度。
`crop-step.py` 會自己乘上 `dpr` 換算成實際像素，所以**截圖要在 DPR=2 下拍**。

---

## 二、疊積木：走 API，不要拖滑鼠

Blockly **吃不到合成事件**——分類選單、flyout 按鈕都點不動。用滑鼠拖曳的做法會直接失敗。

```js
const SB = frame.contentWindow.ScratchBlocks;
const ws = SB.getMainWorkspace();

// 切左側積木分類
ws.getToolbox().setSelectedCategoryById('variables');

// 觸發分類裡的按鈕（例如「建立一個變數」）
ws.getButtonCallback('CREATE_VARIABLE')(/* ... */);

// 逐層疊出程式
SB.Xml.domToWorkspace(/* dom */, ws);
```

**每疊一層拍一張**，就是完整的「照著排」過程——而且每一張都可重現，
不像滑鼠操作會飄，重拍時位置對不上。

> 這幾個 API 是 2A4 實測可用的。TurboWarp 改版後若失效，先在 devtools console
> 手動試一次確認新寫法，再回來更新這份文件。

---

## 三、拍照與落地

```text
chrome-devtools take_screenshot（帶 filePath，原始解析度 PNG）
        ↓
python3 ../../../tools/produce/crop-step.py <整頁截圖.png> <檔名.jpg>
        ↓
hyperframes-project/assets/<slug>/steps/<檔名.jpg>   1620×911、JPEG q88
```

`crop-step.py` 從 cwd 的 `course.json` 讀 `stepsDir` 與 `capture`，
所以**一律 `cd lessons/<slug>/scripts/` 之後再執行**。

### 命名慣例（沿用 2A4）

`A01-playground`、`A02-sprite-button`、`A03-sprite-library`、`A04-cat-added`……

兩位數序號 + 這一步在做什麼。序號決定講稿裡的出現順序，不要跳號。

---

## 四、整張太小的話：再裁一次

整張編輯器塞進 1000px 寬的卡片後，積木字高只剩約 10px，學生根本看不到。
**與其加紅框框一小塊，不如先裁再放大**——同一張卡片就能塞下清楚的積木。

參考 `lessons/_reference-2A4/scripts/crop-regions.py`，區域用佔整張的百分比 `[x, y, w, h]`：

```python
PALETTE = [0, 6, 30, 86]     # 左側積木分類 + 積木清單
DIALOG  = [30, 8, 40, 64]    # 中央跳出的小視窗
STAGE   = [58, 5, 42, 66]    # 右上角舞台
ADD_BTN = [78, 70, 22, 30]   # 右下角的加入角色／背景按鈕
```

這支是**每門課自己一份**（版面不同、要強調的地方不同），複製過去改 `REGIONS` 即可。

---

## 五、拍完之後

紅框座標用 `measure-code.py` 量，不要目測。
拍完進 `check-frames.mjs` 這道閘門（上限 2 次），Agent 逐張判讀「框有沒有指到該指的東西」。

2A5 這關抓到的三種 NG：

| 症狀 | 例 |
|---|---|
| 框到空白處 | 用了「操作後」的截圖，但旁白說「按那個按鈕」——按鈕已經不在畫面上 |
| 框太大沒指到目標 | 框住整個程式區，但旁白說的是「那個小箭頭」 |
| 被畫面元素遮住 | 框放在最左側，被 Cooper 的對話框整個蓋住 |

---

## 六、2A1 補充（換機器實測）

### 尺寸不要照抄，要現場量

runbook 原本寫「高度鎖死 702px、寬度設 1248」，那是**當時那台的視窗大小**。
2A1 這台量到的是 **1440×810 @ DPR 2**（實拍 2880×1620），對應：

```json
"capture": { "dpr": 2, "box": [0, 46, 1440, 810] }
```

固定的只有兩件事：`y=46` 是上方 CodeBrainy 工具列的高度，
以及「只能改寬度、高度由 `.content-wrapper` 給」。**每次換機器都要重量一次。**

用 `emulate` 設 viewport 就能同時拿到想要的 DPR：

```text
mcp__chrome-devtools__emulate  viewport: "1600x856x2"
→ iframe 變成 1440×810，正好 16:9
```

### 每張拍攝前都要重設寬度與捲動

兩個會讓裁切基準跑掉的動作：

- **切換語言會重載編輯器**，把 `iframe.style.width` 還原
- **頁面捲動**會讓 `y=46` 的裁切原點對不上（B04 第一次拍就把工具列切掉了）

所以每張拍攝前固定做這兩件事：

```js
window.scrollTo(0, 0);
if (f.clientWidth !== 1440) { f.style.width = '1440px'; f.contentWindow.dispatchEvent(new Event('resize')); }
```

### 合成事件打不開的東西，用真實 hover / click

- **頂部選單**（Settings）：合成 `mousedown/mouseup/click` 可以打開
- **子選單**（Language）：合成事件**打不開**，要用 `mcp__chrome-devtools__hover` 的真實滑鼠事件
- **語言清單**捲到目前語言的位置，English 要自己 `scrollIntoView` 才在畫面上

查詢 DOM 時不要用 `e.children.length === 0` 當「葉節點」條件——會把 `<style>` 標籤整包撈出來。
用 `[class*="menu-item"]` 這類明確的選擇器。

### 疊積木用 XML，逐階段清空重建

`ScratchBlocks.Xml.domToWorkspace` 疊完之後記得：

```js
ws.setScale(1.0);    // 預設 0.675，積木字太小
ws.scrollCenter();   // 不置中的話堆疊會貼在畫面底部，紅框不好框
```

每一階段 `ws.clear()` 再重載整份 XML，比增量疊可靠（重跑時位置完全一致）。

### 教案截圖裡有個資

教案的平台操作截圖常常是老師用**自己的帳號**拍的——登入頁的帳號欄、側邊欄的姓名與等級都會入鏡
（2A1 的 p.3~p.5 三張都有）。**不能直接放進影片。**

處理方式寫在課程的 `prep-assets.py`：登入頁只取左半邊的品牌區（右半邊整塊是登入表單，不要）、
側邊欄的姓名列用側邊欄底色蓋掉。去識別化的理由要寫在腳本註解裡，重跑才不會漏掉。

換課程時這一步要**重做一次**，不要假設乾淨。

### 進考試專區需要有效的考試編號

d01 那四張（首頁 → 考試專區 → 輸入編號 → 開始作答）要走真實的測驗流程。
沒有編號就用教案原圖（教案 p.3~p.7 剛好有完整四張），不要硬闖。
