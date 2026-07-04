const fs = require('fs');

const words = {
  "💰 My salary is delayed": { es: "💰 Mi salario está retrasado", fr: "💰 Mon salaire est retardé", hi: "💰 मेरा वेतन विलंबित है", zh: "💰 我的工资延迟了", ja: "💰 給与が遅れています" },
  "My salary for June is delayed and has not been credited to my account.": { es: "Mi salario de junio está retrasado y no ha sido acreditado en mi cuenta.", fr: "Mon salaire de juin est retardé et n'a pas été crédité sur mon compte.", hi: "जून के लिए मेरा वेतन विलंबित है और मेरे खाते में जमा नहीं किया गया है।", zh: "我 6 月的工资已延迟，尚未存入我的账户。", ja: "6月分の給与が遅れており、口座に振り込まれていません。" },
  "🔑 Access request": { es: "🔑 Solicitud de acceso", fr: "🔑 Demande d'accès", hi: "🔑 पहुँच अनुरोध", zh: "🔑 访问请求", ja: "🔑 アクセスリクエスト" },
  "I cannot access the team folder and require permission/privilege allocation.": { es: "No puedo acceder a la carpeta del equipo y requiero asignación de permisos/privilegios.", fr: "Je ne peux pas accéder au dossier d'équipe et nécessite une attribution d'autorisation/de privilèges.", hi: "मैं टीम फ़ोल्डर तक नहीं पहुँच सकता और मुझे अनुमति/विशेषाधिकार आवंटन की आवश्यकता है।", zh: "我无法访问团队文件夹，需要权限/特权分配。", ja: "チームフォルダにアクセスできず、権限/権限の割り当てが必要です。" },
  "🖥 System issue": { es: "🖥 Problema del sistema", fr: "🖥 Problème système", hi: "🖥 सिस्टम समस्या", zh: "🖥 系统问题", ja: "🖥 システムの問題" },
  "I have a system issue/hardware failure on my laptop that needs IT support.": { es: "Tengo un problema de sistema/falla de hardware en mi computadora portátil que necesita soporte de TI.", fr: "J'ai un problème système/une défaillance matérielle sur mon ordinateur portable qui nécessite une assistance informatique.", hi: "मेरे लैपटॉप पर सिस्टम समस्या/हार्डवेयर विफलता है जिसके लिए आईटी समर्थन की आवश्यकता है।", zh: "我的笔记本电脑出现系统问题/硬件故障，需要 IT 支持。", ja: "ノートパソコンにシステムの問題/ハードウェアの障害が発生しており、IT サポートが必要です。" },
  "📄 Department report pending": { es: "📄 Informe de departamento pendiente", fr: "📄 Rapport de département en attente", hi: "📄 विभाग की रिपोर्ट लंबित है", zh: "📄 部门报告待处理", ja: "📄 部門レポートが保留中" },
  "I have a pending department report/operations workflow blocker.": { es: "Tengo un informe de departamento pendiente/bloqueador de flujo de trabajo de operaciones.", fr: "J'ai un rapport de service en attente/un bloqueur de flux de travail des opérations.", hi: "मेरे पास एक लंबित विभाग रिपोर्ट/संचालन वर्कफ़्लो अवरोधक है।", zh: "我有一个待处理的部门报告/运营工作流阻止程序。", ja: "保留中の部門レポート/運用ワークフローのブロッカーがあります。" },
  "🏢 Facilities complaint": { es: "🏢 Queja de instalaciones", fr: "🏢 Plainte concernant les installations", hi: "🏢 सुविधाओं की शिकायत", zh: "🏢 设施投诉", ja: "🏢 施設の苦情" },
  "Facilities/office maintenance support is requested for an workspace issue.": { es: "Se solicita apoyo de mantenimiento de instalaciones/oficinas por un problema en el espacio de trabajo.", fr: "Une assistance à l'entretien des installations/des bureaux est demandée pour un problème d'espace de travail.", hi: "कार्यक्षेत्र की समस्या के लिए सुविधाओं/कार्यालय रखरखाव सहायता का अनुरोध किया जाता है।", zh: "请求设施/办公室维护支持以解决工作区问题。", ja: "ワークスペースの問題について、施設/オフィスのメンテナンスサポートがリクエストされています。" }
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
    console.log(`Updated ${lang} with extra keys 16`);
  }
});
