# 消化系統 AR｜Digestive System Overlay

學生用學習工具：用手機／電腦鏡頭影住人，網頁會偵測身體姿勢，並喺軀幹對應位置疊出卡通風格消化系統。

適合香港中學生物課堂（介面：繁體中文香港用語 zh-HK）。

## 檔案

```
digestive-ar/
├── index.html          ← 主頁（請由此開始）
├── css/styles.css
├── js/app.js           ← 相機 + MediaPipe Pose
├── js/digestive-overlay.js
└── README.md
```

## 點樣運行

相機 API 需要 **HTTPS** 或 **localhost**。唔好直接雙擊 `index.html`（`file://` 多數會封鎖相機）。

### 方法一：Python（最簡單）

喺專案資料夾執行：

```bash
cd /workspace/digestive-ar
python3 -m http.server 8080
```

然後用瀏覽器打開：

- 本機：http://localhost:8080/
- 同一 Wi‑Fi 嘅手機：http://&lt;電腦 IP&gt;:8080/  
  （手機用 IP 存取時，部分瀏覽器可能仍要求 HTTPS 先開得到相機；本機 localhost 最穩。）

### 方法二：Node

```bash
npx --yes serve -l 8080 /workspace/digestive-ar
```

## 使用步驟

1. 打開網頁，撳「開啟相機開始」，允許相機權限。
2. **影住全身（尤其上身）**，消化系統會自動對齊。
3. 身體郁動時，器官會跟住肩膀—髖骨框架縮放／旋轉。
4. 撳某個器官，睇簡短介紹（中英對照）。
5. 下方掣可開關：疊圖、標籤、鏡像、除錯骨架。

## 瀏覽器建議

- 桌面：Chrome / Edge（最新版）
- 手機：Safari（iOS）或 Chrome（Android）
- 首次載入要下載 MediaPipe 模型（需要網絡）

## 私隱

影像只喺瀏覽器本機用 MediaPipe 處理，**唔會上載**到伺服器。

## 已知限制

- 需要清晰見到 **頭 + 上身**（最好全身站立）；側身、遮擋、太近／太遠會影響對齊。
- 光線不足或雜亂背景會令姿勢偵測不穩。
- 疊圖係教學用卡通示意圖，位置係相對肩膀／髖骨估算，唔係醫學級解剖定位。
- 多人同時入鏡時只追蹤其中一人。
- 手機用區域網絡 IP（非 localhost）時，可能要 HTTPS 先開相機。

## 技術

- 純靜態網頁（HTML / CSS / JS），無需 build
- [MediaPipe Pose Landmarker](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)（CDN）
- Canvas 繪製消化系統疊圖 + 點擊命中測試

祝 Alice 課堂順利！
