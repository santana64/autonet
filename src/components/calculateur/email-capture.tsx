"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { captureLeadAction, type LeadState } from "@/actions/lead";

const initial: LeadState = {};

export function EmailCapture() {
  const [state, action, pending] = useActionState(captureLeadAction, initial);

  if (state.ok) {
    return (
      <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 p-5 text-center">
        <p className="text-[14px] font-semibold text-emerald-800">Guide envoyé !</p>
        <p className="mt-1 text-[13px] text-emerald-700">
          Vérifie ta boîte mail — taux 2026, règle d'or et accès gratuit à l'app.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border border-[#e2e8f0] bg-[#0a0f1a] p-5">
      <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-[#4ade80]">
        <Mail aria-hidden className="h-3.5 w-3.5" />
        Guide gratuit
      </div>
      <p className="mt-2 text-[15px] font-bold text-white">
        Reçois les taux 2026 par email
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-white/50">
        Taux URSSAF par activité + règle d'or pour ne jamais manquer une déclaration.
      </p>
      <form action={action} className="mt-4 flex gap-2">
        <input
          className="h-9 flex-1 rounded-full border border-white/15 bg-white/8 px-4 text-[13px] text-white placeholder-white/30 outline-none focus:border-[#0c8c5e]/60 focus:ring-2 focus:ring-[#0c8c5e]/20"
          disabled={pending}
          name="email"
          placeholder="ton@email.fr"
          required
          type="email"
        />
        <button
          className="h-9 shrink-0 rounded-full bg-[#0c8c5e] px-5 text-[13px] font-semibold text-white transition hover:bg-[#0a7a52] disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "…" : "Envoyer"}
        </button>
      </form>
      {state.error && (
        <p className="mt-2 text-[12px] text-red-400">{state.error}</p>
      )}
    </div>
  );
}
