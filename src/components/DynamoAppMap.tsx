import React, { useMemo, useState } from "react";
import { Download, Copy, Check } from "lucide-react";

type Action = "KEEP" | "CUT" | "MOVE" | "RENAME" | "ADD" | "SIMPLIFY";

interface MapNode {
  id: string;
  kind: "page" | "button";
  name: string;
  x: number;
  y: number;
  opens?: string;
  action: Action;
  newName: string;
  notes: string;
}

const INITIAL: MapNode[] = [
  { id: "PG-01", kind: "page", name: "Front Page", x: 40, y: 40, action: "KEEP", newName: "", notes: "" },
  { id: "BTN-MYP", kind: "button", name: "Make Your Point", x: 40, y: 160, opens: "PG-02", action: "KEEP", newName: "", notes: "" },
  { id: "BTN-PTP", kind: "button", name: "Point To Point", x: 220, y: 160, opens: "PG-05", action: "KEEP", newName: "", notes: "" },
  { id: "BTN-PC", kind: "button", name: "Private Chats", x: 400, y: 160, opens: "PG-06", action: "KEEP", newName: "", notes: "" },
  { id: "BTN-PTS", kind: "button", name: "Points", x: 580, y: 160, opens: "PG-03", action: "KEEP", newName: "", notes: "" },
  { id: "PG-02", kind: "page", name: "Make Your Point", x: 40, y: 300, action: "KEEP", newName: "", notes: "" },
  { id: "PG-03", kind: "page", name: "Points", x: 580, y: 300, action: "KEEP", newName: "", notes: "" },
  { id: "PG-04", kind: "page", name: "Open point / replies", x: 580, y: 440, opens: undefined, action: "KEEP", newName: "", notes: "Opened from a Points card" },
  { id: "PG-05", kind: "page", name: "Point To Point", x: 220, y: 300, action: "KEEP", newName: "", notes: "" },
  { id: "PG-06", kind: "page", name: "Private Chats", x: 400, y: 300, action: "KEEP", newName: "", notes: "" },
  { id: "BTN-EDIT", kind: "button", name: "Edit (pencil)", x: 40, y: 440, opens: "PG-02", action: "KEEP", newName: "", notes: "On each point card" },
  { id: "BTN-DEL", kind: "button", name: "Delete (bin)", x: 220, y: 440, action: "KEEP", newName: "", notes: "Author or Admin only" },
  { id: "BTN-BACK", kind: "button", name: "Back", x: 400, y: 440, action: "KEEP", newName: "", notes: "One step only" },
  { id: "BTN-FRONT", kind: "button", name: "Front Page", x: 40, y: 40, opens: "PG-01", action: "KEEP", newName: "", notes: "Floating bar" }
];

export default function DynamoAppMap() {
  const [nodes, setNodes] = useState<MapNode[]>(INITIAL);
  const [selectedId, setSelectedId] = useState<string>("PG-01");
  const [copied, setCopied] = useState(false);

  const selected = nodes.find(n => n.id === selectedId) || nodes[0];

  const wires = useMemo(() => {
    return nodes
      .filter(n => n.opens)
      .map(n => {
        const to = nodes.find(t => t.id === n.opens);
        if (!to) return null;
        return { from: n, to };
      })
      .filter(Boolean) as { from: MapNode; to: MapNode }[];
  }, [nodes]);

  const patch = (partial: Partial<MapNode>) => {
    setNodes(prev => prev.map(n => n.id === selectedId ? { ...n, ...partial } : n));
  };

  const payload = {
    type: "make-your-point-map-amendments",
    updatedAt: new Date().toISOString(),
    amendments: nodes.map(n => ({
      id: n.id,
      kind: n.kind,
      currentName: n.name,
      action: n.action,
      newName: n.newName,
      opens: n.opens || "",
      notes: n.notes
    }))
  };

  const json = JSON.stringify(payload, null, 2);

  const download = () => {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "make-your-point-map-amendments.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="w-full bg-white border border-slate-300 text-slate-900" id="dynamo-app-map">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide">App Map — pages and buttons</h2>
          <p className="text-xs text-slate-600">Dynamo-style graph. Click a node. Set Action. Download JSON and send it back.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={copyJson} className="px-3 py-1.5 text-xs font-bold border border-slate-400 cursor-pointer bg-white">
            {copied ? <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span> : <span className="inline-flex items-center gap-1"><Copy className="w-3 h-3" /> Copy JSON</span>}
          </button>
          <button type="button" onClick={download} className="px-3 py-1.5 text-xs font-bold border border-orange-500 bg-orange-600 text-white cursor-pointer">
            <span className="inline-flex items-center gap-1"><Download className="w-3 h-3" /> Download JSON</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 relative overflow-auto bg-slate-100 min-h-[540px] border-r border-slate-200">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: 760, minHeight: 540 }}>
            {wires.map((w, i) => (
              <line
                key={i}
                x1={w.from.x + 70}
                y1={w.from.y + 28}
                x2={w.to.x + 70}
                y2={w.to.y + 10}
                stroke="#ea580c"
                strokeWidth="2"
              />
            ))}
          </svg>
          <div className="relative" style={{ minWidth: 760, minHeight: 540 }}>
            {nodes.map(n => (
              <button
                key={n.id}
                type="button"
                onClick={() => setSelectedId(n.id)}
                style={{ left: n.x, top: n.y }}
                className={`absolute text-left px-3 py-2 border cursor-pointer shadow-sm ${
                  n.kind === "page"
                    ? "w-40 bg-slate-900 text-white border-slate-700"
                    : "w-40 bg-white text-slate-900 border-orange-400"
                } ${selectedId === n.id ? "ring-2 ring-orange-500" : ""}`}
              >
                <div className="text-[9px] uppercase font-mono opacity-70">{n.id} · {n.kind}</div>
                <div className="text-xs font-black leading-tight">{n.newName || n.name}</div>
                <div className="text-[9px] font-bold mt-1">{n.action}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-3 bg-white">
          <div className="text-[10px] font-black uppercase text-slate-500">Selected node</div>
          <div className="text-sm font-black">{selected.id} — {selected.name}</div>
          <label className="block text-xs font-bold">Action
            <select
              value={selected.action}
              onChange={(e) => patch({ action: e.target.value as Action })}
              className="mt-1 w-full border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option>KEEP</option>
              <option>CUT</option>
              <option>MOVE</option>
              <option>RENAME</option>
              <option>SIMPLIFY</option>
              <option>ADD</option>
            </select>
          </label>
          <label className="block text-xs font-bold">New name
            <input
              value={selected.newName}
              onChange={(e) => patch({ newName: e.target.value })}
              className="mt-1 w-full border border-slate-300 px-2 py-1.5 text-sm"
              placeholder="Leave blank to keep current name"
            />
          </label>
          <label className="block text-xs font-bold">Notes for build
            <textarea
              value={selected.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              rows={5}
              className="mt-1 w-full border border-slate-300 px-2 py-1.5 text-sm"
              placeholder="What should this node do?"
            />
          </label>
          <p className="text-[11px] text-slate-500">Send the downloaded JSON in chat. I implement ACTION + notes only.</p>
        </div>
      </div>
    </div>
  );
}
