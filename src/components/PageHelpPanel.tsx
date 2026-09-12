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
        className="w-full max-w-lg bg-white border border-slate-300 shadow-xl text-slate-900 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        id="page-help-panel"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-orange-50 sticky top-0">
          <h2 className="text-sm font-black uppercase tracking-wide flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-orange-600" />
            {help.title}
          </h2>
          <button type="button" onClick={onClose} className="p-1 cursor-pointer" title="Close help">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3 text-sm leading-relaxed">
          {help.how.map((line, i) => (
            <p key={i} className="font-semibold text-slate-800">{line}</p>
          ))}
          <ol className="list-decimal pl-5 space-y-2">
            {help.steps.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
