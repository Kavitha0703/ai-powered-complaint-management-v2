import { Router } from "express";
import { sendGmailMessage } from "../google/gmail.js";

const router = Router();

// POST /api/send-email
router.post("/send-email", async (req, res) => {
  const { to, subject, bodyHtml, fromName } = req.body;
  if (!to || !subject || !bodyHtml) {
    return res.status(400).json({
      success: false,
      delivered: false,
      error: "Missing required fields: to, subject, bodyHtml",
    });
  }

  const result = await sendGmailMessage({ to, subject, bodyHtml, fromName });
  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(400).json(result);
  }
});

// POST /api/send-invite
router.post("/send-invite", async (req, res) => {
  const { toEmail, inviteUrl, roleLabel, senderName } = req.body;
  if (!toEmail || !inviteUrl) {
    return res.status(400).json({ success: false, error: "Missing toEmail or inviteUrl" });
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff;">
      <h2 style="color: #0f172a;">🛡️ Workplace Hub Admin Invitation</h2>
      <p style="color: #475569;">You have been invited by <strong>${senderName || "Super Admin"}</strong> to join as a <strong>${roleLabel || "Administrator"}</strong>.</p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${inviteUrl}" style="background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Accept Invitation</a>
      </div>
      <p style="color: #94a3b8; font-size: 12px;">Link: ${inviteUrl}</p>
    </div>
  `;

  const result = await sendGmailMessage({
    to: toEmail,
    subject: `[INVITATION] Access granted to Workplace Hub (${roleLabel || "Admin"})`,
    bodyHtml: html,
    fromName: senderName || "Workplace Hub Admin",
  });

  return res.status(result.success ? 200 : 400).json(result);
});

// POST /api/send-notice
router.post("/send-notice", async (req, res) => {
  const { recipients, title, body } = req.body;
  if (!recipients || !title || !body) {
    return res.status(400).json({ success: false, error: "Missing required notice parameters" });
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0;">
      <h2 style="color: #0f172a;">📢 System Notice: ${title}</h2>
      <div style="background: #f8fafc; padding: 16px; border-left: 4px solid #2563eb;">
        <p style="color: #334155;">${body}</p>
      </div>
    </div>
  `;

  const result = await sendGmailMessage({
    to: recipients,
    subject: `📢 [NOTICE] ${title}`,
    bodyHtml: html,
  });

  return res.status(result.success ? 200 : 400).json(result);
});

export default router;
