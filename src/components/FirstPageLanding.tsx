import React from "react";
import { Megaphone, MessageSquare, Layers, Sparkles, ArrowRight, Sun, Moon, Lock } from "lucide-react";
import { motion } from "motion/react";

interface FirstPageLandingProps {
  onMakeYourPoint: () => void;
  onPointToPoint: () => void;
  onPrivateChats: () => void;
  onBrowsePoints: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export default function FirstPageLanding({
  onMakeYourPoint,
  onPointToPoint,
  onPrivateChats,
  onBrowsePoints,
  isDarkMode,
  onToggleTheme
}: FirstPageLandingProps) {
  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto w-full text-slate-900 dark:text-slate-100" id="first-page-container">

      {/* Main Header / Title */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
        <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-slate-900 dark:text-white uppercase">
          MAKE YOUR POINT
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
          Your voice matters. Speak freely, be heard, and know you are not alone.
        </p>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
          No forms to pass. No gatekeepers. Just your truth, shared with respect.
        </p>
      </div>

      {/* Theme: Light / Dark */}
      <div className="flex items-center justify-center gap-2 mb-8" id="theme-toggle-row">
        <button
          type="button"
          onClick={() => { if (isDarkMode) onToggleTheme(); }}
          className={`px-4 py-2 text-xs font-bold border transition-all cursor-pointer ${
            !isDarkMode
              ? "bg-orange-600 text-white border-orange-500"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600"
          }`}
          id="btn-theme-light"
        >
          <span className="inline-flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5" />
            Light
          </span>
        </button>
        <button
          type="button"
          onClick={() => { if (!isDarkMode) onToggleTheme(); }}
          className={`px-4 py-2 text-xs font-bold border transition-all cursor-pointer ${
            isDarkMode
              ? "bg-orange-600 text-white border-orange-500"
              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600"
          }`}
          id="btn-theme-dark"
        >
          <span className="inline-flex items-center gap-1.5">
            <Moon className="w-3.5 h-3.5" />
            Dark
          </span>
        </button>
      </div>

      {/* 4 Large Simple Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full max-w-6xl mx-auto" id="first-page-buttons-grid">
        
        {/* BUTTON 1: Make Your Point */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onMakeYourPoint}
          className="group relative bg-gradient-to-br from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white p-7 rounded-3xl shadow-xl shadow-orange-600/20 flex flex-col justify-between items-center text-center transition-all cursor-pointer border border-orange-400/30 min-h-[230px]"
          id="btn-firstpage-make-your-point"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mb-5 text-white group-hover:scale-110 transition-transform">
            <Megaphone className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white mb-2">
              Make Your Point
            </h2>
            <p className="text-xs text-orange-100/90 font-medium leading-normal">
              Say what you need to say. We are listening.
            </p>
          </div>
          <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Speak Up</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.button>

        {/* BUTTON 2: Point To Point */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPointToPoint}
          className="group relative bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-750 text-slate-100 p-7 rounded-3xl shadow-xl shadow-slate-950/20 flex flex-col justify-between items-center text-center transition-all cursor-pointer border border-amber-500/30 min-h-[230px]"
          id="btn-firstpage-point-to-point"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-5 text-amber-400 group-hover:scale-110 transition-transform">
            <MessageSquare className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-amber-400 mb-2">
              Point To Point
            </h2>
            <p className="text-xs text-slate-300 font-medium leading-normal">
              Talk it through with others who care.
            </p>
          </div>
          <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Join In</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.button>

        {/* BUTTON 3: Private Chats */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onPrivateChats}
          className="group relative bg-gradient-to-br from-indigo-900 to-slate-900 dark:from-indigo-950 dark:to-slate-900 hover:from-indigo-850 hover:to-slate-850 text-slate-100 p-7 rounded-3xl shadow-xl shadow-indigo-950/20 flex flex-col justify-between items-center text-center transition-all cursor-pointer border border-indigo-500/40 min-h-[230px]"
          id="btn-firstpage-private-chats"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mb-5 text-indigo-300 group-hover:scale-110 transition-transform">
            <Lock className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-indigo-300 mb-2">
              Private Chats
            </h2>
            <p className="text-xs text-indigo-100/80 font-medium leading-normal">
              A quiet space for a private conversation.
            </p>
          </div>
          <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-indigo-300 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Talk Privately</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.button>

        {/* BUTTON 4: Points */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBrowsePoints}
          className="group relative bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 dark:from-teal-900 dark:via-teal-950 dark:to-slate-950 hover:from-teal-800 hover:via-teal-900 hover:to-slate-900 text-white p-7 rounded-3xl shadow-xl shadow-teal-950/40 flex flex-col justify-between items-center text-center transition-all cursor-pointer border border-teal-400/50 min-h-[230px]"
          id="btn-firstpage-points"
        >
          <div className="w-14 h-14 rounded-2xl bg-teal-400/25 border border-teal-300/40 flex items-center justify-center mb-5 text-teal-200 group-hover:scale-110 transition-transform shadow-inner">
            <Layers className="w-7 h-7 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white mb-2 drop-shadow-sm">
              Points
            </h2>
            <p className="text-xs text-teal-100 font-semibold leading-normal">
              See what others have had the courage to say.
            </p>
          </div>
          <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-teal-200 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
            <span>Read Voices</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.button>

      </div>
    </div>
  );
}
