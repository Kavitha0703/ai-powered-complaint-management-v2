const fs = require('fs');

let content = fs.readFileSync('src/pages/AdminManagement.tsx', 'utf-8');

const insertionTarget = `            )}
          </div>

        </div>
      </div>

      {/* Edit Role Modal */}`;

const pendingSection = `            )}
          </div>
        </div>
        
        {/* Right: Pending Invites Matrix Board */}
        <div className="lg:col-span-9 bg-white dark:bg-[#0B1222] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-500" />
              {"Pending Invitations ("}{pendingInvitesList.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            {filteredPendingInvites.length > 0 ? (
              filteredPendingInvites.map((admin) => {
                return (
                  <div 
                    key={admin.id}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50/50 dark:bg-[#0E172B] hover:bg-slate-50 dark:hover:bg-[#111C35] rounded-2xl border border-slate-100 dark:border-slate-800/80 transition-all gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs uppercase bg-slate-200 dark:bg-slate-800 text-slate-500">
                          {admin.name?.[0] || "?"}
                        </div>
                      </div>
                      <div className="flex flex-col text-left space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[150px] sm:max-w-[200px]">{admin.name}</span>
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                            {admin.role.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{admin.email}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                      <button 
                        onClick={() => handleDelete(admin.id)}
                        className="p-2 bg-white dark:bg-[#0B1222] hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 rounded-xl transition-colors border border-slate-200 dark:border-slate-800 shadow-sm"
                        title="Revoke / Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
                <ShieldAlert className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                <div className="space-y-1">
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300 block">{"No pending invitations"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Role Modal */}`;

content = content.replace(insertionTarget, pendingSection);
fs.writeFileSync('src/pages/AdminManagement.tsx', content);
