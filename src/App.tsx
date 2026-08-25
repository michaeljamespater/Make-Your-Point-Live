import React, { useState, useEffect } from "react";
import { Point, getAudienceVoices } from "./types";
import PlatformManifesto from "./components/PlatformManifesto";
import PointForm from "./components/PointForm";
import PointCard from "./components/PointCard";
import ReplySection from "./components/ReplySection";
import CategoryIndex from "./components/CategoryIndex";
import DiscoverySurvey from "./components/DiscoverySurvey";
import PointEditorPanel from "./components/PointEditorPanel";
import OurWayOfLife from "./components/OurWayOfLife";
import SponsorModal from "./components/SponsorModal";
import MonetizationDashboard from "./components/MonetizationDashboard";
import ChatSection from "./components/ChatSection";
import FirstPageLanding from "./components/FirstPageLanding";
import PrivateChatsPage from "./components/PrivateChatsPage";
import {
  Megaphone,
  Sparkles,
  Inbox,
  PenSquare,
  Search,
  BookOpen,
  Filter,
  Check,
  ChevronRight,
  MessageSquare,
  RefreshCw,
  X,
  Edit3,
  Coins,
  Flame,
  FolderTree,
  Layers,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Tag,
  Plus,
  Sun,
  Moon,
  Lock,
  Users,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [activeFilters, setActiveFilters] = useState({
    category: null as string | null,
    subcategory: null as string | null,
    audience: null as string | null,
    search: ""
  });
  
  // Mobile active tab: 'browse' | 'post'
  const [mobileTab, setMobileTab] = useState<'browse' | 'post'>('browse');

  // Simple First Page (Landing Draft) state
  const [showFirstPage, setShowFirstPage] = useState<boolean>(true);
  const [chatInitialFilter, setChatInitialFilter] = useState<"all" | "private" | "group">("all");

  // Dark / Light Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('theme') === 'dark';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      const body = document.body;
      if (isDarkMode) {
        root.classList.add('dark');
        body.classList.add('dark');
        root.style.colorScheme = 'dark';
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
        root.style.colorScheme = 'light';
        localStorage.setItem('theme', 'light');
      }
    } catch (e) {
      console.warn("Unable to access localStorage for theme:", e);
    }
  }, [isDarkMode]);

  // Grouping & Sorting states for cleaning up points list
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('flat');
  const [sortOption, setSortOption] = useState<'newest' | 'reactions' | 'sponsored'>('newest');
  const [collapsedCategories, setCollapsedCategories] = useState<{ [cat: string]: boolean }>({});

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Computed sorted points (always strictly newest first when sortOption === 'newest')
  const sortedPoints = React.useMemo(() => {
    const list = [...points];
    if (sortOption === 'reactions') {
      list.sort((a, b) => {
        const sumA = (a.reactions?.hearHear || 0) + (a.reactions?.respect || 0) + (a.reactions?.supported || 0) + (a.reactions?.thoughtProvoking || 0);
        const sumB = (b.reactions?.hearHear || 0) + (b.reactions?.respect || 0) + (b.reactions?.supported || 0) + (b.reactions?.thoughtProvoking || 0);
        return sumB - sumA;
      });
    } else if (sortOption === 'sponsored') {
      list.sort((a, b) => (b.sponsorshipsTotal || 0) - (a.sponsorshipsTotal || 0));
    } else {
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    }
    return list;
  }, [points, sortOption]);

  // Computed points grouped by level / category
  const groupedPoints = React.useMemo(() => {
    const map: { [key: string]: Point[] } = {};
    sortedPoints.forEach(pt => {
      const cat = pt.category || "General Points";
      if (!map[cat]) map[cat] = [];
      map[cat].push(pt);
    });
    return map;
  }, [sortedPoints]);

  // Sponsorship and Monetisation states
  const [isMonetizeOpen, setIsMonetizeOpen] = useState(false);
  const [isSponsorOpen, setIsSponsorOpen] = useState(false);
  const [sponsorPoint, setSponsorPoint] = useState<Point | null>(null);

  // Private & Group Chat states
  const [isChatSectionOpen, setIsChatSectionOpen] = useState(false);
  const [isPrivateChatsOpen, setIsPrivateChatsOpen] = useState(false);
  const [directChatMoniker, setDirectChatMoniker] = useState<string | null>(null);

  const handleOpenDirectChat = (authorMoniker: string) => {
    setDirectChatMoniker(authorMoniker);
    setShowFirstPage(false);
    setIsChatSectionOpen(false);
    setIsPrivateChatsOpen(true);
  };

  // Stats and linking states
  const [stats, setStats] = useState({ totalPoints: 0, totalConnections: 0 });
  const [linkingFromPoint, setLinkingFromPoint] = useState<Point | null>(null);

  // Curator Sandbox / Editing states
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [editingPoint, setEditingPoint] = useState<Point | null>(null);
  const [isManifestoEditorOpen, setIsManifestoEditorOpen] = useState(false);
  const [manifestoRefresher, setManifestoRefresher] = useState(0);
  const [currentManifestoData, setCurrentManifestoData] = useState({
    title: "Make Your Point",
    description: "Your voice matters. Speak freely, be heard, and know you are not alone.",
    corePillar: "",
    pillarTitle: "",
    rule1Title: "Honest voices stay",
    rule1Content: "Spam and empty noise are filtered. Real opinions — even hard or unpopular ones — are protected and kept.",
    rule2Title: "You are welcome here",
    rule2Content: "No gatekeepers. No need to be polished. If something needs saying, say it with respect, and you will be heard."
  });

  useEffect(() => {
    if (!isEditorMode) {
      setEditingPoint(null);
    }
  }, [isEditorMode]);

  const [voices, setVoices] = useState<any[]>([]);
  useEffect(() => {
    setVoices(getAudienceVoices());
    const handleStorage = () => {
      setVoices(getAudienceVoices());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    fetchManifesto();
  }, [manifestoRefresher]);

  const fetchManifesto = async () => {
    try {
      const response = await fetch("/api/manifesto");
      if (response.ok) {
        const data = await response.json();
        setCurrentManifestoData(data);
      }
    } catch (err) {
      console.error("Error fetching manifesto in App:", err);
    }
  };

  useEffect(() => {
    fetchPoints();
    fetchStats();
  }, [activeFilters]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchPoints = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (activeFilters.category) queryParams.append("category", activeFilters.category);
      if (activeFilters.subcategory) queryParams.append("subcategory", activeFilters.subcategory);
      if (activeFilters.audience) queryParams.append("audience", activeFilters.audience);
      if (activeFilters.search) queryParams.append("search", activeFilters.search);

      const response = await fetch(`/api/points?${queryParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPoints(data);
        
        // If the selected point is currently open, let's refresh its data as well to sync reply count
        if (selectedPoint) {
          const freshPoint = data.find((p: Point) => p.id === selectedPoint.id);
          if (freshPoint) {
            setSelectedPoint(freshPoint);
          }
        }
      }
    } catch (err) {
      console.error("Error loading points:", err);
    } finally {
      setLoading(false);
    }
  };

  const [seedStatus, setSeedStatus] = useState<"idle" | "confirming" | "seeding" | "success" | "error">("idle");

  const handleSeedAll = async () => {
    setSeedStatus("seeding");
    try {
      const res = await fetch("/api/seed-all", { method: "POST" });
      if (res.ok) {
        setSeedStatus("success");
        fetchPoints();
        fetchStats();
      } else {
        setSeedStatus("error");
      }
    } catch (err) {
      console.error(err);
      setSeedStatus("error");
    }
  };

  const handlePointCreated = (newPoint: Point) => {
    // Clear filters and ensure flat view + newest sort so point is immediately at top of list
    setActiveFilters({ category: null, subcategory: null, audience: null, search: "" });
    setViewMode('flat');
    setSortOption('newest');
    setPoints(prev => [newPoint, ...prev.filter(p => p.id !== newPoint.id)]);
    fetchPoints();
    fetchStats();
    setSelectedPoint(newPoint);
  };

  const handleStartLinking = (pointToLink: Point) => {
    setEditingPoint(null);
    setSelectedPoint(pointToLink);
    setLinkingFromPoint(pointToLink);
    setMobileTab('post');
    setTimeout(() => {
      const inputEl = document.getElementById("point-content-textarea") || document.getElementById("point-submission-form-card");
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputEl.focus();
      }
    }, 100);
  };

  const handleTriggerMakeYourPoint = () => {
    setShowFirstPage(false);
    setSelectedPoint(null);
    setEditingPoint(null);
    setLinkingFromPoint(null);
    setMobileTab('post');
    setTimeout(() => {
      const inputEl = document.getElementById("quick-point-content-textarea") || document.getElementById("point-content-textarea") || document.getElementById("point-submission-form-card");
      if (inputEl) {
        inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputEl.focus();
      }
    }, 50);
  };

  const handleReplyAdded = () => {
    // Just refresh points to update comment count badge dynamically
    fetchPoints();
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const p1 = points[index];
    const p2 = points[index - 1];
    
    // Swap on frontend instantly for speed
    const reordered = [...points];
    reordered[index] = p2;
    reordered[index - 1] = p1;
    setPoints(reordered);
    
    try {
      await fetch("/api/points/swap-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id1: p1.id, id2: p2.id })
      });
      fetchStats();
    } catch (err) {
      console.error("Error swapping order:", err);
      fetchPoints();
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === points.length - 1) return;
    const p1 = points[index];
    const p2 = points[index + 1];
    
    // Swap on frontend instantly for speed
    const reordered = [...points];
    reordered[index] = p2;
    reordered[index + 1] = p1;
    setPoints(reordered);
    
    try {
      await fetch("/api/points/swap-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id1: p1.id, id2: p2.id })
      });
      fetchStats();
    } catch (err) {
      console.error("Error swapping order:", err);
      fetchPoints();
    }
  };

  const getMyMoniker = () => {
    try { return localStorage.getItem("myp_author_moniker") || ""; } catch { return ""; }
  };

  const canDeletePoint = (point: Point) => {
    if (isEditorMode) return true;
    const mine = getMyMoniker().trim().toLowerCase();
    if (!mine) return false;
    return (point.authorMoniker || "").trim().toLowerCase() === mine;
  };

  const handleDeletePoint = async (point: Point) => {
    if (!canDeletePoint(point)) {
      alert("You can only delete your own points.");
      return;
    }
    if (!window.confirm("Are you sure you want to subtract (delete) this point? This will also remove all connected replies.")) {
      return;
    }
    
    // Remove from frontend instantly
    setPoints(prev => prev.filter(p => p.id !== point.id));
    if (selectedPoint?.id === point.id) {
      setSelectedPoint(null);
    }
    if (editingPoint?.id === point.id) {
      setEditingPoint(null);
    }
    
    try {
      const response = await fetch(`/api/points/${point.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorMoniker: getMyMoniker(),
          isEditorMode
        })
      });
      if (response.ok) {
        fetchStats();
      } else {
        console.error("Failed to delete point");
        fetchPoints();
      }
    } catch (err) {
      console.error("Error deleting point:", err);
      fetchPoints();
    }
  };

  // Active Page Name tracking for Top Banner
  const [activePageName, setActivePageName] = useState<string>("First Page");
  const [showScrollTopBtn, setShowScrollTopBtn] = useState<boolean>(false);

  // Scroll To Top Helper
  const scrollToTop = (instant = true) => {
    try {
      if (instant) {
        window.scrollTo(0, 0);
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
    } catch (e) {
      window.scrollTo(0, 0);
    }
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    const scrollableIds = [
      'app-root-container',
      'main-content-panel',
      'left-voice-forum-panel',
      'left-points-panel',
      'points-single-panel',
      'first-page-container',
      'private-chats-page-container',
      'chat-section-wrapper',
      'your-voice-forums-single-list',
      'right-interactive-column',
      'middle-points-column'
    ];
    scrollableIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        try {
          if (instant) {
            el.scrollTop = 0;
          } else {
            el.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
          }
        } catch (e) {
          el.scrollTop = 0;
        }
      }
    });

    // Double check on next frame to prevent DOM height calculation race conditions
    setTimeout(() => {
      window.scrollTo(0, 0);
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      scrollableIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.scrollTop = 0;
      });
    }, 15);
  };

  // Listen to scroll events to trigger Top of Page Floating Button
  useEffect(() => {
    const handleScroll = () => {
      const windowY = window.scrollY || (document.documentElement ? document.documentElement.scrollTop : 0) || (document.body ? document.body.scrollTop : 0);
      const mainPanel = document.getElementById('main-content-panel');
      const mainY = mainPanel ? mainPanel.scrollTop : 0;
      if (windowY > 100 || mainY > 100) {
        setShowScrollTopBtn(true);
      } else {
        setShowScrollTopBtn(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const mainPanel = document.getElementById('main-content-panel');
    if (mainPanel) {
      mainPanel.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainPanel) {
        mainPanel.removeEventListener('scroll', handleScroll);
      }
    };
  }, [showFirstPage, isPrivateChatsOpen, isChatSectionOpen]);

  // Always scroll to top when page/view state changes
  useEffect(() => {
    scrollToTop();
  }, [showFirstPage, isChatSectionOpen, isPrivateChatsOpen, activePageName, selectedPoint?.id, activeFilters.category, activeFilters.audience, activeFilters.subcategory]);

  // Central Page Navigation Helper
  const navigateToPage = (
    pageName: string,
    options?: {
      showFirst?: boolean;
      isChat?: boolean;
      isPrivate?: boolean;
      resetPoint?: boolean;
      resetFilters?: boolean;
      triggerMakePoint?: boolean;
      mobileTabTarget?: 'browse' | 'post';
    }
  ) => {
    setActivePageName(pageName);
    if (options?.showFirst !== undefined) setShowFirstPage(options.showFirst);
    if (options?.isChat !== undefined) setIsChatSectionOpen(options.isChat);
    if (options?.isPrivate !== undefined) setIsPrivateChatsOpen(options.isPrivate);
    if (options?.resetPoint) {
      setSelectedPoint(null);
      setEditingPoint(null);
    }
    if (options?.resetFilters) {
      setActiveFilters({ category: null, subcategory: null, audience: null, search: "" });
      setViewMode('flat');
    }
    if (options?.mobileTabTarget) setMobileTab(options.mobileTabTarget);

    if (options?.triggerMakePoint) {
      handleTriggerMakeYourPoint();
    }

    scrollToTop();
  };

  const clearFilterField = (key: 'category' | 'subcategory' | 'audience' | 'search') => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: key === 'search' ? "" : null
    }));
  };

  const hasAnyFilters =
    activeFilters.category !== null ||
    activeFilters.subcategory !== null ||
    activeFilters.audience !== null ||
    activeFilters.search !== "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200" id="app-root-container">
      {/* Always-visible Light / Dark + Owner tools */}
      <div className="fixed top-3 right-3 z-[60] flex gap-1 shadow-lg" id="global-theme-toggle">
        <button
          type="button"
          onClick={() => setIsDarkMode(false)}
          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wide border cursor-pointer ${
            !isDarkMode ? "bg-orange-600 text-white border-orange-500" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600"
          }`}
          title="Light mode"
        >
          <Sun className="w-3.5 h-3.5 inline mr-1" />
          Light
        </button>
        <button
          type="button"
          onClick={() => setIsDarkMode(true)}
          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wide border cursor-pointer ${
            isDarkMode ? "bg-orange-600 text-white border-orange-500" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600"
          }`}
          title="Dark mode"
        >
          <Moon className="w-3.5 h-3.5 inline mr-1" />
          Dark
        </button>
        <button
          type="button"
          onClick={() => setIsMonetizeOpen(true)}
          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wide border cursor-pointer bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600"
          title="Administrator settings"
        >
          Admin
        </button>
        <button
          type="button"
          onClick={() => {
            if (isEditorMode) {
              setIsEditorMode(false);
              return;
            }
            let pin = "1234";
            try { pin = localStorage.getItem("owner_access_pin") || "1234"; } catch {}
            const entered = window.prompt("Enter Owner PIN to enable Editor");
            if (entered !== null && entered.trim() === pin) {
              setIsEditorMode(true);
            } else if (entered !== null) {
              window.alert("Invalid PIN");
            }
          }}
          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wide border cursor-pointer ${
            isEditorMode
              ? "bg-amber-500 text-slate-950 border-amber-400"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600"
          }`}
          title="Editor mode — delete or edit any point"
        >
          {isEditorMode ? "Editor ON" : "Editor"}
        </button>
      </div>

      {/* Main Content Arena */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 flex flex-col overflow-hidden ${showFirstPage ? 'py-4 sm:py-6' : 'py-2 sm:py-4'}`}>

        {showFirstPage ? (
          /* FRONT PAGE LANDING: 4 Large Main Buttons FIRST at top, Preamble & Directory Index BELOW */
          <div className="w-full space-y-10 py-2 sm:py-4" id="first-page-landing-wrapper">
            {/* 1. FIRST THING THE USER SEES: Main Title Header + 4 Large Main Buttons Grid */}
            <FirstPageLanding
              onMakeYourPoint={() => navigateToPage("Make Your Point", { showFirst: false, isChat: false, isPrivate: false, triggerMakePoint: true })}
              onPointToPoint={() => navigateToPage("Point To Point", { showFirst: false, isChat: true, isPrivate: false, mobileTabTarget: 'browse' })}
              onPrivateChats={() => navigateToPage("Private Chats", { showFirst: false, isChat: false, isPrivate: true, mobileTabTarget: 'browse' })}
              onBrowsePoints={() => navigateToPage("All Points", { showFirst: false, isChat: false, isPrivate: false, resetPoint: true, resetFilters: true, mobileTabTarget: 'browse' })}
              isDarkMode={isDarkMode}
              onToggleTheme={() => setIsDarkMode(prev => !prev)}
            />

            {/* 2. ALL PREAMBLE, VOICE FORUMS DIRECTORY INDEX & PLATFORM BYLAWS BELOW THE 4 BUTTONS */}
            <div className="w-full pt-8 border-t border-slate-200 dark:border-slate-800 space-y-8" id="preamble-and-directory-section">
              <div className="flex flex-col md:flex-row gap-6 w-full">
                {/* Voice Forums & Directory Index */}
                <aside className="w-full md:w-80 lg:w-88 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm" id="voice-forum-directory-container">
                  <div className="mb-3 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-orange-600" />
                      <span>Voice Forums & Directory</span>
                    </h3>
                    <span className="text-[10px] font-mono bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 font-bold px-2 py-0.5 rounded-full">
                      Index
                    </span>
                  </div>

                  <CategoryIndex
                    stats={stats}
                    onFilterChange={(filters) => {
                      setActiveFilters(filters);
                      setSelectedPoint(null);
                      setEditingPoint(null);
                      setMobileTab('browse');
                      if (filters.audience) {
                        setActivePageName(`Voice Forum: ${filters.audience}`);
                      } else if (filters.category) {
                        setActivePageName(`Category: ${filters.category}`);
                      } else {
                        setActivePageName("All Points");
                      }
                      scrollToTop();
                    }}
                    activeFilters={activeFilters}
                    points={points}
                    onSelectPoint={(pt) => {
                      setSelectedPoint(pt);
                      setEditingPoint(null);
                      setShowFirstPage(false);
                      setIsPrivateChatsOpen(false);
                      setIsChatSectionOpen(false);
                      setMobileTab('browse');
                      setActivePageName(`Point: ${pt.title}`);
                      scrollToTop();
                    }}
                  />
                </aside>

                {/* Platform Manifesto, Bylaws & Preamble */}
                <div className="flex-1 min-w-0 space-y-6">
                  <PlatformManifesto 
                    stats={stats} 
                    isEditorMode={false} 
                    manifestoRefresher={manifestoRefresher}
                    onSaved={(data) => {
                      setCurrentManifestoData(data);
                      setManifestoRefresher(prev => prev + 1);
                    }}
                  />
                  <OurWayOfLife />
                  <DiscoverySurvey />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* SUB-PAGES VIEW: Single Scrollable Container for 100% Linear Top-to-Bottom Flow */
          <div className="w-full space-y-6 flex-1 min-h-[92vh] overflow-y-auto pr-1" id="main-content-panel">
            
            {/* 1. Point To Point Group Chat Section - PHYSICAL TOP OF PAGE */}
            <AnimatePresence>
              {isChatSectionOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="w-full mb-6 shrink-0"
                  id="top-point-to-point-panel"
                >
                  <ChatSection
                    initialChatMoniker={directChatMoniker}
                    onClose={() => {
                      setIsChatSectionOpen(false);
                      setDirectChatMoniker(null);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 2. Private Chats Messenger Section */}
            {isPrivateChatsOpen ? (
              <PrivateChatsPage
                initialMoniker={directChatMoniker}
                onBackToFirstPage={() => navigateToPage("First Page", { showFirst: true, isChat: false, isPrivate: false })}
                onBackToForum={() => navigateToPage("All Points", { showFirst: false, isChat: false, isPrivate: false })}
              />
            ) : (
              <>
                {/* 3. Interactive Form / Discussion Thread / Point Sandbox Editor - AT TOP */}
                {(editingPoint || selectedPoint || mobileTab === 'post' || linkingFromPoint) && (
                  <div className="w-full space-y-4 pb-4 border-b border-slate-200 dark:border-slate-800" id="right-interactive-column">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                      <button
                        onClick={() => {
                          setSelectedPoint(null);
                          setEditingPoint(null);
                          setMobileTab('browse');
                          setLinkingFromPoint(null);
                        }}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                        id="btn-back-to-points-forum"
                      >
                        <ArrowLeft className="w-4 h-4 text-amber-400" />
                        <span>← Back to Points Forum Feed</span>
                      </button>
                      <span className="text-xs font-mono font-extrabold uppercase tracking-wider text-slate-500">
                        {editingPoint ? "Editing Point" : selectedPoint ? "Discussion Thread" : "New Point Form"}
                      </span>
                    </div>

                    <AnimatePresence mode="wait">
                      {editingPoint ? (
                        <motion.div
                          key="editor"
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          transition={{ duration: 0.25 }}
                          className="h-full"
                        >
                          <PointEditorPanel
                            point={editingPoint}
                            onCancel={() => setEditingPoint(null)}
                            onSaved={(updatedFields) => {
                              setPoints(prev =>
                                prev.map(p =>
                                  p.id === editingPoint.id ? { ...p, ...updatedFields } : p
                                )
                              );
                              if (selectedPoint?.id === editingPoint.id) {
                                setSelectedPoint(prev => prev ? { ...prev, ...updatedFields } : null);
                              }
                              setEditingPoint(null);
                              fetchPoints();
                            }}
                          />
                        </motion.div>
                      ) : selectedPoint && !linkingFromPoint ? (
                        <motion.div
                          key="thread"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="h-full"
                        >
                          <ReplySection
                            point={selectedPoint}
                            onClose={() => setSelectedPoint(null)}
                            onReplyAdded={handleReplyAdded}
                            allPoints={points}
                            onSelectPoint={setSelectedPoint}
                            onStartLinking={handleStartLinking}
                            isEditorMode={isEditorMode}
                            onEdit={() => setEditingPoint(selectedPoint)}
                            onDelete={canDeletePoint(selectedPoint) ? () => handleDeletePoint(selectedPoint) : undefined}
                            onOpenSponsor={() => {
                              setSponsorPoint(selectedPoint);
                              setIsSponsorOpen(true);
                            }}
                            onOpenDirectChat={handleOpenDirectChat}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="form"
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.2 }}
                          className="block"
                        >
                          <PointForm
                            onPointCreated={(newPoint) => {
                              handlePointCreated(newPoint);
                              setLinkingFromPoint(null);
                              setMobileTab('browse');
                            }}
                            onSelectCreatedPoint={(newPoint) => {
                              setSelectedPoint(newPoint);
                              setMobileTab('browse');
                            }}
                            linkingFromPoint={linkingFromPoint}
                            onCancelLink={() => setLinkingFromPoint(null)}
                            onBrowseAllPoints={() => {
                              setMobileTab('browse');
                            }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* 4. Points Feed List & Search Toolbar (Only when NOT on Point To Point) */}
                {!isChatSectionOpen && (
                  <div className="flex flex-col space-y-6" id="left-points-panel">
                    
                    {/* Page Top Signature Header Panel: POINTS (Deep Teal Theme - only when browsing) */}
                    {(!editingPoint && !selectedPoint && mobileTab !== 'post') && (
                      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-900 border-2 border-teal-400/50 text-white rounded-2xl p-4 sm:p-5 shadow-2xl flex items-center justify-between gap-4 shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-400/25 border border-teal-300/40 flex items-center justify-center text-teal-200 shrink-0">
                            <Layers className="w-5 h-5 stroke-[2.2]" />
                          </div>
                          <div>
                            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                              POINTS
                            </h1>
                            <p className="text-xs text-teal-100/90 font-medium">
                              Browse, filter, and explore all community points across categories.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  {/* Active filters indicators bar */}
                  {hasAnyFilters && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-2.5 flex flex-wrap gap-2 items-center text-xs text-slate-800 shrink-0">
                      <span className="font-bold text-orange-900 flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5 text-orange-600" /> Active Filters:
                      </span>
                      {activeFilters.category && (
                        <span className="bg-white border border-orange-200 px-2 py-0.5 rounded-lg flex items-center gap-1 text-[11px] font-semibold text-slate-800 shadow-2xs">
                          Level: <span className="text-orange-700 font-bold">{activeFilters.category}</span>
                          <button onClick={() => clearFilterField('category')} className="hover:text-red-600 cursor-pointer text-[10px] p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {activeFilters.subcategory && (
                        <span className="bg-white border border-orange-200 px-2 py-0.5 rounded-lg flex items-center gap-1 text-[11px] font-semibold text-slate-800 shadow-2xs">
                          Subcat: <span className="text-orange-700 font-bold">{activeFilters.subcategory}</span>
                          <button onClick={() => clearFilterField('subcategory')} className="hover:text-red-600 cursor-pointer text-[10px] p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {activeFilters.audience && (
                        <span className="bg-white border border-orange-200 px-2 py-0.5 rounded-lg flex items-center gap-1 text-[11px] font-semibold text-slate-800 shadow-2xs">
                          Forum: <span className="text-orange-700 font-bold">{voices.find(v => v.id === activeFilters.audience)?.label || activeFilters.audience}</span>
                          <button onClick={() => clearFilterField('audience')} className="hover:text-red-600 cursor-pointer text-[10px] p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {activeFilters.search && (
                        <span className="bg-white border border-orange-200 px-2 py-0.5 rounded-lg flex items-center gap-1 text-[11px] font-semibold text-slate-800 shadow-2xs">
                          Search: <span className="text-orange-700 font-bold truncate max-w-[100px]">{activeFilters.search}</span>
                          <button onClick={() => clearFilterField('search')} className="hover:text-red-600 cursor-pointer text-[10px] p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      <button
                        onClick={() => setActiveFilters({ category: null, subcategory: null, audience: null, search: "" })}
                        className="ml-auto text-[11px] font-bold text-orange-700 hover:text-orange-900 underline cursor-pointer"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  )}

                  {/* List Controls & Sorting Toolbar */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0" id="points-list-toolbar">
                    {/* Quick Search Field */}
                    <div className="relative flex-1 min-w-[160px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search points..."
                        value={activeFilters.search}
                        onChange={(e) => setActiveFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-8 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 font-medium transition-all"
                        id="feed-quick-search-input"
                      />
                      {activeFilters.search && (
                        <button
                          onClick={() => clearFilterField('search')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        onClick={() => setViewMode('grouped')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          viewMode === 'grouped'
                            ? "bg-orange-600 text-white shadow-xs"
                            : "text-slate-700 hover:text-slate-950"
                        }`}
                        title="Group points under Category & Level headings"
                      >
                        <FolderTree className="w-3.5 h-3.5" />
                        <span>Grouped</span>
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('flat');
                          setActiveFilters({ category: null, subcategory: null, audience: null, search: "" });
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          viewMode === 'flat' && !hasAnyFilters
                            ? "bg-orange-600 text-white shadow-xs"
                            : "text-slate-700 hover:text-slate-950"
                        }`}
                        title="Clear filters and view all points continuously"
                        id="btn-all-points-toolbar"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>All Points</span>
                      </button>
                    </div>

                    {/* Sort Order Selector */}
                    <div className="flex items-center gap-1.5">
                      <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as any)}
                        className="bg-slate-50 border border-slate-300 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 shadow-xs cursor-pointer"
                        id="sort-points-select"
                      >
                        <option value="newest">Latest</option>
                        <option value="reactions">Most Reacted</option>
                        <option value="sponsored">Top Sponsored</option>
                      </select>
                    </div>
                  </div>

                  {/* List scroll container */}
                  <div className="flex-1 space-y-4">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
                        <RefreshCw className="w-8 h-8 animate-spin text-orange-600" />
                        <span className="text-sm font-bold text-slate-700">Synchronizing Points Feed...</span>
                      </div>
                    ) : points.length === 0 ? (
                      <div className="text-center py-20 border border-dashed border-slate-300 rounded-2xl bg-white flex flex-col items-center gap-3">
                        <Inbox className="w-10 h-10 text-slate-400" />
                        <div>
                          <h4 className="text-slate-900 font-bold text-sm">No points in this index</h4>
                          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                            No points match your filters. Be the first to publish a Point!
                          </p>
                        </div>
                      </div>
                    ) : viewMode === 'grouped' ? (
                      /* CATEGORIZED GROUPED VIEW */
                      <div className="space-y-6">
                        {(Object.entries(groupedPoints) as [string, Point[]][]).map(([catName, catPoints]) => {
                          const isCollapsed = collapsedCategories[catName];
                          return (
                            <div key={catName} className="space-y-3">
                              {/* Clean Category Group Header */}
                              <div
                                onClick={() => toggleCategoryCollapse(catName)}
                                className="flex items-center justify-between p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer shadow-2xs transition-all select-none"
                              >
                                <div className="flex items-center gap-2">
                                  <FolderTree className="w-4 h-4 text-orange-600 shrink-0" />
                                  <span className="font-display font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wide">
                                    {catName}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-orange-100 text-orange-950 border border-orange-200">
                                    {catPoints.length}
                                  </span>
                                </div>
                                <button className="text-slate-600 hover:text-slate-900 font-bold p-1">
                                  {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                </button>
                              </div>

                              {/* Category Items List */}
                              {!isCollapsed && (
                                <div className="space-y-4 pl-1 sm:pl-2 border-l-2 border-orange-300/60">
                                  {catPoints.map((pt, idx) => (
                                    <PointCard
                                      key={pt.id}
                                      point={pt}
                                      onSelect={setSelectedPoint}
                                      isSelected={selectedPoint?.id === pt.id}
                                      isEditorMode={isEditorMode}
                                      canMoveUp={idx > 0}
                                      canMoveDown={idx < catPoints.length - 1}
                                      onMoveUp={() => handleMoveUp(idx)}
                                      onMoveDown={() => handleMoveDown(idx)}
                                      onDelete={canDeletePoint(pt) ? () => handleDeletePoint(pt) : undefined}
                                      onEdit={() => {
                                        setEditingPoint(pt);
                                        setSelectedPoint(null);
                                        setMobileTab('post');
                                      }}
                                      onStartLinking={handleStartLinking}
                                      onSparkConnection={handleStartLinking}
                                      onOpenDirectChat={handleOpenDirectChat}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* FLAT CONTINUOUS LIST VIEW */
                      <div className="space-y-4">
                        {sortedPoints.map((pt, idx) => (
                          <PointCard
                            key={pt.id}
                            point={pt}
                            onSelect={setSelectedPoint}
                            isSelected={selectedPoint?.id === pt.id}
                            isEditorMode={isEditorMode}
                            canMoveUp={idx > 0}
                            canMoveDown={idx < sortedPoints.length - 1}
                            onMoveUp={() => handleMoveUp(idx)}
                            onMoveDown={() => handleMoveDown(idx)}
                            onDelete={canDeletePoint(pt) ? () => handleDeletePoint(pt) : undefined}
                            onEdit={() => {
                              setEditingPoint(pt);
                              setSelectedPoint(null);
                              setMobileTab('post');
                            }}
                            onStartLinking={handleStartLinking}
                            onSparkConnection={handleStartLinking}
                            onOpenDirectChat={handleOpenDirectChat}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

                {/* 5. Voice Forums & Directory Index */}
                <aside
                  className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm ${
                    mobileTab === 'browse' ? 'block' : 'hidden md:block'
                  }`}
                  id="left-voice-forum-panel"
                >
                  <div className="mb-3 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-orange-600" />
                      <span>Voice Forums & Directory</span>
                    </h3>
                  </div>

                  <CategoryIndex
                    stats={stats}
                    onFilterChange={(filters) => {
                      setActiveFilters(filters);
                      setSelectedPoint(null);
                      setEditingPoint(null);
                      setMobileTab('browse');
                      if (filters.audience) {
                        setActivePageName(`Voice Forum: ${filters.audience}`);
                      } else if (filters.category) {
                        setActivePageName(`Category: ${filters.category}`);
                      } else {
                        setActivePageName("All Points");
                      }
                      scrollToTop();
                    }}
                    activeFilters={activeFilters}
                    points={points}
                    onSelectPoint={(pt) => {
                      setSelectedPoint(pt);
                      setEditingPoint(null);
                      setShowFirstPage(false);
                      setIsPrivateChatsOpen(false);
                      setIsChatSectionOpen(false);
                      setMobileTab('browse');
                      setActivePageName(`Point: ${pt.title}`);
                      scrollToTop();
                    }}
                  />
                </aside>

                {/* 6. Platform Bylaws & Preambles - VERY BOTTOM OF PAGE */}
                <div className="space-y-6 pt-4 border-t border-slate-200 shrink-0">
                  <PlatformManifesto 
                    stats={stats} 
                    isEditorMode={false} 
                    manifestoRefresher={manifestoRefresher}
                    onSaved={(data) => {
                      setCurrentManifestoData(data);
                      setManifestoRefresher(prev => prev + 1);
                    }}
                  />
                  <OurWayOfLife />
                  <DiscoverySurvey />
                </div>
              </>
            )}
          </div>
        )}
      </main>



      {/* Seeding Custom Dialog/Toast Overlay */}
      <AnimatePresence>
        {seedStatus !== "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-brand-card border border-brand-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Decorative light accent */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-500 via-brand-accent to-pink-500" />
              
              {seedStatus === "confirming" && (
                <div className="space-y-4">
                  <div className="bg-brand-accent/10 w-12 h-12 rounded-xl flex items-center justify-center text-brand-accent">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Load Category Mockup Forum?</h3>
                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                      This will reset the database and seed exactly **12 high-quality independent thought posts** (one for each of the 12 categories), representing diverse democratic viewpoints from Left, Right, and Central perspectives.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setSeedStatus("idle")}
                      className="flex-1 py-2 rounded-xl border border-brand-border hover:bg-brand-card/80 text-xs font-semibold text-gray-300 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSeedAll}
                      className="flex-1 py-2 rounded-xl bg-brand-accent text-white hover:bg-brand-accent/90 text-xs font-semibold shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                    >
                      Generate Mockup
                    </button>
                  </div>
                </div>
              )}

              {seedStatus === "seeding" && (
                <div className="space-y-4 py-4 text-center flex flex-col items-center">
                  <div className="relative w-12 h-12">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="w-12 h-12 rounded-full border-2 border-brand-border border-t-brand-accent"
                    />
                    <Sparkles className="w-5 h-5 text-brand-accent absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Clearing Mockup Sandbox Points...</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Deleting mock point records and associated replies from Firestore.
                    </p>
                  </div>
                </div>
              )}

              {seedStatus === "success" && (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-400">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Mockup Points Cleared!</h3>
                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                      All original mockup sandbox points and replies have been removed from the database.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setSeedStatus("idle")}
                      className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      Explore Forum
                    </button>
                  </div>
                </div>
              )}

              {seedStatus === "error" && (
                <div className="space-y-4">
                  <div className="bg-rose-500/10 w-12 h-12 rounded-xl flex items-center justify-center text-rose-400">
                    <X className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Generation Failed</h3>
                    <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                      An error occurred while communicating with the server to seed the forum database.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setSeedStatus("idle")}
                      className="w-full py-2 rounded-xl bg-brand-border hover:bg-brand-card text-xs font-semibold text-gray-300 transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monetization Dashboard Panel */}
      <AnimatePresence>
        {isMonetizeOpen && (
          <MonetizationDashboard
            onClose={() => setIsMonetizeOpen(false)}
            isEditorMode={isEditorMode}
            onToggleEditorMode={() => setIsEditorMode(prev => !prev)}
            onSelectPoint={(ptId) => {
              const pt = points.find(p => p.id === ptId);
              if (pt) {
                setSelectedPoint(pt);
                setIsMonetizeOpen(false);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Sponsor/Fuel Modal */}
      <AnimatePresence>
        {isSponsorOpen && sponsorPoint && (
          <SponsorModal
            point={sponsorPoint}
            onClose={() => setIsSponsorOpen(false)}
            onSponsorshipSuccess={(newTotal, newCount) => {
              if (selectedPoint) {
                const updated = {
                  ...selectedPoint,
                  sponsorshipsTotal: newTotal,
                  sponsorshipsCount: newCount
                };
                setSelectedPoint(updated);
                setPoints(prev => prev.map(p => p.id === selectedPoint.id ? updated : p));
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Centered Floating Control Group Stack - VISIBLE ON ALL PAGES */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 max-w-sm w-[92vw] sm:w-80 pointer-events-none" id="floating-nav-group">
        {/* ROW 1: Front Page & Back to Top (Side-by-Side Pair, Equal Size) */}
        <div className="grid grid-cols-2 gap-2 w-full pointer-events-auto">
          <button
            onClick={() => {
              setShowFirstPage(true);
              setIsChatSectionOpen(false);
              setIsPrivateChatsOpen(false);
              scrollToTop();
            }}
            className="w-full py-2 px-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black font-display text-xs shadow-2xl shadow-orange-600/40 border border-orange-400/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
            title="Return to Front Page"
            id="btn-nav-front-page"
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Front Page</span>
          </button>

          <button
            onClick={() => scrollToTop(false)}
            className="w-full py-2 px-3 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-black font-mono text-xs shadow-2xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
            title="Scroll Back to Top"
            id="btn-nav-back-to-top"
          >
            <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Back to Top</span>
          </button>
        </div>

        {/* ROW 2: Centered Make Your Point Button (Directly Below the Pair) */}
        <button
          onClick={() => navigateToPage("Make Your Point", { showFirst: false, isChat: false, isPrivate: false, triggerMakePoint: true })}
          className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black font-display text-xs uppercase tracking-wider shadow-2xl shadow-orange-600/50 border border-orange-400/40 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 pointer-events-auto"
          title="Create & Publish a New Point"
          id="btn-nav-make-your-point"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Make Your Point</span>
        </button>
      </div>

      {/* Universal footer */}
      <footer className="border-t border-slate-200 bg-slate-100/60 py-4 text-center text-[10px] text-slate-500 shrink-0 flex flex-col items-center justify-center gap-1" id="universal-footer">
        <p>© 2026 Make Your Point. Bridging understanding in the new AIonisphere.</p>
        <p className="text-slate-400">Designed offline-first with automated index compilation.</p>
      </footer>
    </div>
  );
}
