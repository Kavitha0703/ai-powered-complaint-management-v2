const fs = require('fs');

const words = {
  "⚠️ Overdue complaints": { es: "⚠️ Quejas atrasadas", fr: "⚠️ Plaintes en retard", hi: "⚠️ अतिदेय शिकायतें", zh: "⚠️ 逾期投诉", ja: "⚠️ 期限切れの苦情" },
  "Which complaints are overdue?": { es: "¿Qué quejas están atrasadas?", fr: "Quelles plaintes sont en retard ?", hi: "कौन सी शिकायतें अतिदेय हैं?", zh: "哪些投诉已逾期？", ja: "期限切れの苦情はどれですか？" },
  "📊 Today's stats summary": { es: "📊 Resumen de estadísticas de hoy", fr: "📊 Résumé des statistiques d'aujourd'hui", hi: "📊 आज के आँकड़े", zh: "📊 今日统计摘要", ja: "📊 今日の統計の概要" },
  "What happened today?": { es: "¿Qué pasó hoy?", fr: "Que s'est-il passé aujourd'hui ?", hi: "आज क्या हुआ?", zh: "今天发生了什么？", ja: "今日は何が起こりましたか？" },
  "📅 Yesterday's completions": { es: "📅 Finalizaciones de ayer", fr: "📅 Réalisations d'hier", hi: "📅 कल की पूर्णताएँ", zh: "📅 昨日完成", ja: "📅 昨日の完了件数" },
  "What did we complete yesterday?": { es: "¿Qué completamos ayer?", fr: "Qu'avons-nous terminé hier ?", hi: "कल हमने क्या पूरा किया?", zh: "我们昨天完成了什么？", ja: "昨日何を完了しましたか？" },
  "📈 Generate weekly report": { es: "📈 Generar informe semanal", fr: "📈 Générer le rapport hebdomadaire", hi: "📈 साप्ताहिक रिपोर्ट जनरेट करें", zh: "📈 生成周报", ja: "📈 週間レポートを生成" },
  "Generate weekly report": { es: "Generar informe semanal", fr: "Générer le rapport hebdomadaire", hi: "साप्ताहिक रिपोर्ट जनरेट करें", zh: "生成周报", ja: "週間レポートを生成" },
  "🧠 How to handle a complaint": { es: "🧠 Cómo manejar una queja", fr: "🧠 Comment gérer une plainte", hi: "🧠 शिकायत को कैसे संभालें", zh: "🧠 如何处理投诉", ja: "🧠 苦情の処理方法" },
  "How should I handle a pending complaint?": { es: "¿Cómo debo manejar una queja pendiente?", fr: "Comment dois-je gérer une plainte en attente ?", hi: "मुझे लंबित शिकायत को कैसे संभालना चाहिए?", zh: "我该如何处理待处理的投诉？", ja: "保留中の苦情にはどう対応すればよいですか？" },
  "🎓 New admin training": { es: "🎓 Formación para nuevos administradores", fr: "🎓 Formation des nouveaux administrateurs", hi: "🎓 नया व्यवस्थापक प्रशिक्षण", zh: "🎓 新管理员培训", ja: "🎓 新任管理者トレーニング" },
  "I am new here. How do I process complaints?": { es: "Soy nuevo aquí. ¿Cómo proceso quejas?", fr: "Je suis nouveau ici. Comment traiter les plaintes ?", hi: "मैं यहाँ नया हूँ। मैं शिकायतों को कैसे संसाधित करूँ?", zh: "我是新来的。我该如何处理投诉？", ja: "私はここに初めて来ました。苦情を処理するにはどうすればよいですか？" },
  "📋 Prepare meeting notes": { es: "📋 Preparar notas de reunión", fr: "📋 Préparer les notes de réunion", hi: "📋 मीटिंग नोट्स तैयार करें", zh: "📋 准备会议纪要", ja: "📋 ミーティングメモを作成" },
  "Prepare a meeting report.": { es: "Preparar un informe de reunión.", fr: "Préparer un rapport de réunion.", hi: "मीटिंग रिपोर्ट तैयार करें।", zh: "准备会议报告。", ja: "会議レポートを作成する。" },
  "💼 Management insights": { es: "💼 Ideas de gestión", fr: "💼 Aperçus de gestion", hi: "💼 प्रबंधन अंतर्दृष्टि", zh: "💼 管理见解", ja: "💼 管理インサイト" },
  "Show management insights.": { es: "Mostrar ideas de gestión.", fr: "Afficher les aperçus de gestion.", hi: "प्रबंधन अंतर्दृष्टि दिखाएं।", zh: "显示管理见解。", ja: "管理インサイトを表示。" }
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
    console.log(`Updated ${lang} with extra keys 15`);
  }
});
