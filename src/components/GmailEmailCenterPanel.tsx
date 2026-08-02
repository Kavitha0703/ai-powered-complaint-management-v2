import React, { useState, useEffect } from "react";
import { 
  Mail, Send, CheckCircle2, ShieldCheck, Clock, ExternalLink, RefreshCw, 
  Sparkles, FileText, UserCheck, Video, Lock, BellRing, Eye, Trash2, ChevronRight, X 
} from "lucide-react";
import { 
  getSentEmailsLog, 
  sendEmailViaGmail, 
  isGmailAuthenticated, 
  gmailSignIn, 
  gmailSignOut, 
  getGmailUserEmail, 
  SentEmailRecord, 
  EmailTemplates 
} from "../lib/google/index.ts";

export function GmailEmailCenterPanel({ onClose }: { onClose?: () => void }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isGmailAuthenticated());
  const [emails, setEmails] = useState<SentEmailRecord[]>(getSentEmailsLog());
  const [selectedEmail, setSelectedEmail] = useState<SentEmailRecord | null>(null);

  // Quick Compose state
  const [activeTab, setActiveTab] = useState<'log' | 'compose'>('log');
  const [templateType, setTemplateType] = useState<'custom' | 'admin_invite' | 'meeting_invite' | 'announcement'>('admin_invite');
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [roleInput, setRoleInput] = useState("Administrator");
  const [meetTitle, setMeetTitle] = useState("Weekly Executive Sync");
  const [meetLink, setMeetLink] = useState("https://meet.google.com/abc-defg-hij");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState("");

  useEffect(() => {
    const handleUpdate = () => {
      setEmails(getSentEmailsLog());
    };
    window.addEventListener("dcms_email_sent", handleUpdate);
    return () => window.removeEventListener("dcms_email_sent", handleUpdate);
  }, []);

  const handleToggleAuth = async () => {
    if (isAuthenticated) {
      gmailSignOut();
      setIsAuthenticated(false);
    } else {
      const ok = await gmailSignIn("nasikakavitha@gmail.com");
      if (ok) setIsAuthenticated(true);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail) return;

    setSending(true);
    let finalSubject = subject;
    let finalHtml = customBody;
    let category: SentEmailRecord['category'] = 'general';

    if (templateType === 'admin_invite') {
      const template = EmailTemplates.adminInvite(recipientName || toEmail.split("@")[0], toEmail, roleInput, "Kavitha Admin");
      finalSubject = template.subject;
      finalHtml = template.html;
      category = 'admin_invite';
    } else if (templateType === 'meeting_invite') {
      const template = EmailTemplates.meetingInvite(meetTitle, meetLink, "Kavitha Admin", getGmailUserEmail(), new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " Today");
      finalSubject = template.subject;
      finalHtml = template.html;
      category = 'meeting_invite';
    } else if (templateType === 'announcement') {
      const template = EmailTemplates.announcement(subject || "Workspace System Announcement", customBody || "Important update regarding our workspace platform.", "Kavitha Admin");
      finalSubject = template.subject;
      finalHtml = template.html;
      category = 'announcement';
    }

    const res = await sendEmailViaGmail({
      to: toEmail,
      subject: finalSubject,
      bodyHtml: finalHtml,
      category
    });

    setSending(false);
    if (res.success) {
      setSendSuccess("Email dispatched via Gmail service successfully!");
      setToEmail("");
      setCustomBody("");
      setEmails(getSentEmailsLog());
      setTimeout(() => {
        setSendSuccess("");
        setActiveTab('log');
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center font-bold text-white shadow-lg shadow-rose-500/20">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Gmail Integration & Email Center</h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> OAuth Active
              </span>
            </div>
            <p className="text-xs text-slate-400">Enterprise email invitations, meeting syncs, and status notifications</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleAuth}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all flex items-center gap-1.5 ${
              isAuthenticated 
                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50" 
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {isAuthenticated ? `Gmail Linked (${getGmailUserEmail()})` : "Connect Gmail"}
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex items-center px-6 border-b border-slate-800 bg-slate-900/40 gap-4">
        <button
          onClick={() => setActiveTab('log')}
          className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'log' ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Sent Email Logs ({emails.length})
        </button>
        <button
          onClick={() => setActiveTab('compose')}
          className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'compose' ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Send className="w-3.5 h-3.5" /> Dispatch Enterprise Email
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950/60">
        {activeTab === 'log' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full">
            {/* Email List */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outbox History</span>
                <button onClick={() => setEmails(getSentEmailsLog())} className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              {emails.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800/80">
                  <Mail className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No sent emails logged yet.</p>
                  <button onClick={() => setActiveTab('compose')} className="mt-3 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500">
                    Send First Email
                  </button>
                </div>
              ) : (
                emails.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEmail(item)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedEmail?.id === item.id 
                        ? "bg-slate-800/90 border-indigo-500/60 shadow-lg shadow-indigo-500/10" 
                        : "bg-slate-900/50 border-slate-800/80 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-indigo-500/20">
                        {item.category.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="font-semibold text-xs text-slate-200 truncate">{item.subject}</div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">To: {item.to}</div>
                  </div>
                ))
              )}
            </div>

            {/* Email Detail / HTML Preview */}
            <div className="md:col-span-7 bg-slate-900/60 rounded-xl border border-slate-800 p-4 flex flex-col min-h-[400px]">
              {selectedEmail ? (
                <div className="flex flex-col h-full">
                  <div className="border-b border-slate-800 pb-3 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-indigo-400">To: {selectedEmail.to}</span>
                      <span className="text-[11px] text-slate-400">{new Date(selectedEmail.sentAt).toLocaleString()}</span>
                    </div>
                    <h4 className="font-bold text-sm text-white mt-1">{selectedEmail.subject}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">From: {selectedEmail.senderEmail}</p>
                  </div>
                  <div className="flex-1 bg-slate-950 rounded-lg p-3 border border-slate-800/80 overflow-y-auto">
                    <div 
                      className="text-slate-200 text-xs leading-relaxed" 
                      dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }} 
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <Eye className="w-8 h-8 mb-2 text-slate-600" />
                  <p className="text-xs">Select an email log from the outbox list to render HTML preview</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Compose Tab */
          <form onSubmit={handleSendEmail} className="max-w-2xl mx-auto space-y-4">
            {sendSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {sendSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Email Workflow Template</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'admin_invite', label: 'Admin Invitation', icon: UserCheck },
                  { id: 'meeting_invite', label: 'Google Meet', icon: Video },
                  { id: 'announcement', label: 'Announcement', icon: BellRing },
                  { id: 'custom', label: 'Custom HTML', icon: FileText }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTemplateType(item.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                        templateType === item.id 
                          ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm" 
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Email</label>
                <input
                  type="email"
                  required
                  placeholder="user@enterprise.com"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {templateType === 'admin_invite' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Invitee Full Name</label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {templateType === 'meeting_invite' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Meeting Title</label>
                  <input
                    type="text"
                    placeholder="Weekly Executive Sync"
                    value={meetTitle}
                    onChange={(e) => setMeetTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {templateType === 'custom' || templateType === 'announcement' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subject Line</label>
                  <input
                    type="text"
                    required
                    placeholder="Important updates for Workplace Hub users"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Message Content</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Write announcement body..."
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </>
            ) : null}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={sending}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500 transition-all flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {sending ? "Dispatching..." : "Send via Gmail API"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
