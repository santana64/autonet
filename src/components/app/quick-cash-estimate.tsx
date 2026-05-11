"use client";

import { useMemo, useState } from "react";
import { ActivityCategory } from "@/domain/activity";
import { calculateEntryCashBreakdown } from "@/domain/cashflow/cashflow";
import { formatMoney } from "@/domain/formatting/format";
import { getRulesForYear } from "@/domain/rules/default-rules";

export function QuickCashEstimate({
  defaultCategory = "SERVICE_BNC",
  taxWithholdingEnabled = false,
  bufferRate = 0.05,
}: {
  defaultCategory?: ActivityCategory;
  taxWithholdingEnabled?: boolean;
  bufferRate?: number;
}) {
  const [amount, setAmount] = useState("3000");
  const [activityCategory, setActivityCategory] = useState<ActivityCategory>(defaultCategory);
  const breakdown = useMemo(
    () =>
      calculateEntryCashBreakdown(
        {
          grossAmountCents: Math.round(Number(String(amount).replace(",", ".")) * 100) || 0,
          activityCategory,
          status: "COLLECTED",
        },
        getRulesForYear(2026),
        { taxWithholdingEnabled, conservativeReserveBufferRate: bufferRate }
      ),
    [activityCategory, amount, bufferRate, taxWithholdingEnabled]
  );

  return (
    <div className="rounded-[8px] border border-[#d8dfe8] bg-[#f8fafd] p-4">
      <p className="text-sm font-semibold text-[#061b31]">Estimation instantanée</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium">
          Montant encaissé
          <input
            className="mt-1 w-full rounded-[6px] border border-[#d8dfe8] px-3 py-2"
            min="0"
            onChange={(event) => setAmount(event.target.value)}
            step="0.01"
            type="number"
            value={amount}
          />
        </label>
        <label className="text-sm font-medium">
          Activité
          <select
            className="mt-1 w-full rounded-[6px] border border-[#d8dfe8] px-3 py-2"
            onChange={(event) => setActivityCategory(event.target.value as ActivityCategory)}
            value={activityCategory}
          >
            <option value="SERVICE_BNC">Services BNC</option>
            <option value="SERVICE_BIC">Services BIC</option>
            <option value="GOODS_SALES">Vente</option>
            <option value="LIBERAL_GENERAL">Libéral général</option>
          </select>
        </label>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div>
          <p className="text-xs text-[#64748d]">Cotisations + formation</p>
          <p className="font-semibold">{formatMoney(breakdown.socialContributionEstimateCents + breakdown.trainingContributionEstimateCents)}</p>
        </div>
        <div>
          <p className="text-xs text-[#64748d]">Réserve recommandée</p>
          <p className="font-semibold">{formatMoney(breakdown.recommendedReserveCents)}</p>
        </div>
        <div>
          <p className="text-xs text-[#64748d]">Disponible estimé</p>
          <p className="font-semibold text-[#0c8c5e]">{formatMoney(breakdown.estimatedAvailableCents)}</p>
        </div>
      </div>
    </div>
  );
}
