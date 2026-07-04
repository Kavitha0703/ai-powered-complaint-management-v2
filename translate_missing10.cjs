const fs = require('fs');

const words = {
  "Agent Note Posted": { es: "Nota de Agente Publicada", fr: "Note de l'Agent Publiée", hi: "एजेंट नोट पोस्ट किया गया", zh: "代理注释已发布", ja: "エージェントノートが投稿されました" },
  "Notice Broadcasted": { es: "Aviso Transmitido", fr: "Avis Diffusé", hi: "नोटिस प्रसारित किया गया", zh: "通知已广播", ja: "お知らせがブロードキャストされました" },
  "Ticket Logged": { es: "Ticket Registrado", fr: "Ticket Enregistré", hi: "टिकट लॉग किया गया", zh: "工单已记录", ja: "チケットが記録されました" }
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
    console.log(`Updated ${lang} with extra keys 10`);
  }
});
