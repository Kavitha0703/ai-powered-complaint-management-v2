const fs = require('fs');
let content = fs.readFileSync('src/lib/EmailTemplates.ts', 'utf8');

// I will just rewrite the entire prefix of the file safely:
const newPrefix = `export const APP_URL = "https://ai-powered-complaint-management-v2.vercel.app/";
export const APP_NAME = "Workplace Hub";
export const BRAND_COLOR = "#5B5CEB"; 

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
  return \`
    <div style="font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #111827; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
      
      <div style="display: none; max-height: 0px; overflow: hidden;">
        \${preheader}
      </div>

      <div style="padding: 32px 32px 24px 32px; border-bottom: 1px solid #E5E7EB; display: flex; align-items: center; gap: 12px;">
        <img src="\${APP_URL}favicon.ico" alt="Logo" style="width: 24px; height: 24px; display: block;" />
        <div>
          <div style="font-size: 16px; font-weight: 600; color: #111827; line-height: 1;">\${APP_NAME}</div>
          <div style="font-size: 12px; color: #6B7280; font-weight: 400; margin-top: 4px; line-height: 1;">Enterprise Workplace Platform</div>
        </div>
      </div>

      <div style="padding: 32px;">
        <p style="font-size: 15px; color: #111827; margin-top: 0; margin-bottom: 24px; line-height: 1.6; font-weight: 400;">
          \${greeting}
        </p>
        
        \${contentHtml}

        \${ctaText && ctaUrl ? \\\`
        <div style="margin-top: 32px; text-align: left;">
          <a href="\${ctaUrl}" style="display: inline-block; background-color: \${BRAND_COLOR}; color: #ffffff; text-decoration: none; font-weight: 500; padding: 12px 24px; border-radius: 6px; font-size: 14px; text-align: center;">
            \${ctaText}
          </a>
        </div>
        <div style="margin-top: 32px; font-size: 13px; color: #6B7280; line-height: 1.5;">
          Can't click the button? Copy this link:<br>
          <a href="\${ctaUrl}" style="color: \${BRAND_COLOR}; text-decoration: none; word-break: break-all;">\${ctaUrl}</a>
        </div>
        \\\` : ''}

        <div style="margin-top: 24px; font-size: 13px; color: #6B7280; line-height: 1.5;">
          If you weren't expecting this email, please ignore it.<br>
          No account changes will be made.
        </div>
      </div>

      <div style="padding: 24px 32px; text-align: left; border-top: 1px solid #E5E7EB; background-color: #ffffff;">
        <div style="font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 4px;">\${APP_NAME}</div>
        <div style="font-size: 12px; color: #6B7280; margin-bottom: 16px;">Enterprise Workplace Platform</div>
        
        <div style="margin-bottom: 16px;">
          <a href="\${APP_URL}docs" style="color: #6B7280; text-decoration: underline; font-size: 12px; margin-right: 12px;">Documentation</a>
          <a href="\${APP_URL}help" style="color: #6B7280; text-decoration: underline; font-size: 12px; margin-right: 12px;">Help Center</a>
          <a href="\${APP_URL}privacy" style="color: #6B7280; text-decoration: underline; font-size: 12px; margin-right: 12px;">Privacy</a>
          <a href="\${APP_URL}terms" style="color: #6B7280; text-decoration: underline; font-size: 12px;">Terms</a>
        </div>
        
        <div style="font-size: 12px; color: #6B7280;">
          <a href="mailto:support@workplacehub.is-a.dev" style="color: #6B7280; text-decoration: none;">support@workplacehub.is-a.dev</a><br>
          <span style="margin-top: 8px; display: inline-block;">© 2026 \${APP_NAME}</span>
        </div>
      </div>

    </div>
  \`;
}

function cardBlock(title: string, content: string, theme: ThemeColor = 'info') {
  return \`
    <div style="border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; padding: 16px 0; margin: 24px 0;">
      \${title ? \\\`<div style="font-size: 13px; color: #6B7280; text-transform: uppercase; font-weight: 600; margin-bottom: 12px; letter-spacing: 0.5px;">\${title}</div>\\\` : ''}
      <div style="font-size: 14px; color: #111827; line-height: 1.6;">
        \${content}
      </div>
    </div>
  \`;
}

function keyValueItem(key: string, value: string) {
  return \`<div style="margin-bottom: 12px; display: flex; flex-direction: column; gap: 2px;">
    <span style="color: #6B7280; font-size: 13px;">\${key}</span>
    <strong style="color: #111827; font-size: 15px; font-weight: 500;">\${value}</strong>
  </div>\`;
}
`;

const cleanNewPrefix = newPrefix.replace(/\\\\\\\`/g, '\`');

const idx = content.indexOf("export const EmailTemplates = {");
fs.writeFileSync('src/lib/EmailTemplates.ts', cleanNewPrefix + "\\n" + content.substring(idx));
