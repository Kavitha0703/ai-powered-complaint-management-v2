import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.ts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card.tsx";
import { Button } from "../../components/ui/button.tsx";
import { Input } from "../../components/ui/input.tsx";
import { useAuth, ADMIN_EMAILS } from "../lib/AuthContext.tsx";
import { Shield, User, Mail, Lock, ArrowLeft, Sparkles, CheckCircle2, Ticket, ChevronRight, HelpCircle } from "lucide-react";
import { isEmailAdmin, getAdminInvites, saveAdminInvites } from "../lib/AdminManagementHelper.ts";

export default function AuthPage({ isAdmin }: { isAdmin?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot">("login");
  const { user, dbUser } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const isUserAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(cleanEmail) || isEmailAdmin(cleanEmail);
    
    if (isAdmin && !isUserAdmin) return setError("Unauthorized admin account.");
    if (!isAdmin && isUserAdmin) return setError("This email belongs to an administrator. Please use Admin Portal.");

    try {
      setLoading(true);
      setError("");
      setMsg("");
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
         if (error.message.includes('Email not confirmed')) {
            setError("Please verify your email address to sign in. Check your inbox for a confirmation link.");
         } else {
            setError(error.message);
         }
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials or access denied.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const isUserAdmin = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(cleanEmail) || isEmailAdmin(cleanEmail);

    if (isAdmin && !isUserAdmin) return setError("Unauthorized admin account.");
    if (!isAdmin && isUserAdmin) return setError("This email belongs to an administrator. Please use Admin Portal.");
    
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }
    try {
      setLoading(true);
      setError("");
      setMsg("");
      const { error } = await supabase.auth.signUp({
        email: cleanEmail, 
        password,
        options: { data: { name, full_name: name } }
      });
      if (error) {
        setError(error.message);
      } else {
        // Successful sign up. If they were a pending admin invite, activate it!
        const invites = getAdminInvites();
        const pendingIdx = invites.findIndex(i => i.email.toLowerCase() === cleanEmail && i.status === "Pending");
        if (pendingIdx !== -1) {
          invites[pendingIdx].status = "Active";
          invites[pendingIdx].name = name || cleanEmail.split("@")[0];
          invites[pendingIdx].last_active = "Just now";
          saveAdminInvites(invites);
          setMsg("Administrator registration complete! Check your inbox to confirm your account (or sign in directly).");
        } else {
          setMsg("Check your inbox to confirm your account and complete registration.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Please enter an email to reset password.");
    try {
       setLoading(true);
       setError("");
       setMsg("");
       const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
       if (error) setError(error.message);
       else setMsg("Password reset link sent to your email.");
    } catch (err: any) {
       setError(err.message || "Failed to send reset link.");
    } finally {
       setLoading(false);
    }
  };

  const useDemoAccount = () => {
    setEmail("testdemo@admin.local");
    setPassword("TestDemo123@");
    setError("");
    setMsg("Evaluation keys applied. Click 'Submit Access' to log in.");
  };

  return (
    <div id="auth_portal_wrapper" className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[#020617] font-sans antialiased text-slate-100">
      
      {/* LEFT COLUMN: HERO MARKETING/ILLUSTRATION PLATFORM DRAWER */}
      <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-12 overflow-hidden bg-[#0B132B] border-r border-slate-800/80">
        
        {/* Animated Aurora Glow Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[350px] h-[350px] bg-cyan-500 rounded-full mix-blend-screen filter blur-[100px] opacity-20"></div>

        <div className="relative z-15 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-black text-white text-xs shadow-md shadow-blue-500/20">
            D
          </div>
          <span className="text-sm font-black tracking-wider text-white uppercase">DCMS Portal</span>
        </div>

        <div className="relative z-15 space-y-8 my-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-950/60 border border-blue-900/40 text-cyan-200 rounded-full text-[10px] font-extrabold tracking-wider uppercase shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              Sentry Grade Platform
            </div>
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Incident Management <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">Exceeding SLA Targets.</span>
            </h2>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed max-w-sm">
              SaaS dashboard with cognitive incident classifiers, resolution tracking timers, and real-time support discussion grids.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800/60">
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded bg-blue-950 flex items-center justify-center border border-blue-800 text-blue-400 shrink-0 mt-0.5">
                <Ticket className="w-3.5 h-3.5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-200">Continuous Auditing</h5>
                <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed">Dynamic severity ranking ensures critical incidents escalate in minutes.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded bg-blue-950 flex items-center justify-center border border-blue-800 text-blue-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-200">Zendesk-Style Timeline</h5>
                <p className="text-[10px] text-slate-450 mt-0.5 leading-relaxed">Integrated messaging timeline gives users absolute transparency on progress.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-15 text-3xs font-extrabold text-slate-500 flex justify-between">
          <span>Enterprise Incident Resolution v2.0</span>
          <span>© 2026 DCMS SaaS Inc.</span>
        </div>
      </div>

      {/* RIGHT COLUMN: MAIN FORM PORTAL */}
      <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 md:p-20 relative overflow-hidden bg-gradient-to-b from-[#020617] to-[#0B1530]">
        
        {/* Decorative backdrop mesh */}
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-500 rounded-full mix-blend-screen filter blur-[120px] opacity-10"></div>
        
        {/* Top Header Controls */}
        <div className="flex justify-between items-center relative z-20">
          <Button 
            variant="ghost" 
            className="text-slate-450 hover:text-slate-100 hover:bg-slate-800/40 text-xs font-bold rounded-xl"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>

          <Button
            variant="outline"
            className="text-2xs font-bold border-slate-800 hover:bg-slate-850 bg-slate-900/50 hover:text-white rounded-xl h-8 px-3 cursor-pointer text-slate-400"
            onClick={() => {
              if (isAdmin) navigate("/auth/user");
              else navigate("/auth/admin");
            }}
          >
            {isAdmin ? "User Portal →" : "Admin Portal →"}
          </Button>
        </div>

        {/* Auth Box Center Container */}
        <div className="w-full max-w-md mx-auto my-auto py-10 relative z-20">
          
          {(!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-900/60 rounded-2xl text-red-350 text-xs">
              <b className="font-extrabold block mb-1">Missing Connection Settings</b>
              Specify <code className="bg-red-950 px-1 rounded text-red-400 text-3xs">VITE_SUPABASE_URL</code> in your project environment to activate cloud integrations.
            </div>
          )}

          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {isAdmin ? "Administrator Gate" : "Welcome Back"}
            </h1>
            <p className="text-slate-400 text-xs font-semibold mt-1.5">
              {isAdmin ? "Evaluate operations, resolve breaching SLA tickets, and manage notices" : "File operational requests, monitor resolution SLA count, and view system notices."}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/30 border border-red-905/40 text-red-400 rounded-xl text-xs font-semibold flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}
          {msg && (
            <div className="mb-4 p-3 bg-emerald-950/30 border border-emerald-905/40 text-emerald-400 rounded-xl text-xs font-semibold flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
              <span>{msg}</span>
            </div>
          )}

          {email.trim() && getAdminInvites().find(i => i.email.toLowerCase() === email.trim().toLowerCase() && i.status === "Pending") && (
            <div className="mb-4 p-3 bg-indigo-950/50 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-semibold flex flex-col gap-1.5 animate-pulse">
              <span className="flex items-center gap-1.5 text-indigo-200 font-extrabold uppercase tracking-wider text-[10px]">
                📥 Dynamic Administrator Invite Recognized!
              </span>
              <p className="text-[11px] text-slate-300 font-medium">
                Role Assignment: <span className="uppercase font-bold text-teal-300 px-1.5 py-0.5 rounded bg-teal-950/40 border border-teal-850">{getAdminInvites().find(i => i.email.toLowerCase() === email.trim().toLowerCase())?.role.replace('_', ' ')}</span>
              </p>
              <p className="text-[10px] text-slate-400">Toggle to the "Sign Up" tab, select a password, and click Submit to complete onboarding.</p>
            </div>
          )}

          {/* Quick Demo Assist Banner for Admin only */}
          {isAdmin && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col justify-between gap-1.5">
              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-extrabold text-amber-500">Evaluation Mode Admin</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Review the platform using our dedicated admin test seed.</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono bg-slate-950/50 p-2 rounded-xl mt-1.5 border border-slate-900/60">
                <div className="text-[10px] text-slate-300">
                  <span className="text-slate-500">U:</span> testdemo@admin.local<br/>
                  <span className="text-slate-500">P:</span> TestDemo123@
                </div>
                <Button 
                  size="sm" 
                  onClick={useDemoAccount}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10px] font-black h-7 px-2.5 rounded-lg cursor-pointer"
                >
                  Apply
                </Button>
              </div>
            </div>
          )}

          {/* Luxury UI Tabs */}
          <div className="bg-[#0D1527]/80 rounded-2xl p-1.5 border border-slate-800/80 mb-6 flex gap-1">
            <button
              onClick={() => { setActiveTab("login"); setError(""); setMsg(""); }}
              className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition-all ${activeTab === "login" ? "bg-blue-600 font-extrabold text-white shadow-md shadow-blue-600/10" : "text-slate-400 hover:text-slate-200"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab("register"); setError(""); setMsg(""); }}
              className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition-all ${activeTab === "register" ? "bg-blue-600 font-extrabold text-white shadow-md shadow-blue-600/10" : "text-slate-400 hover:text-slate-200"}`}
            >
              Sign Up
            </button>
            <button
              onClick={() => { setActiveTab("forgot"); setError(""); setMsg(""); }}
              className={`flex-1 py-2 text-center text-xs font-black rounded-xl transition-all ${activeTab === "forgot" ? "bg-blue-600 font-extrabold text-white shadow-md shadow-blue-600/10" : "text-slate-400 hover:text-slate-200"}`}
            >
              Reset
            </button>
          </div>

          <Card className="border-slate-800/60 bg-slate-900/40 backdrop-blur-md rounded-2xl shadow-xl">
            <CardContent className="pt-6">
              
              {activeTab === "login" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-3">
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <Input 
                        type="email" 
                        placeholder="Enterprise email address" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        className="bg-slate-950 border-slate-800/80 rounded-xl pl-10 focus:ring-blue-500 text-xs h-10 text-white"
                      />
                    </div>
                    
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <Input 
                        type="password" 
                        placeholder="Secure password key" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        className="bg-slate-950 border-slate-800/80 rounded-xl pl-10 focus:ring-blue-500 text-xs h-10 text-white"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs h-10 rounded-xl shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer" 
                    disabled={loading}
                  >
                    <span>Submit Access Credential</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </form>
              )}

              {activeTab === "register" && (
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-3">
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <Input 
                        type="text" 
                        placeholder="Your full name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        required 
                        className="bg-slate-950 border-slate-800/80 rounded-xl pl-10 focus:ring-blue-500 text-xs h-10 text-white"
                      />
                    </div>

                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <Input 
                        type="email" 
                        placeholder="Your operating email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        className="bg-slate-950 border-slate-800/80 rounded-xl pl-10 focus:ring-blue-500 text-xs h-10 text-white"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <Input 
                        type="password" 
                        placeholder="Select secure password link" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                        className="bg-slate-950 border-slate-800/80 rounded-xl pl-10 focus:ring-blue-500 text-xs h-10 text-white"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <Input 
                        type="password" 
                        placeholder="Re-type password link to confirm" 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        required 
                        className="bg-slate-950 border-slate-800/80 rounded-xl pl-10 focus:ring-blue-500 text-xs h-10 text-white"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs h-10 rounded-xl shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer" 
                    disabled={loading}
                  >
                    <span>Generate Workspace Account</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </form>
              )}

              {activeTab === "forgot" && (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      Enter your authorized email to receive an instant recovery link to reset your account password.
                    </p>
                    
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <Input 
                        type="email" 
                        placeholder="Registered system email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required 
                        className="bg-slate-950 border-slate-800/80 rounded-xl pl-10 focus:ring-blue-500 text-xs h-10 text-white"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs h-10 rounded-xl shadow-lg shadow-blue-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer" 
                    disabled={loading}
                  >
                    <span>Send Verification Reset Mail</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </form>
              )}

            </CardContent>
          </Card>

        </div>

        {/* Footer info links */}
        <div className="relative z-20 text-[10px] text-slate-500 flex flex-wrap justify-between gap-2 border-t border-slate-900/60 pt-4 font-semibold">
          <span>Enterprise Secure Assertion Integration</span>
          <span className="flex items-center gap-1 cursor-pointer hover:text-slate-400"><HelpCircle className="w-3 h-3" /> SLA Policies & Security Audit</span>
        </div>

      </div>

    </div>
  );
}
