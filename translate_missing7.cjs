const fs = require('fs');

const words = {
  "🟡 Local Draft Saved Safely": { es: "🟡 Borrador local guardado de forma segura", fr: "🟡 Brouillon local enregistré en toute sécurité", hi: "🟡 स्थानीय ड्राफ्ट सुरक्षित रूप से सहेजा गया", zh: "🟡 本地草稿已安全保存", ja: "🟡 ローカルドラフトが安全に保存されました" },
  "❌ Image upload failed.\n\nPlease try another image.": { es: "❌ Falló la carga de la imagen.\n\nPor favor, inténtelo de nuevo con otra imagen.", fr: "❌ Échec du téléchargement de l'image.\n\nVeuillez essayer une autre image.", hi: "❌ छवि अपलोड विफल।\n\nकृपया कोई अन्य छवि आज़माएं।", zh: "❌ 图片上传失败。\n\n请尝试使用其他图片。", ja: "❌ 画像のアップロードに失敗しました。\n\n別の画像をお試しください。" },
  "❌ No internet connection.\n\nPlease check your network and try again.": { es: "❌ Sin conexión a internet.\n\nPor favor, verifique su red e inténtelo de nuevo.", fr: "❌ Pas de connexion internet.\n\nVeuillez vérifier votre réseau et réessayer.", hi: "❌ कोई इंटरनेट कनेक्शन नहीं है।\n\nकृपया अपने नेटवर्क की जांच करें और पुनः प्रयास करें।", zh: "❌ 无互联网连接。\n\n请检查您的网络并重试。", ja: "❌ インターネット接続がありません。\n\nネットワークを確認して再試行してください。" },
  "❌ Your session has expired.\n\nPlease log in again.": { es: "❌ Su sesión ha expirado.\n\nPor favor, inicie sesión de nuevo.", fr: "❌ Votre session a expiré.\n\nVeuillez vous reconnecter.", hi: "❌ आपका सत्र समाप्त हो गया है।\n\nकृपया फिर से लॉग इन करें।", zh: "❌ 您的会话已过期。\n\n请重新登录。", ja: "❌ セッションの有効期限が切れました。\n\nもう一度ログインしてください。" },
  "❌ Title is required.": { es: "❌ Se requiere el título.", fr: "❌ Le titre est requis.", hi: "❌ शीर्षक आवश्यक है।", zh: "❌ 标题是必需的。", ja: "❌ タイトルは必須です。" },
  "❌ Please enter a complaint description.": { es: "❌ Por favor, ingrese una descripción de la queja.", fr: "❌ Veuillez entrer une description de la plainte.", hi: "❌ कृपया शिकायत का विवरण दर्ज करें।", zh: "❌ 请输入投诉说明。", ja: "❌ 苦情の説明を入力してください。" },
  "🟢 Ticket Details Updated Successfully": { es: "🟢 Detalles del ticket actualizados con éxito", fr: "🟢 Détails du ticket mis à jour avec succès", hi: "🟢 टिकट विवरण सफलतापूर्वक अपडेट किया गया", zh: "🟢 工单详细信息更新成功", ja: "🟢 チケットの詳細が正常に更新されました" },
  "🟢 Ticket Submitted": { es: "🟢 Ticket enviado", fr: "🟢 Ticket soumis", hi: "🟢 टिकट जमा किया गया", zh: "🟢 工单已提交", ja: "🟢 チケットが送信されました" }
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
    console.log(`Updated ${lang} with extra keys 7`);
  }
});
