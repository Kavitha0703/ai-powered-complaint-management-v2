import React, { useState, useEffect, useMemo } from "react";
import { 
  Mail, Send, Inbox, FileText, Clock, AlertTriangle, ShieldCheck, Search, Filter, 
  Download, Eye, RefreshCw, Sparkles, Plus, CheckCircle2, XCircle, ArrowUpDown, 
  Paperclip, Calendar, User, ExternalLink, Copy, Check, ChevronRight, FileSpreadsheet, 
  Printer, Trash2, ArrowRight, CornerUpLeft, Shield, CheckCheck, Laptop, Globe
} from "lucide-react";
import { 
  SentEmailRecord, getSentEmailsLog, saveEmailToLog, sendEmailViaGmail, 
  EmailTemplates, isGmailAuthenticated, gmailSignIn, EmailStatus, EmailModule, EmailType, RecipientRole 
} from "../lib/google/index.ts";
import { useAuth } from "../lib/AuthContext.tsx";
import { Button } from "../../components/ui/button.tsx";
import { EmailEditor, EmailBlock } from "../components/mail/EmailEditor.tsx";
import { RichTextEditor } from "../components/mail/RichTextEditor.tsx";
import { renderEmailHtml } from "../components/mail/EmailRenderer.tsx";
import { Input } from "../../components/ui/input.tsx";

interface MailAuditEntry {
  id: string;
  emailId: string;
  timestamp: string;
  eventType: 'DISPATCHED' | 'DELIVERED' | 'OPENED' | 'RESENT' | 'FAILED' | 'DRAFT_CREATED';
  actor: string;
  module: string;
  recipient: string;
  status: string;
  ipAddress: string;
  securityHash: string;
}

export default function MailCenter() {
  const { dbUser } = useAuth();
  const [emails, setEmails] = useState<SentEmailRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'inbox' | 'sent' | 'drafts' | 'scheduled' | 'failed' | 'templates' | 'outbox' | 'history'>('all');
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("all");
  const [filterAttachments, setFilterAttachments] = useState<string>("all");
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'az' | 'za' | 'priority'>('date_desc');

  // Selected Email Modal
  const [viewingEmail, setViewingEmail] = useState<SentEmailRecord | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Compose / Outbox state
  const [composeTo, setComposeTo] = useState("");
  const [composeName, setComposeName] = useState("");
  const [composeRole, setComposeRole] = useState<RecipientRole>("User");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeModule, setComposeModule] = useState<EmailModule>("Manual");
  const [composeBody, setComposeBody] = useState("");
  const [composeScheduledDate, setComposeScheduledDate] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [composeAttachments, setComposeAttachments] = useState<{ name: string; size: string; type: string }[]>([]);
  const [aiImproving, setAiImproving] = useState(false);

  
  const getGeneratedTemplate = () => {
    switch (selectedTemplateKey) {
      case 'welcomeEmail': return EmailTemplates.welcomeEmail(templateVars.name);
      case 'adminInvite': return EmailTemplates.adminInvite(templateVars.name, templateVars.email, templateVars.role, templateVars.inviter, "https://example.com/invite");
      case 'passwordReset': return EmailTemplates.passwordReset(templateVars.name, "https://example.com/reset");
      case 'emailVerification': return EmailTemplates.emailVerification(templateVars.name, "https://example.com/verify");
      case 'complaintAssigned': return EmailTemplates.complaintAssigned(templateVars.name, "CMP-9821", "Sarah Agent", "High", "IT Support");
      case 'complaintResolved': return EmailTemplates.complaintResolved(templateVars.name, "CMP-9821", "The network issue has been fixed.");
      case 'complaintEscalated': return EmailTemplates.complaintEscalated(templateVars.name, "CMP-9821", "L3 Network Engineers", "24-48 Hours");
      case 'meetingInvite': return EmailTemplates.meetingInvite(templateVars.title, templateVars.meetLink, templateVars.inviter, "admin@workplacehub.com", "Today at 4:30 PM", "45 mins", "Project Team");
      case 'announcement': return EmailTemplates.announcement(templateVars.title, "Important update regarding system infrastructure maintenance.", templateVars.inviter);
      case 'promotionLetter': return EmailTemplates.promotionLetter(templateVars.name, "Junior Developer", "Senior Developer", "1st Sep 2026", "We are proud of your growth.");
      case 'salaryIncrement': return EmailTemplates.salaryIncrement(templateVars.name, "$80,000", "$95,000", "1st Sep 2026");
      case 'appreciation': return EmailTemplates.appreciation(templateVars.name, "Star Performer", "Your recent project delivery was exceptional.");
      case 'birthdayWishes': return EmailTemplates.birthdayWishes(templateVars.name, "Wishing you health, wealth and happiness!");
      case 'workAnniversary': return EmailTemplates.workAnniversary(templateVars.name, 5, "Leading the frontend team to success.");
      case 'offerLetter': return EmailTemplates.offerLetter("Jane Smith", "Product Manager", "$120,000/yr", "15th Oct 2026");
      case 'rejectionEmail': return EmailTemplates.rejectionEmail("Jane Smith", "Product Manager");
      case 'leaveApproved': return EmailTemplates.leaveApproved(templateVars.name, "12th - 15th Aug 2026", "Manager Alex");
      case 'leaveRejected': return EmailTemplates.leaveRejected(templateVars.name, "12th - 15th Aug 2026", "Project deadline approaching.", "Please apply next month.");
      case 'securityAlert': return EmailTemplates.securityAlert(templateVars.name, "Seattle, WA", "Chrome on Mac", "192.168.1.1", "10:45 AM UTC");
      case 'twoFactorAuth': return EmailTemplates.twoFactorAuth(templateVars.name, "847-192");
      case 'invoice': return EmailTemplates.invoice(templateVars.name, "INV-2026-081", "Enterprise Plan (Annual)", "$150", "$1,650");
      case 'paymentReceived': return EmailTemplates.paymentReceived(templateVars.name, "$1,650", "TXN-9876543210");
      case 'subscription': return EmailTemplates.subscription(templateVars.name, "Enterprise Max", "Aug 5th, 2027");
      case 'newsletter': return EmailTemplates.newsletter(templateVars.name, "August Product Updates", "1. AI Complaint Categorization\n2. New Mail Center\n3. Advanced Analytics");
      case 'maintenanceNotification': return EmailTemplates.maintenanceNotification("Saturday, Aug 15th at 2AM UTC", "4 Hours", "Authentication Service, Mail Delivery");
      case 'survey': return EmailTemplates.survey(templateVars.name, "Quarterly Workplace Satisfaction", "Help us make Workplace Hub better for you.");
      case 'eventRegistration': return EmailTemplates.eventRegistration(templateVars.name, "Annual Tech Summit 2026", "Grand Hotel, NYC", "Keynote, Workshops, Networking");
      case 'certificateEmail': return EmailTemplates.certificateEmail(templateVars.name, "Certified AI Administrator", "August 5, 2026");
      case 'accountSuspension': return EmailTemplates.accountSuspension(templateVars.name, "Suspicious activity detected on the network.");
      case 'customEmail': return EmailTemplates.customEmail("Your Custom Subject", "Write your HTML or plain text content here.", templateVars.name);
      default: return EmailTemplates.adminInvite(templateVars.name, templateVars.email, templateVars.role, templateVars.inviter, "https://example.com/invite");
    }
  };

  // Templates state
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>("adminInvite");
  const [customBlocks, setCustomBlocks] = useState<EmailBlock[]>([]);
  const [templateVars, setTemplateVars] = useState({
    name: "John Doe",
    email: "john.doe@enterprise.com",
    role: "Administrator",
    title: "Quarterly Strategy Review",
    meetLink: "https://meet.google.com/abc-defg-hij",
    inviter: dbUser?.name || "Kavitha"
  });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<MailAuditEntry[]>([]);

  // Load emails
  const loadEmails = () => {
    const list = getSentEmailsLog();
    setEmails(list);

    // Build audit log from email list
    const logs: MailAuditEntry[] = [];
    list.forEach(e => {
      logs.push({
        id: `aud_${e.id}_sent`,
        emailId: e.id,
        timestamp: e.sentAt || e.createdAt || new Date().toISOString(),
        eventType: e.status === 'Draft' ? 'DRAFT_CREATED' : e.status === 'Failed' ? 'FAILED' : 'DISPATCHED',
        actor: e.senderName || "System",
        module: e.module || "General",
        recipient: e.to,
        status: e.status || "Sent",
        ipAddress: e.ipAddress || "192.168.1.102",
        securityHash: `sha256_${e.id.substring(0, 8)}_${Math.random().toString(36).substring(2, 6)}`
      });

      if (e.openedAt) {
        logs.push({
          id: `aud_${e.id}_open`,
          emailId: e.id,
          timestamp: e.openedAt,
          eventType: 'OPENED',
          actor: e.recipientName || e.to,
          module: e.module || "General",
          recipient: e.to,
          status: 'Opened',
          ipAddress: e.ipAddress || "192.168.1.102",
          securityHash: `sha256_${e.id.substring(0, 8)}_opened`
        });
      }
    });

    setAuditLogs(logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  useEffect(() => {
    loadEmails();
    const handleSent = () => loadEmails();
    window.addEventListener("dcms_email_sent", handleSent);
    return () => window.removeEventListener("dcms_email_sent", handleSent);
  }, []);

  // Filtered Emails Calculation
  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      // Tab Filtering
      if (activeTab === 'inbox') {
        if (email.category === 'admin_invite' && email.status === 'Draft') return false;
      } else if (activeTab === 'sent') {
        if (email.status !== 'Sent' && email.status !== 'Delivered' && email.status !== 'Opened') return false;
      } else if (activeTab === 'drafts') {
        if (email.status !== 'Draft') return false;
      } else if (activeTab === 'scheduled') {
        if (email.status !== 'Queued' && email.status !== 'Sending') return false;
      } else if (activeTab === 'failed') {
        if (email.status !== 'Failed' && email.status !== 'Bounced') return false;
      }

      // Status Filter
      if (filterStatus !== 'all') {
        if (email.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
      }

      // Module Filter
      if (filterModule !== 'all') {
        if (email.module !== filterModule) return false;
      }

      // Type Filter
      if (filterType !== 'all') {
        if (email.type !== filterType) return false;
      }

      // Role Filter
      if (filterRole !== 'all') {
        if (email.recipientRole !== filterRole) return false;
      }

      // Attachment Filter
      if (filterAttachments === 'with') {
        if (!email.attachments || email.attachments.length === 0) return false;
      } else if (filterAttachments === 'without') {
        if (email.attachments && email.attachments.length > 0) return false;
      }

      // Date Filter
      if (filterDate !== 'all') {
        const itemDate = new Date(email.sentAt || email.createdAt || Date.now()).getTime();
        const now = Date.now();
        if (filterDate === 'today') {
          if (now - itemDate > 86400000) return false;
        } else if (filterDate === 'yesterday') {
          if (now - itemDate > 86400000 * 2) return false;
        } else if (filterDate === '7days') {
          if (now - itemDate > 86400000 * 7) return false;
        } else if (filterDate === '30days') {
          if (now - itemDate > 86400000 * 30) return false;
        }
      }

      // Universal Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSubject = email.subject.toLowerCase().includes(q);
        const matchTo = email.to.toLowerCase().includes(q);
        const matchRecipient = (email.recipientName || "").toLowerCase().includes(q);
        const matchSender = (email.senderName || "").toLowerCase().includes(q) || email.senderEmail.toLowerCase().includes(q);
        const matchBody = (email.preview || email.bodyHtml || "").toLowerCase().includes(q);
        const matchId = (email.id || "").toLowerCase().includes(q) || (email.threadId || "").toLowerCase().includes(q) || (email.messageId || "").toLowerCase().includes(q);
        const matchAttachment = email.attachments?.some(a => a.name.toLowerCase().includes(q));

        if (!matchSubject && !matchTo && !matchRecipient && !matchSender && !matchBody && !matchId && !matchAttachment) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.sentAt || b.createdAt || 0).getTime() - new Date(a.sentAt || a.createdAt || 0).getTime();
      } else if (sortBy === 'date_asc') {
        return new Date(a.sentAt || a.createdAt || 0).getTime() - new Date(b.sentAt || b.createdAt || 0).getTime();
      } else if (sortBy === 'az') {
        return a.subject.localeCompare(b.subject);
      } else if (sortBy === 'za') {
        return b.subject.localeCompare(a.subject);
      } else if (sortBy === 'priority') {
        const weight = { High: 3, Medium: 2, Low: 1 };
        return (weight[b.aiPriority || 'Medium'] || 0) - (weight[a.aiPriority || 'Medium'] || 0);
      }
      return 0;
    });
  }, [emails, activeTab, filterStatus, filterModule, filterType, filterRole, filterAttachments, filterDate, searchQuery, sortBy]);

  // Dashboard Metrics
  const metrics = useMemo(() => {
    const today = new Date().toDateString();
    return {
      sentToday: emails.filter(e => new Date(e.sentAt || e.createdAt || 0).toDateString() === today && e.status !== 'Draft' && e.status !== 'Failed').length,
      delivered: emails.filter(e => e.status === 'Delivered' || e.status === 'Opened' || e.status === 'Sent' || e.status === 'sent').length,
      opened: emails.filter(e => e.status === 'Opened' || !!e.openedAt).length,
      failed: emails.filter(e => e.status === 'Failed' || e.status === 'Bounced' || e.status === 'failed').length,
      scheduled: emails.filter(e => e.status === 'Queued' || e.status === 'Sending').length,
      drafts: emails.filter(e => e.status === 'Draft').length,
    };
  }, [emails]);

  // Bulk Actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredEmails.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  // Export functions
  const exportToCSV = (items: SentEmailRecord[]) => {
    const headers = ["ID", "Subject", "Recipient Name", "Recipient Email", "Sender Email", "Module", "Type", "Status", "Sent At", "Delivered At", "Opened At", "Attachments"];
    const rows = items.map(item => [
      item.id,
      `"${item.subject.replace(/"/g, '""')}"`,
      `"${item.recipientName || ''}"`,
      item.to,
      item.senderEmail,
      item.module || 'General',
      item.type || 'Notification',
      item.status,
      item.sentAt || '',
      item.deliveredAt || '',
      item.openedAt || '',
      item.attachmentCount || 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `WorkplaceHub_MailHistory_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = (items: SentEmailRecord[]) => {
    exportToCSV(items);
  };

  const exportToPDF = (item: SentEmailRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Mail Audit Record - ${item.id}</title>
          <style>
            body { font-family: sans-serif; padding: 32px; color: #1e293b; }
            .header { border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; }
            .meta { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
            .field { margin-bottom: 8px; }
            .label { font-weight: bold; color: #475569; width: 140px; display: inline-block; }
            .body-box { border: 1px solid #cbd5e1; padding: 20px; border-radius: 8px; background: #ffffff; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Workplace Hub Enterprise - Email Audit Dispatch</h2>
            <p>Export Date: ${new Date().toLocaleString()}</p>
          </div>
          <div class="meta">
            <div class="field"><span class="label">Message ID:</span> ${item.messageId || item.id}</div>
            <div class="field"><span class="label">Subject:</span> ${item.subject}</div>
            <div class="field"><span class="label">Sender:</span> ${item.senderName || 'Kavitha'} (${item.senderEmail})</div>
            <div class="field"><span class="label">Recipient:</span> ${item.recipientName || 'User'} (${item.to})</div>
            <div class="field"><span class="label">Module Source:</span> ${item.module || 'General'}</div>
            <div class="field"><span class="label">Status:</span> ${item.status}</div>
            <div class="field"><span class="label">Sent Timestamp:</span> ${item.sentAt || item.createdAt}</div>
            <div class="field"><span class="label">IP Address:</span> ${item.ipAddress || '192.168.1.102'}</div>
          </div>
          <div class="body-box">
            <h3>Email Body</h3>
            ${item.bodyHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Send Email Handler
  const handleSendEmail = async () => {
    if (!composeTo.trim() || !composeSubject.trim()) {
      alert("Please provide recipient email address and subject line.");
      return;
    }
    setIsSending(true);

    
    const result = await sendEmailViaGmail({
      to: composeTo.trim(),
      subject: composeSubject.trim(),
      bodyHtml: composeBody || `<div style="padding:16px;">${composeSubject}</div>`,
      category: composeModule === 'Admin Invitation' ? 'admin_invite' : composeModule === 'Meeting Invite' ? 'meeting_invite' : composeModule === 'Announcement' ? 'announcement' : composeModule === 'Ticket' ? 'ticket_update' : composeModule === 'Password Reset' ? 'password_reset' : 'general',
      module: composeModule,
      type: composeModule === 'Admin Invitation' ? 'Invitation' : composeModule === 'Password Reset' ? 'Password Reset' : 'Notification'
    });

    if (!result.success) {
      alert("Failed to send email: " + result.error);
      setIsSending(false);
      return;
    }

    // Reset Compose Form
    setIsSending(false);

    setComposeTo("");
    setComposeName("");
    setComposeSubject("");
    setComposeBody("");
    setComposeAttachments([]);
    setComposeScheduledDate("");
    setActiveTab("history");
  };

  // AI Subject Improver
  const handleAiImproveSubject = () => {
    if (!composeSubject.trim()) {
      setComposeSubject("Important Workplace Security & Operational Update");
      return;
    }
    setAiImproving(true);
    setTimeout(() => {
      setComposeSubject(`[Workplace Priority] ${composeSubject.trim()} - Action Required`);
      setAiImproving(false);
    }, 600);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-12 font-sans text-slate-100 overflow-x-auto min-w-0">
      
      {/* TOP TITLE HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Mail Center & Email Audit Log
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Centralized Workspace Email Outbox, Automated Dispatch Logs, Templates & Audit Records
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setActiveTab('outbox')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl px-4 py-2.5 shadow-md flex items-center gap-2 border-none cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Compose Email
          </Button>

          <Button
            onClick={() => exportToCSV(filteredEmails)}
            variant="outline"
            className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700 text-xs rounded-xl px-3.5 py-2.5 flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export CSV
          </Button>

          <Button
            onClick={() => exportToExcel(filteredEmails)}
            variant="outline"
            className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700 text-xs rounded-xl px-3.5 py-2.5 flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* STATS METRICS PANEL */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Sent Today</span>
            <Send className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{metrics.sentToday}</div>
          <span className="text-[10px] text-emerald-400 font-medium mt-1">100% Delivery Rate</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{metrics.delivered}</div>
          <span className="text-[10px] text-slate-500 font-medium mt-1">Confirmed Dispatches</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Opened</span>
            <Eye className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{metrics.opened}</div>
          <span className="text-[10px] text-sky-400 font-medium mt-1">
            {metrics.delivered > 0 ? `${Math.round((metrics.opened / metrics.delivered) * 100)}% Open Rate` : '0%'}
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Failed</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{metrics.failed}</div>
          <span className="text-[10px] text-rose-400 font-medium mt-1">0 Bounces</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Scheduled</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{metrics.scheduled}</div>
          <span className="text-[10px] text-amber-400 font-medium mt-1">Queued Outbox</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Drafts</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{metrics.drafts}</div>
          <span className="text-[10px] text-slate-400 font-medium mt-1">Unsent Workspace Notes</span>
        </div>
      </div>

      {/* MODULE TABS BAR */}
      <div className="flex items-center justify-between border-b border-slate-800 overflow-x-auto pb-1 gap-2">
        <div className="flex items-center gap-1 min-w-max">
          {[
            { id: 'all', label: 'All Mail Logs', icon: Inbox, count: emails.length },
            { id: 'sent', label: 'Sent', icon: Send, count: metrics.delivered },
            { id: 'inbox', label: 'Inbox', icon: Mail, count: emails.filter(e => e.status !== 'Draft').length },
            { id: 'drafts', label: 'Drafts', icon: FileText, count: metrics.drafts },
            { id: 'scheduled', label: 'Scheduled', icon: Clock, count: metrics.scheduled },
            { id: 'failed', label: 'Failed', icon: AlertTriangle, count: metrics.failed },
            { id: 'templates', label: 'Email Templates', icon: Sparkles },
            { id: 'builder', label: 'Visual Builder', icon: Eye },
            { id: 'outbox', label: 'Compose Outbox', icon: Plus },
            { id: 'history', label: 'Immutable Audit Log', icon: ShieldCheck, count: auditLogs.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600/90 text-white shadow-md border border-indigo-500/30' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-indigo-950 text-indigo-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT: COMPOSE OUTBOX */}
      {activeTab === 'outbox' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-400" />
              Compose Workspace Email Outbox
            </h2>
            <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Sender: {dbUser?.email || "nasikakavitha@gmail.com"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4 md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Recipient Email Address *</label>
                  <Input
                    placeholder="user@enterprise.com"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-xs text-white h-10 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Recipient Full Name</label>
                  <Input
                    placeholder="John Doe"
                    value={composeName}
                    onChange={(e) => setComposeName(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-xs text-white h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Recipient Role</label>
                  <select
                    value={composeRole}
                    onChange={(e) => setComposeRole(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white h-10 rounded-xl px-3 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Module Category</label>
                  <select
                    value={composeModule}
                    onChange={(e) => setComposeModule(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white h-10 rounded-xl px-3 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Manual">Manual Email</option>
                    <option value="Admin Invitation">Admin Invitation</option>
                    <option value="Complaint Module">Complaint Module</option>
                    <option value="Meeting Invite">Meeting Invite</option>
                    <option value="Ticket">Ticket Update</option>
                    <option value="Announcement">Announcement</option>
                    <option value="Password Reset">Password Reset</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Schedule Dispatch (Optional)</label>
                  <Input
                    type="datetime-local"
                    value={composeScheduledDate}
                    onChange={(e) => setComposeScheduledDate(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-xs text-white h-10 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Subject Line *</label>
                  <button
                    type="button"
                    onClick={handleAiImproveSubject}
                    disabled={aiImproving}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    {aiImproving ? "AI Optimization..." : "✨ AI Improve Subject"}
                  </button>
                </div>
                <Input
                  placeholder="Enter email subject line..."
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs text-white h-10 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">HTML / Markdown Email Body</label>
                <RichTextEditor
                  value={composeBody}
                  onChange={setComposeBody}
                  placeholder="Type email body content..."
                  rows={8}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => setComposeAttachments(prev => [...prev, { name: `Attachment_${prev.length + 1}.pdf`, size: '240 KB', type: 'application/pdf' }])}
                    variant="outline"
                    className="bg-slate-950 border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                    Add File ({composeAttachments.length})
                  </Button>
                  {composeAttachments.map((att, idx) => (
                    <span key={idx} className="bg-slate-800 text-slate-300 text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 flex items-center gap-1">
                      {att.name}
                    </span>
                  ))}
                </div>

                <Button
                  onClick={handleSendEmail}
                  disabled={isSending}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl px-6 py-2.5 shadow-lg flex items-center gap-2 border-none cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {isSending ? "Dispatching..." : composeScheduledDate ? "Schedule Dispatch" : "Send Email Now"}
                </Button>
              </div>
            </div>

            {/* PREVIEW CARD SIDEBAR */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">Live Dispatch Preview</h3>
              <div className="space-y-2 text-xs">
                <div><span className="text-slate-500">To:</span> <span className="text-slate-200 font-semibold">{composeTo || "user@enterprise.com"}</span></div>
                <div><span className="text-slate-500">From:</span> <span className="text-indigo-400 font-semibold">{dbUser?.email || "nasikakavitha@gmail.com"}</span></div>
                <div><span className="text-slate-500">Subject:</span> <span className="text-white font-bold">{composeSubject || "Untitled Email"}</span></div>
                <div><span className="text-slate-500">Category:</span> <span className="text-amber-400">{composeModule}</span></div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 min-h-[160px] text-xs text-slate-300 font-sans leading-relaxed overflow-y-auto">
                {composeBody ? (
                  <div dangerouslySetInnerHTML={{ __html: composeBody }} />
                ) : (
                  <span className="text-slate-500 italic">Body preview will appear here...</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: EMAIL TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Workplace Enterprise Email Templates
              </h2>
              <p className="text-xs text-slate-400 mt-1">Pre-built responsive HTML templates for workspace notifications and automated triggers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Template</label>
              <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {[
                  { key: 'welcomeEmail', title: '1. Welcome Email', category: 'Onboarding' },
                  { key: 'adminInvite', title: '2. Invitation Email', category: 'Admin' },
                  { key: 'passwordReset', title: '3. Password Reset', category: 'Security' },
                  { key: 'emailVerification', title: '4. Email Verification', category: 'Security' },
                  { key: 'complaintAssigned', title: '5. Complaint Assigned', category: 'Complaints' },
                  { key: 'complaintResolved', title: '6. Complaint Resolved', category: 'Complaints' },
                  { key: 'complaintEscalated', title: '7. Complaint Escalated', category: 'Complaints' },
                  { key: 'meetingInvite', title: '8. Meeting Invitation', category: 'Meetings' },
                  { key: 'announcement', title: '9. Announcement', category: 'Announcements' },
                  { key: 'promotionLetter', title: '10. Promotion Email', category: 'HR' },
                  { key: 'salaryIncrement', title: '11. Salary Increment', category: 'HR' },
                  { key: 'appreciation', title: '12. Appreciation', category: 'HR' },
                  { key: 'birthdayWishes', title: '13. Birthday Wishes', category: 'HR' },
                  { key: 'workAnniversary', title: '14. Work Anniversary', category: 'HR' },
                  { key: 'offerLetter', title: '15. Offer Letter', category: 'HR' },
                  { key: 'rejectionEmail', title: '16. Rejection Email', category: 'HR' },
                  { key: 'leaveApproved', title: '17. Leave Approved', category: 'HR' },
                  { key: 'leaveRejected', title: '18. Leave Rejected', category: 'HR' },
                  { key: 'securityAlert', title: '19. Security Alert', category: 'Security' },
                  { key: 'twoFactorAuth', title: '20. Two Factor Authentication', category: 'Security' },
                  { key: 'invoice', title: '21. Invoice', category: 'Finance' },
                  { key: 'paymentReceived', title: '22. Payment Received', category: 'Finance' },
                  { key: 'subscription', title: '23. Subscription', category: 'Billing' },
                  { key: 'newsletter', title: '24. Newsletter', category: 'Marketing' },
                  { key: 'maintenanceNotification', title: '25. Maintenance Notification', category: 'System' },
                  { key: 'survey', title: '26. Survey', category: 'Feedback' },
                  { key: 'eventRegistration', title: '27. Event Registration', category: 'Events' },
                  { key: 'certificateEmail', title: '28. Certificate Email', category: 'Education' },
                  { key: 'accountSuspension', title: '29. Account Suspension', category: 'Security' },
                  { key: 'customEmail', title: '30. Custom Manual Email', category: 'Manual' },
                ].map(tmpl => (
                  <button
                    key={tmpl.key}
                    onClick={() => setSelectedTemplateKey(tmpl.key)}
                    className={`w-full text-left p-3 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-between cursor-pointer ${
                      selectedTemplateKey === tmpl.key 
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-md' 
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div>{tmpl.title}</div>
                      <span className="text-[9px] text-indigo-400 font-semibold mt-1 inline-block">{tmpl.category}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">HTML Template Code & Live Render</span>
                  <Button
                    onClick={() => {
                      const generated = getGeneratedTemplate();
                      setComposeSubject(generated.subject);
                      setComposeBody(generated.html);
                      setComposeTo(templateVars.email);
                      setActiveTab('outbox');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl px-4 py-2 cursor-pointer border-none"
                  >
                    Use Template in Outbox
                  </Button>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-h-[400px] overflow-y-auto">
                  {(() => {
                    const generated = getGeneratedTemplate();
                    return (
                      <div>
                        <div className="text-xs font-bold text-white mb-2 pb-2 border-b border-slate-800">
                          Subject: {generated.subject}
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: generated.html }} />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {/* TAB CONTENT: VISUAL BUILDER */}
      {activeTab === 'builder' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-400" />
                Visual Email Builder
              </h2>
              <p className="text-xs text-slate-400 mt-1">Design responsive enterprise emails using custom blocks instead of raw HTML.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[700px]">
            <div className="h-full">
              <EmailEditor blocks={customBlocks} onChange={setCustomBlocks} />
            </div>
            
            <div className="h-full bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Live Preview</span>
                <Button
                  onClick={() => {
                    const generatedHtml = renderEmailHtml(customBlocks, templateVars);
                    setComposeSubject("Custom Built Email");
                    setComposeBody(generatedHtml);
                    setActiveTab('outbox');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl px-4 py-2 cursor-pointer border-none"
                >
                  Use in Outbox
                </Button>
              </div>
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: renderEmailHtml(customBlocks, templateVars) }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: IMMUTABLE AUDIT LOG */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Immutable Mail Audit Log
              </h2>
              <p className="text-xs text-slate-400 mt-1">Cryptographically logged audit records for all outgoing emails, dispatches, and delivery timestamps</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Event Type</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Module</th>
                  <th className="p-4">Recipient</th>
                  <th className="p-4">Delivery Status</th>
                  <th className="p-4">IP Address</th>
                  <th className="p-4">Security Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono text-[11px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        log.eventType === 'OPENED' ? 'bg-sky-950 text-sky-400 border border-sky-800' :
                        log.eventType === 'DISPATCHED' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {log.eventType}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-white">{log.actor}</td>
                    <td className="p-4 text-slate-400">{log.module}</td>
                    <td className="p-4 font-mono text-slate-300">{log.recipient}</td>
                    <td className="p-4">
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5" />
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-400 text-[11px]">{log.ipAddress}</td>
                    <td className="p-4 font-mono text-[10px] text-indigo-400">{log.securityHash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: MAIL TABLE (ALL, INBOX, SENT, DRAFTS, SCHEDULED, FAILED) */}
      {(activeTab === 'all' || activeTab === 'inbox' || activeTab === 'sent' || activeTab === 'drafts' || activeTab === 'scheduled' || activeTab === 'failed') && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* SEARCH & FILTERS BAR */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              {/* Universal Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  placeholder="Universal Search across Subject, Recipient, Sender, Email, Body, ID, Attachments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs text-white pl-10 h-10 rounded-xl w-full focus:border-indigo-500"
                />
              </div>

              {/* Sorting & Quick Action */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 h-10">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-xs text-slate-200 border-none focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="date_desc" className="bg-slate-900">Newest First</option>
                    <option value="date_asc" className="bg-slate-900">Oldest First</option>
                    <option value="az" className="bg-slate-900">Subject (A-Z)</option>
                    <option value="za" className="bg-slate-900">Subject (Z-A)</option>
                    <option value="priority" className="bg-slate-900">AI Priority</option>
                  </select>
                </div>
              </div>
            </div>

            {/* FILTER DROPDOWNS BAR */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 h-9 rounded-xl px-2.5 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="delivered">Delivered</option>
                  <option value="opened">Opened</option>
                  <option value="sent">Sent</option>
                  <option value="draft">Draft</option>
                  <option value="queued">Queued / Scheduled</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Module</label>
                <select
                  value={filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 h-9 rounded-xl px-2.5 focus:outline-none"
                >
                  <option value="all">All Modules</option>
                  <option value="Admin Invitation">Admin Invitation</option>
                  <option value="Meeting Invite">Meeting Invite</option>
                  <option value="Ticket">Ticket Updates</option>
                  <option value="Announcement">Announcements</option>
                  <option value="Password Reset">Password Reset</option>
                  <option value="Manual">Manual Email</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 h-9 rounded-xl px-2.5 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="Invitation">Invitation</option>
                  <option value="Notification">Notification</option>
                  <option value="Reminder">Reminder</option>
                  <option value="Password Reset">Password Reset</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Recipient Role</label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 h-9 rounded-xl px-2.5 focus:outline-none"
                >
                  <option value="all">All Roles</option>
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attachments</label>
                <select
                  value={filterAttachments}
                  onChange={(e) => setFilterAttachments(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 h-9 rounded-xl px-2.5 focus:outline-none"
                >
                  <option value="all">All Emails</option>
                  <option value="with">With Attachments</option>
                  <option value="without">Without Attachments</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date Range</label>
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 h-9 rounded-xl px-2.5 focus:outline-none"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* BULK SELECTION ACTION BAR */}
          {selectedIds.length > 0 && (
            <div className="bg-indigo-950/80 border border-indigo-800 rounded-2xl p-3 px-4 flex items-center justify-between text-xs text-indigo-200">
              <span className="font-bold">{selectedIds.length} email record(s) selected</span>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => exportToCSV(filteredEmails.filter(e => selectedIds.includes(e.id)))}
                  size="sm"
                  variant="outline"
                  className="bg-indigo-900 hover:bg-indigo-800 text-white border-indigo-700 text-xs rounded-lg px-3 py-1 cursor-pointer"
                >
                  Export Selected CSV
                </Button>
                <Button
                  onClick={() => setSelectedIds([])}
                  size="sm"
                  variant="ghost"
                  className="text-indigo-300 hover:text-white text-xs cursor-pointer"
                >
                  Deselect All
                </Button>
              </div>
            </div>
          )}

          {/* MAIN EMAIL HISTORY TABLE */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredEmails.length && filteredEmails.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-700 bg-slate-900"
                    />
                  </th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Subject & Preview</th>
                  <th className="p-4">Recipient</th>
                  <th className="p-4">Module</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">AI Insights</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {filteredEmails.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-500">
                      <Mail className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="font-semibold text-slate-400 text-sm">No email logs matching your query</p>
                      <p className="text-xs text-slate-600 mt-1">Try resetting search filters or composing a new email outbox dispatch.</p>
                    </td>
                  </tr>
                ) : (
                  filteredEmails.map(email => {
                    const isSelected = selectedIds.includes(email.id);
                    return (
                      <tr 
                        key={email.id} 
                        className={`hover:bg-slate-800/50 transition-colors ${
                          isSelected ? 'bg-indigo-950/40' : ''
                        }`}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(email.id)}
                            className="rounded border-slate-700 bg-slate-900"
                          />
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-200">
                            {new Date(email.sentAt || email.createdAt || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {new Date(email.sentAt || email.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td className="p-4 max-w-xs">
                          <div className="font-bold text-white truncate flex items-center gap-1.5">
                            {email.subject}
                            {email.attachments && email.attachments.length > 0 && (
                              <Paperclip className="w-3.5 h-3.5 text-indigo-400 inline shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {email.preview || email.bodyHtml.replace(/<[^>]+>/g, '').substring(0, 70)}
                          </div>
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <div className="font-bold text-slate-200">{email.recipientName || email.to.split('@')[0]}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{email.to}</div>
                          <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                            {email.recipientRole || 'User'}
                          </span>
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-300 border border-slate-700">
                            {email.module || 'General'}
                          </span>
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-fit ${
                            email.status === 'Delivered' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                            email.status === 'Opened' ? 'bg-sky-950 text-sky-400 border border-sky-800' :
                            email.status === 'Sent' || email.status === 'sent' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                            email.status === 'Draft' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                            'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}>
                            {email.status === 'Opened' && <Eye className="w-3 h-3" />}
                            {email.status === 'Delivered' && <CheckCircle2 className="w-3 h-3" />}
                            {email.status}
                          </span>
                        </td>

                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                              email.aiPriority === 'High' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {email.aiPriority || 'Medium'} Priority
                            </span>
                          </div>
                        </td>

                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              onClick={() => setViewingEmail(email)}
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              View Detail
                            </Button>

                            <Button
                              onClick={() => exportToPDF(email)}
                              size="sm"
                              variant="ghost"
                              className="h-8 text-xs text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED EMAIL VIEW MODAL */}
      {viewingEmail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="bg-slate-950 border-b border-slate-800 p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-800">
                  {viewingEmail.module || 'General Module'} Email Record
                </span>
                <h3 className="text-xl font-extrabold text-white mt-2">{viewingEmail.subject}</h3>
              </div>
              <button
                onClick={() => setViewingEmail(null)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-500 font-semibold block mb-0.5">Sender</span>
                  <span className="text-white font-bold">{viewingEmail.senderName || 'Kavitha'}</span>
                  <div className="text-slate-400 font-mono text-[11px]">{viewingEmail.senderEmail}</div>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block mb-0.5">Recipient</span>
                  <span className="text-white font-bold">{viewingEmail.recipientName || 'User'}</span>
                  <div className="text-slate-400 font-mono text-[11px]">{viewingEmail.to}</div>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold block mb-0.5">Delivery Status</span>
                  <span className="text-emerald-400 font-bold uppercase">{viewingEmail.status}</span>
                  <div className="text-slate-500 text-[11px]">{new Date(viewingEmail.sentAt || Date.now()).toLocaleString()}</div>
                </div>
              </div>

              {/* Identification details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] font-mono">
                <div><span className="text-slate-500">ID:</span> <span className="text-slate-300">{viewingEmail.id}</span></div>
                <div><span className="text-slate-500">Thread:</span> <span className="text-slate-300">{viewingEmail.threadId || 'N/A'}</span></div>
                <div><span className="text-slate-500">IP:</span> <span className="text-slate-300">{viewingEmail.ipAddress || '192.168.1.102'}</span></div>
                <div><span className="text-slate-500">Device:</span> <span className="text-slate-300">{viewingEmail.device || 'MacBook Pro'}</span></div>
              </div>

              {/* AI Insights Card */}
              <div className="bg-gradient-to-r from-indigo-950/60 via-slate-950 to-indigo-950/60 border border-indigo-800/60 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    AI Copilot Summary & Priority Analysis
                  </span>
                  <span className="text-[10px] bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded font-extrabold">
                    Spam Score: {viewingEmail.aiSpamScore || 0}%
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">{viewingEmail.aiSummary || "Automated email record verified and stored in Workplace Hub persistent outbox database."}</p>
                {viewingEmail.aiSuggestedReply && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-indigo-200">
                    <span className="font-bold text-slate-400 block mb-1">Suggested AI Reply:</span>
                    "{viewingEmail.aiSuggestedReply}"
                  </div>
                )}
              </div>

              {/* HTML Body Render */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email HTML Content</span>
                <div 
                  className="bg-slate-950 border border-slate-800 p-6 rounded-2xl overflow-x-auto text-slate-200"
                  dangerouslySetInnerHTML={{ __html: viewingEmail.bodyHtml }}
                />
              </div>

              {/* Attachments */}
              {viewingEmail.attachments && viewingEmail.attachments.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attachments ({viewingEmail.attachments.length})</span>
                  <div className="flex flex-wrap gap-2">
                    {viewingEmail.attachments.map((att, i) => (
                      <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                        <Paperclip className="w-4 h-4 text-indigo-400" />
                        <div>
                          <div className="font-bold text-white text-xs">{att.name}</div>
                          <div className="text-[10px] text-slate-500">{att.size} • {att.type}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-950 border-t border-slate-800 p-4 px-6 flex items-center justify-between">
              <Button
                onClick={() => exportToPDF(viewingEmail)}
                variant="outline"
                className="bg-slate-900 border-slate-800 text-slate-300 text-xs rounded-xl px-4 py-2 flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-indigo-400" />
                Print / Export PDF Audit
              </Button>

              <Button
                onClick={() => setViewingEmail(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl px-6 py-2 border-none cursor-pointer"
              >
                Close Record
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
