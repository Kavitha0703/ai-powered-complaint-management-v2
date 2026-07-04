const fs = require('fs');

const words = {
  "Message to #": { es: "Mensaje a #", fr: "Message à #", hi: "संदेश #", zh: "发送消息给 #", ja: "メッセージ宛先 #" },
  "chat": { es: "chat", fr: "chat", hi: "चैट", zh: "聊天", ja: "チャット" },
  "Send direct note to ": { es: "Enviar nota directa a ", fr: "Envoyer une note directe à ", hi: "सीधा नोट भेजें ", zh: "发送直接笔记给 ", ja: "直接ノートを送信 " }
};

const langs = ['es', 'fr', 'hi', 'zh', 'ja'];

langs.forEach(lang => {
  const path = `./src/i18n/locales/${lang}/translation.json`;
  if (fs.existsSync(path)) {
    let data = {};
    try {
      data = JSON.parse(fs.readFileSync(path, 'utf8'));
    } catch(e) {}
    
    for (const [enKey, translations] of Object.entries(words)) {
      data[enKey] = translations[lang];
    }
    
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    console.log(`Updated ${lang} with extra keys 14`);
  }
});
