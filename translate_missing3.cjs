const fs = require('fs');

const words = {
  "My salary is delayed": { es: "Mi salario está retrasado", fr: "Mon salaire est retardé", hi: "मेरा वेतन देर से आया है", zh: "我的工资延迟了", ja: "給料が遅れています" },
  "Need a new laptop": { es: "Necesito una nueva laptop", fr: "Besoin d'un nouvel ordinateur portable", hi: "नए लैपटॉप की आवश्यकता है", zh: "需要新笔记本电脑", ja: "新しいノートパソコンが必要です" },
  "I cannot access the finance folder": { es: "No puedo acceder a la carpeta de finanzas", fr: "Je ne peux pas accéder au dossier financier", hi: "मैं वित्त फ़ोल्डर तक नहीं पहुंच सकता", zh: "我无法访问财务文件夹", ja: "財務フォルダにアクセスできません" },
  "Department report still pending": { es: "El informe del departamento sigue pendiente", fr: "Le rapport du département est toujours en attente", hi: "विभाग की रिपोर्ट अभी भी लंबित है", zh: "部门报告仍在处理中", ja: "部門レポートはまだ保留中です" },
  "My leave request is not approved": { es: "Mi solicitud de permiso no está aprobada", fr: "Ma demande de congé n'est pas approuvée", hi: "मेरी छुट्टी का अनुरोध स्वीकृत नहीं है", zh: "我的请假申请未获批准", ja: "休暇申請が承認されません" },
  "Workplace Hub AI Assistant": { es: "Workplace Hub AI Assistant", fr: "Workplace Hub AI Assistant", hi: "वर्कप्लेस हब एआई सहायक", zh: "Workplace Hub AI 助手", ja: "Workplace Hub AI アシスタント" },
  "Enterprise AI Platform": { es: "Plataforma de IA Empresarial", fr: "Plateforme d'IA d'Entreprise", hi: "एंटरप्राइज एआई प्लेटफॉर्म", zh: "企业 AI 平台", ja: "エンタープライズ AI プラットフォーム" }
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
    console.log(`Updated ${lang} with extra keys 3`);
  }
});
