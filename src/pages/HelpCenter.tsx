import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card.tsx";
import { Input } from "../../components/ui/input.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Badge } from "../../components/ui/badge.tsx";
import { 
  Search, BookOpen, ShieldCheck, Key, Laptop, HelpCircle, 
  ChevronRight, CalendarCheck, DollarSign, ArrowLeft 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Article {
  id: string;
  category: "IT" | "HR" | "Finance" | "Facilities";
  title: string;
  summary: string;
  content: string;
  icon: any;
}

const ARTICLES: Article[] = [
  {
    id: "kb_1",
    category: "IT",
    title: "VPN & Secure Remote Access Guide",
    summary: "How to connect securely from home using Cisco AnyConnect/Okta MFA.",
    icon: ShieldCheck,
    content: "Our organization enforces strict Multi-Factor Authentication (MFA) to access secure databases from exterior networks. \n\n1. Install the Cisco AnyConnect agent from the Software Center on your corporate laptop.\n2. Open Cisco AnyConnect and point to the host address 'vpn.workplacehub.com'.\n3. Input your primary Active Directory credentials.\n4. You will receive an Okta Push notification on your registered device. Approve the request.\n\nDisclaimer: Connections idle for more than 4 hours are automatically terminated for workstation audit safety."
  },
  {
    id: "kb_2",
    category: "IT",
    title: "Requesting Access & Folder Permissions",
    summary: "Process for obtaining server folder approvals and license registrations.",
    icon: Key,
    content: "To guarantee credential safety, folder privileges are mapped carefully down to active user roles. \n\n1. Determine the path of the folder or name of the repository (e.g., Finance Shared, Dev Repo).\n2. Submit an Access Request ticket from our Service Desk.\n3. Identify your direct reporting manager's approval email if available.\n4. Admin will review permissions and fulfill requests within 12-24 hours. A notification will log on your dashboard once access is granted."
  },
  {
    id: "kb_3",
    category: "HR",
    title: "How to Request Leave & Attendance Audits",
    summary: "Standard policy workflow for submitting vacation, sick leave, and missing punch reports.",
    icon: CalendarCheck,
    content: "Our attendance and leave ledger tracks active performance metrics. \n\n1. Ensure your proposed dates do not conflict with vital department deliverables.\n2. Submit a formal query using our 'Leave & Attendance' ticket category.\n3. The system captures your available PTO balances automatically.\n4. Approvals are parsed by HR managers within 48 hours. Urgent sick leave reports do not require prior scheduling but require medical file attachment where appropriate."
  },
  {
    id: "kb_4",
    category: "Finance",
    title: "Reimbursements & Payroll Discrepancies",
    summary: "What to do if your paycheck is delayed or expense reimbursements are pending.",
    icon: DollarSign,
    content: "Standard payroll processing completes by the 25th of every month.\n\n1. If a missing credit or incorrect deduction occurs, locate your payslip from the employee financial system.\n2. File a 'Salary & Payroll' request under the Service Desk.\n3. Supply your Employee ID, Bank Account confirmation, and the exact discrepancy balance details.\n4. For expense claims (travel, client meals), attach clear receipts with complete manager signature. Approvals are settled in the next active payroll cycle."
  },
  {
    id: "kb_5",
    category: "Facilities",
    title: "Hardware Equipment & Laptop Standard Issues",
    summary: "Requesting key replacements, second monitors, or report workstation failures.",
    icon: Laptop,
    content: "We provide high-grade workstations for corporate operations.\n\n1. If your machine fails to boot or suffers physical damage, do not attempt manual repair. Use the Service Desk to draft a ticket.\n2. To request auxiliary hardware (keyboard, mouse, mousepad, secondary screens): select Category: Procurement Requests / Department: Procurement.\n3. Describe the technical need clearly.\n4. If approved, equipment is dispatched directly to your registered seating coordinate."
  }
];

export default function HelpCenter() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const navigate = useNavigate();

  const filtered = ARTICLES.filter(art => {
    const matchesCategory = activeCategory === "All" || art.category === activeCategory;
    const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          art.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          art.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" />
            📚 Workplace Knowledge Base
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search official documentation guides, standard operations handbooks, and system setup help.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)} 
          className="rounded-xl border-slate-200 dark:border-slate-800 text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
        </Button>
      </div>

      {selectedArticle ? (
        <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111A2E]/50 shadow-md rounded-2xl p-6 space-y-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedArticle(null)}
            className="text-blue-500 h-8 px-2 hover:bg-transparent hover:text-blue-600 font-bold text-xs"
          >
            ← Back to Articles list
          </Button>
          
          <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Badge className="bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 uppercase tracking-wider font-extrabold text-[9px] px-2 py-0.5">
              {selectedArticle.category} Documentation
            </Badge>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{selectedArticle.title}</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300">{selectedArticle.summary}</p>
          </div>

          <div className="text-xs md:text-sm text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-line pt-2 font-medium">
            {selectedArticle.content}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-700 dark:text-slate-300">Was this article helpful?</span>
              <Button size="sm" variant="outline" className="text-xs h-7 px-2.5 rounded-lg border-slate-200 dark:border-slate-800">👍 Yes</Button>
              <Button size="sm" variant="outline" className="text-xs h-7 px-2.5 rounded-lg border-slate-200 dark:border-slate-800">👎 No</Button>
            </div>
            
            <Button 
              onClick={() => navigate('/dashboard/register', { state: { title: "Regarding: " + selectedArticle.title, description: "I've reviewed the articles guide but need further manual assistance:\n\n" } })}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl h-8 px-4"
            >
              Need more help? Submit Ticket
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              type="text" 
              placeholder="Search guides, setup directories, policies..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 h-11 text-xs bg-slate-50/50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 rounded-2xl"
            />
          </div>

          {/* Categories Tab */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {["All", "IT", "HR", "Finance", "Facilities"].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`py-1.5 px-3.5 rounded-full text-xs font-bold transition-all border shrink-0 ${
                  activeCategory === cat 
                    ? "bg-blue-500 border-blue-500 text-white shadow-xs" 
                    : "bg-slate-50 dark:bg-[#161F30] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                {cat === "All" ? "📖 View All" : cat}
              </button>
            ))}
          </div>

          {/* Grid of Articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(art => {
              const ArtIcon = art.icon;
              return (
                <Card 
                  key={art.id} 
                  onClick={() => setSelectedArticle(art)}
                  className="border-slate-100 hover:border-slate-250 hover:bg-slate-50/30 dark:border-slate-850 dark:bg-[#111A2E]/30 dark:hover:bg-slate-850/20 shadow-xs rounded-2xl transition-all cursor-pointer p-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 dark:text-blue-400 flex items-center justify-center">
                        <ArtIcon className="w-5 h-5" />
                      </div>
                      <Badge className="bg-slate-100 hover:bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[8.5px] uppercase font-bold px-2 py-0.5">
                        {art.category} Standard
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-150 text-sm">{art.title}</h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{art.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-black text-blue-500 hover:text-blue-600 mt-4 transition-colors">
                    Read Article <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </Card>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white dark:bg-[#111A2E]/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
                <span className="text-4xl mb-4">🔍</span>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1">No guides found</h4>
                <p className="text-[#94A3B8] max-w-xs mx-auto text-xs">
                  We couldn't locate any documentation matching '{searchTerm}'. Try refining your keywords.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
