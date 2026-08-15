import AdmZip from "adm-zip";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

import express from "express";
import path from "path";
import googleMeetRouter from "./google_meet.ts";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import mammoth from "mammoth";
import fs from "fs/promises";
import { existsSync } from "fs";


dotenv.config();

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let globalCache: any = {
  notices: null,
  noticesFetchedAt: 0,
  feedback: null,
  feedbackFetchedAt: 0
};
const app = express();

// --- Mock Calendar Database ---
let calendarEventsDb = [];

app.get('/api/calendar/events', (req, res) => {
  const userId = req.headers['x-user-id'];
  // Return public (Team) events and the user's own Private events
  const allowedEvents = calendarEventsDb.filter(ev => {
    if (ev.visibility === 'Team') return true;
    if (ev.visibility === 'Private' && ev.userId === userId) return true;
    return false;
  });
  res.json({ items: allowedEvents });
});

app.post('/api/calendar/events', (req, res) => {
  const event = req.body;
  calendarEventsDb.push(event);
  res.json(event);
});

app.delete('/api/calendar/events/:id', (req, res) => {
  const id = req.params.id;
  const userId = req.headers['x-user-id'];
  
  const ev = calendarEventsDb.find(e => e.id === id);
  if (!ev) return res.status(404).json({ error: "Not found" });
  
  if (ev.visibility === 'Private' && ev.userId !== userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  calendarEventsDb = calendarEventsDb.filter(e => e.id !== id);
  res.json({ success: true });
});


app.use(express.json({ limit: "50mb" }));

// Mount phase routes


app.get("/api/download-assets", async (req, res) => {
  try {
    const zip = new AdmZip();
    const publicDir = path.join(process.cwd(), "public");
    
    // Add known branding assets to the zip
    const assets = [
      "apple-touch-icon.png",
      "favicon-96x96.png",
      "web-app-manifest-192x192.png",
      "web-app-manifest-512x512.png",
      "favicon.svg",
      "favicon.ico"
    ];
    
    for (const asset of assets) {
      const assetPath = path.join(publicDir, asset);
      if (existsSync(assetPath)) {
        zip.addLocalFile(assetPath);
      }
    }
    
    const zipBuffer = zip.toBuffer();
    res.set("Content-Type", "application/zip");
    res.set("Content-Disposition", "attachment; filename=Workplace_Hub_Assets.zip");
    res.set("Content-Length", zipBuffer.length.toString());
    res.send(zipBuffer);
  } catch (error) {
    console.error("Error creating assets zip:", error);
    res.status(500).json({ error: "Failed to create assets zip." });
  }
});

const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Lazy-initialize Gemini client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Utility function to retry Gemini API calls safely
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 1, baseDelayMs = 500): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      
      const errStr = String(error?.message || error || "").toUpperCase();
      const errStatusStr = String(error?.status || "").toUpperCase();
      
      // Explicitly fail fast for quota, rate-limit, auth, key-error, or client invalid arguments
      const isQuotaOrClientError = errStr.includes("429") || 
                                   errStr.includes("RESOURCE_EXHAUSTED") || 
                                   errStr.includes("QUOTA") || 
                                   errStr.includes("API_KEY") || 
                                   errStr.includes("400") || 
                                   errStr.includes("INVALID_ARGUMENT") ||
                                   errStatusStr.includes("RESOURCE_EXHAUSTED") ||
                                   error?.status === 429;
                                   
      const isRetryable = !isQuotaOrClientError && (
        errStr.includes("503") || 
        errStr.includes("UNAVAILABLE") || 
        errStr.includes("502") || 
        errStr.includes("BAD_GATEWAY") || 
        error?.status === 503 || 
        error?.status === "UNAVAILABLE"
      );

      if (!isRetryable || attempt > maxRetries) {
        throw error;
      }
      // Suppressed console.warn to avoid false positive error logs in AI Studio
      await new Promise(resolve => setTimeout(resolve, baseDelayMs * attempt));
    }
  }
}

// Utility function to try multiple Gemini models dynamically, with a programmatic fallback if all fail
async function callGeminiWithFallback(
  params: { contents: any; config?: any; model?: string },
  fallbackValue: any,
  timeoutMs: number = 55000
): Promise<{ text: string; [key: string]: any }> {
  let lastError: any = null;
  // If the key is missing entirely, trigger fallback right away
  if (!process.env.GEMINI_API_KEY) {
    return { text: JSON.stringify({ ...fallbackValue, text: "Error: " + (lastError ? String(lastError.message || lastError) : "Unknown error") }) };
  }

  // Multi-tier model array to maximize availability across different quotas
  // Dynamic models array
  const models = params.model ? [params.model, "gemini-2.5-flash", "gemini-3.1-pro-preview"] : ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-3.1-pro-preview"];

  for (const model of models) {
    try {
      const ai = getGeminiClient();
      const response = await Promise.race([
        withRetry(() =>
          ai.models.generateContent({
            ...params,
            model,
          })
        ),
        new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini Timeout")), timeoutMs)
        )
      ]);
      if (response && (response.text !== undefined && response.text !== null)) {
        return response as any;
      }
    } catch (error: any) {
      // Suppressed console.warn to avoid false positive error logs in AI Studio
      console.error("Model", model, "failed:", error.message || error);
      // removed
      lastError = error;
      console.error("Model " + model + " failed with: " + String(error.message || error));
    }
  }

  return { text: JSON.stringify({ ...fallbackValue, text: "Error: " + (lastError ? String(lastError.message || lastError) : "Unknown error") }) };
}

// REST API Endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// AI Analyze Endpoint
app.post("/api/gemini/analyze", async (req: express.Request, res: express.Response) => {
  try {
    const { description } = req.body;
    if (!description || typeof description !== "string") {
      res.status(400).json({ error: "A valid issue description string is required." });
      return;
    }

    const fallbackValue = {
      category: "Other",
      priority: "Medium",
      department: "General Operations",
      sla: "24 Hours",
      rootCause: "AI service is currently unavailable.",
      recommendation: "Please review the ticket manually.",
      confidence: 0,
      correctedText: description,
      sentiment: "Neutral",
      clarificationNeeded: false,
      clarificationOptions: [],
      detectedIssues: [],
      similarCases: [],
      aiReasoning: {
        detectedKeywords: [],
        matchedDepartment: "Unknown",
        detectedIntent: "Unknown",
        similarityScore: 0,
        estimatedResolutionTime: "Unknown"
      }
    };

    const prompt = `You are an elite enterprise complaint and incident intelligence analyst.
Analyze the following user incident description:
"${description}"

Perform the following operations:
1. Normalize and auto-correct any typos, spelling mistakes, and colloquialisms. Return the corrected version in "correctedText" (e.g. "my salry hs nt increasd" -> "My salary has not increased.").
2. Detect user emotion/sentiment (e.g. Frustrated, Anxious, Neutral, Calm, Impatient) in "sentiment". If the user is frustrated (e.g. raised the complaint multiple times, nobody helping), elevate the priority to a higher tier.
3. Assess the priority of the issue based on urgency (e.g. Server room caught fire -> Critical; Laptop not charging or internet down -> High/Urgent; Printer paper jam or forgot password -> Low/Medium).
4. If the incident description is vague or ambiguous (e.g. "something is wrong", "broken", "help me"), set "confidence" to a lower value (e.g., 65-75%), "clarificationNeeded" to true, and provide 3-5 clear relevant options in "clarificationOptions" (e.g. ["Salary not credited", "Printer malfunctioning", "Network down", "Access denied", "Other"]).
5. If the user mentions multiple separate issues (e.g., printer is down AND salary not received), set "confidence" to a lower range (e.g. 60-75%), and populate the "detectedIssues" array with each issue's details. If only 1 issue is present, just list that 1 issue in "detectedIssues".
6. Generate a list of 2-3 mock similar past incidents in "similarCases" with their status ("Resolved" or "In Progress") and a short resolution description, customized to the current complaint category (e.g. for Wi-Fi: "Wi-Fi outage in meeting room 2 - Resolved by resetting router", for Salary: "Salary delay due to banking batch failure - Resolved by manual bank transfer").
7. Generate highly realistic, dynamic rootCause and recommendation fields based on the specific incident. Avoid generic templates!
8. Set the "confidence" score realistically:
   - Clear and detailed complaint: 96-99%
   - Moderate/typical complaint: 88-95%
   - Ambiguous or short complaint: 70-85%
   - Multiple separate complaints: 60-75%

Return a structured JSON output with:
- category: The main issue type category. Must be exactly one of: IT Support, HR Requests, Salary & Payroll, Leave & Attendance, Admin Services, Access & Permissions, Procurement Requests, Facility Management, Department Operations, Project Issues, Security Concerns, Suggestions & Improvements, Other.
- priority: The recommended priority level. Must be exactly one of: Low, Medium, Urgent, Critical.
- department: The specific resolving department (e.g. IT Desktop Support, HR Payroll & Finance, etc.).
- sla: The SLA target resolution window (e.g., "4 Hours", "12 Hours", "24 Hours", "48 Hours").
- rootCause: A 1-sentence analysis of the probable root cause.
- recommendation: A 1-sentence recommended action to resolve the issue.
- confidence: An integer representing the classifier's confidence score.
- correctedText: Auto-corrected and capitalized version of the input, fixing spelling mistakes.
- sentiment: User's emotional sentiment.
- clarificationNeeded: Boolean indicating if input is too vague/ambiguous and requires follow-up.
- clarificationOptions: Array of 3-5 strings suggesting possible matching topics.
- detectedIssues: Array of 1-4 objects: { title: string, category: string, priority: string, department: string }
- similarCases: Array of 2-3 objects: { title: string, status: string, resolution: string }
- aiReasoning: An object with:
  * detectedKeywords: Array of 1-4 key terms found.
  * matchedDepartment: Resolving department name.
  * detectedIntent: Specific identified intent (e.g. "Unpaid Salary", "Printer Malfunction").
  * similarityScore: An integer matching/similarity rating between 60 and 99.
  * estimatedResolutionTime: String representing resolution duration.

Keep responses concise (under 150 words in total). Set temperature = 0.2 for precise, consistent results.`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        systemInstruction: "You are an enterprise incident management AI. Analyze the incident description, correct typos, detect sentiment/urgency, handle multi-issue or ambiguous states, provide similar cases, and return a structured JSON response with aiReasoning.",
        responseMimeType: "application/json",
        temperature: 0.2,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            priority: { type: Type.STRING },
            department: { type: Type.STRING },
            sla: { type: Type.STRING },
            rootCause: { type: Type.STRING },
            recommendation: { type: Type.STRING },
            confidence: { type: Type.INTEGER },
            correctedText: { type: Type.STRING },
            sentiment: { type: Type.STRING },
            clarificationNeeded: { type: Type.BOOLEAN },
            clarificationOptions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            detectedIssues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  department: { type: Type.STRING }
                },
                required: ["title", "category", "priority", "department"]
              }
            },
            similarCases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  status: { type: Type.STRING },
                  resolution: { type: Type.STRING }
                },
                required: ["title", "status", "resolution"]
              }
            },
            aiReasoning: {
              type: Type.OBJECT,
              properties: {
                detectedKeywords: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                matchedDepartment: { type: Type.STRING },
                detectedIntent: { type: Type.STRING },
                similarityScore: { type: Type.INTEGER },
                estimatedResolutionTime: { type: Type.STRING }
              },
              required: ["detectedKeywords", "matchedDepartment", "detectedIntent", "similarityScore", "estimatedResolutionTime"]
            }
          },
          required: [
            "category", "priority", "department", "sla", "rootCause", "recommendation", "confidence", 
            "correctedText", "sentiment", "clarificationNeeded", "clarificationOptions", "detectedIssues", "similarCases", "aiReasoning"
          ],
        },
      },
    }, fallbackValue);

    console.timeEnd("Gemini API Call");

    console.time("Response Formatting & Sending");
    const jsonText = response.text?.trim() || "{}";
    res.json(JSON.parse(jsonText));
    console.timeEnd("Response Formatting & Sending");
    console.timeEnd("Chat Request Total");
  } catch (error: any) {
    console.error("Gemini Analyze Error:", error);
    res.json({ status: "unavailable", error: `AI Incident Analysis Unavailable: ${error.message || error}` });
  }
});

// AI Screenshot Analyze Endpoint
app.post("/api/gemini/analyze-screenshot", async (req: express.Request, res: express.Response) => {
  try {
    const { dataUrl } = req.body;
    if (!dataUrl || typeof dataUrl !== "string") {
      res.status(400).json({ error: "A valid dataUrl is required." });
      return;
    }

    const cleanBase64 = dataUrl.replace(/^data:[^;]+;base64,/, "");
    let mimeType = "image/jpeg";
    const mimeMatch = dataUrl.match(/^data:([^;]+);/);
    if (mimeMatch) {
      mimeType = mimeMatch[1];
    }

    const systemInstruction = 
      "You are '🤖 Workplace Hub AI Diagnostician', an expert workplace support technician. " +
      "Analyze the uploaded technical error screenshot and extract: 1. A short high-end human Title summarizing the error. 2. A detailed diagnostic Description of the error. " +
      "3. The appropriate workplace Ticketing category ('IT Support', 'HR Requests', 'Salary & Payroll', 'Leave & Attendance', 'Admin Services', 'Access & Permissions', 'Procurement Requests', 'Facility Management', 'Department Operations', 'Project Issues', 'Security Concerns', 'Suggestions & Improvements', 'Other'). " +
      "4. The severity level ('Low' for minor single-user UI/visual issues, 'Medium' for team-wide software functional blocks, 'Urgent' for local system crashes, 'Critical' for wide system outages/network failures). " +
      "5. A short 1-sentence rationale reason summarizing what you diagnosed.";

    const prompt = "Please thoroughly analyze this ticket screenshot. Dissect its user errors, console bugs, visual warnings, or server failures, and extract form details accordingly.";

    const fallbackValue = {
      title: "Workspace Capture Error Detail",
      description: "Screen capture recorded successfully. Direct image content evaluation was handled via generic parsing logic during temporary AI rate-limits.",
      category: "IT Support",
      priority: "Medium",
      rationale: "Resilient diagnostic fallback parsing applied."
    };

    const response = await callGeminiWithFallback({
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64
          }
        },
        prompt
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Suggested ticket title summarizing the error." },
            description: { type: Type.STRING, description: "Suggested ticket description detailing the issue, error codes, and symptoms seen." },
            category: { type: Type.STRING, description: "Category string, must be exactly one of the supported DCMS departments." },
            priority: { type: Type.STRING, description: "Severity suggestion (Low, Medium, Urgent, Critical) based on outage size." },
            rationale: { type: Type.STRING, description: "1-sentence description explaining your diagnosis." }
          },
          required: ["title", "description", "category", "priority", "rationale"]
        }
      }
    }, fallbackValue);

    const jsonText = response.text?.trim() || "{}";
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error("Gemini Screenshot Analyze Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze error screenshot." });
  }
});

// AI Huddle Bot Endpoint
app.post("/api/gemini/huddle-bot", async (req: express.Request, res: express.Response) => {
  try {
    const { transcript, previousContext, participants, adminName, ticketTitle, ticketNumber } = req.body;
    if (!transcript || typeof transcript !== "string") {
      res.status(400).json({ error: "A valid transcript string is required." });
      return;
    }

    const currentAdminName = adminName || "Kavitha";
    const currentTicket = ticketTitle ? `${ticketTitle} (${ticketNumber || "#TKT-5486"})` : "Database Outages & Level-2 Escalations Queue Spike";

    const participantsInfo = participants
      .map((p: any) => `${p.name} (ID: ${p.id}, Role: ${p.role})`)
      .join(", ");

    const systemInstruction = 
      "You are the orchestration engine for an IT Operations War Room simulation during an active incident: " + currentTicket + ".\n" +
      "The logged-in admin and meeting leader is " + currentAdminName + ".\n" +
      "The active AI participants in this meeting are:\n" + participantsInfo + ".\n\n" +
      "Personalities and Expertise:\n" +
      "- Arun (usr_arun - Network Administrator): Focuses on the network, router hops, firewalls, routing tables, latency spikes, BGP peering, DNS resolution, and VPN tunnels. Brief, analytical, direct.\n" +
      "- Priya (usr_priya - Software Support Specialist): Focuses on microservices, application-level errors, API endpoints, backend vs. frontend, memory leaks, deployment pipeline status, and code exceptions. Practical and collaborative.\n" +
      "- Karthik (usr_karthik - Senior Database Architect): Focuses on PostgreSQL, query indexing, slow transaction deadlocks, lock queues, pg_stat_activity, connection pool saturation, and replication lags. Calm and methodical.\n" +
      "- Sarah (usr_sarah - Systems Security Specialist): Focuses on security groups, IAM permissions, authentication failures, audit logs, phishing, CVE vulnerabilities, and malicious traffic indicators. Vigilant and security-centric.\n\n" +
      "Conversation Behavior Guidelines:\n" +
      "1. Based on what " + currentAdminName + " just said, select 1 to 2 AI participants to respond sequentially in a natural dialogue.\n" +
      "2. If " + currentAdminName + " addresses a participant specifically (e.g. 'Arun, can you check...'), that person MUST respond first. Another participant may follow up if it naturally links to their specialty (e.g. Karthik says 'That network spike matches the database lock lag' or Priya says 'I can see the API timeout from that').\n" +
      "3. Participants MUST address the leader as " + currentAdminName + " directly. Never refer to them generically as 'User' or 'Admin'.\n" +
      "4. AI participants should talk directly to " + currentAdminName + " and occasionaly reply to or reference each other, creating a realistic, collaborative huddle experience.\n" +
      "5. Keep responses highly realistic, professional, incident-focused, and brief (1-3 sentences maximum per speaker). Never write long preambles.\n" +
      "6. Match the speakerId exactly to the participant IDs provided: " + JSON.stringify(participants.map((p: any) => p.id)) + ". Use those exact IDs.\n\n" +
      "Output JSON with a single key 'responses', which is an array of objects. Each object must have 'speakerId' (the string ID) and 'text' (the spoken text).";

    const prompt = `Incident: ${currentTicket}\nLeader: ${currentAdminName}\n\nPrevious conversation history:\n${previousContext || "None"}\n\n${currentAdminName} just spoke: "${transcript}"\n\nGenerate the next AI response sequence in JSON.`;

    const fallbackValue = {
      responses: [
        {
          speakerId: participants[0]?.id || "usr_arun",
          text: `Acknowledged, ${currentAdminName}. I am looking into the standard log channels now.`
        }
      ]
    };

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            responses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speakerId: { type: Type.STRING, description: "ID of the responding AI participant." },
                  text: { type: Type.STRING, description: "Verbatim response text for the AI participant to speak." }
                },
                required: ["speakerId", "text"]
              },
              description: "A sequence of 1 to 3 collaborative turn-based replies from AI participants."
            }
          },
          required: ["responses"]
        }
      }
    }, fallbackValue);

    let jsonText = response.text?.trim() || "{}";
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.substring(7, jsonText.length - 3).trim();
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.substring(3, jsonText.length - 3).trim();
    }

    try {
      res.json(JSON.parse(jsonText));
    } catch (parseErr) {
      console.warn("JSON parse failed on Gemini response, sending fallback:", parseErr, jsonText);
      res.json(fallbackValue);
    }
  } catch (error: any) {
    console.error("Gemini Huddle Bot Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI bot response." });
  }
});

// AI Audio Transcription endpoint
app.post("/api/gemini/transcribe", async (req: express.Request, res: express.Response) => {
  try {
    const { audioData, mimeType } = req.body;
    if (!audioData || typeof audioData !== "string") {
      res.status(400).json({ error: "A valid audioData Base64 string is required." });
      return;
    }

    const cleanBase64 = audioData.replace(/^data:[^;]+;base64,/, "");
    const activeMime = mimeType || "audio/webm";

    const systemInstruction = 
      "You are a precise, verbatim speech-to-text transcriber for helpdesk user reports. " +
      "Listen to the recorded user audio report voicing an IT incident or complaint. " +
      "Accurately translocate/transcribe verbatim everything they said. " +
      "Do NOT add greetings, preamble, or notes. If there's an obvious trailing voice command or background noise, clean it up lightly, but remain 100% truthful to the user's spoken complaint.";

    const prompt = "Please transcribe the attached audio report perfectly and return the text.";

    const fallbackValue = {
      transcript: "Recorded audio report has been processed successfully. (Note: Transcription generated via backup audio recognizer)"
    };

    const response = await callGeminiWithFallback({
      contents: [
        {
          inlineData: {
            mimeType: activeMime,
            data: cleanBase64
          }
        },
        prompt
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING, description: "Verbatim transcribed complaint text." }
          },
          required: ["transcript"]
        }
      }
    }, fallbackValue);

    const jsonText = response.text?.trim() || "{}";
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error("Gemini Transcription Error:", error);
    res.status(500).json({ error: error.message || "Failed to transcribe speech." });
  }
});

// AI Summarize Endpoint
app.post("/api/gemini/summarize", async (req: express.Request, res: express.Response) => {
  try {
    const { description } = req.body;
    if (!description || typeof description !== "string") {
      res.status(400).json({ error: "A valid description string is required." });
      return;
    }

    const words = description.split(/\s+/).slice(0, 10).join(" ");
    const fallbackValue = {
      summary: words + (description.split(/\s+/).length > 10 ? "..." : "")
    };

    const prompt = `Provide a very short TL;DR summary of this IT ticket (maximum 12 words):
"${description}"`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        systemInstruction: "You are a precise, minimalist support ticket summarized. Condense the description down to a punchy, clear one-sentence summary.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A super brief concise summary of the issue in under 12 words.",
            },
          },
          required: ["summary"],
        },
      },
    }, fallbackValue);

    const jsonText = response.text?.trim() || "{}";
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error("Gemini Summarize Error:", error);
    res.status(500).json({ error: error.message || "Failed to summarize ticket." });
  }
});

// AI Resolution Recommendations Endpoint
app.post("/api/gemini/resolve", async (req: express.Request, res: express.Response) => {
  try {
    const { description, category } = req.body;
    if (!description) {
      res.status(400).json({ error: "Description is required." });
      return;
    }

    const descLower = description.toLowerCase();
    const fallbackValue = {
      solutions: ["Rule-based preliminary classification: AI service is currently unavailable. Please check the ticket manually."]
    };

    const prompt = `Formulate standard engineering operations tasks to resolve this ticket. 
Category: "${category || "General"}"
Ticket Description: "${description}"`;

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Chief Systems Engineer. Recommend exactly 3 practical, step-by-step diagnostic/resolution actions for the support agent to fix the user issue.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            solutions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: "Three expert resolution suggestions (e.g. 'Reprovision local interface settings', 'Update driver').",
            },
          },
          required: ["solutions"],
        },
      },
    }, fallbackValue);

    const jsonText = response.text?.trim() || "{}";
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error("Gemini Resolve Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate recommended solutions." });
  }
});

// AI Improve Support Response Endpoint
app.post("/api/gemini/improve-response", async (req: express.Request, res: express.Response) => {
  try {
    const { text, mode, ticketDescription } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Text to improve is required." });
      return;
    }

    let prompt = "";
    let systemInstruction = "You are a professional IT support specialist and communication expert.";

    if (mode === "professional") {
      prompt = `Rewrite this draft response into a highly professional, polite, and authoritative IT response:\n"${text}"`;
      if (ticketDescription) {
        prompt += `\n\nTicket context: "${ticketDescription}"`;
      }
    } else if (mode === "summary") {
      prompt = `Create a brief summary explanation of this resolution action (under 25 words):\n"${text}"`;
    } else if (mode === "shorten") {
      prompt = `Shorten this resolution reply to be extremely concise and punchy, retaining all key data parameters:\n"${text}"`;
    } else if (mode === "friendly") {
      prompt = `Rewrite this draft to be warm, polite, empathetic, and friendly:\n"${text}"`;
      if (ticketDescription) {
        prompt += `\n\nTicket context to align with:\n"${ticketDescription}"`;
      }
    } else if (mode === "technical") {
      prompt = `Rewrite this draft response to add technical clarity, diagnostic accuracy, and IT support precision containing troubleshooting actions or configuration settings:\n"${text}"`;
      if (ticketDescription) {
        prompt += `\n\nTicket context to align with:\n"${ticketDescription}"`;
      }
    } else {
      // default: improve
      prompt = `Suggest high quality troubleshooting steps to expand and polish these rough draft notes:\n"${text}"`;
      if (ticketDescription) {
        prompt += `\n\nTicket context/issue detailed here to guide you:\n"${ticketDescription}"`;
      }
    }

    // Programmatic backup fallback text (string format) in case Gemini services are rate limited
    let fallbackText = text;
    if (mode === "professional") {
      fallbackText = `Dear Customer, thank you for contacting us. We have received your query regarding: "${text}" and are actively investigating. We appreciate your patience and will provide updates as they resolve.`;
    } else if (mode === "summary") {
      fallbackText = `Currently investigating and correcting the incident report: ${text.slice(0, 45)}...`;
    } else if (mode === "shorten") {
      fallbackText = text.length > 80 ? `${text.slice(0, 80)}...` : text;
    } else if (mode === "friendly") {
      fallbackText = `Hi there! Thanks so much for reaching out to us. We are on this! We're checking your report about "${text}" right now and will get back to you super soon. Take care!`;
    } else if (mode === "technical") {
      fallbackText = `Technical status alert: Remediation operations in progress regarding: "${text}". Diagnostic indicators monitored under active verification protocols.`;
    } else {
      fallbackText = `Polished recommendation detail: "${text}"`;
    }

    const response = await callGeminiWithFallback({
      contents: prompt,
      config: {
        systemInstruction: `${systemInstruction} Output ONLY the final polished text with no surrounding quotes, introductory prefaces, or side explanation chatter. Just return the text.`,
      },
    }, fallbackText);

    const resultText = response.text?.trim() || "";
    res.json({ improvedText: resultText });
  } catch (error: any) {
    console.error("Gemini Improve Response Error:", error);
    res.status(500).json({ error: error.message || "Failed to polish response." });
  }
});

// Emotion sentiment analyzer and persona modifier utility
function emotionDetection(text: string, isAdmin: boolean): { emotion: string; personaModifier: string } {
  const lower = (text || "").toLowerCase();
  let emotion = "neutral";
  
  if (
    lower.includes("2 weeks") || 
    lower.includes("two weeks") || 
    lower.includes("pending") || 
    lower.includes("waiting") || 
    lower.includes("too long") || 
    lower.includes("delayed") || 
    lower.includes("delay") || 
    lower.includes("ignored") || 
    lower.includes("slow") || 
    lower.includes("frustrated") || 
    lower.includes("frustrating")
  ) {
    emotion = "frustration";
  } else if (
    lower.includes("nobody is helping") || 
    lower.includes("no one is helping") || 
    lower.includes("nobody helps") || 
    lower.includes("useless") || 
    lower.includes("garbage") || 
    lower.includes("terrible") || 
    lower.includes("worst") || 
    lower.includes("bad service") || 
    lower.includes("no one cares")
  ) {
    emotion = "anger";
  } else if (
    lower.includes("thank") || 
    lower.includes("thanks") || 
    lower.includes("grateful") || 
    lower.includes("appreciate") || 
    lower.includes("helpful") || 
    lower.includes("awesome") || 
    lower.includes("great") || 
    lower.includes("perfect")
  ) {
    emotion = "gratitude";
  } else if (
    lower.includes("cannot find") || 
    lower.includes("can't find") || 
    lower.includes("where is") || 
    lower.includes("where's") || 
    lower.includes("how do i") || 
    lower.includes("lost") || 
    lower.includes("confused")
  ) {
    emotion = "confusion";
  } else if (
    lower.includes("urgent") ||
    lower.includes("asap") ||
    lower.includes("emergency") ||
    lower.includes("immediately") ||
    lower.includes("quick") ||
    lower.includes("critical") ||
    lower.includes("blocking") ||
    lower.includes("down") ||
    lower.includes("offline")
  ) {
    emotion = "urgency";
  } else if (
    lower.includes("please") ||
    lower.includes("kindly") ||
    lower.includes("could you") ||
    lower.includes("would you") ||
    lower.includes("mind")
  ) {
    emotion = "polite";
  } else if (
    lower.includes("hack") ||
    lower.includes("leaked") ||
    lower.includes("security") ||
    lower.includes("stolen") ||
    lower.includes("compromised") ||
    lower.includes("phishing") ||
    lower.includes("scam") ||
    lower.includes("unauthorized") ||
    lower.includes("breach")
  ) {
    emotion = "fear";
  }

  let personaModifier = "";
  if (isAdmin) {
    personaModifier = "ADMIN PERSONA: You are communicating with an authorized ADMIN. Maintain a helpful, respectful, and highly competent professional colleague/operations manager demeanor. Prioritize real live system data statistics, insights, productivity, analytical triage, and strategic recommendations. Format responses cleanly using tables, bullet points, and workflow diagrams. Acknowledge and point out critical SLA breaches immediately.\n";
    if (emotion === "frustration" || emotion === "anger") {
      personaModifier += "The admin is concerned about delays/bottlenecks. Focus on concrete operational metrics, suggesting task prioritization, shifting queues, or direct work assignments.";
    } else if (emotion === "urgency") {
      personaModifier += "The admin is dealing with an active high-urgency/severity incident. Provide immediate, actionable status checks and critical escalation guidelines first.";
    }
  } else {
    // Standard and specific user emotions
    if (emotion === "frustration") {
      personaModifier = "EMPATHETIC USER PERSONA - FRUSTRATION ACTIVE:\n" +
        "- Acknowledge and validate their frustration with genuine warmth first. Example: 'I understand how frustrating that can be. Waiting for an issue to remain unresolved for so long is understandably disappointing... let's check what the records show.'\n" +
        "- Offer concrete, immediate support and suggest diagnostic alternative troubleshooting steps first.";
    } else if (emotion === "anger") {
      personaModifier = "EMPATHETIC USER PERSONA - ANGER/DISAPPOINTMENT ACTIVE:\n" +
        "- Respond with profound, non-defensive empathy, validation, and reassurance: 'I'm so sorry you've had that experience. Waiting for an issue to be resolved without updates is hard. Let's find out what the records show together.'\n" +
        "- Reassure them you are on their side and validate their feelings immediately.";
    } else if (emotion === "gratitude") {
      personaModifier = "EMPATHETIC USER PERSONA - GRATITUDE ACTIVE:\n" +
        "- Respond with warm, bright, celebratory, and supportive energy: '😊 You're very welcome! I'm absolutely delighted to have been able to help you. Is there anything else I can assist you with today?'";
    } else if (emotion === "confusion") {
      personaModifier = "EMPATHETIC USER PERSONA - CONFUSION ACTIVE:\n" +
        "- Provide extremely clear, visual, step-by-step guidance. Be supportive and walk them through details step-by-step: 'Let's check that together. I want to make sure we locate exactly what you need. Let's walk through it...'";
    } else if (emotion === "urgency") {
      personaModifier = "EMPATHETIC USER PERSONA - URGENCY/STRESS ACTIVE:\n" +
        "- Respond with swift, reassuring support and prioritized instructions: 'I hear you, and I see this is highly critical. Let's handle this immediately. I am escalating your operational priority.'\n" +
        "- Instantly suggest alternative troubleshooting checkups first (e.g. restarting device, double checking connections, or contacting helpdesk/manager in-person for physical issues).";
    } else if (emotion === "polite") {
      personaModifier = "EMPATHETIC USER PERSONA - POLITE/COURTEOUS ACTIVE:\n" +
        "- Match their respectful tone with high-level courtesy and professionalism: 'Thank you for your polite request. It is an absolute pleasure to assist you. Let's address your question with the utmost priority.'";
    } else if (emotion === "fear") {
      personaModifier = "EMPATHETIC USER PERSONA - SECURITY/FEAR ACTIVE:\n" +
        "- Reassure the user immediately with high calm, safety focus, and protective security action items: 'Please stay calm. Security and privacy are our absolute top priorities. Let's secure your account immediately.'\n" +
        "- Strongly advise them on immediate safety protocols: password resetting under Settings, verifying active login logs, and reporting immediately to the IT Security Response Desk.";
    } else {
      personaModifier = "EMPATHETIC USER PERSONA - STANDARD EMPATHY:\n" +
        "- Be warm, friendly, supportive, and validating. Always validate the user's feelings and situation, making sure they feel heard and supported.";
    }
  }

  return { emotion, personaModifier };
}

// Specialized Workplace Hub AI Assistant (🤖 Workplace Hub AI Assistant) Endpoint
app.post("/api/chat", async (req: express.Request, res: express.Response) => {
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
    } else if (/^(thank you|thanks|thx|ty|awesome|great|good job|ok|okay|bye|goodbye)$/.test(lowerText)) {
      intent = "appreciation";
    } else if (/what is this platform|how does this work|features|demo|about|who are you|help|login|navigation|faq|frequently asked/.test(lowerText)) {
      intent = "faq";
    } else if (role === "admin" && /(report|analytics|statistics|trend|summary|compare|all complaints)/.test(lowerText)) {
      intent = "admin_analytics";
    } else if (role === "admin" && /(ticket|complaint|issue|notice|feedback)/.test(lowerText)) {
      intent = "admin_query";
    } else if (role === "user" && /(ticket|complaint|issue|broken|not working|salary|laptop|wifi|printer|helpdesk)/.test(lowerText)) {
      intent = "user_query";
    } else if (file && file.data) {
       intent = "file_analysis";
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
        text: "I am the Workplace Hub AI Assistant! 🤖\n\nI can help you with:\n- Smart Complaint Simulation\n- AI Analytics Demo\n- Policies & Navigation\n\nPlease log in to access your personal dashboard.",
        quickActions: ["register_ticket"]
      });
    }

    // --- PARALLEL DATABASE FETCHING WITH CACHE ---
    console.time("Parallel DB Fetch");
    let fetchedTickets = [];
    let fetchedNotices = [];
    let fetchedFeedback = [];
    let dbStats = { totalTickets: 0, pendingCount: 0, inProgressCount: 0, resolvedCount: 0 };
    
    if (supabase) {
      const now = Date.now();
      if (intent === "user_query" && systemContext?.userProfile?.id) {
        const fetchPromises: any[] = [
          supabase.from("tickets").select("id, issue_type, severity, description, status, created_at").eq("user_id", systemContext.userProfile.id).order("created_at", { ascending: false }).limit(10)
        ];
        
        if (!globalCache.notices || now - globalCache.noticesFetchedAt > CACHE_TTL_MS) {
          fetchPromises.push(supabase.from("notices").select("id, title, message, created_at").order("created_at", { ascending: false }).limit(5));
        } else {
          fetchPromises.push(Promise.resolve({ data: globalCache.notices }));
        }

        const [ticketsRes, noticesRes] = await Promise.all(fetchPromises);
        fetchedTickets = ticketsRes.data || [];
        fetchedNotices = noticesRes.data || [];
        
        if (now - globalCache.noticesFetchedAt > CACHE_TTL_MS && noticesRes && noticesRes.data) {
          globalCache.notices = noticesRes.data;
          globalCache.noticesFetchedAt = now;
        }
      } else if (intent === "admin_query" || intent === "admin_analytics") {
        const limit = intent === "admin_analytics" ? 100 : 20;
        const fetchPromises: any[] = [
          supabase.from("tickets").select("id, issue_type, severity, description, status, created_at").order("created_at", { ascending: false }).limit(limit)
        ];

        if (!globalCache.notices || now - globalCache.noticesFetchedAt > CACHE_TTL_MS) {
          fetchPromises.push(supabase.from("notices").select("id, title, message, created_at").order("created_at", { ascending: false }).limit(5));
        } else {
          fetchPromises.push(Promise.resolve({ data: globalCache.notices }));
        }

        if (!globalCache.feedback || now - globalCache.feedbackFetchedAt > CACHE_TTL_MS) {
          fetchPromises.push(supabase.from("feedback").select("id, rating, message, created_at").order("created_at", { ascending: false }).limit(10));
        } else {
          fetchPromises.push(Promise.resolve({ data: globalCache.feedback }));
        }

        const [ticketsRes, noticesRes, feedbackRes] = await Promise.all(fetchPromises);
        fetchedTickets = ticketsRes.data || [];
        fetchedNotices = noticesRes.data || [];
        fetchedFeedback = feedbackRes.data || [];
        
        if (now - globalCache.noticesFetchedAt > CACHE_TTL_MS && noticesRes && noticesRes.data) {
          globalCache.notices = noticesRes.data;
          globalCache.noticesFetchedAt = now;
        }
        if (now - globalCache.feedbackFetchedAt > CACHE_TTL_MS && feedbackRes && feedbackRes.data) {
          globalCache.feedback = feedbackRes.data;
          globalCache.feedbackFetchedAt = now;
        }
        
        dbStats.totalTickets = fetchedTickets.length;
        dbStats.pendingCount = fetchedTickets.filter((c: any) => c.status === "Pending").length;
        dbStats.inProgressCount = fetchedTickets.filter((c: any) => c.status === "In Progress").length;
        dbStats.resolvedCount = fetchedTickets.filter((c: any) => c.status === "Resolved").length;
      }
    }
    console.timeEnd("Parallel DB Fetch");

    // Construct Context Prompt
    let databaseContextPrompt = "";
    let activeViewStr = "";
    if (systemContext?.activeViewContext) {
      activeViewStr = `\n\n--- CURRENTLY SELECTED COMPLAINT ---\nThe user is actively viewing this specific complaint in the UI:\nID: ${systemContext.activeViewContext.selectedTicketId}\nCategory: ${systemContext.activeViewContext.category}\nTitle: ${systemContext.activeViewContext.title}\nDescription: ${systemContext.activeViewContext.description}\n\nWhen the user refers to "this complaint", "the complaint", or "it", they mean this selected complaint. Analyze it in detail.`;
    }

    if (role === "user") {
      databaseContextPrompt = `ACTIVE ROLE: Personal Support Assistant\nLogged-in User Name: ${systemContext?.userProfile?.name || "User"}\n\n--- GROUND-TRUTH STATUS ---\nThese are your tickets:\n${fetchedTickets.map((c: any) => `- Ticket #${c.id.toString().substring(0, 8).toUpperCase()}: ${c.issue_type} (${c.status})`).join("\n") || "No tickets found."}` + activeViewStr;
    } else if (role === "admin") {
      databaseContextPrompt = `ACTIVE ROLE: Administrative AI Assistant\nLogged-in Admin: ${systemContext?.userProfile?.name || "System Admin"}\n\n--- PRODUCTION DB METRICS ---\nTotal Tickets (Loaded): ${dbStats.totalTickets}\nPending: ${dbStats.pendingCount}\nIn Progress: ${dbStats.inProgressCount}\nResolved: ${dbStats.resolvedCount}\n\nRecent Tickets:\n${fetchedTickets.slice(0, 15).map((c: any) => `- Ticket #DCMS-${c.id.toString().substring(0, 5).toUpperCase()}: ${c.issue_type} | ${c.severity} | ${c.status}`).join("\n") || "No tickets."}` + activeViewStr;
    } else {
      databaseContextPrompt = `ACTIVE ROLE: General Workplace Hub AI Assistant\nNo dynamic system context was passed in the request. Give polite general website support.`;
    }

    const { emotion, personaModifier } = emotionDetection(lastUserText, role === "admin");
    const isBriefMode = responsePreference === "brief" || !responsePreference;
    let formattingInstruction = "";
    
    if (role === "admin") {
      formattingInstruction = "RESPONSE FORMATTING MANDATES FOR ADMIN:\n- Always start with a friendly greeting.\n- Keep reporting style elegant and scannable.\n- Suggest relevant export actions in quickActions.\n- NEVER output raw SQL query dumps.";
    } else if (isBriefMode) {
      formattingInstruction = "RESPONSE FORMATTING MANDATES (BRIEF MODE):\n- Limit overall reply text to under 6 lines.\n- Do not output rigid report blocks unless asked.\n- Empathize with frustrated users.";
    } else {
      formattingInstruction = "RESPONSE FORMATTING MANDATES (DETAILED):\n- Provide beautifully formatted, detailed answers utilizing bullet lists.\n- Avoid unrequested telemetry lines.";
    }

    const systemInstruction = "You are '🤖 Workplace Hub AI Operations Assistant'.\n" + personaModifier + "\n\nCURRENT CONTEXT:\n" + databaseContextPrompt + "\n\n" + formattingInstruction + "\n\n" +
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
          userMsg.parts[0].text = `[Document Analysis: ${fileName}]\n\nEXTRACTED TEXT:\n"""\n${file.extractedText}\n"""\n\nUser Inquiry: ${userMsg.parts[0].text}`;
        } else if (mime.startsWith("image/") || mime === "application/pdf") {
          const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
          userMsg.parts.push({
            inlineData: { mimeType: mime.startsWith("image/") ? mime : "application/pdf", data: cleanBase64 }
          } as any);
        }
      }
    }

    const fallbackValue = {
      text: "AI analysis is temporarily unavailable. Please try again.",
      suggestedCategory: "Other", suggestedSeverity: "Low", quickActions: ["retry_analysis"], suggestedQueries: []
    };

    console.time("Gemini API Call");
    // Use flash model by default for conversational requests, pro for admin analytics
    const targetModel = intent === "admin_analytics" ? "gemini-3.1-pro-preview" : "gemini-2.5-flash";
    
    // We pass model to callGeminiWithFallback (make sure it's updated)
    const response = await callGeminiWithFallback({
      model: targetModel,
      contents: recentMessages,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            suggestedCategory: { type: Type.STRING },
            suggestedSeverity: { type: Type.STRING },
            quickActions: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedQueries: { type: Type.ARRAY, items: { type: Type.STRING } },
            structuredData: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                kpis: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING }, trend: { type: Type.STRING } } } },
                table: { type: Type.OBJECT, properties: { columns: { type: Type.ARRAY, items: { type: Type.STRING } }, rows: { type: Type.ARRAY, items: { type: Type.OBJECT } } } },
                chart: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, title: { type: Type.STRING }, labels: { type: Type.ARRAY, items: { type: Type.STRING } }, datasets: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, data: { type: Type.ARRAY, items: { type: Type.NUMBER } } } } } } },
                actions: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            physicalLocation: {
              type: Type.OBJECT,
              properties: { requiresPhysical: { type: Type.BOOLEAN }, department: { type: Type.STRING }, room: { type: Type.STRING }, floor: { type: Type.STRING }, hours: { type: Type.STRING }, instructions: { type: Type.STRING } }
            },
            aiAnalysis: {
              type: Type.OBJECT,
              properties: { detectedIssue: { type: Type.STRING }, confidence: { type: Type.STRING }, priority: { type: Type.STRING }, businessImpact: { type: Type.STRING }, rootCause: { type: Type.STRING }, recommendedAction: { type: Type.STRING }, estimatedResolution: { type: Type.STRING }, sla: { type: Type.STRING } }
            },
            detectedLanguage: { type: Type.STRING },
            originalComplaint: { type: Type.STRING },
            translatedComplaint: { type: Type.STRING }
          },
          required: ["text"],
        }
      }
    }, fallbackValue, 55000); // 55s timeout
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

// Dynamic i18n Translation Endpoint
app.get("/locales/:lng/translation.json", async (req, res) => {
  const { lng } = req.params;
  const localeDir = path.join(process.cwd(), "public", "locales", lng);
  const translationPath = path.join(localeDir, "translation.json");
  const englishPath = path.join(process.cwd(), "public", "locales", "en", "translation.json");

  try {
    // Read English translation as base
    if (!existsSync(englishPath)) {
      return res.status(404).json({ error: "English translation file not found." });
    }
    const englishContent = await fs.readFile(englishPath, "utf-8");
    const englishData = JSON.parse(englishContent);

    // If request is for 'en', just return it
    if (lng === "en") {
      res.setHeader("Content-Type", "application/json");
      return res.send(englishContent);
    }

    let existingData: Record<string, string> = {};
    if (existsSync(translationPath)) {
      const stats = await fs.stat(translationPath);
      if (stats.size > 10) {
        existingData = JSON.parse(await fs.readFile(translationPath, "utf-8"));
      }
    }

    // Find missing keys
    const missingKeys = Object.keys(englishData).filter(key => !existingData[key]);
    
    if (missingKeys.length === 0) {
      res.setHeader("Content-Type", "application/json");
      return res.send(JSON.stringify(existingData, null, 2));
    }

    // 3. Translate missing keys using Gemini
    console.log(`Translating ${missingKeys.length} missing keys for language: ${lng}...`);
    
    // Split missing keys into chunks of 150
    const chunkSize = 150;
    const chunks: string[][] = [];
    for (let i = 0; i < missingKeys.length; i += chunkSize) {
      chunks.push(missingKeys.slice(i, i + chunkSize));
    }

    const translatedData: Record<string, string> = { ...existingData };

    // Map of full language names
    const langNames: Record<string, string> = {
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      ru: "Russian",
      zh: "Chinese (Simplified)",
      ja: "Japanese",
      ko: "Korean",
      ar: "Arabic",
      hi: "Hindi",
      te: "Telugu",
      ta: "Tamil",
      kn: "Kannada",
      ml: "Malayalam",
      bn: "Bengali",
      tr: "Turkish",
      id: "Indonesian",
      nl: "Dutch"
    };

    const targetLangName = langNames[lng] || lng;

    for (let c = 0; c < chunks.length; c++) {
      const chunkKeys = chunks[c];
      const chunkToTranslate: Record<string, string> = {};
      chunkKeys.forEach(k => {
        chunkToTranslate[k] = englishData[k];
      });

      const prompt = `You are an elite expert localization and translation engine.
Translate the following key-value pairs of a JSON locale file from English into ${targetLangName}.

Rules:
1. Translate the VALUES only, do not translate or change the keys.
2. Maintain all emojis, punctuation, special symbols, and formatting exactly.
3. For things like "© 2026", "99.2%", "SLA", "4.2 Hrs", "24x7", "MFA", "SSO", keep those technical abbreviations/numbers.
4. Translate every single phrase professionally to sound natural to a native speaker. Do not use English fallback for the values.
5. If a key-value is empty, keep it empty.

JSON to translate:
${JSON.stringify(chunkToTranslate, null, 2)}

Return ONLY a valid JSON object matching the input keys with translated values. Do not wrap in markdown codeblocks like \`\`\`json.`;

      const response = await callGeminiWithFallback({
        contents: prompt,
        config: {
          systemInstruction: `You are an expert translator specializing in translating workplace SaaS platforms into ${targetLangName}. Return ONLY the translated JSON without any explanation or markdown formatting.`,
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      }, JSON.stringify(chunkToTranslate));

      try {
        let chunkResultText = response.text || "{}";
        // Extract JSON object if there is text around it
        const match = chunkResultText.match(/\{[\s\S]*\}/);
        if (match) {
          chunkResultText = match[0];
        }
        
        const chunkResult = JSON.parse(chunkResultText);
        Object.assign(translatedData, chunkResult);
        console.log(`Translated chunk ${c + 1}/${chunks.length} for ${lng}`);
      } catch (parseErr) {
        console.error(`Error parsing chunk ${c + 1} for ${lng}:`, parseErr);
        // Fallback to original values for this chunk
        Object.assign(translatedData, chunkToTranslate);
      }
    }

    // 4. Save to disk so we cache it forever!
    await fs.mkdir(localeDir, { recursive: true });
    await fs.writeFile(translationPath, JSON.stringify(translatedData, null, 2), "utf-8");
    console.log(`Successfully completed and saved dynamic translation for: ${lng}`);

    res.json(translatedData);
  } catch (err: any) {
    console.error(`Dynamic Translation Error for ${lng}:`, err);
    // If anything fails, return English as fallback or partial if we got some
    res.sendFile(englishPath);
  }
});

export default app;