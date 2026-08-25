import React, { useState, useEffect, useRef } from "react";
import { Chat, ChatMessage } from "../types";
import {
  MessageSquare,
  Users,
  User,
  Plus,
  Search,
  Send,
  Paperclip,
  X,
  Lock,
  Globe,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Image as ImageIcon,
  Film,
  Mic,
  Volume2,
  Trash2,
  Download,
  Info,
  CheckCheck,
  Flame,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../server/firebase";

interface ChatSectionProps {
  initialChatMoniker?: string | null;
  initialFilter?: "all" | "private" | "group";
  onClose?: () => void;
}

const DEFAULT_SEED_CHATS: Chat[] = [
  {
    id: "seed-group-1",
    name: "The Open Assembly",
    type: "group",
    participants: ["CivicObserver", "QuietTaxpayer", "OfflineAdvocate", "SkepticGeologist"],
    topic: "Open community square for cross-ideological dialogue and town hall discussions.",
    lastMessage: "Welcome everyone! Keep discussions polite, constructive, and respectful.",
    lastMessageTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    createdBy: "CivicObserver"
  },
  {
    id: "seed-group-2",
    name: "Makers & Crafters Guild",
    type: "group",
    participants: ["HorologyNut", "FrustratedFarmer", "DIYCraftsman"],
    topic: "Hands-on engineering, clock restoration, farming, and physical building.",
    lastMessage: "Just finished testing the mechanical balance wheel on the grandfather clock!",
    lastMessageTime: new Date(Date.now() - 3600000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    createdBy: "HorologyNut"
  },
  {
    id: "seed-group-3",
    name: "Independent Research & Free Speech",
    type: "group",
    participants: ["SkepticGeologist", "QuietTaxpayer", "TruthSeeker"],
    topic: "De-platformed scholars, independent data publishing, and academic freedom.",
    lastMessage: "We've compiled our second independent soil analysis report. Link available soon.",
    lastMessageTime: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    createdBy: "SkepticGeologist"
  }
];

const DEFAULT_SEED_MESSAGES: { [chatId: string]: ChatMessage[] } = {
  "seed-group-1": [
    {
      id: "msg-101",
      chatId: "seed-group-1",
      senderMoniker: "CivicObserver",
      content: "Welcome to the Open Assembly! This group room is dedicated to open town hall discussions across the entire political and social spectrum.",
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: "msg-102",
      chatId: "seed-group-1",
      senderMoniker: "QuietTaxpayer",
      content: "Great to have a private, noise-free space for deeper conversations outside main point comments.",
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
    },
    {
      id: "msg-103",
      chatId: "seed-group-1",
      senderMoniker: "OfflineAdvocate",
      content: "Welcome everyone! Keep discussions polite, constructive, and respectful.",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ]
};

export default function ChatSection({ initialChatMoniker, initialFilter, onClose }: ChatSectionProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatFilter, setChatFilter] = useState<"all" | "private" | "group">(initialFilter || "all");

  useEffect(() => {
    if (initialFilter) {
      setChatFilter(initialFilter);
    }
  }, [initialFilter]);
  const [searchQuery, setSearchQuery] = useState("");

  // Current user moniker stored in localStorage or default
  const [userMoniker, setUserMoniker] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("make_your_point_user_moniker") || "Participant";
      } catch (e) {
        return "Participant";
      }
    }
    return "Participant";
  });

  const [messageText, setMessageText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<{ url: string; type: "photo" | "video" | "audio"; name?: string }[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const handleCopyText = (id: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Modal states
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [isNewDMModalOpen, setIsNewDMModalOpen] = useState(false);
  
  // New Group Form
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupTopic, setNewGroupTopic] = useState("");
  const [newGroupParticipants, setNewGroupParticipants] = useState("");

  // New DM Form
  const [newDMMoniker, setNewDMMoniker] = useState(initialChatMoniker || "");

  // Expanded Photo Modal
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatFeedRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save current moniker to localStorage
  const handleMonikerChange = (val: string) => {
    setUserMoniker(val);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("make_your_point_user_moniker", val);
      } catch (e) {
        console.warn("Storage restricted:", e);
      }
    }
  };

  // 1. Fetch / Sync Chats from Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const chatsRef = collection(db, "chats");
      unsubscribe = onSnapshot(
        chatsRef,
        (snapshot) => {
          const loadedChats: Chat[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Chat, "id">)
          }));

          // Sort by lastMessageTime descending
          loadedChats.sort((a, b) => {
            const tA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : new Date(a.createdAt).getTime();
            const tB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : new Date(a.createdAt).getTime();
            return tB - tA;
          });

          if (loadedChats.length === 0) {
            setChats(DEFAULT_SEED_CHATS);
          } else {
            setChats(loadedChats);
          }
        },
        (err) => {
          console.warn("Firestore chats listener error, falling back to local seed chats:", err);
          setChats(DEFAULT_SEED_CHATS);
        }
      );
    } catch (e) {
      console.warn("Error setting up chats listener:", e);
      setChats(DEFAULT_SEED_CHATS);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Set default active chat if none selected
  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId]);

  // If initialChatMoniker is provided, create/open 1-on-1 DM or launch setup
  useEffect(() => {
    if (initialChatMoniker !== undefined && initialChatMoniker !== null) {
      if (initialChatMoniker.trim()) {
        startOrOpenDM(initialChatMoniker.trim());
      } else {
        setIsNewDMModalOpen(true);
      }
    }
  }, [initialChatMoniker]);

  // 2. Fetch / Sync Messages for Active Chat
  useEffect(() => {
    if (!activeChatId) return;

    let unsubscribe: (() => void) | undefined;
    try {
      const messagesRef = collection(db, "chats", activeChatId, "messages");
      const q = query(messagesRef, orderBy("createdAt", "asc"));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const loadedMsgs: ChatMessage[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ChatMessage, "id">)
          }));

          if (loadedMsgs.length === 0 && DEFAULT_SEED_MESSAGES[activeChatId]) {
            setMessages(DEFAULT_SEED_MESSAGES[activeChatId]);
          } else {
            setMessages(loadedMsgs);
          }
        },
        (err) => {
          console.warn("Firestore messages listener warning:", err);
          if (DEFAULT_SEED_MESSAGES[activeChatId]) {
            setMessages(DEFAULT_SEED_MESSAGES[activeChatId]);
          } else {
            setMessages([]);
          }
        }
      );
    } catch (e) {
      console.warn("Messages subscription fallback:", e);
      if (DEFAULT_SEED_MESSAGES[activeChatId]) {
        setMessages(DEFAULT_SEED_MESSAGES[activeChatId]);
      } else {
        setMessages([]);
      }
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeChatId]);

  // Scroll to bottom on new message within container only
  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [messages]);

  // Delete specific media attachment (.jpg / image / video / audio) from a message
  const handleDeleteAttachment = async (messageId: string, mediaIndex: number) => {
    const targetMsg = messages.find((m) => m.id === messageId);
    if (!targetMsg || !targetMsg.media) return;

    const updatedMedia = targetMsg.media.filter((_, idx) => idx !== mediaIndex);

    // Update local state immediately
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, media: updatedMedia.length > 0 ? updatedMedia : undefined } : m
      )
    );

    // Update in Firestore
    if (activeChatId) {
      try {
        const msgDocRef = doc(db, "chats", activeChatId, "messages", messageId);
        await updateDoc(msgDocRef, {
          media: updatedMedia.length > 0 ? updatedMedia : []
        });
      } catch (err) {
        console.warn("Firestore error deleting attachment:", err);
      }
    }
  };

  // Direct Message Helper
  const startOrOpenDM = async (targetMoniker: string) => {
    // Check if DM chat with this moniker already exists
    const existing = chats.find(
      (c) =>
        c.type === "private" &&
        c.participants.includes(targetMoniker) &&
        c.participants.includes(userMoniker)
    );

    if (existing) {
      setActiveChatId(existing.id);
      return;
    }

    // Create new 1-on-1 private chat
    const newChat: Omit<Chat, "id"> = {
      name: `Private: ${targetMoniker}`,
      type: "private",
      participants: Array.from(new Set([userMoniker, targetMoniker])),
      topic: `Direct 1-on-1 private message channel between ${userMoniker} and ${targetMoniker}`,
      lastMessage: "Conversation started.",
      lastMessageTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: userMoniker
    };

    try {
      const docRef = await addDoc(collection(db, "chats"), newChat);
      setActiveChatId(docRef.id);
    } catch (err) {
      console.warn("Failed to save private chat to Firestore, using local fallback:", err);
      const localId = `local-dm-${Date.now()}`;
      const fullChat = { id: localId, ...newChat };
      setChats((prev) => [fullChat, ...prev]);
      setActiveChatId(localId);
    }
  };

  // Create Group Chat Helper
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const extraParts = newGroupParticipants
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const allParts = Array.from(new Set([userMoniker, ...extraParts]));

    const newGroup: Omit<Chat, "id"> = {
      name: newGroupName.trim(),
      type: "group",
      participants: allParts,
      topic: newGroupTopic.trim() || "Community group chat room",
      lastMessage: "Group chat created.",
      lastMessageTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: userMoniker
    };

    try {
      const docRef = await addDoc(collection(db, "chats"), newGroup);
      setActiveChatId(docRef.id);
    } catch (err) {
      console.warn("Group creation fallback:", err);
      const localId = `local-group-${Date.now()}`;
      const fullGroup = { id: localId, ...newGroup };
      setChats((prev) => [fullGroup, ...prev]);
      setActiveChatId(localId);
    }

    // Reset & Close
    setNewGroupName("");
    setNewGroupTopic("");
    setNewGroupParticipants("");
    setIsNewGroupModalOpen(false);
  };

  // Media File Attachment Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isVideo = file.type.startsWith("video/");
      const maxSizeBytes = isVideo ? 150 * 1024 * 1024 : 25 * 1024 * 1024;

      if (file.size > maxSizeBytes) {
        setUploadError(`File ${file.name} exceeds ${isVideo ? "150MB" : "25MB"} limit.`);
        continue;
      }

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        let finalUrl = base64;
        let finalType: "photo" | "video" | "audio" = file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "photo";

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              fileType: file.type,
              base64Data: base64
            })
          });

          if (res.ok) {
            const data = await res.json();
            finalUrl = data.url;
            finalType = data.type;
          }
        } catch (fetchErr) {
          console.warn("Upload endpoint fallback to base64 Data URL:", fetchErr);
        }

        setAttachedMedia((prev) => [
          ...prev,
          { url: finalUrl, type: finalType, name: file.name }
        ]);
      } catch (err: any) {
        console.error("Chat upload error:", err);
        setUploadError(err.message || "Failed to upload media file.");
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Send Message Handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && attachedMedia.length === 0) || !activeChatId) return;

    const newMsg: Omit<ChatMessage, "id"> = {
      chatId: activeChatId,
      senderMoniker: userMoniker.trim() || "Anonymous",
      content: messageText.trim(),
      media: attachedMedia.length > 0 ? attachedMedia : undefined,
      createdAt: new Date().toISOString()
    };

    const previewText = messageText.trim() || (attachedMedia.length > 0 ? `[Attached ${attachedMedia[0].type}]` : "Sent a message.");

    // Clear input immediately for smooth UX
    setMessageText("");
    setAttachedMedia([]);

    try {
      // 1. Add to subcollection
      await addDoc(collection(db, "chats", activeChatId, "messages"), newMsg);

      // 2. Update parent chat lastMessage & lastMessageTime
      try {
        await updateDoc(doc(db, "chats", activeChatId), {
          lastMessage: `${userMoniker}: ${previewText}`,
          lastMessageTime: new Date().toISOString()
        });
      } catch (updErr) {
        // Ignore if doc update soft fails
      }
    } catch (err) {
      console.warn("Sending message local fallback:", err);
      const localMsg: ChatMessage = { id: `msg-${Date.now()}`, ...newMsg };
      setMessages((prev) => [...prev, localMsg]);

      // Update local chat last message
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId
            ? { ...c, lastMessage: `${userMoniker}: ${previewText}`, lastMessageTime: new Date().toISOString() }
            : c
        )
      );
    }
  };

  // Filter chats for group dialogues strictly
  const filteredChats = chats.filter((chat) => {
    if (chat.type !== "group") return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = chat.name.toLowerCase().includes(q);
      const matchTopic = chat.topic?.toLowerCase().includes(q);
      const matchParticipant = chat.participants.some((p) => p.toLowerCase().includes(q));
      return matchName || matchTopic || matchParticipant;
    }
    return true;
  });

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 h-full flex flex-col flex-1" id="chat-section-wrapper">

      {/* Page Top Signature Header Panel: POINT TO POINT (Dark Slate & Gold Amber Theme) */}
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <MessageSquare className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-amber-400 flex items-center gap-2">
              POINT TO POINT
            </h1>
            <p className="text-xs text-slate-300 font-medium">
              Engage in group dialogues, town halls & active debate rooms.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Point To Point"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="w-full bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[640px] max-h-[85vh]">
      {/* SIDEBAR: Conversation List & Switcher */}
      <div className="w-full md:w-80 lg:w-96 bg-slate-950 border-r border-slate-800/80 flex flex-col shrink-0">
        {/* Header & User Moniker Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h2 className="font-black text-slate-100 text-sm tracking-wide uppercase">POINT TO POINT</h2>
                <p className="text-[11px] text-amber-400/90 font-mono">Group Dialogues & Town Halls</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Active User Moniker Setting */}
          <div className="flex items-center gap-2 p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
            <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400 shrink-0">Moniker:</span>
            <input
              type="text"
              value={userMoniker}
              onChange={(e) => handleMonikerChange(e.target.value)}
              placeholder="Your Moniker..."
              className="bg-transparent border-b border-slate-700 focus:border-amber-400 focus:outline-none text-amber-300 font-semibold text-xs w-full px-1"
            />
          </div>
        </div>

        {/* Action Buttons & Search Input */}
        <div className="p-3 border-b border-slate-800/60 flex flex-col gap-2">
          <button
            onClick={() => setIsNewGroupModalOpen(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Group Dialogue</span>
          </button>

          {/* Search Input */}
          <div className="relative mt-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations or monikers..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredChats.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-500 font-mono text-xs">
              <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              No conversations found.
              <p className="mt-1 text-[11px] text-slate-600">Start a new group or direct message above!</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isActive = chat.id === activeChatId;
              const isGroup = chat.type === "group";

              return (
                <button
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 border ${
                    isActive
                      ? "bg-slate-800/90 border-amber-500/40 shadow-md"
                      : "bg-slate-900/40 hover:bg-slate-900 border-slate-800/50 hover:border-slate-700"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      isGroup
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    }`}
                  >
                    {isGroup ? <Users className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h3 className="font-semibold text-slate-200 text-xs truncate">
                        {chat.name}
                      </h3>
                      {chat.lastMessageTime && (
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 truncate font-mono">
                      {chat.lastMessage || "No messages yet."}
                    </p>

                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                          isGroup
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/50"
                            : "bg-amber-950/60 text-amber-400 border-amber-800/50"
                        }`}
                      >
                        {chat.type}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono truncate">
                        {chat.participants.length} member{chat.participants.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* MAIN CHAT WINDOW */}
      <div className="flex-1 flex flex-col bg-slate-900 min-w-0">
        {activeChat ? (
          <>
            {/* Active Chat Header */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    activeChat.type === "group"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  }`}
                >
                  {activeChat.type === "group" ? <Users className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-100 text-sm md:text-base truncate">
                      {activeChat.name}
                    </h2>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wide shrink-0 ${
                        activeChat.type === "group"
                          ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                          : "bg-amber-950 text-amber-300 border-amber-800"
                      }`}
                    >
                      {activeChat.type === "group" ? "Group Room" : "Private 1-on-1"}
                    </span>
                  </div>

                  {activeChat.topic && (
                    <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                      {activeChat.topic}
                    </p>
                  )}
                </div>
              </div>

              {/* Members Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono shrink-0">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeChat.participants.join(", ")}</span>
              </div>
            </div>

            {/* Messages Feed */}
            <div ref={chatFeedRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/60">
              {messages.length === 0 ? (
                <div className="text-center py-16 px-4 text-slate-500 font-mono text-xs">
                  <MessageSquare className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  No messages in this chat yet.
                  <p className="mt-1 text-slate-400">Be the first to raise a point or send a note below!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderMoniker === userMoniker;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="font-mono font-bold text-[11px] text-amber-400">
                          {msg.senderMoniker} {isMe && "(You)"}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-3.5 shadow-md border relative group ${
                          isMe
                            ? "bg-amber-500/10 border-amber-500/30 text-slate-100 rounded-tr-none"
                            : "bg-slate-800 border-slate-700 text-slate-200 rounded-tl-none"
                        }`}
                      >
                        {msg.content && (
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed font-sans flex-1">
                              {msg.content}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleCopyText(msg.id, msg.content)}
                              className="p-1 rounded-md bg-slate-900/60 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 transition-all border border-slate-700/50 shrink-0 cursor-pointer"
                              title="Copy message text"
                            >
                              {copiedMsgId === msg.id ? (
                                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold px-1">
                                  <Check className="w-3 h-3" />
                                  <span>Copied!</span>
                                </span>
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}

                        {/* Media Attachments */}
                        {msg.media && msg.media.length > 0 && (
                          <div className="mt-2.5 space-y-2">
                            {msg.media.map((med, idx) => (
                              <div key={idx} className="rounded-xl overflow-hidden bg-slate-950/60 border border-slate-700/60 p-1 relative group">
                                {med.type === "photo" && (
                                  <div className="relative cursor-pointer" onClick={() => setExpandedPhotoUrl(med.url)}>
                                    <img
                                      src={med.url}
                                      alt={med.name || "Photo attachment"}
                                      className="max-h-60 w-auto rounded-lg object-contain mx-auto"
                                    />
                                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-mono font-bold">
                                      Click to Expand
                                    </div>
                                  </div>
                                )}

                                {med.type === "video" && (
                                  <video
                                    src={med.url}
                                    controls
                                    className="max-h-64 w-full rounded-lg bg-black"
                                  />
                                )}

                                {med.type === "audio" && (
                                  <div className="p-2 flex items-center gap-2">
                                    <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
                                    <audio src={med.url} controls className="w-full h-8" />
                                  </div>
                                )}

                                {/* Delete Attachment Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAttachment(msg.id, idx);
                                  }}
                                  className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity shadow-md flex items-center gap-1 text-[10px] font-bold cursor-pointer z-10"
                                  title="Delete .jpg / media attachment"
                                  id={`btn-delete-attachment-chat-${msg.id}-${idx}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col gap-2 shrink-0">
              {/* Attached Media Previews */}
              {attachedMedia.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {attachedMedia.map((med, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-amber-300 shrink-0"
                    >
                      {med.type === "photo" && <ImageIcon className="w-3.5 h-3.5 text-amber-400" />}
                      {med.type === "video" && <Film className="w-3.5 h-3.5 text-amber-400" />}
                      {med.type === "audio" && <Mic className="w-3.5 h-3.5 text-amber-400" />}
                      <span className="truncate max-w-[120px]">{med.name || med.type}</span>
                      <button
                        type="button"
                        onClick={() => setAttachedMedia((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-400 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {uploadError && (
                <p className="text-[11px] font-mono text-red-400 px-1">{uploadError}</p>
              )}

              <div className="flex items-center gap-2">
                {/* File Upload Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,video/*,audio/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 shrink-0"
                  title="Attach Photo, Video (up to 150MB), or Audio"
                >
                  <Paperclip className="w-4 h-4 text-amber-400" />
                </button>

                {/* Text Field */}
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Message ${activeChat.name} as ${userMoniker}...`}
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-500/50 focus:outline-none rounded-xl px-3.5 py-2 text-xs md:text-sm text-slate-100 placeholder-slate-500 font-sans"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={(!messageText.trim() && attachedMedia.length === 0) || isUploading}
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-amber-500/10"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center font-mono text-slate-500 text-xs">
            <MessageSquare className="w-12 h-12 text-slate-700 mb-3" />
            Select a conversation on the left to start chatting.
          </div>
        )}
      </div>

      {/* MODAL 1: Create Group Chat */}
      <AnimatePresence>
        {isNewGroupModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl font-sans"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-slate-100 text-base">Create Community Group Chat</h3>
                </div>
                <button
                  onClick={() => setIsNewGroupModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                    Group Room Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="e.g., Local Freedom Alliance, Civic Tech Forum..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                    Group Topic / Description
                  </label>
                  <input
                    type="text"
                    value={newGroupTopic}
                    onChange={(e) => setNewGroupTopic(e.target.value)}
                    placeholder="Brief description of the room purpose..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                    Invite Member Monikers (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={newGroupParticipants}
                    onChange={(e) => setNewGroupParticipants(e.target.value)}
                    placeholder="e.g., QuietTaxpayer, SkepticGeologist, HorologyNut"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewGroupModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono"
                  >
                    Create Group Room
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Fuel Private Chat Setup */}
      <AnimatePresence>
        {isNewDMModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl font-sans"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Flame className="w-4 h-4 fill-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">Fuel Private Chat Setup</h3>
                    <p className="text-[11px] font-mono text-amber-400">1-on-1 Direct Message Room</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNewDMModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 mb-1">
                    Target Author / Participant Moniker *
                  </label>
                  <input
                    type="text"
                    value={newDMMoniker}
                    onChange={(e) => setNewDMMoniker(e.target.value)}
                    placeholder="e.g., OfflineAdvocate, QuietTaxpayer..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
                  />
                </div>

                <div>
                  <span className="block text-[11px] font-mono text-slate-400 mb-1.5">
                    Or select an active community author:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {["QuietTaxpayer", "OfflineAdvocate", "HorologyNut", "SkepticGeologist", "FrustratedFarmer", "CivicObserver"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setNewDMMoniker(m)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                          newDMMoniker === m
                            ? "bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                        }`}
                      >
                        @{m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs font-mono text-slate-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <ShieldCheck className="w-4 h-4" />
                    Private & End-to-End Persistence
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Private rooms are restricted to you and your chosen recipient. Upload photo, video (up to 150MB), or audio attachments freely.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewDMModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!newDMMoniker.trim()}
                    onClick={() => {
                      if (newDMMoniker.trim()) {
                        startOrOpenDM(newDMMoniker.trim());
                        setIsNewDMModalOpen(false);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs font-mono disabled:opacity-50 transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Flame className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Launch Private Chat</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Full Photo Viewer */}
      <AnimatePresence>
        {expandedPhotoUrl && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setExpandedPhotoUrl(null)}>
            <div className="relative max-w-4xl max-h-[90vh] w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-full flex justify-between items-center mb-2">
                <span className="text-xs font-mono text-slate-400">Attached Photo</span>
                <div className="flex items-center gap-2">
                  <a
                    href={expandedPhotoUrl}
                    download="chat-photo.jpg"
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    Download
                  </a>
                  <button onClick={() => setExpandedPhotoUrl(null)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <img src={expandedPhotoUrl} alt="Expanded photo" className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg" />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}
