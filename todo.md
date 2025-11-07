# 即時翻譯應用程式 TODO

## 資料庫設計
- [x] 設計翻譯會話(session)資料表
- [x] 設計翻譯記錄(transcript)資料表
- [x] 設計場景/專業領域設定資料表
- [x] 執行資料庫遷移

## 後端 API 開發
- [x] 建立 Azure AI Foundry API 金鑰管理
- [x] 實作語音辨識 API 整合(Azure Speech Service)
- [x] 實作即時翻譯 API 整合(Azure Translator)
- [x] 實作摘要生成 API 整合(Azure OpenAI)
- [x] 建立翻譯會話管理 API
- [x] 建立逐字稿儲存與查詢 API
- [x] 建立摘要生成與儲存 API
- [x] 實作 WebSocket 或 Server-Sent Events 支援即時資料傳輸

## 前端介面開發
- [x] 設計整體 UI/UX 風格與配色
- [x] 建立會話設定頁面(選擇語言、場景)
- [x] 建立即時翻譯主頁面
- [x] 實作麥克風錄音功能
- [x] 實作即時字幕顯示元件
- [x] 建立歷史記錄列表頁面
- [x] 建立逐字稿詳細頁面
- [x] 建立摘要顯示與下載功能
- [x] 實作音訊上傳與處理

## 整合測試
- [x] 測試語音辨識準確度
- [x] 測試翻譯品質與即時性
- [x] 測試不同場景下的專業術語翻譯
- [x] 測試逐字稿與摘要生成
- [x] 跨瀏覽器相容性測試
- [x] 響應式設計測試

## 部署準備
- [x] 環境變數設定文件
- [x] 使用說明文件
- [x] 建立專案檢查點

## 錯誤修復
- [x] 修復 Azure Speech Service token 獲取錯誤
- [x] 測試語音辨識功能

## Confidence 參數錯誤修復
- [x] 修復 translateText API confidence 參數 NaN 驗證錯誤
- [x] 修正語音辨識信心度分數解析邏輯
- [x] 測試翻譯功能

## 摘要功能錯誤修復
- [x] 修復 getSummary 查詢返回 undefined 錯誤
- [x] 修復摘要生成失敗錯誤
- [x] 測試摘要功能

## 摘要生成失敗診斷與修復
- [x] 檢查伺服器日誌找出錯誤原因
- [x] 驗證 Azure OpenAI 環境變數配置
- [x] 測試 Azure OpenAI API 連線
- [x] 修復摘要生成功能(使用 max_completion_tokens)

## 摘要生成持續失敗診斷
- [x] 檢查伺服器實際錯誤日誌
- [x] 驗證 API 請求格式
- [x] 提供替代方案(改用內建 LLM API)

## React Hooks 使用錯誤修復
- [x] 修復 Summary 頁面 onSuccess 回調中的 hooks 使用錯誤
- [x] 使用 invalidate 替代直接呼叫 hooks
