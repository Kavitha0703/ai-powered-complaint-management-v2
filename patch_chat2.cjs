const fs = require('fs');
let code = fs.readFileSync('api/_app.ts', 'utf8');

const importSupabase = `import { createClient } from "@supabase/supabase-js";\nconst supabaseUrl = process.env.VITE_SUPABASE_URL || "";\nconst supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";\nconst supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;\n\n`;

if (!code.includes('@supabase/supabase-js')) {
    code = importSupabase + code;
}

// Locate app.post("/api/chat", ...)
const chatStart = code.indexOf('app.post("/api/chat"');
const chatRegex = /app\.post\("\/api\/chat"[\s\S]*?(?=\n\/\/ AI Screenshot Analyze Endpoint|\n\/\/ AI Analyze Endpoint)/;

const newChatHandler = `app.post("/api/chat", async (req: express.Request, res: express.Response) => {
  try {
    console.time("Chat Request Total");
    console.time("Request Parsing & Auth");
    const { messages, file, systemContext, responsePreference } = req.body;
    console.timeEnd("Request Parsing & Auth");
    
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "A valid array of conversation 'messages' is required." });
      return;
    }

    const lastUserMsg = messages.filter((m: any) => m.sender === "user" || m.role === "user").pop();
    const lastUserText = lastUserMsg ? lastUserMsg.text : "";
    const role = systemContext?.role || "visitor";
    
    // --- INTENT CLASSIFICATION ---
    const lowerText = lastUserText.toLowerCase().trim();
    let intent = "general";
    
    if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|yo)$/.test(lowerText)) {
      intent = "greeting";
    } else if (/^(thank you|thanks|thx|ty|awesome|great|good job|ok|okay)$/.test(lowerText)) {
      intent = "appreciation";
    } else if (/what is this platform|how does this work|features|demo|about|who are you|help|login/.test(lowerText)) {
      intent = "faq";
    } else if (role === "admin" && /(report|analytics|statistics|trend|summary|compare|all complaints)/.test(lowerText)) {
      intent = "admin_analytics";
    } else if (role === "admin" && /(ticket|complaint|issue|notice)/.test(lowerText)) {
      intent = "admin_query";
    } else if (role === "user" && /(ticket|complaint|issue|broken|not working|salary|laptop|wifi|printer)/.test(lowerText)) {
      intent = "user_query";
    }
    
    // Check if we can skip Gemini entirely
    if (intent === "greeting") {
      return res.json({ text: "Hello! 👋 How can I help you today?", quickActions: role === "visitor" ? [] : ["view_notices"] });
    }
    if (intent === "appreciation") {
      return res.json({ text: "You're very welcome! Let me know if you need anything else.", quickActions: [] });
    }
    if (intent === "faq" && role === "visitor") {
      return res.json({ 
        text: "I am the Workplace Hub AI Assistant! 🤖\\n\\nI can help you with:\\n- Smart Complaint Simulation\\n- AI Analytics Demo\\n- Policies & Navigation\\n\\nPlease log in to access your personal dashboard.",
        quickActions: ["register_ticket"]
      });
    }

    // --- PARALLEL DATABASE FETCHING ---
    console.time("Parallel DB Fetch");
    let fetchedTickets = [];
    let fetchedNotices = [];
    let fetchedFeedback = [];
    let dbStats = { totalTickets: 0, pendingCount: 0, inProgressCount: 0, resolvedCount: 0 };
    
    if (supabase) {
      if (intent === "user_query" && systemContext?.userProfile?.id) {
        const [ticketsRes, noticesRes] = await Promise.all([
          supabase.from("tickets").select("id, issue_type, severity, description, status, created_at").eq("user_id", systemContext.userProfile.id).order("created_at", { ascending: false }).limit(10),
          supabase.from("notices").select("id, title, message, created_at").order("created_at", { ascending: false }).limit(5)
        ]);
        fetchedTickets = ticketsRes.data || [];
        fetchedNotices = noticesRes.data || [];
      } else if (intent === "admin_query" || intent === "admin_analytics") {
        const limit = intent === "admin_analytics" ? 100 : 20;
        const [ticketsRes, noticesRes, feedbackRes] = await Promise.all([
          supabase.from("tickets").select("id, issue_type, severity, description, status, created_at").order("created_at", { ascending: false }).limit(limit),
          supabase.from("notices").select("id, title, message, created_at").order("created_at", { ascending: false }).limit(5),
          supabase.from("feedback").select("id, rating, message, created_at").order("created_at", { ascending: false }).limit(10)
        ]);
        fetchedTickets = ticketsRes.data || [];
        fetchedNotices = noticesRes.data || [];
        fetchedFeedback = feedbackRes.data || [];
        
        dbStats.totalTickets = fetchedTickets.length;
        dbStats.pendingCount = fetchedTickets.filter((c: any) => c.status === "Pending").length;
        dbStats.inProgressCount = fetchedTickets.filter((c: any) => c.status === "In Progress").length;
        dbStats.resolvedCount = fetchedTickets.filter((c: any) => c.status === "Resolved").length;
      }
    }
    console.timeEnd("Parallel DB Fetch");

    // Construct Context Prompt
    let databaseContextPrompt = "";
    if (role === "user") {
      databaseContextPrompt = \`ACTIVE ROLE: Personal Support Assistant\\nLogged-in User Name: \${systemContext?.userProfile?.name || "User"}\\n\\n--- GROUND-TRUTH STATUS ---\\nThese are your tickets:\\n\${fetchedTickets.map((c: any) => \`- Ticket #\${c.id.toString().substring(0, 8).toUpperCase()}: \${c.issue_type} (\${c.status})\`).join("\\n") || "No tickets found."}\`;
    } else if (role === "admin") {
      databaseContextPrompt = \`ACTIVE ROLE: Administrative AI Assistant\\nLogged-in Admin: \${systemContext?.userProfile?.name || "System Admin"}\\n\\n--- PRODUCTION DB METRICS ---\\nTotal Tickets (Loaded): \${dbStats.totalTickets}\\nPending: \${dbStats.pendingCount}\\nIn Progress: \${dbStats.inProgressCount}\\nResolved: \${dbStats.resolvedCount}\\n\\nRecent Tickets:\\n\${fetchedTickets.slice(0, 15).map((c: any) => \`- Ticket #DCMS-\${c.id.toString().substring(0, 5).toUpperCase()}: \${c.issue_type} | \${c.severity} | \${c.status}\`).join("\\n") || "No tickets."}\`;
    } else {
      databaseContextPrompt = \`ACTIVE ROLE: General Workplace Hub AI Assistant\\nNo dynamic system context was passed in the request. Give polite general website support.\`;
    }

    const { emotion, personaModifier } = emotionDetection(lastUserText, role === "admin");
    const isBriefMode = responsePreference === "brief" || !responsePreference;
    let formattingInstruction = "";
    
    if (role === "admin") {
      formattingInstruction = "RESPONSE FORMATTING MANDATES FOR ADMIN:\\n- Always start with a friendly greeting.\\n- Keep reporting style elegant and scannable.\\n- Suggest relevant export actions in quickActions.\\n- NEVER output raw SQL query dumps.";
    } else if (isBriefMode) {
      formattingInstruction = "RESPONSE FORMATTING MANDATES (BRIEF MODE):\\n- Limit overall reply text to under 6 lines.\\n- Do not output rigid report blocks unless asked.\\n- Empathize with frustrated users.";
    } else {
      formattingInstruction = "RESPONSE FORMATTING MANDATES (DETAILED):\\n- Provide beautifully formatted, detailed answers utilizing bullet lists.\\n- Avoid unrequested telemetry lines.";
    }

    const systemInstruction = "You are '🤖 Workplace Hub AI Operations Assistant'.\\n" + personaModifier + "\\n\\nCURRENT CONTEXT:\\n" + databaseContextPrompt + "\\n\\n" + formattingInstruction + "\\n\\n" +
      "UI INSTRUCTION: If user requests tabular formats, reports, stats, metrics, you MUST return a 'table', 'chart', or 'kpi_cards' inside the 'structuredData' JSON object.";

    const recentMessages = messages.slice(-10).map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    if (file && (file.data || file.extractedText) && file.type) {
      const mime = file.type;
      const base64Data = file.data || "";
      const fileName = file.name || "Document";
      const userMsg = recentMessages[recentMessages.length - 1];
      if (userMsg && userMsg.role === "user") {
        if (file.extractedText) {
          userMsg.parts[0].text = \`[Document Analysis: \${fileName}]\\n\\nEXTRACTED TEXT:\\n"""\\n\${file.extractedText}\\n"""\\n\\nUser Inquiry: \${userMsg.parts[0].text}\`;
        } else if (mime.startsWith("image/") || mime === "application/pdf") {
          const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
          userMsg.parts.push({
            inlineData: { mimeType: mime.startsWith("image/") ? mime : "application/pdf", data: cleanBase64 }
          } as any);
        }
      }
    }

    const fallbackValue = {
      text: "🟡 AI Prediction\\n\\nI am currently running in resilient offline mode because our primary AI channels are experiencing very high traffic. How can I help you?",
      suggestedCategory: "Other", suggestedSeverity: "Low", quickActions: ["register_ticket"], suggestedQueries: ["How do I register a ticket?"]
    };

    console.time("Gemini API Call");
    const targetModel = intent === "admin_analytics" ? "gemini-3.1-pro-preview" : "gemini-3.5-flash";
    
    const response = await callGeminiWithFallback({
      model: targetModel,
      contents: recentMessages,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: require("@google/genai").Type.OBJECT,
          properties: {
            text: { type: require("@google/genai").Type.STRING },
            suggestedCategory: { type: require("@google/genai").Type.STRING },
            suggestedSeverity: { type: require("@google/genai").Type.STRING },
            quickActions: { type: require("@google/genai").Type.ARRAY, items: { type: require("@google/genai").Type.STRING } },
            suggestedQueries: { type: require("@google/genai").Type.ARRAY, items: { type: require("@google/genai").Type.STRING } },
            structuredData: {
              type: require("@google/genai").Type.OBJECT,
              properties: {
                type: { type: require("@google/genai").Type.STRING },
                kpis: { type: require("@google/genai").Type.ARRAY, items: { type: require("@google/genai").Type.OBJECT, properties: { label: { type: require("@google/genai").Type.STRING }, value: { type: require("@google/genai").Type.STRING }, trend: { type: require("@google/genai").Type.STRING } } } },
                table: { type: require("@google/genai").Type.OBJECT, properties: { columns: { type: require("@google/genai").Type.ARRAY, items: { type: require("@google/genai").Type.STRING } }, rows: { type: require("@google/genai").Type.ARRAY, items: { type: require("@google/genai").Type.OBJECT } } } },
                chart: { type: require("@google/genai").Type.OBJECT, properties: { type: { type: require("@google/genai").Type.STRING }, title: { type: require("@google/genai").Type.STRING }, labels: { type: require("@google/genai").Type.ARRAY, items: { type: require("@google/genai").Type.STRING } }, datasets: { type: require("@google/genai").Type.ARRAY, items: { type: require("@google/genai").Type.OBJECT, properties: { label: { type: require("@google/genai").Type.STRING }, data: { type: require("@google/genai").Type.ARRAY, items: { type: require("@google/genai").Type.NUMBER } } } } } } },
                actions: { type: require("@google/genai").Type.ARRAY, items: { type: require("@google/genai").Type.STRING } }
              }
            },
            physicalLocation: {
              type: require("@google/genai").Type.OBJECT,
              properties: { requiresPhysical: { type: require("@google/genai").Type.BOOLEAN }, department: { type: require("@google/genai").Type.STRING }, room: { type: require("@google/genai").Type.STRING }, floor: { type: require("@google/genai").Type.STRING }, hours: { type: require("@google/genai").Type.STRING }, instructions: { type: require("@google/genai").Type.STRING } }
            },
            aiAnalysis: {
              type: require("@google/genai").Type.OBJECT,
              properties: { detectedIssue: { type: require("@google/genai").Type.STRING }, confidence: { type: require("@google/genai").Type.STRING }, priority: { type: require("@google/genai").Type.STRING }, businessImpact: { type: require("@google/genai").Type.STRING }, rootCause: { type: require("@google/genai").Type.STRING }, recommendedAction: { type: require("@google/genai").Type.STRING }, estimatedResolution: { type: require("@google/genai").Type.STRING }, sla: { type: require("@google/genai").Type.STRING } }
            },
            detectedLanguage: { type: require("@google/genai").Type.STRING },
            originalComplaint: { type: require("@google/genai").Type.STRING },
            translatedComplaint: { type: require("@google/genai").Type.STRING }
          },
          required: ["text"],
        }
      }
    }, fallbackValue, 15000); // 15s timeout
    console.timeEnd("Gemini API Call");

    console.time("Response Formatting & Sending");
    const jsonText = response.text?.trim() || "{}";
    res.json(JSON.parse(jsonText));
    console.timeEnd("Response Formatting & Sending");
    console.timeEnd("Chat Request Total");
  } catch (error: any) {
    console.error("Gemini AI Chat Assist Error:", error);
    res.status(500).json({ error: error.message || "Failed to process chat assistance request." });
  }
});
`;

code = code.replace(chatRegex, newChatHandler);
fs.writeFileSync('api/_app.ts', code);
console.log("Patched api/_app.ts");
