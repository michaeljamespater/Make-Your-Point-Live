import React, { useState, useEffect } from "react";
import { 
  Megaphone, 
  ShieldAlert, 
  MessageSquare, 
  Save, 
  RotateCcw, 
  Check, 
  Loader2, 
  Sparkles, 
  X, 
  Wand2, 
  AlertCircle,
  Eye,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ManifestoData {
  title: string;
  description: string;
  corePillar: string;
  pillarTitle: string;
  rule1Title: string;
  rule1Content: string;
  rule2Title: string;
  rule2Content: string;
}

const DEFAULT_MANIFESTO: ManifestoData = {
  title: "Make Your Point",
  description: "Be respectful, polite and rise above the confrontation or Be Done By As You Did",
  corePillar: "",
  pillarTitle: "",
  rule1Title: "AI-Filtered & Indexed",
  rule1Content: "Spam, gibberish, and hostile harassment are automatically deflected, while sincere, controversial, or anti-establishment opinions are preserved and organised.",
  rule2Title: "The AIonisphere Awaits",
  rule2Content: "Connect constructively. Stand up, speak your truth, and let’s construct a bridge of understanding through raw, authentic human experiences."
};

interface ManifestoEditorWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData: ManifestoData;
}

type ToneType = "professional" | "bold" | "welcoming" | "intellectual";

export default function ManifestoEditorWindow({
  isOpen,
  onClose,
  onSaved,
  initialData
}: ManifestoEditorWindowProps) {
  const [draft, setDraft] = useState<ManifestoData>({ ...initialData });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // AI Tone Rewriter State
  const [selectedTone, setSelectedTone] = useState<ToneType>("professional");
  const [customInstructions, setCustomInstructions] = useState("");
  const [rewriting, setRewriting] = useState(false);
  const [rewriteExplanation, setRewriteExplanation] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft({ ...initialData });
      setRewriteExplanation(null);
      setAiError(null);
    }
  }, [isOpen, initialData]);

  const handleFieldChange = (field: keyof ManifestoData, value: string) => {
    setDraft(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAIRewrite = async () => {
    setRewriting(true);
    setAiError(null);
    setRewriteExplanation(null);
    try {
      const response = await fetch("/api/manifesto/ai-rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentData: draft,
          tone: selectedTone,
          customInstructions: customInstructions.trim() || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        const { explanation, ...rest } = data;
        setDraft(rest);
        setRewriteExplanation(explanation);
      } else {
        const errData = await response.json();
        setAiError(errData.error || "Failed to rewrite manifesto.");
      }
    } catch (err: any) {
      console.error("Error calling AI rewrite:", err);
      setAiError("A network error occurred. Please check your connection.");
    } finally {
      setRewriting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/manifesto", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft)
      });
      if (response.ok) {
        setSaveSuccess(true);
        onSaved();
        setTimeout(() => {
          setSaveSuccess(false);
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error("Error saving manifesto:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm("Are you sure you want to reset the platform manifesto in your editor to the original factory default? You will still need to click 'Save' to apply it live.")) {
      setDraft({ ...DEFAULT_MANIFESTO });
      setRewriteExplanation("Reset to original factory default manifesto.");
    }
  };

  if (!isOpen) return null;

  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialData);

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
      id="manifesto-editor-window-overlay"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.3 }}
        className="bg-[#0b0f19] border border-brand-border rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col my-8"
        id="manifesto-editor-window-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Head Line */}
        <div className="h-1 bg-gradient-to-r from-orange-500 via-brand-accent to-pink-500" />

        {/* WINDOW HEADER */}
        <div className="px-6 py-5 border-b border-brand-border/40 flex items-center justify-between bg-brand-card/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-accent/15 border border-brand-accent/30 flex items-center justify-center text-brand-accent shadow-md shadow-orange-500/5">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                Platform Identity & Manifesto Editor
              </h2>
              <p className="text-xs text-gray-400">
                Project platform bylaws, values, rules, and core theme branding in a spacious, professional workspace.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-brand-border/60 text-gray-400 hover:text-white hover:bg-brand-card/50 transition-all cursor-pointer"
            title="Close Editor"
            id="manifesto-editor-close-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* GRID SPLIT VIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-brand-border/40 flex-1 max-h-[70vh] overflow-y-auto">
          
          {/* LEFT PANEL: Editing Inputs (7 Columns) */}
          <div className="lg:col-span-7 p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
            
            {/* AI Generator Workshop Tool */}
            <div className="bg-brand-card/40 border border-brand-border/40 rounded-2xl p-4 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 bg-brand-accent/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 text-xs font-bold text-brand-accent uppercase tracking-wider font-mono">
                <Wand2 className="w-4 h-4 text-brand-accent animate-spin-slow" />
                <span>AI Copywriting Workshop</span>
              </div>
              
              <p className="text-[11px] text-gray-400">
                Select a mood preset or provide custom instructions. Gemini will draft cohesive, inspiring platform copy for your title, mission statement, and philosophy pillars.
              </p>

              {/* Tones Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {(["professional", "bold", "welcoming", "intellectual"] as ToneType[]).map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => setSelectedTone(tone)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                      selectedTone === tone
                        ? "bg-brand-accent/20 border-brand-accent text-brand-accent"
                        : "bg-brand-bg/50 border-brand-border/40 text-gray-400 hover:text-gray-300 hover:bg-brand-bg"
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>

              {/* Custom Input prompt */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="E.g., Make it feel like a futuristic sci-fi colony, or focus on gamers..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="flex-1 bg-brand-bg/80 border border-brand-border/60 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-accent/50"
                  id="manifesto-custom-ai-prompt"
                />
                <button
                  type="button"
                  onClick={handleAIRewrite}
                  disabled={rewriting}
                  className="bg-brand-accent hover:bg-brand-accent/90 disabled:bg-brand-border text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                >
                  {rewriting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Rephrasing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Apply AI</span>
                    </>
                  )}
                </button>
              </div>

              {/* AI Feedback message */}
              <AnimatePresence>
                {rewriteExplanation && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-400 leading-relaxed flex gap-2"
                  >
                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span><strong>AI Stylist Note:</strong> {rewriteExplanation}</span>
                  </motion.div>
                )}

                {aiError && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-400 leading-relaxed flex gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    <span><strong>Assistant Error:</strong> {aiError}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FORM WRITING INPUTS */}
            <div className="space-y-4">
              
              {/* Row: Title & Pillar Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono text-gray-400 font-bold tracking-wider block">App Branding Title</label>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border/60 text-white rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-brand-accent/50"
                    placeholder="E.g., Make Your Point"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono text-gray-400 font-bold tracking-wider block">Philosophy Pillar Title</label>
                  <input
                    type="text"
                    value={draft.pillarTitle}
                    onChange={(e) => handleFieldChange("pillarTitle", e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border/60 text-white rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-brand-accent/50"
                    placeholder="E.g., Core Pillar of the Forum"
                  />
                </div>
              </div>

              {/* Row: Philosophy Pillar Value */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-gray-400 font-bold tracking-wider block">Philosophy Value / Motto Slogan</label>
                <input
                  type="text"
                  value={draft.corePillar}
                  onChange={(e) => handleFieldChange("corePillar", e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border/60 text-brand-accent rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:border-brand-accent/50 text-center"
                  placeholder="E.g., Left Center Right Let Democracy Thrive"
                />
              </div>

              {/* Textarea: Mission Statement */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-mono text-gray-400 font-bold tracking-wider">Mission Statement & Brand Bio</label>
                  <span className="text-[9px] text-gray-500 font-mono">{draft.description.length} / 500 characters</span>
                </div>
                <textarea
                  value={draft.description}
                  onChange={(e) => handleFieldChange("description", e.target.value.slice(0, 500))}
                  rows={4}
                  className="w-full bg-brand-bg border border-brand-border/60 text-white rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:border-brand-accent/50 resize-none"
                  placeholder="Introduce the core goal and community vision for this space..."
                />
              </div>

              {/* Grid: Bylaws / Rule Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                
                {/* Rule Card 1 */}
                <div className="p-4 bg-brand-bg/40 border border-brand-border/50 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-brand-accent shrink-0" />
                    <span className="text-[10px] uppercase font-mono text-gray-400 font-bold">Bylaw Rule 1</span>
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={draft.rule1Title}
                      onChange={(e) => handleFieldChange("rule1Title", e.target.value)}
                      className="w-full bg-brand-bg/80 border border-brand-border/40 text-xs font-semibold text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-brand-accent/40"
                      placeholder="Rule 1 Heading"
                    />
                    <textarea
                      value={draft.rule1Content}
                      onChange={(e) => handleFieldChange("rule1Content", e.target.value)}
                      rows={3}
                      className="w-full bg-brand-bg/80 border border-brand-border/40 text-[11px] text-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-brand-accent/40 resize-none leading-relaxed"
                      placeholder="Rule 1 explanation..."
                    />
                  </div>
                </div>

                {/* Rule Card 2 */}
                <div className="p-4 bg-brand-bg/40 border border-brand-border/50 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-brand-accent shrink-0" />
                    <span className="text-[10px] uppercase font-mono text-gray-400 font-bold">Bylaw Rule 2</span>
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={draft.rule2Title}
                      onChange={(e) => handleFieldChange("rule2Title", e.target.value)}
                      className="w-full bg-brand-bg/80 border border-brand-border/40 text-xs font-semibold text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-brand-accent/40"
                      placeholder="Rule 2 Heading"
                    />
                    <textarea
                      value={draft.rule2Content}
                      onChange={(e) => handleFieldChange("rule2Content", e.target.value)}
                      rows={3}
                      className="w-full bg-brand-bg/80 border border-brand-border/40 text-[11px] text-gray-300 p-2.5 rounded-lg focus:outline-none focus:border-brand-accent/40 resize-none leading-relaxed"
                      placeholder="Rule 2 explanation..."
                    />
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* RIGHT PANEL: Real-time High Contrast Visual Preview (5 Columns) */}
          <div className="lg:col-span-5 p-6 bg-brand-bg/25 overflow-y-auto max-h-[70vh] flex flex-col justify-center space-y-6">
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-gray-400 font-bold tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-brand-accent" />
                  Live-rendered Mobile/Sidebar Preview
                </span>
                <span className="px-2 py-0.5 rounded bg-brand-accent/10 border border-brand-accent/20 text-[8px] text-brand-accent font-bold uppercase tracking-wider font-mono">
                  Interactive
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                This is exactly how visitors and people of the forum will see your platform on the left sidebar in real time.
              </p>
            </div>

            {/* LIVE PREVIEW REPLICA CARD */}
            <div 
              className="p-5 rounded-2xl bg-gradient-to-br from-[#121824] to-[#0d121c] border border-brand-accent/30 shadow-xl relative overflow-hidden"
              id="editor-manifesto-live-replica"
            >
              <div className="flex flex-col gap-4">
                
                {/* Title / Header */}
                <div className="flex items-center gap-2.5">
                  <Megaphone className="w-5 h-5 text-brand-accent shrink-0 animate-pulse" />
                  <h3 className="text-base font-display font-bold text-white tracking-tight">
                    {draft.title || "Make Your Point"}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-xs leading-relaxed text-gray-400">
                  {draft.description || "Describe the values of the forum..."}
                </p>

                {/* Fake Static Stats Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#0b0f19] border border-brand-border/30 rounded-lg p-2 text-center">
                    <span className="text-[8px] uppercase tracking-wider text-gray-500 font-mono font-bold block">
                      Total Points Raised
                    </span>
                    <span className="text-sm font-display font-black text-white">
                      12
                    </span>
                  </div>
                  <div className="bg-[#0b0f19] border border-brand-border/30 rounded-lg p-2 text-center">
                    <span className="text-[8px] uppercase tracking-wider text-gray-500 font-mono font-bold block">
                      Connections Sparked
                    </span>
                    <span className="text-sm font-display font-black text-brand-accent">
                      48
                    </span>
                  </div>
                </div>



                {/* Bylaws Row */}
                <div className="grid grid-cols-1 gap-2 text-[11px] bg-[#0b0f19]/80 p-3 rounded-lg border border-brand-border/30">
                  <div className="flex gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-100 block">{draft.rule1Title || "Rule 1 Title"}</span>
                      <p className="text-slate-300 text-[10px] mt-0.5 leading-relaxed">{draft.rule1Content || "Rule 1 explanation..."}</p>
                    </div>
                  </div>

                  <div className="h-px bg-brand-border/25 my-1" />

                  <div className="flex gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-100 block">{draft.rule2Title || "Rule 2 Title"}</span>
                      <p className="text-slate-300 text-[10px] mt-0.5 leading-relaxed">{draft.rule2Content || "Rule 2 explanation..."}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Tip block */}
            <div className="p-4 rounded-xl bg-brand-accent/5 border border-brand-accent/15 flex gap-2.5 items-start text-xs text-gray-400">
              <BookOpen className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-gray-200 block">Deploy Live Instantly</span>
                <p className="text-[11px] leading-relaxed">
                  Saving updates will compile the configuration directly to your Firestore configuration record. All people of the platform will experience the revised bylaws without needing to refresh.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* WINDOW FOOTER ACTIONS */}
        <div className="px-6 py-4 border-t border-brand-border/40 bg-brand-card/30 flex items-center justify-between flex-wrap gap-3">
          
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 bg-brand-bg hover:bg-brand-card text-gray-400 hover:text-white border border-brand-border/60 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer font-mono"
            title="Reset form fields to original defaults"
            id="window-manifesto-reset-btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-brand-border text-gray-300 hover:bg-brand-card text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                saveSuccess
                  ? "bg-emerald-600 text-white"
                  : isDirty
                    ? "bg-brand-accent hover:bg-brand-accent/90 text-white shadow-orange-500/20"
                    : "bg-brand-bg border border-brand-border/30 text-gray-500 cursor-not-allowed"
              }`}
              id="window-manifesto-deploy-btn"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deploying bylaws...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Success!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Deploy Bylaws</span>
                </>
              )}
            </button>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
