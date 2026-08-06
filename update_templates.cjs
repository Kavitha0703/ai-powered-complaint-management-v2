const fs = require('fs');

const code = `
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

  return \`
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      
      <!-- Preheader (Hidden) -->
      <div style="display: none; max-height: 0px; overflow: hidden;">
        \${preheader}
      </div>

      <!-- Header -->
      <div style="background-color: #f8fafc; padding: 24px; border-bottom: 1px solid #e2e8f0; text-align: center;">
        <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
          <span style="color: \${BRAND_COLOR};">⚡</span> \${APP_NAME}
        </div>
        <div style="font-size: 13px; color: #64748b; font-weight: 500;">
          AI-Powered Digital Workplace Platform
        </div>
      </div>

      <!-- Banner -->
      <div style="background-color: \${theme.bg}; color: #ffffff; padding: 16px 24px; text-align: center;">
        <span style="font-size: 20px; vertical-align: middle; margin-right: 8px;">\${bannerIcon}</span>
        <span style="font-size: 18px; font-weight: 600; vertical-align: middle;">\${bannerTitle}</span>
      </div>

      <!-- Body -->
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #334155; margin-top: 0; margin-bottom: 24px; line-height: 1.6;">
          \${greeting}
        </p>
        
        \${contentHtml}

        \${ctaText && ctaUrl ? \`
        <!-- CTA -->
        <div style="margin-top: 32px; text-align: center;">
          <a href="\${ctaUrl}" style="display: inline-block; background-color: \${theme.bg}; color: #ffffff; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 8px; font-size: 15px;">
            \${ctaText}
          </a>
        </div>
        \` : ''}

        <!-- Signature -->
        <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.5;">Regards,</p>
          <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 600; color: #0f172a;">\${APP_NAME} Team</p>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748b;">AI Powered Complaint Management</p>
          <p style="margin: 6px 0 0 0; font-size: 13px;"><a href="mailto:nasikakavitha@gmail.com" style="color: \${BRAND_COLOR}; text-decoration: none;">nasikakavitha@gmail.com</a></p>
          <p style="margin: 4px 0 0 0; font-size: 13px;"><a href="\${APP_URL}" style="color: \${BRAND_COLOR}; text-decoration: none;">\${APP_URL}</a></p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f1f5f9; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
        <div style="font-size: 12px; color: #64748b; margin-bottom: 12px;">
          <strong>Need Help?</strong> Contact our support team.
        </div>
        <div style="margin-bottom: 16px;">
          <a href="\${APP_URL}" style="color: \${BRAND_COLOR}; text-decoration: none; font-size: 12px; margin: 0 6px;">Privacy Policy</a> | 
          <a href="\${APP_URL}" style="color: \${BRAND_COLOR}; text-decoration: none; font-size: 12px; margin: 0 6px;">Terms of Service</a> | 
          <a href="\${APP_URL}" style="color: \${BRAND_COLOR}; text-decoration: none; font-size: 12px; margin: 0 6px;">Contact Us</a> | 
          <a href="\${APP_URL}" style="color: \${BRAND_COLOR}; text-decoration: none; font-size: 12px; margin: 0 6px;">Help Center</a>
        </div>
        <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
          Powered by \${APP_NAME}<br>
          AI Powered Workplace Management Platform
        </div>
      </div>
    </div>
  \`;
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
  return \`
    <div style="background-color: \${c.bg}; border-left: 4px solid \${c.border}; border-radius: 8px; padding: 16px; margin: 20px 0;">
      \${title ? \`<div style="font-size: 12px; color: \${c.text}; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; letter-spacing: 0.5px;">\${title}</div>\` : ''}
      <div style="font-size: 14px; color: #334155; line-height: 1.5;">
        \${content}
      </div>
    </div>
  \`;
}

function keyValueItem(key: string, value: string) {
  return \`<div style="margin-bottom: 8px;"><strong style="color: #475569; display: inline-block; width: 140px;">\${key}:</strong> <span style="color: #0f172a; font-weight: 500;">\${value}</span></div>\`;
}

export const EmailTemplates = {
  // 1. Welcome Email
  welcomeEmail: (name: string) => ({
    subject: \`Welcome to \${APP_NAME}! 🎉\`,
    html: wrapTemplate(
      \`Welcome to \${APP_NAME}, \${name}! We're excited to have you on board.\`,
      \`👋\`, \`Welcome Aboard!\`, \`primary\`,
      \`Hello \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">We are thrilled to welcome you to <strong>\${APP_NAME}</strong>. Our AI-powered platform is designed to streamline your digital workplace experience and make collaboration effortless.</p>\` + 
      cardBlock('Getting Started', 'Login to your dashboard to explore your personalized workspace, manage tasks, and connect with your team.', 'info'),
      \`Get Started\`, \`\${APP_URL}dashboard\`
    )
  }),

  // 2. Invitation Email (adminInvite)
  adminInvite: (inviteeName: string, inviteeEmail: string, role: string, inviterName: string, inviteUrl?: string) => ({
    subject: \`You've been invited to \${APP_NAME}\`,
    html: wrapTemplate(
      \`You've been invited by \${inviterName} to join \${APP_NAME} as \${role}.\`,
      \`🛡️\`, \`You've been invited\`, \`primary\`,
      \`Hello \${inviteeName},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;"><strong>\${inviterName}</strong> has invited you to join the <strong>\${APP_NAME}</strong> platform.</p>\` +
      cardBlock('Invitation Details', 
        keyValueItem('Workspace', APP_NAME) + 
        keyValueItem('Role', role) + 
        keyValueItem('Invited By', inviterName) +
        keyValueItem('Email', inviteeEmail),
        'primary'
      ),
      \`Accept Invitation\`, inviteUrl || APP_URL
    )
  }),

  // 3. Password Reset
  passwordReset: (name: string, resetLink: string) => ({
    subject: \`Reset your password - \${APP_NAME}\`,
    html: wrapTemplate(
      \`Secure link to reset your password for \${APP_NAME}.\`,
      \`🔐\`, \`Reset your password\`, \`warning\`,
      \`Hello \${name || 'User'},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">We received a request to reset your password for your <strong>\${APP_NAME}</strong> account. If you didn't make this request, you can safely ignore this email.</p>\` +
      cardBlock('Security Notice', 'This link will expire in 15 minutes for your protection. Never share this link with anyone.', 'warning'),
      \`Reset Password\`, resetLink
    )
  }),

  // 4. Email Verification
  emailVerification: (name: string, verifyLink: string) => ({
    subject: \`Verify your email address - \${APP_NAME}\`,
    html: wrapTemplate(
      \`Please verify your email address to complete registration.\`,
      \`✅\`, \`Verify your email\`, \`primary\`,
      \`Hello \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Thank you for registering with <strong>\${APP_NAME}</strong>. Please click the button below to verify your email address.</p>\` +
      cardBlock('Information', 'This link expires in 30 minutes.', 'info'),
      \`Verify Email\`, verifyLink
    )
  }),

  // 5. Complaint Assigned
  complaintAssigned: (name: string, complaintId: string, assigneeName: string, priority: string = 'Normal', department: string = 'Support') => ({
    subject: \`Update: Complaint #\${complaintId} has been assigned\`,
    html: wrapTemplate(
      \`Your complaint #\${complaintId} has been assigned to \${assigneeName}.\`,
      \`👤\`, \`Agent Assigned\`, \`info\`,
      \`Hello \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Your complaint <strong>#\${complaintId}</strong> is now being handled by one of our specialists.</p>\` +
      cardBlock('Assignment Details', 
        keyValueItem('Complaint ID', \`#\${complaintId}\`) + 
        keyValueItem('Assigned To', assigneeName) + 
        keyValueItem('Priority', priority) +
        keyValueItem('Department', department), 
        'info'
      ),
      \`Open Complaint\`, \`\${APP_URL}dashboard/complaints\`
    )
  }),

  // 6. Complaint Resolved
  complaintResolved: (name: string, complaintId: string, resolutionSummary: string) => ({
    subject: \`Resolved: Complaint #\${complaintId}\`,
    html: wrapTemplate(
      \`Your complaint #\${complaintId} has been marked as resolved.\`,
      \`✅\`, \`Complaint Resolved\`, \`success\`,
      \`Hello \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">We are pleased to inform you that your complaint <strong>#\${complaintId}</strong> has been successfully resolved.</p>\` +
      cardBlock('Resolution Summary', resolutionSummary, 'success'),
      \`Provide Feedback\`, \`\${APP_URL}dashboard/complaints\`
    )
  }),

  // 7. Complaint Escalated
  complaintEscalated: (name: string, complaintId: string, assignedTeam: string, timeline: string) => ({
    subject: \`Escalated: Complaint #\${complaintId}\`,
    html: wrapTemplate(
      \`Your complaint #\${complaintId} has been escalated for further review.\`,
      \`🔥\`, \`Complaint Escalated\`, \`warning\`,
      \`Hello \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Your complaint <strong>#\${complaintId}</strong> has been escalated to a higher priority team for faster resolution.</p>\` +
      cardBlock('Priority Escalation Details', 
        keyValueItem('Complaint ID', \`#\${complaintId}\`) + 
        keyValueItem('Assigned Team', assignedTeam) + 
        keyValueItem('Expected Timeline', timeline), 
        'warning'
      ),
      \`View Complaint Status\`, \`\${APP_URL}dashboard/complaints\`
    )
  }),

  // 8. Meeting Invitation
  meetingInvite: (title: string, link: string, hostName: string, hostEmail: string, time: string, duration: string = "1 hour", participants: string = "Team Members") => ({
    subject: \`Invitation: \${title}\`,
    html: wrapTemplate(
      \`You are invited to a Google Meet: \${title} scheduled for \${time}.\`,
      \`📅\`, \`Meeting Invitation\`, \`info\`,
      \`Hello,\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">You have been invited to a meeting scheduled by <strong>\${hostName}</strong>.</p>\` +
      cardBlock('Meeting Details', 
        keyValueItem('Agenda', title) + 
        keyValueItem('Organizer', \`\${hostName} (\${hostEmail})\`) + 
        keyValueItem('Date/Time', time) +
        keyValueItem('Duration', duration) +
        keyValueItem('Participants', participants),
        'info'
      ),
      \`Join Meeting\`, link
    )
  }),

  // 9. Announcement
  announcement: (subject: string, body: string, adminName: string) => ({
    subject: \`Announcement: \${subject}\`,
    html: wrapTemplate(
      \`Important announcement from \${adminName}: \${subject}\`,
      \`📢\`, \`System Announcement\`, \`primary\`,
      \`Hello Team,\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Please review the following important announcement published by <strong>\${adminName}</strong>:</p>\` +
      cardBlock(subject, body, 'primary'),
      \`Read More\`, APP_URL
    )
  }),

  // 10. Promotion Email
  promotionLetter: (name: string, prevRole: string, newRole: string, date: string, hrMessage: string = "We are thrilled to support your continued growth.") => ({
    subject: \`Congratulations on your Promotion! 🎉\`,
    html: wrapTemplate(
      \`Congratulations \${name}! You have been promoted to \${newRole}.\`,
      \`🚀\`, \`Promotion Announcement\`, \`success\`,
      \`Dear \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">🎉 Congratulations! Your hard work and dedication have been recognized.</p>\` +
      cardBlock('Promotion Details', 
        keyValueItem('Previous Role', prevRole) + 
        keyValueItem('New Role', newRole) + 
        keyValueItem('Effective Date', date), 
        'success'
      ) + 
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin-top: 16px;">\${hrMessage}</p>
       <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-top: 16px; font-weight: bold;">- HR & CEO</p>
      \`,
      \`Open Workspace\`, APP_URL
    )
  }),

  // 11. Salary Increment
  salaryIncrement: (name: string, oldSalary: string, newSalary: string, effectiveDate: string) => ({
    subject: \`Salary Revision Notice\`,
    html: wrapTemplate(
      \`Your compensation has been reviewed and revised.\`,
      \`💰\`, \`Salary Revision Notice\`, \`info\`,
      \`Dear \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Your annual compensation has been reviewed and successfully revised.</p>\` +
      cardBlock('Compensation Details', 
        keyValueItem('Previous Salary', oldSalary) + 
        keyValueItem('Revised Salary', newSalary) + 
        keyValueItem('Effective Date', effectiveDate), 
        'info'
      ),
      \`Download Letter\`, APP_URL
    )
  }),

  // 12. Appreciation
  appreciation: (name: string, badge: string = "Employee of the Month", message: string = "Thank you for your outstanding contribution.") => ({
    subject: \`🌟 \${badge} Recognition\`,
    html: wrapTemplate(
      \`Congratulations! You have been recognized for \${badge}.\`,
      \`⭐\`, \`\${badge}\`, \`success\`,
      \`Hello \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Great job! You have received a note of appreciation for your exceptional work and dedication.</p>\` +
      cardBlock(\`Recognition Details\`, message, 'success'),
      \`View Certificate\`, APP_URL
    )
  }),

  // 13. Birthday Wishes
  birthdayWishes: (name: string, message: string = "Wishing you a fantastic birthday filled with joy and success!") => ({
    subject: \`Happy Birthday \${name}! 🎂\`,
    html: wrapTemplate(
      \`Wishing you a very Happy Birthday from everyone at \${APP_NAME}!\`,
      \`🎈\`, \`Happy Birthday!\`, \`primary\`,
      \`Dear \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0; text-align: center;">\${message}</p>\` +
      \`<p style="font-size: 16px; font-weight: bold; color: #4f46e5; text-align: center; margin-top: 24px;">Enjoy your special day! - Team \${APP_NAME}</p>\`,
      \`Open Workspace\`, APP_URL
    )
  }),

  // 14. Work Anniversary
  workAnniversary: (name: string, years: number, achievements: string = "Continuous dedication and hard work.") => ({
    subject: \`Happy \${years} Year Work Anniversary! 🎊\`,
    html: wrapTemplate(
      \`Congratulations on \${years} years with us!\`,
      \`🏆\`, \`Work Anniversary\`, \`primary\`,
      \`Dear \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0; text-align: center;">Happy Work Anniversary! Thank you for <strong>\${years} years</strong> of dedication to our organization's success.</p>\` +
      cardBlock('Key Contributions', achievements, 'primary'),
      \`View Certificate\`, APP_URL
    )
  }),

  // 15. Offer Letter
  offerLetter: (candidateName: string, position: string, salary: string, joiningDate: string) => ({
    subject: \`Offer Letter - \${APP_NAME}\`,
    html: wrapTemplate(
      \`We are pleased to offer you the position of \${position}.\`,
      \`🤝\`, \`Offer Letter\`, \`primary\`,
      \`Dear \${candidateName},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">We are delighted to offer you a position at <strong>\${APP_NAME}</strong>. We believe your skills and experience will be a valuable asset to our team.</p>\` +
      cardBlock('Offer Details', 
        keyValueItem('Position', position) + 
        keyValueItem('Compensation', salary) + 
        keyValueItem('Joining Date', joiningDate), 
        'primary'
      ),
      \`Review & Accept Offer\`, APP_URL
    )
  }),

  // 16. Rejection Email
  rejectionEmail: (candidateName: string, position: string) => ({
    subject: \`Update on your application for \${position}\`,
    html: wrapTemplate(
      \`Thank you for applying to \${APP_NAME}.\`,
      \`✉️\`, \`Application Update\`, \`info\`,
      \`Dear \${candidateName},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Thank you for your interest in the <strong>\${position}</strong> role at \${APP_NAME}. While your background is impressive, we have decided to move forward with other candidates who more closely match our current needs.</p>
       <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-top: 16px;">We wish you the best in your job search and future career endeavors.</p>\`,
      \`Careers Page\`, APP_URL
    )
  }),

  // 17. Leave Approved
  leaveApproved: (name: string, dates: string, approver: string) => ({
    subject: \`Approved: Your Leave Request\`,
    html: wrapTemplate(
      \`Your leave request for \${dates} has been approved.\`,
      \`🌴\`, \`Leave Approved\`, \`success\`,
      \`Hello \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Good news! Your recent leave request has been reviewed and <strong>approved</strong>.</p>\` +
      cardBlock('Leave Summary', 
        keyValueItem('Dates', dates) + 
        keyValueItem('Approved By', approver) + 
        keyValueItem('Status', 'Approved'), 
        'success'
      ),
      \`View Leave Balance\`, APP_URL
    )
  }),

  // 18. Leave Rejected
  leaveRejected: (name: string, dates: string, reason: string, managerNotes: string) => ({
    subject: \`Update: Your Leave Request\`,
    html: wrapTemplate(
      \`Your leave request for \${dates} could not be approved at this time.\`,
      \`⚠️\`, \`Leave Request Update\`, \`critical\`,
      \`Hello \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">We regret to inform you that your recent leave request could not be approved at this time.</p>\` +
      cardBlock('Leave Summary', 
        keyValueItem('Dates Requested', dates) + 
        keyValueItem('Reason', reason) + 
        keyValueItem('Manager Notes', managerNotes), 
        'critical'
      ),
      \`Appeal Request\`, APP_URL
    )
  }),

  // 19. Security Alert
  securityAlert: (name: string, location: string, device: string, ip: string, time: string) => ({
    subject: \`Security Alert: New Sign-In to your account\`,
    html: wrapTemplate(
      \`We noticed a new sign-in to your \${APP_NAME} account from \${location}.\`,
      \`🛡️\`, \`Security Alert\`, \`critical\`,
      \`Hello \${name || 'User'},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">We noticed a new login to your <strong>\${APP_NAME}</strong> account from an unrecognized device or location. If this was you, no further action is needed.</p>\` +
      cardBlock('Login Details', 
        keyValueItem('Browser/Device', device) + 
        keyValueItem('IP Address', ip) + 
        keyValueItem('Location', location) + 
        keyValueItem('Time', time), 
        'critical'
      ) +
      \`<p style="font-size: 14px; color: #dc2626; margin-top: 16px; font-weight: 500;">If you don't recognize this activity, please secure your account immediately.</p>\`,
      \`Review Activity\`, APP_URL
    )
  }),

  // 20. Two Factor Authentication
  twoFactorAuth: (name: string, otp: string) => ({
    subject: \`Your Authentication Code: \${otp}\`,
    html: wrapTemplate(
      \`Here is your two-factor authentication code.\`,
      \`🔑\`, \`Authentication Code\`, \`primary\`,
      \`Hello \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Use the following security code to complete your login. This code expires in 5 minutes.</p>\` +
      \`<div style="background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a; margin: 24px 0; border-radius: 8px; border: 1px dashed #cbd5e1;">\${otp}</div>\` +
      cardBlock('Security Notice', 'Never share this code with anyone, including support staff.', 'warning'),
      undefined, undefined
    )
  }),

  // 21. Invoice
  invoice: (name: string, invoiceNumber: string, items: string, tax: string, total: string) => ({
    subject: \`Invoice #\${invoiceNumber} - \${APP_NAME}\`,
    html: wrapTemplate(
      \`Your invoice #\${invoiceNumber} is now available.\`,
      \`📄\`, \`Invoice Generated\`, \`info\`,
      \`Hello \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Your invoice <strong>#\${invoiceNumber}</strong> has been generated successfully.</p>\` +
      cardBlock('Invoice Summary', 
        keyValueItem('Items', items) + 
        keyValueItem('Tax', tax) + 
        keyValueItem('Total Amount', \`<strong>\${total}</strong>\`), 
        'info'
      ),
      \`Download PDF\`, APP_URL
    )
  }),

  // 22. Payment Received
  paymentReceived: (name: string, amount: string, transactionId: string) => ({
    subject: \`Payment Receipt - \${amount}\`,
    html: wrapTemplate(
      \`We have successfully received your payment of \${amount}.\`,
      \`💳\`, \`Payment Received\`, \`success\`,
      \`Hello \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Thank you! We have successfully processed your payment.</p>\` +
      cardBlock('Transaction Details', 
        keyValueItem('Amount Paid', \`<strong>\${amount}</strong>\`) + 
        keyValueItem('Transaction ID', transactionId) + 
        keyValueItem('Status', 'Successful'), 
        'success'
      ),
      \`View Receipt\`, APP_URL
    )
  }),

  // 23. Subscription
  subscription: (name: string, plan: string, renewalDate: string) => ({
    subject: \`Subscription Update: \${plan}\`,
    html: wrapTemplate(
      \`Your \${plan} subscription is active.\`,
      \`🔄\`, \`Subscription Active\`, \`primary\`,
      \`Hello \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Your subscription to the <strong>\${plan}</strong> plan is confirmed and active.</p>\` +
      cardBlock('Subscription Details', 
        keyValueItem('Current Plan', plan) + 
        keyValueItem('Next Renewal Date', renewalDate) + 
        keyValueItem('Status', 'Active'), 
        'primary'
      ),
      \`Manage Subscription\`, APP_URL
    )
  }),

  // 24. Newsletter
  newsletter: (name: string, title: string, articles: string) => ({
    subject: \`\${title} - \${APP_NAME} Newsletter\`,
    html: wrapTemplate(
      \`The latest updates and news from \${APP_NAME}.\`,
      \`📰\`, title, \`primary\`,
      \`Hello \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Here is the latest news and updates from our community.</p>\` +
      cardBlock('In this edition', articles, 'info'),
      \`Read Full Newsletter\`, APP_URL
    )
  }),

  // 25. Maintenance Notification
  maintenanceNotification: (downtime: string, duration: string, affectedServices: string) => ({
    subject: \`Scheduled Maintenance Notification\`,
    html: wrapTemplate(
      \`We have a scheduled maintenance on \${downtime}.\`,
      \`🛠️\`, \`Scheduled Maintenance\`, \`warning\`,
      \`Dear Users,\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">We will be performing scheduled infrastructure maintenance to improve platform reliability.</p>\` +
      cardBlock('Maintenance Schedule', 
        keyValueItem('Scheduled Time', downtime) + 
        keyValueItem('Expected Duration', duration) + 
        keyValueItem('Affected Services', affectedServices), 
        'warning'
      ),
      \`Check Status Page\`, APP_URL
    )
  }),

  // 26. Survey
  survey: (name: string, title: string, description: string) => ({
    subject: \`We value your feedback: \${title}\`,
    html: wrapTemplate(
      \`Please take a moment to complete our latest survey.\`,
      \`📊\`, title, \`info\`,
      \`Hello \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">\${description}</p>\` +
      cardBlock('Feedback requested', 'Your opinion matters to us. It will only take 2 minutes.', 'info'),
      \`Submit Feedback\`, APP_URL
    )
  }),

  // 27. Event Registration
  eventRegistration: (name: string, eventName: string, venue: string, agenda: string) => ({
    subject: \`Registration Confirmed: \${eventName}\`,
    html: wrapTemplate(
      \`You are successfully registered for \${eventName}.\`,
      \`🎟️\`, \`Event Registration Confirmed\`, \`success\`,
      \`Hello \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Your registration for <strong>\${eventName}</strong> has been confirmed. We look forward to seeing you!</p>\` +
      cardBlock('Event Details', 
        keyValueItem('Venue', venue) + 
        keyValueItem('Agenda', agenda), 
        'success'
      ),
      \`Join / View Details\`, APP_URL
    )
  }),

  // 28. Certificate Email
  certificateEmail: (name: string, certificateName: string, issueDate: string) => ({
    subject: \`Your Certificate is Ready: \${certificateName}\`,
    html: wrapTemplate(
      \`Congratulations on completing \${certificateName}.\`,
      \`🎓\`, \`Certificate Issued\`, \`success\`,
      \`Hello \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">Congratulations on successfully earning your certificate for <strong>\${certificateName}</strong>!</p>\` +
      cardBlock('Certificate Details', 
        keyValueItem('Certificate Name', certificateName) + 
        keyValueItem('Issue Date', issueDate), 
        'success'
      ),
      \`Download Certificate\`, APP_URL
    )
  }),

  // 29. Account Suspension
  accountSuspension: (name: string, reason: string) => ({
    subject: \`Account Notice: Temporary Suspension\`,
    html: wrapTemplate(
      \`Your account has been suspended. Action required.\`,
      \`⛔\`, \`Account Suspended\`, \`critical\`,
      \`Hello \${name},\`,
      \`<p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">We regret to inform you that your account has been temporarily suspended due to a violation of our terms of service.</p>\` +
      cardBlock('Suspension Details', 
        keyValueItem('Reason', reason) + 
        keyValueItem('Status', 'Suspended'), 
        'critical'
      ) +
      \`<p style="font-size: 14px; color: #475569; margin-top: 16px;">If you believe this is an error, please file an appeal.</p>\`,
      \`File Appeal\`, APP_URL
    )
  }),

  // 30. Custom Manual Email
  customEmail: (subject: string, bodyHtml: string, recipientName: string = 'User') => ({
    subject: subject,
    html: wrapTemplate(
      subject,
      \`✉️\`, subject, \`primary\`,
      \`Hello \${recipientName},\`,
      \`<div style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0;">\${bodyHtml}</div>\`,
      \`Open Workspace\`, APP_URL
    )
  })
};
`;

fs.writeFileSync('src/lib/EmailTemplates.ts', code);
