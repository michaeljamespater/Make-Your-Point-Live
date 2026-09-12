import React, { useEffect, useState } from "react";

export default function HoverHelp() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const textFrom = (el: HTMLElement | null): string => {
      if (!el) return "";
      return (
        el.getAttribute("data-help") ||
        el.getAttribute("title") ||
        el.getAttribute("aria-label") ||
        ""
      );
    };

    const onMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) {
        setTip(null);
        return;
      }
      const host = target.closest("button, a, input, textarea, select, [data-help], [title]") as HTMLElement | null;
      const text = textFrom(host);
      if (!text) {
        setTip(null);
        return;
      }
      setTip({ text, x: e.clientX + 14, y: e.clientY + 16 });
    };

    const onLeave = () => setTip(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseout", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseout", onLeave);
    };
  }, []);

  if (!tip) return null;
  return (
    <div
      className="fixed z-[200] max-w-xs pointer-events-none bg-slate-900 text-white text-xs px-3 py-2 border border-slate-700 shadow-xl"
      style={{ left: tip.x, top: tip.y }}
      id="hover-help-popup"
    >
      {tip.text}
    </div>
  );
}
