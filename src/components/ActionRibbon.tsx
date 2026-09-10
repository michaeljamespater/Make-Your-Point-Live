import React from "react";

export type ActionMode = "ask" | "answer" | "search" | "show";
export type ActionTarget = "all" | "moniker" | "p2p" | "private";
export type ShowKind =
  | "photos"
  | "videos"
  | "workmanship"
  | "creations"
  | "designs"
  | "inventions"
  | "innovations"
  | "services"
  | "wares"
  | "conservations";

interface ActionRibbonProps {
  mode: ActionMode;
  onMode: (m: ActionMode) => void;
  target: ActionTarget;
  onTarget: (t: ActionTarget) => void;
  moniker: string;
  onMoniker: (v: string) => void;
  showKind: ShowKind;
  onShowKind: (k: ShowKind) => void;
  search: string;
  onSearch: (v: string) => void;
}

const MODES: { id: ActionMode; label: string }[] = [
  { id: "ask", label: "Ask" },
  { id: "answer", label: "Answer" },
  { id: "search", label: "Search" },
  { id: "show", label: "Show" }
];

const TARGETS: { id: ActionTarget; label: string }[] = [
  { id: "all", label: "All" },
  { id: "moniker", label: "Name / Moniker" },
  { id: "p2p", label: "Point to Point" },
  { id: "private", label: "Private Chat" }
];

const SHOW_KINDS: { id: ShowKind; label: string }[] = [
  { id: "photos", label: "Photos" },
  { id: "videos", label: "Videos" },
  { id: "workmanship", label: "Workmanship" },
  { id: "creations", label: "Creations" },
  { id: "designs", label: "Designs" },
  { id: "inventions", label: "Inventions" },
  { id: "innovations", label: "Innovations" },
  { id: "services", label: "Services" },
  { id: "wares", label: "Wares" },
  { id: "conservations", label: "Conservations" }
];

export default function ActionRibbon({
  mode,
  onMode,
  target,
  onTarget,
  moniker,
  onMoniker,
  showKind,
  onShowKind,
  search,
  onSearch
}: ActionRibbonProps) {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-3 space-y-3" id="action-ribbon">
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onMode(m.id)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wide border cursor-pointer ${
              mode === m.id
                ? "bg-orange-600 text-white border-orange-500"
                : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {TARGETS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onTarget(t.id)}
            className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer ${
              target === t.id
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
        {target === "moniker" && (
          <input
            value={moniker}
            onChange={(e) => onMoniker(e.target.value)}
            placeholder="Name / moniker"
            className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950"
          />
        )}
      </div>

      {mode === "search" && (
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search all"
          className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950"
        />
      )}

      {mode === "show" && (
        <div className="flex flex-wrap gap-2">
          {SHOW_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => onShowKind(k.id)}
              className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer ${
                showKind === k.id
                  ? "bg-orange-600 text-white border-orange-500"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
