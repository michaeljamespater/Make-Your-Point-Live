import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Point, ReactionType } from "../types";
import {
  Volume2,
  Award,
  Heart,
  Lightbulb,
  MessageSquare,
  Calendar,
  User,
  Tag,
  Bookmark,
  ArrowUp,
  ArrowDown,
  Edit3,
  Trash2,
  Flame,
  Share2,
  Copy,
  Download,
  Check,
  ExternalLink,
  Globe,
  Link2,
  X,
  Maximize2,
  ZoomIn,
  Mic
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { VoicePlayer } from "./VoicePlayer";

interface PointCardProps {
  key?: string | number;
  point: Point;
  onSelect: (point: Point) => void;
  isSelected?: boolean;
  isEditorMode?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onStartLinking?: (point: Point) => void;
  onSparkConnection?: (point: Point) => void;
  onOpenDirectChat?: (authorMoniker: string) => void;
}

const CATEGORY_COLORS: { [key: string]: string } = {
  Success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Failure: "bg-red-50 text-red-700 border-red-200",
  Present: "bg-blue-50 text-blue-700 border-blue-200",
  Past: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Future: "bg-purple-50 text-purple-700 border-purple-200",
  Anticipation: "bg-pink-50 text-pink-700 border-pink-200",
  Expectation: "bg-teal-50 text-teal-700 border-teal-200",
  Achievement: "bg-amber-50 text-amber-700 border-amber-200",
  Disappointment: "bg-rose-50 text-rose-700 border-rose-200",
  Problem: "bg-orange-50 text-orange-700 border-orange-200",
  Dissatisfaction: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Other: "bg-slate-100 text-slate-700 border-slate-200"
};

export default function PointCard({
  point,
  onSelect,
  isSelected,
  isEditorMode = false,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
  onDelete,
  onEdit,
  onStartLinking,
  onSparkConnection,
  onOpenDirectChat
}: PointCardProps) {
  const [reactions, setReactions] = useState(point.reactions);
  const [userReacted, setUserReacted] = useState<{ [key in ReactionType]?: boolean }>({});
  const [isReacting, setIsReacting] = useState<string | null>(null);

  const [showSharePanel, setShowSharePanel] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!expandedPhotoUrl) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExpandedPhotoUrl(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedPhotoUrl]);

  const toggleSharePanel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSharePanel(prev => !prev);
  };

  const copyDirectLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const linkUrl = `${window.location.origin}/?point=${point.id}`;
    
    navigator.clipboard.writeText(linkUrl)
      .then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy link:", err);
      });
  };

  const copyAsTextCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const divider = "━".repeat(40);
    const webAddressLine = point.webAddress ? `🌐 WEB ADDRESS: ${point.webAddress}\n` : "";
    const textCard = `
📢 [MAKE YOUR POINT - Independent Thought]
${divider}
📍 CATEGORY: ${point.category.toUpperCase()}
👤 AUTHOR: ${point.authorMoniker}
🎯 VOICING FOR: ${point.targetAudience}
${webAddressLine}${divider}
⚡ TITLE: "${point.title}"

"${point.content}"

💬 Join the conversation, stand up, and make your point!
🔗 See full thread here: ${window.location.origin}/?point=${point.id}
${divider}
    `.trim();
    
    navigator.clipboard.writeText(textCard)
      .then(() => {
        setCopiedText(true);
        setTimeout(() => setCopiedText(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy card:", err);
      });
  };

  const escapeXml = (unsafe: string) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  const downloadCardAsSVG = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Split content into lines of roughly 55 characters for the SVG poster
    const maxCharsPerLine = 55;
    const words = point.content.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";
    
    words.forEach(word => {
      if ((currentLine + " " + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    
    // Only display up to 9 lines to prevent overflow on the SVG
    const displayLines = lines.slice(0, 9);
    const hasMore = lines.length > 9;
    if (hasMore) {
      displayLines[displayLines.length - 1] += "... (read more online)";
    }
    
    const svgHeight = 440 + (displayLines.length * 22);
    const textStartY = 175;
    
    // Determine category accent color for the SVG header
    let accentColor = "#f59e0b"; // yellow
    if (point.category.includes("Innovation")) accentColor = "#d946ef"; // fuchsia
    else if (point.category.includes("Production")) accentColor = "#8b5cf6"; // violet
    else if (point.category.includes("Delivery")) accentColor = "#f43f5e"; // rose
    else if (point.category === "Point") accentColor = "#0ea5e9"; // sky
    else if (point.category === "Point-to-Point") accentColor = "#6366f1"; // indigo
    else if (point.category === "Point of Conversation") accentColor = "#14b8a6"; // teal
    else if (point.category === "Point of Argument") accentColor = "#f97316"; // orange
    else if (point.category === "Point of Agreement") accentColor = "#10b981"; // emerald
    
    const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 ${svgHeight}" width="100%" height="100%">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" stop-opacity="1" />
      <stop offset="100%" stop-color="#020617" stop-opacity="1" />
    </linearGradient>
    <linearGradient id="glow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
    </linearGradient>
  </defs>
  
  <!-- Main Card Canvas -->
  <rect width="600" height="${svgHeight}" rx="24" fill="url(#bg-grad)" stroke="#1e293b" stroke-width="2" />
  
  <!-- Subtle Glow Effect -->
  <rect x="2" y="2" width="596" height="150" rx="22" fill="url(#glow-grad)" pointer-events="none" />
  
  <!-- Corner Accent Border -->
  <path d="M 2 40 L 2 24 A 24 24 0 0 1 26 2 L 60 2" fill="none" stroke="${accentColor}" stroke-width="3" />
  
  <!-- Branding / Header -->
  <text x="40" y="55" font-family="'Space Grotesk', system-ui, sans-serif" font-size="13" font-weight="900" fill="#f97316" letter-spacing="2">MAKE YOUR POINT</text>
  <text x="40" y="72" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="#64748b" letter-spacing="3">INDEPENDENT MIND FORUM</text>
  
  <!-- Category Badge -->
  <rect x="40" y="100" width="160" height="26" rx="13" fill="${accentColor}15" stroke="${accentColor}30" stroke-width="1" />
  <text x="120" y="117" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="${accentColor}" text-anchor="middle">${point.category}</text>
  
  <!-- Demographic Target -->
  <rect x="210" y="100" width="120" height="26" rx="6" fill="#f9731610" stroke="#f9731630" stroke-width="1" />
  <text x="270" y="117" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="#f97316" text-anchor="middle">${point.targetAudience.toUpperCase()}</text>
  
  <!-- Title -->
  <text x="40" y="152" font-family="'Space Grotesk', system-ui, sans-serif" font-size="16" font-weight="700" fill="#ffffff">${escapeXml(point.title.length > 55 ? point.title.substring(0, 52) + "..." : point.title)}</text>
  
  <!-- Content Lines -->
  ${displayLines.map((line, idx) => `
  <text x="40" y="${textStartY + (idx * 22)}" font-family="system-ui, sans-serif" font-size="13" fill="#cbd5e1">${escapeXml(line)}</text>
  `).join("")}
  
  <!-- Author and Date Line -->
  <line x1="40" y1="${svgHeight - 110}" x2="560" y2="${svgHeight - 110}" stroke="#1e293b" stroke-width="1" />
  
  <text x="40" y="${svgHeight - 85}" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#f1f5f9">By ${escapeXml(point.authorMoniker)}</text>
  <text x="40" y="${svgHeight - 68}" font-family="system-ui, sans-serif" font-size="10" fill="#64748b">Published: ${new Date(point.createdAt).toLocaleDateString()}</text>
  ${point.webAddress ? `
  <text x="40" y="${svgHeight - 48}" font-family="'JetBrains Mono', monospace" font-size="9" font-weight="700" fill="#f97316">🌐 Link: ${escapeXml(point.webAddress)}</text>
  ` : ""}
  
  <!-- Stats Section -->
  <g transform="translate(380, ${svgHeight - 92})">
    <!-- Hear Hear Counter -->
    <rect x="0" y="0" width="80" height="24" rx="12" fill="#f9731615" stroke="#f9731630" />
    <text x="40" y="15" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#f97316" text-anchor="middle">Hear: ${reactions.hearHear}</text>
    
    <!-- Support Counter -->
    <rect x="90" y="0" width="80" height="24" rx="12" fill="#f43f5e15" stroke="#f43f5e30" />
    <text x="130" y="15" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#f43f5e" text-anchor="middle">Support: ${reactions.supported}</text>
  </g>
  
  <!-- Platform watermark link -->
  <text x="560" y="${svgHeight - 35}" font-family="'JetBrains Mono', monospace" font-size="9" fill="#475569" text-anchor="end">make-your-point.app</text>
</svg>
    `.trim();
    
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `point_\${point.id}_card.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSpark = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userReacted.hearHear) {
      handleReact("hearHear", e);
    }
    if (onSparkConnection) {
      onSparkConnection(point);
    } else if (onStartLinking) {
      onStartLinking(point);
    } else {
      onSelect(point);
    }
  };

  const handleReact = async (type: ReactionType, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card selection
    if (userReacted[type] || isReacting) return;

    setIsReacting(type);
    try {
      const response = await fetch(`/api/points/${point.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType: type })
      });

      if (response.ok) {
        setReactions(prev => ({
          ...prev,
          [type]: prev[type] + 1
        }));
        setUserReacted(prev => ({ ...prev, [type]: true }));
      }
    } catch (err) {
      console.error("Error sending reaction:", err);
    } finally {
      setIsReacting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={() => onSelect(point)}
      className={`relative p-5 rounded-2xl bg-white border cursor-pointer transition-all shadow-card-elevated hover:shadow-card-highlight ${
        isSelected
          ? "border-brand-accent ring-2 ring-orange-500/20 shadow-lg shadow-orange-500/10 bg-orange-50/20"
          : "border-slate-200/80 hover:border-slate-300"
      }`}
      id={`point-card-${point.id}`}
    >
      {isEditorMode && (
        <div 
          className="flex items-center justify-between bg-brand-bg/60 border border-brand-border/40 p-2.5 rounded-xl mb-4 gap-2 text-xs"
          onClick={(e) => e.stopPropagation()}
          id={`curator-controls-${point.id}`}
        >
          <span className="text-[9px] uppercase font-mono font-bold text-gray-500 tracking-wider">Curator Controls</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp && onMoveUp(); }}
              disabled={!canMoveUp}
              className="p-1.5 rounded-lg bg-brand-bg border border-brand-border/30 text-gray-400 hover:text-brand-accent hover:border-brand-accent/40 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-brand-border/30 cursor-pointer transition-colors"
              title="Move Up (Rearrange)"
              id={`btn-move-up-${point.id}`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown && onMoveDown(); }}
              disabled={!canMoveDown}
              className="p-1.5 rounded-lg bg-brand-bg border border-brand-border/30 text-gray-400 hover:text-brand-accent hover:border-brand-accent/40 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:border-brand-border/30 cursor-pointer transition-colors"
              title="Move Down (Rearrange)"
              id={`btn-move-down-${point.id}`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit && onEdit(); }}
              className="p-1.5 rounded-lg bg-brand-accent/10 border border-brand-accent/20 text-brand-accent hover:text-brand-accent-glow hover:border-brand-accent/50 cursor-pointer transition-colors flex items-center gap-1 text-[10px] font-bold"
              title="Edit & Spellcheck Draft"
              id={`btn-edit-${point.id}`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete && onDelete(); }}
              className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 hover:border-red-500/40 cursor-pointer transition-colors"
              title="Delete (Subtract)"
              id={`btn-delete-${point.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      {/* Category / Subcategory Badge Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`px-2.5 py-0.5 rounded-full font-bold border ${
              CATEGORY_COLORS[point.category] || "bg-slate-100 text-slate-800 border-slate-300"
            }`}
          >
            {point.category}
          </span>
          <span className="text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300 font-bold">
            {point.subcategory}
          </span>
          {point.media && point.media.some(m => m.type === "audio") && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 border border-amber-500/30">
              <Mic className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Voice Note</span>
            </span>
          )}
          {point.repliesCount && point.repliesCount > 0 ? (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300"
              title={`${point.repliesCount} active chat discussion replies on this subject`}
            >
              <MessageSquare className="w-3 h-3 text-orange-600 shrink-0" />
              <span>{point.repliesCount} Chat{point.repliesCount === 1 ? "" : "s"}</span>
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Dynamic Demographic Voicing badge */}
          <span className="text-[10px] uppercase tracking-wider text-orange-900 bg-orange-100 border border-orange-300 px-2 py-0.5 rounded font-mono font-bold">
            {point.targetAudience}
          </span>
          {onDelete && !isEditorMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 rounded-md bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 hover:text-red-700 transition-colors cursor-pointer"
              title="Delete (Remove) Point"
              id={`btn-delete-card-${point.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Backlink indicator */}
      {point.linkedFromPointId && (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-700 font-mono mb-2.5 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-xl w-max">
          <span className="text-orange-700 font-extrabold uppercase text-[9px]">← Response To</span>
          <span className="truncate max-w-[160px] text-slate-900 font-extrabold">{point.linkedFromPointTitle}</span>
        </div>
      )}

      {/* Main Title */}
      <h4 className="text-base sm:text-lg font-display font-extrabold text-slate-950 mb-2 leading-snug hover:text-orange-700 transition-colors">
        {point.title}
      </h4>

      {/* Excerpt/Body */}
      <p className="text-sm sm:text-base text-slate-900 font-normal leading-relaxed line-clamp-3 mb-4 whitespace-pre-line">
        {point.content}
      </p>

      {/* Media Attachments */}
      {point.media && point.media.length > 0 && (
        <div className="grid grid-cols-1 gap-2 mb-4">
          {point.media.map((item, idx) => (
            <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-900/5 p-1 max-h-[240px] flex items-center justify-center group" onClick={(e) => e.stopPropagation()}>
              {item.type === "video" ? (
                <video
                  src={item.url}
                  controls
                  className="max-h-[240px] w-full object-contain rounded-lg"
                  style={{ maxHeight: "240px" }}
                  preload="metadata"
                />
              ) : item.type === "audio" ? (
                <VoicePlayer
                  url={item.url}
                  title={item.name || "Voice Note"}
                  authorMoniker={point.authorMoniker}
                  category={point.category}
                />
              ) : (
                <div
                  className="relative w-full h-full max-h-[240px] cursor-pointer group flex items-center justify-center overflow-hidden rounded-lg bg-black/5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedPhotoUrl(item.url);
                  }}
                  title="Click to view full size photo"
                >
                  <img
                    src={item.url}
                    alt={item.name || "Attached Photo"}
                    className="max-h-[240px] w-full object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
                    style={{ maxHeight: "240px" }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.img-error-fallback')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'img-error-fallback flex flex-col items-center justify-center p-4 text-xs font-mono text-slate-500 bg-slate-100 rounded-lg w-full h-32 text-center';
                        fallback.innerHTML = '<span>🖼️ Photo unavailable (legacy file link)</span>';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 text-white font-mono text-xs font-bold pointer-events-none">
                    <ZoomIn className="w-5 h-5 text-amber-400" />
                    <span>Click to Expand Photo</span>
                  </div>
                  <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-amber-400" />
                    Full View
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tags list */}
      {point.tags && point.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {point.tags.map(t => (
            <span
              key={t}
              className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md hover:text-orange-700 flex items-center gap-0.5"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Web Address External Link Badge */}
      {point.webAddress && (
        <div className="mb-4" onClick={(e) => e.stopPropagation()}>
          <a
            href={point.webAddress.startsWith("http") ? point.webAddress : `https://${point.webAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-100 border border-orange-300 hover:border-orange-500 hover:bg-orange-200 text-orange-900 text-xs font-bold font-mono transition-all duration-200 shadow-xs"
            title={`Visit author's external address: ${point.webAddress}`}
          >
            <Globe className="w-3.5 h-3.5 text-orange-600 shrink-0 animate-pulse" />
            <span>Visit Web Address: {point.webAddress.replace(/^https?:\/\/(www\.)?/i, '')}</span>
            <ExternalLink className="w-3 h-3 text-orange-700 shrink-0 ml-0.5" />
          </a>
        </div>
      )}

      {/* Bottom Footer Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-300 text-xs text-slate-700">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 font-bold text-slate-950">
            <User className="w-3.5 h-3.5 text-orange-600" />
            {point.authorMoniker}
          </span>
          {onOpenDirectChat && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDirectChat(point.authorMoniker);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-[10px] font-mono font-bold transition-colors cursor-pointer"
              title={`Start private chat with ${point.authorMoniker}`}
            >
              <MessageSquare className="w-3 h-3 text-amber-600" />
              <span>Private Chat</span>
            </button>
          )}
          <span className="text-slate-400">•</span>
          <span className="flex items-center gap-1 text-slate-700 font-medium">
            <Calendar className="w-3 h-3 text-slate-500" />
            {formatDate(point.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {point.sponsorshipsTotal && point.sponsorshipsTotal > 0 ? (
            <span className="flex items-center gap-1 text-orange-950 bg-orange-100 border border-orange-300 px-2.5 py-1 rounded-full text-[11px] font-extrabold font-mono" title="Total micro-sponsorship funds raised">
              <Flame className="w-3.5 h-3.5 text-orange-600 animate-pulse shrink-0" />
              £{point.sponsorshipsTotal.toFixed(2)}
            </span>
          ) : null}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(point);
            }}
            className="flex items-center gap-1 text-slate-900 bg-orange-100 hover:bg-orange-200 border border-orange-300 hover:border-orange-400 px-2.5 py-1 rounded-full text-[11px] font-extrabold font-mono hover:text-orange-950 transition-colors cursor-pointer"
            title="Open chat & conversation thread for this Point"
            id={`btn-open-chat-${point.id}`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>{point.repliesCount || 0} Chat{point.repliesCount === 1 ? "" : "s"}</span>
            {point.repliesCount && point.repliesCount >= 2 ? (
              <span className="ml-0.5 bg-orange-600 text-white text-[8px] px-1.5 py-0.2 rounded-full font-sans font-black uppercase tracking-wider">
                Hot
              </span>
            ) : null}
          </button>
          <button
            onClick={toggleSharePanel}
            className="flex items-center gap-1 text-slate-900 bg-slate-100 border border-slate-300 hover:border-orange-400 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono hover:text-orange-700 hover:bg-orange-50 transition-colors cursor-pointer"
            title="Share & Export this Point card"
          >
            <Share2 className="w-3.5 h-3.5 text-orange-600 shrink-0" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Primary Action Row: Respond / Point to Point & Spark Connection */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={(e) => {
            e.stopPropagation();
            if (onStartLinking) {
              onStartLinking(point);
            } else {
              onSelect(point);
            }
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-brand-accent hover:bg-orange-600 text-white shadow-xs transition-all cursor-pointer border border-orange-600"
          title="Respond / Point to Point - Raise a connected point or reply to thread"
          id={`btn-respond-p2p-${point.id}`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Respond / Point to Point</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSpark}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-xs transition-all cursor-pointer border border-amber-600 font-mono"
          title="Spark Connection - Ignite and connect this Point to another Point"
          id={`btn-spark-connection-${point.id}`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-950 shrink-0 animate-pulse" />
          <span>Spark Connection</span>
        </motion.button>
      </div>

      {/* Constructive Reactions Bar */}
      <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-200 justify-between">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => handleReact("hearHear", e)}
          disabled={userReacted.hearHear}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            userReacted.hearHear
              ? "bg-orange-600 border-orange-700 text-white shadow-sm"
              : "bg-orange-50 border-orange-300 text-orange-950 hover:bg-orange-100 hover:border-orange-400"
          }`}
          title="Hear, Hear! I agree or validate this."
        >
          <Volume2 className="w-3.5 h-3.5 text-orange-700" />
          <span>Hear Hear ({reactions.hearHear})</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => handleReact("respect", e)}
          disabled={userReacted.respect}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            userReacted.respect
              ? "bg-indigo-600 border-indigo-700 text-white shadow-sm"
              : "bg-indigo-50 border-indigo-300 text-indigo-950 hover:bg-indigo-100 hover:border-indigo-400"
          }`}
          title="Respect. Understood and acknowledged."
        >
          <Award className="w-3.5 h-3.5 text-indigo-700" />
          <span>Respect ({reactions.respect})</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => handleReact("supported", e)}
          disabled={userReacted.supported}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            userReacted.supported
              ? "bg-rose-600 border-rose-700 text-white shadow-sm"
              : "bg-rose-50 border-rose-300 text-rose-950 hover:bg-rose-100 hover:border-rose-400"
          }`}
          title="Supported. Offering backing and solidarity."
        >
          <Heart className="w-3.5 h-3.5 text-rose-700" />
          <span>Support ({reactions.supported})</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={(e) => handleReact("thoughtProvoking", e)}
          disabled={userReacted.thoughtProvoking}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            userReacted.thoughtProvoking
              ? "bg-amber-500 border-amber-600 text-slate-950 shadow-sm"
              : "bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100 hover:border-amber-400"
          }`}
          title="Thought-provoking. Made me think deeply."
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-700" />
          <span>Reflect ({reactions.thoughtProvoking})</span>
        </motion.button>
      </div>

      {/* Elegant Absolute Share Overlay Panel */}
      <AnimatePresence>
        {showSharePanel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()} // Block card select clicks
            className="absolute inset-0 bg-slate-950/95 border border-brand-accent/40 rounded-2xl p-5 flex flex-col justify-between z-20"
            id={`share-panel-${point.id}`}
          >
            {/* Share panel header */}
            <div className="flex items-center justify-between border-b border-brand-border/40 pb-2">
              <div className="flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-brand-accent" />
                <span className="text-xs font-display font-black text-white uppercase tracking-wider">Share & Export Point</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setShowSharePanel(false); }}
                className="p-1 rounded-lg hover:bg-slate-900 text-gray-500 hover:text-white cursor-pointer transition-colors"
                id={`btn-close-share-${point.id}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content preview */}
            <div className="my-2 p-2.5 rounded-xl bg-brand-bg/50 border border-brand-border/30 text-left">
              <span className="text-[9px] font-mono font-bold text-brand-accent-glow uppercase tracking-wider block mb-0.5">Title Preview</span>
              <p className="text-xs font-bold text-white truncate">{point.title}</p>
              <p className="text-[10px] text-gray-400 truncate mt-0.5">By {point.authorMoniker} • {point.category}</p>
            </div>

            {/* Sharing actions stack */}
            <div className="space-y-2">
              {/* Action 1: Copy Direct Link */}
              <button
                onClick={copyDirectLink}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-brand-bg hover:bg-slate-900 border border-brand-border/40 hover:border-brand-accent/30 text-left transition-all cursor-pointer group"
                id={`btn-copy-link-${point.id}`}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-500/10 text-brand-accent group-hover:scale-105 transition-transform">
                    <Copy className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-200 block">Copy Direct Link</span>
                    <span className="text-[9px] text-gray-500 block">Copy unique thread URL to clipboard</span>
                  </div>
                </div>
                {copiedLink ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono">
                    <Check className="w-3 h-3" /> Copied!
                  </span>
                ) : (
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-brand-accent transition-colors" />
                )}
              </button>

              {/* Action 2: Copy Plain-Text Poster */}
              <button
                onClick={copyAsTextCard}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-brand-bg hover:bg-slate-900 border border-brand-border/40 hover:border-brand-accent/30 text-left transition-all cursor-pointer group"
                id={`btn-copy-text-${point.id}`}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-200 block">Copy Social Share Card</span>
                    <span className="text-[9px] text-gray-500 block">Copy formatted plain-text poster block</span>
                  </div>
                </div>
                {copiedText ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono">
                    <Check className="w-3 h-3" /> Copied!
                  </span>
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                )}
              </button>

              {/* Action 3: Download Vector Poster SVG */}
              <button
                onClick={downloadCardAsSVG}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-orange-500/10 to-pink-500/10 hover:from-orange-500/20 hover:to-pink-500/20 border border-brand-border/40 hover:border-brand-accent/50 text-left transition-all cursor-pointer group"
                id={`btn-download-svg-${point.id}`}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-brand-accent/15 text-brand-accent group-hover:scale-105 transition-transform">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-brand-accent-glow block">Download Vector Poster (.svg)</span>
                    <span className="text-[9px] text-gray-400 block">Download gorgeous scalable social graphic</span>
                  </div>
                </div>
                <Download className="w-3.5 h-3.5 text-brand-accent group-hover:translate-y-0.5 transition-transform" />
              </button>
            </div>

            {/* Bottom encourager watermark */}
            <div className="text-center pt-2 border-t border-brand-border/20">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-black">
                Encourage Success & Proud Discovery
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Lightbox Expansion Modal */}
      {expandedPhotoUrl && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          <motion.div
            key={`photo-lightbox-${point.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              e.stopPropagation();
              setExpandedPhotoUrl(null);
            }}
            className="fixed inset-0 z-[99999] bg-slate-950/95 flex items-center justify-center p-4 sm:p-8"
            id={`photo-lightbox-modal-${point.id}`}
          >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center bg-slate-900 border border-slate-700/80 rounded-2xl p-3 sm:p-5 shadow-2xl overflow-hidden text-white"
              >
                {/* Header bar */}
                <div className="w-full flex items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-800 text-white">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                      Photo Attachment
                    </span>
                    <span className="text-xs font-bold text-slate-300 truncate">
                      {point.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={expandedPhotoUrl}
                      download={`photo-${point.id || 'attachment'}.jpg`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-mono flex items-center gap-1.5"
                      title="Download full size photo"
                    >
                      <Download className="w-4 h-4 text-amber-400" />
                      <span className="hidden sm:inline">Download Photo</span>
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedPhotoUrl(null);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Close Photo Viewer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Photo */}
                <div className="relative max-h-[75vh] w-full flex items-center justify-center overflow-auto rounded-xl bg-black/40 p-2">
                  <img
                    src={expandedPhotoUrl}
                    alt="Expanded Full Photo"
                    className="max-h-[72vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent && !parent.querySelector('.img-modal-error')) {
                        const fallback = document.createElement('div');
                        fallback.className = 'img-modal-error flex flex-col items-center justify-center p-8 text-sm font-mono text-slate-400 text-center gap-2';
                        fallback.innerHTML = '<span>🖼️ Photo preview unavailable or link expired</span>';
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                </div>

                {/* Footer info */}
                <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 mt-3 pt-2 border-t border-slate-800">
                  <span>By {point.authorMoniker} • {point.category}</span>
                  <span className="text-amber-400/90 font-bold">Press ESC or click backdrop to exit</span>
                </div>
              </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
}
