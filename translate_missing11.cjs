const fs = require('fs');

const words = {
  "New message bubble added to support context on ticket ": { es: "Nueva burbuja de mensaje añadida al contexto de soporte en el ticket ", fr: "Nouvelle bulle de message ajoutée au contexte de support sur le ticket ", hi: "टिकट पर समर्थन संदर्भ के लिए नया संदेश बुलबुला जोड़ा गया ", zh: "添加了新的消息气泡以支持工单上下文 ", ja: "チケットのサポートコンテキストに新しいメッセージバブルが追加されました " }
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
    console.log(`Updated ${lang} with extra keys 11`);
  }
});
