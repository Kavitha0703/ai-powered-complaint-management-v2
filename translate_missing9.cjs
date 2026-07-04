const fs = require('fs');

const words = {
  "🛡️ Administrator": { es: "🛡️ Administrador", fr: "🛡️ Administrateur", hi: "🛡️ प्रशासक", zh: "🛡️ 管理员", ja: "🛡️ 管理者" },
  "👤 Client portal": { es: "👤 Portal de cliente", fr: "👤 Portail client", hi: "👤 ग्राहक पोर्टल", zh: "👤 客户门户", ja: "👤 クライアントポータル" },
  "System Administrator": { es: "Administrador del Sistema", fr: "Administrateur Système", hi: "सिस्टम व्यवस्थापक", zh: "系统管理员", ja: "システム管理者" },
  "Admin": { es: "Admin", fr: "Admin", hi: "व्यवस्थापक", zh: "管理", ja: "管理" },
  "Administrator": { es: "Administrador", fr: "Administrateur", hi: "प्रशासक", zh: "管理员", ja: "管理者" }
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
    console.log(`Updated ${lang} with extra keys 9`);
  }
});
