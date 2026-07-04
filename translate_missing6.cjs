const fs = require('fs');

const words = {
  "IT Issue": { es: "Problema TI", fr: "Problème Info", hi: "आईटी समस्या", zh: "IT 问题", ja: "IT の問題" },
  "Workstation Terminal Boot Failure": { es: "Fallo de arranque del terminal de la estación de trabajo", fr: "Échec du démarrage du terminal de la station de travail", hi: "वर्कस्टेशन टर्मिनल बूट विफलता", zh: "工作站终端启动失败", ja: "ワークステーションターミナルの起動失敗" },
  "My corporate laptop is failing to complete system boot after the latest software credentials update. It displays error AD_BOOT_404.": { es: "Mi laptop corporativa no completa el arranque después de la última actualización de credenciales. Muestra error AD_BOOT_404.", fr: "Mon ordinateur portable d'entreprise ne parvient pas à démarrer après la dernière mise à jour. Il affiche l'erreur AD_BOOT_404.", hi: "मेरा कॉर्पोरेट लैपटॉप सिस्टम बूट पूरा करने में विफल हो रहा है। यह त्रुटि AD_BOOT_404 प्रदर्शित करता है।", zh: "我的公司笔记本电脑在最近的更新后无法完成系统启动。显示错误 AD_BOOT_404。", ja: "会社のノートパソコンがシステム起動を完了できません。エラー AD_BOOT_404 が表示されます。" },
  
  "Access Request": { es: "Solicitud de Acceso", fr: "Demande d'Accès", hi: "पहुंच अनुरोध", zh: "访问请求", ja: "アクセスリクエスト" },
  "Directory Server Permission Access": { es: "Acceso a permisos del servidor de directorio", fr: "Accès aux autorisations du serveur d'annuaire", hi: "निर्देशिका सर्वर अनुमति पहुंच", zh: "目录服务器权限访问", ja: "ディレクトリーサーバーの許可アクセス" },
  "Requesting access and write authorization to secure network files.\n\nFolder Path: /shared/operations/2026\nBusiness Reason: ": { es: "Solicitando acceso y autorización de escritura para archivos de red seguros.\n\nRuta de la carpeta: /shared/operations/2026\nMotivo comercial: ", fr: "Demande d'accès et d'autorisation d'écriture pour sécuriser les fichiers réseau.\n\nChemin du dossier: /shared/operations/2026\nRaison commerciale: ", hi: "सुरक्षित नेटवर्क फ़ाइलों के लिए पहुंच और लिखने के प्राधिकरण का अनुरोध करना।\n\nफ़ोल्डर पथ: /shared/operations/2026\nव्यावसायिक कारण: ", zh: "请求访问和写入授权以保护网络文件。\n\n文件夹路径: /shared/operations/2026\n业务原因: ", ja: "安全なネットワークファイルへのアクセスと書き込み権限を要求しています。\n\nフォルダパス: /shared/operations/2026\nビジネス上の理由: " },
  
  "Payroll Concern": { es: "Preocupación de Nómina", fr: "Préoccupation de Paie", hi: "पेरोल की चिंता", zh: "工资问题", ja: "給与に関する懸念" },
  "Monthly Salary Disbursement Discrepancy": { es: "Discrepancia en el desembolso del salario mensual", fr: "Écart dans le versement du salaire mensuel", hi: "मासिक वेतन वितरण में विसंगति", zh: "月度工资发放差异", ja: "月給支給の相違" },
  "The June 2026 expense claims or secondary basic package credit has not hit my bank ledger correctly.": { es: "Las reclamaciones de gastos de junio de 2026 o el crédito del paquete básico secundario no han llegado a mi libro mayor bancario correctamente.", fr: "Les demandes de remboursement de frais de juin 2026 n'ont pas atteint mon grand livre bancaire correctement.", hi: "जून 2026 के व्यय दावों या द्वितीयक बुनियादी पैकेज क्रेडिट मेरे बैंक लेज़र में सही ढंग से नहीं पहुंचे हैं।", zh: "2026年6月的费用报销或二级基本薪酬包信用未正确记入我的银行分类账。", ja: "2026年6月の経費請求または2次基本パッケージクレジットが私の銀行台帳に正しく反映されていません。" },
  
  "Facilities Repair": { es: "Reparación de Instalaciones", fr: "Réparation des Installations", hi: "सुविधाओं की मरम्मत", zh: "设施维修", ja: "施設の修理" },
  "Office Climate Control Thermostat Malfunction": { es: "Mal funcionamiento del termostato de control de clima de la oficina", fr: "Dysfonctionnement du thermostat de contrôle climatique du bureau", hi: "कार्यालय जलवायु नियंत्रण थर्मोस्टेट खराबी", zh: "办公室气候控制恒温器故障", ja: "オフィスの気候制御サーモスタットの誤動作" },
  "The climate controller near desk coordinate B12 is unresponsive, causing temperature issues for the team.": { es: "El controlador de clima cerca de la coordenada del escritorio B12 no responde.", fr: "Le contrôleur climatique près des coordonnées du bureau B12 ne répond pas.", hi: "डेस्क समन्वय B12 के पास जलवायु नियंत्रक अनुत्तरदायी है।", zh: "办公桌坐标B12附近的气候控制器无响应。", ja: "デスク座標B12付近の気候コントローラーが応答しません。" },
  
  "Suggestion Box": { es: "Buzón de Sugerencias", fr: "Boîte à Suggestions", hi: "सुझाव पेटी", zh: "建议箱", ja: "目安箱" },
  "Employee Pantry Software Enhancement Proposal": { es: "Propuesta de mejora del software de la despensa de los empleados", fr: "Proposition d'amélioration du logiciel du garde-manger des employés", hi: "कर्मचारी पेंट्री सॉफ्टवेयर संवर्धन प्रस्ताव", zh: "员工茶水间软件改进提案", ja: "従業員用パントリーソフトウェア強化の提案" },
  "Proposal details:\n\nValue benefits:\n": { es: "Detalles de la propuesta:\n\nBeneficios de valor:\n", fr: "Détails de la proposition:\n\nAvantages en valeur:\n", hi: "प्रस्ताव का विवरण:\n\nमूल्य लाभ:\n", zh: "提案详情:\n\n价值收益:\n", ja: "提案の詳細:\n\n価値のメリット:\n" },
  
  "SLA Targets fully achieved": { es: "Objetivos de SLA alcanzados", fr: "Objectifs SLA atteints", hi: "SLA लक्ष्य प्राप्त किए गए", zh: "完全实现 SLA 目标", ja: "SLAターゲット達成" },
  "⚠️ SLA target threshold breached": { es: "⚠️ Umbral objetivo de SLA incumplido", fr: "⚠️ Seuil d'objectif SLA dépassé", hi: "⚠️ SLA लक्ष्य की सीमा का उल्लंघन", zh: "⚠️ 违反SLA目标阈值", ja: "⚠️ SLAターゲットのしきい値を超過しました" },
  "Helper Account": { es: "Cuenta Auxiliar", fr: "Compte Assistant", hi: "सहायक खाता", zh: "助手账户", ja: "ヘルパーアカウント" }
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
    console.log(`Updated ${lang} with extra keys 6`);
  }
});
