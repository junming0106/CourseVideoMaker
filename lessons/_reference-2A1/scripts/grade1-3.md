# 2A1 — 1~3 年級教學影片講稿

> 這份文件由 `script-data.mjs` 產生，**請勿手動編輯**。
> 要改講稿請改 `script-data.mjs`，再依序跑 `build-composition.mjs` → `mk-audio-bed.py` → `gen-script-md.mjs`。

- 目標年級：1~3 年級
- 角色：Cooper ＝ 老師（全程站左側）；Max ＝ 好奇搗蛋的學生；Cora ＝ 貼心附和的學生
- 片頭：`assets/opening.mp4`（10 秒）／音樂床：`assets/2A1/bgm.m4a`（音樂 + 音效預混）
- 總長：25 分 33 秒／63 段／403 句對白／11 題練習／2 段程式碼展示／406 顆音效
- 節奏：每句停留＝實際語音長度 + 0.05 秒，換人接話間隔 0.2 秒；思考時間一律用 `hold` 明確指定
- 配音：Cooper ＝ 子睿（Classic）／Max ＝ 軒軒（Neo）／Cora ＝ 泡泡（Neo）
- 視覺：**完全不使用 emoji**，一律用 Scratch 官方素材、教案原始程式碼截圖與 CSS 繪製
- ★ 標記的段落 = 展示教案 PPT 上的原始 Scratch 程式截圖，學生照著排


## 開場

### 痛點提問（開場三秒）

畫面：`hook`
- **Cooper**（greeting）：「小朋友大家好！」　`1.80s`
  - 配音語氣：warm and cheerful
- **Cooper**（thinking）：「為什麼你畫好的雪人，怎麼點都不會動？」　`3.75s`
  - 配音語氣：curious and a little puzzled
- **Max**（thinking）：「我的雪人，好像在罰站耶。」　`2.29s`
  - 配音唸法：我的雪人，好像在罰站耶
  - 配音語氣：sheepish and a little embarrassed <sigh>


## 開場

### 先看成品（p.12／p.30 的雪人走路動畫）

畫面：`demoVideo`
- **Cooper**（guide_right）：「下課以前，你會做出這個！」　`2.71s`
- **Max**（eureka）：「哇！雪人自己走起來了！」　`2.45s`
  - 配音語氣：excited and amazed <gasp>


## 開場

### 學習目標＋四個任務（p.2）

畫面：`goals`（統一教室背景）
- **Cooper**（guide_right）：「看完這支影片，你會做出會走路的雪人，也會知道牠為什麼能走。」　`5.78s`
  - 配音唸法：看完這支影片，你會做出會走路的雪人，也會知道牠為什麼能走
  - 配音語氣：warm and clear
- **Cora**（greeting）：「我是 Cora，聽起來好有趣！」　`2.33s`
- **Cooper**（thinking）：「想不想也做一隻這樣的雪人？」　`2.88s`
  - 配音語氣：curious and encouraging
- **Max**（greeting）：「想！我是 Max，我想我想！」　`2.29s`
  - 配音語氣：excited and amazed
- **Cooper**（greeting）：「我是 Cooper 老師，我們先看看今天的四個任務。」　`4.23s`
  - 配音唸法：我是 Cooper 老師，我們先看看今天的四個任務
- **Cooper**（guide_left）：「第一，認識 Scratch 和 CodeBrainy。」　`3.06s`
  - 配音唸法：第一，認識 Scratch 和 CodeBrainy
- **Max**（talking）：「第二，畫一隻我的雪人！」　`2.09s`
- **Cora**（talking）：「第三，來挑戰，看看觀念清不清楚。」　`3.05s`
  - 配音唸法：第三，來挑戰，看看觀念清不清楚
- **Cooper**（talking）：「第四，最後有複習時間。」　`2.77s`
  - 配音唸法：第四，最後有複習時間
- **Cora**（encourage）：「四個任務，我們一個一個完成！」　`2.49s`


## 第一部分：認識 Scratch 與 CodeBrainy

### 章節卡：認識 Scratch

畫面：`chapter`
- **Cooper**（talking）：「第一章，認識 Scratch。」　`2.24s`
  - 配音唸法：第一章，認識 Scratch

### ★ 認識 CodeBrainy（p.4）

畫面：`codebrainy`（統一教室背景）
- **Cooper**（thinking）：「你上課和考試，都在哪個網站呢？」　`3.40s`
  - 配音語氣：curious and encouraging
- **Max**（talking）：「我知道！是有可愛動物的那個網站！」　`2.77s`
- **Cooper**（talking）：「答對了，它叫做 CodeBrainy。」　`2.86s`
  - 配音唸法：答對了，它叫做 CodeBrainy
- **Cooper**（guide_right）：「上課和考試，都在這裡。」　`2.66s`
  - 配音唸法：上課和考試，都在這裡
- **Cora**（listening）：「裡面還有遊樂場，可以練習寫程式。」　`3.85s`
  - 配音唸法：裡面還有遊樂場，可以練習寫程式
- **Cooper**（talking）：「今天，我們就在遊樂場裡畫雪人。」　`3.31s`
  - 配音唸法：今天，我們就在遊樂場裡畫雪人

### 【實作】進入遊樂場（p.5~6）

畫面：`demoSteps`（統一教室背景）
- **Cooper**（talking）：「光用說的不夠，我們直接做一次。」　`3.28s`
  - 配音唸法：光用說的不夠，我們直接做一次
- **Cooper**（guide_left）：「先按左邊的，遊樂場管理。」　`2.84s`
  - 配音唸法：先按左邊的，遊樂場管理
- **Cora**（listening）：「中間就會出現，加入遊樂場。」　`2.73s`
  - 配音唸法：中間就會出現，加入遊樂場
- **Cooper**（guide_right）：「再按這顆，直接進入遊樂場。」　`2.97s`
  - 配音唸法：再按這顆，直接進入遊樂場
- **Max**（thinking）：「老師，我要打編號嗎？」　`1.89s`
- **Cooper**（talking）：「老師如果給你編號，才需要打。」　`3.20s`
  - 配音唸法：老師如果給你編號，才需要打
- **Cooper**（talking）：「每堂課的編號都不一樣喔。今天直接進入就好。」　`4.66s`
  - 配音唸法：每堂課的編號都不一樣喔。今天直接進入就好
- **Max**（eureka）：「哇，進來了！」　`1.45s`
  - 配音語氣：excited and amazed
- **Cooper**（thinking）：「你也打開遊樂場了嗎？沒有的話先暫停影片。」　`4.77s・停頓 4s`
  - 配音唸法：你也打開遊樂場了嗎？沒有的話先暫停影片
  - 配音語氣：curious and encouraging

### 看懂畫面：舞台、程式區（p.7 上）

畫面：`uiAreas`（統一教室背景）
- **Cooper**（talking）：「進到遊樂場，就是 Scratch 的畫面。」　`3.25s`
  - 配音唸法：進到遊樂場，就是 Scratch 的畫面
- **Cooper**（thinking）：「這麼多區塊，你猜哪一區是舞台？」　`3.17s`
  - 配音語氣：curious and encouraging
- **Max**（talking）：「是不是角色站著的那一塊？」　`2.65s`
- **Cooper**（talking）：「沒錯！右上角那一大塊，就是舞台。」　`3.57s`
  - 配音唸法：沒錯！右上角那一大塊，就是舞台
- **Cooper**（guide_left）：「左邊這一排，是程式家族。」　`2.92s`
  - 配音唸法：左邊這一排，是程式家族
- **Cora**（listening）：「中間大大的空白，是程式區。」　`2.93s`
  - 配音唸法：中間大大的空白，是程式區
- **Cooper**（talking）：「積木要拖到程式區，一塊一塊組起來。」　`3.76s`
  - 配音唸法：積木要拖到程式區，一塊一塊組起來
- **Max**（eureka）：「像在地板上玩積木！」　`2.13s`
  - 配音語氣：excited and amazed

### 看懂畫面：角色與背景設定（p.7 下）

畫面：`uiAreas`（統一教室背景）
- **Cooper**（guide_right）：「舞台的下面，是角色設定。」　`2.82s`
  - 配音唸法：舞台的下面，是角色設定
- **Cora**（listening）：「這裡可以改角色的名字、位置和大小。」　`3.77s`
  - 配音唸法：這裡可以改角色的名字、位置和大小
- **Cooper**（guide_right）：「再往下，是角色列表。」　`2.47s`
  - 配音唸法：再往下，是角色列表
- **Max**（talking）：「所有的角色，都排在這裡！」　`2.29s`
- **Cooper**（guide_right）：「最右邊，是背景設定，可以換舞台的背景。」　`3.83s`
  - 配音唸法：最右邊，是背景設定，可以換舞台的背景
- **Cooper**（thinking）：「你的畫面上，也看到這幾區了嗎？」　`3.19s`
  - 配音語氣：curious and encouraging
- **Cora**（talking）：「我看到了，一區一區都找到了。」　`2.85s`
  - 配音唸法：我看到了，一區一區都找到了

### 【練習題 1】積木放哪一區

畫面：`quizAB`（統一教室背景）
- **Cooper**（thinking）：「小考一下！」　`1.53s`
- **Cooper**（guide_right）：「想排積木，要用哪一區？」　`2.62s`
- **Cooper**（talking）：「A 是中間的程式區，B 是右邊的舞台。」　`3.65s・停頓 5s`
  - 配音唸法：A 是中間的程式區，B 是右邊的舞台
- **Cora**（encourage）：「我選 A！」　`1.33s`
- **Cooper**（talking）：「答對了！積木要排在程式區。」　`3.05s`
  - 配音唸法：答對了！積木要排在程式區
- **Cooper**（talking）：「舞台是用來看結果的地方。」　`2.71s`
  - 配音唸法：舞台是用來看結果的地方

### 【實作】語言改成英文（p.8）

畫面：`demoSteps`（統一教室背景）
- **Cooper**（talking）：「接下來，我們把語言改成英文。」　`3.11s`
  - 配音唸法：接下來，我們把語言改成英文
- **Max**（thinking）：「英文？我看不懂啦！」　`2.05s`
  - 配音語氣：sheepish and a little embarrassed
- **Cooper**（talking）：「這樣你的積木，才會跟老師的一模一樣。」　`3.51s`
  - 配音唸法：這樣你的積木，才會跟老師的一模一樣
- **Cooper**（guide_left）：「先按左上角的小齒輪，再選 Language。」　`3.78s`
  - 配音唸法：先按左上角的小齒輪，再選 Language
- **Cora**（listening）：「裡面有好多國家的語言。」　`2.85s`
  - 配音唸法：裡面有好多國家的語言
- **Cooper**（guide_right）：「往下找到 English，按一下。」　`2.74s`
  - 配音唸法：往下找到 English，按一下
- **Max**（eureka）：「真的變成英文了！」　`1.53s`
  - 配音語氣：excited and amazed
- **Cora**（encourage）：「別怕，積木上的字很短，看幾次就記住了。」　`4.09s`
  - 配音唸法：別怕，積木上的字很短，看幾次就記住了
- **Cooper**（thinking）：「你的畫面，也變成英文了嗎？」　`2.88s・停頓 4s`
  - 配音語氣：curious and encouraging

### 存檔與命名（p.9）

畫面：`saveAs`（統一教室背景）
- **Cooper**（talking）：「做完專題，一定要記得存檔。」　`3.04s`
  - 配音唸法：做完專題，一定要記得存檔
- **Cooper**（guide_right）：「按上面的 File，再按 Save as。」　`2.85s`
  - 配音唸法：按上面的 File，再按 Save as
- **Cora**（listening）：「檔案就會存在你自己的電腦裡。」　`2.73s`
  - 配音唸法：檔案就會存在你自己的電腦裡
- **Cooper**（thinking）：「如果每個檔案，都叫「專題」，會怎樣？」　`3.63s`
  - 配音唸法：如果每個檔案，都叫專題，會怎樣？
  - 配音語氣：curious and encouraging
- **Max**（talking）：「我會找不到哪一個是雪人！」　`2.29s`
- **Cooper**（talking）：「對！所以每個專題，都要取清楚的名字。」　`3.85s`
  - 配音唸法：對！所以每個專題，都要取清楚的名字
- **Cora**（talking）：「就像在書包上，貼名字貼紙。」　`2.97s`
  - 配音唸法：就像在書包上，貼名字貼紙
- **Cooper**（talking）：「今天的專題，就取名叫「雪人」吧。」　`3.20s`
  - 配音唸法：今天的專題，就取名叫雪人吧

### 程式家族 1：動作、外觀、音效（p.10）

畫面：`families`（統一教室背景）
- **Cooper**（guide_left）：「左邊這一排，叫做程式家族。」　`3.08s`
  - 配音唸法：左邊這一排，叫做程式家族
- **Cooper**（talking）：「每個家族，都有自己的顏色。」　`2.88s`
  - 配音唸法：每個家族，都有自己的顏色
- **Cooper**（guide_left）：「藍色的，叫動作，英文是 Motion。」　`3.42s`
  - 配音唸法：藍色的，叫動作，英文是 Motion
- **Cora**（listening）：「它讓角色走路、轉彎、跑到別的地方。」　`3.89s`
  - 配音唸法：它讓角色走路、轉彎、跑到別的地方
- **Max**（thinking）：「那紫色的呢？」　`1.45s`
- **Cooper**（talking）：「紫色是外觀，英文是 Looks。」　`2.62s`
  - 配音唸法：紫色是外觀，英文是 Looks
- **Cooper**（talking）：「可以換造型，還能躲起來。」　`2.73s`
  - 配音唸法：可以換造型，還能躲起來
- **Cora**（talking）：「粉紅色是音效，英文是 Sound。」　`2.69s`
  - 配音唸法：粉紅色是音效，英文是 Sound
- **Max**（eureka）：「音效會讓角色發出聲音！」　`2.73s`
  - 配音語氣：excited and amazed

### 程式家族 2：事件、控制（p.10）

畫面：`families`（統一教室背景）
- **Cooper**（guide_left）：「黃色是事件，英文是 Events。」　`2.79s`
  - 配音唸法：黃色是事件，英文是 Events
- **Cooper**（talking）：「事件像門鈴，按一下，程式才會開始。」　`3.78s`
  - 配音唸法：事件像門鈴，按一下，程式才會開始
- **Cora**（listening）：「像是按下綠旗，程式就開始跑了。」　`2.97s`
  - 配音唸法：像是按下綠旗，程式就開始跑了
- **Cooper**（guide_left）：「橘色是控制，英文是 Control。」　`3.00s`
  - 配音唸法：橘色是控制，英文是 Control
- **Max**（thinking）：「控制是管什麼的呀？」　`1.77s`
- **Cooper**（talking）：「它像指揮官，叫大家一直重複做事。」　`3.74s`
  - 配音唸法：它像指揮官，叫大家一直重複做事
- **Cora**（talking）：「今天要用的重複，就在橘色裡面。」　`3.41s`
  - 配音唸法：今天要用的重複，就在橘色裡面

### 程式家族 3：偵測、運算、變數、函式（p.10）

畫面：`families`（統一教室背景）
- **Cooper**（guide_left）：「淺藍色是偵測，英文是 Sensing。」　`3.20s`
  - 配音唸法：淺藍色是偵測，英文是 Sensing
- **Cooper**（talking）：「偵測像眼睛，會看有沒有碰到東西。」　`3.55s`
  - 配音唸法：偵測像眼睛，會看有沒有碰到東西
- **Cora**（talking）：「綠色是運算，像一台計算機。」　`2.93s`
  - 配音唸法：綠色是運算，像一台計算機
- **Max**（talking）：「橘紅色是變數，像一個收納箱。」　`3.13s`
  - 配音唸法：橘紅色是變數，像一個收納箱
- **Cooper**（talking）：「最後一個是函式，英文叫 My Blocks。」　`3.39s`
  - 配音唸法：最後一個是函式，英文叫 My Blocks
- **Cooper**（talking）：「可以自己做出，新的魔法積木。」　`3.10s`
  - 配音唸法：可以自己做出，新的魔法積木
- **Cooper**（thinking）：「九個家族，你覺得今天要全部學完嗎？」　`3.77s`
  - 配音語氣：curious and encouraging
- **Max**（talking）：「要！我全部都要學！」　`1.89s`
- **Cooper**（talking）：「不用喔，今天只用四個家族。」　`3.11s`
  - 配音唸法：不用喔，今天只用四個家族
- **Cora**（listening）：「動作、外觀、事件，還有控制。」　`3.25s`
  - 配音唸法：動作、外觀、事件，還有控制
- **Cooper**（talking）：「一次學一點，才不會亂掉。」　`2.66s`
  - 配音唸法：一次學一點，才不會亂掉

### 【練習題 2】去哪個家族找

畫面：`quizAB`（統一教室背景）
- **Cooper**（thinking）：「再考一題！」　`1.54s`
- **Cooper**（guide_right）：「想讓角色往前走，要去哪個家族找積木？」　`4.09s`
- **Cooper**（talking）：「A 是動作 Motion，B 是音效 Sound。」　`3.28s・停頓 5s`
  - 配音唸法：A 是動作 Motion，B 是音效 Sound
- **Max**（eureka）：「我選 A！走路就是動作！」　`2.37s`
  - 配音語氣：excited and amazed
- **Cooper**（talking）：「答對了，你抓到重點：走路是動作。」　`3.75s`
  - 配音唸法：答對了，你抓到重點：走路是動作


## 第二部分：角色與背景

### 章節卡：角色和背景

畫面：`chapter`
- **Cooper**（talking）：「第二章，角色和背景。」　`2.40s`
  - 配音唸法：第二章，角色和背景

### 當小小繪畫家（p.12）

畫面：`title2`（統一教室背景）
- **Cooper**（talking）：「這一章，我們來當小小繪畫家。」　`3.18s`
  - 配音唸法：這一章，我們來當小小繪畫家
- **Cooper**（guide_right）：「先學怎麼新增角色，也學怎麼刪掉角色。」　`4.21s`
  - 配音唸法：先學怎麼新增角色，也學怎麼刪掉角色
- **Cora**（listening）：「然後用繪畫工具，畫出自己的雪人。」　`3.17s`
  - 配音唸法：然後用繪畫工具，畫出自己的雪人
- **Max**（eureka）：「我最喜歡畫畫了！」　`1.73s`
  - 配音語氣：excited and amazed
- **Cooper**（talking）：「畫好以後，還要讓牠動起來喔。」　`3.11s`
  - 配音唸法：畫好以後，還要讓牠動起來喔

### 角色小檔案：名字與位置（p.13 上）

畫面：`spriteInfo`（統一教室背景）
- **Cooper**（guide_left）：「舞台下面這一排，是角色的小檔案。」　`3.61s`
  - 配音唸法：舞台下面這一排，是角色的小檔案
- **Cooper**（guide_right）：「最左邊，是角色的名字，現在叫 Sprite1。」　`4.05s`
  - 配音唸法：最左邊，是角色的名字，現在叫 Sprite1
- **Cora**（listening）：「名字可以自己改喔。」　`2.05s`
  - 配音唸法：名字可以自己改喔
- **Cooper**（guide_right）：「後面的 x 和 y，是角色站的位置。」　`3.44s`
  - 配音唸法：後面的 x 和 y，是角色站的位置
- **Max**（thinking）：「位置？要怎麼算呀？」　`1.69s`
- **Cooper**（talking）：「x 是左右，y 是上下。」　`2.61s`
  - 配音唸法：x 是左右，y 是上下
- **Cooper**（talking）：「就像教室座位，第幾排，第幾個。」　`3.42s`
  - 配音唸法：就像教室座位，第幾排，第幾個
- **Cora**（listening）：「數字改了，角色就跑到別的地方。」　`3.05s`
  - 配音唸法：數字改了，角色就跑到別的地方

### 角色小檔案：顯示、大小、方向（p.13 下）

畫面：`spriteInfo`（統一教室背景）
- **Cooper**（guide_left）：「再看下一排。」　`1.60s`
  - 配音唸法：再看下一排
- **Cooper**（talking）：「眼睛打開，角色看得見。」　`2.76s`
  - 配音唸法：眼睛打開，角色看得見
- **Cooper**（talking）：「眼睛關起來，角色就躲起來了。」　`3.34s`
  - 配音唸法：眼睛關起來，角色就躲起來了
- **Max**（eureka）：「像在玩躲貓貓！」　`1.77s`
  - 配音語氣：excited and amazed
- **Cooper**（guide_right）：「Size 是大小，一百，就是原來的大小。」　`3.69s`
  - 配音唸法：Size 是大小，一百，就是原來的大小
- **Cooper**（thinking）：「想讓角色變大，數字要變大，還是變小？」　`4.05s`
  - 配音語氣：curious and encouraging
- **Cora**（talking）：「要變大！」　`1.21s`
- **Cooper**（talking）：「沒錯，數字越大，角色就越大。」　`3.28s`
  - 配音唸法：沒錯，數字越大，角色就越大
- **Cooper**（guide_right）：「Direction 是方向，九十，就是面向右邊。」　`3.98s`
  - 配音唸法：Direction 是方向，九十，就是面向右邊
- **Max**（talking）：「最下面的垃圾桶，是不是把角色丟掉？」　`3.61s`
- **Cooper**（talking）：「沒錯，按垃圾桶，角色就刪掉了。」　`3.64s`
  - 配音唸法：沒錯，按垃圾桶，角色就刪掉了

### 新增角色的四個按鈕（p.14）

畫面：`addSprite`（統一教室背景）
- **Cooper**（guide_right）：「想要新的角色，按右下角這顆按鈕。」　`3.49s`
  - 配音唸法：想要新的角色，按右下角這顆按鈕
- **Cooper**（talking）：「按一下，上面會跑出四個小按鈕。」　`3.33s`
  - 配音唸法：按一下，上面會跑出四個小按鈕
- **Cora**（listening）：「最上面是上傳，可以放自己的圖片。」　`3.41s`
  - 配音唸法：最上面是上傳，可以放自己的圖片
- **Max**（eureka）：「閃閃發亮的是隨機，讓電腦幫你挑！」　`3.69s`
  - 配音語氣：excited and amazed
- **Cooper**（talking）：「畫筆是繪製，自己畫一個角色。」　`3.24s`
  - 配音唸法：畫筆是繪製，自己畫一個角色
- **Cora**（talking）：「放大鏡是選擇，從角色庫裡面找。」　`3.49s`
  - 配音唸法：放大鏡是選擇，從角色庫裡面找
- **Cooper**（thinking）：「想畫自己的雪人，要按哪一個？」　`3.15s`
  - 配音語氣：curious and encouraging
- **Max**（talking）：「畫筆！」　`0.89s`
- **Cooper**（talking）：「沒錯，等一下就用畫筆來畫雪人。」　`3.60s`
  - 配音唸法：沒錯，等一下就用畫筆來畫雪人

### 換背景（p.15）

畫面：`addBackdrop`（統一教室背景）
- **Cooper**（guide_right）：「背景也是一樣的做法。」　`2.27s`
  - 配音唸法：背景也是一樣的做法
- **Cooper**（talking）：「按右下角，背景的按鈕。」　`2.59s`
  - 配音唸法：按右下角，背景的按鈕
- **Cora**（listening）：「也有上傳、隨機、繪製和選擇。」　`3.01s`
  - 配音唸法：也有上傳、隨機、繪製和選擇
- **Cooper**（talking）：「角色是演員，背景是布景。」　`2.93s`
  - 配音唸法：角色是演員，背景是布景
- **Cooper**（thinking）：「演員和布景，哪一個會走來走去？」　`3.39s`
  - 配音語氣：curious and encouraging
- **Max**（talking）：「演員！布景站著不動！」　`2.21s`
- **Cooper**（talking）：「對，所以會動的程式，要寫在角色身上。」　`4.07s`
  - 配音唸法：對，所以會動的程式，要寫在角色身上

### 右鍵的三個功能（p.16）

畫面：`rightClick`（統一教室背景）
- **Cooper**（guide_right）：「對著角色按滑鼠右鍵，會跑出三個功能。」　`4.04s`
  - 配音唸法：對著角色按滑鼠右鍵，會跑出三個功能
- **Cooper**（guide_right）：「第一個，duplicate，是複製。」　`2.90s`
  - 配音唸法：第一個，duplicate，是複製
- **Max**（thinking）：「複製？變出兩隻一模一樣的嗎？」　`2.61s`
- **Cooper**（talking）：「對，就像影印機。」　`2.03s`
  - 配音唸法：對，就像影印機
- **Cooper**（guide_right）：「第二個，export，是把角色存成檔案。」　`4.09s`
  - 配音唸法：第二個，export，是把角色存成檔案
- **Cora**（listening）：「存成檔案，就可以送給朋友。」　`2.57s`
  - 配音唸法：存成檔案，就可以送給朋友
- **Cooper**（guide_right）：「第三個，delete，是刪除。」　`2.81s`
  - 配音唸法：第三個，delete，是刪除
- **Cooper**（thinking）：「想多一隻一模一樣的角色，要選哪一個？」　`3.76s`
  - 配音語氣：curious and encouraging
- **Max**（eureka）：「複製，duplicate！」　`1.61s`
  - 配音語氣：excited and amazed
- **Cooper**（talking）：「沒錯，右鍵再按 duplicate，就會多一隻。」　`3.89s`
  - 配音唸法：沒錯，右鍵再按 duplicate，就會多一隻

### 造型就是動畫的每一格（p.17）

畫面：`costumes`（統一教室背景）
- **Cooper**（talking）：「再告訴你們一個秘密：角色的造型。」　`3.51s`
  - 配音唸法：再告訴你們一個秘密：角色的造型
- **Cooper**（guide_right）：「點上面的 Costumes，就是造型。」　`3.12s`
  - 配音唸法：點上面的 Costumes，就是造型
- **Cooper**（talking）：「你看，這隻貓咪有兩個造型。」　`2.90s`
  - 配音唸法：你看，這隻貓咪有兩個造型
- **Max**（thinking）：「兩個一樣的貓咪，有什麼用？」　`2.21s`
- **Cooper**（talking）：「不一樣喔，兩個的姿勢不一樣。」　`2.86s`
  - 配音唸法：不一樣喔，兩個的姿勢不一樣
- **Cooper**（talking）：「輪流換造型，看起來就像在走路！」　`3.54s`
- **Cooper**（thinking）：「想一想，翻書動畫是不是也這樣？」　`3.43s`
  - 配音語氣：curious and encouraging
- **Cora**（talking）：「一頁一頁快快翻，圖就動起來了！」　`3.17s`
- **Cooper**（talking）：「沒錯，造型就是動畫的每一格。」　`3.24s`
  - 配音唸法：沒錯，造型就是動畫的每一格

### 【練習題 3】要幾個造型

畫面：`quizAB`（統一教室背景）
- **Cooper**（thinking）：「小考一下！」　`1.53s`
- **Cooper**（guide_right）：「想讓貓咪看起來像在走路，需要幾個造型？」　`4.22s`
- **Cooper**（talking）：「A 是一個造型，B 是兩個以上。」　`3.00s・停頓 5s`
  - 配音唸法：A 是一個造型，B 是兩個以上
- **Cora**（encourage）：「我選 B！輪流換，才像在走路。」　`3.01s`
  - 配音唸法：我選 B！輪流換，才像在走路
- **Cooper**（talking）：「答對了！造型要輪流換，才會動起來。」　`3.86s`
  - 配音唸法：答對了！造型要輪流換，才會動起來


## 第三部分：畫雪人

### 章節卡：畫一隻雪人

畫面：`chapter`
- **Cooper**（talking）：「第三章，畫一隻雪人。」　`2.41s`
  - 配音唸法：第三章，畫一隻雪人

### 打開畫布（p.18）

畫面：`openPaint`（統一教室背景）
- **Cooper**（talking）：「現在，我們要畫雪人了！」　`2.54s`
- **Cooper**（guide_right）：「按角色按鈕裡面的畫筆。」　`2.55s`
  - 配音唸法：按角色按鈕裡面的畫筆
- **Cora**（listening）：「畫布就打開了。」　`1.89s`
  - 配音唸法：畫布就打開了
- **Max**（eureka）：「一張空白的畫紙！」　`1.69s`
  - 配音語氣：excited and amazed
- **Cooper**（talking）：「除了選現成的角色，也可以畫自己的人物。」　`3.85s`
  - 配音唸法：除了選現成的角色，也可以畫自己的人物
- **Cooper**（thinking）：「如果可以畫，你最想畫什麼角色？」　`3.33s`
  - 配音語氣：curious and encouraging
- **Max**（talking）：「我想畫恐龍！」　`1.45s`
- **Cooper**（talking）：「好呀，今天先畫雪人，回家再畫恐龍。」　`3.92s`
  - 配音唸法：好呀，今天先畫雪人，回家再畫恐龍

### 畫布上方：顏色與粗細（p.19 左）

畫面：`paintTop`（統一教室背景）
- **Cooper**（talking）：「畫布上面，有一排按鈕。」　`2.50s`
  - 配音唸法：畫布上面，有一排按鈕
- **Cooper**（guide_left）：「最重要的，是 Fill 和 Outline。」　`2.76s`
  - 配音唸法：最重要的，是 Fill 和 Outline
- **Cooper**（talking）：「Fill 是填滿，就是圖形裡面的顏色。」　`3.67s`
  - 配音唸法：Fill 是填滿，就是圖形裡面的顏色
- **Cooper**（talking）：「Outline 是外框，就是圖形的邊線。」　`3.54s`
  - 配音唸法：Outline 是外框，就是圖形的邊線
- **Cora**（listening）：「旁邊的數字，是邊線的粗細。」　`2.81s`
  - 配音唸法：旁邊的數字，是邊線的粗細
- **Max**（thinking）：「數字越大，線就越粗嗎？」　`2.25s`
- **Cooper**（talking）：「沒錯，想要粗一點，就把數字改大。」　`3.67s`
  - 配音唸法：沒錯，想要粗一點，就把數字改大

### 畫布上方：複製、群組、圖層、翻轉（p.19 右）

畫面：`paintTop`（統一教室背景）
- **Cooper**（guide_right）：「中間有 Copy 和 Paste，就是複製、貼上。」　`3.82s`
  - 配音唸法：中間有 Copy 和 Paste，就是複製、貼上
- **Cooper**（talking）：「Group 是把好幾個東西，綁在一起。」　`3.35s`
  - 配音唸法：Group 是把好幾個東西，綁在一起
- **Cora**（listening）：「這樣就可以一起搬走！」　`1.73s`
- **Cooper**（talking）：「Forward，是往前移一層。」　`2.73s`
  - 配音唸法：Forward，是往前移一層
- **Cooper**（talking）：「Backward，是往後移一層。」　`2.73s`
  - 配音唸法：Backward，是往後移一層
- **Max**（thinking）：「像疊紙張，看誰壓在誰上面？」　`2.77s`
- **Cooper**（talking）：「最後 Flip，是翻轉，左右或上下翻過來。」　`4.06s`
  - 配音唸法：最後 Flip，是翻轉，左右或上下翻過來
- **Cooper**（thinking）：「如果帽子被頭蓋住了，該怎麼辦？」　`3.27s`
  - 配音語氣：curious and encouraging
- **Cora**（talking）：「把帽子往前移一層！」　`2.17s`
- **Cooper**（talking）：「對，按 Front，帽子就跑到最上面。」　`3.63s`
  - 配音唸法：對，按 Front，帽子就跑到最上面

### 畫布旁邊的工具（p.20）

畫面：`paintTools`（統一教室背景）
- **Cooper**（talking）：「畫布旁邊，有一排工具。」　`2.71s`
  - 配音唸法：畫布旁邊，有一排工具
- **Cooper**（talking）：「今天會用到五個。」　`2.02s`
  - 配音唸法：今天會用到五個
- **Cooper**（guide_right）：「第一個是選取，點一下，就能把東西搬走。」　`4.05s`
  - 配音唸法：第一個是選取，點一下，就能把東西搬走
- **Cora**（talking）：「第二個是畫圓，畫頭和身體。」　`2.89s`
  - 配音唸法：第二個是畫圓，畫頭和身體
- **Max**（talking）：「第三個是畫線，畫雪人的手！」　`2.85s`
- **Cooper**（talking）：「第四個是畫矩形，畫帽子。」　`2.83s`
  - 配音唸法：第四個是畫矩形，畫帽子
- **Cooper**（talking）：「第五個是塑型，可以把方形，改成尖尖的。」　`4.11s`
  - 配音唸法：第五個是塑型，可以把方形，改成尖尖的
- **Cora**（listening）：「另外還有畫筆、橡皮擦、文字和油漆桶。」　`3.97s`
  - 配音唸法：另外還有畫筆、橡皮擦、文字和油漆桶

### 【練習題 4】該選哪個工具

畫面：`quizAB`（統一教室背景）
- **Cooper**（thinking）：「換你想一想！」　`1.55s`
- **Cooper**（guide_right）：「想畫雪人圓圓的身體，要選哪個工具？」　`3.79s`
- **Cooper**（talking）：「A 是畫圓，B 是畫線。」　`2.52s・停頓 5s`
  - 配音唸法：A 是畫圓，B 是畫線
- **Max**（eureka）：「我選 A！圓圓的就要用圓！」　`2.73s`
  - 配音語氣：excited and amazed
- **Cooper**（talking）：「答對了，畫線是用來畫雪人的手。」　`3.32s`
  - 配音唸法：答對了，畫線是用來畫雪人的手

### 看看要畫成什麼樣子（p.21）

畫面：`snowmanGoal`（統一教室背景）
- **Cooper**（guide_right）：「看，這就是我們要畫的雪人。」　`2.81s`
  - 配音唸法：看，這就是我們要畫的雪人
- **Cooper**（talking）：「有頭、有身體，還有兩隻手。」　`3.06s`
  - 配音唸法：有頭、有身體，還有兩隻手
- **Cora**（listening）：「還有黑黑的眼睛，和一頂小帽子。」　`2.89s`
  - 配音唸法：還有黑黑的眼睛，和一頂小帽子
- **Cooper**（talking）：「我們分成三步來畫。」　`2.24s`
  - 配音唸法：我們分成三步來畫
- **Cooper**（talking）：「第一步畫頭，第二步畫身體和手。」　`3.26s`
  - 配音唸法：第一步畫頭，第二步畫身體和手
- **Max**（thinking）：「那第三步呢？」　`1.57s`
- **Cooper**（talking）：「第三步，畫帽子和眼睛。」　`2.69s`
  - 配音唸法：第三步，畫帽子和眼睛
- **Max**（eureka）：「只有三步，好簡單！」　`2.05s`
  - 配音語氣：excited and amazed

### 【實作】第一步：畫頭（p.22）

畫面：`demoClip`（統一教室背景）
- **Cooper**（talking）：「第一步，畫雪人的頭。」　`2.37s`
  - 配音唸法：第一步，畫雪人的頭
- **Cooper**（guide_right）：「先選畫圓工具。」　`2.01s`
  - 配音唸法：先選畫圓工具
- **Cooper**（talking）：「在畫布上，按住滑鼠，拉出一個小圓。」　`4.04s`
  - 配音唸法：在畫布上，按住滑鼠，拉出一個小圓
- **Cora**（listening）：「放開滑鼠，圓圈就畫好了！」　`2.97s`
- **Cooper**（talking）：「圓圈的位置不對，就換選取工具。」　`3.35s`
  - 配音唸法：圓圈的位置不對，就換選取工具
- **Cooper**（talking）：「點一下圓，就能拖去別的地方。」　`2.97s`
  - 配音唸法：點一下圓，就能拖去別的地方
- **Max**（eureka）：「圓圈可以搬來搬去耶！」　`2.01s`
  - 配音語氣：excited and amazed
- **Cooper**（thinking）：「你也畫好雪人的頭了嗎？」　`2.47s・停頓 4s`
  - 配音語氣：curious and encouraging

### 畫錯了怎麼辦（錯誤正常化）

畫面：`undo`（統一教室背景）
- **Max**（thinking）：「糟糕，我的圓畫歪了，變成蛋了。」　`3.09s`
  - 配音唸法：糟糕，我的圓畫歪了，變成蛋了
  - 配音語氣：sheepish and a little embarrassed <sigh>
- **Cooper**（talking）：「沒關係，畫錯很正常，老師也常常畫錯。」　`4.30s`
  - 配音唸法：沒關係，畫錯很正常，老師也常常畫錯
  - 配音語氣：gentle and reassuring
- **Cooper**（talking）：「拉的時候，橫的和直的不一樣長，圓就變成蛋了。」　`4.43s`
  - 配音唸法：拉的時候，橫的和直的不一樣長，圓就變成蛋了
- **Cooper**（guide_left）：「按上面的回上一步箭頭，就退回去了。」　`3.78s`
  - 配音唸法：按上面的回上一步箭頭，就退回去了
- **Cora**（listening）：「也可以按 Delete，刪掉重畫一次。」　`2.97s`
  - 配音唸法：也可以按 Delete，刪掉重畫一次
- **Cooper**（talking）：「寫程式的工程師也一樣，錯了就修，修好再繼續。」　`4.83s`
  - 配音唸法：寫程式的工程師也一樣，錯了就修，修好再繼續
  - 配音語氣：warm and proud

### 【實作】第二步：畫身體和手（p.23）

畫面：`demoClip`（統一教室背景）
- **Cooper**（talking）：「第二步，畫身體和手。」　`2.42s`
  - 配音唸法：第二步，畫身體和手
- **Cooper**（talking）：「一樣用畫圓工具，在頭的下面拉出一個大圓。」　`4.41s`
  - 配音唸法：一樣用畫圓工具，在頭的下面拉出一個大圓
- **Max**（thinking）：「大圓的裡面是空的，看得到後面耶。」　`3.05s`
  - 配音唸法：大圓的裡面是空的，看得到後面耶
- **Cooper**（guide_left）：「把 Fill 改成白色，身體就變成實心的了。」　`3.96s`
  - 配音唸法：把 Fill 改成白色，身體就變成實心的了
- **Max**（eureka）：「哇，真的不透明了！」　`2.05s`
  - 配音語氣：excited and amazed
- **Cooper**（guide_right）：「再選畫線工具，畫兩隻手。」　`2.90s`
  - 配音唸法：再選畫線工具，畫兩隻手
- **Cora**（listening）：「一條往左上，一條往右上。」　`2.53s`
  - 配音唸法：一條往左上，一條往右上
- **Cooper**（thinking）：「你也做出雪人的身體和手了嗎？」　`3.10s・停頓 4s`
  - 配音語氣：curious and encouraging

### 【實作】第三步：畫帽子和眼睛（p.24）

畫面：`demoClip`（統一教室背景）
- **Cooper**（talking）：「最後一步，畫眼睛和帽子。」　`2.91s`
  - 配音唸法：最後一步，畫眼睛和帽子
- **Cooper**（guide_right）：「眼睛用畫圓工具，先畫一個小圓。」　`3.53s`
  - 配音唸法：眼睛用畫圓工具，先畫一個小圓
- **Cooper**（guide_left）：「把 Fill 改成黑色，眼睛就黑黑的。」　`3.46s`
  - 配音唸法：把 Fill 改成黑色，眼睛就黑黑的
- **Cora**（listening）：「再畫一個，就有兩隻眼睛了，好像真的在看著我們！」　`4.97s`
- **Cooper**（talking）：「帽子先用畫矩形工具，畫一個小方塊。」　`3.69s`
  - 配音唸法：帽子先用畫矩形工具，畫一個小方塊
- **Cooper**（guide_left）：「這次把 Fill 改成黃色。」　`2.55s`
  - 配音唸法：這次把 Fill 改成黃色
- **Cooper**（guide_right）：「再換成塑型工具，把方塊拉成尖尖的帽子。」　`4.44s`
  - 配音唸法：再換成塑型工具，把方塊拉成尖尖的帽子
- **Max**（eureka）：「哇！雪人戴上帽子了！」　`2.33s`
  - 配音語氣：excited and amazed
- **Cooper**（thinking）：「你的雪人，也戴好帽子了嗎？」　`2.86s・停頓 4s`
  - 配音語氣：curious and encouraging

### 【變化題】只改 Fill 會怎樣

畫面：`fillOutline`（統一教室背景）
- **Cooper**（thinking）：「猜猜看！如果只把 Fill 改成藍色，會變怎樣？」　`4.36s・停頓 4s`
  - 配音語氣：curious and encouraging
- **Max**（thinking）：「整個圓圈的線，都變成藍色？」　`3.13s`
- **Cooper**（talking）：「不是喔，Fill 管的是裡面的顏色。」　`3.17s`
  - 配音唸法：不是喔，Fill 管的是裡面的顏色
- **Cooper**（talking）：「變成藍色的是圓圈的裡面，外框還是黑色。」　`4.48s`
  - 配音唸法：變成藍色的是圓圈的裡面，外框還是黑色
- **Cora**（talking）：「那想改外框的顏色，就要改 Outline。」　`3.65s`
  - 配音唸法：那想改外框的顏色，就要改 Outline
- **Cooper**（talking）：「Cora 分得很清楚：一個管裡面，一個管邊線。」　`4.45s`
  - 配音唸法：Cora 分得很清楚：一個管裡面，一個管邊線
  - 配音語氣：warm and proud
- **Max**（eureka）：「那我可以畫一個藍色的雪人！」　`2.97s`
  - 配音語氣：excited and amazed


## 第四部分：迴圈與程式

### 章節卡：讓雪人動起來

畫面：`chapter`
- **Cooper**（talking）：「第四章，讓雪人動起來。」　`2.60s`
  - 配音唸法：第四章，讓雪人動起來

### 什麼是迴圈（p.25）

畫面：`loopIntro`（統一教室背景）
- **Cooper**（thinking）：「你每天早上起床，都做哪些事情？」　`3.53s`
  - 配音語氣：curious and encouraging
- **Max**（talking）：「起床、吃早餐、刷牙！」　`2.53s`
- **Cooper**（thinking）：「那星期二早上呢？也一樣嗎？」　`3.21s`
- **Cora**（talking）：「一樣！每天都是這三件事。」　`2.73s`
  - 配音唸法：一樣！每天都是這三件事
- **Cooper**（talking）：「一樣的事情，一直重複做，就叫迴圈。」　`3.86s`
  - 配音唸法：一樣的事情，一直重複做，就叫迴圈
- **Cooper**（guide_right）：「電腦也有迴圈，可以一直做一樣的事。」　`3.54s`
  - 配音唸法：電腦也有迴圈，可以一直做一樣的事
- **Max**（eureka）：「那雪人的走路，也可以重複嗎？」　`2.81s`
  - 配音語氣：excited and amazed
- **Cooper**（talking）：「對！一直向前走，一直換造型，一直重複。」　`4.26s`
  - 配音唸法：對！一直向前走，一直換造型，一直重複

### 有限迴圈和無限迴圈

畫面：`loopTypes`（統一教室背景）
- **Cooper**（talking）：「迴圈有兩種。」　`1.60s`
  - 配音唸法：迴圈有兩種
- **Cooper**（guide_left）：「第一種，重複十次就停，叫有限迴圈。」　`3.98s`
  - 配音唸法：第一種，重複十次就停，叫有限迴圈
- **Cooper**（guide_right）：「第二種，永遠不會停，叫無限迴圈。」　`3.77s`
  - 配音唸法：第二種，永遠不會停，叫無限迴圈
- **Cora**（listening）：「像操場一直跑，不下課就不停。」　`3.01s`
  - 配音唸法：像操場一直跑，不下課就不停
- **Max**（thinking）：「那雪人要用哪一種呢？」　`1.97s`
- **Cooper**（talking）：「雪人要一直走，所以用無限迴圈。」　`3.34s`
  - 配音唸法：雪人要一直走，所以用無限迴圈
- **Cora**（talking）：「它的名字叫 forever，意思就是永遠。」　`3.13s`
  - 配音唸法：它的名字叫 forever，意思就是永遠

### 旋轉方式 1：left-right（p.26）

畫面：`rotation`（統一教室背景）
- **Cooper**（thinking）：「雪人往左走的時候，臉要朝哪裡？」　`3.36s`
  - 配音語氣：curious and encouraging
- **Max**（talking）：「朝左邊啊！」　`1.25s`
- **Cooper**（talking）：「沒錯，這時候就要設定旋轉方式。」　`3.49s`
  - 配音唸法：沒錯，這時候就要設定旋轉方式
- **Cooper**（guide_right）：「這一塊，叫 set rotation style。」　`2.91s`
  - 配音唸法：這一塊，叫 set rotation style
- **Max**（thinking）：「名字好長喔，我記不住。」　`2.17s`
  - 配音唸法：名字好長喔，我記不住
- **Cooper**（talking）：「不用背，意思就是：設定旋轉的方式。」　`3.83s`
  - 配音唸法：不用背，意思就是：設定旋轉的方式
- **Cooper**（talking）：「旁邊有三個選項，我們一個一個看。」　`3.36s`
  - 配音唸法：旁邊有三個選項，我們一個一個看
- **Cooper**（guide_right）：「第一個，left-right，是左右。」　`2.76s`
  - 配音唸法：第一個，left-right，是左右
- **Cora**（listening）：「往右走，臉朝右。往左走，臉朝左。」　`4.30s`
  - 配音唸法：往右走，臉朝右。往左走，臉朝左
- **Max**（eureka）：「像照鏡子，左右翻過來！」　`2.45s`
  - 配音語氣：excited and amazed

### 旋轉方式 2：don't rotate（p.27）

畫面：`rotation`（統一教室背景）
- **Cooper**（guide_right）：「第二個，don't rotate，是不要轉。」　`3.38s`
  - 配音唸法：第二個，don't rotate，是不要轉
- **Cooper**（talking）：「不管往哪裡走，臉都朝同一邊。」　`3.32s`
  - 配音唸法：不管往哪裡走，臉都朝同一邊
- **Max**（thinking）：「那往左走，不就變成倒退走了？」　`2.85s`
- **Cooper**（talking）：「對！就像倒著走路。」　`2.40s`
  - 配音唸法：對！就像倒著走路
- **Cora**（listening）：「臉一直朝著前面，不會轉過去。」　`2.85s`
  - 配音唸法：臉一直朝著前面，不會轉過去

### 【變化題】旋轉方式 3：all around（p.28）

畫面：`rotation`（統一教室背景）
- **Cooper**（guide_right）：「第三個，all around，是整個轉一圈。」　`3.48s`
  - 配音唸法：第三個，all around，是整個轉一圈
- **Cooper**（thinking）：「猜猜看，選了 all around，往左走會怎樣？」　`3.89s・停頓 4s`
  - 配音語氣：curious and encouraging
- **Max**（thinking）：「會在原地轉圈圈嗎？」　`1.97s`
- **Cooper**（talking）：「不是轉圈圈喔。看看畫面。」　`3.34s`
  - 配音唸法：不是轉圈圈喔。看看畫面
- **Cora**（listening）：「啊！頭朝下了，變成倒著走！」　`2.85s`
  - 配音語氣：<gasp>
- **Cooper**（talking）：「對，整張圖跟著方向轉，往左走就會頭下腳上。」　`5.01s`
  - 配音唸法：對，整張圖跟著方向轉，往左走就會頭下腳上
- **Cooper**（talking）：「所以雪人要選 left-right，才會站著走。」　`3.38s`
  - 配音唸法：所以雪人要選 left-right，才會站著走
- **Cora**（encourage）：「這樣往左往右，都是站著走。」　`2.69s`
  - 配音唸法：這樣往左往右，都是站著走

### 積木 1：move 10 steps（p.29）

畫面：`blockIntro`（統一教室背景）
- **Cooper**（talking）：「現在，來認識雪人要用的積木。」　`3.24s`
  - 配音唸法：現在，來認識雪人要用的積木
- **Cooper**（guide_right）：「第一塊，move 十 steps，意思是移動十步。」　`3.76s`
  - 配音唸法：第一塊，move 十 steps，意思是移動十步
- **Cora**（listening）：「每跑一次，雪人就往前走十步。」　`3.17s`
  - 配音唸法：每跑一次，雪人就往前走十步
- **Max**（thinking）：「十步是多遠呀？」　`1.81s`
- **Cooper**（talking）：「舞台很大，十步只是一小段。」　`3.03s`
  - 配音唸法：舞台很大，十步只是一小段
- **Cooper**（thinking）：「想一想，這塊積木在哪個家族？」　`3.13s`
  - 配音語氣：curious and encouraging
- **Cora**（talking）：「藍色的動作家族！」　`2.17s`
- **Cooper**（talking）：「沒錯，因為走路是動作。」　`2.73s`
  - 配音唸法：沒錯，因為走路是動作

### 積木 2：next costume（p.29）

畫面：`blockIntro`（統一教室背景）
- **Cooper**（guide_right）：「第二塊，next costume，是下一個造型。」　`3.84s`
  - 配音唸法：第二塊，next costume，是下一個造型
- **Cooper**（talking）：「它是紫色的，在外觀家族。」　`2.89s`
  - 配音唸法：它是紫色的，在外觀家族
- **Max**（eureka）：「就是翻到下一頁！」　`1.61s`
  - 配音語氣：excited and amazed
- **Cooper**（talking）：「對，翻一下，角色就換一個造型。」　`3.43s`
  - 配音唸法：對，翻一下，角色就換一個造型
- **Cora**（listening）：「貓咪就是這樣，換著換著，就像在走路。」　`3.77s`
  - 配音唸法：貓咪就是這樣，換著換著，就像在走路

### 積木 3：if on edge, bounce（p.29）

畫面：`blockIntro`（統一教室背景）
- **Cooper**（guide_right）：「第三塊，if on edge, bounce。」　`2.75s`
  - 配音唸法：第三塊，if on edge, bounce
- **Cooper**（talking）：「意思是：碰到邊邊，就彈回來。」　`3.07s`
  - 配音唸法：意思是：碰到邊邊，就彈回來
- **Max**（thinking）：「雪人走到舞台邊邊，要怎麼辦？」　`2.73s`
- **Cooper**（talking）：「這塊積木，會幫雪人轉身。」　`2.95s`
  - 配音唸法：這塊積木，會幫雪人轉身
- **Cora**（listening）：「就像撞到牆壁，彈回來。」　`2.65s`
  - 配音唸法：就像撞到牆壁，彈回來
- **Cooper**（talking）：「它也是藍色的，在動作家族。」　`3.07s`
  - 配音唸法：它也是藍色的，在動作家族

### 積木 4：forever（p.29）

畫面：`blockIntro`（統一教室背景）
- **Cooper**（guide_right）：「第四塊，forever，意思是永遠。」　`2.91s`
  - 配音唸法：第四塊，forever，意思是永遠
- **Cooper**（talking）：「它是橘色的，在控制家族。」　`2.83s`
  - 配音唸法：它是橘色的，在控制家族
- **Cooper**（guide_right）：「它像一張大嘴巴，把積木包起來。」　`3.51s`
  - 配音唸法：它像一張大嘴巴，把積木包起來
- **Cora**（listening）：「被包起來的積木，會一直重複做。」　`2.65s`
  - 配音唸法：被包起來的積木，會一直重複做
- **Max**（eureka）：「一直走，一直換造型，一直轉身！」　`3.09s`
  - 配音語氣：excited and amazed
- **Cooper**（talking）：「對，這就是無限迴圈。」　`2.52s`
  - 配音唸法：對，這就是無限迴圈

### 積木 5：when flag clicked

畫面：`blockIntro`（統一教室背景）
- **Cooper**（talking）：「最後，要有人說「開始」。」　`2.47s`
  - 配音唸法：最後，要有人說開始
- **Cooper**（guide_right）：「這塊叫 when 綠旗 clicked。」　`2.31s`
  - 配音唸法：這塊叫 when 綠旗 clicked
- **Cooper**（talking）：「意思是：按下綠旗，程式就開始。」　`3.42s`
  - 配音唸法：意思是：按下綠旗，程式就開始
- **Cora**（listening）：「它是黃色的，在事件家族。」　`2.85s`
  - 配音唸法：它是黃色的，在事件家族
- **Max**（eureka）：「就像按下門鈴，才會響！」　`1.97s`
  - 配音語氣：excited and amazed

### ★ ★ 雪人的完整程式（p.29 截圖）

畫面：`codeFull`（統一教室背景）
- **Cooper**（talking）：「我們把全部的積木，排在一起。」　`3.03s`
  - 配音唸法：我們把全部的積木，排在一起
- **Cooper**（guide_right）：「最上面，是 when 綠旗 clicked。」　`2.68s`
  - 配音唸法：最上面，是 when 綠旗 clicked
- **Cooper**（guide_right）：「下面接 set rotation style。」　`2.74s`
  - 配音唸法：下面接 set rotation style
- **Max**（thinking）：「後面那個字，要選哪一個？」　`2.09s`
- **Cooper**（talking）：「選 left-right，雪人才會左右轉身。」　`3.49s`
  - 配音唸法：選 left-right，雪人才會左右轉身
- **Cora**（listening）：「它在 forever 外面，因為只要設定一次。」　`3.41s`
  - 配音唸法：它在 forever 外面，因為只要設定一次
- **Cooper**（guide_right）：「再放 forever，把三塊積木包在裡面。」　`3.68s`
  - 配音唸法：再放 forever，把三塊積木包在裡面
- **Max**（talking）：「裡面有 move 十 steps。」　`1.77s`
  - 配音唸法：裡面有 move 十 steps
- **Cora**（talking）：「還有 next costume。」　`1.73s`
  - 配音唸法：還有 next costume
- **Cooper**（talking）：「最後是 if on edge, bounce。」　`2.49s`
  - 配音唸法：最後是 if on edge, bounce
- **Cooper**（talking）：「暫停影片，照著螢幕排排看。」　`3.14s・停頓 6s`
  - 配音唸法：暫停影片，照著螢幕排排看

### 【實作】按綠旗，讓雪人走起來

畫面：`demoSteps`（統一教室背景）
- **Cooper**（talking）：「都排好了，按下舞台上面的綠旗！」　`3.46s`
- **Max**（eureka）：「哇，雪人走起來了！」　`2.01s`
  - 配音語氣：excited and amazed
- **Cora**（encourage）：「走到邊邊，真的彈回來了！」　`2.49s`
- **Cooper**（guide_right）：「想讓雪人停下來，就按旁邊紅色的圓點。」　`4.06s`
  - 配音唸法：想讓雪人停下來，就按旁邊紅色的圓點
- **Cooper**（thinking）：「你的雪人也走起來了嗎？」　`2.46s・停頓 5s`
  - 配音語氣：curious and encouraging
- **Max**（thinking）：「我的雪人還是站著不動耶……」　`2.53s`
  - 配音唸法：我的雪人還是站著不動耶
  - 配音語氣：sheepish and a little embarrassed
- **Cooper**（talking）：「沒關係，這個狀況很多人都會遇到。」　`3.58s`
  - 配音唸法：沒關係，這個狀況很多人都會遇到
  - 配音語氣：gentle and reassuring
- **Cooper**（talking）：「先檢查積木有沒有卡在一起，沒卡好，程式就不會跑。」　`5.16s`
  - 配音唸法：先檢查積木有沒有卡在一起，沒卡好，程式就不會跑
- **Cora**（listening）：「把積木靠近一點，放開手，看到它黏住，就卡好了。」　`4.77s`
  - 配音唸法：把積木靠近一點，放開手，看到它黏住，就卡好了

### 做完記得存檔

畫面：`saveAs`（統一教室背景）
- **Cooper**（talking）：「雪人走起來了，記得馬上存檔。」　`3.25s`
  - 配音唸法：雪人走起來了，記得馬上存檔
- **Cooper**（guide_right）：「按 File，再按 Save as。」　`2.28s`
  - 配音唸法：按 File，再按 Save as
- **Cora**（listening）：「名字要取得清楚，就叫雪人。」　`2.77s`
  - 配音唸法：名字要取得清楚，就叫雪人
- **Max**（talking）：「這樣下次打開，我就找得到了！」　`2.13s`
- **Cooper**（thinking）：「你的雪人，也存好檔案了嗎？」　`2.92s・停頓 4s`
  - 配音語氣：curious and encouraging

### 成果展示（p.30）

畫面：`demoVideo`
- **Cooper**（talking）：「全部完成，我們來看看成果！」　`3.06s`
- **Max**（eureka）：「雪人自己走起來了！」　`1.81s`
  - 配音語氣：excited and amazed
- **Cora**（encourage）：「我們沒有推牠，是程式叫牠走的。」　`3.17s`
  - 配音唸法：我們沒有推牠，是程式叫牠走的
- **Cooper**（talking）：「你從畫圖，到排積木，每一步都是自己完成的。」　`4.40s`
  - 配音唸法：你從畫圖，到排積木，每一步都是自己完成的
  - 配音語氣：warm and proud
- **Cooper**（thinking）：「舉手給老師看看，你的雪人也會走了嗎？」　`3.93s`
  - 配音語氣：curious and encouraging
- **Max**（talking）：「我的會走了！我要回家表演給大家看！」　`3.62s`


## 第五部分：學生挑戰

### 章節卡：挑戰時間

畫面：`chapter`
- **Cooper**（talking）：「第五章，挑戰時間。」　`2.47s`
  - 配音唸法：第五章，挑戰時間

### 【挑戰 1】有限還是無限（p.32~33）

畫面：`quizAB`（統一教室背景）
- **Cooper**（thinking）：「第一題！請問這個程式，是有限還是無限迴圈？」　`4.63s`
- **Cooper**（talking）：「A 是有限，B 是無限。」　`2.43s・停頓 5s`
  - 配音唸法：A 是有限，B 是無限
- **Cora**（encourage）：「我選 B！」　`1.01s`
- **Cooper**（talking）：「答對了！forever 是永遠，所以是無限。」　`3.67s`
  - 配音唸法：答對了！forever 是永遠，所以是無限
- **Cooper**（talking）：「你抓到重點：forever 沒有數字，所以不會停。」　`4.14s`
  - 配音唸法：你抓到重點：forever 沒有數字，所以不會停
  - 配音語氣：warm and proud

### 【挑戰 2】沒有這塊會怎樣（p.34~35）

畫面：`quizAB`（統一教室背景）
- **Cooper**（thinking）：「第二題！如果沒有這塊積木，雪人會怎樣？」　`4.18s`
- **Cooper**（talking）：「A 是不會怎樣，B 是角色會跑出舞台。」　`3.62s・停頓 5s`
  - 配音唸法：A 是不會怎樣，B 是角色會跑出舞台
- **Max**（eureka）：「我選 B！牠會走出去，不見了！」　`2.77s`
  - 配音語氣：excited and amazed
- **Cooper**（talking）：「答對了！沒有人幫牠轉身，牠就一直走出舞台。」　`4.52s`
  - 配音唸法：答對了！沒有人幫牠轉身，牠就一直走出舞台
- **Cora**（talking）：「這塊積木，就像舞台的牆壁！」　`3.25s`

### 【挑戰 3】誰走比較快（p.36~37）

畫面：`quizSpeed`（統一教室背景）
- **Cooper**（thinking）：「第三題！這三個雪人，誰會走比較快？」　`3.78s`
- **Cooper**（talking）：「A 是十步，B 是四十步，C 是九十步。」　`3.61s・停頓 6s`
  - 配音唸法：A 是十步，B 是四十步，C 是九十步
- **Max**（thinking）：「我選 A，因為十比較簡單。」　`2.61s`
  - 配音唸法：我選 A，因為十比較簡單
- **Cora**（talking）：「我選 C！數字越大，一次走越遠。」　`3.05s`
  - 配音唸法：我選 C！數字越大，一次走越遠
- **Cooper**（talking）：「答對了，是 C，一次走九十步。」　`3.28s`
  - 配音唸法：答對了，是 C，一次走九十步
- **Cooper**（talking）：「走得快不快，不是看簡單，是看一次走幾步。」　`4.27s`
  - 配音唸法：走得快不快，不是看簡單，是看一次走幾步
- **Max**（eureka）：「原來是這樣，我懂了！」　`1.85s`
  - 配音語氣：excited and amazed


## 第六部分：複習與結尾

### 章節卡：複習時間

畫面：`chapter`
- **Cooper**（talking）：「第六章，複習時間到囉！」　`2.77s`

### 【複習 1】這塊積木做什麼？（p.39）

畫面：`reviewQ`（統一教室背景）
- **Cooper**（talking）：「先來複習今天學的積木。」　`2.63s`
  - 配音唸法：先來複習今天學的積木
- **Cooper**（thinking）：「請問這個程式，是用來做什麼的呢？」　`3.20s・停頓 5s`
  - 配音語氣：curious and encouraging
- **Max**（eureka）：「我知道！是設定雪人怎麼轉身！」　`2.93s`
  - 配音語氣：excited and amazed
- **Cooper**（guide_right）：「對，沒錯！這個程式，是用來設定旋轉方式，我們選左右。」　`5.64s`
  - 配音唸法：對，沒錯！這個程式，是用來設定旋轉方式，我們選左右

### 【複習 2】這塊積木做什麼？（p.39~40）

畫面：`reviewQ`（統一教室背景）
- **Cooper**（thinking）：「那這一塊呢？它是用來做什麼的？」　`3.49s・停頓 5s`
  - 配音語氣：curious and encouraging
- **Cora**（talking）：「雪人走到邊緣，就彈回來！」　`2.57s`
- **Cooper**（guide_right）：「對，沒錯！如果角色碰到邊緣，就彈回來。」　`4.29s`
  - 配音唸法：對，沒錯！如果角色碰到邊緣，就彈回來

### 【複習 3】這塊積木做什麼？

畫面：`reviewQ`（統一教室背景）
- **Cooper**（thinking）：「再看一個，這個程式是做什麼用的？」　`3.34s・停頓 5s`
  - 配音語氣：curious and encouraging
- **Max**（talking）：「讓裡面的積木，一直重複做！」　`2.57s`
- **Cooper**（guide_right）：「對，沒錯！forever 會讓裡面的積木，一直重複。」　`4.34s`
  - 配音唸法：對，沒錯！forever 會讓裡面的積木，一直重複

### 【複習 4】這塊積木做什麼？

畫面：`reviewQ`（統一教室背景）
- **Cooper**（thinking）：「最後一個，這塊你認得嗎？」　`2.66s・停頓 5s`
  - 配音語氣：curious and encouraging
- **Cora**（encourage）：「是換成下一個造型！」　`2.05s`
- **Cooper**（guide_right）：「對，沒錯！這個程式，是用來換成下一個造型。」　`4.66s`
  - 配音唸法：對，沒錯！這個程式，是用來換成下一個造型
- **Cooper**（talking）：「四題都答對，你們今天真的有認真學。」　`3.65s`
  - 配音唸法：四題都答對，你們今天真的有認真學
  - 配音語氣：warm and proud

### 回扣開場的問題

畫面：`callback`（統一教室背景）
- **Cooper**（thinking）：「還記得一開始的問題嗎？為什麼你畫好的雪人，怎麼點都不會動？」　`6.05s・停頓 4s`
  - 配音語氣：curious and encouraging
- **Max**（eureka）：「因為只畫圖還不夠，要放 move 積木，雪人才會走！」　`4.25s`
  - 配音語氣：excited and amazed
- **Cora**（talking）：「還要用 forever，讓牠一直走下去！」　`3.21s`
- **Cooper**（talking）：「答對了，就是第四章，排積木的那一步。」　`3.83s`
  - 配音唸法：答對了，就是第四章，排積木的那一步
  - 配音語氣：warm and proud
- **Cooper**（talking）：「畫圖是做出雪人，積木是叫雪人動起來。」　`4.05s`
  - 配音唸法：畫圖是做出雪人，積木是叫雪人動起來

### 今天學了什麼

畫面：`summary`（統一教室背景）
- **Cooper**（talking）：「我們來回想一下，今天學的東西。」　`3.29s`
  - 配音唸法：我們來回想一下，今天學的東西
- **Cooper**（guide_right）：「第一個：認識 Scratch，還有九個程式家族。」　`3.96s`
  - 配音唸法：第一個：認識 Scratch，還有九個程式家族
- **Cora**（talking）：「第二個：用畫筆，畫出自己的雪人。」　`3.21s`
  - 配音唸法：第二個：用畫筆，畫出自己的雪人
- **Max**（talking）：「第三個：用 forever 和 move，讓雪人走起來！」　`3.49s`
- **Cooper**（thinking）：「這三件事，你記得幾件呢？」　`2.68s`
  - 配音語氣：curious and encouraging
- **Cora**（encourage）：「我三件都記得！」　`1.93s`
- **Cooper**（talking）：「你們都記得，因為你們有動手做。」　`3.28s`
  - 配音唸法：你們都記得，因為你們有動手做

### 下課囉

畫面：`ending`
- **Cooper**（talking）：「今天的課就到這裡。」　`2.12s`
  - 配音唸法：今天的課就到這裡
- **Cooper**（talking）：「回家記得，做一隻會走路的雪人，給爸爸媽媽看。」　`4.63s`
  - 配音唸法：回家記得，做一隻會走路的雪人，給爸爸媽媽看
- **Cooper**（thinking）：「今天你最喜歡哪個部分呢？」　`2.67s`
  - 配音語氣：curious and encouraging
- **Max**（talking）：「我最喜歡，看雪人自己走起來！」　`2.77s`
- **Max**（goodbye）：「大家下次見！」　`1.53s`
- **Cora**（goodbye）：「拜拜！」　`0.61s`
- **Cooper**（goodbye）：「我們下次見，拜拜！」　`2.31s`
