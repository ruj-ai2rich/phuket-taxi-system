// ========================================================
// Phuket Taxi & Airport Transfer - LINE OA powered by Dify AI
// ========================================================

// 🔑 1. ใส่ LINE Channel Access Token ของ @819qzqqa
const LINE_ACCESS_TOKEN = "ZIqXaP3UzzxEiSwNT7NQtIm3OwpEky2YjjhSCSYM88Mw9Iu1EUhe0XToVOM8dxEtFlLB11UstXnUYsG/P8jcjRdCIdvyqnerAM6RrdkHOuvVeatQJ3Of1WsXw3lhDR6KXjlayMgguWGX6wsbMp+i+QdB04t89/1O/w1cDnyilFU=";

// 🔑 2. Dify API Key ของแอป Phuket Taxi Ai (ผูกคลังข้อมูลท่องเที่ยวแล้ว)
const DIFY_API_KEY = "app-VfCGzt6d6hml552DPtep7y3L";
const DIFY_API_URL = "https://api.dify.ai/v1/chat-messages";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput("OK");
    }

    const contents = JSON.parse(e.postData.contents);
    const events = contents.events;
    if (!events || events.length === 0) {
      return ContentService.createTextOutput("OK");
    }

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (event.type === "message" && event.message.type === "text") {
        const replyToken = event.replyToken;
        const userMessage = event.message.text;
        const userId = (event.source && event.source.userId) ? event.source.userId : "line_user";

        // เรียกสมอง Dify AI แท็กซี่ภูเก็ต
        const aiResponse = callDify(userMessage, userId);
        replyToLine(replyToken, aiResponse);
      }
    }
    return ContentService.createTextOutput("OK");
  } catch (err) {
    return ContentService.createTextOutput("OK");
  }
}

function callDify(prompt, userId) {
  try {
    const payload = {
      inputs: {},
      query: prompt,
      response_mode: "blocking",
      user: String(userId)
    };

    const options = {
      method: "post",
      headers: {
        "Authorization": "Bearer " + DIFY_API_KEY,
        "Content-Type": "application/json"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const res = UrlFetchApp.fetch(DIFY_API_URL, options);
    const json = JSON.parse(res.getContentText());

    let answer = json.answer || "ขออภัยครับ ระบบกำลังประมวลผล กรุณาลองใหม่อีกครั้ง";
    
 // ข้อความเครดิตต่อท้ายคำตอบทุกข้อความ
    const creditFooter = "\n\nCredit Ajarn.Ruj : www.ai2rich.net\nLine: @999qihww\nhttps://line.me/R/ti/p/@999qihww\nTelegram: t.me/Ai2rich_OfficialBot\nTel./WhatsApp: 0864949987";
    
    if (!answer.includes("Credit Ajarn.Ruj")) {
      answer += creditFooter;
    }
    
    return answer;
  } catch (err) {
    return "สอบถามบริการแท็กซี่ภูเก็ตและรถนำเที่ยว โทร/WhatsApp: 086-494-9987 ครับ 🚕✨";
  }
}

function replyToLine(replyToken, text) {
  const url = "https://api.line.me/v2/bot/message/reply";
  const payload = {
    replyToken: replyToken,
    messages: [{ type: "text", text: text }]
  };
  UrlFetchApp.fetch(url, {
    method: "post",
    headers: { "Authorization": "Bearer " + LINE_ACCESS_TOKEN },
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

function testDify() {
  const res = callDify("อยากเหมารถไปแหลมพรหมเทพและวัดฉลอง คิดราคายังไง", "test_user");
  Logger.log("=== ผลลัพธ์ Dify แท็กซี่ภูเก็ต ===");
  Logger.log(res);
}
