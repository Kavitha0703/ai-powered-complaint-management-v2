const fs = require('fs');
let code = fs.readFileSync('src/components/GoogleCalendarPanel.tsx', 'utf-8');

const bannerRegex = /\{\/\* Status \/ Auth Banner \*\/\}[\s\S]*?\{\/\* Action bar \*\/\}/;
code = code.replace(bannerRegex, '{/* Action bar */}');

// Add the connect button near the refresh button
const refreshButtonCode = `<button
            onClick={loadEvents}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
            title="Refresh Calendar"
          >
            <RefreshCw className={\`w-4 h-4 \${isLoading ? 'animate-spin text-indigo-400' : ''}\`} />
          </button>`;

const newRefreshButtonCode = `
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="px-2 py-1.5 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer transition-colors flex items-center gap-1"
              title="Disconnect Google Calendar"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Google connected
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="px-2 py-1.5 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer transition-colors border-none flex items-center gap-1"
              title="Connect Google Calendar"
            >
              <Sparkles className="w-3 h-3" />
              Connect Google
            </button>
          )}
          ${refreshButtonCode}
`;

code = code.replace(refreshButtonCode, newRefreshButtonCode);
fs.writeFileSync('src/components/GoogleCalendarPanel.tsx', code);
console.log("Patched Calendar Header");
