const fs = require('fs');

const words = {
  "Overview": { es: "Resumen", fr: "Aperçu", hi: "अवलोकन", zh: "概览", ja: "概要" },
  "Dashboard": { es: "Panel", fr: "Tableau de Bord", hi: "डैशबोर्ड", zh: "仪表板", ja: "ダッシュボード" },
  "🤖 AI Assistant": { es: "🤖 Asistente de IA", fr: "🤖 Assistant IA", hi: "🤖 एआई असिस्टेंट", zh: "🤖 AI 助手", ja: "🤖 AI アシスタント" },
  "Service Desk": { es: "Mesa de Servicio", fr: "Centre de Services", hi: "सर्विस डेस्क", zh: "服务台", ja: "サービスデスク" },
  "Create Ticket": { es: "Crear Ticket", fr: "Créer un Ticket", hi: "टिकट बनाएं", zh: "创建工单", ja: "チケットを作成" },
  "My Tickets": { es: "Mis Tickets", fr: "Mes Tickets", hi: "मेरे टिकट", zh: "我的工单", ja: "マイチケット" },
  "Draft Tickets": { es: "Borradores de Tickets", fr: "Brouillons de Tickets", hi: "ड्राफ्ट टिकट", zh: "草稿工单", ja: "下書きチケット" },
  "Help Center": { es: "Centro de Ayuda", fr: "Centre d'Aide", hi: "सहायता केंद्र", zh: "帮助中心", ja: "ヘルプセンター" },
  "Communication": { es: "Comunicación", fr: "Communication", hi: "संचार", zh: "通讯", ja: "コミュニケーション" },
  "Announcements": { es: "Anuncios", fr: "Annonces", hi: "घोषणाएँ", zh: "公告", ja: "お知らせ" },
  "Notifications": { es: "Notificaciones", fr: "Notifications", hi: "सूचनाएं", zh: "通知", ja: "通知" },
  "Feedback": { es: "Comentarios", fr: "Retour d'Information", hi: "प्रतिक्रिया", zh: "反馈", ja: "フィードバック" },
  "Admin Dashboard": { es: "Panel de Administración", fr: "Tableau de Bord Administrateur", hi: "व्यवस्थापक डैशबोर्ड", zh: "管理员仪表板", ja: "管理ダッシュボード" },
  "Ticket Center": { es: "Centro de Tickets", fr: "Centre de Tickets", hi: "टिकट केंद्र", zh: "工单中心", ja: "チケットセンター" },
  "Manage Tickets": { es: "Gestionar Tickets", fr: "Gérer les Tickets", hi: "टिकट प्रबंधित करें", zh: "管理工单", ja: "チケットを管理" },
  "Team Chat": { es: "Chat de Equipo", fr: "Chat d'Équipe", hi: "टीम चैट", zh: "团队聊天", ja: "チームチャット" },
  "Communication Center": { es: "Centro de Comunicación", fr: "Centre de Communication", hi: "संचार केंद्र", zh: "通讯中心", ja: "コミュニケーションセンター" },
  "Admin Management": { es: "Gestión de Administración", fr: "Gestion Administrative", hi: "व्यवस्थापक प्रबंधन", zh: "管理员管理", ja: "管理者管理" },
  "View Feedback": { es: "Ver Comentarios", fr: "Voir les Retours", hi: "प्रतिक्रिया देखें", zh: "查看反馈", ja: "フィードバックを見る" }
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
    console.log(`Updated ${lang} with extra keys 8`);
  }
});
