const fs = require('fs');
let code = fs.readFileSync('src/components/DashboardLayout.tsx', 'utf8');

const target = `            {/* LANGUAGE SELECTOR */}
            <div>
              <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><Settings className="w-5 h-5" /></button>
            </div>`;

code = code.replace(target, '');

fs.writeFileSync('src/components/DashboardLayout.tsx', code);
