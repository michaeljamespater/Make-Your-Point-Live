import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Point, Reply } from "../types";
import {
  X,
  MessageSquare,
  Send,
  User,
  Clock,
  ChevronLeft,
  Volume2,
  Award,
  Heart,
  Lightbulb,
  Link2,
  Plus,
  CornerDownRight,
  Edit3,
  Flame,
  Coins,
  Trash2,
  Maximize2,
  ZoomIn,
  ExternalLink,
  Download,
  Mic,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { VoicePlayer } from "./VoicePlayer";
import { VoiceRecorder } from "./VoiceRecorder";

interface ReplySectionProps {
  point: Point;
  onClose: () => void;
  onReplyAdded: () => void;
  allPoints: Point[];
  onSelectPoint: (pt: Point) => void;
  onStartLinking: (pt: Point) => void;
  isEditorMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onOpenSponsor?: () => void;
  onOpenDirectChat?: (authorMoniker: string) => void;
}

export default function ReplySection({
  point,
  onClose,
  onReplyAdded,
  allPoints,
  onSelectPoint,
  onStartLinking,
  isEditorMode = false,
  onEdit,
  onDelete,
  onOpenSponsor,
  onOpenDirectChat
}: ReplySectionProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [sponsorships, setSponsorships] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"conversation" | "sponsorships">("conversation");
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [commenterMoniker, setCommenterMoniker] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState<string | null>(null);
  const [copiedReplyId, setCopiedReplyId] = useState<string | null>(null);

  const handleCopyReply = (id: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedReplyId(id);
    setTimeout(() => setCopiedReplyId(null), 2000);
  };
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

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

  useEffect(() => {
    fetchReplies();
    fetchSponsorships();
  }, [point.id]);

  const fetchReplies = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/points/${point.id}/replies`);
      if (response.ok) {
        const data = await response.json();
        setReplies(data);
      }
    } catch (err) {
      console.error("Error loading replies:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSponsorships = async () => {
    try {
      const response = await fetch(`/api/points/${point.id}/sponsorships`);
      if (response.ok) {
        const data = await response.json();
        setSponsorships(data);
      }
    } catch (err) {
      console.error("Error loading sponsorships:", err);
    }
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/points/${point.id}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment.trim(),
          authorMoniker: commenterMoniker.trim() || undefined
        })
      });

      if (response.ok) {
        const reply = await response.json();
        setReplies(prev => [...prev, reply]);
        setNewComment("");
        onReplyAdded();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to post comment.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div
      className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col h-full max-h-[85vh] sm:max-h-none overflow-hidden shadow-card-highlight"
      id={`reply-section-container-${point.id}`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          id="back-to-index-button"
        >
          <ChevronLeft className="w-4 h-4 text-orange-600" />
          <span>Back to Form / Points</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
            id="btn-switch-to-new-point-form"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Write New Point</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            id="close-replies-button"
            title="Close Thread"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Parent backlink if this point was raised in response to another */}
      {point.linkedFromPointId && (
        <div className="mb-3 shrink-0">
          <button
            onClick={() => {
              const parentPt = allPoints.find(p => p.id === point.linkedFromPointId);
              if (parentPt) {
                onSelectPoint(parentPt);
              }
            }}
            className="w-full text-left flex items-center gap-2.5 p-2.5 rounded-xl bg-orange-50/80 border border-orange-200 hover:border-orange-300 text-xs text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-sm"
            title="Click to view the original parent point"
          >
            <CornerDownRight className="w-4 h-4 text-brand-accent shrink-0" style={{ transform: "scaleX(-1) rotate(-90deg)" }} />
            <div className="truncate flex-1">
              <span className="text-[10px] text-slate-500 uppercase font-mono block tracking-wider font-bold">Connected Response To:</span>
              <span className="font-bold text-slate-900 truncate block">{point.linkedFromPointTitle || "View Parent Point"}</span>
            </div>
          </button>
        </div>
      )}

      {/* Point details */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 shrink-0 overflow-y-auto max-h-[300px]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] uppercase font-mono font-semibold text-orange-700 bg-orange-100 px-2 py-0.5 rounded border border-orange-200">
            {point.targetAudience}
          </span>
          <span className="text-xs text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
            {point.category} • {point.subcategory}
          </span>
        </div>
        <h4 className="text-sm font-display font-bold text-slate-950 mb-1">
          {point.title}
        </h4>
        <p className="text-sm text-slate-900 leading-relaxed font-medium whitespace-pre-line mb-3">
          {point.content}
        </p>

        {/* Media Attachments */}
        {point.media && point.media.length > 0 && (
          <div className="grid grid-cols-1 gap-2 mt-2 mb-2">
            {point.media.map((item, idx) => (
              <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 p-1 max-h-[220px] flex items-center justify-center">
                {item.type === "video" ? (
                  <video
                    src={item.url}
                    controls
                    className="max-h-[220px] w-full object-contain"
                    preload="metadata"
                  />
                ) : item.type === "audio" ? (
                  <VoicePlayer
                    url={item.url}
                    title={item.name || "Voice Note"}
                    authorMoniker={point.authorMoniker}
                    category={point.category}
                    compact
                  />
                ) : (
                  <div
                    className="relative w-full h-full max-h-[220px] cursor-pointer group flex items-center justify-center overflow-hidden rounded-lg bg-black/5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedPhotoUrl(item.url);
                    }}
                    title="Click to view full size photo"
                  >
                    <img
                      src={item.url}
                      alt={item.name || "Attached Photo"}
                      className="max-h-[220px] w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.img-error-fallback')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'img-error-fallback flex flex-col items-center justify-center p-4 text-xs font-mono text-slate-500 bg-slate-100 rounded-lg w-full h-28 text-center';
                          fallback.innerHTML = '<span>🖼️ Photo unavailable</span>';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 text-white font-mono text-xs font-bold pointer-events-none">
                      <ZoomIn className="w-5 h-5 text-amber-400" />
                      <span>Click to Expand Photo</span>
                    </div>
                    <span className="absolute bottom-1.5 right-1.5 bg-slate-900/80 text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                      <Maximize2 className="w-3 h-3 text-amber-400" />
                      Full View
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium flex-wrap">
            <span>By {point.authorMoniker}</span>
            {onOpenDirectChat && (
              <button
                onClick={() => onOpenDirectChat(point.authorMoniker)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                title={`Start private chat with ${point.authorMoniker}`}
              >
                <MessageSquare className="w-3 h-3 text-amber-600" />
                <span>Private Chat</span>
              </button>
            )}
            <span>•</span>
            <span>{formatTime(point.createdAt)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {onOpenSponsor && (
              <button
                onClick={onOpenSponsor}
                className="flex items-center gap-1 text-[10px] bg-orange-50 hover:bg-orange-100 text-orange-700 px-2.5 py-1 rounded border border-orange-200 font-bold transition-all cursor-pointer shadow-sm"
                id="btn-fuel-point"
                title="Sponsor/Fuel this Point"
              >
                <Flame className="w-3 h-3 text-orange-600" />
                <span>Fuel Point (£{(point.sponsorshipsTotal || 0).toFixed(2)})</span>
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded border border-slate-200 font-bold transition-all cursor-pointer shadow-sm"
                id="btn-edit-from-thread"
                title="Point Made — Edit this Point"
              >
                <Edit3 className="w-3 h-3 text-slate-600" />
                <span>Point Made</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex items-center gap-1 text-[10px] bg-red-50 hover:bg-red-100 text-red-700 px-2.5 py-1 rounded border border-red-200 font-bold transition-all cursor-pointer shadow-sm"
                id="btn-delete-from-thread"
                title="Delete this Point"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Point to Point Linking Section */}
      <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Link2 className="w-3.5 h-3.5 text-brand-accent shrink-0 animate-pulse" />
            Point Connections ({allPoints.filter(p => p.linkedFromPointId === point.id).length})
          </span>
          
          <button
            onClick={() => onStartLinking(point)}
            className="flex items-center gap-1 text-[10px] bg-brand-accent hover:bg-orange-600 text-white px-2 py-1 rounded border border-transparent font-bold transition-all hover:scale-[1.02] cursor-pointer shadow-sm"
            id="btn-raise-connected-point"
          >
            <Plus className="w-3 h-3" />
            <span>Raise Connected Point</span>
          </button>
        </div>

        {allPoints.filter(p => p.linkedFromPointId === point.id).length === 0 ? (
          <p className="text-[10px] text-slate-400 italic mt-1 text-center">
            No connected points raised yet. Link your narrative to start a threaded conversation!
          </p>
        ) : (
          <div className="max-h-[105px] overflow-y-auto space-y-1.5 pr-0.5 mt-1.5">
            {allPoints
              .filter(p => p.linkedFromPointId === point.id)
              .map(linkedPt => (
                <button
                  key={linkedPt.id}
                  onClick={() => onSelectPoint(linkedPt)}
                  className="w-full text-left flex items-center gap-2 p-1.5 rounded bg-white border border-slate-200 hover:border-orange-300 text-[11px] text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-sm"
                >
                  <CornerDownRight className="w-3 h-3 text-brand-accent shrink-0" />
                  <span className="truncate flex-1 font-semibold text-slate-800">{linkedPt.title}</span>
                  <span className="text-[9px] font-mono bg-orange-50 px-1 py-0.5 text-orange-700 border border-orange-200 rounded truncate max-w-[80px]">
                    {linkedPt.authorMoniker}
                  </span>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* Tab Selector: Conversation vs Sponsorships */}
      {(() => {
        const uniqueVoices = new Set([point.authorMoniker, ...replies.map(r => r.authorMoniker)]).size;
        return (
          <div className="flex border-b border-slate-200 mb-3 shrink-0" id="thread-tab-bar">
            <button
              onClick={() => setActiveTab("conversation")}
              className={`flex-1 py-2 text-center text-xs font-mono font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "conversation"
                  ? "border-brand-accent text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-orange-600" />
              <span>Conversation ({replies.length})</span>
              <span className="text-[10px] bg-orange-100 text-orange-950 px-1.5 py-0.2 rounded font-mono font-extrabold border border-orange-300" title={`${uniqueVoices} unique participating voices in this conversation`}>
                👥 {uniqueVoices} voice{uniqueVoices === 1 ? "" : "s"}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("sponsorships")}
              className={`flex-1 py-2 text-center text-xs font-mono font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "sponsorships"
                  ? "border-brand-accent text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-orange-600" />
              <span>Fuel Ledger (£{(point.sponsorshipsTotal || 0).toFixed(0)})</span>
            </button>
          </div>
        );
      })()}

      {/* Comment / Sponsor Stream */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {activeTab === "conversation" ? (
          loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-sm text-slate-400 gap-2">
              <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
              <span>Gathering responses...</span>
            </div>
          ) : replies.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50">
              No opinions posted yet. Break the silence and start the conversation.
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {replies.map((reply, idx) => (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-900 flex items-center gap-1">
                        <User className="w-3 h-3 text-brand-accent" />
                        {reply.authorMoniker}
                      </span>
                      {onOpenDirectChat && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDirectChat(reply.authorMoniker);
                          }}
                          className="px-1.5 py-0.5 rounded bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-[9px] font-mono font-bold transition-colors cursor-pointer"
                          title={`Start private chat with ${reply.authorMoniker}`}
                        >
                          Chat
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {formatTime(reply.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-900 font-medium leading-relaxed whitespace-pre-line">
                    {reply.content}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          )
        ) : (
          /* Sponsorships Ledger Tab Content */
          sponsorships.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50 space-y-2">
              <Flame className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <p className="font-semibold text-slate-700">No sponsorships yet</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Support this author's point with a micro-donation.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sponsorships.map((spon, idx) => (
                <motion.div
                  key={spon.id || idx}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-orange-50 border border-orange-200 rounded-xl p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-orange-600" />
                      {spon.authorMoniker}
                    </span>
                    <span className="text-xs font-bold font-mono text-orange-700 bg-orange-100 px-2 py-0.5 rounded border border-orange-200">
                      +£{spon.amount.toFixed(2)}
                    </span>
                  </div>
                  {spon.message && (
                    <p className="text-xs text-slate-800 font-medium italic mt-1.5 pl-2 border-l border-orange-300">
                      "{spon.message}"
                    </p>
                  )}
                  <div className="text-[9px] text-slate-500 font-mono mt-1.5 text-right">
                    {formatTime(spon.createdAt)}
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Reply input form */}
      <form onSubmit={handlePostReply} className="mt-auto border-t border-slate-200 pt-3 space-y-2 shrink-0">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
          <div className="flex items-center gap-2">
            <span>Leave a Direct Response</span>
            <button
              type="button"
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 border transition-colors cursor-pointer ${
                showVoiceRecorder
                  ? "bg-amber-500 text-slate-950 border-amber-600"
                  : "bg-amber-500/10 text-amber-700 border-amber-500/30 hover:bg-amber-500/20"
              }`}
              title="Record Voice Reply"
            >
              <Mic className="w-3 h-3 text-amber-600" />
              <span>{showVoiceRecorder ? "Hide Voice Recorder" : "🎙️ Voice Reply"}</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => onStartLinking(point)}
            className="text-brand-accent hover:text-orange-700 flex items-center gap-1 font-mono hover:underline cursor-pointer"
            id="btn-switch-to-p2p-form"
          >
            <Link2 className="w-3 h-3" />
            <span>Raise Point-to-Point Post</span>
          </button>
        </div>

        {showVoiceRecorder && (
          <div className="my-2">
            <VoiceRecorder
              label="Record Voice Reply"
              onAudioRecorded={async (audioFile) => {
                try {
                  const reader = new FileReader();
                  reader.readAsDataURL(audioFile);
                  reader.onloadend = async () => {
                    const base64Data = reader.result as string;
                    const uploadRes = await fetch("/api/upload", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        filename: audioFile.name,
                        fileType: audioFile.type || "audio/webm",
                        base64Data
                      })
                    });
                    if (uploadRes.ok) {
                      const data = await uploadRes.json();
                      setNewComment(prev => prev ? `${prev} 🎙️ Voice Note: ${data.url}` : `🎙️ Voice Reply Note: ${data.url}`);
                      setShowVoiceRecorder(false);
                    }
                  };
                } catch (err) {
                  console.error("Error uploading voice reply:", err);
                }
              }}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Your moniker (Optional)"
            value={commenterMoniker}
            onChange={(e) => setCommenterMoniker(e.target.value)}
            className="w-1/3 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-950 font-medium focus:outline-none focus:border-orange-500 placeholder-slate-500 shadow-xs"
            maxLength={25}
            id="reply-commenter-moniker"
          />
          <div className="flex-1 relative">
            <input
              required
              type="text"
              placeholder="Contribute constructively..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-3 pr-10 py-1.5 text-xs text-slate-950 font-medium focus:outline-none focus:border-orange-500 placeholder-slate-500 shadow-xs"
              maxLength={250}
              id="reply-comment-input"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-orange-600 hover:text-orange-700 disabled:text-slate-300 transition-colors cursor-pointer"
              id="submit-reply-button"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {error && <span className="text-[10px] text-red-500 block">{error}</span>}
      </form>

      {/* Photo Lightbox Expansion Modal */}
      {expandedPhotoUrl && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          <motion.div
            key={`reply-photo-lightbox-${point.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => {
              e.stopPropagation();
              setExpandedPhotoUrl(null);
            }}
            className="fixed inset-0 z-[99999] bg-slate-950/95 flex items-center justify-center p-4 sm:p-8"
            id="reply-photo-lightbox-modal"
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
                      Attached Photo
                    </span>
                    <span className="text-xs font-bold text-slate-300 truncate">
                      {point.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={expandedPhotoUrl}
                      download={`photo-reply-${point.id || 'attachment'}.jpg`}
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

                {/* Photo Container */}
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

                {/* Footer */}
                <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 mt-3 pt-2 border-t border-slate-800">
                  <span>By {point.authorMoniker} • {point.category}</span>
                  <span className="text-amber-400/90 font-bold">Press ESC or click backdrop to exit</span>
                </div>
              </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
