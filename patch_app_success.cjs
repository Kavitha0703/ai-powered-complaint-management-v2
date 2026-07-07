const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const injection = `
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

function InstallSuccessModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleInstall = () => {
      setShow(true);
    };
    window.addEventListener('appinstalled', handleInstall);
    
    // Check if we need to show it from a previously saved state
    if (localStorage.getItem('showInstallSuccess') === 'true') {
      setShow(true);
      localStorage.removeItem('showInstallSuccess');
    }
    
    return () => window.removeEventListener('appinstalled', handleInstall);
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-[#020617]/85 backdrop-blur-sm z-[10001] transition-all flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          className="bg-[#0B1329] border border-slate-800 text-white rounded-3xl w-full max-w-sm pointer-events-auto shadow-2xl overflow-hidden font-sans p-8 text-center"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to Workplace Hub!</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Your AI-powered workplace operations assistant has been installed successfully.
          </p>
          <div className="text-left space-y-2 mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800/50">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Works offline
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant AI assistance
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Real-time notifications
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Secure management
            </div>
          </div>
          <button 
            onClick={() => setShow(false)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl transition-colors"
          >
            Open Workplace Hub
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
`;

if (!code.includes("InstallSuccessModal")) {
  code = code.replace("export default function App() {", injection + "\nexport default function App() {\n");
  code = code.replace("<OnboardingWelcomeModal />", "<OnboardingWelcomeModal />\n          <InstallSuccessModal />");
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched App.tsx");
}
