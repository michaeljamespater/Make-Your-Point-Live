import React, { useState, useEffect } from "react";
import { Megaphone, MessageSquare, ShieldAlert, Edit3, Save, RotateCcw, Check, Loader2, RefreshCw } from "lucide-react";
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

interface PlatformManifestoProps {
  stats?: {
    totalPoints: number;
    totalConnections: number;
  };
  isEditorMode?: boolean;
  onOpenEditor?: () => void;
  manifestoRefresher?: number;
  onSaved?: (data: ManifestoData) => void;
  categoryIndexNode?: React.ReactNode;
}

export default function PlatformManifesto({ 
  stats, 
  isEditorMode = false,
  onOpenEditor,
  manifestoRefresher = 0,
  onSaved,
  categoryIndexNode
}: PlatformManifestoProps) {
  const [manifesto, setManifesto] = useState<ManifestoData>(DEFAULT_MANIFESTO);
  const [draft, setDraft] = useState<ManifestoData>(DEFAULT_MANIFESTO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchManifesto();
  }, [manifestoRefresher]);

  useEffect(() => {
    // Keep draft in sync when manifesto is loaded or when editor mode changes
    setDraft({ ...manifesto });
  }, [manifesto, isEditorMode]);

  const fetchManifesto = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/manifesto");
      if (response.ok) {
        const data = await response.json();
        setManifesto(data);
        setDraft(data);
      }
    } catch (err) {
      console.error("Error fetching manifesto config:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ManifestoData, value: string) => {
    setDraft(prev => ({
      ...prev,
      [field]: value
    }));
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
        const data = await response.json();
        setManifesto(data);
        setSaveSuccess(true);
        if (onSaved) {
          onSaved(data);
        }
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error saving manifesto config:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    if (window.confirm("Are you sure you want to reset the platform manifesto to default values? This will overwrite your current draft.")) {
      setDraft({ ...DEFAULT_MANIFESTO });
    }
  };

  const handleDiscardChanges = () => {
    setDraft({ ...manifesto });
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-brand-card border border-brand-border text-gray-200 flex flex-col items-center justify-center py-12 gap-3" id="manifesto-loading">
        <Loader2 className="w-6 h-6 text-brand-accent animate-spin" />
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Synchronizing platform bylaws...</span>
      </div>
    );
  }

  const isDirty = JSON.stringify(draft) !== JSON.stringify(manifesto);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-2xl bg-white border transition-all duration-300 relative overflow-hidden shadow-card-highlight ${
        isEditorMode 
          ? "border-brand-accent shadow-lg shadow-orange-500/10 ring-1 ring-brand-accent/20" 
          : "border-slate-200/80"
      } text-slate-800`}
      id="platform-manifesto-container"
    >
      {/* Editor Active Badge */}
      {isEditorMode && (
        <div className="absolute top-0 right-0 left-0 bg-brand-accent/15 border-b border-brand-accent/20 px-4 py-1.5 flex items-center justify-between text-[10px] text-brand-accent font-bold tracking-wider uppercase font-mono z-10">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-ping" />
            Editing Platform Manifesto
          </span>
          {onOpenEditor ? (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenEditor(); }}
              className="px-2 py-0.5 bg-brand-accent hover:bg-brand-accent-glow text-white text-[9px] font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
              title="Open spacious full split-screen editing window with AI assistants"
              id="btn-project-to-window"
            >
              <span>Project to Window ↗</span>
            </button>
          ) : (
            isDirty && <span className="text-orange-300">Unsaved Changes</span>
          )}
        </div>
      )}

      <div className={`flex flex-col gap-4 ${isEditorMode ? "pt-4" : ""}`}>
        {/* Title / App Name Row */}
        <div className="flex items-center gap-3">
          <Megaphone className={`w-6 h-6 text-brand-accent shrink-0 ${isEditorMode ? "" : "animate-bounce"}`} />
          {isEditorMode ? (
            <div className="flex-1 space-y-1">
              <label className="text-[9px] uppercase font-mono text-gray-500 font-bold block">App Title / Branding</label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full bg-brand-bg/80 border border-brand-border/60 text-white rounded-xl px-3 py-1.5 focus:outline-none focus:border-brand-accent/60 text-xs font-bold font-display"
                id="edit-manifesto-title"
              />
            </div>
          ) : (
            <h2 className="text-xl font-display font-bold tracking-tight text-slate-900">
              {manifesto.title}
            </h2>
          )}
        </div>

        {/* Description Section */}
        {isEditorMode ? (
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Manifesto Mission Statement</label>
            <textarea
              value={draft.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-3 focus:outline-none focus:border-orange-500 text-xs h-28 resize-none leading-relaxed font-sans"
              id="edit-manifesto-description"
            />
            {onOpenEditor && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5 flex items-center justify-between text-[11px] gap-2 mt-2">
                <span className="text-slate-600">💡 Want AI copy presets, spell check, and split live previews?</span>
                <button
                  type="button"
                  onClick={onOpenEditor}
                  className="px-2.5 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300 rounded-lg font-bold text-[10px] whitespace-nowrap cursor-pointer transition-colors"
                >
                  Project Editor Window ↗
                </button>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-slate-600">
            {manifesto.description}
          </p>
        )}

        {/* Bullet Rules / Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          {/* Rule 1 */}
          <div className="flex gap-2">
            <ShieldAlert className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              {isEditorMode ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={draft.rule1Title}
                    onChange={(e) => handleChange("rule1Title", e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-0.5 text-xs font-semibold focus:outline-none"
                    placeholder="Rule 1 Title"
                  />
                  <textarea
                    value={draft.rule1Content}
                    onChange={(e) => handleChange("rule1Content", e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg p-2 text-[11px] h-16 resize-none focus:outline-none"
                    placeholder="Rule 1 description..."
                  />
                </div>
              ) : (
                <>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{manifesto.rule1Title}</span>
                  <p className="mt-0.5 text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">{manifesto.rule1Content}</p>
                </>
              )}
            </div>
          </div>
          
          {/* Rule 2 */}
          <div className="flex gap-2">
            <MessageSquare className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              {isEditorMode ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={draft.rule2Title}
                    onChange={(e) => handleChange("rule2Title", e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2 py-0.5 text-xs font-semibold focus:outline-none"
                    placeholder="Rule 2 Title"
                  />
                  <textarea
                    value={draft.rule2Content}
                    onChange={(e) => handleChange("rule2Content", e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg p-2 text-[11px] h-16 resize-none focus:outline-none"
                    placeholder="Rule 2 description..."
                  />
                </div>
              ) : (
                <>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{manifesto.rule2Title}</span>
                  <p className="mt-0.5 text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">{manifesto.rule2Content}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Editor Actions Footer panel */}
        {isEditorMode && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-brand-border/30 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleResetToDefault}
                className="flex items-center gap-1 bg-brand-bg/60 border border-brand-border/50 text-gray-400 hover:text-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-[10px] font-mono"
                title="Reset this component's text to the original factory defaults"
                id="btn-manifesto-reset"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Default</span>
              </button>

              {isDirty && (
                <button
                  onClick={handleDiscardChanges}
                  className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-[10px]"
                  title="Discard unsaved local draft changes"
                  id="btn-manifesto-discard"
                >
                  <span>Discard</span>
                </button>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer ${
                saveSuccess
                  ? "bg-emerald-600 text-white"
                  : isDirty
                    ? "bg-brand-accent hover:bg-brand-accent/90 text-white shadow-orange-500/10"
                    : "bg-brand-bg border border-brand-border/30 text-gray-500 cursor-not-allowed"
              }`}
              id="btn-manifesto-save"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved to App!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save App Content</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
