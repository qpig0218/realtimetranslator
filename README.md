# 即時翻譯應用程式

一個功能完整的即時語音翻譯網頁應用程式,支援多種語言與專業場景,並整合 Azure AI Foundry 服務。

## 功能特色

### 🎤 即時語音辨識與翻譯
- 使用 Azure Speech Service 進行高準確度語音辨識
- 支援繁體中文、英文、日文、韓文等多種語言
- 即時翻譯並以字幕形式顯示

### 🏢 專業場景支援
- 一般對話
- 醫療
- 法律
- 商務
- 教育
- 科技
- 金融

### 📝 智能逐字稿與摘要
- 自動儲存完整逐字稿
- 使用 Azure OpenAI 生成結構化摘要
- 支援下載逐字稿與摘要文件

### 💾 會話管理
- 建立多個翻譯會話
- 查看歷史記錄
- 會話狀態管理(進行中/已完成/已封存)

## 技術架構

### 前端
- **框架**: React 19 + TypeScript
- **UI 組件**: shadcn/ui + Tailwind CSS 4
- **語音辨識**: Microsoft Cognitive Services Speech SDK
- **狀態管理**: tRPC + React Query
- **路由**: Wouter

### 後端
- **框架**: Express 4 + Node.js
- **API**: tRPC 11
- **資料庫**: MySQL (透過 Drizzle ORM)
- **認證**: Manus OAuth

### Azure AI 服務
- **Azure Speech Service**: 語音辨識
- **Azure Translator**: 文字翻譯
- **Azure OpenAI**: 摘要生成

## 使用方式

### 1. 建立新會話
1. 登入後點擊「新會話」按鈕
2. 輸入會話標題(例如: 商務會議、醫療諮詢)
3. 選擇來源語言和目標語言
4. 選擇場景/專業領域
5. 點擊「開始翻譯」

### 2. 進行即時翻譯
1. 點擊麥克風按鈕開始錄音
2. 對著麥克風說話
3. 系統會即時顯示:
   - 語音辨識結果(原文)
   - 翻譯結果(譯文)
   - 底部字幕欄顯示最新翻譯
4. 再次點擊麥克風按鈕可暫停錄音
5. 完成後點擊「結束會話」

### 3. 查看逐字稿與摘要
1. 結束會話後自動跳轉到摘要頁面
2. 點擊「生成摘要」按鈕生成 AI 摘要
3. 可以下載:
   - 完整逐字稿(.txt)
   - AI 摘要(.txt)
4. 查看完整的翻譯記錄與時間戳

### 4. 管理歷史會話
1. 在首頁查看所有會話列表
2. 點擊進行中的會話可繼續翻譯
3. 點擊已完成的會話可查看逐字稿與摘要

## 環境變數

應用程式需要以下 Azure AI Foundry 環境變數:

```env
# Azure Speech Service
AZURE_SPEECH_KEY=your_speech_key
AZURE_SPEECH_REGION=your_region

# Azure Translator
AZURE_TRANSLATOR_KEY=your_translator_key
AZURE_TRANSLATOR_ENDPOINT=your_translator_endpoint
AZURE_TRANSLATOR_REGION=your_region

# Azure OpenAI
AZURE_OPENAI_KEY=your_openai_key
AZURE_OPENAI_ENDPOINT=your_openai_endpoint
AZURE_OPENAI_DEPLOYMENT=your_deployment_name
```

這些環境變數已經透過 Manus 平台的 Secrets 管理功能自動注入。

## 開發指令

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev

# 資料庫遷移
pnpm db:push

# 建置生產版本
pnpm build

# 啟動生產伺服器
pnpm start
```

## 部署到網頁

以下步驟會透過 Docker 建立可直接在網頁上使用的部署版本:

1. 建立 `.env` 檔案,填入前述所需的 Azure 及 OAuth 環境變數。
2. 建置映像檔:

   ```bash
   docker build -t realtime-translator .
   ```

3. 啟動容器並對外開放 3000 埠位:

   ```bash
   docker run --env-file .env -p 3000:3000 realtime-translator
   ```

4. 造訪 `http://localhost:3000` 即可在瀏覽器中使用完整的即時翻譯服務。

若要部署到雲端平臺(例如 Render、Fly.io 或自架伺服器),只需將上述 Docker 映像檔推送到對應的容器登錄庫,並設定相同的環境變數與埠號即可。

## 資料庫結構

### users
使用者資料表,儲存認證資訊

### sessions
翻譯會話資料表,包含:
- 會話標題
- 來源/目標語言
- 場景設定
- 狀態(active/completed/archived)
- 開始/結束時間

### transcripts
逐字稿資料表,儲存每段翻譯:
- 原文
- 譯文
- 時間戳
- 信心度分數

### summaries
摘要資料表,儲存 AI 生成的會話摘要

## 注意事項

### 瀏覽器權限
- 首次使用時需要授權麥克風權限
- 建議使用 Chrome、Edge 或 Safari 瀏覽器
- 需要 HTTPS 連線才能使用麥克風

### 語音辨識
- 確保環境安靜以提高辨識準確度
- 說話清晰且速度適中
- 不同語言的辨識準確度可能有差異

### 翻譯品質
- 選擇正確的場景可提高專業術語翻譯準確度
- 複雜句子可能需要多次嘗試
- 建議在會話結束後檢查逐字稿並手動修正

### 效能
- 長時間會話可能產生大量資料
- 建議定期結束會話並建立新會話
- 摘要生成可能需要 10-30 秒

## 支援的語言

- 繁體中文 (zh-Hant)
- 简体中文 (zh-Hans)
- English (en)
- 日本語 (ja)
- 한국어 (ko)
- Español (es)
- Français (fr)
- Deutsch (de)
- Português (pt)
- Русский (ru)
- العربية (ar)
- ไทย (th)
- Tiếng Việt (vi)

## 授權

本專案使用 MIT 授權。
