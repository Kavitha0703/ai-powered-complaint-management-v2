// Gmail Integration Service for Workplace Hub
// Supports sending HTML emails via Gmail REST API and local email log backup

export type EmailStatus = 'Draft' | 'Queued' | 'Sending' | 'Sent' | 'Delivered' | 'Opened' | 'Failed' | 'Bounced' | 'Cancelled';
export type EmailModule = 'Admin Invitation' | 'Complaint Module' | 'Meeting Invite' | 'Password Reset' | 'Notification' | 'Announcement' | 'Ticket' | 'Manual';
export type EmailType = 'Invitation' | 'Notification' | 'Password Reset' | 'Reminder' | 'Manual Email';
export type RecipientRole = 'User' | 'Admin' | 'Super Admin';

export interface EmailAttachment {
  name: string;
  size: string;
  type: string;
}

export interface SentEmailRecord {
  id: string;
  threadId?: string;
  messageId?: string;
  conversationId?: string;
  to: string;
  recipientName?: string;
  recipientRole?: RecipientRole;
  senderEmail: string;
  senderName?: string;
  senderRole?: string;
  subject: string;
  bodyHtml: string;
  preview?: string;
  category: 'admin_invite' | 'meeting_invite' | 'announcement' | 'ticket_update' | 'password_reset' | 'general';
  module?: EmailModule;
  type?: EmailType;
  status: EmailStatus;
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  clicks?: number;
  attachments?: EmailAttachment[];
  bounceReason?: string;
  errorLog?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  referenceTicketId?: string;
  createdAt?: string;
  ipAddress?: string;
  attachmentCount?: number;
  aiGenerated?: boolean;
  aiSummary?: string;
  [key: string]: any;
}

const LOCAL_EMAIL_CACHE_KEY = "google_gmail_cache_v1";
const GMAIL_AUTH_KEY = "google_gmail_auth";
const GMAIL_PROJECT_KEY = "google_gmail_project";
const GMAIL_TOKEN_KEY = "google_workspace_access_token";

export function isGmailAuthenticated(): boolean {
  return localStorage.getItem(GMAIL_AUTH_KEY) === "true";
}

export function getGmailUserEmail(): string {
  return localStorage.getItem("google_user_email") || "admin@workplacehub.io";
}

export async function gmailSignIn(email?: string): Promise<boolean> {
  try {
    localStorage.setItem(GMAIL_AUTH_KEY, "true");
    localStorage.setItem(GMAIL_PROJECT_KEY, "quiet-alchemy-0lkqp");
    if (email) localStorage.setItem("google_user_email", email);
    return true;
  } catch (error) {
    console.error("Gmail Sign-In error:", error);
    return false;
  }
}

export function gmailSignOut(): void {
  localStorage.removeItem(GMAIL_AUTH_KEY);
  localStorage.removeItem(GMAIL_PROJECT_KEY);
  localStorage.removeItem(GMAIL_TOKEN_KEY);
  localStorage.removeItem("google_user_email");
}

export function getSentEmailsLog(): SentEmailRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_EMAIL_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveEmailToLog(record: SentEmailRecord) {
  const current = getSentEmailsLog();
  const updated = [record, ...current];
  localStorage.setItem(LOCAL_EMAIL_CACHE_KEY, JSON.stringify(updated));
}

function encodeBase64Url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export interface SendEmailParams {
  to: string;
  subject: string;
  bodyHtml: string;
  category?: 'admin_invite' | 'meeting_invite' | 'announcement' | 'ticket_update' | 'password_reset' | 'general';
  module?: EmailModule;
  type?: EmailType;
}

export async function sendEmailViaGmail(params: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, subject, bodyHtml, category = 'general' } = params;
  const accessToken = localStorage.getItem(GMAIL_TOKEN_KEY);
  const senderEmail = getGmailUserEmail();
  const recordId = "msg_srv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
  const sentAt = new Date().toISOString();

  // If OAuth accessToken is provided, attempt direct REST call to Gmail API
  if (accessToken) {
    const rfc2822Message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/html; charset="UTF-8"`,
      `MIME-Version: 1.0`,
      ``,
      bodyHtml
    ].join('\r\n');

    try {
      const rawEncoded = encodeBase64Url(rfc2822Message);
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: rawEncoded })
      });

      if (res.ok) {
        const json = await res.json();
        const record: SentEmailRecord = {
          id: json.id || recordId,
          to,
          subject,
          bodyHtml,
          category,
          sentAt,
          senderEmail,
          status: 'Sent'
        };
        saveEmailToLog(record);
        return { success: true, messageId: json.id };
      } else {
        const errorText = await res.text();
        console.error("Gmail API Error:", res.status, errorText);
        return { success: false, error: `Gmail API Error ${res.status}: ${errorText}` };
      }
    } catch (err: any) {
      console.error("Gmail direct REST API call error:", err);
      return { success: false, error: err.message };
    }
  }

  // Simulated email dispatch fallback disabled for debugging
  console.error("No access token provided. Gmail simulated fallback is disabled.");
  return { success: false, error: "No access token provided. Not falling back to simulation." };
}

// Templates builder for Workplace Hub Enterprise Email Notifications
