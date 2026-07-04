const fs = require('fs');

const words = {
  "Team Operator": { es: "Operador de Equipo", fr: "Opérateur d'Équipe", hi: "टीम ऑपरेटर", zh: "团队操作员", ja: "チームオペレーター" },
  "Cancel Select": { es: "Cancelar Selección", fr: "Annuler la Sélection", hi: "चयन रद्द करें", zh: "取消选择", ja: "選択をキャンセル" },
  "Batch Select": { es: "Selección por Lotes", fr: "Sélection par Lots", hi: "बैच चयन", zh: "批量选择", ja: "一括選択" },
  "Used": { es: "Usado", fr: "Utilisé", hi: "इस्तेमाल किया", zh: "已使用", ja: "使用済み" },
  "Not Used": { es: "No Usado", fr: "Non Utilisé", hi: "इस्तेमाल नहीं किया", zh: "未使用", ja: "未使用" }
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
    console.log(`Updated ${lang} with extra keys 13`);
  }
});
