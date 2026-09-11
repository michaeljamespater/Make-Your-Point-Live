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
  variant?: "default" | "market";
}

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
  onSearch,
  variant = "default"
}: ActionRibbonProps) {
  const [toolsOpen, setToolsOpen] = React.useState(false);
  if (variant === "market") {
    return (
      <div className="w-full bg-white border-2 border-orange-400 p-3 space-y-3" id="action-ribbon">
        <p className="text-xs font-bold text-slate-700">Open stall — look, show your work, ask, or find someone.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { onMode("search"); onTarget("all"); setToolsOpen(false); }} className={`px-3 py-2 text-xs font-black uppercase border cursor-pointer ${mode === "search" && target === "all" && !toolsOpen ? "bg-orange-600 text-white border-orange-600" : "bg-white border-slate-400"}`}>Look around</button>
          <button type="button" onClick={() => { onMode("show"); onTarget("all"); setToolsOpen(false); }} className={`px-3 py-2 text-xs font-black uppercase border cursor-pointer ${mode === "show" && !toolsOpen ? "bg-orange-600 text-white border-orange-600" : "bg-white border-slate-400"}`}>Show my work</button>
          <button type="button" onClick={() => { onMode("ask"); onTarget("all"); setToolsOpen(false); }} className={`px-3 py-2 text-xs font-black uppercase border cursor-pointer ${mode === "ask" && !toolsOpen ? "bg-orange-600 text-white border-orange-600" : "bg-white border-slate-400"}`}>Ask for work</button>
          <button type="button" onClick={() => { onMode("search"); onTarget("moniker"); setToolsOpen(false); }} className={`px-3 py-2 text-xs font-black uppercase border cursor-pointer ${target === "moniker" && !toolsOpen ? "bg-orange-600 text-white border-orange-600" : "bg-white border-slate-400"}`}>Find a name</button>
          <button type="button" onClick={() => { onTarget("private"); setToolsOpen(false); }} className={`px-3 py-2 text-xs font-black uppercase border cursor-pointer ${target === "private" && !toolsOpen ? "bg-orange-600 text-white border-orange-600" : "bg-white border-slate-400"}`}>Private chat</button>
          <button type="button" onClick={() => { setToolsOpen(true); onMode("search"); }} className={`px-3 py-2 text-xs font-black uppercase border cursor-pointer ${toolsOpen ? "bg-orange-600 text-white border-orange-600" : "bg-white border-slate-400"}`}>Search</button>
        </div>
        {toolsOpen && (
          <div className="space-y-2 border-t border-slate-300 pt-2">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onMode("ask")} className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer ${mode === "ask" ? "bg-orange-600 text-white" : "bg-white border-slate-400"}`}>Ask</button>
              <button type="button" onClick={() => onMode("answer")} className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer ${mode === "answer" ? "bg-orange-600 text-white" : "bg-white border-slate-400"}`}>Answer</button>
              <button type="button" onClick={() => onMode("search")} className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer ${mode === "search" ? "bg-orange-600 text-white" : "bg-white border-slate-400"}`}>Search</button>
              <button type="button" onClick={() => onMode("show")} className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer ${mode === "show" ? "bg-orange-600 text-white" : "bg-white border-slate-400"}`}>Show</button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onTarget("all")} className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer ${target === "all" ? "bg-slate-900 text-white" : "bg-white border-slate-400"}`}>All</button>
              <button type="button" onClick={() => onTarget("moniker")} className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer ${target === "moniker" ? "bg-slate-900 text-white" : "bg-white border-slate-400"}`}>Find a name</button>
              <button type="button" onClick={() => onTarget("p2p")} className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer ${target === "p2p" ? "bg-slate-900 text-white" : "bg-white border-slate-400"}`}>Point to Point</button>
              <button type="button" onClick={() => onTarget("private")} className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer ${target === "private" ? "bg-slate-900 text-white" : "bg-white border-slate-400"}`}>Private Chat</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {SHOW_KINDS.map((k) => (
                <button key={k.id} type="button" onClick={() => { onMode("show"); onShowKind(k.id); }} className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer ${showKind === k.id && mode === "show" ? "bg-orange-600 text-white" : "bg-white border-slate-400"}`}>{k.label}</button>
              ))}
            </div>
          </div>
        )}
        <input
          value={target === "moniker" ? moniker : search}
          onChange={(e) => {
            if (target === "moniker") onMoniker(e.target.value);
            else onSearch(e.target.value);
          }}
          placeholder={target === "moniker" ? "Type their name / moniker" : "Search this stall"}
          className="w-full px-3 py-2 text-sm border border-slate-400 bg-white text-slate-900"
        />
        {mode === "show" && !toolsOpen && (
          <div className="flex flex-wrap gap-2">
            {SHOW_KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => onShowKind(k.id)}
                className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer ${
                  showKind === k.id ? "bg-orange-600 text-white border-orange-500" : "bg-white border-slate-400"
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

  return (
    <div className="w-full bg-white border border-slate-300 p-3 space-y-3" id="action-ribbon">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onMode("ask")} className={`px-4 py-2 text-xs font-black uppercase border cursor-pointer ${mode === "ask" ? "bg-orange-600 text-white border-orange-500" : "bg-slate-100 border-slate-300"}`}>Ask</button>
        <button type="button" onClick={() => onMode("answer")} className={`px-4 py-2 text-xs font-black uppercase border cursor-pointer ${mode === "answer" ? "bg-orange-600 text-white border-orange-500" : "bg-slate-100 border-slate-300"}`}>Answer</button>
        <button type="button" onClick={() => onMode("search")} className={`px-4 py-2 text-xs font-black uppercase border cursor-pointer ${mode === "search" ? "bg-orange-600 text-white border-orange-500" : "bg-slate-100 border-slate-300"}`}>Search</button>
        <button type="button" onClick={() => onMode("show")} className={`px-4 py-2 text-xs font-black uppercase border cursor-pointer ${mode === "show" ? "bg-orange-600 text-white border-orange-500" : "bg-slate-100 border-slate-300"}`}>Show</button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <button type="button" onClick={() => onTarget("all")} className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer ${target === "all" ? "bg-slate-900 text-white" : "bg-white border-slate-300"}`}>All</button>
        <button type="button" onClick={() => onTarget("moniker")} className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer ${target === "moniker" ? "bg-slate-900 text-white" : "bg-white border-slate-300"}`}>Find a name</button>
        <button type="button" onClick={() => onTarget("p2p")} className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer ${target === "p2p" ? "bg-slate-900 text-white" : "bg-white border-slate-300"}`}>Point to Point</button>
        <button type="button" onClick={() => onTarget("private")} className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer ${target === "private" ? "bg-slate-900 text-white" : "bg-white border-slate-300"}`}>Private Chat</button>
        {target === "moniker" && (
          <input value={moniker} onChange={(e) => onMoniker(e.target.value)} placeholder="Name / moniker" className="px-3 py-1.5 text-xs border border-slate-300 bg-white text-slate-900" />
        )}
      </div>
      {mode === "search" && (
        <input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Search" className="w-full px-3 py-2 text-sm border border-slate-300 bg-white text-slate-900" />
      )}
      {mode === "show" && (
        <div className="flex flex-wrap gap-2">
          {SHOW_KINDS.map((k) => (
            <button key={k.id} type="button" onClick={() => onShowKind(k.id)} className={`px-3 py-1.5 text-[11px] font-bold border cursor-pointer ${showKind === k.id ? "bg-orange-600 text-white border-orange-500" : "bg-white border-slate-300"}`}>{k.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
