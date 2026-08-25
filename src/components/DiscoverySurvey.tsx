import React, { useState, useEffect } from "react";
import { Share2, BarChart3, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const DISCOVERY_SOURCES = [
  "Word of Mouth (Friend)",
  "Alternative Media / Blogs",
  "Decentralized Socials (Nostr, Substack)",
  "Organic Search",
  "Independent Newsletters"
];

const COLORS = [
  "bg-orange-500",
  "bg-sky-500",
  "bg-fuchsia-500",
  "bg-emerald-500",
  "bg-indigo-500"
];

const BORDER_COLORS = [
  "border-orange-500/30",
  "border-sky-500/30",
  "border-fuchsia-500/30",
  "border-emerald-500/30",
  "border-indigo-500/30"
];

export default function DiscoverySurvey() {
  const [stats, setStats] = useState<{ [key: string]: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [voted, setVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      setVoted(localStorage.getItem("votedDiscovery") === "true");
    } catch (e) {
      setVoted(false);
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/discovery/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error loading discovery stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (source: string) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/discovery/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source })
      });
      if (response.ok) {
        try { localStorage.setItem("votedDiscovery", "true"); } catch (e) {}
        setVoted(true);
        await fetchStats();
      }
    } catch (err) {
      console.error("Error submitting vote:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const totalVotes = stats
    ? (Object.values(stats) as number[]).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div
      className="p-5 rounded-2xl bg-white border border-slate-200/80 text-slate-800 shadow-card-highlight"
      id="discovery-survey-card"
    >
      <div className="flex items-center gap-2 mb-3">
        <Share2 className="w-5 h-5 text-brand-accent shrink-0" />
        <h3 className="text-sm font-display font-bold text-slate-900">
          Welcome Aboard
        </h3>
      </div>

      <p className="text-xs text-slate-600 mb-4 leading-relaxed">
        We appreciate your sincere, considered and respectful points.
      </p>

      {loading ? (
        <div className="flex justify-center items-center py-6 text-slate-500 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-brand-accent" />
          <span className="text-xs font-mono">Synchronizing discovery logs...</span>
        </div>
      ) : !voted ? (
        <div className="space-y-2" id="discovery-voting-panel">
          {DISCOVERY_SOURCES.map((source, index) => (
            <button
              key={source}
              disabled={submitting}
              onClick={() => handleVote(source)}
              className={`w-full text-left px-4 py-2.5 rounded-xl border bg-slate-50 hover:bg-slate-100 hover:scale-[1.01] transition-all text-xs font-semibold cursor-pointer flex items-center justify-between group ${
                BORDER_COLORS[index % BORDER_COLORS.length]
              }`}
            >
              <span className="text-slate-800 group-hover:text-slate-900 truncate">
                {source}
              </span>
              <span className="text-[10px] text-brand-accent font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Select →
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3" id="discovery-stats-chart">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mb-1 justify-between">
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-brand-accent" />
              <span>LOGGED AUDIENCE REFERRALS</span>
            </span>
            <span className="font-bold text-slate-900">{totalVotes} VOTES</span>
          </div>

          {stats &&
            DISCOVERY_SOURCES.map((source, index) => {
              const count = stats[source] || 0;
              const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
              const barColor = COLORS[index % COLORS.length];

              return (
                <div key={source} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 truncate pr-2">{source}</span>
                    <span className="text-slate-900 font-bold font-mono">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${barColor}`}
                    />
                  </div>
                </div>
              );
            })}

          <div className="pt-2 text-center">
            <span className="text-[9px] uppercase tracking-wider text-slate-600 font-mono font-semibold flex items-center gap-1 justify-center bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Thank you for adding to the consensus</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
