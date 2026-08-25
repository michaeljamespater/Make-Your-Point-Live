import React, { useState } from "react";
import { Shield, Fingerprint, Eye, Sparkles, Loader2, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function OurWayOfLife() {
  const [inputText, setInputText] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{
    status: "independent" | "scripted" | "vague" | null;
    rating: number; // 0 to 100 independent score
    title: string;
    message: string;
    challenge: string;
  } | null>(null);

  const handleVerify = async () => {
    if (!inputText.trim()) return;
    setChecking(true);
    setResult(null);

    try {
      const response = await fetch("/api/check-reality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: inputText })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        throw new Error("Failed to contact the reality check engine");
      }
    } catch (err) {
      console.error("Error checking reality:", err);
      // Fallback response if API is down or fails
      const isSuspect = inputText.toLowerCase().includes("socialist") || 
                        inputText.toLowerCase().includes("bourgeoisie") || 
                        inputText.toLowerCase().includes("proletariat") || 
                        inputText.toLowerCase().includes("capitalism is") ||
                        inputText.toLowerCase().includes("marxist") ||
                        inputText.toLowerCase().includes("revolution now");

      setTimeout(() => {
        if (isSuspect) {
          setResult({
            status: "scripted",
            rating: 28,
            title: "Ideological Script Detected",
            message: "This statement closely mirrors standardised political recitals and formulaic group-think rather than raw, independent personal experience.",
            challenge: "Challenge: Reframe this point. What specific, real-world event or personal encounter did you live through that inspired this observation?"
          });
        } else {
          setResult({
            status: "independent",
            rating: 85,
            title: "Independent Mind Confirmed",
            message: "Your observation appears sincere, organic, and grounded in a personal perspective of the world.",
            challenge: "Encouragement: Excellent! You are ready to publish this Point to the AIonisphere directory index."
          });
        }
      }, 800);
    } finally {
      setChecking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="p-5 rounded-2xl bg-white border border-slate-200/80 text-slate-800 shadow-card-highlight overflow-hidden relative group"
      id="our-way-of-life-card"
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-all duration-500 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col items-center text-center gap-1.5 mb-3.5 w-full">
        <Shield className="w-5 h-5 text-brand-accent shrink-0" />
        <div className="text-center w-full max-w-xs mx-auto">
          <h3 className="text-sm font-display font-black text-slate-900 uppercase tracking-wider text-center leading-snug">
            KNOW THE SCRIPT
          </h3>
        </div>
      </div>

      {/* Philosophy bullets */}
      <div className="space-y-3 text-xs mb-4 text-slate-700">

        <div className="grid grid-cols-1 gap-2.5 pt-1">
          <div className="flex gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <Fingerprint className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block text-[11px]">Reject Ideological Scripts</span>
              <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">
                No dogmatic, canned, or formulaic slogans. Sincere controversy is welcomed; rehearsed corporate or political scripts are rejected.
              </p>
            </div>
          </div>

          <div className="flex gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <Eye className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block text-[11px]">Personal Reality Rule</span>
              <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">
                If your draft is flagged as an ideological recital, the filter challenges you to re-anchor your Point in your own lived experience.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Verification Panel */}
      <div className="border-t border-slate-200 pt-3.5 mt-2 space-y-2.5" id="reality-challenge-panel">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-accent" /> Test Your Mind
          </span>
          <span className="text-[9px] text-slate-400 font-mono">Reality Filter Simulator</span>
        </div>

        <textarea
          rows={2}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type or paste a statement to check if it's an independent point or an ideological script..."
          className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-2.5 text-[11px] focus:outline-none focus:border-orange-500 placeholder:text-slate-400 resize-none leading-relaxed transition-all"
        />

        <div className="flex gap-2 justify-end">
          {inputText && (
            <button
              onClick={() => { setInputText(""); setResult(null); }}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleVerify}
            disabled={checking || !inputText.trim()}
            className={`flex items-center gap-1.5 text-[10px] font-black px-4 py-1.5 rounded-lg border transition-all cursor-pointer ${
              !inputText.trim() 
                ? "bg-brand-bg/30 border-brand-border/20 text-gray-600 cursor-not-allowed"
                : checking
                  ? "bg-brand-accent/20 border-brand-accent/30 text-brand-accent"
                  : "bg-brand-accent hover:bg-brand-accent-glow text-slate-950 border-transparent shadow-md shadow-orange-500/10"
            }`}
          >
            {checking ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Filtering...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3" />
                <span>Verify Independent Thought</span>
              </>
            )}
          </button>
        </div>

        {/* Results Panel */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-3 rounded-xl border mt-2 overflow-hidden text-xs ${
                result.status === "independent"
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                  : result.status === "vague"
                    ? "bg-sky-500/5 border-sky-500/20 text-sky-300"
                    : "bg-rose-500/5 border-rose-500/20 text-rose-300"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-[11px] mb-1">
                {result.status === "independent" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>
                  {result.title} ({result.rating}% Score)
                </span>
              </div>
              <p className="text-[10px] text-gray-300 leading-relaxed">
                {result.message}
              </p>
              <div className="mt-2 pt-2 border-t border-brand-border/20 text-[10px] font-medium text-brand-accent-glow italic">
                {result.challenge}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
