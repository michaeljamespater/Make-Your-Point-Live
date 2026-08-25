import React, { useState, useEffect } from "react";
import { getAudienceVoices, Point, AudienceVoice } from "../types";
import {
  Sparkles,
  HelpCircle,
  PenSquare,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Calendar,
  History,
  Hourglass,
  Target,
  Trophy,
  Frown,
  AlertCircle,
  ThumbsDown,
  User,
  Users,
  Link2,
  X,
  MessageSquare,
  ArrowLeftRight,
  Lightbulb,
  Wrench,
  Hammer,
  Award,
  Eye,
  Image,
  Video,
  Music,
  Loader2,
  Mic,
  Layers,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { VoiceRecorder } from "./VoiceRecorder";

interface PointFormProps {
  onPointCreated: (newPoint: any) => void;
  onSelectCreatedPoint?: (newPoint: Point) => void;
  linkingFromPoint?: Point | null;
  onCancelLink?: () => void;
  onBrowseAllPoints?: () => void;
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

// Custom category icons and colors mapping for selector buttons
const CATEGORY_STYLES: { [key: string]: { label: string; desc: string; icon: any; color: string; activeClass: string; inactiveClass: string } } = {
  "Point": {
    label: "Point",
    desc: "General narrative & perspective",
    icon: MessageSquare,
    color: "text-sky-600",
    activeClass: "border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-500/30 font-extrabold",
    inactiveClass: "border-slate-200 bg-slate-50 hover:border-sky-400 text-slate-700 hover:text-sky-900"
  },
  "Point-to-Point": {
    label: "Point-to-Point",
    desc: "Direct link & cross-reference",
    icon: ArrowLeftRight,
    color: "text-indigo-600",
    activeClass: "border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/30 font-extrabold",
    inactiveClass: "border-slate-200 bg-slate-50 hover:border-indigo-400 text-slate-700 hover:text-indigo-900"
  },
  "Point of Conversation": {
    label: "Conversation",
    desc: "Open dialogue & discussion",
    icon: Users,
    color: "text-teal-600",
    activeClass: "border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-500/30 font-extrabold",
    inactiveClass: "border-slate-200 bg-slate-50 hover:border-teal-400 text-slate-700 hover:text-teal-900"
  },
  "Point of Argument": {
    label: "Argument",
    desc: "Evidence-backed critique",
    icon: Target,
    color: "text-orange-600",
    activeClass: "border-orange-500 bg-orange-50 text-orange-900 ring-2 ring-orange-500/30 font-extrabold",
    inactiveClass: "border-slate-200 bg-slate-50 hover:border-orange-400 text-slate-700 hover:text-orange-900"
  },
  "Point of Agreement": {
    label: "Agreement",
    desc: "Consensus & shared truth",
    icon: CheckCircle2,
    color: "text-emerald-600",
    activeClass: "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30 font-extrabold",
    inactiveClass: "border-slate-200 bg-slate-50 hover:border-emerald-400 text-slate-700 hover:text-emerald-900"
  },
  "Point of Innovation": {
    label: "Innovation",
    desc: "New idea or breakthrough",
    icon: Lightbulb,
    color: "text-fuchsia-600",
    activeClass: "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-900 ring-2 ring-fuchsia-500/30 font-extrabold",
    inactiveClass: "border-slate-200 bg-slate-50 hover:border-fuchsia-400 text-slate-700 hover:text-fuchsia-900"
  },
  "Point of Production": {
    label: "Production",
    desc: "Creation, build & execution",
    icon: Eye,
    color: "text-violet-600",
    activeClass: "border-violet-500 bg-violet-50 text-violet-900 ring-2 ring-violet-500/30 font-extrabold",
    inactiveClass: "border-slate-200 bg-slate-50 hover:border-violet-400 text-slate-700 hover:text-violet-900"
  },
  "Point of Delivery": {
    label: "Delivery",
    desc: "Outcomes, results & impact",
    icon: Award,
    color: "text-rose-600",
    activeClass: "border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/30 font-extrabold",
    inactiveClass: "border-slate-200 bg-slate-50 hover:border-rose-400 text-slate-700 hover:text-rose-900"
  }
};


function compressImage(file: File, maxWidth = 900, maxHeight = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export default function PointForm({ onPointCreated, onSelectCreatedPoint, linkingFromPoint, onCancelLink, onBrowseAllPoints }: PointFormProps) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [tags, setTags] = useState("");
  const [webAddress, setWebAddress] = useState("");
  const [authorMoniker, setAuthorMoniker] = useState(() => {
    try { return localStorage.getItem("myp_author_moniker") || ""; } catch { return ""; }
  });
  const [targetAudience, setTargetAudience] = useState("Makers");
  const [category, setCategory] = useState("Point of Innovation");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastCreatedPoint, setLastCreatedPoint] = useState<Point | null>(null);

  const [uploadedMedia, setUploadedMedia] = useState<{ url: string; type: "photo" | "video" | "audio"; name: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

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
    if (linkingFromPoint) {
      setCategory("Point-to-Point");
      if (linkingFromPoint.subcategory) {
        setSubcategory(linkingFromPoint.subcategory);
      }
    }
  }, [linkingFromPoint]);

  const handleFileUpload = async (files: FileList) => {
    setUploadError(null);
    setIsUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Accept image, video, and audio types
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/") && !file.type.startsWith("audio/")) {
          setUploadError("Only image, video, and audio files are supported.");
          continue;
        }

        // File size check: 150MB for video, 25MB for images & audio
        const isVideo = file.type.startsWith("video/");
        const maxSizeBytes = isVideo ? 150 * 1024 * 1024 : 25 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
          setUploadError(`File size exceeds ${isVideo ? "150MB" : "25MB"} limit.`);
          continue;
        }

        // Convert file to base64 with compression for images
        const base64Data = await compressImage(file);

        let finalUrl = base64Data;
        let finalType: "photo" | "video" | "audio" = file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "photo";

        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filename: file.name,
              fileType: file.type,
              base64Data,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            finalUrl = data.url;
            finalType = data.type;
          }
        } catch (fetchErr) {
          console.warn("Upload API endpoint fallback to inlined Data URL:", fetchErr);
        }

        setUploadedMedia(prev => [...prev, {
          url: finalUrl,
          type: finalType,
          name: file.name
        }]);
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "An error occurred during file upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setRejectionReason(null);
    setSuccess(false);

    try {
      const payload: any = {
        content: content.trim(),
        category,
        title: title.trim() || undefined,
        subcategory: subcategory.trim() || undefined,
        tags: tags.trim() ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
        webAddress: webAddress.trim() || undefined,
        authorMoniker: authorMoniker.trim() || undefined,
        targetAudience,
        media: uploadedMedia.length > 0 ? uploadedMedia : undefined
      };

      if (authorMoniker.trim()) {
        try { localStorage.setItem("myp_author_moniker", authorMoniker.trim()); } catch {}
      }

      if (linkingFromPoint) {
        payload.linkedFromPointId = linkingFromPoint.id;
        payload.linkedFromPointTitle = linkingFromPoint.title;
      }

      const response = await fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.rejectionReason) {
          setRejectionReason(data.rejectionReason);
        } else {
          setError(data.error || "An error occurred while posting your point.");
        }
      } else {
        setSuccess(true);
        setLastCreatedPoint(data);
        onPointCreated(data);
        // Reset form content
        setContent("");
        setTitle("");
        setSubcategory("");
        setTags("");
        setWebAddress("");
        setUploadedMedia([]);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* PANEL 3: Make Your Point Main Form Card (ON TOP) */}
      <div
        className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-card-highlight"
        id="point-submission-form-card"
      >
        {/* Page Top Signature Header Panel: MAKE YOUR POINT (Orange & Amber Theme) */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 border-2 border-orange-400/40 text-white rounded-2xl p-4 sm:p-5 shadow-2xl flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0">
              <PenSquare className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                MAKE YOUR POINT
              </h1>
              <p className="text-xs text-orange-100/90 font-medium">
                This is your space. Write from the heart — honesty matters more than perfect spelling.
              </p>
            </div>
          </div>
        </div>

          {linkingFromPoint && onCancelLink && (
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={onCancelLink}
                className="p-2 rounded-xl bg-slate-100 border border-slate-200 hover:text-slate-900 text-slate-600 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                title="Cancel link and write independent point"
              >
                <X className="w-3.5 h-3.5 text-red-500" />
                <span>Cancel Link</span>
              </button>
            </div>
          )}

        {linkingFromPoint && (
          <div className="mb-4 p-3 rounded-xl bg-orange-50 border border-orange-200 flex items-center gap-2.5 text-xs text-slate-800">
            <Link2 className="w-4 h-4 text-brand-accent shrink-0 animate-pulse" />
            <div className="truncate flex-1">
              <span className="text-slate-500 block uppercase tracking-wider font-mono text-[9px] font-bold">In response to:</span>
              <span className="text-slate-900 font-semibold truncate">{linkingFromPoint.title}</span>
            </div>
          </div>
        )}

        {/* Direct Success Notification Banner when published */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
            id="top-point-success-banner"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-extrabold text-xs text-emerald-950">
                  🎉 POINT PUBLISHED DIRECTLY & INDEXED!
                </h4>
                <p className="text-[11px] text-emerald-800 font-medium">
                  Your point is now live at the top of the feed. Enter your next point directly below!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {lastCreatedPoint && onSelectCreatedPoint && (
                <button
                  type="button"
                  onClick={() => onSelectCreatedPoint(lastCreatedPoint)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer active:scale-95"
                  id="btn-view-published-thread"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Thread</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="p-1.5 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-200/60 rounded-lg transition-colors cursor-pointer"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Main Text Entry Area - FIRST AND PROMINENT */}
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm space-y-3.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
                <PenSquare className="w-4 h-4 text-orange-600" /> Enter Your Point / Narrative Here *
              </span>
              <span className="text-[10px] text-orange-600 font-mono font-bold">REQUIRED</span>
            </label>
            <textarea
              required
              rows={5}
              placeholder="What do you need to say? Your experience, your frustration, your hope — it all belongs here. Take your time."
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (success) setSuccess(false);
                if (error) setError(null);
                if (rejectionReason) setRejectionReason(null);
              }}
              className="w-full bg-white border-2 border-slate-200 focus:border-orange-500 rounded-xl p-3.5 text-base text-slate-900 font-medium placeholder-slate-400 focus:outline-none transition-colors resize-y leading-relaxed shadow-2xs"
              id="point-content-textarea"
              autoFocus
            ></textarea>

            {/* Attach Media & Live Voice Note Area - Directly part of/under main text entry */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-900">
                  Attach Photo, Video, or Voice Note
                </label>
              </div>

              {/* Voice Recorder Integration */}
              <VoiceRecorder
                label="Record Live Voice Note Point"
                onAudioRecorded={(audioFile) => {
                  const fileList = [audioFile] as unknown as FileList;
                  handleFileUpload(fileList);
                  if (!content.trim()) {
                    setContent("🎙️ [Voice Chat Point Attached]");
                  }
                }}
              />

              {/* Drag & Drop File Upload Dropzone */}
              <div
                className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-all ${
                  dragOver
                    ? "border-orange-500 bg-orange-100/50"
                    : "border-slate-300 bg-white hover:border-orange-400"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    handleFileUpload(e.dataTransfer.files);
                  }
                }}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files);
                    }
                  }}
                  className="hidden"
                  id="file-upload-input"
                />
                <label
                  htmlFor="file-upload-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5 text-slate-800 hover:text-slate-950"
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                  ) : (
                    <div className="flex gap-2">
                      <Image className="w-5 h-5 text-orange-600" />
                      <Video className="w-5 h-5 text-orange-600" />
                      <Music className="w-5 h-5 text-orange-600" />
                    </div>
                  )}
                  <div className="text-xs text-slate-900 font-medium">
                    <span className="font-bold text-orange-700 underline">Upload media files</span> or drag & drop
                  </div>
                  <p className="text-[10px] text-slate-600 font-mono font-medium uppercase">
                    Photos & Audio (Max 25MB), Videos (Max 150MB)
                  </p>
                </label>
              </div>

              {uploadError && (
                <p className="text-xs text-red-500 font-medium mt-1">{uploadError}</p>
              )}

              {/* Uploaded items preview */}
              {uploadedMedia.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {uploadedMedia.map((media, idx) => (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-300 aspect-video bg-slate-900 flex items-center justify-center p-2">
                      {media.type === "video" ? (
                        <video src={media.url} className="w-full h-full object-cover rounded" muted />
                      ) : media.type === "audio" ? (
                        <div className="w-full text-center px-2">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 mx-auto mb-1 flex items-center justify-center border border-amber-500/30">
                            <Mic className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-amber-300 block truncate">
                            {media.name || "Voice Note"}
                          </span>
                        </div>
                      ) : (
                        <img src={media.url} alt={media.name} className="w-full h-full object-cover rounded" referrerPolicy="no-referrer" />
                      )}
                      
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedMedia(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-950/80 hover:bg-red-600 text-white transition-all shadow-md cursor-pointer z-10"
                        title="Remove attachment"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Indicator overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-slate-950/80 px-2 py-0.5 text-[9px] text-slate-300 truncate font-mono">
                        {media.type === "video" ? "🎥 Video" : media.type === "audio" ? "🎙️ Voice Note" : "🖼️ Photo"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Publish Button right under text box */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || (!content.trim() && uploadedMedia.length === 0)}
                className="bg-orange-600 hover:bg-orange-500 disabled:bg-slate-300 text-white font-black text-sm px-6 py-2.5 rounded-xl shadow-md shadow-orange-600/30 flex items-center gap-2 cursor-pointer transition-all disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
                id="quick-publish-point-btn"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-white" />
                    <span>Sharing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-orange-200 fill-orange-200" />
                    <span>POINT MADE</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Title / Headline (Optional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 mb-1.5">
              Title / Headline (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Why Local Repair Matters (AI generates if left blank)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-950 font-medium placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors shadow-xs"
              maxLength={100}
              id="point-title-input"
            />
          </div>

          {/* Moniker & Subcategory / Tags / Web Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-orange-600" /> What should we call you? (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. SilentPerson, Maker101"
                value={authorMoniker}
                onChange={(e) => setAuthorMoniker(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-950 font-medium placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors shadow-xs"
                maxLength={30}
                id="author-moniker-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                Subcategory (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Free Speech, DIY"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-950 font-medium placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors shadow-xs"
                maxLength={30}
                id="point-subcategory-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                Tags (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. tech, repair, offline"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-950 font-medium placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors shadow-xs"
                id="point-tags-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-900 mb-1">
                Web Link (Optional)
              </label>
              <input
                type="url"
                placeholder="e.g. https://my-garage.com"
                value={webAddress}
                onChange={(e) => setWebAddress(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-950 font-medium placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors shadow-xs"
                id="point-web-address-input"
              />
            </div>
          </div>

          {/* AI Content Moderation / Rejection Notice */}
          <AnimatePresence>
            {rejectionReason && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3 text-red-200 text-sm"
                id="point-rejection-feedback"
              >
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
                <div>
                  <span className="font-bold">Point Quality Guideline:</span>
                  <p className="mt-0.5 text-red-300">{rejectionReason}</p>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex gap-3 text-amber-200 text-sm"
                id="point-error-feedback"
              >
                <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
                <div>
                  <span className="font-bold">Operational Issue:</span>
                  <p className="mt-0.5 text-amber-300">{error}</p>
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex gap-3 text-green-200 text-sm"
                id="point-success-feedback"
              >
                <CheckCircle2 className="w-5 h-5 shrink-0 text-green-400" />
                <div>
                  <span className="font-bold">Your voice is out there. Thank you for speaking.</span>
                  <p className="mt-0.5 text-green-300">
                    AI successfully validated, categorised, and indexed your point. It is now live in the directory index.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Submit / Reset Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                setTitle("");
                setContent("");
                setAuthorMoniker("");
                setSubcategory("");
                setTags("");
                setWebAddress("");
                setUploadedMedia([]);
                setError(null);
                setRejectionReason(null);
                setSuccess(false);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              id="reset-form-btn"
            >
              Clear Form
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="bg-orange-600 hover:bg-orange-500 disabled:bg-slate-300 text-white font-black text-sm px-7 py-3 rounded-xl shadow-lg shadow-orange-600/30 flex items-center gap-2 cursor-pointer transition-all disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
              id="submit-point-btn"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-white" />
                  <span>Sharing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-orange-200 fill-orange-200" />
                  <span>POINT MADE</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Side-by-side Panels BELOW: Point Category & Your Voice Forums */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* PANEL 1: Point Category Panel */}
        <div
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card-highlight flex flex-col justify-between"
          id="point-category-panel"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3.5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-display font-black text-slate-900 uppercase tracking-tight">
                    Point Category
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Select the structural classification
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-900 text-[10px] font-extrabold font-mono uppercase tracking-wider border border-orange-200 shrink-0">
                {category}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin" id="category-selector-grid">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                const style = CATEGORY_STYLES[cat] || CATEGORY_STYLES["Point"];
                const IconComponent = style.icon;

                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden ${
                      isSelected ? style.activeClass : style.inactiveClass
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <IconComponent className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-bold block truncate">{cat}</span>
                    </div>
                    <span className="text-[10px] opacity-80 font-normal block leading-tight truncate">{style.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* PANEL 2: Your Voice Forums Panel */}
        <div
          className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card-highlight flex flex-col justify-between"
          id="your-voice-forums-panel"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3.5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-display font-black text-slate-900 uppercase tracking-tight">
                    Your Voice Forums
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Select target forum channel
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold font-mono uppercase tracking-wider border border-amber-200 shrink-0 max-w-[130px] truncate">
                {voices.find(v => v.id === targetAudience)?.label || targetAudience}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin" id="voice-selector-grid">
              {voices.filter(v => v.id !== "all").map((voice) => {
                const isSelected = targetAudience === voice.id;
                const colors: { [key: string]: string } = {
                  "SilentMajority": isSelected
                    ? "border-sky-500 bg-sky-50 text-sky-900 ring-2 ring-sky-500/30 font-extrabold"
                    : "border-slate-200 bg-slate-50 hover:border-sky-400 text-slate-700 hover:text-sky-900",
                  "Makers": isSelected 
                    ? "border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/30 font-extrabold" 
                    : "border-slate-200 bg-slate-50 hover:border-amber-400 text-slate-700 hover:text-amber-900",
                  "Creators": isSelected 
                    ? "border-violet-500 bg-violet-50 text-violet-900 ring-2 ring-violet-500/30 font-extrabold" 
                    : "border-slate-200 bg-slate-50 hover:border-violet-400 text-slate-700 hover:text-violet-900",
                  "Innovators": isSelected 
                    ? "border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/30 font-extrabold" 
                    : "border-slate-200 bg-slate-50 hover:border-blue-400 text-slate-700 hover:text-blue-900",
                  "Traders": isSelected 
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30 font-extrabold" 
                    : "border-slate-200 bg-slate-50 hover:border-emerald-400 text-slate-700 hover:text-emerald-900",
                  "Preservers": isSelected 
                    ? "border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-500/30 font-extrabold" 
                    : "border-slate-200 bg-slate-50 hover:border-teal-400 text-slate-700 hover:text-teal-900",
                  "ForgottenMinority": isSelected 
                    ? "border-orange-500 bg-orange-50 text-orange-900 ring-2 ring-orange-500/30 font-extrabold" 
                    : "border-slate-200 bg-slate-50 hover:border-orange-400 text-slate-700 hover:text-orange-900",
                  "AbandonedAlone": isSelected 
                    ? "border-slate-500 bg-slate-100 text-slate-900 ring-2 ring-slate-500/30 font-extrabold" 
                    : "border-slate-200 bg-slate-50 hover:border-slate-400 text-slate-700 hover:text-slate-900",
                  "CancelledNoHope": isSelected 
                    ? "border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/30 font-extrabold" 
                    : "border-slate-200 bg-slate-50 hover:border-rose-400 text-slate-700 hover:text-rose-900",
                  "UnheardAngry": isSelected 
                    ? "border-red-500 bg-red-50 text-red-900 ring-2 ring-red-500/30 font-extrabold" 
                    : "border-slate-200 bg-slate-50 hover:border-red-400 text-slate-700 hover:text-red-900",
                  "DestituteDeserted": isSelected 
                    ? "border-pink-500 bg-pink-50 text-pink-900 ring-2 ring-pink-500/30 font-extrabold" 
                    : "border-slate-200 bg-slate-50 hover:border-pink-400 text-slate-700 hover:text-pink-900",
                  "Controversial": isSelected 
                    ? "border-red-600 bg-red-50 text-red-900 ring-2 ring-red-600/30 font-extrabold" 
                    : "border-slate-200 bg-slate-50 hover:border-red-500 text-slate-700 hover:text-red-900",
                  "Anti-Establishment": isSelected 
                    ? "border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-500/30 font-extrabold" 
                    : "border-slate-200 bg-slate-50 hover:border-teal-400 text-slate-700 hover:text-teal-900",
                  "PeopleOfTomorrow": isSelected 
                    ? "border-cyan-500 bg-cyan-50 text-cyan-900 ring-2 ring-cyan-500/30 font-extrabold" 
                    : "border-slate-200 bg-slate-50 hover:border-cyan-400 text-slate-700 hover:text-cyan-900",
                };

                const fallbackClass = isSelected 
                  ? "border-orange-500 bg-orange-50 text-slate-900 ring-2 ring-orange-500/30 font-extrabold" 
                  : "border-slate-200 bg-slate-50 hover:border-orange-300 text-slate-700 hover:text-slate-900";

                return (
                  <button
                    type="button"
                    key={voice.id}
                    onClick={() => setTargetAudience(voice.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden ${
                      colors[voice.id] || fallbackClass
                    }`}
                  >
                    <span className="font-bold block mb-0.5">{voice.label}</span>
                    <span className="text-[10px] opacity-80 font-normal block leading-tight truncate">{voice.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

