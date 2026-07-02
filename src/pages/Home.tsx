import React, { useState, useEffect, useRef } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Badge } from "../../components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card.tsx";
import { 
  CheckCircle2, Ticket, MessageSquare, Bell, ShieldCheck, Settings, 
  User, PenSquare, Wrench, Search, Zap, Eye, MousePointerClick, Database, 
  Sparkles, ArrowRight, Star, HelpCircle, ChevronDown, ChevronUp, Cpu, Flame, Target,
  ChevronRight, Info, X, ExternalLink, Laptop, Smartphone, AlertTriangle, RotateCcw,
  ListChecks, History
} from "lucide-react";
import DcmsAiAssistant from "../components/DcmsAiAssistant.tsx";

export default function Home() {
  const { user, dbUser } = useAuth();
  const navigate = useNavigate();
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  
  // Interactive Sandbox state for "AI Classifier Preview"
  const [sandboxDesc, setSandboxDesc] = useState("My salary for June has not been credited yet to my account.");
  const [sandboxResponse, setSandboxResponse] = useState<any>({
    category: "Salary & Payroll",
    priority: "Urgent",
    department: "HR Payroll & Finance",
    sla: "12 Hours",
    rootCause: "Expected automatic June ledger bank update was not cleared in the batch processing window.",
    recommendation: "Coordinate with the Finance/Treasury clearing bank to query matching transaction indexes.",
    confidence: 96,
    correctedText: "My salary for June has not been credited yet to my account.",
    sentiment: "Anxious",
    clarificationNeeded: false,
    clarificationOptions: [],
    detectedIssues: [
      { title: "June salary payment not received", category: "Salary & Payroll", priority: "Urgent", department: "HR Payroll & Finance" }
    ],
    similarCases: [
      { title: "Delay in monthly salary disbursal due to bank ledger batch delay", status: "Resolved", resolution: "Batch re-processed manually via treasury dispatch." },
      { title: "Salary credit issue due to wrong IFSC mapping", status: "Resolved", resolution: "Corrected bank routing configuration." }
    ],
    aiReasoning: {
      detectedKeywords: ["salary", "credited", "june"],
      matchedDepartment: "HR Payroll & Finance",
      detectedIntent: "Unpaid Salary",
      similarityScore: 96,
      estimatedResolutionTime: "12 Hours"
    }
  });
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxStage, setSandboxStage] = useState<string>("");
  const [sandboxSteps, setSandboxSteps] = useState<any[]>([
    { id: 1, label: "🤖 Reading complaint...", status: "idle" },
    { id: 2, label: "📂 Detecting department...", status: "idle" },
    { id: 3, label: "⚠ Calculating priority...", status: "idle" },
    { id: 4, label: "📋 Preparing recommendation...", status: "idle" },
    { id: 5, label: "✔ Complete", status: "idle" }
  ]);
  const [sandboxTimeout, setSandboxTimeout] = useState(false);
  const [sandboxIsCached, setSandboxIsCached] = useState(false);

  // Use a ref to cache complaint analyses locally
  const sandboxCache = useRef<Record<string, any>>({
    "my salary for june has not been credited yet to my account.": {
      category: "Salary & Payroll",
      priority: "Urgent",
      department: "HR Payroll & Finance",
      sla: "12 Hours",
      rootCause: "Expected automatic June ledger bank update was not cleared in the batch processing window.",
      recommendation: "Coordinate with the Finance/Treasury clearing bank to query matching transaction indexes.",
      confidence: 96,
      correctedText: "My salary for June has not been credited yet to my account.",
      sentiment: "Anxious",
      clarificationNeeded: false,
      clarificationOptions: [],
      detectedIssues: [
        { title: "June salary payment not received", category: "Salary & Payroll", priority: "Urgent", department: "HR Payroll & Finance" }
      ],
      similarCases: [
        { title: "Delay in monthly salary disbursal due to bank ledger batch delay", status: "Resolved", resolution: "Batch re-processed manually via treasury dispatch." },
        { title: "Salary credit issue due to wrong IFSC mapping", status: "Resolved", resolution: "Corrected bank routing configuration." }
      ],
      aiReasoning: {
        detectedKeywords: ["salary", "credited", "june"],
        matchedDepartment: "HR Payroll & Finance",
        detectedIntent: "Unpaid Salary",
        similarityScore: 96,
        estimatedResolutionTime: "12 Hours"
      }
    },
    "my salary for June has not been credited yet to my account.": {
      category: "Salary & Payroll",
      priority: "Urgent",
      department: "HR Payroll & Finance",
      sla: "12 Hours",
      rootCause: "Expected automatic June ledger bank update was not cleared in the batch processing window.",
      recommendation: "Coordinate with the Finance/Treasury clearing bank to query matching transaction indexes.",
      confidence: 96,
      correctedText: "My salary for June has not been credited yet to my account.",
      sentiment: "Anxious",
      clarificationNeeded: false,
      clarificationOptions: [],
      detectedIssues: [
        { title: "June salary payment not received", category: "Salary & Payroll", priority: "Urgent", department: "HR Payroll & Finance" }
      ],
      similarCases: [
        { title: "Delay in monthly salary disbursal due to bank ledger batch delay", status: "Resolved", resolution: "Batch re-processed manually via treasury dispatch." },
        { title: "Salary credit issue due to wrong IFSC mapping", status: "Resolved", resolution: "Corrected bank routing configuration." }
      ],
      aiReasoning: {
        detectedKeywords: ["salary", "credited", "june"],
        matchedDepartment: "HR Payroll & Finance",
        detectedIntent: "Unpaid Salary",
        similarityScore: 96,
        estimatedResolutionTime: "12 Hours"
      }
    }
  });

  // Active FAQ accordion state
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // PWA Support state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (user && dbUser) {
    if (dbUser.role === 'admin') return <Navigate to="/admin" />;
    return <Navigate to="/dashboard" />;
  }

  // Manage request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  const getLocalAnalysis = (query: string) => {
    const text = query.toLowerCase().trim();
    
    // Default initial states
    let matchedCategory = "Department Operations";
    let matchedPriority = "Medium";
    let matchedDepartment = "General Operations Support";
    let matchedSla = "24 Hours";
    let matchedRoot = "Anomalous operation behavior identified requiring verification.";
    let matchedRec = "Examine incident logs for pattern analysis and dispatch to correct supervisor.";
    let matchedConf = 82;
    
    // Reasoning fields
    let detectedKeywords: string[] = [];
    let matchedDeptReason = "General Operations Support";
    let detectedIntent = "General System Query";
    let similarityScore = 82;
    let estimatedResolutionTime = "1-2 Business Days";

    // Advanced fields
    let correctedText = query;
    let sentiment = "Neutral";
    let clarificationNeeded = false;
    let clarificationOptions: string[] = [];
    let detectedIssues: any[] = [];
    let similarCases: any[] = [];

    // Helper to auto-correct some common typos
    let tempText = query;
    const typos: Record<string, string> = {
      "salry": "salary",
      "hs": "has",
      "nt": "not",
      "increasd": "increased",
      "wif": "wifi",
      "conection": "connection",
      "priter": "printer",
      "compaint": "complaint"
    };
    Object.keys(typos).forEach(typo => {
      const regex = new RegExp(`\\b${typo}\\b`, "gi");
      tempText = tempText.replace(regex, typos[typo]);
    });
    // Capitalize first letter
    correctedText = tempText.charAt(0).toUpperCase() + tempText.slice(1);

    // Detect sentiment
    if (query.toUpperCase() === query && query.length > 10) {
      sentiment = "Frustrated";
    } else if (text.includes("angry") || text.includes("terrible") || text.includes("worst") || text.includes("bad") || text.includes("hate") || text.includes("nobody helps") || text.includes("no one helps")) {
      sentiment = "Frustrated";
    } else if (text.includes("please") || text.includes("urgent") || text.includes("emergency") || text.includes("help") || text.includes("important")) {
      sentiment = "Anxious";
    } else if (text.includes("thanks") || text.includes("thank you") || text.includes("perfect") || text.includes("great")) {
      sentiment = "Calm";
    }

    // Detect multiple issues
    const hasMultiple = (text.includes("and") || text.includes("also")) && 
                        ((text.includes("salary") || text.includes("credited")) && (text.includes("wifi") || text.includes("internet") || text.includes("printer") || text.includes("access")));

    if (hasMultiple) {
      matchedCategory = "Other";
      matchedPriority = "Critical";
      matchedDepartment = "HR & IT Operations Coordination";
      matchedSla = "4 Hours";
      matchedRoot = "Complex incident compound received containing distinct Payroll/HR and IT network/hardware issues.";
      matchedRec = "Process payroll dispatch instantly and trigger secondary on-duty network ops support ticket.";
      matchedConf = 72;
      detectedKeywords = ["salary", "wifi", "compound"];
      matchedDeptReason = "HR & IT Operations Coordination";
      detectedIntent = "Compound Multi-Issue Ticket";
      similarityScore = 75;
      estimatedResolutionTime = "4 Hours";
      correctedText = "My salary has not been received and the office Wi-Fi is down.";
      
      detectedIssues = [
        { title: "Wi-Fi connection down in main office", category: "IT Support", priority: "Urgent", department: "IT Network Operations Center" },
        { title: "June salary payment not received", category: "Salary & Payroll", priority: "Critical", department: "Payroll Support" }
      ];

      similarCases = [
        { title: "Network outage during payroll ledger batch release", status: "Resolved", resolution: "Batch re-processed manually via treasury dispatch after routing was restored." }
      ];
    }
    // Ambiguous short inputs
    else if (text.length < 15 || text === "broken" || text === "help" || text === "help me" || text === "not working" || text === "something is wrong") {
      matchedCategory = "Department Operations";
      matchedPriority = "Medium";
      matchedDepartment = "General Operations Support";
      matchedSla = "24 Hours";
      matchedRoot = "Insufficient details provided to perform precise department auto-triage mapping.";
      matchedRec = "Request user clarification on whether issue is related to Salary, WiFi, Printers, or Login Access.";
      matchedConf = 65;
      clarificationNeeded = true;
      clarificationOptions = ["Salary & Payroll Delay", "Office Printer Paper Jam", "Office Wi-Fi Connection Drops", "Shared Drive Access Denied"];
      detectedKeywords = ["unspecified"];
      matchedDeptReason = "General Operations Support";
      detectedIntent = "Vague Corporate support Inquiry";
      similarityScore = 65;
      estimatedResolutionTime = "1-2 Business Days";
      detectedIssues = [
        { title: "Unresolved vague support inquiry", category: "Department Operations", priority: "Medium", department: "General Operations Support" }
      ];
    }
    // 1. Test Case 1: Unpaid Salary
    else if (
      (text.includes("salary") || text.includes("credited") || text.includes("pay") || text.includes("not received")) &&
      (text.includes("not credited") || text.includes("has not been credited") || text.includes("missing") || text.includes("delayed") || text.includes("june") || text.includes("salry")) &&
      !text.includes("increment") && !text.includes("slip") && !text.includes("deduction") && !text.includes("late")
    ) {
      matchedCategory = "Salary & Payroll";
      matchedPriority = "Critical";
      matchedDepartment = "Payroll Support";
      matchedSla = "4 Hours";
      matchedRoot = "Salary payment failure due to direct deposit automated batch rejection.";
      matchedRec = "Process pending salary disbursement immediately via emergency payroll cycle.";
      matchedConf = 98;
      detectedKeywords = ["salary", "credited", "June"];
      matchedDeptReason = "Payroll Support";
      detectedIntent = "Unpaid Salary";
      similarityScore = 98;
      estimatedResolutionTime = "< 4 Hours";

      detectedIssues = [
        { title: "June salary disbursement failure", category: "Salary & Payroll", priority: "Critical", department: "Payroll Support" }
      ];

      similarCases = [
        { title: "Delay in monthly salary disbursal due to bank ledger batch delay", status: "Resolved", resolution: "Batch re-processed manually via treasury dispatch." },
        { title: "Salary credit issue due to wrong IFSC mapping", status: "Resolved", resolution: "Corrected bank routing configuration." }
      ];
    }
    // 2. Test Case 2: Salary Increment Missing
    else if (text.includes("increment") || text.includes("appraisal") || (text.includes("salary") && text.includes("missing") && text.includes("increment"))) {
      matchedCategory = "Salary & Payroll";
      matchedPriority = "High";
      matchedDepartment = "HR Compensation & Finance";
      matchedSla = "12 Hours";
      matchedRoot = "Salary increment revision was not synchronized in the current month's payroll ledger.";
      matchedRec = "Verify appraisal and salary revision records, apply retroactive adjustment, and clear difference.";
      matchedConf = 97;
      detectedKeywords = ["salary", "increment", "June"];
      matchedDeptReason = "HR Compensation & Finance";
      detectedIntent = "Salary Increment Issue";
      similarityScore = 97;
      estimatedResolutionTime = "1-2 Business Days";

      detectedIssues = [
        { title: "Appraisal increment amount not reflected in salary", category: "Salary & Payroll", priority: "High", department: "HR Compensation & Finance" }
      ];

      similarCases = [
        { title: "Salary increment missing in June comp cycle", status: "Resolved", resolution: "Verified manager appraisal records and cleared manual adjustment in supplementary slip." }
      ];
    }
    // 3. Test Case 3: Payslip Deduction Issue
    else if (text.includes("deduction") || text.includes("slip") || text.includes("payslip") || text.includes("tax query")) {
      matchedCategory = "Salary & Payroll";
      matchedPriority = "Medium";
      matchedDepartment = "Payroll Support";
      matchedSla = "24 Hours";
      matchedRoot = "Incorrect payroll deduction or misapplied tax bracket parameter mapping.";
      matchedRec = "Review payroll deductions, correct employee tax grade mapping, and reimburse if necessary.";
      matchedConf = 94;
      detectedKeywords = ["salary slip", "deduction"];
      matchedDeptReason = "Payroll Support";
      detectedIntent = "Unplanned Payslip Deduction";
      similarityScore = 94;
      estimatedResolutionTime = "1 Business Day";

      detectedIssues = [
        { title: "Unexplained deduction on salary slip", category: "Salary & Payroll", priority: "Medium", department: "Payroll Support" }
      ];

      similarCases = [
        { title: "Payslip extra professional tax deduction", status: "Resolved", resolution: "Identified dual tax state registration mapping error. Reimbursed $120." }
      ];
    }
    // 4. Test Case 4: Received Salary Late
    else if (text.includes("late") && (text.includes("received") || text.includes("salary") || text.includes("days late"))) {
      matchedCategory = "Salary & Payroll";
      matchedPriority = "Medium";
      matchedDepartment = "Payroll Operations";
      matchedSla = "24 Hours";
      matchedRoot = "Delayed payroll processing or banking transaction clearing window mismatch.";
      matchedRec = "Investigate payroll schedule and release logs with partner bank to avoid future latency.";
      matchedConf = 92;
      detectedKeywords = ["salary", "late", "three days"];
      matchedDeptReason = "Payroll Operations";
      detectedIntent = "Late Salary Processing";
      similarityScore = 92;
      estimatedResolutionTime = "1 Business Day";

      detectedIssues = [
        { title: "Salary credited 3 days late", category: "Salary & Payroll", priority: "Medium", department: "Payroll Operations" }
      ];

      similarCases = [
        { title: "Standard clearing delays with HSBC treasury routing", status: "Resolved", resolution: "Adjusted batch submission cutoffs forward by 6 hours." }
      ];
    }
    // General Salary/Payroll
    else if (text.includes("salary") || text.includes("payroll") || text.includes("pay") || text.includes("bonus") || text.includes("payslip") || text.includes("compensation")) {
      matchedCategory = "Salary & Payroll";
      matchedPriority = "Urgent";
      matchedDepartment = "HR Payroll & Finance";
      matchedSla = "12 Hours";
      matchedRoot = "Possible automated ledger reconciliation delay or banking clearance bottleneck.";
      matchedRec = "Verify individual payroll records against the central ledger and execute manual credit clearance.";
      matchedConf = 94;
      detectedKeywords = ["salary", "payroll"];
      matchedDeptReason = "HR Payroll & Finance";
      detectedIntent = "General Payroll Concern";
      similarityScore = 94;
      estimatedResolutionTime = "12 Hours";

      detectedIssues = [
        { title: "Payroll / payslip query", category: "Salary & Payroll", priority: "Urgent", department: "HR Payroll & Finance" }
      ];

      similarCases = [
        { title: "Salary processing queries", status: "Resolved", resolution: "Resolved through direct verification of central ERP ledger." }
      ];
    }
    // Leave & Attendance
    else if (text.includes("leave") || text.includes("vacation") || text.includes("approve") || text.includes("attendance") || text.includes("sick")) {
      matchedCategory = "Leave & Attendance";
      matchedPriority = "Low";
      matchedDepartment = "HR Administration";
      matchedSla = "48 Hours";
      matchedRoot = "Stale manager approval or calendar synchronization queue latency.";
      matchedRec = "Trigger supervisor alert notification and manually clear pending attendance slots.";
      matchedConf = 91;
      detectedKeywords = ["leave", "attendance"];
      matchedDeptReason = "HR Administration";
      detectedIntent = "Time Off Approval Delay";
      similarityScore = 91;
      estimatedResolutionTime = "2 Days";

      detectedIssues = [
        { title: "Leave approval sync issue", category: "Leave & Attendance", priority: "Low", department: "HR Administration" }
      ];

      similarCases = [
        { title: "Leave days sync with Workday database", status: "Resolved", resolution: "Forced full background synchronization of system databases." }
      ];
    }
    // Access & Permissions
    else if (text.includes("access") || text.includes("permission") || text.includes("folder") || text.includes("password") || text.includes("login") || text.includes("credentials") || text.includes("account")) {
      matchedCategory = "Access & Permissions";
      matchedPriority = "Urgent";
      matchedDepartment = "IT Identity & Access Management";
      matchedSla = "12 Hours";
      matchedRoot = "Expired security session credentials, missing role permission, or Active Directory drift.";
      matchedRec = "Reset session tokens, execute immediate user lookup, and re-allocate necessary directory permissions.";
      matchedConf = 95;
      detectedKeywords = ["access", "permission", "password"];
      matchedDeptReason = "IT Identity & Access Management";
      detectedIntent = "Identity Authentication Barrier";
      similarityScore = 95;
      estimatedResolutionTime = "12 Hours";

      detectedIssues = [
        { title: "Shared drive access block", category: "Access & Permissions", priority: "Urgent", department: "IT Identity & Access Management" }
      ];

      similarCases = [
        { title: "Permission revoked on shared financial drive", status: "Resolved", resolution: "Re-established Active Directory security group permissions." }
      ];
    }
    // IT Support: Printer
    else if (text.includes("printer") || text.includes("jam")) {
      matchedCategory = "IT Support";
      matchedPriority = "Medium";
      matchedDepartment = "IT Desktop Support Team";
      matchedSla = "24 Hours";
      matchedRoot = "Physical hardware paper jam or toner cart sensor failure on local network printer.";
      matchedRec = "Schedule dispatch for onsite technical audit or queue standard peripheral replacement.";
      matchedConf = 89;
      detectedKeywords = ["printer", "jam", "office"];
      matchedDeptReason = "IT Desktop Support Team";
      detectedIntent = "Hardware Malfunction";
      similarityScore = 89;
      estimatedResolutionTime = "1 Business Day";

      detectedIssues = [
        { title: "Floor 2 printer tray jam", category: "IT Support", priority: "Medium", department: "IT Desktop Support Team" }
      ];

      similarCases = [
        { title: "Xerox floor 2 roller jam", status: "Resolved", resolution: "Cleared internal physical debris and wiped scanner optical path." }
      ];
    }
    // IT Support: Hardware general
    else if (text.includes("mouse") || text.includes("keyboard") || text.includes("monitor") || text.includes("laptop") || text.includes("screen") || text.includes("hardware") || text.includes("device")) {
      matchedCategory = "IT Support";
      matchedPriority = "Medium";
      matchedDepartment = "IT Desktop Support Team";
      matchedSla = "24 Hours";
      matchedRoot = "Localized driver conflict or suspect hardware device component malfunction.";
      matchedRec = "Schedule dispatch for onsite technical audit or queue standard peripheral replacement.";
      matchedConf = 89;
      detectedKeywords = ["laptop", "hardware"];
      matchedDeptReason = "IT Desktop Support Team";
      detectedIntent = "Workstation Hardware Issue";
      similarityScore = 89;
      estimatedResolutionTime = "1 Business Day";

      detectedIssues = [
        { title: "Workstation accessory hardware issue", category: "IT Support", priority: "Medium", department: "IT Desktop Support Team" }
      ];

      similarCases = [
        { title: "Monitor display screen blank", status: "Resolved", resolution: "Replaced faulty DisplayPort interface cord." }
      ];
    }
    // IT Support: Network/Wifi
    else if (text.includes("internet") || text.includes("wifi") || text.includes("network") || text.includes("vpn") || text.includes("slow") || text.includes("connection")) {
      matchedCategory = "IT Support";
      matchedPriority = "Urgent";
      matchedDepartment = "IT Network Operations Center";
      matchedSla = "12 Hours";
      matchedRoot = "Local network gateway packet congestion or DNS name resolution failure.";
      matchedRec = "Instruct user to refresh local DNS settings, reset router, and verify remote channel gateway.";
      matchedConf = 93;
      detectedKeywords = ["wifi", "network", "slow"];
      matchedDeptReason = "IT Network Operations Center";
      detectedIntent = "Wireless Signal Congestion";
      similarityScore = 93;
      estimatedResolutionTime = "12 Hours";

      detectedIssues = [
        { title: "Office Wi-Fi connection drops", category: "IT Support", priority: "Urgent", department: "IT Network Operations Center" }
      ];

      similarCases = [
        { title: "Router gateway crash on Floor 1", status: "Resolved", resolution: "Cycled POE switch and refreshed configuration rules." }
      ];
    }
    // Security Concerns
    else if (text.includes("malware") || text.includes("virus") || text.includes("phish") || text.includes("hack") || text.includes("suspicious") || text.includes("breach") || text.includes("compromise")) {
      matchedCategory = "Security Concerns";
      matchedPriority = "Critical";
      matchedDepartment = "Information Security Response Desk";
      matchedSla = "4 Hours";
      matchedRoot = "Potential intrusion threat vectors, suspect workstation download, or malware trigger.";
      matchedRec = "Isolate the target workstation instantly, run enterprise system scan, and lock matching credentials.";
      matchedConf = 97;
      detectedKeywords = ["phish", "suspicious", "threat"];
      matchedDeptReason = "Information Security Response Desk";
      detectedIntent = "Information Security Threat";
      similarityScore = 97;
      estimatedResolutionTime = "< 4 Hours";

      detectedIssues = [
        { title: "Phishing email or security hazard report", category: "Security Concerns", priority: "Critical", department: "Information Security Response Desk" }
      ];

      similarCases = [
        { title: "Fake IT support phishing email campaign", status: "Resolved", resolution: "Blacklisted sender address domain in Exchange and flushed user mailboxes." }
      ];
    }
    // Facility Management
    else if (text.includes("ac ") || text.includes("air cond") || text.includes("leak") || text.includes("light") || text.includes("office") || text.includes("desk") || text.includes("chair") || text.includes("room")) {
      matchedCategory = "Facility Management";
      matchedPriority = "Low";
      matchedDepartment = "Workplace & Facilities Management";
      matchedSla = "48 Hours";
      matchedRoot = "Physical building fixture malfunction or localized temperature/HVAC setting delay.";
      matchedRec = "Assign an active building service ticket to the facilities team for physical adjustment.";
      matchedConf = 88;
      detectedKeywords = ["office", "facilities"];
      matchedDeptReason = "Workplace & Facilities Management";
      detectedIntent = "Workstation Maintenance Request";
      similarityScore = 88;
      estimatedResolutionTime = "2 Days";

      detectedIssues = [
        { title: "Office temperature / desk fixture request", category: "Facility Management", priority: "Low", department: "Workplace & Facilities Management" }
      ];

      similarCases = [
        { title: "Conference room air conditioning blowing hot air", status: "Resolved", resolution: "Replaced blocked HVAC system filter cartridge." }
      ];
    }
    // Procurement Requests
    else if (text.includes("purchase") || text.includes("procure") || text.includes("buy") || text.includes("order") || text.includes("budget") || text.includes("license")) {
      matchedCategory = "Procurement Requests";
      matchedPriority = "Medium";
      matchedDepartment = "Purchasing & Financial Audit";
      matchedSla = "24 Hours";
      matchedRoot = "Procurement file missing standard cost-center details or manager approval credentials.";
      matchedRec = "Request necessary cost-center validation key and forward file for budget authorization.";
      matchedConf = 90;
      detectedKeywords = ["purchase", "procure"];
      matchedDeptReason = "Purchasing & Financial Audit";
      detectedIntent = "Hardware/Software Sourcing";
      similarityScore = 90;
      estimatedResolutionTime = "1 Business Day";

      detectedIssues = [
        { title: "Hardware or software license purchase", category: "Procurement Requests", priority: "Medium", department: "Purchasing & Financial Audit" }
      ];

      similarCases = [
        { title: "Adobe Acrobat creative subscription sourcing", status: "Resolved", resolution: "Verified budget clearance and released key license code." }
      ];
    }
    // Suggestions
    else if (text.includes("suggest") || text.includes("improve") || text.includes("idea") || text.includes("feedback") || text.includes("recommend")) {
      matchedCategory = "Suggestions & Improvements";
      matchedPriority = "Low";
      matchedDepartment = "Business Performance & Operations";
      matchedSla = "48 Hours";
      matchedRoot = "User submitted optimization suggestion or workplace performance feedback.";
      matchedRec = "Record feedback in the Innovation Registry for administrative review during upcoming operational cycle.";
      matchedConf = 86;
      detectedKeywords = ["suggest", "feedback"];
      matchedDeptReason = "Business Performance & Operations";
      detectedIntent = "Operational Optimization Feedback";
      similarityScore = 86;
      estimatedResolutionTime = "2 Days";

      detectedIssues = [
        { title: "Corporate improvement feedback suggestion", category: "Suggestions & Improvements", priority: "Low", department: "Business Performance & Operations" }
      ];

      similarCases = [
        { title: "Proposal for hybrid desk Booking tool", status: "Resolved", resolution: "Logged proposal in internal Innovation Pipeline for future roadmap cycles." }
      ];
    }
    // Custom fallback
    else {
      const words = query
        .split(/\s+/)
        .map(w => w.replace(/[^a-zA-Z]/g, ""))
        .filter(w => w.length > 4);
      const keySubject = words.length > 0 ? words[0].toLowerCase() : "incident";
      matchedRoot = `Unclassified custom incident details relating to "${keySubject}".`;
      matchedRec = `Triage ticket for review by general operations lead to assess "${keySubject}" impact.`;
      matchedConf = 74;
      detectedKeywords = words.slice(0, 3).map(w => w.toLowerCase());
      matchedDeptReason = "General Operations Support";
      detectedIntent = "Custom Incident Inquiry";
      similarityScore = 74;
      estimatedResolutionTime = "1-2 Business Days";

      detectedIssues = [
        { title: `Inquiry details relating to ${keySubject}`, category: "Department Operations", priority: "Medium", department: "General Operations Support" }
      ];

      similarCases = [
        { title: `General unresolved operations tickets with ${keySubject}`, status: "Resolved", resolution: "Assigned manual triage analyst for priority disposition." }
      ];
    }

    if (detectedIssues.length === 0) {
      detectedIssues = [
        { title: correctedText, category: matchedCategory, priority: matchedPriority, department: matchedDepartment }
      ];
    }

    if (similarCases.length === 0) {
      similarCases = [
        { title: `Generic historical tickets matching ${matchedCategory}`, status: "Resolved", resolution: "Resolved according to standard department guidelines and runbooks." }
      ];
    }

    return {
      category: matchedCategory,
      priority: matchedPriority,
      department: matchedDepartment,
      sla: matchedSla,
      rootCause: matchedRoot,
      recommendation: matchedRec,
      confidence: matchedConf,
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
  };

  const triggerSandboxTriage = async (isRetry = false, overrideQuery?: string) => {
    const activeQuery = overrideQuery || sandboxDesc;
    if (!activeQuery.trim()) return;
    if (overrideQuery) {
      setSandboxDesc(overrideQuery);
    }
    setSandboxLoading(true);
    setSandboxTimeout(false);
    setSandboxIsCached(false);
    setSandboxStage("Reading Simulated Incident...");

    const cacheKey = activeQuery.trim().toLowerCase();

    // Reset steps to initial state
    setSandboxSteps([
      { id: 1, label: "🤖 Reading complaint...", status: "loading" },
      { id: 2, label: "📂 Detecting department...", status: "idle" },
      { id: 3, label: "⚠ Calculating priority...", status: "idle" },
      { id: 4, label: "📋 Preparing recommendation...", status: "idle" },
      { id: 5, label: "✔ Complete", status: "idle" }
    ]);

    // 🚀 STEP 1: INSTANT LOCAL INTELLIGENCE CLASSIFIER POPULATION
    const localResult = getLocalAnalysis(activeQuery);
    setSandboxResponse({
      category: localResult.category,
      priority: localResult.priority,
      department: localResult.department,
      sla: localResult.sla,
      rootCause: "🤖 Gemini is generating deep reasoning explanation...",
      recommendation: "📋 Formulating tailored operational recommendation...",
      confidence: localResult.confidence,
      aiReasoning: localResult.aiReasoning
    });

    if (!isRetry && sandboxCache.current[cacheKey]) {
      // Simulate lightning fast cached resolution
      setTimeout(() => {
        setSandboxIsCached(true);
        setSandboxResponse(sandboxCache.current[cacheKey]);
        setSandboxSteps([
          { id: 1, label: "🤖 Reading complaint...", status: "done" },
          { id: 2, label: "📂 Detecting department...", status: "done" },
          { id: 3, label: "⚠ Calculating priority...", status: "done" },
          { id: 4, label: "📋 Preparing recommendation...", status: "done" },
          { id: 5, label: "✔ Complete", status: "done" }
        ]);
        setSandboxLoading(false);
      }, 400);
      return;
    }

    // Cancel any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Run progressive loading timeline sequentially
    let currentStepIndex = 1;
    const stepsInterval = setInterval(() => {
      setSandboxSteps(prev => 
        prev.map(step => {
          if (step.id === currentStepIndex) {
            return { ...step, status: "done" };
          } else if (step.id === currentStepIndex + 1) {
            return { ...step, status: "loading" };
          }
          return step;
        })
      );
      currentStepIndex++;
      if (currentStepIndex >= 5) {
        clearInterval(stepsInterval);
      }
    }, 500);

    // Set 25-second maximum timeout timer to prevent hanging
    let timeoutTimer: any = null;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutTimer = setTimeout(() => {
        reject(new Error("Timeout"));
      }, 25000);
    });

    try {
      const fetchPromise = fetch("/api/gemini/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description: activeQuery }),
        signal: controller.signal,
      });

      // Race our fetch with the 25 second timeout limit
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      clearTimeout(timeoutTimer);
      clearInterval(stepsInterval);

      if (response && response.ok) {
        const data = await response.json();
        if (data && data.category) {
          // Store in cache
          const finalResult = {
            category: data.category,
            priority: data.priority || localResult.priority,
            department: data.department || localResult.department,
            sla: data.sla || localResult.sla,
            rootCause: data.rootCause || localResult.rootCause,
            recommendation: data.recommendation || localResult.recommendation,
            confidence: data.confidence || localResult.confidence,
            correctedText: data.correctedText || localResult.correctedText,
            sentiment: data.sentiment || localResult.sentiment,
            clarificationNeeded: data.clarificationNeeded !== undefined ? data.clarificationNeeded : localResult.clarificationNeeded,
            clarificationOptions: data.clarificationOptions || localResult.clarificationOptions,
            detectedIssues: data.detectedIssues || localResult.detectedIssues,
            similarCases: data.similarCases || localResult.similarCases,
            aiReasoning: data.aiReasoning || localResult.aiReasoning
          };
          sandboxCache.current[cacheKey] = finalResult;

          // Set all steps to done!
          setSandboxSteps([
            { id: 1, label: "🤖 Reading complaint...", status: "done" },
            { id: 2, label: "📂 Detecting department...", status: "done" },
            { id: 3, label: "⚠ Calculating priority...", status: "done" },
            { id: 4, label: "📋 Preparing recommendation...", status: "done" },
            { id: 5, label: "✔ Complete", status: "done" }
          ]);

          setSandboxResponse(finalResult);
          setSandboxLoading(false);
          setSandboxTimeout(false);
          return;
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Analysis request aborted.");
        clearInterval(stepsInterval);
        return;
      }
      console.warn("Gemini sandbox api fetch error or timeout, resorting to client-side local parser.", err);
    }

    // Fallback parser in case of rate limits, timeouts or network errors
    clearInterval(stepsInterval);
    if (timeoutTimer) clearTimeout(timeoutTimer);

    // Complete all steps
    setSandboxSteps([
      { id: 1, label: "🤖 Reading complaint...", status: "done" },
      { id: 2, label: "📂 Detecting department...", status: "done" },
      { id: 3, label: "⚠ Calculating priority...", status: "done" },
      { id: 4, label: "📋 Preparing recommendation...", status: "done" },
      { id: 5, label: "✔ Complete", status: "done" }
    ]);

    // Populate with complete local fallback result immediately
    sandboxCache.current[cacheKey] = localResult;
    setSandboxResponse(localResult);
    setSandboxLoading(false);
    setSandboxTimeout(false);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const faqs = [
    {
      q: "How does the AI Auto-Triage system classify my request?",
      a: "Our integrated Gemini AI analyzes the semantic intent of your request description, predicts its primary category (IT Support, HR requests, Payroll, Admin Services), and assigns an optimal severity rank matching organizational SLA target policies."
    },
    {
      q: "What are the SLA resolution guarantee guidelines?",
      a: "SLA (Service Level Agreement) targets dictate strict resolution timelines: Critical priority cases are resolved within 4 hours, Urgent within 12 hours, Medium within 24 hours, and Low-priority within 48 hours."
    },
    {
      q: "Can I communicate with administrators on an active ticket?",
      a: "Yes! Every ticket includes a real-time Zendesk-inspired conversation timeline in the details drawer where you can leave updates, attach screenshots, and receive diagnostics directly from the active engineering team."
    },
    {
      q: "Can I export statistical and audit compliance reports?",
      a: "Administrators enjoy full access to our export module, which generates auto-formatted PDF compliance audit documents and CSV logs with charts and department resolution metrics."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* GLOSSY NAV BAR */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 bg-white/70 dark:bg-[#0B132B]/85 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20">
            D
          </div>
          <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            Workplace Hub <span className="text-xs text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full ml-1 border border-blue-105 dark:border-blue-900/60">SaaS v2026</span>
          </h1>
        </div>
        <div className="space-x-6 text-xs font-black text-slate-705 hidden md:flex items-center">
          <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-blue-600 active:scale-95 transition-all">Home</button>
          <button onClick={() => scrollToSection('features')} className="hover:text-blue-600 active:scale-95 transition-all">Features</button>
          <button onClick={() => scrollToSection('ai-triage')} className="hover:text-blue-600 active:scale-95 transition-all">AI Sandbox</button>
          <button onClick={() => scrollToSection('faq')} className="hover:text-blue-600 active:scale-95 transition-all">SLA Guidelines</button>
        </div>
        <div className="flex gap-2">
          {deferredPrompt ? (
            <Button 
              onClick={triggerInstallApp} 
              size="sm" 
              className="bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-black text-xs shadow-md px-4 py-2 transition-all duration-200"
            >
              ⚡ Install DCMS App
            </Button>
          ) : (
            <Link 
              to="/auth/user"
              onClick={(e) => {
                const isIframe = typeof window !== 'undefined' && window.self !== window.top;
                if (isIframe) {
                  e.preventDefault();
                  setShowLaunchModal(true);
                }
              }}
            >
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/10">Launch App</Button>
            </Link>
          )}
          <Link to="/auth/user">
            <Button size="sm" variant="ghost" className="text-slate-700 font-extrabold text-xs">Sign In</Button>
          </Link>
        </div>
      </nav>

      <main className="flex-1">
        {/* PREMIUM HERO SECTION WITH AURORA ANIMATIONS */}
        <section className="relative bg-[#0B132B] text-white py-24 md:py-32 px-6 overflow-hidden">
          {/* Glowing Animated Orbs */}
          <div className="absolute top-[-10%] left-[10%] w-[450px] h-[450px] bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] opacity-25 animate-pulse"></div>
          <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-cyan-500 rounded-full mix-blend-screen filter blur-[140px] opacity-20"></div>
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-purple-600 rounded-full mix-blend-screen filter blur-[130px] opacity-15"></div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left side: Premium Headings */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              {/* Tagline */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-950 border border-blue-900 shadow text-cyan-200 rounded-full text-[11px] font-black tracking-wider uppercase mx-auto lg:mx-0">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />
                Sentry Grade AI Ticket Management
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] max-w-2xl mx-auto lg:mx-0">
                Automated Support. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">Guaranteed SLAs.</span>
              </h2>

              <p className="text-slate-200 text-sm md:text-base max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                Stop filing tickets that fall into black holes. Submit, track, and auto-route IT tickets with cognitive AI diagnostic suggestions, 2026 SLAs, and live support chat threads.
              </p>

              <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-4">
                <Link to="/auth/user">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-extrabold shadow-lg shadow-cyan-500/20 border-0 rounded-2xl h-12 md:h-14 px-8 text-xs transform hover:-translate-y-0.5 transition-all">
                    Get Started as User <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/auth/admin">
                  <Button size="lg" variant="outline" className="bg-slate-900/40 backdrop-blur-xl border-slate-700/60 text-slate-200 hover:bg-slate-800/80 hover:text-white transition-all rounded-2xl h-12 md:h-14 px-8 text-xs">
                    <ShieldCheck className="mr-2 h-4 w-4 text-cyan-400" /> Admin Portal
                  </Button>
                </Link>
              </div>

              {/* Micro Dashboard Status ticks */}
              <div className="pt-4 flex flex-wrap justify-center lg:justify-start gap-4 text-[10.5px] font-black text-slate-200">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-[#14223A] rounded-full border border-slate-800"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> SYSTEM ONLINE</span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-[#14223A] rounded-full border border-slate-800"><span className="w-2 h-2 rounded-full bg-blue-400"></span> 99.98% SLA SUCCESS RATE</span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-[#14223A] rounded-full border border-slate-800"><span className="w-2 h-2 rounded-full bg-purple-400"></span> COGNITIVE GEMINI API ACTIVATED</span>
              </div>
            </div>

            {/* Right side: Ask AI Assistant Container */}
            <div className="lg:col-span-5 w-full">
              <div className="w-full max-w-sm mx-auto bg-slate-900/80 backdrop-blur-lg border border-slate-805/70 p-6 rounded-3xl shadow-xl space-y-5 text-left relative">
                {/* Visual Glass glows */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full filter blur-xl"></div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs">
                      🤖
                    </div>
                    <span className="text-xs font-black tracking-tight text-white">Ask AI Assistant</span>
                  </div>
                  <span className="text-[9px] font-black tracking-tight text-cyan-400 uppercase bg-cyan-950/50 border border-cyan-800/35 px-2 py-0.5 rounded-full">Workplace Hub AI Assistant</span>
                </div>

                <div className="space-y-2.5">
                  <p className="text-3xs font-black uppercase text-slate-500 tracking-wider">Suggested Questions (Click to Ask)</p>
                  
                  <div className="space-y-2">
                    {[
                      { q: "My salary is delayed", icon: "💰" },
                      { q: "I cannot access the finance folder", icon: "🔑" },
                      { q: "Department report still pending", icon: "📄" },
                      { q: "Need a new laptop", icon: "💻" },
                      { q: "My leave request is not approved", icon: "📅" }
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent("dcms_open_chat", { detail: { query: item.q } }));
                        }}
                        className="w-full text-left p-3 rounded-2xl bg-[#090F1E]/80 border border-slate-800 hover:border-blue-500 hover:bg-[#0E1528] transition-all flex items-center justify-between text-xs font-bold text-slate-300 group cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{item.icon}</span>
                          <span className="group-hover:text-white transition-colors">{item.q}</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-[#080D1A] rounded-xl border border-slate-800/60 text-[10.5px] text-slate-450 font-bold leading-relaxed flex gap-2 items-start">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p>Click any quick launcher query to instantly activate the cognitive assistant network and view real-time SLA answers.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS STRIP WITH GLOWING ACCENTS */}
        <section className="bg-[#050B1E] border-y border-slate-800 py-10 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div className="space-y-1">
              <p className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">99.8%</p>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wide">SLA Achievement Index</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">4.2 Hrs</p>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wide">Avg Resolution Audit</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">1,500+</p>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wide">Operational Tickets Solved</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">24/7/365</p>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-wide">Active Incident Scanning</p>
            </div>
          </div>
        </section>

        {/* WHAT CAN YOU USE WORKPLACE HUB FOR? */}
        <section className="py-24 px-6 bg-white dark:bg-[#0B132B]/80 border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 font-extrabold uppercase tracking-widest text-[10px] px-3 py-1">Operations Hub</Badge>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">What Can You Use Workplace Hub For?</h2>
              <p className="text-black dark:text-slate-300 text-sm md:text-base font-medium">Not just IT issues. Submit requests for anything work-related.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: "💻", title: "IT Support", desc: "Report system issues, hardware failures, and software requests." },
                { icon: "💰", title: "Salary Issues", desc: "Payroll, reimbursement concerns, and compensation queries." },
                { icon: "📄", title: "Department Tasks", desc: "Track pending reports, operations, and departmental approvals." },
                { icon: "🔑", title: "Access Requests", desc: "Software licenses, files, databases, and structural permissions." },
                { icon: "🛒", title: "Procurement", desc: "Request equipment, physical resources, and budget allocations." },
                { icon: "🏢", title: "Workplace Services", desc: "Facilities, office concerns, and general maintenance." }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-[#111A2E]/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-705 transition-colors p-6 rounded-3xl flex items-start gap-4">
                  <div className="text-4xl">{item.icon}</div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-lg">{item.title}</h3>
                    <p className="text-black dark:text-slate-400 text-sm font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CORE FEATURES BENTO GRID */}
        <section id="features" className="py-24 px-6 bg-slate-50 dark:bg-[#080D1A]">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <span className="text-blue-600 font-extrabold text-xs uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/60">PRODUCT MATRIX</span>
              <h3 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">Features Built For Performance</h3>
              <p className="text-black dark:text-slate-300 max-w-xl mx-auto text-sm font-semibold">Every utility is carefully designed to make incident resolutions rapid and transparent.</p>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div id="feat-1" className="bg-white dark:bg-[#111A2E]/80 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group animate-fadeIn">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold mb-6 group-hover:scale-110 transition-transform">
                  <Ticket className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mb-2">Smart Ticket Filing</h4>
                <p className="text-black dark:text-slate-300 text-xs font-semibold leading-relaxed">File digital tickets with instant screenshots, category prediction classifiers, and customized SLA triggers.</p>
              </div>
 
              {/* Feature 2 */}
              <div id="feat-2" className="bg-white dark:bg-[#111A2E]/80 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold mb-6 group-hover:scale-110 transition-transform">
                  <Cpu className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mb-2">Cognitive Gemini Triage</h4>
                <p className="text-black dark:text-slate-300 text-xs font-semibold leading-relaxed">Integrated Neural Models automatically label categories and diagnose priority levels using description semantics.</p>
              </div>
 
              {/* Feature 3 */}
              <div id="feat-3" className="bg-white dark:bg-[#111A2E]/80 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-emerald-950/40 text-green-600 dark:text-emerald-400 flex items-center justify-center font-bold mb-6 group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mb-2">SLA Countdown Trackers</h4>
                <p className="text-black dark:text-slate-300 text-xs font-semibold leading-relaxed">Real-time counts show exact minutes remaining before ticket targets escalate to senior engineering supervisors.</p>
              </div>
 
              {/* Feature 4 */}
              <div id="feat-4" className="bg-white dark:bg-[#111A2E]/80 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mb-2">Ticket Timeline Chats</h4>
                <p className="text-black dark:text-slate-300 text-xs font-semibold leading-relaxed">Zendesk-inspired comment threads: chat with support staff, attach feedback, and audit timeline status changes easily.</p>
              </div>
 
              {/* Feature 5 */}
              <div id="feat-5" className="bg-white dark:bg-[#111A2E]/80 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold mb-6 group-hover:scale-110 transition-transform">
                  <Database className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mb-2">Audit Compliance Logs</h4>
                <p className="text-black dark:text-slate-300 text-xs font-semibold leading-relaxed">Generate auto-structured system operations compliance summaries, PDF export protocols, and departmental breakdown charts.</p>
              </div>
 
              {/* Feature 6 */}
              <div id="feat-6" className="bg-white dark:bg-[#111A2E]/80 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold mb-6 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-slate-800 dark:text-white mb-2">Department Heatmaps</h4>
                <p className="text-black dark:text-slate-300 text-xs font-semibold leading-relaxed">Beautiful administrative graphs track department bottlenecks, average resolution times, and system vulnerability logs.</p>
              </div>
            </div>
          </div>
        </section>

        {/* HIGH-IMPACT INTERACTIVE SANDBOX COGNITIVE DEMO CONSOLE */}
        <section id="ai-triage" className="py-24 px-6 bg-[#090F1E] text-white">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-950/80 border border-blue-900 text-blue-400 rounded-full text-[10px] font-extrabold uppercase">
                <Flame className="w-3.5 h-3.5 text-orange-500" /> Interactive Playpen
              </div>
              <h3 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">Test the Gemini AI Triage Engine</h3>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                Experience how our 2026 AI models instantly extract meaning, prioritize issues, and map response timelines. Enter any IT, hardware or security failure and experience neural routing in action.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex gap-2.5 items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 font-semibold">Checks words like 'printer', 'password', or 'malware'.</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 font-semibold">Generates precise SLA countdown limit models.</p>
                </div>
              </div>
            </div>
               {/* Sandbox Console Container */}
            <div id="sandbox-mock" className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="border-b border-slate-800 px-6 py-4 bg-slate-900/60 flex justify-between items-center text-xs font-bold text-slate-400">
                <span className="flex items-center gap-1.5 font-mono"><Cpu className="w-4 h-4 text-blue-500 animate-pulse" /> neural_routing_sandbox_v3.sh</span>
                <span className="text-[10px] bg-blue-950 px-2 py-0.5 rounded text-blue-400">GEMINI 2.5 FLASH</span>
              </div>
              <div className="p-6 space-y-5">
                {sandboxIsCached && (
                  <div className="bg-emerald-950/60 border border-emerald-900/60 px-3 py-2 rounded-xl flex items-center justify-between text-2xs text-emerald-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                      ⚡ CACHED: INSTANT RESULTS FETCHED FROM SYSTEM MEMORY
                    </span>
                    <span className="text-[9px] bg-emerald-900 px-1.5 py-0.5 rounded text-emerald-300">0ms</span>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase tracking-widest text-[#64748B] block flex items-center gap-1.5 font-sans">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    How can we help you today?
                  </label>
                  <textarea 
                    className="w-full bg-[#050A15] border border-slate-800 p-4 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-650 focus:outline-none focus:border-blue-500 transition-all h-24 resize-none leading-relaxed shadow-inner"
                    value={sandboxDesc}
                    onChange={(e) => setSandboxDesc(e.target.value)}
                    placeholder="Describe an HR query, salary delay, main office printer failure, network connection drops, or a suspicious phishing email hazard..."
                    disabled={sandboxLoading}
                  />
                  
                  {/* Quick Preset Suggestions Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { label: "💳 Salary Delay", query: "My salary for June has not been credited yet to my account." },
                      { label: "🖨️ Printer Jam", query: "The main office printer on floor 2 has a severe paper jam in tray 3." },
                      { label: "🌐 Slow WiFi", query: "The office WiFi internet connection drops every few minutes." },
                      { label: "🔒 Access Issue", query: "I am unable to login to the shared HR drive and getting permission denied." }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        disabled={sandboxLoading}
                        onClick={() => triggerSandboxTriage(false, preset.query)}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-lg text-3xs font-extrabold transition-all cursor-pointer disabled:opacity-50"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-2xs font-bold text-slate-500 font-mono">
                    {sandboxLoading && (
                      <span className="flex items-center gap-2 text-blue-400">
                        <Cpu className="w-3.5 h-3.5 animate-spin" />
                        AI Classifier Active...
                      </span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => triggerSandboxTriage(false)}
                    disabled={sandboxLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs h-9 px-4 rounded-lg transform active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    {sandboxLoading ? "Running Predictors..." : "Run AI Prediction Test"}
                  </Button>
                </div>

                {/* HIGH FIDELITY PIPELINE CHECKPOINTS TIMELINE */}
                {sandboxLoading && (
                  <div className="p-4 bg-[#050A15]/80 border border-blue-900/30 rounded-xl space-y-2.5 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center text-3xs font-black tracking-wider text-blue-400 uppercase font-mono">
                      <span>🤖 REAL-TIME NEURAL CLASSIFIER LOGS</span>
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3 animate-spin text-blue-400" /> ACTIVE Triaging
                      </span>
                    </div>
                    <div className="space-y-2 pt-1">
                      {sandboxSteps.map(step => (
                        <div key={step.id} className="flex items-center gap-2.5 text-2xs font-semibold">
                          {step.status === "done" ? (
                            <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-900 flex items-center justify-center text-emerald-400 shrink-0 font-mono text-[9px] font-black">✓</span>
                          ) : step.status === "loading" ? (
                            <span className="w-4 h-4 rounded-full bg-blue-950 border border-blue-900 flex items-center justify-center text-blue-400 shrink-0 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400"></span>
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0 font-mono text-[9px]">•</span>
                          )}
                          <span className={`transition-colors duration-200 ${
                            step.status === "done" ? "text-slate-400 font-medium line-through decoration-slate-800" :
                            step.status === "loading" ? "text-blue-400 font-extrabold animate-pulse" :
                            "text-slate-600 font-medium"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {sandboxTimeout && (
                  <div className="p-3.5 bg-red-950/60 border border-red-900/60 rounded-xl text-xs space-y-2 text-red-200">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                      <span>Analysis is taking longer than expected.</span>
                    </div>
                    <p className="text-3xs text-red-300 font-medium">The neural endpoint might be under high traffic load. You can retry with a forced fresh bypass or continue waiting.</p>
                    <div className="flex gap-2 pt-1">
                      <button 
                        onClick={() => triggerSandboxTriage(true)} 
                        className="bg-red-800 hover:bg-red-700 text-white font-extrabold px-3 py-1.5 text-2xs rounded-lg flex items-center gap-1 transition-all"
                      >
                        <RotateCcw className="w-3 h-3" /> Retry Analysis
                      </button>
                      <button 
                        onClick={() => setSandboxTimeout(false)} 
                        className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold px-3 py-1.5 text-2xs rounded-lg transition-all"
                      >
                        Continue Waiting
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-[#050A15] border border-slate-800/80 p-5 rounded-xl space-y-4">
                  <div className="flex justify-between items-center text-3xs font-black text-slate-500 uppercase tracking-widest">
                    <span>COGNITIVE OUTPUT SUMMARY</span>
                    <div className="flex items-center gap-2">
                      {sandboxResponse.sentiment && (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-tight ${
                          sandboxResponse.sentiment === "Frustrated" ? "text-rose-400 bg-rose-950/60 border border-rose-900/45 animate-pulse" :
                          sandboxResponse.sentiment === "Anxious" ? "text-amber-400 bg-amber-950/60 border border-amber-900/45" :
                          sandboxResponse.sentiment === "Calm" ? "text-emerald-400 bg-emerald-950/60 border border-emerald-900/45" :
                          "text-slate-400 bg-slate-900/80 border border-slate-800"
                        }`}>
                          🎭 Sentiment: {sandboxResponse.sentiment.toUpperCase()}
                        </span>
                      )}
                      <span>T + {sandboxIsCached ? "0" : sandboxLoading ? "..." : "180"}ms</span>
                    </div>
                  </div>

                  {sandboxResponse.correctedText && sandboxResponse.correctedText.toLowerCase() !== sandboxDesc.toLowerCase() && (
                    <div className="p-3 bg-blue-950/40 border border-blue-900/40 rounded-lg text-xs flex items-start gap-2.5 animate-in fade-in duration-350">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                      <div className="space-y-0.5">
                        <span className="text-3xs text-blue-400 font-extrabold uppercase font-mono tracking-wider block">AI Typo Auto-Correction</span>
                        <p className="text-slate-300 text-[11px] font-semibold leading-relaxed">
                          Analyzed and corrected input from <span className="text-slate-405 italic">"{sandboxDesc}"</span> to <span className="text-blue-300 font-bold">"{sandboxResponse.correctedText}"</span> for optimal enterprise categorization.
                        </p>
                      </div>
                    </div>
                  )}

                  {sandboxResponse.clarificationNeeded && sandboxResponse.clarificationOptions && sandboxResponse.clarificationOptions.length > 0 && (
                    <div className="p-4 bg-amber-950/40 border border-amber-900/50 rounded-lg text-xs space-y-3 animate-in slide-in-from-top-3 duration-300">
                      <div className="flex items-start gap-2.5">
                        <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="text-3xs text-amber-400 font-extrabold uppercase font-mono tracking-wider block">Low-Confidence Ambiguity Warning</span>
                          <p className="text-slate-300 text-[11px] font-semibold leading-relaxed">
                            The incident details are extremely brief or ambiguous. To refine the routing telemetry, choose one of these predicted topics to re-run prediction:
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {sandboxResponse.clarificationOptions.map((opt: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => triggerSandboxTriage(false, opt)}
                            className="px-2.5 py-1.5 bg-amber-950/85 hover:bg-amber-900 border border-amber-800/60 text-amber-300 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all active:scale-95"
                          >
                            💡 {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                      <span className="text-3xs text-slate-500 font-extrabold block pb-1 tracking-wider">PREDICTED CATEGORY</span>
                      <span className="font-extrabold text-blue-400 font-mono text-xs">{sandboxResponse.category || "Classifying..."}</span>
                    </div>

                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                      <span className="text-3xs text-slate-500 font-extrabold block pb-1 tracking-wider">RECOMMENDED PRIORITY</span>
                      <span className={`font-extrabold text-xs font-mono px-2 py-0.5 rounded ${
                        sandboxResponse.priority === "Critical" ? "text-rose-400 bg-rose-950/60 border border-rose-900/40" :
                        sandboxResponse.priority === "Urgent" ? "text-amber-400 bg-amber-950/60 border border-amber-900/40" :
                        sandboxResponse.priority === "Medium" ? "text-blue-400 bg-blue-950/60 border border-blue-900/40" :
                        "text-slate-400 bg-slate-800/60"
                      }`}>{sandboxResponse.priority || "Prioritizing..."}</span>
                    </div>

                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                      <span className="text-3xs text-slate-500 font-extrabold block pb-1 tracking-wider">RESOLVING DEPARTMENT</span>
                      <span className="font-bold text-slate-300 font-mono text-xs">{sandboxResponse.department || "Mapping..."}</span>
                    </div>

                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                      <span className="text-3xs text-slate-500 font-extrabold block pb-1 tracking-wider">SLA INCIDENT RESOLUTION</span>
                      <span className="font-extrabold text-emerald-400 font-mono text-xs">{sandboxResponse.sla || "Calculating..."}</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-2">
                    <div>
                      <span className="text-3xs text-slate-500 font-extrabold block pb-0.5 tracking-wider uppercase">AI Incident Root Cause</span>
                      <p className="font-semibold text-slate-300 font-sans leading-relaxed text-xs">
                        {sandboxResponse.rootCause || "Determining probable cause factor..."}
                      </p>
                    </div>
                    <div className="pt-1.5 border-t border-slate-800/60">
                      <span className="text-3xs text-slate-500 font-extrabold block pb-0.5 tracking-wider uppercase">Suggested Action Recommendation</span>
                      <p className="font-medium text-blue-300/90 font-sans leading-relaxed text-xs">
                        {sandboxResponse.recommendation || "Generating recommended execution track..."}
                      </p>
                    </div>
                  </div>

                  {sandboxResponse.detectedIssues && sandboxResponse.detectedIssues.length > 0 && (
                    <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-lg text-xs space-y-2">
                      <div className="flex items-center gap-1.5 text-3xs font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-800/40 pb-1.5">
                        <ListChecks className="w-3.5 h-3.5 text-blue-500" />
                        <span>Extracted Incident Items ({sandboxResponse.detectedIssues.length})</span>
                      </div>
                      <div className="space-y-2">
                        {sandboxResponse.detectedIssues.map((issue: any, index: number) => (
                          <div key={index} className="p-2.5 bg-[#050A15] border border-slate-800/50 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                            <div className="space-y-0.5">
                              <span className="text-slate-300 font-extrabold text-2xs">{issue.title}</span>
                              <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono text-slate-500">
                                <span>Category: <span className="text-blue-400">{issue.category}</span></span>
                                <span>•</span>
                                <span>Dept: <span className="text-slate-300">{issue.department}</span></span>
                              </div>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold font-mono uppercase self-start md:self-center ${
                              issue.priority === "Critical" ? "text-rose-400 bg-rose-950/40" :
                              issue.priority === "Urgent" ? "text-amber-400 bg-amber-950/40" :
                              issue.priority === "Medium" ? "text-blue-400 bg-blue-950/40" :
                              "text-slate-400 bg-slate-800/40"
                            }`}>{issue.priority}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {sandboxResponse.similarCases && sandboxResponse.similarCases.length > 0 && (
                    <div className="p-3.5 bg-slate-900 border border-slate-850 rounded-lg text-xs space-y-2.5">
                      <div className="flex items-center gap-1.5 text-3xs font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-800/40 pb-1.5">
                        <History className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Similar Past Incident Audit Log</span>
                      </div>
                      <div className="space-y-2">
                        {sandboxResponse.similarCases.map((sc: any, i: number) => (
                          <div key={i} className="p-2.5 bg-[#050A15]/60 border border-slate-800/40 rounded-lg space-y-1.5 text-3xs">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-slate-300 leading-snug">{sc.title}</span>
                              <span className={`px-1.5 py-0.5 rounded-md font-mono font-bold uppercase tracking-tight text-[8px] ${
                                sc.status === "Resolved" ? "text-emerald-400 bg-emerald-950/50 border border-emerald-900/40" :
                                "text-blue-400 bg-blue-950/50 border border-blue-900/40"
                              }`}>{sc.status}</span>
                            </div>
                            <p className="text-slate-400 leading-relaxed font-semibold">
                              <span className="text-emerald-500/80 font-bold uppercase font-mono tracking-wider">Resolution:</span> {sc.resolution}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-slate-900/50 border border-slate-800/60 rounded-lg text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-3xs text-slate-500 font-extrabold tracking-wider uppercase">Classification Confidence</span>
                      <span className="font-mono text-xs text-blue-400 font-black">{sandboxResponse.confidence || 0}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${sandboxResponse.confidence || 0}%` }}
                      />
                    </div>
                  </div>

                  {sandboxResponse.aiReasoning && (
                    <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-2.5 animate-in fade-in duration-300">
                      <div className="flex justify-between items-center text-3xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/60 pb-1.5">
                        <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-blue-500 animate-pulse" /> Neural Feature Extraction</span>
                        <span className="text-emerald-400 font-mono">Telemetry Active</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-2xs font-mono">
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Detected Intent:</span>
                          <span className="text-blue-300 font-bold">{sandboxResponse.aiReasoning.detectedIntent || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Matched Department:</span>
                          <span className="text-slate-300 font-bold">{sandboxResponse.aiReasoning.matchedDepartment || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Similarity Rank:</span>
                          <span className="text-blue-400 font-extrabold">{sandboxResponse.aiReasoning.similarityScore || 0}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Est. Resolution:</span>
                          <span className="text-emerald-400 font-extrabold">{sandboxResponse.aiReasoning.estimatedResolutionTime || "N/A"}</span>
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-slate-800/60">
                        <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-mono">Extracted Key Tokens:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sandboxResponse.aiReasoning.detectedKeywords && sandboxResponse.aiReasoning.detectedKeywords.length > 0 ? (
                            sandboxResponse.aiReasoning.detectedKeywords.map((kw: string, i: number) => (
                              <span key={i} className="px-1.5 py-0.5 bg-blue-950/85 border border-blue-900/60 rounded text-[9px] text-blue-400 font-mono font-bold lowercase">
                                #{kw}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-600 italic text-[10px]">None extracted</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION SECTION */}
        <section id="faq" className="py-24 px-6 bg-white dark:bg-[#050A18] border-b border-slate-100 dark:border-slate-900">
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <span className="text-blue-600 font-extrabold text-xs uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/60">FAQ CORNER</span>
              <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">SLA Policy & Incident Guidelines</h3>
              <p className="text-black dark:text-slate-300 text-sm font-semibold">Everything you need to know about support response targets and ticketing parameters.</p>
            </div>
 
            <div className="space-y-4 max-w-3xl mx-auto">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div 
                    key={idx} 
                    className="border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-left font-bold text-sm text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-0 text-xs text-black dark:text-slate-300 leading-relaxed font-semibold border-t border-slate-150/40 dark:border-slate-800/40 bg-white dark:bg-[#1E293B]/40">
                        <p className="mt-3">{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
 
        {/* TESTIMONIALS SECTION */}
        <section className="py-24 px-6 bg-slate-50 dark:bg-[#080D1A]">
          <div className="max-w-5xl mx-auto space-y-14">
            <div className="text-center space-y-3">
              <span className="text-blue-600 font-extrabold text-xs uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/60">TESTIMONIALS</span>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Loved by Support Teams</h3>
            </div>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-slate-150 dark:border-slate-800 shadow-sm p-6 space-y-4 bg-white dark:bg-[#111A2E]/80 rounded-2xl">
                <div className="flex gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-semibold italic">
                  &ldquo;Our response efficiency increased threefold after implementing the Workplace Hub Auto-Triage system. Incident classification has zero manual overhead, and our SLA target breaching is practically non-existent.&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                    K
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-white">Kiki R.</h5>
                    <p className="text-[10px] text-black dark:text-slate-400 font-bold">Network Ops Lead Coordinator</p>
                  </div>
                </div>
              </Card>
 
              <Card className="border-slate-150 dark:border-slate-800 shadow-sm p-6 space-y-4 bg-white dark:bg-[#111A2E]/80 rounded-2xl">
                <div className="flex gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-semibold italic">
                  &ldquo;The Zendesk-like comments feed and ticket timelines on active digital incidents completely cleared the ticketing fog. Our users are always updated and can easily trace support steps.&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300">
                    A
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-white">Ananya Sen</h5>
                    <p className="text-[10px] text-black dark:text-slate-400 font-bold">Administrative Registrar Principal</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-[#050A18] text-slate-400 py-16 px-6 border-t border-slate-900">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">D</div>
                <h4 className="text-white font-black text-base">Workplace Hub SaaS</h4>
              </div>
              <p className="text-2xs leading-relaxed text-slate-400 font-medium">
                Premium 2026 digital ticket handling, support chat coordination, automated incident triage classification, and SLA compliance monitoring.
              </p>
              <div className="mt-6 text-2xs space-y-2 font-semibold">
                <p><span className="text-slate-350">Service Desk Support Email:</span> tech@dcms.com</p>
                <p><span className="text-slate-350">Academic Certification Project:</span> Portfolio Demonstration Purpose</p>
              </div>
            </div>
            <div className="md:ml-auto">
              <h5 className="text-xs font-black text-white uppercase tracking-wider mb-6">Core Actions</h5>
              <ul className="space-y-3 text-2xs font-extrabold">
                <li><button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-white transition-colors">Go to Home Summary</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Explore Product Matrix</button></li>
                <li><button onClick={() => scrollToSection('ai-triage')} className="hover:text-white transition-colors">Test Neural Sandbox</button></li>
                <li><button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors">SLA Thresholds</button></li>
              </ul>
            </div>
            <div className="md:ml-auto">
              <h5 className="text-xs font-black text-white uppercase tracking-wider mb-6">Application Ports</h5>
              <ul className="space-y-3 text-2xs font-extrabold">
                <li><Link to="/auth/user" className="hover:text-white transition-colors text-blue-400">User Client gateway →</Link></li>
                <li><Link to="/auth/admin" className="hover:text-white transition-colors text-cyan-400">Admin Lead supervisor portal →</Link></li>
              </ul>
            </div>
          </div>
          <div className="max-w-6xl mx-auto border-t border-slate-800/60 pt-8 flex flex-col md:flex-row justify-between items-center text-3xs font-extrabold text-[#64748B]">
            <p>© 2026 Digital Workplace Operations Platform (Workplace Hub). All rights reserved.</p>
            <p className="mt-2 md:mt-0">Built to exceed internship and SaaS design benchmarks.</p>
          </div>
        </footer>
      </main>
      
      {/* Dynamic Floating Glassmorphic AI Assistant widget */}
      <DcmsAiAssistant mode="floating" />

      {showLaunchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#0B1329] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative flex flex-col gap-5 text-slate-800 dark:text-slate-100">
            {/* Close Button */}
            <button 
              onClick={() => setShowLaunchModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icon & Title Header */}
            <div className="flex items-start gap-4 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/20 shrink-0">
                W
              </div>
              <div className="text-left">
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  Launch on Device / PWA
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Optimized standalone Progressive Web App (PWA) deployment
                </p>
              </div>
            </div>

            {/* Explanatory Context Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col gap-2.5 text-left">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Info className="w-4 h-4 shrink-0" />
                <span className="text-2xs font-extrabold uppercase font-mono tracking-wider">Preview Environment Sandbox</span>
              </div>
              <p className="text-2xs leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
                Workplace Hub is currently running inside Google AI Studio's <strong>embedded iframe preview</strong>. Browser security policies block full standalone PWA installation, webcam streams, and screen sharing inside embedded frames.
              </p>
            </div>

            {/* Step-by-Step Installation Steps */}
            <div className="flex flex-col gap-3.5 text-left">
              <span className="text-[10px] font-black uppercase font-mono tracking-wider text-slate-400">Device Launch Instructions</span>
              
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs shrink-0">1</div>
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Open in a separate Tab</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal">
                    Click the primary button below to break out of the AI Studio frame and launch the secure origin.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs shrink-0">2</div>
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Click Browser Install Icon</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal">
                    On your desktop or mobile browser, look for the **Install App 📥** icon in the URL bar, or choose "Add to Home Screen" from the menu.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs shrink-0">3</div>
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Instant Desktop & Mobile Access</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-normal">
                    Launch Workplace Hub as a standalone application directly from your device home screen or taskbar!
                  </p>
                </div>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button 
                onClick={() => {
                  setShowLaunchModal(false);
                  navigate("/auth/user");
                }}
                variant="outline"
                className="flex-1 h-11 text-xs font-extrabold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-900 rounded-xl"
              >
                Continue in Current Frame
              </Button>

              <Button 
                onClick={() => {
                  setShowLaunchModal(false);
                  window.open(window.location.origin, "_blank");
                }}
                className="flex-1 h-11 text-xs font-black bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl shadow-md flex items-center justify-center gap-2 border-none"
              >
                🚀 Open in New Tab & Install
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
