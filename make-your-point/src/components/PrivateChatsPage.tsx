import React, { useState, useEffect, useRef } from "react";
import { Chat, ChatMessage } from "../types";
import {
  Lock,
  User,
  Plus,
  Search,
  Send,
  Paperclip,
  X,
  Sparkles,
  ShieldCheck,
  Image as ImageIcon,
  Film,
  Mic,
  Trash2,
  Download,
  ArrowLeft,
  MessageSquare,
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
  orderBy
} from "firebase/firestore";
import { db } from "../server/firebase";

interface PrivateChatsPageProps {
  initialMoniker?: string | null;
  onBackToFirstPage: () => void;
  onBackToForum: () => void;
}

export default function PrivateChatsPage({
  initialMoniker,
  onBackToFirstPage,
  onBackToForum
}: PrivateChatsPageProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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

  // New DM Modal state
  const [isNewDMModalOpen, setIsNewDMModalOpen] = useState(false);
  const [newDMMoniker, setNewDMMoniker] = useState(initialMoniker || "");

  // Expanded Photo Modal
  const [expandedPhotoUrl, setExpandedPhotoUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageFeedRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ensure Private Chats Page ALWAYS opens at the top of the page
  useEffect(() => {
    const scrollToTopContainers = () => {
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const scrollableIds = [
        'app-root-container',
        'main-content-panel',
        'private-chats-page-container'
      ];
      scrollableIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.scrollTop = 0;
      });
    };

    scrollToTopContainers();
    const t1 = setTimeout(scrollToTopContainers, 20);
    const t2 = setTimeout(scrollToTopContainers, 100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [initialMoniker]);

  // Save current moniker to localStorage
  const handleMonikerChange = (val: string) => {
    setUserMoniker(val);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("make_your_point_user_moniker", val);
      } catch (e) {
        // Ignore
      }
    }
  };

  // Listen to Firestore for PRIVATE chats only
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    try {
      const chatsRef = collection(db, "chats");
      // Filter strictly for type == "private"
      const q = query(chatsRef, where("type", "==", "private"));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const loadedChats: Chat[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loadedChats.push({
              id: docSnap.id,
              name: data.name || "Private Chat",
              type: "private",
              participants: data.participants || [],
              topic: data.topic || "",
              lastMessage: data.lastMessage || "",
              lastMessageTime: data.lastMessageTime || new Date().toISOString(),
              createdAt: data.createdAt || new Date().toISOString(),
              createdBy: data.createdBy || ""
            });
          });

          // Sort by newest activity
          loadedChats.sort(
            (a, b) =>
              new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
          );

          setChats(loadedChats);

          // If active chat isn't set, select the first private chat or wait
          if (!activeChatId && loadedChats.length > 0) {
            setActiveChatId(loadedChats[0].id);
          }
        },
        (error) => {
          console.warn("Firestore private chats listener notice:", error);
        }
      );
    } catch (err) {
      console.warn("Firestore setup fallback for private chats:", err);
    }

    return () => unsubscribe();
  }, []);

  // Handle initialMoniker prop: create or switch to DM with that moniker
  useEffect(() => {
    if (initialMoniker && initialMoniker.trim()) {
      handleStartNewDM(initialMoniker.trim());
    }
  }, [initialMoniker]);

  // Listen for messages in active private chat
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    let unsubscribe: () => void = () => {};

    try {
      const msgsRef = collection(db, "chats", activeChatId, "messages");
      const q = query(msgsRef, orderBy("createdAt", "asc"));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const loadedMsgs: ChatMessage[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loadedMsgs.push({
              id: docSnap.id,
              chatId: activeChatId,
              senderMoniker: data.senderMoniker || "Anonymous",
              content: data.content || "",
              media: data.media || undefined,
              createdAt: data.createdAt || new Date().toISOString()
            });
          });
          setMessages(loadedMsgs);
        },
        (err) => {
          console.warn("Messages listener notice:", err);
        }
      );
    } catch (err) {
      console.warn("Fallback for messages listener:", err);
    }

    return () => unsubscribe();
  }, [activeChatId]);

  // Scroll to bottom inside message feed container ONLY when messages update
  useEffect(() => {
    if (messageFeedRef.current) {
      messageFeedRef.current.scrollTop = messageFeedRef.current.scrollHeight;
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

  // Start a new 1-on-1 DM Chat
  const handleStartNewDM = async (targetMoniker: string) => {
    if (!targetMoniker.trim()) return;

    // Check if private chat with this moniker already exists
    const existing = chats.find(
      (c) =>
        c.type === "private" &&
        c.participants.includes(targetMoniker.trim())
    );

    if (existing) {
      setActiveChatId(existing.id);
      setIsNewDMModalOpen(false);
      setNewDMMoniker("");
      return;
    }

    const newChat: Omit<Chat, "id"> = {
      name: `Direct Message: ${targetMoniker.trim()}`,
      type: "private",
      participants: Array.from(new Set([userMoniker, targetMoniker.trim()])),
      topic: `Private 1-on-1 conversation between ${userMoniker} & ${targetMoniker.trim()}`,
      lastMessage: "Private conversation started.",
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

    setIsNewDMModalOpen(false);
    setNewDMMoniker("");
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

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            fileType: file.type,
            base64Data: base64
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.reason || errData.error || "Upload failed");
        }

        const data = await res.json();
        setAttachedMedia((prev) => [
          ...prev,
          { url: data.url, type: data.type, name: data.name || file.name }
        ]);
      } catch (err: any) {
        console.error("Private chat upload error:", err);
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

    const previewText = messageText.trim() || (attachedMedia.length > 0 ? `[Attached ${attachedMedia[0].type}]` : "Sent a private message.");

    setMessageText("");
    setAttachedMedia([]);

    try {
      await addDoc(collection(db, "chats", activeChatId, "messages"), newMsg);

      try {
        await updateDoc(doc(db, "chats", activeChatId), {
          lastMessage: `${userMoniker}: ${previewText}`,
          lastMessageTime: new Date().toISOString()
        });
      } catch (updErr) {
        // Ignore
      }
    } catch (err) {
      console.warn("Sending private message local fallback:", err);
      const localMsg: ChatMessage = { id: `msg-${Date.now()}`, ...newMsg };
      setMessages((prev) => [...prev, localMsg]);
    }
  };

  const filteredChats = chats.filter((chat) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = chat.name.toLowerCase().includes(q);
      const matchParticipant = chat.participants.some((p) => p.toLowerCase().includes(q));
      return matchName || matchParticipant;
    }
    return true;
  });

  const activeChat = chats.find((c) => c.id === activeChatId);

  // Get recipient moniker for display
  const getRecipientMoniker = (chat: Chat) => {
    const other = chat.participants.find((p) => p !== userMoniker);
    return other || chat.participants[0] || "Private User";
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 h-full flex flex-col flex-1" id="private-chats-page-container">

      {/* Page Top Signature Header Panel: PRIVATE CHATS (Deep Indigo Theme) */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-2 border-indigo-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
            <Lock className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-indigo-300 flex items-center gap-2">
              PRIVATE CHATS
            </h1>
            <p className="text-xs text-indigo-200/80 font-medium">
              Direct 1-on-1 private messaging & confidential communications.
            </p>
          </div>
        </div>
      </div>

      {/* Standalone Main Private Chat Container */}
      <div className="bg-slate-950 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[640px] max-h-[82vh]">
        
        {/* SIDEBAR: Private Messages List */}
        <div className="w-full md:w-80 lg:w-96 bg-slate-900/90 border-r border-indigo-500/20 flex flex-col shrink-0">
          
          {/* Top Actions in Sidebar */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <button
              onClick={() => setIsNewDMModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs tracking-wider uppercase shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer border border-indigo-400/30"
              id="btn-private-new-dm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Start 1-on-1 Private Chat</span>
            </button>

            {/* Search Private Conversations */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Monikers..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredChats.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mx-auto flex items-center justify-center text-indigo-400">
                  <Lock className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-400 font-medium">No private conversations yet.</p>
                <button
                  onClick={() => setIsNewDMModalOpen(true)}
                  className="text-xs text-indigo-400 font-bold hover:underline"
                >
                  Start a private 1-on-1 message →
                </button>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const isActive = chat.id === activeChatId;
                const recipient = getRecipientMoniker(chat);

                return (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-3 border ${
                      isActive
                        ? "bg-indigo-600/20 border-indigo-500/50 text-white shadow-md shadow-indigo-600/10"
                        : "bg-slate-900/50 hover:bg-slate-850 border-slate-800/80 text-slate-300"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-black text-sm shrink-0">
                      {recipient.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h3 className="font-bold text-xs truncate text-slate-100 flex items-center gap-1">
                          <Lock className="w-3 h-3 text-indigo-400 inline shrink-0" />
                          <span>{recipient}</span>
                        </h3>
                        <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                          {new Date(chat.lastMessageTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate font-mono">
                        {chat.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* MAIN CHAT AREA */}
        <div className="flex-1 flex flex-col bg-slate-950">
          {activeChat ? (
            <>
              {/* Active Conversation Header */}
              <div className="p-4 border-b border-indigo-500/20 bg-slate-900/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 font-bold text-sm">
                    {getRecipientMoniker(activeChat).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{getRecipientMoniker(activeChat)}</span>
                    </h2>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Participants: {activeChat.participants.join(", ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-mono uppercase font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-indigo-400" />
                    <span>Private Room</span>
                  </span>
                </div>
              </div>

              {/* Message Feed */}
              <div ref={messageFeedRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/80">
                {messages.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 space-y-2">
                    <Lock className="w-8 h-8 text-indigo-400/60 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-300">
                      Start of your confidential 1-on-1 private chat with {getRecipientMoniker(activeChat)}
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      All messages in this room are strictly private between you and {getRecipientMoniker(activeChat)}.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderMoniker === userMoniker;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">
                            {msg.senderMoniker}
                          </span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? "bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20"
                              : "bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700"
                          }`}
                        >
                          {msg.content && (
                            <div className="flex items-start justify-between gap-2">
                              <p className="whitespace-pre-wrap flex-1">{msg.content}</p>
                              <button
                                type="button"
                                onClick={() => handleCopyText(msg.id, msg.content)}
                                className="p-1 rounded-md bg-black/20 hover:bg-white/20 text-slate-200 hover:text-white transition-all border border-white/10 shrink-0 cursor-pointer"
                                title="Copy message text"
                              >
                                {copiedMsgId === msg.id ? (
                                  <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-300 font-bold px-1">
                                    <Check className="w-3 h-3" />
                                    <span>Copied!</span>
                                  </span>
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}

                          {/* Attached Media Rendering */}
                          {msg.media && msg.media.length > 0 && (
                            <div className="mt-2.5 space-y-2">
                              {msg.media.map((item, idx) => (
                                <div key={idx} className="rounded-xl overflow-hidden border border-slate-700/60 bg-black/40 p-1 relative group">
                                  {item.type === "photo" && (
                                    <img
                                      src={item.url}
                                      alt="Attachment"
                                      onClick={() => setExpandedPhotoUrl(item.url)}
                                      className="max-h-60 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    />
                                  )}
                                  {item.type === "video" && (
                                    <video
                                      src={item.url}
                                      controls
                                      className="max-h-60 w-full rounded-lg"
                                    />
                                  )}
                                  {item.type === "audio" && (
                                    <audio src={item.url} controls className="w-full h-8" />
                                  )}

                                  {/* Delete Attachment Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAttachment(msg.id, idx);
                                    }}
                                    className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity shadow-md flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                    title="Delete .jpg / media attachment"
                                    id={`btn-delete-attachment-private-${msg.id}-${idx}`}
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

              {/* Message Input Bar */}
              <div className="p-3 border-t border-indigo-500/20 bg-slate-900/80">
                {/* Upload Error Notice */}
                {uploadError && (
                  <div className="mb-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
                    <span>{uploadError}</span>
                    <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Attached Media Previews */}
                {attachedMedia.length > 0 && (
                  <div className="flex gap-2 mb-2 overflow-x-auto p-1">
                    {attachedMedia.map((m, i) => (
                      <div key={i} className="relative group bg-slate-800 border border-indigo-500/40 rounded-xl p-1 shrink-0">
                        {m.type === "photo" && <img src={m.url} className="w-12 h-12 object-cover rounded-lg" />}
                        {m.type === "video" && <Film className="w-8 h-8 text-indigo-400 m-2" />}
                        {m.type === "audio" && <Mic className="w-8 h-8 text-amber-400 m-2" />}
                        <button
                          onClick={() => setAttachedMedia(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 bg-red-600 text-white p-0.5 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*,audio/*"
                    multiple
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-300 transition-colors cursor-pointer border border-slate-700 shrink-0"
                    title="Attach photo, video, or audio file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`Private message to ${getRecipientMoniker(activeChat)}...`}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />

                  <button
                    type="submit"
                    disabled={(!messageText.trim() && attachedMedia.length === 0) || isUploading}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/20 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <Lock className="w-12 h-12 text-indigo-500/30 mb-3" />
              <h3 className="text-sm font-bold text-slate-300 mb-1">Select or Start a Private Chat</h3>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                Choose a private conversation from the sidebar or start a new 1-on-1 direct message.
              </p>
              <button
                onClick={() => setIsNewDMModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
              >
                Start New Private Message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* NEW DM MODAL */}
      <AnimatePresence>
        {isNewDMModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 w-full max-w-md shadow-2xl text-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-base text-white">Start 1-on-1 Private Message</h3>
                </div>
                <button
                  onClick={() => setIsNewDMModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Enter the exact moniker of the participant you wish to message privately.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleStartNewDM(newDMMoniker);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-mono font-bold text-indigo-300 mb-1">
                    Participant Moniker
                  </label>
                  <input
                    type="text"
                    value={newDMMoniker}
                    onChange={(e) => setNewDMMoniker(e.target.value)}
                    placeholder="E.g., QuietTaxpayer, CivicObserver..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsNewDMModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newDMMoniker.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md disabled:opacity-50"
                  >
                    Open Private Room
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EXPANDED IMAGE MODAL */}
      <AnimatePresence>
        {expandedPhotoUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setExpandedPhotoUrl(null)}
          >
            <img src={expandedPhotoUrl} className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain" />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
