import { EmailBlock } from "../components/mail/EmailEditor";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  blocks: EmailBlock[];
  updatedAt: string;
}

// In a real app, this would be stored in the database.
// For now, we mock it.
let templates: EmailTemplate[] = [
  {
    id: "default-welcome",
    name: "Welcome Email",
    subject: "Welcome to Workplace Hub!",
    updatedAt: new Date().toISOString(),
    blocks: [
      { id: "b1", type: "heading", content: "Welcome aboard, {{recipient_name}}" },
      { id: "b2", type: "paragraph", content: "We are thrilled to have you join our workspace. Your account has been provisioned and is ready to use." },
      { id: "b3", type: "button", content: "Open Workspace", metadata: { url: "{{workspace_link}}" } },
      { id: "b4", type: "signature", content: "Regards, The Workplace Hub Team" }
    ]
  }
];

export const EmailTemplateService = {
  getTemplates: () => templates,
  getTemplate: (id: string) => templates.find(t => t.id === id),
  saveTemplate: (template: EmailTemplate) => {
    const idx = templates.findIndex(t => t.id === template.id);
    if (idx >= 0) {
      templates[idx] = { ...template, updatedAt: new Date().toISOString() };
    } else {
      templates.push({ ...template, id: Math.random().toString(36).substring(7), updatedAt: new Date().toISOString() });
    }
  },
  deleteTemplate: (id: string) => {
    templates = templates.filter(t => t.id !== id);
  }
};
