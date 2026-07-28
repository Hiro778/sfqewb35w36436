import React from "react";
import { Truck, ShieldCheck, MessageCircle } from "lucide-react";

export default function USPSection() {
  return (
    <section className="border-y border-white/5 bg-zinc-900/40">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 divide-x divide-white/5">
        {[
          { icon: Truck, title: "Ship nationwide", sub: "Seluruh Indonesia" },
          { icon: ShieldCheck, title: "Quality first", sub: "Kurasi ketat" },
          { icon: MessageCircle, title: "Personal support", sub: "WhatsApp langsung" },
        ].map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.title} className="flex items-center gap-4 px-6 py-6">
              <div className="w-10 h-10 rounded-full bg-brand-200/10 text-brand-200 grid place-items-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{it.title}</p>
                <p className="text-xs text-zinc-500">{it.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
