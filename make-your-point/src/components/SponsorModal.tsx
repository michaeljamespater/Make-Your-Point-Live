import React, { useState } from "react";
import { Point } from "../types";
import {
  X,
  Coins,
  Flame,
  MessageSquare,
  ShieldCheck,
  Code,
  Terminal,
  Heart,
  HelpCircle,
  Copy,
  Check,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SponsorModalProps {
  point: Point;
  onClose: () => void;
  onSponsorshipSuccess: (newTotal: number, newCount: number) => void;
}

export default function SponsorModal({
  point,
  onClose,
  onSponsorshipSuccess
}: SponsorModalProps) {
  const [amount, setAmount] = useState<number>(5);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [moniker, setMoniker] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [paypalMeLink, setPaypalMeLink] = useState<string>(() => {
    try { return localStorage.getItem("paypal_me_link") || ""; } catch (e) { return ""; }
  });
  const [paypalEmail, setPaypalEmail] = useState<string>(() => {
    try { return localStorage.getItem("paypal_account_email") || ""; } catch (e) { return ""; }
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"sandbox" | "paypal" | "stripe">(() => {
    try {
      const savedMe = localStorage.getItem("paypal_me_link");
      const savedEmail = localStorage.getItem("paypal_account_email");
      return (savedMe || savedEmail) ? "paypal" : "sandbox";
    } catch (e) {
      return "sandbox";
    }
  });

  React.useEffect(() => {
    fetch("/api/config/paypal")
      .then(res => res.json())
      .then(data => {
        let hasPaypal = false;
        if (data.paypalEmail) {
          setPaypalEmail(data.paypalEmail);
          try { localStorage.setItem("paypal_account_email", data.paypalEmail); } catch (e) {}
          hasPaypal = true;
        }
        if (data.paypalMeLink) {
          setPaypalMeLink(data.paypalMeLink);
          try { localStorage.setItem("paypal_me_link", data.paypalMeLink); } catch (e) {}
          hasPaypal = true;
        }
        if (hasPaypal) {
          setMode("paypal");
        }
      })
      .catch(console.error);
  }, []);

  const presetAmounts = [3, 5, 10, 25];

  const handleAmountSelect = (val: number) => {
    setAmount(val);
    setIsCustom(false);
  };

  const handleCustomChange = (val: string) => {
    setCustomAmount(val);
    setIsCustom(true);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
    } else {
      setAmount(0);
    }
  };

  const handleCopyEnv = () => {
    const envText = `# Environment Configuration for Real Stripe Payments\nSTRIPE_SECRET_KEY=sk_live_...\nVITE_STRIPE_PUBLISHABLE_KEY=pk_live_...\nSTRIPE_WEBHOOK_SECRET=whsec_...`;
    navigator.clipboard.writeText(envText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError("Please specify a valid support amount.");
      return;
    }

    if (mode === "stripe") {
      setError("Stripe is not connected yet. Use Sandbox or PayPal.");
      return;
    }

    if (mode === "paypal" && !paypalMeLink && !paypalEmail) {
      setError("Owner has not set a PayPal link yet. Use Sandbox mode to test.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/points/${point.id}/sponsor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: "GBP",
          authorMoniker: moniker.trim() || undefined,
          message: message.trim() || undefined,
          mode
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        setError(errData.error || "Failed to process sponsorship.");
        return;
      }

      const data = await response.json();
      onSponsorshipSuccess(
        data.total ?? (point.sponsorshipsTotal || 0) + amount,
        data.count ?? (point.sponsorshipsCount || 0) + 1
      );

      if (mode === "paypal") {
        let url = "";
        if (paypalMeLink) {
          const clean = paypalMeLink.replace(/^https?:\/\/(www\.)?paypal\.me\//i, "").replace(/\/$/, "");
          url = `https://www.paypal.me/${clean}/${amount.toFixed(2)}GBP`;
        } else if (paypalEmail) {
          url = `https://www.paypal.com/donate/?business=${encodeURIComponent(paypalEmail)}&currency_code=GBP&amount=${amount.toFixed(2)}`;
        }
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto" id="sponsor-modal-overlay">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        id="sponsor-modal-container"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-brand-border/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold shrink-0 shadow-sm"
              id="back-sponsor-modal"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Back</span>
            </button>
            <div className="p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-brand-accent">
              <Flame className="w-5 h-5 text-brand-accent-glow" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-white">Fuel This Point</h3>
              <p className="text-xs text-gray-400">Directly back creators & elevate constructive discourse</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-brand-bg border border-brand-border/30 text-gray-400 hover:text-white transition-colors cursor-pointer"
            id="close-sponsor-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Target Point Detail Summary */}
          <div className="p-4 bg-brand-bg/50 border border-brand-border/30 rounded-2xl">
            <span className="text-[9px] font-mono uppercase tracking-wider text-brand-accent-glow font-bold">Supporting Point:</span>
            <h4 className="text-sm font-semibold text-white mt-1 line-clamp-1">{point.title}</h4>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">By {point.authorMoniker} • {point.category}</p>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success-state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="py-8 text-center space-y-4"
              >
                <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 text-green-400 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white">Sponsorship Confirmed!</h4>
                  <p className="text-sm text-gray-400 max-w-sm mx-auto">
                    You have successfully fueled this point with <span className="text-brand-accent-glow font-bold font-mono">£{amount.toFixed(2)}</span>.
                  </p>
                </div>
                <div className="p-4 bg-brand-bg/40 border border-brand-border/20 rounded-xl max-w-md mx-auto text-xs text-gray-400 space-y-2">
                  <p className="font-mono text-[10px] text-green-400">✓ Real-time database synchronisation completed</p>
                  <p className="font-mono text-[10px] text-green-400">✓ Parent point sponsorships metadata incremented</p>
                  <p>Your support message has been listed in the point's financial ledger.</p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-brand-accent text-slate-950 rounded-xl font-bold hover:bg-brand-accent-glow cursor-pointer transition-colors"
                >
                  Return to Forum
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form-state"
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                {/* Integration Mode Toggle */}
                <div className="flex bg-brand-bg p-1 rounded-xl border border-brand-border/30 gap-1 shrink-0 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setMode("sandbox")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer shrink-0 ${
                      mode === "sandbox"
                        ? "bg-brand-accent/15 border border-brand-accent/30 text-brand-accent-glow"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Sandbox Test Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("paypal")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer shrink-0 ${
                      mode === "paypal"
                        ? "bg-blue-500/20 border border-blue-500/40 text-blue-400 font-extrabold"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <span className="font-black text-xs">PayPal</span>
                    <span>PayPal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("stripe")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer shrink-0 ${
                      mode === "stripe"
                        ? "bg-brand-accent/15 border border-brand-accent/30 text-brand-accent-glow"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Stripe Live</span>
                  </button>
                </div>

                {mode === "sandbox" ? (
                  <div className="space-y-4">
                    {/* Select Amount Panel */}
                    <div className="space-y-2.5">
                      <label className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold">Select Support Amount (GBP)</label>
                      <div className="grid grid-cols-4 gap-2.5">
                        {presetAmounts.map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleAmountSelect(val)}
                            className={`py-3.5 rounded-2xl font-bold font-mono text-sm border transition-all cursor-pointer ${
                              !isCustom && amount === val
                                ? "bg-brand-accent text-slate-950 border-brand-accent-glow shadow-md shadow-orange-500/10"
                                : "bg-brand-bg border-brand-border/30 text-gray-300 hover:border-brand-border"
                            }`}
                          >
                            £{val}
                          </button>
                        ))}
                      </div>

                      {/* Custom Amount Entry */}
                      <div className="relative mt-2">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">£</span>
                        <input
                          type="number"
                          placeholder="Or enter custom amount..."
                          value={customAmount}
                          onChange={(e) => handleCustomChange(e.target.value)}
                          min="1"
                          step="0.01"
                          className="w-full pl-8 pr-4 py-3 bg-brand-bg/60 border border-brand-border/40 rounded-2xl text-sm text-white font-semibold font-mono focus:outline-none focus:border-brand-accent/60 placeholder-gray-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Sponsor Identity Moniker */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold">Sponsor Moniker</label>
                        <input
                          type="text"
                          placeholder="Anonymous Maker / Private Participant"
                          value={moniker}
                          onChange={(e) => setMoniker(e.target.value)}
                          maxLength={60}
                          className="w-full bg-brand-bg/60 border border-brand-border/40 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1">
                          <span>Support Tier</span>
                          <HelpCircle className="w-3.5 h-3.5 text-gray-500 cursor-help" title="Based on sponsorship value" />
                        </label>
                        <div className="h-11 flex items-center px-4 bg-brand-bg/40 border border-brand-border/20 rounded-2xl text-xs font-mono text-brand-accent-glow font-bold">
                          {amount >= 25 ? "🛠️ Lead Investor / Chief Engineer" : amount >= 10 ? "🔧 Senior Workshop Supporter" : "⚙️ Fuel Donor"}
                        </div>
                      </div>
                    </div>

                    {/* Sponsor Message */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold">Encouragement message (Optional)</label>
                      <textarea
                        placeholder="Say something to fuel their project or agree with their point..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={500}
                        rows={3}
                        className="w-full bg-brand-bg/60 border border-brand-border/40 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent/50 resize-none"
                      />
                    </div>
                  </div>
                ) : mode === "paypal" ? (
                  /* PayPal Payment Panel */
                  <div className="p-5 bg-slate-950 border border-blue-500/30 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-black font-mono">
                        PayPal
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Direct PayPal Payout</h4>
                        <p className="text-xs text-gray-400">Send instant backing funds directly into the creator's PayPal account</p>
                      </div>
                    </div>

                    {paypalMeLink || paypalEmail ? (
                      <div className="space-y-3 pt-2">
                        <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl space-y-1">
                          <span className="text-[10px] uppercase font-mono text-blue-400 font-bold">Active PayPal Destination</span>
                          <div className="text-xs font-mono font-bold text-white">
                            {paypalMeLink ? `paypal.me/${paypalMeLink.replace(/^https?:\/\/(www\.)?paypal\.me\//i, '')}` : paypalEmail}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold">Support Amount (GBP)</label>
                          <div className="grid grid-cols-4 gap-2">
                            {presetAmounts.map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleAmountSelect(val)}
                                className={`py-2.5 rounded-xl font-bold font-mono text-xs border transition-all cursor-pointer ${
                                  !isCustom && amount === val
                                    ? "bg-blue-600 text-white border-blue-400 font-black shadow-md shadow-blue-500/20"
                                    : "bg-brand-bg border-brand-border/30 text-gray-300 hover:border-blue-500/50"
                                }`}
                              >
                                £{val}
                              </button>
                            ))}
                          </div>
                        </div>

                        <a
                          href={paypalMeLink ? `https://paypal.me/${paypalMeLink.replace(/^https?:\/\/(www\.)?paypal\.me\//i, '')}/${amount}` : `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(paypalEmail)}&amount=${amount}&currency_code=GBP&item_name=${encodeURIComponent('Sponsorship for: ' + point.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            // Record sponsorship in background
                            fetch(`/api/points/${point.id}/sponsor`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                amount,
                                currency: "GBP",
                                authorMoniker: moniker.trim() || "PayPal Sponsor",
                                message: "Paid via PayPal"
                              })
                            }).catch(console.error);
                            onSponsorshipSuccess(point.sponsorshipsTotal ? point.sponsorshipsTotal + amount : amount, point.sponsorshipsCount ? point.sponsorshipsCount + 1 : 1);
                          }}
                          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer mt-4"
                        >
                          <span>Proceed to Pay £{amount.toFixed(2)} on PayPal</span>
                          <span className="text-xs font-mono bg-black/20 px-2 py-0.5 rounded">↗</span>
                        </a>
                      </div>
                    ) : (
                      <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl space-y-2 text-xs text-gray-300">
                        <p className="font-bold text-orange-400">PayPal Account Not Yet Set Up</p>
                        <p>To accept PayPal payments, open the <strong>Fuel & Sponsorship Deck</strong> (from the header toolbar) and enter your PayPal email or PayPal.me username under the <strong>PayPal Account Setup</strong> tab!</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Stripe Production Integration Guidance Panel */
                  <div className="p-5 bg-slate-950 border border-brand-border/30 rounded-2xl space-y-4">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 bg-brand-accent/10 rounded-lg text-brand-accent">
                        <Code className="w-4 h-4 text-brand-accent-glow" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">How to Deploy Stripe Live in 1 Minute</h4>
                        <p className="text-xs text-gray-400 mt-0.5">The codebase is pre-configured for Stripe. Complete these steps to charge real credit cards:</p>
                      </div>
                    </div>

                    <ol className="text-xs text-gray-300 space-y-2.5 list-decimal pl-4 font-sans">
                      <li>
                        <strong className="text-white">Get Keys:</strong> Register for a free account at <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline">stripe.com</a> and obtain your API Keys from the Developer Dashboard.
                      </li>
                      <li>
                        <strong className="text-white">Define Environment Variables:</strong> Add the Stripe credentials in your <code className="text-brand-accent font-mono bg-brand-bg px-1 rounded">.env.example</code> or system settings:
                        <div className="relative mt-2">
                          <pre className="p-3 bg-brand-bg/80 border border-brand-border/20 rounded-xl text-[10px] font-mono text-gray-400 overflow-x-auto whitespace-pre">
{`# .env.example configuration
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...`}
                          </pre>
                          <button
                            type="button"
                            onClick={handleCopyEnv}
                            className="absolute right-2.5 top-2.5 p-1.5 rounded-lg bg-slate-900 border border-brand-border/40 text-gray-400 hover:text-white transition-colors"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </li>
                      <li>
                        <strong className="text-white">Uncomment Stripe Handler:</strong> The back-end server is ready to compile Stripe's checkout session SDK once keys are in place.
                      </li>
                    </ol>

                    <div className="p-3.5 bg-orange-500/5 border border-brand-accent/20 rounded-xl flex items-start gap-2 text-[11px] text-brand-accent-glow">
                      <Heart className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Ready for launch! Using Sandbox mode in the adjacent tab allows you to completely test and simulate persistent donations before linking your Stripe account!</span>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-semibold">
                    {error}
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div className="pt-4 border-t border-brand-border/40 flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-brand-bg border border-brand-border text-xs text-gray-400 font-bold rounded-xl hover:text-white hover:border-brand-border/80 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  {mode === "sandbox" && (
                    <button
                      type="submit"
                      disabled={loading || amount <= 0}
                      className="px-6 py-2.5 bg-brand-accent text-slate-950 font-bold text-xs rounded-xl hover:bg-brand-accent-glow disabled:opacity-40 cursor-pointer transition-all flex items-center gap-1.5 shadow-lg shadow-orange-500/5"
                    >
                      {loading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Simulating Transaction...</span>
                        </>
                      ) : (
                        <>
                          <Flame className="w-4 h-4" />
                          <span>Fuel with £{amount.toFixed(2)}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
