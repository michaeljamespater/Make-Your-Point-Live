import React, { useState, useEffect } from "react";
import {
  X,
  Flame,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Award,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Heart,
  HelpCircle,
  Code,
  Lock,
  Key,
  ArrowLeft
} from "lucide-react";
import { motion } from "motion/react";

interface MonetizationDashboardProps {
  onClose: () => void;
  onSelectPoint?: (pointId: string) => void;
  isEditorMode?: boolean;
  onToggleEditorMode?: () => void;
}

interface MonetizationStats {
  isStripeConfigured: boolean;
  publishableKeyPlaceholder: string;
  globalSponsorshipsTotal: number;
  globalSponsorshipsCount: number;
  topSponsoredPoints: {
    id: string;
    title: string;
    authorMoniker: string;
    category: string;
    sponsorshipsTotal: number;
    sponsorshipsCount: number;
  }[];
}

export default function MonetizationDashboard({
  onClose,
  onSelectPoint,
  isEditorMode = false,
  onToggleEditorMode
}: MonetizationDashboardProps) {
  const [stats, setStats] = useState<MonetizationStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"metrics" | "paypal" | "integration">("metrics");
  const [paypalEmail, setPaypalEmail] = useState<string>(() => {
    try { return localStorage.getItem("paypal_account_email") || ""; } catch (e) { return ""; }
  });
  const [paypalMe, setPaypalMe] = useState<string>(() => {
    try { return localStorage.getItem("paypal_me_link") || ""; } catch (e) { return ""; }
  });
  const [savedPaypal, setSavedPaypal] = useState<boolean>(false);

  // Owner Authentication State
  const [isOwnerAuth, setIsOwnerAuth] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");
  const [storedPin, setStoredPin] = useState<string>(() => {
    try { return localStorage.getItem("owner_access_pin") || "1234"; } catch (e) { return "1234"; }
  });
  const [newPinInput, setNewPinInput] = useState<string>("");
  const [pinChangeSuccess, setPinChangeSuccess] = useState<boolean>(false);

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === storedPin) {
      setIsOwnerAuth(true);
      setPinError("");
    } else {
      setPinError("Invalid PIN. Try again.");
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.trim().length >= 4) {
      localStorage.setItem("owner_access_pin", newPinInput.trim());
      setStoredPin(newPinInput.trim());
      setNewPinInput("");
      setPinChangeSuccess(true);
      setTimeout(() => setPinChangeSuccess(false), 3000);
    }
  };

  const handleSavePaypal = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = paypalEmail.trim();
    const cleanMe = paypalMe.replace(/^https?:\/\/(www\.)?paypal\.me\//i, '').trim();

    localStorage.setItem("paypal_account_email", cleanEmail);
    localStorage.setItem("paypal_me_link", cleanMe);

    try {
      await fetch("/api/config/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paypalEmail: cleanEmail,
          paypalMeLink: cleanMe
        })
      });
      setSavedPaypal(true);
      setTimeout(() => setSavedPaypal(false), 4000);
    } catch (err) {
      console.error("Error saving paypal to server:", err);
      setSavedPaypal(true);
    }
  };

  useEffect(() => {
    fetchMonetizationStats();
    fetchPaypalConfig();
  }, []);

  const fetchPaypalConfig = async () => {
    try {
      const res = await fetch("/api/config/paypal");
      if (res.ok) {
        const data = await res.json();
        if (data.paypalEmail) setPaypalEmail(data.paypalEmail);
        if (data.paypalMeLink) setPaypalMe(data.paypalMeLink);
      }
    } catch (err) {
      console.error("Error fetching paypal config:", err);
    }
  };

  const fetchMonetizationStats = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/monetization/status");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching monetization stats:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto" id="monetization-dashboard-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-3xl bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        id="monetization-dashboard-container"
      >
        {/* Header section */}
        <div className="p-6 border-b border-brand-border/40 flex items-center justify-between shrink-0 bg-slate-900">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold shrink-0 shadow-sm"
              id="back-monetization-dashboard"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back</span>
            </button>
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-display font-black text-white uppercase flex items-center gap-2">
                <span>Page: Donate Fuel</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">Restricted Access</span>
              </h3>
              <p className="text-xs text-gray-300 font-medium">Private revenue statistics, creator sponsorships, and payout account settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
            id="close-monetization-dashboard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isOwnerAuth ? (
          /* Owner PIN Lock Gate */
          <div className="p-8 flex flex-col items-center justify-center text-center my-auto space-y-6 max-w-md mx-auto">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 shadow-xl shadow-amber-500/10">
              <Lock className="w-10 h-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-bold text-white font-display">Owner Authentication Required</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                This portal is strictly confidential to the site owner. Enter your private Owner PIN to manage PayPal payouts and view earnings.
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="w-full space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Enter Owner PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full bg-slate-950 border border-brand-border/50 rounded-xl px-4 py-3 text-center text-sm font-mono tracking-widest text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                  autoFocus
                />
                {pinError && (
                  <p className="text-xs text-red-400 font-bold mt-2 font-mono">{pinError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Unlock Owner Revenue Portal
              </button>
            </form>

            <p className="text-[10px] text-gray-400 font-mono">
              🔒 Standard visitors & supporters cannot view your revenue or PayPal payout email.
            </p>
          </div>
        ) : (
          /* Unlocked Owner Portal Content */
          <>
            {/* Tab navigation */}
        <div className="px-6 border-b border-brand-border/20 flex gap-4 shrink-0 bg-brand-bg/20 overflow-x-auto">
          <button
            onClick={() => setActiveTab("metrics")}
            className={`py-3.5 text-xs font-bold font-mono border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === "metrics"
                ? "border-brand-accent text-brand-accent"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Sponsorship Metrics
          </button>
          <button
            onClick={() => setActiveTab("paypal")}
            className={`py-3.5 text-xs font-bold font-mono border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === "paypal"
                ? "border-blue-500 text-blue-400 font-extrabold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono text-[10px] border border-blue-500/30">PayPal</span>
            <span>PayPal Account Setup</span>
          </button>
          <button
            onClick={() => setActiveTab("integration")}
            className={`py-3.5 text-xs font-bold font-mono border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === "integration"
                ? "border-brand-accent text-brand-accent"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            Stripe Integration Setup
          </button>
        </div>

        {/* Scroll Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-24 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
              <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono font-medium">Scanning financial index ledger...</span>
            </div>
          ) : (
            <>
              {activeTab === "metrics" ? (
                <div className="space-y-6">
                  {/* Editor mode — delete/edit any point */}
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-amber-400 uppercase font-mono">Editor Mode</h4>
                      <p className="text-xs text-gray-300 mt-1">
                        When on, you can delete or edit any point on the site. Turn off when finished.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleEditorMode && onToggleEditorMode()}
                      className={`px-4 py-2 text-xs font-black uppercase tracking-wide border cursor-pointer shrink-0 ${
                        isEditorMode
                          ? "bg-amber-500 text-slate-950 border-amber-400"
                          : "bg-slate-900 text-slate-200 border-slate-600"
                      }`}
                    >
                      {isEditorMode ? "Editor ON" : "Editor OFF"}
                    </button>
                  </div>

                  {/* Highlight KPI Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-brand-bg/50 border border-brand-border/30 rounded-2xl space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Total Funds Raised</span>
                      <div className="text-2xl font-bold font-mono text-brand-accent-glow">
                        £{(stats?.globalSponsorshipsTotal || 0).toFixed(2)}
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono">Synced from Firestore</p>
                    </div>

                    <div className="p-4 bg-brand-bg/50 border border-brand-border/30 rounded-2xl space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Total Transactions</span>
                      <div className="text-2xl font-bold font-mono text-white">
                        {stats?.globalSponsorshipsCount || 0}
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono">Micro-sponsorships</p>
                    </div>

                    <div className="p-4 bg-brand-bg/50 border border-brand-border/30 rounded-2xl space-y-1">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Gateway Status</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`w-2 h-2 rounded-full ${stats?.isStripeConfigured ? "bg-green-500" : "bg-orange-500"}`} />
                        <span className="text-sm font-bold font-mono text-white">
                          {stats?.isStripeConfigured ? "Live (Stripe)" : "Sandbox Test Mode"}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-mono">Togglable checkout rules</p>
                    </div>
                  </div>

                  {/* Top Fueled Points */}
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase font-mono font-bold text-gray-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-brand-accent" />
                      <span>Most Supported Creator Points</span>
                    </h4>

                    {stats?.topSponsoredPoints && stats.topSponsoredPoints.length > 0 ? (
                      <div className="space-y-2.5">
                        {stats.topSponsoredPoints.map((pt) => (
                          <div
                            key={pt.id}
                            className="p-4 bg-brand-bg/30 border border-brand-border/20 rounded-2xl flex items-center justify-between hover:border-brand-border/50 transition-colors"
                          >
                            <div className="space-y-1 pr-4 truncate">
                              <h5 className="text-xs font-semibold text-white truncate">{pt.title}</h5>
                              <p className="text-[10px] text-gray-400">
                                Proposed by <span className="font-semibold text-gray-300">{pt.authorMoniker}</span> • {pt.category}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-bold font-mono text-brand-accent-glow bg-brand-accent/5 border border-brand-accent/15 px-2.5 py-1 rounded-xl">
                                £{pt.sponsorshipsTotal.toFixed(2)}
                              </span>
                              <div className="text-[9px] text-gray-500 font-mono mt-1">{pt.sponsorshipsCount} sponsor(s)</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center border border-dashed border-brand-border/40 rounded-2xl bg-brand-bg/10 text-gray-500 text-xs">
                        No points have received financial sponsorship yet. Open a point's detail panel and click 'Fuel Point' to simulate the first tip!
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === "paypal" ? (
                /* PayPal Account Setup Tab */
                <div className="space-y-6">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-start gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400 shrink-0 font-black text-sm">
                      PayPal
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono">Collect Payouts directly via PayPal</h4>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        Link your <strong>PayPal Email</strong> or <strong>PayPal.me handle</strong> below. When supporters sponsor or tip your Points, they can pay directly into your PayPal account!
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSavePaypal} className="p-5 bg-slate-950 border border-brand-border/30 rounded-2xl space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <Coins className="w-4 h-4 text-blue-400" />
                      <span>Your PayPal Payout Credentials</span>
                    </h4>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                          PayPal Email Address
                        </label>
                        <input
                          type="email"
                          placeholder="e.g. myname@example.com"
                          value={paypalEmail}
                          onChange={(e) => setPaypalEmail(e.target.value)}
                          className="w-full bg-brand-bg/80 border border-brand-border/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">This email will be used to generate PayPal payment links & invoices for supporters.</p>
                      </div>

                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">
                          PayPal.me Link or Handle (Optional)
                        </label>
                        <div className="flex items-center">
                          <span className="bg-brand-bg/80 border border-r-0 border-brand-border/40 rounded-l-xl px-3 py-2.5 text-xs text-gray-400 font-mono">
                            paypal.me/
                          </span>
                          <input
                            type="text"
                            placeholder="yourname"
                            value={paypalMe.replace(/^https?:\/\/(www\.)?paypal\.me\//i, '')}
                            onChange={(e) => setPaypalMe(e.target.value)}
                            className="w-full bg-brand-bg/80 border border-brand-border/40 rounded-r-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Allows 1-click PayPal checkout directly from the Fuel Point modal!</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-brand-border/20">
                      <span className="text-xs text-green-400 font-mono font-bold">
                        {savedPaypal && "✓ PayPal credentials updated and active!"}
                      </span>
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                      >
                        Save PayPal Settings
                      </button>
                    </div>
                  </form>

                  {/* Change Owner Security PIN Card */}
                  <form onSubmit={handleChangePin} className="p-5 bg-slate-950 border border-amber-500/30 rounded-2xl space-y-3">
                    <h5 className="text-xs font-bold text-amber-400 uppercase font-mono flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-400" />
                      <span>Confidential Owner PIN Settings</span>
                    </h5>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Update your private Owner PIN used to unlock this Revenue Portal. Keep this secret so visitors cannot access your earnings or PayPal payout account.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="password"
                        placeholder="Enter New Owner PIN (min 4 chars)"
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        className="flex-1 bg-brand-bg/80 border border-brand-border/40 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-all shrink-0"
                      >
                        Update PIN
                      </button>
                    </div>
                    {pinChangeSuccess && (
                      <p className="text-xs text-green-400 font-bold font-mono">✓ Owner PIN updated successfully!</p>
                    )}
                  </form>

                  {/* PayPal Developer SDK Option */}
                  <div className="p-5 bg-brand-bg/40 border border-brand-border/20 rounded-2xl space-y-3">
                    <h5 className="text-xs font-bold text-white uppercase font-mono">Option B: Embedded PayPal Smart Payment Buttons (Developer Mode)</h5>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      If you prefer embedded PayPal Smart Buttons inside the app, add your PayPal Client ID into <code className="text-blue-400 font-mono bg-slate-950 px-1 py-0.5 rounded">.env.example</code>:
                    </p>
                    <pre className="p-3 bg-slate-950 border border-brand-border/20 rounded-xl text-[11px] font-mono text-gray-300 overflow-x-auto">
{`# Add to .env.example
PAYPAL_CLIENT_ID=your_paypal_live_client_id`}
                    </pre>
                  </div>
                </div>
              ) : (
                /* Integration Setup Tab */
                <div className="space-y-5">
                  <div className="p-4 bg-orange-500/10 border border-brand-accent/20 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-brand-accent-glow uppercase tracking-wider font-mono">Sandbox Mode Active</h4>
                      <p className="text-xs text-gray-300">
                        The platform is currently operating in <strong>Sandbox Mode</strong>. All test sponsorships directly write real, persistent transaction logs to Firebase Firestore, letting you test the complete end-to-end interface and update loop for free!
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs uppercase font-mono font-bold text-gray-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-brand-accent" />
                      <span>Configure Production Stripe Payments</span>
                    </h4>

                    <div className="space-y-3.5 text-xs text-gray-300">
                      <p>
                        To start accepting real debit and credit cards, deploy the Stripe API credentials to your runtime environment. The back-end Express server and front-end checkout button are fully compatible and ready.
                      </p>

                      <div className="p-4 bg-slate-950 border border-brand-border/20 rounded-2xl space-y-3">
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Required Environment Keys</span>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-brand-bg/80 border border-brand-border/20 rounded-xl">
                            <span className="font-mono text-[11px] text-brand-accent">STRIPE_SECRET_KEY</span>
                            <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-mono">Not Set</span>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-brand-bg/80 border border-brand-border/20 rounded-xl">
                            <span className="font-mono text-[11px] text-brand-accent">VITE_STRIPE_PUBLISHABLE_KEY</span>
                            <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 font-mono">Not Set</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pl-4 list-decimal">
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-brand-accent">1.</span>
                          <span>Set your credentials in your project's environment variables or custom configuration panel.</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-brand-accent">2.</span>
                          <span>Stripe checkout sessions will automatically activate and compile upon subsequent deployments!</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </>
    )}

        {/* Footer */}
        <div className="p-6 border-t border-brand-border/40 flex justify-between items-center shrink-0 bg-brand-bg/10">
          <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-accent" />
            <span>Fully compliant with The Gowd & Independent Mind principles</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-brand-accent text-slate-950 rounded-xl font-bold text-xs hover:bg-brand-accent-glow transition-colors cursor-pointer"
          >
            Close Deck
          </button>
        </div>
      </motion.div>
    </div>
  );
}
