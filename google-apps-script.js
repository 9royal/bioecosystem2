/**
 * Google Apps Script (GAS) 部署程式碼
 * 
 * 功能：
 * 本指令碼用於接收來自「生態系教育學習網」的三種成績提交（總評量、生物挑戰、生態挑戰），
 * 並將成績自動分類記錄在 Google 試算表（Google Sheet）的不同分頁中。
 * 
 * 部署教學與步驟請見本檔案下方。
 */

function doPost(e) {
  // 設置 JSON 輸出格式
  var header = ContentService.MimeType.JSON;
  
  try {
    // 取得並解析 Web 應用程式傳入的 JSON 內容
    var jsonString = e.postData.contents;
    var data = JSON.parse(jsonString);
    
    // 取得當前的 Google 試算表
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var type = data.type || "unknown"; // score (總評量), creature (生物挑戰), ecosystem (生態挑戰)
    var className = data.className || "";
    var seatNumber = data.seatNumber || "";
    var school = data.school || "";
    var score = data.score !== undefined ? data.score : 0;
    
    // 依據挑戰類型決定寫入的分頁名稱
    var sheetName = "學習紀錄表";
    if (type === "score") {
      sheetName = "總評量成績";
    } else if (type === "creature") {
      sheetName = "生物挑戰成績";
    } else if (type === "ecosystem") {
      sheetName = "生態挑戰成績";
    }
    
    // 取得特定的分頁，若不存在則建立新分頁
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // 寫入首行表頭
      sheet.appendRow(["提交時間", "班級", "座號", "學校", "分數"]);
      
      // 簡單的表頭美化（設定粗體）
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold");
    }
    
    // 新增一筆成績紀錄列
    sheet.appendRow([
      new Date(),   // 當前時間鍵值
      className,    // 班級
      seatNumber,   // 座號
      school,       // 學校
      score         // 分數
    ]);
    
    // 回傳成功狀態（因為前端使用 no-cors 模式，此回傳主要用於 GAS 端偵錯）
    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "message": "成績已成功紀錄至分頁：" + sheetName
    })).setMimeType(header);
    
  } catch (error) {
    // 錯誤處理與回傳
    return ContentService.createTextOutput(JSON.stringify({
      "status": "error",
      "message": error.toString()
    })).setMimeType(header);
  }
}

function doGet(e) {
  var header = ContentService.MimeType.JSON;
  try {
    var type = e.parameter.type || "score"; // score, creature, ecosystem
    var sheetName = "學習紀錄表";
    if (type === "score") {
      sheetName = "總評量成績";
    } else if (type === "creature") {
      sheetName = "生物挑戰成績";
    } else if (type === "ecosystem") {
      sheetName = "生態挑戰成績";
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        "status": "success",
        "data": []
      })).setMimeType(header);
    }
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return ContentService.createTextOutput(JSON.stringify({
        "status": "success",
        "data": []
      })).setMimeType(header);
    }
    
    // 取得所有記錄（不含首行表頭）
    var range = sheet.getRange(2, 1, lastRow - 1, 5);
    var values = range.getValues();
    
    // 格式化資料
    var records = [];
    for (var i = 0; i < values.length; i++) {
      var row = values[i];
      var scoreVal = parseFloat(row[4]);
      if (!isNaN(scoreVal)) {
        records.push({
          time: row[0],
          className: row[1],
          seatNumber: row[2],
          school: row[3] || "未填寫",
          score: scoreVal
        });
      }
    }
    
    // 排序：分數由高到低，若相同則按時間由早到晚 (先達成的排前面)
    records.sort(function(a, b) {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(a.time) - new Date(b.time);
    });
    
    // 取得前 10 名
    var top10 = records.slice(0, 10);
    
    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "data": top10
    })).setMimeType(header);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      "status": "error",
      "message": error.toString()
    })).setMimeType(header);
  }
}

/**
 * =========================================================================
 * 🛠️ 部署寫入 Google 試算表 (Google Apps Script) 操作步驟 🛠️
 * =========================================================================
 * 
 * 想要幫你的學習網建立專屬的「成績登記表」，請按照以下步驟操作：
 * 
 * 1. 【建立 Google 試算表】：
 *    - 開啟並建立一個全新的 Google 試算表 (https://sheets.google.com)。
 *    - 為試算表取個名字（例如：生態系學習網成績登記表）。
 * 
 * 2. 【建立 Apps Script 指令碼】：
 *    - 在試算表的上方選單，點選：【擴充功能】(Extensions) -> 【Apps Script】。
 *    - 如果有預設的代碼（例如：function myFunction() {}），請直接全部刪除。
 *    - 將本檔案（google-apps-script.js）上方所有的 JavaScript 程式碼完整複製並貼入。
 *    - 點選上方儲存按鈕（檔名可以命名為：ScoreReceiver）。
 * 
 * 3. 【部署為 Web 應用程式】：
 *    - 點選右上角的【部署】(Deploy) -> 【新增部署】(New deployment)。
 *    - 在側邊的齒輪設定中，選取【Web 應用程式】(Web app)。
 *    - 進行以下參數設定：
 *      * 說明：成績接收端 V1
 *      * 誰可以存取：選取【所有人】(Anyone)  <-- 務必不能選錯，否則網頁無法傳遞成績
 *      * 執行身分：選取【我】(Me)
 *    - 點選底部的【部署】(Deploy)。
 *    - 系統會跳出安全性授權請求，請點選【授予存取權】並登入你的 Google 帳號。
 *    - 若出現「Google 尚未驗證此應用程式」的進階警告，點選下方的【進階】(Advanced) -> 點選【前往 ScoreReceiver（不安全）】後信任存取。
 * 
 * 4. 【取得部署網址】：
 *    - 部署成功後，會顯示一組「網頁應用程式 URL」（長得像：https://script.google.com/macros/s/.../exec）。
 *    - 完整複製這組 URL 網址。
 * 
 * 5. 【與本程式進行串接】：
 *    共有兩種方式可以讓你的網站使用此網址：
 * 
 *    👉 方式 A（一勞永逸，適合 Vercel 部署）：
 *       - 在你部署 Vercel 專案的後台「Environment Variables（環境變數）」設定：
 *         * Key (鍵)：`VITE_GAS_DEPLOY_URL`
 *         * Value (值)：貼上你剛剛複製的 Google 部署網址。
 *       - 重新部署 Vercel，任何人玩遊戲提交的成績都會直接儲存到你的 Google 試算表中！
 * 
 *    👉 方式 B（適合臨時體驗或無 Vercel 權限）：
 *       - 直接進入網頁的右上角、或在「提交成績」時，一般都提供「自訂 GAS URL」輸入框或將網址存到 LocalStorage（鍵名為 `GAS_DEPLOY_URL`）的功能。
 *       - 大多數使用者也可以透過環境變數或專案中的 `.env` 檔案本機設定 `VITE_GAS_DEPLOY_URL=你的網址`。
 */
