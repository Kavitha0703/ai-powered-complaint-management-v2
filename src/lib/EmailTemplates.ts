export const APP_URL = "https://ai-powered-complaint-management-v2.vercel.app/";
export const APP_NAME = "Workplace Hub";
export const BRAND_COLOR = "#6366f1"; // Purple/Indigo

type ThemeColor = 'primary' | 'success' | 'warning' | 'critical' | 'info';

function wrapTemplate(
  preheader: string,
  bannerIcon: string,
  bannerTitle: string,
  bannerColor: ThemeColor,
  greeting: string,
  contentHtml: string,
  ctaText?: string,
  ctaUrl?: string,
) {
  const colors = {
    primary: { bg: '#4f46e5', light: '#e0e7ff', border: '#c7d2fe' },
    success: { bg: '#16a34a', light: '#dcfce7', border: '#bbf7d0' },
    warning: { bg: '#d97706', light: '#fef3c7', border: '#fde68a' },
    critical: { bg: '#dc2626', light: '#fee2e2', border: '#fecaca' },
    info: { bg: '#2563eb', light: '#dbeafe', border: '#bfdbfe' }
  };
  const theme = colors[bannerColor] || colors.primary;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      
      <!-- Preheader (Hidden) -->
      <div style="display: none; max-height: 0px; overflow: hidden;">
        ${preheader}
      </div>

      <!-- Header -->
      <div style="background-color: #f8fafc; padding: 24px; border-bottom: 1px solid #e2e8f0; text-align: center;">
        <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
          <span style="color: ${BRAND_COLOR};">⚡</span> ${APP_NAME}
        </div>
        <div style="font-size: 13px; color: #64748b; font-weight: 500;">
          AI-Powered Digital Workplace Platform
        </div>
      </div>

      <!-- Banner -->
      <div style="background-color: ${theme.bg}; color: #ffffff; padding: 16px 24px; text-align: center;">
        <span style="font-size: 20px; vertical-align: middle; margin-right: 8px;">${bannerIcon}</span>
        <span style="font-size: 18px; font-weight: 600; vertical-align: middle;">${bannerTitle}</span>
      </div>

      <!-- Body -->
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #334155; margin-top: 0; margin-bottom: 24px; line-height: 1.6;">
          ${greeting}
        </p>
        
        ${contentHtml}

        ${ctaText && ctaUrl ? `
        <!-- CTA -->
        <div style="margin-top: 32px; text-align: center;">
          <a href="${ctaUrl}" style="display: inline-block; background-color: ${theme.bg}; color: #ffffff; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 8px; font-size: 15px;">
            ${ctaText}
          </a>
        </div>
        ` : ''}

        <!-- Signature -->
        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.5;">Regards,</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 600; color: #0f172a;">${APP_NAME} Team</p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">AI Powered Complaint Management</p>
          <p style="margin: 6px 0 0 0; font-size: 13px;"><a href="mailto:nasikakavitha@gmail.com" style="color: ${BRAND_COLOR}; text-decoration: none;">nasikakavitha@gmail.com</a></p>
          <p style="margin: 4px 0 0 0; font-size: 13px;"><a href="${APP_URL}" style="color: ${BRAND_COLOR}; text-decoration: none;">${APP_URL}</a></p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
        <div style="font-size: 12px; color: #64748b; margin-bottom: 12px;">
          <strong>Need Help?</strong> Contact our support team.
        </div>
        <div style="margin-bottom: 16px;">
          <a href="${APP_URL}" style="color: ${BRAND_COLOR}; text-decoration: none; font-size: 12px; margin: 0 6px;">Privacy Policy</a> | 
          <a href="${APP_URL}" style="color: ${BRAND_COLOR}; text-decoration: none; font-size: 12px; margin: 0 6px;">Terms of Service</a> | 
          <a href="${APP_URL}" style="color: ${BRAND_COLOR}; text-decoration: none; font-size: 12px; margin: 0 6px;">Contact Us</a> | 
          <a href="${APP_URL}" style="color: ${BRAND_COLOR}; text-decoration: none; font-size: 12px; margin: 0 6px;">Help Center</a>
        </div>
        <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
          Powered by ${APP_NAME}<br>
          AI Powered Workplace Management Platform
        </div>
      </div>
    </div>
  `;
}

function cardBlock(title: string, content: string, theme: ThemeColor = 'info') {
  const colors = {
    primary: { bg: '#f5f3ff', border: '#8b5cf6', text: '#6d28d9' },
    success: { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' },
    warning: { bg: '#fffbeb', border: '#f59e0b', text: '#b45309' },
    critical: { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c' },
    info: { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8' }
  };
  const c = colors[theme];
  return `
    <div style="background-color: ${c.bg}; border-left: 4px solid ${c.border}; border-radius: 8px; padding: 16px; margin: 20px 0;">
      ${title ? `<div style="font-size: 12px; color: ${c.text}; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; letter-spacing: 0.5px;">${title}</div>` : ''}
      <div style="font-size: 14px; color: #334155; line-height: 1.5;">
        ${content}
      </div>
    </div>
  `;
}

function keyValueItem(key: string, value: string) {
  return `<div style="margin-bottom: 8px;"><strong style="color: #475569; display: inline-block; width: 140px;">${key}:</strong> <span style="color: #0f172a; font-weight: 500;">${value}</span></div>`;
}

export const EmailTemplates = {
  // 1. Welcome Email
  welcomeEmail: (name: string) => ({
    subject: `Welcome to ${APP_NAME}! 🎉`,
    html: wrapTemplate(
      `Welcome to ${APP_NAME}, ${name}! We're excited to have you on board.`,
      `👋`, `Welcome Aboard!`, `primary`,
      `Hello ${name},<br><br>Hope you're having a wonderful day.`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">We are thrilled to welcome you to <strong>${APP_NAME}</strong>. Our AI-powered platform is designed to streamline your digital workplace experience and make collaboration effortless.</p>` + 
      cardBlock('Getting Started', 'Login to your dashboard to explore your personalized workspace, manage tasks, and connect with your team.', 'info'),
      `Go to Dashboard`, `${APP_URL}dashboard`
    )
  }),

  // 2. Admin Invitation
  adminInvite: (inviteeName: string, inviteeEmail: string, role: string, inviterName: string, inviteUrl?: string) => ({
    subject: `Action Required: Invitation to join ${APP_NAME} as ${role}`,
    html: wrapTemplate(
      `You've been invited by ${inviterName} to join ${APP_NAME} as an Administrator.`,
      `🛡️`, `Administrator Invitation`, `primary`,
      `Hello ${inviteeName},`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;"><strong>${inviterName}</strong> has invited you to join the <strong>${APP_NAME}</strong> platform as an administrator.</p>` +
      cardBlock('Role Details', 
        keyValueItem('Email', inviteeEmail) + 
        keyValueItem('Assigned Role', role) + 
        keyValueItem('Access Level', 'Administrative'), 
        'primary'
      ),
      `Accept Invitation`, inviteUrl || APP_URL
    )
  }),

  // 3. Password Reset
  passwordReset: (name: string, resetLink: string) => ({
    subject: `Password Reset Request - ${APP_NAME}`,
    html: wrapTemplate(
      `Secure link to reset your password for ${APP_NAME}.`,
      `🔐`, `Password Reset`, `warning`,
      `Hello ${name || 'User'},`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">We received a request to reset your password for your <strong>${APP_NAME}</strong> account. If you didn't make this request, you can safely ignore this email.</p>` +
      cardBlock('Security Notice', 'This link will expire in 15 minutes for your protection. Never share this link with anyone.', 'warning'),
      `Reset My Password`, resetLink
    )
  }),

  // 4. Complaint Registered
  complaintRegistered: (name: string, complaintId: string, title: string, category: string) => ({
    subject: `Complaint Received: #${complaintId} - ${APP_NAME}`,
    html: wrapTemplate(
      `We have successfully received your complaint #${complaintId}.`,
      `📝`, `Complaint Registered`, `info`,
      `Hello ${name},`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Your complaint has been successfully registered in our system. Our support team has been notified and will review it shortly.</p>` +
      cardBlock('Complaint Details', 
        keyValueItem('Ticket ID', `#${complaintId}`) + 
        keyValueItem('Subject', title) + 
        keyValueItem('Category', category) + 
        keyValueItem('Status', 'Pending Review'), 
        'info'
      ),
      `View Complaint Status`, `${APP_URL}dashboard/complaints`
    )
  }),

  // 5. Complaint Assigned
  complaintAssigned: (name: string, complaintId: string, assigneeName: string) => ({
    subject: `Update: Complaint #${complaintId} has been assigned`,
    html: wrapTemplate(
      `Your complaint #${complaintId} has been assigned to ${assigneeName}.`,
      `👤`, `Agent Assigned`, `info`,
      `Hello ${name},`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Your complaint <strong>#${complaintId}</strong> is now being handled by one of our specialists. They will reach out to you if any further information is required.</p>` +
      cardBlock('Assignment Details', 
        keyValueItem('Ticket ID', `#${complaintId}`) + 
        keyValueItem('Assigned Officer', assigneeName) + 
        keyValueItem('Status', 'In Progress'), 
        'info'
      ),
      `View Updates`, `${APP_URL}dashboard/complaints`
    )
  }),

  // 6. Complaint Updated
  complaintUpdated: (name: string, complaintId: string, updatedBy: string) => ({
    subject: `Activity on Complaint #${complaintId}`,
    html: wrapTemplate(
      `New activity has been recorded on your complaint #${complaintId}.`,
      `🔔`, `Complaint Updated`, `primary`,
      `Hello ${name},`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">There is a new update regarding your complaint <strong>#${complaintId}</strong> added by <strong>${updatedBy}</strong>.</p>` +
      cardBlock('Action Required', 'Please log in to your dashboard to review the latest notes or messages from the assigned officer.', 'primary'),
      `Read Update`, `${APP_URL}dashboard/complaints`
    )
  }),

  // 7. Complaint Resolved
  complaintResolved: (name: string, complaintId: string, resolutionSummary: string) => ({
    subject: `Resolved: Complaint #${complaintId}`,
    html: wrapTemplate(
      `Your complaint #${complaintId} has been marked as resolved.`,
      `✅`, `Complaint Resolved`, `success`,
      `Hello ${name},`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">We are pleased to inform you that your complaint <strong>#${complaintId}</strong> has been successfully resolved.</p>` +
      cardBlock('Resolution Summary', resolutionSummary, 'success'),
      `View Final Report`, `${APP_URL}dashboard/complaints`
    )
  }),

  // 8. Admin Announcement
  announcement: (subject: string, body: string, adminName: string) => ({
    subject: `Admin Announcement: ${subject}`,
    html: wrapTemplate(
      `Important announcement from ${adminName}: ${subject}`,
      `📢`, `System Announcement`, `primary`,
      `Hello Team,`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Please review the following important announcement published by <strong>${adminName}</strong>:</p>` +
      cardBlock(subject, body, 'primary'),
      `Open Workspace`, APP_URL
    )
  }),

  // 9. Company Notice
  companyNotice: (title: string, content: string) => ({
    subject: `Notice: ${title}`,
    html: wrapTemplate(
      `Company Notice: ${title}`,
      `🏢`, `Company Notice`, `info`,
      `Dear Employee,`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">This is an official notice from the organization regarding workplace policies or operations.</p>` +
      cardBlock(title, content, 'info'),
      `View in Portal`, APP_URL
    )
  }),

  // 10. Promotion Letter
  promotionLetter: (name: string, prevRole: string, newRole: string, date: string) => ({
    subject: `Congratulations on your Promotion! 🎉`,
    html: wrapTemplate(
      `Congratulations ${name}! You have been promoted to ${newRole}.`,
      `🚀`, `Promotion Announcement`, `success`,
      `Dear ${name},`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">We are absolutely delighted to inform you that you have been promoted! Your hard work and dedication have been recognized.</p>` +
      cardBlock('Promotion Details', 
        keyValueItem('Previous Position', prevRole) + 
        keyValueItem('New Position', newRole) + 
        keyValueItem('Effective Date', date), 
        'success'
      ) + 
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin-top: 16px;">Congratulations and best wishes on this new chapter of your career!</p>`,
      `Open Workspace`, APP_URL
    )
  }),

  // 11. Salary Revision
  salaryRevision: (name: string, date: string) => ({
    subject: `Update: Compensation Revision`,
    html: wrapTemplate(
      `Your compensation has been reviewed and revised.`,
      `💰`, `Salary Revision`, `success`,
      `Dear ${name},`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Your annual compensation has been reviewed and successfully revised. The updated payroll structure will be effective starting <strong>${date}</strong>.</p>` +
      cardBlock('Action Required', 'Please log into the HR portal to download and review your official compensation revision letter.', 'info'),
      `View HR Portal`, APP_URL
    )
  }),

  // 12. Performance Appreciation
  performanceAppreciation: (name: string, message: string, sender: string) => ({
    subject: `🌟 Outstanding Performance Recognition`,
    html: wrapTemplate(
      `${sender} has recognized your outstanding performance!`,
      `⭐`, `Performance Appreciation`, `success`,
      `Hello ${name},`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Great job! You have received a note of appreciation for your exceptional work and dedication.</p>` +
      cardBlock(`Message from ${sender}`, message, 'success'),
      `Open Workspace`, APP_URL
    )
  }),

  // 13. Birthday Wishes
  birthdayWishes: (name: string) => ({
    subject: `Happy Birthday ${name}! 🎂`,
    html: wrapTemplate(
      `Wishing you a very Happy Birthday from everyone at ${APP_NAME}!`,
      `🎈`, `Happy Birthday!`, `primary`,
      `Dear ${name},`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0; text-align: center;">Wishing you a fantastic birthday filled with joy, laughter, and success! We hope you have a wonderful day celebrating with friends and family.</p>` +
      `<p style="font-size: 16px; font-weight: bold; color: #4f46e5; text-align: center; margin-top: 24px;">Enjoy your special day!</p>`,
      `Open Workspace`, APP_URL
    )
  }),

  // 14. Work Anniversary
  workAnniversary: (name: string, years: number) => ({
    subject: `Happy ${years} Year Work Anniversary! 🎊`,
    html: wrapTemplate(
      `Congratulations on ${years} years with us!`,
      `🏆`, `Work Anniversary`, `primary`,
      `Dear ${name},`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0; text-align: center;">Happy Work Anniversary! Thank you for <strong>${years} years</strong> of dedication, hard work, and continuous contributions to our organization's success.</p>`,
      `Open Workspace`, APP_URL
    )
  }),

  // 15. Meeting Invitation
  meetingInvite: (title: string, link: string, hostName: string, hostEmail: string, time: string) => ({
    subject: `Invitation: ${title}`,
    html: wrapTemplate(
      `You are invited to a meeting: ${title} scheduled for ${time}.`,
      `📅`, `Meeting Invitation`, `info`,
      `Hello,`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">You have been invited to a meeting scheduled by <strong>${hostName}</strong>.</p>` +
      cardBlock('Meeting Details', 
        keyValueItem('Agenda', title) + 
        keyValueItem('Organizer', `${hostName} (${hostEmail})`) + 
        keyValueItem('Time', time), 
        'info'
      ),
      `Join Meeting`, link
    )
  }),

  // 16. Leave Approved
  leaveApproved: (name: string, dates: string, type: string) => ({
    subject: `Approved: Your Leave Request`,
    html: wrapTemplate(
      `Your ${type} request for ${dates} has been approved.`,
      `🌴`, `Leave Approved`, `success`,
      `Hello ${name},`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Good news! Your recent leave request has been reviewed and <strong>approved</strong>.</p>` +
      cardBlock('Leave Summary', 
        keyValueItem('Leave Type', type) + 
        keyValueItem('Dates', dates) + 
        keyValueItem('Status', 'Approved'), 
        'success'
      ),
      `View Leave Balance`, APP_URL
    )
  }),

  // 17. Leave Rejected
  leaveRejected: (name: string, dates: string, reason: string) => ({
    subject: `Update: Your Leave Request`,
    html: wrapTemplate(
      `Your leave request for ${dates} could not be approved at this time.`,
      `⚠️`, `Leave Request Update`, `critical`,
      `Hello ${name},`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">We regret to inform you that your recent leave request could not be approved at this time.</p>` +
      cardBlock('Leave Summary', 
        keyValueItem('Dates Requested', dates) + 
        keyValueItem('Status', 'Declined') + 
        keyValueItem('Reason', reason), 
        'critical'
      ),
      `Contact HR`, APP_URL
    )
  }),

  // 18. New Policy
  newPolicy: (title: string, summary: string) => ({
    subject: `New HR Policy Update: ${title}`,
    html: wrapTemplate(
      `A new company policy "${title}" has been published.`,
      `📋`, `Policy Update`, `primary`,
      `Dear Team,`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Please be advised that a new organizational policy has been implemented effective immediately.</p>` +
      cardBlock(title, summary, 'primary'),
      `Read Full Policy`, APP_URL
    )
  }),

  // 19. Security Alert
  securityAlert: (name: string, location: string, device: string, time: string) => ({
    subject: `Security Alert: New Sign-In to your account`,
    html: wrapTemplate(
      `We noticed a new sign-in to your ${APP_NAME} account from ${location}.`,
      `🛡️`, `Security Alert`, `warning`,
      `Hello ${name || 'User'},`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">We noticed a new login to your <strong>${APP_NAME}</strong> account from an unrecognized device or location. If this was you, no further action is needed.</p>` +
      cardBlock('Login Details', 
        keyValueItem('Device', device) + 
        keyValueItem('Location', location) + 
        keyValueItem('Time', time), 
        'warning'
      ) +
      `<p style="font-size: 14px; color: #dc2626; margin-top: 16px; font-weight: 500;">If you don't recognize this activity, please secure your account immediately.</p>`,
      `Secure My Account`, APP_URL
    )
  }),

  // 20. Account Locked
  accountLocked: (name: string, reason: string) => ({
    subject: `Action Required: Account Temporarily Locked`,
    html: wrapTemplate(
      `Your ${APP_NAME} account has been temporarily locked for security reasons.`,
      `🔒`, `Account Locked`, `critical`,
      `Hello ${name || 'User'},`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Your <strong>${APP_NAME}</strong> account has been temporarily locked to protect your data.</p>` +
      cardBlock('Reason for Lock', reason, 'critical') +
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin-top: 16px;">Please contact the IT Helpdesk or use the account recovery tool to regain access.</p>`,
      `Recover Account`, APP_URL
    )
  }),

  // 21. Invoice / Payroll Slip
  invoice: (name: string, month: string, amount: string) => ({
    subject: `Your Payroll Slip for ${month} is available`,
    html: wrapTemplate(
      `Your payroll slip for ${month} is now ready for viewing.`,
      `📄`, `Payroll Document`, `info`,
      `Hello ${name},`,
      `<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Your payroll document for <strong>${month}</strong> has been generated and securely deposited into your digital vault.</p>` +
      cardBlock('Summary', 
        keyValueItem('Document', 'Monthly Salary Slip') + 
        keyValueItem('Period', month) + 
        keyValueItem('Net Amount', amount), 
        'info'
      ),
      `View Secure Document`, APP_URL
    )
  }),

  // 22. General Custom Email
  generalEmail: (subject: string, body: string, recipientName: string = 'User') => ({
    subject: subject,
    html: wrapTemplate(
      subject,
      `✉️`, subject, `primary`,
      `Hello ${recipientName},`,
      `<div style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">${body}</div>`,
      `Open Workspace`, APP_URL
    )
  })
};
