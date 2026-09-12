import React from "react";
import { X, HelpCircle } from "lucide-react";
import { PAGE_HELP, HelpPageKey } from "../help/pageHelp";

export default function PageHelpPanel({
  pageKey,
  open,
  onClose
}: {
  pageKey: HelpPageKey;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  const help = PAGE_HELP[pageKey];
  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/40 flex items-start justify-center p-4 pt-16" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white border border-slate-300 shadow-xl text-slate-900"
        onClick={(e) => e.stopPropagation()}
        id="page-help-panel"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-orange-50">
          <h2 className="text-sm font-black uppercase tracking-wide flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-orange-600" />
            Help — {help.title}
          </h2>
          <button type="button" onClick={onClose} className="p-1 cursor-pointer" title="Close help">
            <X className="w-4 h-4" />
          </button>
        </div>
        <ul className="p-4 space-y-2 text-sm leading-relaxed">
          {help.body.map((line, i) => (
            <li key={i} className="pl-3 border-l-2 border-orange-400">{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
