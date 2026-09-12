import React from "react";
import { Flame } from "lucide-react";

export function openFuelLink() {
  let link = "";
  try {
    link = localStorage.getItem("paypal_me_link") || "";
  } catch {}
  if (link) {
    const url = link.startsWith("http") ? link : `https://paypal.me/${link.replace(/^@/, "")}`;
    window.open(url, "_blank");
    return;
  }
  window.alert("Set your PayPal link in Admin first.");
}

export default function FuelButton({
  id,
  className = "px-3 py-1.5 text-[10px] font-black uppercase tracking-wide bg-amber-500 text-slate-950 border border-amber-400 cursor-pointer"
}: {
  id?: string;
  className?: string;
}) {
  return (
    <button type="button" onClick={openFuelLink} className={className} id={id} title="Fuel — support this page" data-help="Fuel — open the support / PayPal link set in Admin.">
      <Flame className="w-3.5 h-3.5 inline mr-1" />
      Fuel
    </button>
  );
}
