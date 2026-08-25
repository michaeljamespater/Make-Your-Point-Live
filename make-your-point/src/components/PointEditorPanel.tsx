import React, { useState, useEffect } from "react";
import { Point, getAudienceVoices, AudienceVoice } from "../types";
import {
  Sparkles,
  HelpCircle,
  PenSquare,
  RefreshCw,
  X,
  Check,
  AlertCircle,
  Eye,
  Settings,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PointEditorPanelProps {
  point: Point;
  onCancel: () => void;
  onSaved: (updatedFields: {
    title: string;
    content: string;
    category: string;
    subcategory: string;
    targetAudience: string;
    tags?: string[];
    webAddress?: string;
  }) => void;
}

const CATEGORIES = [
  "Point",
  "Point-to-Point",
  "Point of Conversation",
  "Point of Argument",
  "Point of Agreement",
  "Point of Innovation",
  "Point of Production",
  "Point of Delivery"
];

export default function PointEditorPanel({ point, onCancel, onSaved }: PointEditorPanelProps) {
  const [content, setContent] = useState(point.content);
  const [title, setTitle] = useState(point.title);
  const [category, setCategory] = useState(point.category);
  const [subcategory, setSubcategory] = useState(point.subcategory);
  const [targetAudience, setTargetAudience] = useState(point.targetAudience);
  const [tags, setTags] = useState(point.tags?.join(", ") || "");
  const [webAddress, setWebAddress] = useState(point.webAddress || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // AI Spellcheck & Polish States
  const [polishing, setPolishing] = useState(false);
  const [polishResult, setPolishResult] = useState<{
    polishedTitle: string;
    polishedContent: string;
    corrections: string[];
  } | null>(null);

  const [voices, setVoices] = useState<AudienceVoice[]>([]);

  useEffect(() => {
    setVoices(getAudienceVoices());
    const handleStorage = () => {
      setVoices(getAudienceVoices());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    // Reset states when the selected point changes
    setContent(point.content);
    setTitle(point.title);
    setCategory(point.category);
    setSubcategory(point.subcategory);
    setTargetAudience(point.targetAudience);
    setTags(point.tags?.join(", ") || "");
    setWebAddress(point.webAddress || "");
    setPolishResult(null);
    setError(null);
    setSuccess(false);
  }, [point]);

  const handleSpellcheck = async () => {
    if (!content.trim()) return;
    setPolishing(true);
    setError(null);
    try {
      const response = await fetch("/api/spellcheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content })
      });

      if (response.ok) {
        const data = await response.json();
        setPolishResult(data);
      } else {
        const errData = await response.json();
        setError(errData.error || "Spellcheck was unable to complete.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Network error running spellcheck.");
    } finally {
      setPolishing(false);
    }
  };

  const applyAIChanges = () => {
    if (!polishResult) return;
    setTitle(polishResult.polishedTitle);
    setContent(polishResult.polishedContent);
    setPolishResult(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Content cannot be empty.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    const parsedTags = tags.trim() ? tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean) : [];

    try {
      const response = await fetch(`/api/points/${point.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          subcategory: subcategory.trim(),
          targetAudience,
          tags: parsedTags,
          webAddress: webAddress.trim()
        })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSaved({
            title: title.trim(),
            content: content.trim(),
            category,
            subcategory: subcategory.trim(),
            targetAudience,
            tags: parsedTags,
            webAddress: webAddress.trim()
          });
        }, 1200);
      } else {
        const errData = await response.json();
        setError(errData.error || "Failed to save point changes.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to sync changes with the database.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden"
      id="point-curator-editor-card"
    >
      {/* Decorative Accent Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-display font-bold text-slate-900 flex items-center gap-1.5">
            Point Editor <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-bold">Sandbox</span>
          </h3>
        </div>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          title="Close Editor"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Title Input */}
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider font-extrabold text-slate-900 block">
            Point Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-orange-500 transition-colors shadow-2xs"
            placeholder="A punchy, scannable argument..."
            maxLength={100}
            required
          />
        </div>

        {/* Content Area */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider font-extrabold text-slate-900 block">
              Narrative Content
            </label>
            <button
              type="button"
              disabled={polishing || !content.trim()}
              onClick={handleSpellcheck}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-700 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
              title="Run AI Spellcheck & Grammar Polish"
            >
              {polishing ? (
                <RefreshCw className="w-3 h-3 animate-spin text-orange-600" />
              ) : (
                <Sparkles className="w-3 h-3 text-orange-600" />
              )}
              <span>AI Spellcheck & Polish</span>
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-orange-500 transition-colors h-36 resize-y shadow-2xs leading-relaxed"
            placeholder="Flesh out your point..."
            required
          />
        </div>

        {/* AI POLISH REPORT OVERLAY */}
        <AnimatePresence>
          {polishResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 space-y-2.5 text-xs text-slate-800"
              id="ai-polish-report"
            >
              <div className="flex items-center justify-between border-b border-orange-200 pb-2">
                <span className="flex items-center gap-1.5 text-xs uppercase font-mono font-bold text-orange-800">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>AI Spellcheck Report</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPolishResult(null)}
                  className="text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {polishResult.corrections.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-600 font-mono font-bold block">Corrections Made:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-xs text-slate-700 font-medium">
                    {polishResult.corrections.map((corr, idx) => (
                      <li key={idx}>{corr}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs leading-relaxed">
                <span className="text-[10px] text-slate-500 font-mono block uppercase font-bold mb-0.5">Polished Preview:</span>
                <p className="font-bold text-slate-900 mb-1">"{polishResult.polishedTitle}"</p>
                <p className="text-slate-700 italic">"{polishResult.polishedContent}"</p>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setPolishResult(null)}
                  className="px-3 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg transition-all cursor-pointer"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={applyAIChanges}
                  className="px-3.5 py-1 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Corrections</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category & Subcategory Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider font-extrabold text-slate-900 block">
              Point Level Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="text-slate-900 font-medium">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider font-extrabold text-slate-900 block">
              Subcategory
            </label>
            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 transition-colors shadow-2xs"
              placeholder="e.g. Free Speech"
              maxLength={30}
              required
            />
          </div>
        </div>

        {/* Target Audience / Voice */}
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider font-extrabold text-slate-900 block">
            Your Voice Forum
          </label>
          <select
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 cursor-pointer shadow-2xs"
          >
            {voices.filter((voice) => voice.id !== "all").map((voice) => (
              <option key={voice.id} value={voice.id} className="text-slate-900 font-medium">
                {voice.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tags Field */}
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider font-extrabold text-slate-900 block">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 transition-colors shadow-2xs"
            placeholder="e.g. clockwork, invention, metalworking"
          />
        </div>

        {/* Web Address Field */}
        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider font-extrabold text-slate-900 block">
            Web Address / Link (Optional)
          </label>
          <input
            type="url"
            value={webAddress}
            onChange={(e) => setWebAddress(e.target.value)}
            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 transition-colors shadow-2xs"
            placeholder="e.g. https://my-garage.com"
          />
        </div>

        {/* Success & Error alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800 font-bold"
            >
              <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 animate-bounce" />
              <span>Changes synced successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Controls */}
        <div className="flex gap-2 pt-2 justify-end border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-xs font-black bg-orange-600 hover:bg-orange-500 text-white rounded-xl shadow-md shadow-orange-600/20 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Point Made</span>
          </button>
        </div>
      </form>
    </div>
  );
}
