// ========================================================
// Phuket Taxi & Airport Transfer - Cloudflare Worker
// (ระบบ Live Group Alert + Broadcast + ลิงก์ Google Maps)
// ========================================================
export default {
  async fetch(request, env) {
    const BOT_TOKEN = "8757843152:AAEcEOQSee8qnoi1pwr57psyQFGRBKMZq7U";
    const DIFY_KEY = "app-VfCGzt6d6hm1552DPtep7y3L";
    const GROUP_CHAT_ID = "-1003836823063";
    const HUB_URL = "https://script.google.com/macros/s/AKfycbyJsIZCiSLtqoklyVNbZ3Nj24BsNb9x16xiR3PWEE-1lks6izmxZOASKxy0BzLnuxjx/exec";
    const POSTER_IMAGE_URL = "https://lh3.googleusercontent.com/d/1L3j_oW5IhiXCg9kpfPL8W6Twu1z82Y-x";

    if (request.method === "POST") {
      try {
        const update = await request.json();
        if (!update.message) return new Response("OK");

        const msg = update.message;
        const chatId = msg.chat.id;
        const isGroup = msg.chat.type === "group" || msg.chat.type === "supergroup";
        const text = msg.text || "";
        const caption = msg.caption || "";
        const senderName = msg.from ? msg.from.first_name : "Customer";
        const username = msg.from && msg.from.username ? `@${msg.from.username}` : "";

        const creditFooter = "\n\nCredit Ajarn.Ruj : www.ai2rich.net\nLine: @999qihww\nhttps://line.me/R/ti/p/@999qihww\nTelegram: t.me/Ai2rich_OfficialBot\nTel./WhatsApp: 0864949987";

        // 1. ดักจับคำสั่ง /start
        if (!isGroup && text.startsWith("/start")) {
          fetch(`${HUB_URL}?action=add_subscriber&chat_id=${chatId}&name=${encodeURIComponent(senderName)}&username=${encodeURIComponent(username)}`).catch(()=>{});
          const welcomeCaption = `🚖 ยินดีต้อนรับสู่ "น้องภูเก็ตไดร์ฟ AI" (ใช้ฟรี 24 ชม.)\n🗣 แปลภาษาทั่วโลก ยื่นหน้าจอให้ลูกค้าดูได้ทันที\n🗺 ไม่ยุ่งยาก โฟกัสการขับรถ ⭐️ ข้อมูลค่าน้ำอัปเดตตลอด\n\n💡 ตัวอย่างคำสั่ง:\n• "ผมเป็นแท็กซี่นะ บอกลูกค้าจีน/รัสเซียว่า กระเป๋าเอาไว้ด้านหลังได้เลย"\n• "ออกแบบวันเดย์ทริปช้อปปิ้งที่ได้ค่าน้ำให้หน่อย"\n• "หาจุดชาร์จ EV ใกล้เซ็นทรัลภูเก็ต 5 จุด"\n• "ร้านมิชลินเมืองเก่าร้านไหนเด็ด"\n• "Where can I exchange money?"\n${creditFooter}`;

          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, photo: POSTER_IMAGE_URL, caption: welcomeCaption })
          });
          return new Response("OK");
        }

        // 2. ระบบ Broadcast จากกลุ่มแอดมิน
        if (isGroup && (text.startsWith("/broadcast") || caption.startsWith("/broadcast"))) {
          let broadcastContent = (text || caption).replace("/broadcast", "").trim();
          let subscribers = ["479106422"];
          try {
            const subRes = await fetch(`${HUB_URL}?action=get_subscribers`);
            const fetchedList = await subRes.json();
            if (fetchedList && fetchedList.length > 0) subscribers = fetchedList;
          } catch(e) {}

          let successCount = 0;
          for (let customerId of subscribers) {
            try {
              if (msg.photo && msg.photo.length > 0) {
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ chat_id: customerId, photo: msg.photo[msg.photo.length - 1].file_id, caption: broadcastContent + creditFooter })
                });
              } else if (broadcastContent) {
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ chat_id: customerId, text: `📢 **ข่าวประชาสัมพันธ์พิเศษ**\n\n${broadcastContent}${creditFooter}` })
                });
              }
              successCount++;
            } catch(e) {}
          }

          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: `✅ บรอดแคสต์ส่งถึงลูกค้าทั้งหมด ${successCount} ท่านเรียบร้อยแล้วครับ` })
          });
          return new Response("OK");
        }

        // 3. ตอบแชท 1:1 กับลูกค้า
        if (!isGroup && text) {
          fetch(`${HUB_URL}?action=add_subscriber&chat_id=${chatId}&name=${encodeURIComponent(senderName)}&username=${encodeURIComponent(username)}`).catch(()=>{});

          const difyRes = await fetch("https://api.dify.ai/v1/chat-messages", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${DIFY_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: {}, query: text, response_mode: "blocking", user: String(chatId) })
          });

          const difyData = await difyRes.json();
          let replyText = difyData.answer || difyData.message || "ขออภัยครับ ระบบกำลังประมวลผล";
          if (!replyText.includes("Credit Ajarn.Ruj")) replyText += creditFooter;

          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: replyText })
          });

          if (GROUP_CHAT_ID && GROUP_CHAT_ID.startsWith("-100")) {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: GROUP_CHAT_ID,
                text: `🔔 **[แชทใหม่]**\n👤 ${senderName} (ID: \`${chatId}\`)\n💬 "${text}"\n\n🤖 **AI ตอบ:**\n${replyText}`
              })
            });
          }
        }
      } catch (err) {
        console.error("Worker Error:", err);
      }
      return new Response("OK");
    }
    return new Response("Phuket Taxi System is Active");
  }
};
