const fs = require('fs');

let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const oldNavRegex = /<nav className="sticky top-0 z-50[\s\S]*?<\/nav>/;

const newNav = `<nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 bg-white/70 dark:bg-[#0B132B]/85 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20">
            {"D"}</div>
          <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            {"Workplace Hub"}<span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full ml-2 border border-blue-100 dark:border-blue-900/60 uppercase tracking-wider hidden sm:inline-block">{"Enterprise AI Platform"}</span>
          </h1>
        </div>

        {/* Desktop Menu (>1024px) */}
        <div className="space-x-6 text-xs font-black text-slate-705 hidden lg:flex items-center">
          <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-blue-600 active:scale-95 transition-all text-slate-700 dark:text-slate-300">{"Home"}</button>
          <button onClick={() => scrollToSection('features')} className="hover:text-blue-600 active:scale-95 transition-all text-slate-700 dark:text-slate-300">{"Features"}</button>
          <button onClick={() => scrollToSection('ai-triage')} className="hover:text-blue-600 active:scale-95 transition-all text-slate-700 dark:text-slate-300">{"AI Sandbox"}</button>
          <button onClick={() => scrollToSection('faq')} className="hover:text-blue-600 active:scale-95 transition-all text-slate-700 dark:text-slate-300">{"Support"}</button>
        </div>

        {/* Desktop Actions (>1024px) */}
        <div className="hidden lg:flex gap-2 items-center">
          <Button 
            onClick={triggerInstallApp} 
            size="sm" 
            variant="outline"
            className="border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 font-extrabold text-xs px-4 py-2 transition-all duration-200 h-9"
          >
            {"📲 Install App"}</Button>
          <Link 
            to="/auth/user"
            onClick={(e) => {
              const isIframe = typeof window !== 'undefined' && window.self !== window.top;
              if (isIframe) {
                e.preventDefault();
                setShowLaunchModal(true);
              }
            }}
          >
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/10 h-9 transition-all">{"Launch App"}</Button>
          </Link>
          <Link to="/auth/user">
            <Button size="sm" variant="ghost" className="text-slate-700 dark:text-slate-300 font-extrabold text-xs h-9 transition-all">{"Sign In"}</Button>
          </Link>
        </div>

        {/* Tablet Actions (768px - 1024px) */}
        <div className="hidden md:flex lg:hidden gap-2 items-center">
           <Link 
            to="/auth/user"
            onClick={(e) => {
              const isIframe = typeof window !== 'undefined' && window.self !== window.top;
              if (isIframe) {
                e.preventDefault();
                setShowLaunchModal(true);
              }
            }}
          >
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/10 h-9 transition-all">{"Launch"}</Button>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-slate-700 dark:text-slate-200 p-2 ml-2"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Hamburger (<768px) */}
        <div className="md:hidden flex items-center">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-slate-700 dark:text-slate-200 p-2"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>`;

code = code.replace(oldNavRegex, newNav);

// Fix 4. Hero section padding
// Change px-6 to px-6 md:px-12 ? No, padding-inline:24px is already px-6. But let's check what it is.
// "Increase horizontal padding... Current: padding-inline:16px Use padding-inline:24px on phones."
// Tailwind px-6 is 24px! Maybe it was px-4 before?
const heroRegex = /<section className="relative bg-\[#0B132B\] text-white py-24 md:py-32 px-6 overflow-hidden">/;
const newHero = `<section className="relative bg-[#0B132B] text-white py-24 md:py-32 px-6 sm:px-8 overflow-hidden">`;
code = code.replace(heroRegex, newHero);

// 5. Buttons should be stacked on mobile
// <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-4">
const btnsRegex = /<div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-4">([\s\S]*?)<\/div>\s*<\/div>\s*\{?\/\* Right side/;
const newBtns = `<div className="pt-2 flex flex-col sm:flex-row justify-center lg:justify-start gap-4 w-full sm:w-auto px-4 sm:px-0">
                <Link to="/auth/user" className="w-full sm:w-auto">
                  <Button id="tour-get-started-btn" size="lg" className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-extrabold shadow-lg shadow-cyan-500/20 border-0 rounded-2xl h-12 md:h-14 px-8 text-xs transform hover:-translate-y-0.5 transition-all">
                    {"Get Started as User"}<ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/auth/admin" className="w-full sm:w-auto">
                  <Button id="tour-admin-portal-btn" size="lg" variant="outline" className="w-full bg-slate-900/40 backdrop-blur-xl border-slate-700/60 text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all rounded-2xl h-12 md:h-14 px-8 text-xs">
                    <ShieldCheck className="mr-2 h-4 w-4 text-cyan-400" /> {"Admin Portal"}</Button>
                </Link>
                <Link to="/auth/user" onClick={(e) => {
                  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
                  if (isIframe) {
                    e.preventDefault();
                    setShowLaunchModal(true);
                  }
                }} className="w-full sm:w-auto lg:hidden">
                  <Button size="lg" variant="outline" className="w-full bg-slate-900/40 backdrop-blur-xl border-slate-700/60 text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all rounded-2xl h-12 md:h-14 px-8 text-xs">
                    {"Launch Demo"}</Button>
                </Link>
              </div>
            </div>
            {/* Right side`;

code = code.replace(btnsRegex, newBtns);

fs.writeFileSync('src/pages/Home.tsx', code);
