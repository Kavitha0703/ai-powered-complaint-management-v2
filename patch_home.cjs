const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const regex = /<div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">[\s\S]*?{([^}]*?)Right side: Ask AI Assistant Container[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const replacement = `<div className="max-w-4xl mx-auto flex flex-col items-center relative z-10 text-center">
            {/* Premium Headings */}
            <div className="space-y-8 w-full">
              {/* Tagline */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-950 border border-blue-900 shadow text-cyan-200 rounded-full text-[11px] font-black tracking-wider uppercase mx-auto">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />
                {"Sentry Grade AI Ticket Management"}
              </div>
              
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] mx-auto">
                {"AI-Powered Workplace"}<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">{"Complaint Management"}</span>
              </h2>
              
              <p className="text-slate-200 text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed">
                {"Resolve employee issues 70% faster with intelligent ticket routing, AI diagnostics, real-time tracking and automated SLA management."}
              </p>
              
              <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto px-4 sm:px-0 mx-auto">
                <Link to="/auth/user" className="w-full sm:w-auto">
                  <Button id="tour-get-started-btn" size="lg" className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-extrabold shadow-lg shadow-cyan-500/20 border-0 rounded-2xl h-12 md:h-14 px-8 text-xs transform hover:-translate-y-0.5 transition-all">
                    {"Get Started as User"}<ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                
                <Link to="/auth/admin" className="w-full sm:w-auto">
                  <Button id="tour-admin-portal-btn" size="lg" variant="outline" className="w-full bg-slate-900/40 backdrop-blur-xl border-slate-700/60 text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all rounded-2xl h-12 md:h-14 px-8 text-xs">
                    <ShieldCheck className="mr-2 h-4 w-4 text-cyan-400" /> {"Admin Portal"}
                  </Button>
                </Link>
                
                <Link to="/auth/user" onClick={(e) => {
                  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
                  if (isIframe) {
                    e.preventDefault();
                    setShowLaunchModal(true);
                  }
                }} className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full bg-slate-900/40 backdrop-blur-xl border-slate-700/60 text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all rounded-2xl h-12 md:h-14 px-8 text-xs">
                    {"Launch Demo"}
                  </Button>
                </Link>
              </div>
            </div>
          </div>`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/pages/Home.tsx', code);
    console.log('done');
} else {
    console.log('not found');
}
