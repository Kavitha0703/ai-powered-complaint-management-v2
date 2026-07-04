const fs = require('fs');

const words = {
  "IT Hardware": { es: "Hardware TI", fr: "Matériel Informatique", hi: "आईटी हार्डवेयर", zh: "IT 硬件", ja: "IT ハードウェア" },
  "Laptops, monitors, and physical device requests.": { es: "Laptops, monitores y solicitudes de dispositivos físicos.", fr: "Ordinateurs portables, moniteurs et demandes d'appareils physiques.", hi: "लैपटॉप, मॉनिटर और भौतिक डिवाइस अनुरोध।", zh: "笔记本电脑，显示器和物理设备请求。", ja: "ノートパソコン、モニター、物理的なデバイスの要求。" },
  "Cybersecurity": { es: "Ciberseguridad", fr: "Cybersécurité", hi: "साइबर सुरक्षा", zh: "网络安全", ja: "サイバーセキュリティ" },
  "Access issues, VPN failures, and phishing reports.": { es: "Problemas de acceso, fallas de VPN y reportes de phishing.", fr: "Problèmes d'accès, pannes de VPN et signalements de phishing.", hi: "एक्सेस समस्याएं, वीपीएन विफलताएं, और फ़िशिंग रिपोर्ट।", zh: "访问问题，VPN故障和网络钓鱼报告。", ja: "アクセスの問題、VPNの障害、フィッシングの報告。" },
  "Network": { es: "Red", fr: "Réseau", hi: "नेटवर्क", zh: "网络", ja: "ネットワーク" },
  "Wi-Fi connectivity, intranet routing, and slow speeds.": { es: "Conectividad Wi-Fi, enrutamiento de intranet y velocidades lentas.", fr: "Connectivité Wi-Fi, routage intranet et vitesses lentes.", hi: "वाई-फाई कनेक्टिविटी, इंट्रानेट रूटिंग, और धीमी गति।", zh: "Wi-Fi 连接，内网路由和低速。", ja: "Wi-Fi接続、イントラネットルーティング、速度の低下。" },
  "Salary Issues": { es: "Problemas de Salario", fr: "Problèmes de Salaire", hi: "वेतन की समस्याएं", zh: "工资问题", ja: "給与の問題" },
  "Payroll, reimbursement concerns, and compensation queries.": { es: "Nómina, reembolsos y consultas de compensación.", fr: "Paie, préoccupations de remboursement et requêtes de compensation.", hi: "पेरोल, प्रतिपूर्ति संबंधी चिंताएं, और मुआवजे से जुड़े प्रश्न।", zh: "工资单，报销问题和薪酬查询。", ja: "給与計算、払い戻しの懸念、報酬に関する問い合わせ。" },
  "Workplace Services": { es: "Servicios del Lugar de Trabajo", fr: "Services du Lieu de Travail", hi: "कार्यस्थल सेवाएँ", zh: "工作场所服务", ja: "ワークプレイスサービス" },
  "Facilities, office concerns, and general maintenance.": { es: "Instalaciones, preocupaciones de la oficina y mantenimiento general.", fr: "Installations, préoccupations du bureau et maintenance générale.", hi: "सुविधाएं, कार्यालय संबंधी चिंताएं, और सामान्य रखरखाव।", zh: "设施，办公室问题和一般维护。", ja: "施設、オフィスの懸念事項、一般的なメンテナンス。" }
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
    console.log(`Updated ${lang} with extra keys 4`);
  }
});
