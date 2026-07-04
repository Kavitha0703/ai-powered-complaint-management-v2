const fs = require('fs');

const langs = ['en', 'es', 'fr', 'hi', 'zh', 'ja'];
const namespaces = ['common', 'sidebar', 'dashboard', 'tickets', 'timeline', 'aiAssistant'];

let imports = '';
let resourcesObj = '';

for (const lang of langs) {
  let langRes = `${lang}: {\n`;
  for (const ns of namespaces) {
    const varName = `${lang}_${ns}`;
    imports += `import ${varName} from './i18n/locales/${lang}/${ns}.json';\n`;
    langRes += `    ${ns}: ${varName},\n`;
  }
  langRes += `  },\n`;
  resourcesObj += langRes;
}

const content = `import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

${imports}

const debugPostProcessor = {
  type: 'postProcessor',
  name: 'debugProcessor',
  process: function(value, key, options, translator) {
    if (localStorage.getItem('i18n_debug_mode') === 'true') {
      return \`[T] \${value}\`;
    }
    return value;
  }
};

const resources = {
${resourcesObj}
};

i18n
  .use(LanguageDetector)
  .use(debugPostProcessor)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    ns: ['common', 'sidebar', 'dashboard', 'tickets', 'timeline', 'aiAssistant'],
    defaultNS: 'common',
    postProcess: ['debugProcessor'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'app_language',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    parseMissingKeyHandler: (key) => key,
  });

export default i18n;
`;

fs.writeFileSync('src/i18n.ts', content);
console.log('src/i18n.ts updated.');
