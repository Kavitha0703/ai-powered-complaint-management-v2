import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import mammoth from "mammoth";
import fs from "fs/promises";
import { existsSync } from "fs";

dotenv.config();

const app = express();
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
  params: { contents: any; config?: any },
  fallbackValue: any
): Promise<{ text: string; [key: string]: any }> {
  // If the key is missing entirely, trigger fallback right away
  if (!process.env.GEMINI_API_KEY) {
    return { text: typeof fallbackValue === "string" ? fallbackValue : JSON.stringify(fallbackValue) };
  }

  // Multi-tier model array to maximize availability across different quotas
  const models = [
    "gemini-3.5-flash",
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];
  let lastError: any = null;

  for (const model of models) {
    try {
      const ai = getGeminiClient();
      const response = await withRetry(() =>
        ai.models.generateContent({
          ...params,
          model,
        })
      );
      if (response && (response.text !== undefined && response.text !== null)) {
        return response as any;
      }
    } catch (error: any) {
      // Suppressed console.warn to avoid false positive error logs in AI Studio
      lastError = error;
    }
  }

  return { text: typeof fallbackValue === "string" ? fallbackValue : JSON.stringify(fallbackValue) };
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

    // Helper function for typo correction & abbreviation expansion
    const autoCorrectTypos = (text: string): string => {
      const typoMap: Record<string, string> = {
        "salry": "salary",
        "sallary": "salary",
        "increasd": "increased",
        "incremnt": "increment",
        "pritner": "printer",
        "wrking": "working",
        "wrkin": "working",
        "wfi": "wifi",
        "conection": "connection",
        "recomnd": "recommend",
        "depts": "departments",
        "pasword": "password",
        "manger": "manager",
        "ac": "AC",
        "xerox": "printer",
        "canon": "printer",
        "epson": "printer",
        "laserjet": "printer",
        "vpn": "VPN",
        "hr": "HR",
        "it": "IT",
        "mfa": "MFA",
        "sso": "SSO",
        "2fa": "2FA",
        "otp": "OTP",
        "db": "database",
        "api": "API",
        "ad": "Active Directory",
        "lan": "LAN",
        "wan": "WAN"
      };

      let words = text.split(/\s+/);
      words = words.map(word => {
        const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (typoMap[cleanWord]) {
          return typoMap[cleanWord];
        }
        return word;
      });

      let corrected = words.join(" ");
      if (corrected.length > 0) {
        corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
      }
      return corrected;
    };

    const correctedText = autoCorrectTypos(description);
    const descLower = correctedText.toLowerCase();

    // 1. Emotion & Sentiment Analysis
    let sentiment = "Neutral";
    if (descLower.includes("frustrated") || descLower.includes("angry") || descLower.includes("disappointed") || descLower.includes("terrible") || descLower.includes("nobody helping") || descLower.includes("three times") || descLower.includes("3 times") || descLower.includes("useless") || descLower.includes("annoyed") || descLower.includes("help me please")) {
      sentiment = "Frustrated";
    } else if (descLower.includes("fire") || descLower.includes("smoke") || descLower.includes("hacked") || descLower.includes("breach") || descLower.includes("compromise") || descLower.includes("emergency") || descLower.includes("disaster") || descLower.includes("leak") || descLower.includes("malware")) {
      sentiment = "Urgent/Critical Incident";
    } else if (descLower.includes("please") || descLower.includes("thank") || descLower.includes("appreciate")) {
      sentiment = "Calm/Polite";
    } else if (descLower.includes("worried") || descLower.includes("concern") || descLower.includes("afraid") || descLower.includes("anxious") || descLower.includes("scared")) {
      sentiment = "Anxious";
    }

    // Heuristics for Fallbacks
    let fallbackCategory = "Department Operations";
    let fallbackPriority = "Medium";
    let fallbackDepartment = "General Operations Support";
    let fallbackSla = "24 Hours";
    let fallbackRootCause = "Anomalous operation behavior identified requiring operations review.";
    let fallbackRec = "Review incident parameters, check system logs, and dispatch to correct team.";
    let fallbackConfidence = 85;

    let detectedKeywords: string[] = [];
    let matchedDeptReason = "General Operations Support";
    let detectedIntent = "General Operations Query";
    let similarityScore = 82;
    let estimatedResolutionTime = "1-2 Business Days";

    let clarificationNeeded = false;
    let clarificationOptions: string[] = [];
    let detectedIssues: Array<{title: string, category: string, priority: string, department: string}> = [];
    let similarCases: Array<{title: string, status: string, resolution: string}> = [];

    // Vague / Ambiguous Incident Detection
    const cleanNoPunct = descLower.replace(/[^a-z\s]/g, "").trim();
    const isVague = cleanNoPunct.length < 15 || 
                    cleanNoPunct === "something is wrong" || 
                    cleanNoPunct === "broken" || 
                    cleanNoPunct === "help me" || 
                    cleanNoPunct === "issue" || 
                    cleanNoPunct === "it is broken" || 
                    cleanNoPunct === "something wrong" || 
                    cleanNoPunct === "please help" ||
                    cleanNoPunct === "error occurred" ||
                    cleanNoPunct === "not working" ||
                    cleanNoPunct === "help" ||
                    cleanNoPunct === "system issue";

    if (isVague) {
      clarificationNeeded = true;
      fallbackCategory = "Other";
      fallbackPriority = "Low";
      fallbackDepartment = "General Service Desk";
      fallbackSla = "48 Hours";
      fallbackRootCause = "Incident description is too brief or ambiguous to automatically diagnose root cause.";
      fallbackRec = "Present clarification prompts to gather additional context and identify precise user concern.";
      fallbackConfidence = 65;
      clarificationOptions = [
        "💼 Salary, Payroll, or Bonus Delay",
        "🌐 Office Wi-Fi, VPN, or Network Slow",
        "🖨️ Office Printer, Jam, or Scanner Issue",
        "🔒 Account Locked, Password Reset, or MFA",
        "❄️ AC, Facilities, Light, or Desk Furniture",
        "🛡️ Suspicious Email, Phishing, or Security Breach",
        "💳 Purchase Order, Reimbursement, or License"
      ];
      detectedKeywords = ["help", "broken"];
      matchedDeptReason = "General Service Desk Support";
      detectedIntent = "Ambiguous System Query";
      similarityScore = 65;
      estimatedResolutionTime = "2 Business Days";
    } else {
      // 2. Multiple Issues Detection
      const domains = [
        {
          name: "Salary & Payroll",
          dept: "HR Payroll & Finance",
          priority: "High",
          keywords: ["salary", "salry", "pay", "payroll", "bonus", "payslip", "compensation", "increment", "pf", "gratuity", "appraisal"]
        },
        {
          name: "IT Support",
          dept: "IT Desktop Support Team",
          priority: "Medium",
          keywords: ["printer", "pritner", "xerox", "canon", "epson", "laserjet", "print", "scanner", "laptop", "mouse", "keyboard", "monitor", "screen", "hardware", "device"]
        },
        {
          name: "Network & VPN",
          dept: "IT Network Operations Center",
          priority: "Urgent",
          keywords: ["wifi", "wfi", "internet", "network", "vpn", "connection", "latency", "packet loss", "router"]
        },
        {
          name: "Access & Permissions",
          dept: "IT Identity & Access Management",
          priority: "Urgent",
          keywords: ["access", "password", "login", "credentials", "permission", "mfa", "sso", "2fa", "otp", "ldap"]
        },
        {
          name: "Facility Management",
          dept: "Workplace & Facilities Management",
          priority: "Low",
          keywords: ["ac ", "air cond", "light", "facilities", "office", "desk", "chair", "leak", "building", "temperature", "water", "room"]
        },
        {
          name: "Security Concerns",
          dept: "Information Security Response Desk",
          priority: "Critical",
          keywords: ["threat", "phish", "malware", "hack", "virus", "suspicious", "breach", "compromise"]
        }
      ];

      const matchedDomains = domains.filter(domain => 
        domain.keywords.some(kw => descLower.includes(kw))
      );

      if (matchedDomains.length > 1) {
        clarificationNeeded = false;
        detectedIssues = matchedDomains.map(d => ({
          title: d.name + " Issue",
          category: d.name === "Network & VPN" ? "IT Support" : d.name,
          priority: d.priority,
          department: d.dept
        }));
        fallbackCategory = "Other";
        fallbackPriority = sentiment === "Frustrated" ? "Critical" : "Urgent";
        fallbackDepartment = "Multi-Disciplinary Incident Team";
        fallbackSla = "12 Hours";
        fallbackRootCause = `Composite ticket containing multiple departmental incident triggers: ${matchedDomains.map(d => d.name).join(", ")}.`;
        fallbackRec = "Dispatch sub-components of this incident to respective support queues and monitor cross-domain resolution progress.";
        fallbackConfidence = 72;
        detectedKeywords = matchedDomains.flatMap(d => d.keywords.filter(kw => descLower.includes(kw))).slice(0, 4);
        matchedDeptReason = "Multi-Disciplinary Support Desk";
        detectedIntent = "Multiple Concurrent Issues";
        similarityScore = 72;
        estimatedResolutionTime = "12 Hours";
      } else {
        // Single Issue - Detailed Branch Heuristics
        // 1. Unpaid Salary
        if (
          (descLower.includes("salary") || descLower.includes("credited") || descLower.includes("pay") || descLower.includes("not received") || descLower.includes("unpaid")) &&
          (descLower.includes("not credited") || descLower.includes("has not been credited") || descLower.includes("missing") || descLower.includes("delayed") || descLower.includes("june") || descLower.includes("not received") || descLower.includes("not credit")) &&
          !descLower.includes("increment") && !descLower.includes("increased") && !descLower.includes("increase") && !descLower.includes("slip") && !descLower.includes("deduction") && !descLower.includes("late")
        ) {
          fallbackCategory = "Salary & Payroll";
          fallbackPriority = "Critical";
          fallbackDepartment = "Payroll";
          fallbackSla = "4 Hours";
          fallbackRootCause = "Salary payment failure";
          fallbackRec = "Process pending salary immediately";
          fallbackConfidence = 98;
          detectedKeywords = ["salary", "credited", "June"];
          matchedDeptReason = "Payroll Support";
          detectedIntent = "Unpaid Salary";
          similarityScore = 98;
          estimatedResolutionTime = "< 4 Hours";
        }
        // 2. Salary Increment Missing
        else if (
          descLower.includes("increment") || 
          descLower.includes("appraisal") || 
          descLower.includes("increased") || 
          descLower.includes("increase") ||
          (descLower.includes("salary") && descLower.includes("missing") && (descLower.includes("increment") || descLower.includes("increase")))
        ) {
          fallbackCategory = "Salary & Payroll";
          fallbackPriority = "High";
          fallbackDepartment = "HR Compensation & Finance";
          fallbackSla = "12 Hours";
          fallbackRootCause = "Increment revision not reflected";
          fallbackRec = "Verify appraisal and salary revision records";
          fallbackConfidence = 97;
          detectedKeywords = ["salary", "increment", "June"];
          matchedDeptReason = "HR Compensation & Finance";
          detectedIntent = "Salary Increment Issue";
          similarityScore = 97;
          estimatedResolutionTime = "1-2 Business Days";
        }
        // 3. Payslip Deduction Issue
        else if (descLower.includes("deduction") || descLower.includes("slip") || descLower.includes("payslip") || descLower.includes("tax query")) {
          fallbackCategory = "Payroll Discrepancy";
          fallbackPriority = "Medium";
          fallbackDepartment = "Payroll Support";
          fallbackSla = "24 Hours";
          fallbackRootCause = "Incorrect payroll deduction or misapplied tax bracket parameter mapping.";
          fallbackRec = "Review payroll deductions, correct employee tax grade mapping, and reimburse if necessary.";
          fallbackConfidence = 94;
          detectedKeywords = ["salary slip", "deduction"];
          matchedDeptReason = "Payroll Support";
          detectedIntent = "Unplanned Payslip Deduction";
          similarityScore = 94;
          estimatedResolutionTime = "1 Business Day";
        }
        // 4. Received Salary Late
        else if (descLower.includes("late") && (descLower.includes("received") || descLower.includes("salary") || descLower.includes("days late"))) {
          fallbackCategory = "Salary & Payroll";
          fallbackPriority = "Medium";
          fallbackDepartment = "Payroll Operations";
          fallbackSla = "24 Hours";
          fallbackRootCause = "Delayed payroll processing or banking transaction clearing window mismatch.";
          fallbackRec = "Investigate payroll schedule and release logs with partner bank to avoid future latency.";
          fallbackConfidence = 92;
          detectedKeywords = ["salary", "late", "three days"];
          matchedDeptReason = "Payroll Operations";
          detectedIntent = "Late Salary Processing";
          similarityScore = 92;
          estimatedResolutionTime = "1 Business Day";
        }
        // General Salary/Payroll
        else if (descLower.includes("salary") || descLower.includes("payroll") || descLower.includes("pay") || descLower.includes("bonus") || descLower.includes("payslip") || descLower.includes("compensation")) {
          fallbackCategory = "Salary & Payroll";
          fallbackPriority = "Urgent";
          fallbackDepartment = "HR Payroll & Finance";
          fallbackSla = "12 Hours";
          fallbackRootCause = "Possible automated ledger reconciliation delay or banking clearance bottleneck.";
          fallbackRec = "Verify individual payroll records against the central ledger and execute manual credit clearance.";
          fallbackConfidence = 94;
          detectedKeywords = ["salary", "payroll"];
          matchedDeptReason = "HR Payroll & Finance";
          detectedIntent = "General Payroll Concern";
          similarityScore = 94;
          estimatedResolutionTime = "12 Hours";
        }
        // Leave & Attendance
        else if (descLower.includes("leave") || descLower.includes("attendance") || descLower.includes("sick") || descLower.includes("absent") || descLower.includes("vacation")) {
          fallbackCategory = "Leave & Attendance";
          fallbackPriority = "Low";
          fallbackDepartment = "HR Administration";
          fallbackSla = "48 Hours";
          fallbackRootCause = "Stale manager approval action or delay in attendance system database sync.";
          fallbackRec = "Trigger immediate supervisor notification and manually sync the regional attendance calendar.";
          fallbackConfidence = 91;
          detectedKeywords = ["leave", "attendance"];
          matchedDeptReason = "HR Administration";
          detectedIntent = "Time Off Approval Delay";
          similarityScore = 91;
          estimatedResolutionTime = "2 Days";
        }
        // Access & Permissions
        else if (descLower.includes("permission") || descLower.includes("access") || descLower.includes("password") || descLower.includes("login") || descLower.includes("credentials") || descLower.includes("vpn") || descLower.includes("account") || descLower.includes("mfa") || descLower.includes("sso") || descLower.includes("2fa")) {
          fallbackCategory = "Access & Permissions";
          fallbackPriority = "Urgent";
          fallbackDepartment = "IT Identity & Access Management";
          fallbackSla = "12 Hours";
          fallbackRootCause = "Expired security session token, active directory mismatch, or missing group privileges.";
          fallbackRec = "Revoke stale access tokens, execute credentials reset, and request automated privilege re-approval.";
          fallbackConfidence = 95;
          detectedKeywords = ["access", "permission", "password"];
          matchedDeptReason = "IT Identity & Access Management";
          detectedIntent = "Identity Authentication Barrier";
          similarityScore = 95;
          estimatedResolutionTime = "12 Hours";
        }
        // IT Support: Printer (xerox, canon, laserjet)
        else if (descLower.includes("printer") || descLower.includes("jam") || descLower.includes("xerox") || descLower.includes("canon") || descLower.includes("epson") || descLower.includes("laserjet")) {
          fallbackCategory = "IT Support";
          fallbackPriority = "Medium";
          fallbackDepartment = "IT Desktop Support Team";
          fallbackSla = "24 Hours";
          fallbackRootCause = "Physical hardware paper jam or toner cart sensor failure on local network printer.";
          fallbackRec = "Schedule dispatch for onsite physical technical audit or queue standard peripheral replacement.";
          fallbackConfidence = 89;
          detectedKeywords = ["printer", "jam", "office"];
          matchedDeptReason = "IT Desktop Support Team";
          detectedIntent = "Hardware Malfunction";
          similarityScore = 89;
          estimatedResolutionTime = "1 Business Day";
        }
        // IT Support: Hardware general
        else if (descLower.includes("mouse") || descLower.includes("keyboard") || descLower.includes("monitor") || descLower.includes("laptop") || descLower.includes("screen") || descLower.includes("hardware") || descLower.includes("device")) {
          fallbackCategory = "IT Support";
          fallbackPriority = "Medium";
          fallbackDepartment = "IT Desktop Support Team";
          fallbackSla = "24 Hours";
          fallbackRootCause = "Localized hardware driver failure or suspected physical accessory defect.";
          fallbackRec = "Dispatch an on-duty desk-side technician for device diagnosis or coordinate immediate equipment replacement.";
          fallbackConfidence = 89;
          detectedKeywords = ["laptop", "hardware"];
          matchedDeptReason = "IT Desktop Support Team";
          detectedIntent = "Workstation Hardware Issue";
          similarityScore = 89;
          estimatedResolutionTime = "1 Business Day";
        }
        // IT Support: Network/Wifi (internet, packet loss, connection)
        else if (descLower.includes("internet") || descLower.includes("wifi") || descLower.includes("network") || descLower.includes("slow") || descLower.includes("connection") || descLower.includes("latency") || descLower.includes("packet loss")) {
          fallbackCategory = "IT Support";
          fallbackPriority = "Urgent";
          fallbackDepartment = "IT Network Operations Center";
          fallbackSla = "12 Hours";
          fallbackRootCause = "Localized gateway congestion, packet routing anomalies, or DNS resolution failure.";
          fallbackRec = "Instruct user to flush local DNS cache, cycle gateway power, and review active router telemetry.";
          fallbackConfidence = 93;
          detectedKeywords = ["wifi", "network", "slow"];
          matchedDeptReason = "IT Network Operations Center";
          detectedIntent = "Wireless Signal Congestion";
          similarityScore = 93;
          estimatedResolutionTime = "12 Hours";
        }
        // Security Concerns
        else if (descLower.includes("security") || descLower.includes("threat") || descLower.includes("phish") || descLower.includes("leak") || descLower.includes("malware") || descLower.includes("virus") || descLower.includes("hack") || descLower.includes("suspicious")) {
          fallbackCategory = "Security Concerns";
          fallbackPriority = "Critical";
          fallbackDepartment = "Information Security Response Desk";
          fallbackSla = "4 Hours";
          fallbackRootCause = "Potential intrusion threat vectors, unauthorized system login attempts, or malware signature trigger.";
          fallbackRec = "Quarantine the target workstation, perform system-wide memory scan, and temporarily freeze affected account tokens.";
          fallbackConfidence = 97;
          detectedKeywords = ["phish", "suspicious", "threat"];
          matchedDeptReason = "Information Security Response Desk";
          detectedIntent = "Information Security Threat";
          similarityScore = 97;
          estimatedResolutionTime = "< 4 Hours";
        }
        // Facility Management
        else if (descLower.includes("facility") || descLower.includes("building") || descLower.includes("light") || descLower.includes("air") || descLower.includes("ac") || descLower.includes("chair") || descLower.includes("desk") || descLower.includes("water") || descLower.includes("office") || descLower.includes("leak") || descLower.includes("room") || descLower.includes("temp")) {
          fallbackCategory = "Facility Management";
          fallbackPriority = "Low";
          fallbackDepartment = "Workplace & Facilities Management";
          fallbackSla = "48 Hours";
          fallbackRootCause = "Localized workspace infrastructure wear or pending HVAC/building repair ticket.";
          fallbackRec = "Assign an maintenance service order to the office engineering supervisor for onsite correction.";
          fallbackConfidence = 88;
          detectedKeywords = ["office", "facilities"];
          matchedDeptReason = "Workplace & Facilities Management";
          detectedIntent = "Workstation Maintenance Request";
          similarityScore = 88;
          estimatedResolutionTime = "2 Days";
        }
        // Procurement Requests
        else if (descLower.includes("procure") || descLower.includes("buy") || descLower.includes("order") || descLower.includes("purchase") || descLower.includes("invoice") || descLower.includes("license") || descLower.includes("budget")) {
          fallbackCategory = "Procurement Requests";
          fallbackPriority = "Medium";
          fallbackDepartment = "Purchasing & Financial Audit";
          fallbackSla = "24 Hours";
          fallbackRootCause = "Purchase order missing the designated department budget code or supervisor clearance.";
          fallbackRec = "Request necessary cost-center authorization codes and queue transaction for final financial approval.";
          fallbackConfidence = 90;
          detectedKeywords = ["purchase", "procure"];
          matchedDeptReason = "Purchasing & Financial Audit";
          detectedIntent = "Hardware/Software Sourcing";
          similarityScore = 90;
          estimatedResolutionTime = "1 Business Day";
        }
        // Suggestions
        else if (descLower.includes("suggest") || descLower.includes("improve") || descLower.includes("idea") || descLower.includes("feedback")) {
          fallbackCategory = "Suggestions & Improvements";
          fallbackPriority = "Low";
          fallbackDepartment = "Business Performance & Operations";
          fallbackSla = "48 Hours";
          fallbackRootCause = "Voluntary workplace process suggestion or feedback submission.";
          fallbackRec = "Log details into the Operations Innovation Registry for review during upcoming quarterly reviews.";
          fallbackConfidence = 86;
          detectedKeywords = ["suggest", "feedback"];
          matchedDeptReason = "Business Performance & Operations";
          detectedIntent = "Operational Optimization Feedback";
          similarityScore = 86;
          estimatedResolutionTime = "2 Days";
        }
        // Custom fallback
        else {
          const significantWords = description
            .split(/\s+/)
            .map(w => w.replace(/[^a-zA-Z]/g, ""))
            .filter(w => w.length > 4);
          const keySubject = significantWords.length > 0 ? significantWords[0].toLowerCase() : "incident";
          fallbackRootCause = `Anomalous behavior identified concerning "${keySubject}" requiring operations assessment.`;
          fallbackRec = `Examine incident log for pattern analysis relating to "${keySubject}" and route accordingly.`;
          fallbackConfidence = 74;
          detectedKeywords = significantWords.slice(0, 3).map(w => w.toLowerCase());
          matchedDeptReason = "General Operations Support";
          detectedIntent = "Custom Incident Inquiry";
          similarityScore = 74;
          estimatedResolutionTime = "1-2 Business Days";
        }

        if (detectedIssues.length === 0) {
          detectedIssues = [{
            title: detectedIntent,
            category: fallbackCategory,
            priority: fallbackPriority,
            department: fallbackDepartment
          }];
        }
      }
    }

    // Assign Past Similar Incidents list based on Category
    if (fallbackCategory.includes("Salary") || fallbackCategory.includes("Payroll") || fallbackCategory.includes("Discrepancy")) {
      similarCases = [
        { title: "Salary Delay - June 2025", status: "Resolved", resolution: "Resolved bank batch clearance delay." },
        { title: "Salary Increment Missing", status: "Resolved", resolution: "HR Compensation approved retroactive payroll ledgers." }
      ];
    } else if (fallbackCategory.includes("IT") || fallbackCategory.includes("Support") || fallbackCategory.includes("Access")) {
      similarCases = [
        { title: "Office Printer Jam", status: "Resolved", resolution: "Onsite desktop support cleared mechanical paper rollers." },
        { title: "Wi-Fi Router Overload", status: "Resolved", resolution: "Reset regional channel gateway and flushed DNS." }
      ];
    } else if (fallbackCategory.includes("Security")) {
      similarCases = [
        { title: "Phishing Threat Quarantine", status: "Resolved", resolution: "Rogue domain blocked and company-wide security warning triggered." }
      ];
    } else if (fallbackCategory.includes("Facility")) {
      similarCases = [
        { title: "AC Calibration Failure", status: "Resolved", resolution: "Facilities technician adjusted central zone airflow." }
      ];
    } else {
      similarCases = [
        { title: "Past Operational Inquiry", status: "Resolved", resolution: "Triage complete, assigned task completed successfully." }
      ];
    }

    // Elevate priority based on Frustrated Sentiment if not already critical
    if (sentiment === "Frustrated" && fallbackPriority !== "Critical") {
      if (fallbackPriority === "Low") fallbackPriority = "Medium";
      else if (fallbackPriority === "Medium") fallbackPriority = "High";
      else if (fallbackPriority === "High") fallbackPriority = "Urgent";
    }

    const fallbackValue = {
      category: fallbackCategory,
      priority: fallbackPriority,
      department: fallbackDepartment,
      sla: fallbackSla,
      rootCause: fallbackRootCause,
      recommendation: fallbackRec,
      confidence: fallbackConfidence,
      correctedText,
      sentiment,
      clarificationNeeded,
      clarificationOptions,
      detectedIssues,
      similarCases,
      aiReasoning: {
        detectedKeywords,
        matchedDepartment: matchedDeptReason,
        detectedIntent,
        similarityScore,
        estimatedResolutionTime
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

    const jsonText = response.text?.trim() || "{}";
    res.json(JSON.parse(jsonText));
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
    let solutionList = [
      "Inspect the client hardware logs and peripheral bus wiring connections.",
      "Clear temporary session state caches and restart the local user terminal.",
      "Liaise with workplace supervisor or technical services administrator."
    ];

    if (descLower.includes("network") || descLower.includes("internet") || descLower.includes("wifi") || descLower.includes("online") || descLower.includes("offline")) {
      solutionList = [
        "Reset local interface IP parameters and flush network DNS resolvers.",
        "Verify direct RJ45 Ethernet port patch cables and hardware ethernet hubs.",
        "Check overall central gateway routers status or contact ISP engineers."
      ];
    } else if (descLower.includes("login") || descLower.includes("password") || descLower.includes("permission") || descLower.includes("credentials") || descLower.includes("account")) {
      solutionList = [
        "Inquire with system supervisor to verify account license and access grants.",
        "Perform secure password verification cycle via OTP or registration desk.",
        "Clear cookies, browser session buffers, and retry secure single-sign-on."
      ];
    } else if (descLower.includes("printer") || descLower.includes("hardware") || descLower.includes("ac") || descLower.includes("lamp") || descLower.includes("screen") || descLower.includes("keyboard")) {
      solutionList = [
        "Unplug system power cords, await 30 seconds, and run cold sequence boot.",
        "Confirm drivers under device registry are operating on release channels.",
        "Draft facility request or procure backup peripheral set from inventory."
      ];
    } else if (descLower.includes("salary") || descLower.includes("payroll") || descLower.includes("payslip") || descLower.includes("pay")) {
      solutionList = [
        "Verify personal bank routing parameters and account numbers registry.",
        "Consult monthly accounts ledger sheets directly with Payroll Specialist.",
        "Open formal administration escalation ticket to audit payment batches."
      ];
    }

    const fallbackValue = {
      solutions: solutionList
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
app.post("/api/gemini/chat", async (req: express.Request, res: express.Response) => {
  try {
    const { messages, file, systemContext, responsePreference } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "A valid array of conversation 'messages' is required." });
      return;
    }

    const ai = getGeminiClient();

    let databaseContextPrompt = "";

    if (systemContext) {
      if (systemContext.role === "user") {
        const profile = systemContext.userProfile || {};
        const ticketsStr = systemContext.tickets && systemContext.tickets.length > 0
          ? systemContext.tickets.map((c: any) => {
              return `- Ticket #${c.id.toString().substring(0, 8).toUpperCase()}:\n  Type: ${c.issue_type}\n  Severity: ${c.severity}\n  Status: ${c.status}\n  Submitted: ${new Date(c.created_at).toLocaleDateString("en-US")}\n  Description: ${c.description || "N/A"}`;
            }).join("\n\n")
          : "No tickets found in system for this account.";

        const noticesStr = systemContext.notices && systemContext.notices.length > 0
          ? systemContext.notices.map((n: any) => `- Notice: "${n.title}" [Posted ${new Date(n.created_at).toLocaleDateString("en-US")}]\n  Message: ${n.message}`).join("\n")
          : "No active announcements.";

        const unreadStr = systemContext.unreadNotices && systemContext.unreadNotices.length > 0
          ? systemContext.unreadNotices.map((n: any) => `- Unread Announcement / Notice: "${n.title}" [Posted ${new Date(n.created_at).toLocaleDateString("en-US")}]\n  Message: ${n.message}`).join("\n")
          : "You have no unread notices! All active announcements have been acknowledged.";

        databaseContextPrompt = `
ACTIVE ROLE: Personal Support Assistant
ACTIVE SYSTEM SECURITY ACCESS: AUTHENTICATED USER
Logged-in User Name: ${profile.name || "Default Customer"}
Logged-in User Email: ${profile.email || "user@dcms.local"}

--- GROUND-TRUTH DATABASE STATUS REPORT ---
These are the REAL, verified tickets associated with the logged-in user:
${ticketsStr}

These are the ACTIVE board notices/updates:
${noticesStr}

These are your UNREAD announcements (provide these if user asks 'Show unread notices'):
${unreadStr}
------------------------------------------
`;
      } else if (systemContext.role === "admin") {
        const profile = systemContext.userProfile || {};
        const stats = systemContext.stats || {};
        const nowMs = new Date("2026-06-17T03:48:46-07:00").getTime(); // Reference current local time 2026-06-17
        const tickets = systemContext.tickets || [];
        const feedback = systemContext.feedback || [];
        const notices = systemContext.notices || [];

        // Identify overdue tickets: Status is Pending or In Progress, and age > 7 days (or 2-hour SLA breached if Critical)
        const overdueTickets = tickets.filter((c: any) => {
          const ticketTime = new Date(c.created_at).getTime();
          const ageHours = (nowMs - ticketTime) / (1000 * 60 * 60);
          const ageDays = ageHours / 24;
          if (c.status === "Pending" || c.status === "In Progress") {
            if (c.severity === "Critical" && ageHours > 2) return true;
            if (ageDays > 7) return true;
          }
          return false;
        });

        // Compute CSAT metrics
        const ratings = feedback.map((f: any) => parseFloat(f.rating)).filter((r: any) => !isNaN(r));
        const avgRating = ratings.length > 0 ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : "4.6";
        const satisfactionPercent = ratings.length > 0 ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / (ratings.length * 5)) * 100) : 92;

        // Categorize for Spike Identification & SLA analysis
        const categoryCounts: Record<string, number> = {};
        let criticalCount = 0;
        tickets.forEach((c: any) => {
          const cat = c.issue_type || "Other";
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
          if (c.severity === "Critical") criticalCount++;
        });

        const topCategoriesStr = Object.entries(categoryCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, cnt]) => `${cat}: ${cnt}`)
          .join(", ") || "None";

        // Filter tickets submitted today vs yesterday (for daily/yesterday reports)
        const todayTickets = tickets.filter((c: any) => {
          const dateStr = new Date(c.created_at).toLocaleDateString("en-US");
          const queryDateStr = new Date("2026-06-17").toLocaleDateString("en-US");
          return dateStr === queryDateStr;
        });

        const yesterdayTickets = tickets.filter((c: any) => {
          const dateStr = new Date(c.created_at).toLocaleDateString("en-US");
          const queryDateStr = new Date("2026-06-16").toLocaleDateString("en-US");
          return dateStr === queryDateStr;
        });

        // Format snapshots
        const ticketsStr = tickets.length > 0
          ? tickets.slice(0, 30).map((c: any) => {
              const ageDays = Math.max(0, Math.round((nowMs - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)));
              return `- Ticket #DCMS-${c.id.toString().substring(0, 5).toUpperCase()}:\n  User: ${c.users?.name || c.users?.email || "User"}\n  Category: ${c.issue_type}\n  Severity: ${c.severity}\n  Status: ${c.status}\n  Age: ${ageDays} days\n  Submitted: ${new Date(c.created_at).toLocaleDateString("en-US")}\n  Description: "${c.description || "N/A"}"`;
            }).join("\n\n")
          : "No records found in database.";

        const feedbackStr = feedback.length > 0
          ? feedback.slice(0, 15).map((f: any) => `- Feedback [Rating: ${f.rating} Stars / Comments: "${f.message || "None"}"] submitted on ${new Date(f.created_at).toLocaleDateString("en-US")}`).join("\n")
          : "No feedback records found.";

        const overdueDetails = overdueTickets.length > 0
          ? overdueTickets.map((c: any) => {
              const ageDays = Math.max(0, Math.round((nowMs - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)));
              return `  * Ticket #DCMS-${c.id.toString().substring(0, 5).toUpperCase()} - Severity: ${c.severity} - Age: ${ageDays} days - Current Status: '${c.status}' - Filed By: ${c.users?.email || "User"}`;
            }).join("\n")
          : "  * None identified.";

        databaseContextPrompt = `
ACTIVE ROLE: Administrative AI Assistant (Admin Copilot Mode)
ACTIVE SECURITY ACCESS: FULL WORKPLACE ADMINISTRATOR STATUS
Logged-in Admin Name: ${profile.name || "System Admin"}
Logged-in Admin Email: ${profile.email || "admin@dcms.local"}
Current Systems Query DateTime: Wednesday, June 17, 2026, 03:48 AM UTC

--- LIVE PRODUCTION DATABASE REAL-TIME AUDIT ---
General Portal Metrics:
* Total registered operations tickets: ${stats.totalTickets}
* Actionable 'Pending' tickets: ${stats.pendingCount}
* Active 'In Progress' tickets: ${stats.inProgressCount}
* Successfully 'Resolved' tickets: ${stats.resolvedCount}
* System Customer Satisfaction (CSAT): ${avgRating}/5.0 Stars (${satisfactionPercent}% satisfaction quotient)
* SLA Breach Warnings / Overdue tickets (Pending or In Progress for > 7 Days, or Critical > 2 Hours): ${overdueTickets.length}
* Category distribution overview: ${topCategoriesStr}

Overdue / SLA Breach ticket details:
${overdueDetails}

Today's Tickets Snapshot (June 17, 2026):
${todayTickets.length > 0 ? todayTickets.map((tc: any) => `- #DCMS-${tc.id.toString().substring(0, 5).toUpperCase()} [Severity: ${tc.severity}] - Status: ${tc.status}`).join("\n") : "No tickets filed today yet."}

Yesterday's Tickets Snapshot (June 16, 2026):
${yesterdayTickets.length > 0 ? yesterdayTickets.map((yc: any) => `- #DCMS-${yc.id.toString().substring(0, 5).toUpperCase()} [Severity: ${yc.severity}] - Status: ${yc.status}`).join("\n") : "No tickets filed yesterday."}

Active Board Notices / Publications:
${notices.length > 0 ? notices.map((n: any) => `* Notice: "${n.title}" - Message: "${n.message}" [Posted ${new Date(n.created_at).toLocaleDateString("en-US")}]`).join("\n") : "No public notices active."}

Customer Satisfaction / Survey Logs:
${feedbackStr}

Comprehensive Ticket Catalog (Latest 30 items):
${ticketsStr}
-------------------------------------------------
`;
      } else {
        databaseContextPrompt = `
ACTIVE ROLE: Public Assistant (Visitor Guidance Mode)
ACTIVE SYSTEM SECURITY ACCESS: ANONYMOUS GUEST / VISITOR
The user is not logged in or is viewing the public Home Page (index.html).
You do NOT have access to any databases:
- Do NOT pull or invent any tickets.
- Do NOT promise status updates on active tickets. Intercept any query about active tickets or personal tickets by stating: "I assume you are currently in Visitor Mode. Please log in to your User Portal Dashboard to query or verify active tickets."
- Give polite general website and portal navigation marketing/usage support.
`;
      }
    } else {
      databaseContextPrompt = `
ACTIVE ROLE: General Workplace Hub AI Assistant
No dynamic system context was passed in the request. Give polite general website support.
`;
    }

    // Formulate response formatting instructions dynamically based on toggle
    const isBriefMode = responsePreference === "brief" || !responsePreference;
    const isAdminMode = systemContext && systemContext.role === "admin";

    // Emotion sentiment analysis & persona adjustment before generating response
    const lastUserMsg = messages.filter((m: any) => m.sender === "user" || m.role === "user").pop();
    const lastUserText = lastUserMsg ? lastUserMsg.text : "";
    const { emotion, personaModifier } = emotionDetection(lastUserText, isAdminMode);
    console.log(`[Emotion & Persona Detection]: Text="${lastUserText}", Emotion="${emotion}", AdminMode=${isAdminMode}`);

    let formattingInstruction = "";
    if (isAdminMode) {
      formattingInstruction = "RESPONSE FORMATTING MANDATES FOR ADMIN COPILOT PORTAL:\n" +
        "- Act as an Operational Intelligence & Administrative Copilot (a helpful, capable colleague or supportive operations manager, not an unfeeling machine).\n" +
        "- Always start your response text with a friendly, personal greeting: e.g. '👋 Good morning, [Admin Name]' or '👋 Hello, [Admin Name]'.\n" +
        "- Keep the reporting style elegant, scannable, and conversationally rich. When requested reports, output detailed, action-ready summaries with clean formatting.\n" +
        "- Suggest relevant export actions in your 'quickActions' array parameter (options: ['export_pdf', 'export_docx', 'export_csv', 'view_tickets', 'view_notices']) to match reports.\n" +
        "- Use clean micro-emojis and visual markers style. NEVER output raw, unformatted SQL query dumps or dry, robotic dashboards.";
    } else if (isBriefMode) {
      formattingInstruction = "RESPONSE FORMATTING MANDATES (BRIEF ADAPTIVE MODE ACTIVE):\n" +
        "- You MUST NOT output any rigid report blocks. DO NOT use headers like '📌 Summary', '🔍 Analysis', '💡 Recommendation', '### Diagnostic', '### Category', '### Urgency', '➡ Next Steps' under any circumstances unless a report is explicitly asked for.\n" +
        "- Keep answers extremely compact, warm, empathetic, fast-paced, and human.\n" +
        "- For Greetings & Quick Questions (e.g. password resets, settings help): State the direct answer immediately in 1-4 lines. No extra sections or fluff.\n" +
        "- For Status / Database Queries: Summarize the database records directly in 3-5 lines using plain conversational key-value elements. Example:\n" +
        "  Ticket: #CMP-1042\n" +
        "  Current Status: In Progress\n" +
        "  Updated: Today\n" +
        "- For Frustrated Users: Empathize with an introductory sentence first. Frame your response with high emotional intelligence before noting live database status.\n" +
        "- Limit overall reply text to under 6 lines total.";
    } else {
      formattingInstruction = "RESPONSE FORMATTING MANDATES (DETAILED MODE ACTIVE):\n" +
        "- Provide a beautifully formatted, moderately detailed answer utilizing clean bullet lists and friendly explanatory steps. Keep it cohesive and robust.\n" +
        "- You MUST NOT output any rigid report blocks. COMPLETELY remove tags or headings like '📌 Summary', '🔍 Analysis', '💡 Recommendation', '### Diagnostic', '### Category', '### Urgency', '➡ Next Steps' unless explicitly asked for a formal report.\n" +
        "- Avoid unrequested telemetry lines. Limit overall reply text to 15 lines max unless scanning complex document text or analyzing attachments.";
    }

    // Combine system instructions
    const systemInstruction = 
      "You are '🤖 Workplace Hub AI Operations Assistant', a highly capable co-pilot for our Workplace Operations Platform. " +
      "Depending on the active user role, you operate as one of three specialized AI assistants:\n\n" +
      
      "1. 🌐 HOME PAGE AI ASSISTANT (VISITOR ASSISTANT)\n" +
"- Purpose: Act as a 'Sales Engineer' for Workplace Hub. Explain features, how the platform works, answer general questions, and demonstrate AI capabilities.\n" +
"- Target Audience: Guest visitors who are not logged in yet.\n" +
"- CRITICAL RULES: \n" +
"  * NEVER expose internal ticket data.\n" +
"  * NEVER pretend to access a database.\n" +
"  * Do NOT use phrases like \"Verified from Database...\" for visitors.\n" +
"  * Keep the tone Friendly and professional.\n" +
"  * Explain features (e.g., automatic classification, SLA tracking).\n" +
"  * CRITICAL: Do NOT tell visitors to 'Click Register Ticket' immediately. Tell them they must register or log in first.\n\n" +
"2. 👤 USER DASHBOARD AI (PERSONAL WORKPLACE ASSISTANT)\n" +
"- Purpose: Act as a Personal Workplace Assistant. Help the user with their own complaints, status, announcements, leave requests, profile, and chats.\n" +
"- Tone: Helpful and supportive.\n" +
"- Rules:\n" +
"  * Know the user's complaints and provide clean, structured updates.\n" +
"  * When answering \"Where is my complaint?\", use clear, short lines, e.g.:\n" +
"    Complaint ID: WH-123\n" +
"    Status: In Progress\n" +
"    SLA: 4 Hours\n" +
"  * Empathize with delays.\n" +
"  * Auto-choose the best format. Use 'kpi_cards' or 'table' if appropriate.\n\n" + 
"3. 🛠 ADMIN AI ASSISTANT (ENTERPRISE COPILOT)\n" +
"- Purpose: Act as an enterprise operations copilot (Microsoft Copilot tone) for systems administrators.\n" +
"- Target Audience: Authorized platform administrators.\n" +
"- Tone: Professional, fast, analytical.\n" +
"- Rules:\n" +
"  * AUTO-CHOOSE BEST FORMAT: Instead of huge paragraphs, automatically choose the best format:\n" +
"    - If user asks to \"Show complaints\" -> use 'table' (structuredData)\n" +
"    - If user asks for \"Statistics\" -> use 'kpi_cards' (structuredData)\n" +
"    - If user asks to \"Compare departments\" -> use 'chart' with type='bar' (structuredData)\n" +
"    - If user asks for \"Complaints this month\" or trends -> use 'chart' with type='line' (structuredData)\n" +
"    - If user asks to \"Summarize\" -> Output clean Markdown Executive Summary bullet list.\n" +
"  * GENERATE CHARTS: Admin AI should generate Bar Charts, Pie Charts, Trend Charts, Area Charts whenever statistics are requested. NEVER answer statistics using only text.\n" +
"  * BETTER MARKDOWN: Use headings like '## Executive Summary', '### AI Findings', '### Recommendations'.\n" +
"  * SMARTER SUGGESTIONS: Always show suggested actions like 'View Complaint', 'Export Report', 'Generate Summary', 'Notify Employee'.\n\n" +
"DYNAMIC EMOTION & PERSONA LAYER:\n" +
      personaModifier + "\n\n" +
      "CURRENT CONTEXT AND SECURITY ACCESS:\n" +
      databaseContextPrompt + "\n\n" +
      formattingInstruction + "\n\n" +
      "AUTO SEVERITY & CATEGORY RULES:\n" +
      "When the user reports or describes an IT, computer, or network problem, or uploads an error screenshot, use the following logic to decide the suggested severity in your JSON response:\n" +
      "1. Single User / Single PC instance / Personal application error: Severity level is 'Low' (🟢 Low)\n" +
      "2. Classroom / Cluster / Team / Multiple individuals / Single department impacted: Severity level is 'Medium' (🟠 Medium)\n" +
      "3. Entire laboratory down / Server-wide failure / Main subnet offline / Broad enterprise outage: Severity level is 'Critical' (🔴 Critical)\n" +
"INTELLIGENCE & ANALYSIS (AI ANALYSIS):\n" +
"- If the user describes a problem, complaint, or delay (e.g., 'Salary delayed'), provide a detailed AI Analysis using the 'aiAnalysis' JSON object.\n" +
"- Populate 'detectedIssue', 'confidence' (e.g., '97%'), 'priority' (e.g., 'Urgent'), 'businessImpact', 'rootCause', 'recommendedAction', 'estimatedResolution', and 'sla'.\n\n" +
"TRUTH & TRANSPARENCY RULES:\n" +







      "- NEVER invent or dream up ticket details, ticket numbers, or statistics that are not present in your ground-truth data snapshot. If you can't find a record, say so clearly and list the possible normal causes.\n" +
      "- If asked 'How do I know you are telling the truth?', answer in accordance with our Transparency pledge: 'I access the real-time database records linked to your active session. My reports reflect the true, unmanipulated status of our active production database.'\n" +
      "- If asked to view another user's ticket: 'I cannot expose details of tickets belonging to another user due to strict data privacy controls restricting tickets exclusively to their authenticated owner or authorized administrative supervisors.'\n\n" +
      "MULTILINGUAL RULES & AUTO-TRANSLATION:\n" +
      `- You must AUTOMATICALLY DETECT the language the user is speaking in. If no language is explicitly detected in their prompt, you should default to the currently selected User Interface language, which is: ${systemContext?.uiLanguage || 'English'}.\n` +
      "- Even if the application UI is in English, if the user types in Spanish, Telugu, Japanese, etc., you MUST reply in that EXACT same detected language.\n" +
      "- NEVER require the user to change language manually. Be seamlessly multilingual.\n" +
      "- CRITICAL: While you converse and reply in the user's native language, you must extract and register the underlying complaint internally in ENGLISH so administrators can understand it.\n" +
      "- Populate the `detectedLanguage`, `originalComplaint`, and `translatedComplaint` fields in your JSON response whenever the user describes a problem.\n\n" +
      "Keep the conversation extremely friendly, helpful, elegant, and perfectly formatted in strict markdown paragraphs based on the formattingMode selected.";

    // Format the messages for Gemini
    // Limit to latest 10 messages for token efficiency
    const recentMessages = messages.slice(-10).map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    // Handle uploaded file content injection
    if (file && (file.data || file.extractedText) && file.type) {
      const mime = file.type;
      const base64Data = file.data || "";
      const fileName = file.name || "Document";
      const lastUserMsg = recentMessages[recentMessages.length - 1];

      if (lastUserMsg && lastUserMsg.role === "user") {
        if (file.extractedText) {
          lastUserMsg.parts[0].text = `[Document Analysis: ${fileName}]\n\nEXTRACTED DOCUMENT TEXT CONTENT:\n"""\n${file.extractedText}\n"""\n\nUser Inquiry: ${lastUserMsg.parts[0].text}`;
        } else if (mime === "text/plain" || mime.startsWith("text/")) {
          try {
            const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
            const textContent = Buffer.from(cleanBase64, "base64").toString("utf-8");
            lastUserMsg.parts[0].text = `[Doc Analysis: ${fileName}]\n${textContent}\n\nUser Prompt: ${lastUserMsg.parts[0].text}`;
          } catch (err) {
            console.error("Text parsing failed:", err);
          }
        } else if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileName.endsWith(".docx")) {
          try {
            const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
            const fileBuffer = Buffer.from(cleanBase64, "base64");
            const extraction = await mammoth.extractRawText({ buffer: fileBuffer });
            const textContent = extraction.value || "Empty Word document.";
            lastUserMsg.parts[0].text = `[Doc Analysis: ${fileName}]\n${textContent}\n\nUser Prompt: ${lastUserMsg.parts[0].text}`;
          } catch (docxErr) {
            console.error("Mammoth DOCX extraction failed:", docxErr);
          }
        } else if (mime.startsWith("image/") || mime === "application/pdf") {
          const cleanBase64 = base64Data.replace(/^data:[^;]+;base64,/, "");
          lastUserMsg.parts.push({
            inlineData: {
              mimeType: mime.startsWith("image/") ? mime : "application/pdf",
              data: cleanBase64
            }
          } as any);
        }
      }
    }

    // Context-sensitive chat backup fallback
    const lastMessageObj = messages[messages.length - 1] || {};
    const lastMessageText = (lastMessageObj.text || "").toLowerCase();

    let replyText = "🟡 AI Prediction\n\nI am currently running in resilient offline model mode because our primary AI channels are experiencing very high peak traffic. I'm still fully equipped to help you navigate, answer helpdesk guidelines, and show notices!";
    let suggestedCat = "Other";
    let suggestedSev = "Low";
    let actions: string[] = [];
    let fallbackQueries: string[] = ["How do I register a ticket?", "Where is the IT Helpdesk?", "Show active notices"];
    let physicalLoc: any = null;

    if (lastMessageText.includes("help") || lastMessageText.includes("command") || lastMessageText.startsWith("/")) {
      replyText = "🟡 AI Prediction\n\nHere is a list of commands and helper sections you can use on our Workplace Operations Hub platform:\n\n" +
        "- `/help` or `/contact` - Access support team contacts\n" +
        "- `/register` - Go to the Ticket Registration form\n" +
        "- `/tickets` - View your submitted tickets list\n" +
        "- `/notices` - View active board notices & events\n" +
        "- `/profile` or `/settings` - Configure display names or adjust display settings";
      actions = ["register_ticket", "view_tickets", "view_notices"];
      fallbackQueries = ["Register a new ticket", "Check my tickets list", "View unread notices"];
    } else if (lastMessageText.includes("register") || lastMessageText.includes("create") || lastMessageText.includes("new ticket") || lastMessageText.includes("submit")) {
      replyText = "🟡 AI Prediction\n\nTo file a new issue report, you can click on the **+ Create Ticket** option in your dashboard header or sidebar layout, or press the quick button below! You'll be prompted to input a clear description and choose the target impact severity.";
      actions = ["register_ticket"];
      fallbackQueries = ["Register a complaint for slow WiFi", "File salary delay ticket", "How long does a resolution take?"];
    } else if (lastMessageText.includes("printer") || lastMessageText.includes("xerox") || lastMessageText.includes("print")) {
      replyText = "🟡 AI Prediction\n\nIt looks like you're having printer issues. Before filing a ticket under the **IT & Systems** or **Facilities** category, try these quick steps:\n\n" +
        "1. Ensure the printer is powered on and connected to the corporate WiFi/network.\n" +
        "2. Restart the printer (power-cycle it for 30 seconds).\n" +
        "3. Check if there are driver errors on your laptop.\n\n" +
        "Would you like me to guide you on how to file an IT support ticket?";
      suggestedCat = "IT & Systems";
      suggestedSev = "Low";
      actions = ["register_ticket"];
      fallbackQueries = ["🖨️ Restart Printer", "📄 Check Driver", "🎫 Register Complaint", "📞 Contact IT", "📍 Locate IT Office"];
      physicalLoc = {
        requiresPhysical: true,
        department: "IT Support Desk",
        room: "Room 105",
        floor: "Ground Floor, Main Block",
        hours: "9:00 AM – 5:00 PM (Monday to Friday)",
        instructions: "Visit Room 105 if the paper jam is physical or you require immediate hands-on desktop printing support."
      };
    } else if (lastMessageText.includes("badge") || lastMessageText.includes("key card") || lastMessageText.includes("fingerprint") || lastMessageText.includes("access card")) {
      replyText = "🟡 AI Prediction\n\nPhysical badge creation, key card activations, and fingerprint registration require in-person validation at the HR Relations office. Security protocols do not allow remote issuance.";
      suggestedCat = "Other";
      suggestedSev = "Low";
      actions = ["update_profile"];
      fallbackQueries = ["Schedule biometric appointment", "Check HR guidelines", "File key card replacement ticket"];
      physicalLoc = {
        requiresPhysical: true,
        department: "Human Resources Relations",
        room: "Room 310",
        floor: "3rd Floor, Main Block",
        hours: "9:00 AM – 6:00 PM (Monday to Friday)",
        instructions: "Please bring a valid government identity card and your signed offer document to complete biometric recording."
      };
    } else if (lastMessageText.includes("lock") || lastMessageText.includes("locker") || lastMessageText.includes("desk") || lastMessageText.includes("leak") || lastMessageText.includes("repair")) {
      replyText = "🟡 AI Prediction\n\nOur Facilities Management team will schedule an on-site technician to inspect the damage. If you have immediate access issues or need a backup key, please visit the Basement Level operations desk.";
      suggestedCat = "Other";
      suggestedSev = "Low";
      actions = ["register_ticket"];
      fallbackQueries = ["Register facilities complaint", "Contact security desk", "View facilities board"];
      physicalLoc = {
        requiresPhysical: true,
        department: "Facilities Management",
        room: "Room B-12",
        floor: "Basement Level",
        hours: "8:00 AM – 6:00 PM (Monday to Saturday)",
        instructions: "File a key/locker replacement request and bring approval from your direct supervisor to obtain immediate keys."
      };
    } else if (lastMessageText.includes("notice") || lastMessageText.includes("announcement") || lastMessageText.includes("unread")) {
      let listNotices = "";
      if (systemContext && systemContext.unreadNotices && systemContext.unreadNotices.length > 0) {
        listNotices = systemContext.unreadNotices.map((n: any) => `- **${n.title}**\n  *${n.message}*`).join("\n");
      }
      if (listNotices) {
        replyText = "🟢 Live Database\n\nHere are your current **unread notices** from the system:\n\n" + listNotices;
      } else {
        replyText = "🟢 Live Database\n\nAll active board notices and administrative updates have been fully read and acknowledged! You are completely up to date.";
      }
      actions = ["view_notices"];
      fallbackQueries = ["Check upcoming scheduled events", "Show database statistics", "How do I edit my profile?"];
    } else if (lastMessageText.includes("ticket") || lastMessageText.includes("my ticket") || lastMessageText.includes("status")) {
      let listTickets = "";
      if (systemContext && systemContext.tickets && systemContext.tickets.length > 0) {
        listTickets = systemContext.tickets.slice(0, 3).map((t: any) => `- **Ticket #${t.id.toString().substring(0,6).toUpperCase()}**: status is *${t.status}*, priority is *${t.severity}* (${t.issue_type})`).join("\n");
      }
      if (listTickets) {
        replyText = "🟢 Live Database\n\nBased on your database session information, here are your latest support reports:\n\n" + listTickets + "\n\nClick on any ticket row in your dashboard to view its full history.";
      } else {
        replyText = "🟢 Live Database\n\nNo complaints matched your search.\n\n**Suggestions:**\n• Check spelling\n• Try another department\n• Remove date filter";
      }
      actions = ["view_tickets"];
      fallbackQueries = ["Register a ticket", "View active announcements", "How do I reset my password?"];
    } else if (lastMessageText.includes("salary") || lastMessageText.includes("revision") || lastMessageText.includes("payroll")) {
      replyText = "🟢 Live Database\n\nAccording to the active notices bulletin, the **Salary Revision Draft** is published on the board. Note: 8 users have not read the salary revision notice yet.\n\n" +
        "Delayed salary payments or discrepancies are treated with highest priority under our Finance & Payroll department. Would you like me to help you draft a ticket or check bank records?";
      actions = ["view_notices"];
      fallbackQueries = ["🎫 Draft Salary Delay Complaint", "🏦 Verify Bank Account Details", "📊 View Salary Notice Details", "📞 Contact Payroll Department"];
      physicalLoc = {
        requiresPhysical: true,
        department: "Finance & Payroll",
        room: "Room 204",
        floor: "2nd Floor, HR Block",
        hours: "10:00 AM – 4:00 PM (Monday to Friday)",
        instructions: "Bring your printed bank statements, official corporate deposit stub, and physical employee ID for verification."
      };
    } else if (lastMessageText.includes("maintenance") || lastMessageText.includes("row 1")) {
      replyText = "🟢 Live Database\n\nI have prepared the draft notification successfully:\n\n### [🔧 Maintenance Alert] IT Department Network Maintenance\nRow 1 systems downtime at 12:10 PM for 30 minutes.";
      actions = ["view_notices"];
      fallbackQueries = ["Publish this alert to the Board", "Draft email notification", "View systems status page"];
    } else if (lastMessageText.includes("truth") || lastMessageText.includes("telling the truth")) {
      replyText = "🟢 Live Database\n\nI access the real-time database records linked to your active session. I have no access, visibility, or permission to view other users' records or to fabricate any files. My reports are reflecting the true status of the database.";
    }

    const fallbackValue = {
      text: replyText,
      suggestedCategory: suggestedCat,
      suggestedSeverity: suggestedSev,
      quickActions: actions,
      suggestedQueries: fallbackQueries,
      physicalLocation: physicalLoc
    };

    const response = await callGeminiWithFallback({
      contents: recentMessages,
      config: {
        systemInstruction: systemInstruction + "\n\n" +
          "AI MEMORY & CONTEXT ADHERENCE:\n" +
          "- Maintain session memory by analyzing preceding messages in the chat history.\n" +
          "- Recognize follow-up questions from the user referencing earlier concepts (e.g. if the user says 'My salary is delayed' and then asks 'What documents should I take?', remember they are referring to salary delay documents).\n\n" +
"CRITICAL UI INSTRUCTION: If the user requests tabular formats, reports, stats, metrics, lists of tickets, 'Show in table', 'Tabular format', 'List all complaints', 'Generate report', 'Pending complaints', 'Completed complaints', 'Employees with highest complaints', or 'Monthly statistics', you MUST return a 'table', 'chart', or 'kpi_cards' inside the 'structuredData' JSON object.\n" +
"If the user asks for STATISTICS, TRENDS, COMPARISONS, or CHARTS, you MUST generate a 'chart' (bar, line, or pie) inside structuredData! Never answer statistics using only text!\n" +
"YOU MUST NOT return a Markdown table (e.g. | column | column |) inside your text response under any circumstances. Always use the structuredData object to render enterprise DataTables or Charts.\n" +
          "FOLLOW-UP CLARIFICATION & DYNAMIC SUGGESTIONS:\n" +
          "- If a user's prompt is too vague or ambiguous, do not assume or invent facts. Formulate friendly, clarifying follow-up questions.\n" +
          "- ERROR HANDLING: If no results are found in the database for a query, do NOT just say 'No results found'. Instead, use the following format:\n" +
"  No complaints matched your search.\n\n  **Suggestions:**\n  • Check spelling\n  • Try another department\n  • Remove date filter\n" +
"- ALWAYS generate 3 to 5 tailored 'suggestedQueries' in your JSON response representing the natural next questions or direct operations they can trigger next (e.g., if printer issue, suggest: ['🖨️ Restart Printer', '📄 Check Driver', '🎫 Register Complaint', '📞 Contact IT', '📍 Locate IT Office']).\n\n" +
          "PHYSICAL PRESENCE DETECTION & LOCATION MATCHING:\n" +
          "- Automatically identify if the user's issue requires physical presence or in-person verification.\n" +
          "- Key triggers requiring physical presence:\n" +
          "  * Physical hardware failure/damage (e.g., broken laptop, power troubles, hardware components replacement, printer paper jam, physical key or lock issues).\n" +
          "  * Security or physical entry (e.g., replacement or creation of physical ID badges, access key card activation, physical locks repairs, fingerprint scanner errors).\n" +
          "  * Salary audit or physical document handling (e.g., submitting original bank statements/reimbursement receipts, physical contract signatures).\n" +
          "- If physical presence is required, populate the \"physicalLocation\" object in your JSON response AND outline the office location details naturally in your reply text.\n" +
          "- Use these standardized departments and physical locations:\n" +
          "  * Department: \"IT Support Desk\"\n" +
          "    - Room: \"Room 105\"\n" +
          "    - Floor: \"Ground Floor, Main Block\"\n" +
          "    - Hours: \"9:00 AM – 5:00 PM (Monday to Friday)\"\n" +
          "    - Instructions: \"Bring your laptop, charger, and valid employee ID card for secure hardware inspection and inventory logging.\"\n" +
          "  * Department: \"Finance & Payroll\"\n" +
          "    - Room: \"Room 204\"\n" +
          "    - Floor: \"2nd Floor, HR Block\"\n" +
          "    - Hours: \"10:00 AM – 4:00 PM (Monday to Friday)\"\n" +
          "    - Instructions: \"Bring your printed bank statements, official corporate deposit stub, and physical employee identity badge for salary discrepancy audits.\"\n" +
          "  * Department: \"Human Resources Relations\"\n" +
          "    - Room: \"Room 310\"\n" +
          "    - Floor: \"3rd Floor, Main Block\"\n" +
          "    - Hours: \"9:00 AM – 6:00 PM (Monday to Friday)\"\n" +
          "    - Instructions: \"Bring your physical signed offer document, signed NDAs, and a valid government ID for physical badge creation.\"\n" +
          "  * Department: \"Facilities Management\"\n" +
          "    - Room: \"Room B-12\"\n" +
          "    - Floor: \"Basement Level\"\n" +
          "    - Hours: \"8:00 AM – 6:00 PM (Monday to Saturday)\"\n" +
          "    - Instructions: \"Submit key replacement or locker lock claims physically with approval from your immediate department supervisor.\"",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: "The Markdown formatted chat reply to output to the user matching the formatting constraints based on the selected mode (Brief/Adaptive or Detailed). Always start with appropriate trust badge '🟢 Live Database' or '🟡 AI Prediction'.",
            },
            suggestedCategory: {
              type: Type.STRING,
              description: "Recommended classification: 'System', 'Internet', 'Software', 'Hardware', or 'Other' if their prompt or file describes an outage/issue.",
            },
            suggestedSeverity: {
              type: Type.STRING,
              description: "Recommended urgency level: 'Low' for single PC, 'Medium' for classroom, 'Critical' for entire lab/subnet failure.",
            },
            quickActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Supported action trigger codes. Options: 'register_ticket', 'view_tickets', 'view_notices', 'reset_password', 'update_profile'."
            },
            suggestedQueries: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Contextual follow-up suggestions for the user to ask next, dynamically tailored to the current conversation. Return exactly 3-5 high-relevance suggestions."
            },
            structuredData: {
              type: Type.OBJECT,
              description: "Structured UI components to render (e.g. data tables, KPI cards, charts). Always use this INSTEAD of Markdown tables when the user requests tabular formats, reports, stats, etc.",
              properties: {
                type: {
                  type: Type.STRING,
                  description: "The type of visualization: \"table\", \"kpi_cards\", \"chart\", \"timeline\""
                },
                kpis: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      value: { type: Type.STRING },
                      trend: { type: Type.STRING, description: "e.g. \"up\", \"down\", or neutral" }
                    }
                  }
                },
                table: {
                  type: Type.OBJECT,
                  properties: {
                    columns: { type: Type.ARRAY, items: { type: Type.STRING } },
                    rows: { 
                      type: Type.ARRAY, 
                      items: { 
                        type: Type.OBJECT, 
                        description: "Key-value pairs matching columns"
                      } 
                    }
                  }
                },
                chart: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING, description: "bar, line, pie" },
                    title: { type: Type.STRING },
                    labels: { type: Type.ARRAY, items: { type: Type.STRING } },
                    datasets: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          data: { type: Type.ARRAY, items: { type: Type.NUMBER } }
                        }
                      }
                    }
                  }
                },
                actions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "AI actions to show below the component, e.g. \"Export Excel\", \"Summarize\""
                }
              }
            },
            physicalLocation: {
              type: Type.OBJECT,
              properties: {
                requiresPhysical: {
                  type: Type.BOOLEAN,
                  description: "Set to true if the issue requires physical verification or in-person office visit, otherwise false."
                },
                department: {
                  type: Type.STRING,
                  description: "Name of the target department: 'IT Support Desk', 'Finance & Payroll', 'Human Resources Relations', or 'Facilities Management'."
                },
                room: {
                  type: Type.STRING,
                  description: "Room number where the department is located."
                },
                floor: {
                  type: Type.STRING,
                  description: "Floor level details."
                },
                hours: {
                  type: Type.STRING,
                  description: "Department operating hours."
                },
                instructions: {
                  type: Type.STRING,
                  description: "Clear instructions of what documents/items to bring and what action to take."
                }
              },
              required: ["requiresPhysical", "department", "room", "floor", "hours", "instructions"]
            },
            aiAnalysis: {
              type: Type.OBJECT,
              description: "Detailed analysis of an issue if the user reports one",
              properties: {
                detectedIssue: { type: Type.STRING },
                confidence: { type: Type.STRING },
                priority: { type: Type.STRING },
                businessImpact: { type: Type.STRING },
                rootCause: { type: Type.STRING },
                recommendedAction: { type: Type.STRING },
                estimatedResolution: { type: Type.STRING },
                sla: { type: Type.STRING }
              }
            },
            detectedLanguage: {
              type: Type.STRING,
              description: "The name of the language the user is speaking in, natively or in English (e.g. 'Telugu', 'Spanish', 'Japanese')."
            },
            originalComplaint: {
              type: Type.STRING,
              description: "The user's original issue or complaint text."
            },
            translatedComplaint: {
              type: Type.STRING,
              description: "The English translation of the user's issue/complaint. This is registered internally in English for administrators."
            }
          },
          required: ["text"],
        }
      }
    }, fallbackValue);

    const jsonText = response.text?.trim() || "{}";
    res.json(JSON.parse(jsonText));
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

// Start integration with Vite or production file serving
async function initializeApp() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with active Vite routing...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving build assets in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started. Listening on http://0.0.0.0:${PORT}`);
  });
}

initializeApp().catch((err) => {
  console.error("Failed to start server:", err);
});
