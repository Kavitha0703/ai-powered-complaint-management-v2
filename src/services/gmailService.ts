// Gmail & Outbound Email Service

export interface EmailPayload {
  to: string | string[];
  subject: string;
  bodyHtml: string;
  fromName?: string;
  category?: "admin_invite" | "notice" | "ticket_update" | "meeting_invite" | "general";
}

export interface EmailResponse {
  success: boolean;
  delivered: boolean;
  id?: string;
  error?: string;
  provider?: string;
  message?: string;
}

export const GmailService = {
  // Send Email via Backend Proxy (/api/send-email)
  async sendEmail(payload: EmailPayload): Promise<EmailResponse> {
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: payload.to,
          subject: payload.subject,
          bodyHtml: payload.bodyHtml,
          fromName: payload.fromName || "Workplace Hub Systems",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          delivered: true,
          id: data.id,
          provider: data.provider || "Resend",
          message: data.message || "Email successfully dispatched.",
        };
      } else {
        return {
          success: false,
          delivered: false,
          error: data.error || data.message || `Server returned HTTP ${response.status}`,
        };
      }
    } catch (err: any) {
      console.error("GmailService sendEmail exception:", err);
      return {
        success: false,
        delivered: false,
        error: err.message || "Failed to communicate with email server.",
      };
    }
  },

  // Send Admin Invitation Email
  async sendInviteEmail(toEmail: string, inviteUrl: string, roleLabel: string, senderName: string): Promise<EmailResponse> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 16px; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">🛡️ Workplace Hub Admin Invitation</h2>
        <p style="color: #475569; font-size: 14px;">You have been invited by <strong>${senderName}</strong> to join the Workplace Hub platform as a <strong>${roleLabel}</strong>.</p>
        <div style="margin: 32px 0; text-align: center;">
          <a href="${inviteUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Accept Invitation & Register</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; word-break: break-all;">Or copy and paste this security link into your browser:<br/><a href="${inviteUrl}" style="color: #2563eb;">${inviteUrl}</a></p>
      </div>
    `;

    return this.sendEmail({
      to: toEmail,
      subject: `[INVITATION] Access granted to Workplace Hub (${roleLabel})`,
      bodyHtml: html,
      category: "admin_invite",
    });
  },

  // Send Notice Email
  async sendNoticeEmail(recipients: string[], noticeTitle: string, noticeBody: string): Promise<EmailResponse> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">📢 Platform System Notice: ${noticeTitle}</h2>
        <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid #2563eb; margin: 16px 0;">
          <p style="color: #334155; font-size: 14px; white-space: pre-wrap; margin: 0;">${noticeBody}</p>
        </div>
        <p style="color: #94a3b8; font-size: 11px; margin-top: 24px;">Sent automatically via Workplace Hub Notification Center.</p>
      </div>
    `;

    return this.sendEmail({
      to: recipients,
      subject: `📢 [NOTICE] ${noticeTitle}`,
      bodyHtml: html,
      category: "notice",
    });
  },

  // Send Meeting Report / Invitation Email
  async sendMeetingEmail(toEmail: string, title: string, meetLink: string, startTime: string): Promise<EmailResponse> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; background-color: #ffffff;">
        <h2 style="color: #0f172a; margin-top: 0;">📅 Google Meet Conference Invitation</h2>
        <p style="color: #475569; font-size: 14px;">You are invited to attend the upcoming meeting: <strong>${title}</strong></p>
        <p style="color: #475569; font-size: 13px;"><strong>Scheduled Time:</strong> ${new Date(startTime).toLocaleString()}</p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${meetLink}" style="background-color: #10b981; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Join Google Meet Room</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; word-break: break-all;">Direct Link: <a href="${meetLink}">${meetLink}</a></p>
      </div>
    `;

    return this.sendEmail({
      to: toEmail,
      subject: `📅 [MEETING] ${title}`,
      bodyHtml: html,
      category: "meeting_invite",
    });
  }
};
