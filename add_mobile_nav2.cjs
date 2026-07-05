const fs = require('fs');

let code = fs.readFileSync('src/components/DashboardLayout.tsx', 'utf8');

const regex = /\s*\}\)\}\s*<\/nav>\s*<\/div>\s*\{\/\* Footer Profile/;

const replacement = `                   })}
                    {isMobileDrawer && (
                      <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <button 
                          onClick={() => { setMobileSidebarOpen(false); setNotifOpen(true); }}
                          className="w-full flex items-center px-3 pl-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                        >
                          <Bell className="w-4 h-4 shrink-0 transition-transform duration-200 text-slate-400 mr-3" />
                          <span>{"Notifications"}</span>
                          {unreadCount > 0 && (
                            <span className="ml-auto w-5 h-5 bg-red-500 rounded-full text-[10px] text-white font-extrabold flex items-center justify-center animate-bounce">
                              {unreadCount}
                            </span>
                          )}
                        </button>

                        <button 
                          onClick={() => { setMobileSidebarOpen(false); window.dispatchEvent(new CustomEvent("open-install-modal")); }}
                          className="w-full flex items-center px-3 pl-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                        >
                          <Smartphone className="w-4 h-4 shrink-0 transition-transform duration-200 text-cyan-500 mr-3" />
                          <span>{"Install App"}</span>
                        </button>
                        
                        <button 
                          onClick={() => { setMobileSidebarOpen(false); setTheme(theme === 'dark' ? 'light' : 'dark'); }}
                          className="w-full flex items-center px-3 pl-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                        >
                          {theme === 'dark' ? <Sun className="w-4 h-4 shrink-0 transition-transform duration-200 text-amber-500 mr-3" /> : <Moon className="w-4 h-4 shrink-0 transition-transform duration-200 text-slate-500 mr-3" />}
                          <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
                        </button>
                      </div>
                    )}
                 </nav>
              </div>

              {/* Footer Profile`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/components/DashboardLayout.tsx', code);
