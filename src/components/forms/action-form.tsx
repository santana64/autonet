"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/actions/auth";
import { Button } from "@/components/ui/button";

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

export function ActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Enregistrement...",
  className,
}: {
  action: Action;
  children: React.ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className={className ?? "space-y-4"}>
      {children}
      {state.error ? (
        <p className="rounded-[6px] border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state.message ? (
        <p className="rounded-[6px] border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {state.message}
        </p>
      ) : null}
      <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
    </form>
  );
}

export function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? pendingLabel : label}
    </Button>
  );
}
