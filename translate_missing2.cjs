const fs = require('fs');

const words = {
  "© 2026 Digital Workplace Operations Platform (Workplace Hub). All rights reserved.": {
      es: "© 2026 Digital Workplace Operations Platform (Workplace Hub). Todos los derechos reservados.",
      fr: "© 2026 Digital Workplace Operations Platform (Workplace Hub). Tous droits réservés.",
      hi: "© 2026 डिजिटल कार्यस्थल संचालन मंच (वर्कप्लेस हब)। सर्वाधिकार सुरक्षित।",
      zh: "© 2026 数字工作场所运营平台 (Workplace Hub)。保留所有权利。",
      ja: "© 2026 デジタルワークプレイスオペレーションプラットフォーム (Workplace Hub)。無断複写・転載を禁じます。"
  },
  "Priority": { es: "Prioridad", fr: "Priorité", hi: "प्राथमिकता", zh: "优先级", ja: "優先度" },
  "Category": { es: "Categoría", fr: "Catégorie", hi: "श्रेणी", zh: "类别", ja: "カテゴリー" },
  "SLA": { es: "SLA", fr: "SLA", hi: "SLA", zh: "SLA", ja: "SLA" }
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
      if (!data[enKey]) {
        data[enKey] = translations[lang];
      }
    }
    
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    console.log(`Updated ${lang} with extra keys`);
  }
});
