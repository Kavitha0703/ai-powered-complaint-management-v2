const fs = require('fs');

const words = {
  "Hardware": { es: "Hardware", fr: "Matériel", hi: "हार्डवेयर", zh: "硬件", ja: "ハードウェア" },
  "Software": { es: "Software", fr: "Logiciel", hi: "सॉफ्टवेयर", zh: "软件", ja: "ソフトウェア" },
  "Network": { es: "Red", fr: "Réseau", hi: "नेटवर्क", zh: "网络", ja: "ネットワーク" },
  "HR": { es: "RRHH", fr: "RH", hi: "एचआर", zh: "人力资源", ja: "人事" },
  "Facilities": { es: "Instalaciones", fr: "Installations", hi: "सुविधाएं", zh: "设施", ja: "施設" },
  "Security": { es: "Seguridad", fr: "Sécurité", hi: "सुरक्षा", zh: "安全", ja: "セキュリティ" },
  "Finance": { es: "Finanzas", fr: "Finance", hi: "वित्त", zh: "财务", ja: "財務" },
  "Operations": { es: "Operaciones", fr: "Opérations", hi: "संचालन", zh: "运营", ja: "運営" },
  "Management": { es: "Gestión", fr: "Gestion", hi: "प्रबंधन", zh: "管理", ja: "管理" },
  "IT Support": { es: "Soporte TI", fr: "Support Info", hi: "आईटी सपोर्ट", zh: "IT支持", ja: "ITサポート" },
  
  "Low": { es: "Baja", fr: "Faible", hi: "कम", zh: "低", ja: "低" },
  "Medium": { es: "Media", fr: "Moyenne", hi: "मध्यम", zh: "中", ja: "中" },
  "High": { es: "Alta", fr: "Élevée", hi: "उच्च", zh: "高", ja: "高" },
  "Critical": { es: "Crítica", fr: "Critique", hi: "गंभीर", zh: "重大", ja: "重大" },
  "Urgent": { es: "Urgente", fr: "Urgent", hi: "अति आवश्यक", zh: "紧急", ja: "緊急" },
  
  "30 Minutes": { es: "30 Minutos", fr: "30 Minutes", hi: "30 मिनट", zh: "30分钟", ja: "30分" },
  "2 Hours": { es: "2 Horas", fr: "2 Heures", hi: "2 घंटे", zh: "2小时", ja: "2時間" },
  "4 Hours": { es: "4 Horas", fr: "4 Heures", hi: "4 घंटे", zh: "4小时", ja: "4時間" },
  "24 Hours": { es: "24 Horas", fr: "24 Heures", hi: "24 घंटे", zh: "24小时", ja: "24時間" },
  "48 Hours": { es: "48 Horas", fr: "48 Heures", hi: "48 घंटे", zh: "48小时", ja: "48時間" },
  "72 Hours": { es: "72 Horas", fr: "72 Heures", hi: "72 घंटे", zh: "72小时", ja: "72時間" },
  "1 Week": { es: "1 Semana", fr: "1 Semaine", hi: "1 सप्ताह", zh: "1周", ja: "1週間" },
  
  "Active": { es: "Activo", fr: "Actif", hi: "सक्रिय", zh: "活跃", ja: "アクティブ" },
  "Pending": { es: "Pendiente", fr: "En attente", hi: "लंबित", zh: "待处理", ja: "保留中" },
  "In Progress": { es: "En curso", fr: "En cours", hi: "प्रगति पर", zh: "进行中", ja: "進行中" },
  "Resolved": { es: "Resuelto", fr: "Résolu", hi: "हल", zh: "已解决", ja: "解決済" },
  
  "neural_routing_sandbox_v3.sh": { es: "neural_routing_sandbox_v3.sh", fr: "neural_routing_sandbox_v3.sh", hi: "neural_routing_sandbox_v3.sh", zh: "neural_routing_sandbox_v3.sh", ja: "neural_routing_sandbox_v3.sh" },
  "GEMINI 2.5 FLASH": { es: "GEMINI 2.5 FLASH", fr: "GEMINI 2.5 FLASH", hi: "GEMINI 2.5 FLASH", zh: "GEMINI 2.5 FLASH", ja: "GEMINI 2.5 FLASH" },
  
  "My laptop won't turn on": { es: "Mi laptop no enciende", fr: "Mon ordinateur portable ne s'allume pas", hi: "मेरा लैपटॉप चालू नहीं हो रहा है", zh: "我的笔记本电脑无法开机", ja: "ノートパソコンの電源が入らない" },
  "When will I get my bonus?": { es: "¿Cuándo recibiré mi bono?", fr: "Quand vais-je recevoir ma prime ?", hi: "मुझे मेरा बोनस कब मिलेगा?", zh: "我什么时候能拿到奖金？", ja: "ボーナスはいつもらえますか？" },
  "AC is leaking in meeting room B": { es: "El aire acondicionado gotea en la sala B", fr: "La clim fuit dans la salle B", hi: "मीटिंग रूम B में AC लीक हो रहा है", zh: "会议室B的空调漏水", ja: "会議室Bでエアコンが水漏れしている" },
  "My leave request is not approved": { es: "Mi solicitud de permiso no está aprobada", fr: "Ma demande de congé n'est pas approuvée", hi: "मेरी छुट्टी का अनुरोध स्वीकृत नहीं है", zh: "我的请假申请未获批准", ja: "休暇申請が承認されません" },
  
  "What is the SLA for Critical incidents?": { es: "¿Cuál es el SLA para incidentes Críticos?", fr: "Quel est le SLA pour les incidents critiques ?", hi: "गंभीर घटनाओं के लिए SLA क्या है?", zh: "重大事件的SLA是什么？", ja: "重大なインシデントのSLAは何ですか？" },
  "How do I track my ticket status?": { es: "¿Cómo rastreo el estado de mi ticket?", fr: "Comment suivre l'état de mon ticket ?", hi: "मैं अपने टिकट की स्थिति कैसे ट्रैक करूं?", zh: "我如何跟踪我的工单状态？", ja: "チケットのステータスを追跡するにはどうすればよいですか？" },
  "Can I attach images to my support request?": { es: "¿Puedo adjuntar imágenes a mi solicitud?", fr: "Puis-je joindre des images à ma demande ?", hi: "क्या मैं अपने अनुरोध में चित्र संलग्न कर सकता हूँ?", zh: "我可以在支持请求中附上图片吗？", ja: "サポートリクエストに画像を添付できますか？" },
  "What if my issue requires approval?": { es: "¿Qué pasa si mi problema requiere aprobación?", fr: "Et si mon problème nécessite une approbation ?", hi: "क्या होगा यदि मेरे मुद्दे को अनुमोदन की आवश्यकता है?", zh: "如果我的问题需要批准怎么办？", ja: "問題に承認が必要な場合はどうなりますか？" },
  
  "Critical (P1) incidents like server outages or security breaches have a mandatory 30-minute first-response SLA and an expected resolution timeframe of under 2 hours.": {
      es: "Los incidentes críticos (P1) tienen un SLA de respuesta de 30 minutos.", 
      fr: "Les incidents critiques (P1) ont un SLA de réponse de 30 minutes.", 
      hi: "गंभीर (P1) घटनाओं में 30 मिनट का SLA होता है।", 
      zh: "重大 (P1) 事件具有 30 分钟的 SLA。", 
      ja: "重大 (P1) インシデントには30分のSLAがあります。"
  },
  "Every ticket has a real-time timeline accessible via the 'User Client gateway'. You will see exact status updates (Pending, In Progress, Resolved) and AI reasoning metadata.": {
      es: "Cada ticket tiene una línea de tiempo accesible en tiempo real.",
      fr: "Chaque ticket a une chronologie accessible en temps réel.",
      hi: "प्रत्येक टिकट में एक वास्तविक समय की समयरेखा होती है।",
      zh: "每个工单都有一个可访问的实时时间线。",
      ja: "各チケットにはアクセス可能なリアルタイムのタイムラインがあります。"
  },
  "Yes. Using our AI Smart Camera or standard file upload, you can attach receipts, error codes, and hardware photos. Optical Character Recognition (OCR) will automatically parse text from them.": {
      es: "Sí, puede adjuntar imágenes y usar OCR.",
      fr: "Oui, vous pouvez joindre des images et utiliser l'OCR.",
      hi: "हाँ, आप चित्र संलग्न कर सकते हैं और OCR का उपयोग कर सकते हैं।",
      zh: "是的，您可以附加图像并使用OCR。",
      ja: "はい、画像を添付してOCRを使用できます。"
  },
  "The system automatically detects if an approval chain is needed (e.g. Finance for budgets). It routes to the appropriate supervisor portal immediately to ensure SLA limits aren't breached.": {
      es: "El sistema detecta automáticamente si se necesita aprobación.",
      fr: "Le système détecte automatiquement si une approbation est nécessaire.",
      hi: "सिस्टम स्वचालित रूप से पता लगाता है कि क्या अनुमोदन की आवश्यकता है।",
      zh: "系统会自动检测是否需要批准。",
      ja: "システムは承認が必要かどうかを自動的に検出します。"
  }
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
    console.log(`Updated ${lang}`);
  }
});
