import React, { useState, useEffect } from "react";
import { CategoryInfo, getAudienceVoices, saveAudienceVoices, AudienceVoice, Point } from "../types";
import {
  List,
  Search,
  Filter,
  Users,
  ChevronRight,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Tag,
  Volume2,
  CheckCircle2,
  XCircle,
  Calendar,
  History,
  Sparkles,
  Hourglass,
  Target,
  Trophy,
  Frown,
  AlertCircle,
  ThumbsDown,
  HelpCircle,
  MessageSquare,
  Flame,
  ArrowLeftRight,
  Lightbulb,
  Wrench,
  Hammer,
  Award,
  Eye,
  Plus,
  Trash2,
  Save,
  X,
  Edit3,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const CATEGORY_STYLES: { [key: string]: { text: string; bg: string; border: string; activeBg: string; activeBorder: string; hoverBg: string } } = {
  "Point of Innovation": { text: "text-fuchsia-600", bg: "bg-fuchsia-50", border: "border-fuchsia-200", activeBg: "bg-fuchsia-600 text-white font-extrabold shadow-md shadow-fuchsia-200", activeBorder: "border-fuchsia-600", hoverBg: "hover:bg-fuchsia-50 hover:text-fuchsia-700" },
  "Point of Production": { text: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", activeBg: "bg-violet-600 text-white font-extrabold shadow-md shadow-violet-200", activeBorder: "border-violet-600", hoverBg: "hover:bg-violet-50 hover:text-violet-700" },
  "Point of Delivery": { text: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", activeBg: "bg-rose-600 text-white font-extrabold shadow-md shadow-rose-200", activeBorder: "border-rose-600", hoverBg: "hover:bg-rose-50 hover:text-rose-700" },
  "Point": { text: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200", activeBg: "bg-sky-600 text-white font-extrabold shadow-md shadow-sky-200", activeBorder: "border-sky-600", hoverBg: "hover:bg-sky-50 hover:text-sky-700" },
  "Point-to-Point": { text: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200", activeBg: "bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-200", activeBorder: "border-indigo-600", hoverBg: "hover:bg-indigo-50 hover:text-indigo-700" },
  "Point of Conversation": { text: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200", activeBg: "bg-teal-600 text-white font-extrabold shadow-md shadow-teal-200", activeBorder: "border-teal-600", hoverBg: "hover:bg-teal-50 hover:text-teal-700" },
  "Point of Argument": { text: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", activeBg: "bg-orange-600 text-white font-extrabold shadow-md shadow-orange-200", activeBorder: "border-orange-600", hoverBg: "hover:bg-orange-50 hover:text-orange-700" },
  "Point of Agreement": { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", activeBg: "bg-emerald-600 text-white font-extrabold shadow-md shadow-emerald-200", activeBorder: "border-emerald-600", hoverBg: "hover:bg-emerald-50 hover:text-emerald-700" },
  "Other": { text: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", activeBg: "bg-slate-700 text-white font-extrabold shadow-md shadow-slate-200", activeBorder: "border-slate-700", hoverBg: "hover:bg-slate-100 hover:text-slate-800" }
};

function getCategoryIcon(catName: string, className: string) {
  switch (catName) {
    case "Point of Innovation": return <Lightbulb className={className} />;
    case "Point of Production": return <Eye className={className} />;
    case "Point of Delivery": return <Award className={className} />;
    case "Point": return <MessageSquare className={className} />;
    case "Point-to-Point": return <ArrowLeftRight className={className} />;
    case "Point of Conversation": return <Users className={className} />;
    case "Point of Argument": return <Target className={className} />;
    case "Point of Agreement": return <CheckCircle2 className={className} />;
    default: return <HelpCircle className={className} />;
  }
}

interface CategoryIndexProps {
  stats?: {
    totalPoints: number;
    totalConnections: number;
  };
  onFilterChange: (filters: {
    category: string | null;
    subcategory: string | null;
    audience: string | null;
    search: string;
  }) => void;
  activeFilters: {
    category: string | null;
    subcategory: string | null;
    audience: string | null;
    search: string;
  };
  points?: Point[];
  onSelectPoint?: (point: Point) => void;
}

export default function CategoryIndex({ stats, onFilterChange, activeFilters, points, onSelectPoint }: CategoryIndexProps) {
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [audienceCounts, setAudienceCounts] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

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
    fetchIndexData();
  }, [activeFilters]); // Refresh counts when filters change

  const fetchIndexData = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setAudienceCounts(data.audienceCounts || {});
      }
    } catch (err) {
      console.error("Error loading category index:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      ...activeFilters,
      search: searchVal
    });
  };

  const clearSearch = () => {
    setSearchVal("");
    onFilterChange({
      ...activeFilters,
      search: ""
    });
  };

  const selectCategory = (catName: string | null) => {
    // If it's the same, toggle it off
    const nextCat = activeFilters.category === catName ? null : catName;
    onFilterChange({
      ...activeFilters,
      category: nextCat,
      subcategory: null // Reset subcategory when changing primary category
    });
    setExpandedCategory(expandedCategory === catName ? null : catName);
  };

  const selectSubcategory = (subName: string | null, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSub = activeFilters.subcategory === subName ? null : subName;
    onFilterChange({
      ...activeFilters,
      subcategory: nextSub
    });
  };

  const selectAudience = (audienceId: string | null) => {
    const nextAudience = activeFilters.audience === audienceId ? null : audienceId;
    onFilterChange({
      ...activeFilters,
      audience: nextAudience
    });
  };

  const clearAllFilters = () => {
    setSearchVal("");
    onFilterChange({
      category: null,
      subcategory: null,
      audience: null,
      search: ""
    });
    setExpandedCategory(null);
  };

  const hasActiveFilters =
    activeFilters.category !== null ||
    activeFilters.subcategory !== null ||
    activeFilters.audience !== null ||
    activeFilters.search !== "";

  return (
    <div className="space-y-5" id="category-index-panel">
      {/* Search Input & Forum Counters Block */}
      <div className="space-y-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3 shadow-xs" id="search-and-stats-block">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            placeholder="Search points, titles, monikers..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-16 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 shadow-sm transition-colors"
            id="global-points-search"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          
          <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
            {searchVal && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 bg-slate-100 rounded border border-slate-200 cursor-pointer"
                id="clear-search-button"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="bg-brand-accent hover:bg-orange-600 text-white rounded-lg p-1.5 cursor-pointer transition-colors shadow-sm"
              id="search-submit-button"
              title="Search"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Dynamic Forum Counters inside Search Block */}
        {stats && (
          <div className="grid grid-cols-2 gap-2.5" id="forum-counters-grid">
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center shadow-xs">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-bold block mb-0.5">
                Total Points Raised
              </span>
              <span className="text-lg sm:text-xl font-display font-black text-slate-900 tracking-tight">
                {stats.totalPoints}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 text-center shadow-xs">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-mono font-bold block mb-0.5">
                Connections Sparked
              </span>
              <span className="text-lg sm:text-xl font-display font-black text-orange-600 tracking-tight">
                {stats.totalConnections}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Header with clear */}
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-2">
        <span className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-brand-accent" /> Filter & Index Browse
        </span>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-orange-600 hover:text-orange-700 text-[11px] hover:underline cursor-pointer flex items-center gap-1 normal-case font-bold"
            id="clear-filters-link"
          >
            <RefreshCw className="w-3 h-3 animate-spin-slow" /> Clear All
          </button>
        )}
      </div>

      {/* Primary Point Levels Index */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1 mb-3">
          <BookOpen className="w-3.5 h-3.5 text-brand-accent" /> Point Level Index
        </h4>

        {!loading && (
          <button
            type="button"
            onClick={clearAllFilters}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-left transition-all cursor-pointer border mb-2.5 ${
              !hasActiveFilters
                ? "bg-orange-600 text-white font-extrabold shadow-md border-orange-600"
                : "bg-white text-slate-800 hover:bg-slate-50 border-slate-200"
            }`}
            id="btn-category-all-points"
            title="Clear all filters and show all points in the forum"
          >
            <span className="flex items-center gap-2 font-bold whitespace-normal break-words pr-2">
              <BookOpen className="w-4 h-4 shrink-0 text-current" />
              <span>All Points (Show Everything)</span>
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
              !hasActiveFilters ? "bg-black/20 text-white" : "bg-slate-100 text-slate-700 border border-slate-200"
            }`}>
              {stats?.totalPoints || categories.reduce((sum, c) => sum + c.count, 0)}
            </span>
          </button>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-6 text-xs text-slate-500 gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-accent" />
            <span>Loading indexes...</span>
          </div>
        ) : categories.length === 0 ? (
          <span className="text-xs text-slate-500 italic block">No active categories.</span>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => {
              const isSelected = activeFilters.category === cat.name;
              const isExpanded = expandedCategory === cat.name || isSelected;
              const style = CATEGORY_STYLES[cat.name] || CATEGORY_STYLES.Other;

              return (
                <div
                  key={cat.name}
                  className={`border rounded-xl overflow-hidden transition-all shadow-sm ${
                    isSelected ? `${style.border} bg-white shadow-md` : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => selectCategory(cat.name)}
                    className={`w-full flex items-center justify-between px-3 py-3 text-sm text-left transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
                      isSelected
                        ? `${style.activeBg} border-l-4 ${style.activeBorder}`
                        : `text-slate-700 hover:bg-slate-50 ${style.hoverBg}`
                    }`}
                  >
                    <span className="flex items-center gap-2 font-semibold whitespace-normal break-words pr-1 min-w-0 flex-1">
                      {getCategoryIcon(cat.name, `w-4 h-4 shrink-0 ${isSelected ? "text-current" : style.text}`)}
                      <span className="whitespace-normal break-words leading-tight">{cat.name}</span>
                      {cat.repliesCount && cat.repliesCount > 0 ? (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full shrink-0 shadow-2xs ${
                            cat.repliesCount >= 3
                              ? "bg-amber-500 text-slate-950 border border-amber-600 animate-pulse"
                              : isSelected
                              ? "bg-black/20 text-white border border-white/20"
                              : "bg-amber-100 text-amber-950 border border-amber-300"
                          }`}
                          title={`${cat.repliesCount} active chat discussion replies in this hot subject category`}
                        >
                          <Flame className="w-3 h-3 text-orange-950 shrink-0" />
                          <span>{cat.repliesCount} chat{cat.repliesCount === 1 ? "" : "s"}</span>
                        </span>
                      ) : null}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isSelected ? "bg-black/10 text-current" : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                        title={`${cat.count} total points raised`}
                      >
                        {cat.count} {cat.count === 1 ? "pt" : "pts"}
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isExpanded ? "rotate-90 text-current" : "opacity-40"
                        }`}
                      />
                    </div>
                  </button>

                  {/* Subcategories & Individual Point Labels list inside */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="bg-brand-bg/40 border-t border-brand-border/20 px-3 py-2 space-y-2"
                      >
                        {/* Subcategories (Sub-indexes) */}
                        {cat.subcategories.map((sub) => {
                          const isSubSelected = activeFilters.subcategory === sub.name;
                          const subPoints = (points || []).filter(
                            p => p.category === cat.name && p.subcategory === sub.name
                          );

                          return (
                            <div key={sub.name} className="space-y-1">
                              <button
                                onClick={(e) => selectSubcategory(sub.name, e)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-left transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
                                  isSubSelected
                                    ? `${style.activeBg} border-l-2 ${style.activeBorder}`
                                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 font-medium"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 whitespace-normal break-words min-w-0 flex-1 pr-2">
                                  <span className="whitespace-normal break-words font-medium leading-tight">↳ {sub.name}</span>
                                  {sub.repliesCount && sub.repliesCount > 0 ? (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-300 shrink-0">
                                      <MessageSquare className="w-2.5 h-2.5 text-orange-600" />
                                      <span>{sub.repliesCount}</span>
                                    </span>
                                  ) : null}
                                </div>
                                <span className="text-[10px] font-mono font-bold opacity-85 shrink-0 px-1.5 py-0.5 rounded bg-slate-200 text-slate-900 border border-slate-300">
                                  {sub.count}
                                </span>
                              </button>

                              {/* Individual Point Labels under this Subcategory */}
                              {subPoints.length > 0 && (
                                <div className="pl-3.5 space-y-1 my-1 border-l-2 border-orange-300/60">
                                  {subPoints.map((pt) => (
                                    <button
                                      key={pt.id}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (onSelectPoint) {
                                          onSelectPoint(pt);
                                        }
                                      }}
                                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs text-left transition-all cursor-pointer bg-white hover:bg-orange-50 hover:text-orange-950 border border-slate-200/80 hover:border-orange-300 shadow-2xs group"
                                      title={`Open point thread: "${pt.title}"`}
                                    >
                                      <span className="truncate font-semibold text-slate-800 group-hover:text-orange-950 text-[11px] flex-1 pr-1.5">
                                        📍 {pt.title}
                                      </span>
                                      <span className="text-[9px] font-mono text-slate-400 shrink-0">
                                        @{pt.authorMoniker}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Direct Point Labels belonging to this Category */}
                        {(() => {
                          const subCatNames = new Set(cat.subcategories.map(s => s.name));
                          const catPointsWithoutSub = (points || []).filter(
                            p => p.category === cat.name && (!p.subcategory || !subCatNames.has(p.subcategory))
                          );
                          if (catPointsWithoutSub.length === 0) return null;

                          return (
                            <div className="pt-1 space-y-1 border-t border-slate-200/60">
                              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block px-1">
                                Points in {cat.name}:
                              </span>
                              {catPointsWithoutSub.map((pt) => (
                                <button
                                  key={pt.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onSelectPoint) {
                                      onSelectPoint(pt);
                                    }
                                  }}
                                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs text-left transition-all cursor-pointer bg-white hover:bg-orange-50 hover:text-orange-950 border border-slate-200/80 hover:border-orange-300 shadow-2xs group"
                                  title={`Open point thread: "${pt.title}"`}
                                >
                                  <span className="truncate font-semibold text-slate-800 group-hover:text-orange-950 text-[11px] flex-1 pr-1.5">
                                    📍 {pt.title}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-400 shrink-0">
                                    @{pt.authorMoniker}
                                  </span>
                                </button>
                              ))}
                            </div>
                          );
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Target Audience / Voice Filters */}
      <div className="space-y-3 pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-orange-600" /> Your Voice Forums
          </h4>
          {activeFilters.audience && (
            <button
              onClick={() => selectAudience(null)}
              className="text-[10px] font-bold text-orange-600 hover:underline cursor-pointer"
            >
              Show All Forums
            </button>
          )}
        </div>

        {/* Single List Panel for Your Voice Forums */}
        <div className="flex flex-col space-y-1.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin" id="your-voice-forums-single-list">
          {voices.map((voice) => {
            const isAll = voice.id === "all";
            const isSelected = isAll
              ? activeFilters.audience === null
              : activeFilters.audience === voice.id;
            const count = isAll ? null : audienceCounts[voice.id] || 0;

            // Light-theme high-contrast colors matching system standard
            const audienceColors: { [key: string]: { border: string, bg: string, text: string, activeBg: string } } = {
              "all": { border: "border-slate-200 bg-white", bg: "bg-white", text: "text-slate-900", activeBg: "border-orange-500 bg-orange-50 text-orange-950 ring-2 ring-orange-500/30 font-extrabold" },
              "SilentMajority": { border: "border-slate-200 bg-white", bg: "bg-white", text: "text-slate-900", activeBg: "border-sky-500 bg-sky-50 text-sky-950 ring-2 ring-sky-500/30 font-extrabold" },
              "Makers": { border: "border-slate-200 bg-white", bg: "bg-white", text: "text-slate-900", activeBg: "border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/30 font-extrabold" },
              "Creators": { border: "border-slate-200 bg-white", bg: "bg-white", text: "text-slate-900", activeBg: "border-violet-500 bg-violet-50 text-violet-950 ring-2 ring-violet-500/30 font-extrabold" },
              "Innovators": { border: "border-slate-200 bg-white", bg: "bg-white", text: "text-slate-900", activeBg: "border-blue-500 bg-blue-50 text-blue-950 ring-2 ring-blue-500/30 font-extrabold" },
              "Traders": { border: "border-slate-200 bg-white", bg: "bg-white", text: "text-slate-900", activeBg: "border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/30 font-extrabold" },
              "Preservers": { border: "border-slate-200 bg-white", bg: "bg-white", text: "text-slate-900", activeBg: "border-teal-500 bg-teal-50 text-teal-950 ring-2 ring-teal-500/30 font-extrabold" },
              "ForgottenMinority": { border: "border-slate-200 bg-white", bg: "bg-white", text: "text-slate-900", activeBg: "border-orange-500 bg-orange-50 text-orange-950 ring-2 ring-orange-500/30 font-extrabold" },
              "AbandonedAlone": { border: "border-slate-200 bg-white", bg: "bg-white", text: "text-slate-900", activeBg: "border-slate-600 bg-slate-100 text-slate-950 ring-2 ring-slate-500/30 font-extrabold" },
              "CancelledNoHope": { border: "border-slate-200 bg-white", bg: "bg-white", text: "text-slate-900", activeBg: "border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-500/30 font-extrabold" },
              "UnheardAngry": { border: "border-slate-200 bg-white", bg: "bg-white", text: "text-slate-900", activeBg: "border-red-500 bg-red-50 text-red-950 ring-2 ring-red-500/30 font-extrabold" },
              "DestituteDeserted": { border: "border-slate-200 bg-white", bg: "bg-white", text: "text-slate-900", activeBg: "border-pink-500 bg-pink-50 text-pink-950 ring-2 ring-pink-500/30 font-extrabold" },
              "Controversial": { border: "border-slate-200 bg-white", bg: "bg-white", text: "text-slate-900", activeBg: "border-red-600 bg-red-50 text-red-950 ring-2 ring-red-600/30 font-extrabold" },
              "Anti-Establishment": { border: "border-slate-200 bg-white", bg: "bg-white", text: "text-slate-900", activeBg: "border-teal-600 bg-teal-50 text-teal-950 ring-2 ring-teal-600/30 font-extrabold" },
              "PeopleOfTomorrow": { border: "border-slate-200 bg-white", bg: "bg-white", text: "text-slate-900", activeBg: "border-cyan-500 bg-cyan-50 text-cyan-950 ring-2 ring-cyan-500/30 font-extrabold" }
            };

            const col = audienceColors[voice.id] || { 
              border: "border-slate-200 bg-white", 
              bg: "bg-white", 
              text: "text-slate-900", 
              activeBg: "border-orange-500 bg-orange-50 text-orange-950 ring-2 ring-orange-500/30 font-extrabold" 
            };

            return (
              <button
                key={voice.id}
                onClick={() => selectAudience(isAll ? null : voice.id)}
                className={`w-full px-3 py-2 rounded-xl border text-left text-xs transition-all cursor-pointer hover:scale-[1.005] active:scale-[0.995] flex items-center justify-between gap-2.5 ${
                  isSelected
                    ? col.activeBg
                    : `${col.border} text-slate-800 hover:border-orange-300 hover:bg-slate-50`
                }`}
                title={voice.desc}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900 truncate block text-xs">
                      {voice.label}
                    </span>
                    {(voice.id === "Makers" || voice.id === "Creators") && (
                      <span className={`text-[8px] uppercase tracking-wider px-1 py-0.2 rounded font-mono font-bold inline-block shrink-0 ${
                        isSelected ? "bg-black/20 text-white" : "bg-orange-100 text-orange-800 border border-orange-300"
                      }`}>
                        PARAMOUNT
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal block leading-tight truncate mt-0.5">
                    {voice.desc}
                  </span>
                </div>
                {!isAll && (
                  <span
                    className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                      isSelected ? "bg-black/20 text-current" : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
