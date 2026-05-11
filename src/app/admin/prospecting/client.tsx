"use client";

import { useActionState, useState, useTransition } from "react";
import {
  importProspectsAction,
  addProspectAction,
  deleteProspectAction,
  unsubscribeProspectAction,
  markRepliedAction,
  markConvertedAction,
  startSequenceAction,
  searchSireneAction,
} from "@/actions/prospect";
import type { Prospect } from "@prisma/client";

type Stats = { total: number; new: number; contacted: number; replied: number; converted: number; unsubscribed: number };

const STATUS_LABEL: Record<string, string> = {
  new: "À enrichir",
  contacted: "En séquence",
  replied: "A répondu",
  converted: "Converti",
  unsubscribed: "Désabonné",
};
const STATUS_COLOR: Record<string, string> = {
  new: "#64748b", contacted: "#0c8c5e", replied: "#2563eb", converted: "#7c3aed", unsubscribed: "#dc2626",
};

export function ProspectingClient({ prospects, stats }: { prospects: Prospect[]; stats: Stats }) {
  const [tab, setTab] = useState<"pipeline" | "add" | "import" | "sirene" | "reponses" | "linkedin">("pipeline");
  const [filter, setFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const filtered = filter === "all" ? prospects : prospects.filter((p) => p.status === filter);
  const convRate = stats.total > 0 ? ((stats.converted / stats.total) * 100).toFixed(1) : "0";
  const replyRate = stats.contacted > 0 ? (((stats.replied + stats.converted) / stats.contacted) * 100).toFixed(1) : "0";

  function action(fn: (id: string) => Promise<void>, id: string) {
    startTransition(async () => { await fn(id); window.location.reload(); });
  }

  const TABS = [
    { id: "pipeline", label: "Pipeline" },
    { id: "add", label: "+ Ajouter" },
    { id: "import", label: "Import CSV" },
    { id: "sirene", label: "SIRENE" },
    { id: "reponses", label: "Réponses" },
    { id: "linkedin", label: "LinkedIn" },
  ] as const;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#0a0f1a", letterSpacing: "-0.02em" }}>
          Prospection outbound
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
          Séquence 5 emails • IA personnalisée • SIRENE auto-discovery
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Total", value: stats.total, color: "#0a0f1a" },
          { label: "À enrichir", value: stats.new, color: "#64748b" },
          { label: "En séquence", value: stats.contacted, color: "#0c8c5e" },
          { label: "Réponses", value: stats.replied, color: "#2563eb" },
          { label: "Convertis", value: stats.converted, color: "#7c3aed" },
          { label: "Taux réponse", value: `${replyRate}%`, color: "#2563eb" },
          { label: "Conversion", value: `${convRate}%`, color: "#7c3aed" },
        ].map((s) => (
          <div key={s.label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Funnel bar */}
      {stats.total > 0 && (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
          <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Funnel de conversion
          </p>
          <div style={{ display: "flex", gap: 3, height: 8, borderRadius: 4, overflow: "hidden" }}>
            {[
              { v: stats.new, c: "#e2e8f0" },
              { v: stats.contacted, c: "#0c8c5e" },
              { v: stats.replied, c: "#2563eb" },
              { v: stats.converted, c: "#7c3aed" },
            ].map((s, i) => s.v > 0 && (
              <div key={i} style={{ flex: s.v, background: s.c, minWidth: 4, borderRadius: 2 }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
            {[
              { label: "À enrichir", v: stats.new, c: "#e2e8f0", tc: "#64748b" },
              { label: "Séquence", v: stats.contacted, c: "#0c8c5e", tc: "#0c8c5e" },
              { label: "Répondu", v: stats.replied, c: "#2563eb", tc: "#2563eb" },
              { label: "Converti", v: stats.converted, c: "#7c3aed", tc: "#7c3aed" },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.c }} />
                <span style={{ fontSize: 12, color: s.tc, fontWeight: 600 }}>{s.v} {s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, background: "#f1f5f9", padding: 4, borderRadius: 9999, width: "fit-content", flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "6px 14px", fontSize: 13, fontWeight: 600, borderRadius: 9999, border: "none", cursor: "pointer",
            background: tab === t.id ? "white" : "transparent",
            color: tab === t.id ? "#0a0f1a" : "#64748b",
            boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "pipeline" && (
        <PipelineTab filtered={filtered} filter={filter} setFilter={setFilter} isPending={isPending} action={action} />
      )}
      {tab === "add" && <AddForm />}
      {tab === "import" && <ImportForm />}
      {tab === "sirene" && <SireneSearch />}
      {tab === "reponses" && <ReplyTemplates />}
      {tab === "linkedin" && <LinkedInTemplates />}
    </div>
  );
}

function PipelineTab({
  filtered, filter, setFilter, isPending, action,
}: {
  filtered: Prospect[];
  filter: string;
  setFilter: (f: string) => void;
  isPending: boolean;
  action: (fn: (id: string) => Promise<void>, id: string) => void;
}) {
  const STEP_LABEL = ["—", "Email 1 ✓", "Email 2 ✓", "Email 3 ✓", "Email 4 ✓", "Email 5 ✓"];
  const isPending_ = (email: string) => email.includes("@pending.local");

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {["all", "new", "contacted", "replied", "converted", "unsubscribed"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "4px 14px", fontSize: 12, fontWeight: 600, borderRadius: 9999,
            border: "1px solid", borderColor: filter === f ? "#0c8c5e" : "#e2e8f0",
            background: filter === f ? "#ecfdf5" : "white",
            color: filter === f ? "#0c8c5e" : "#64748b", cursor: "pointer",
          }}>
            {f === "all" ? "Tous" : STATUS_LABEL[f] ?? f}
          </button>
        ))}
        <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: "auto" }}>{filtered.length} prospect(s)</span>
      </div>

      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafb", borderBottom: "1px solid #e2e8f0" }}>
              {["Nom / Email", "Ville", "Activité", "Séquence", "Statut", "Actions"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: 32, color: "#94a3b8", textAlign: "center" }}>Aucun prospect dans cette catégorie</td></tr>
            )}
            {filtered.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ fontWeight: 600, color: "#0a0f1a", fontSize: 13 }}>
                    {[p.firstName, p.lastName].filter(Boolean).join(" ") || "—"}
                  </div>
                  {!isPending_(p.email) && (
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{p.email}</div>
                  )}
                  {isPending_(p.email) && (
                    <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 2, fontWeight: 600 }}>⚠ Email à trouver</div>
                  )}
                </td>
                <td style={{ padding: "10px 14px", color: "#64748b" }}>{p.city ?? "—"}</td>
                <td style={{ padding: "10px 14px", color: "#64748b", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.activity ?? "—"}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ background: p.outboundStep > 0 ? "#ecfdf5" : "#f1f5f9", color: p.outboundStep > 0 ? "#0c8c5e" : "#94a3b8", borderRadius: 9999, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                    {STEP_LABEL[p.outboundStep] ?? `Email ${p.outboundStep}`}
                  </span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span style={{ color: STATUS_COLOR[p.status] ?? "#64748b", fontWeight: 600, fontSize: 12 }}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {p.status === "new" && !isPending_(p.email) && (
                      <Btn onClick={() => action(startSequenceAction, p.id)} color="#0c8c5e" disabled={isPending}>Démarrer</Btn>
                    )}
                    {p.status === "contacted" && (
                      <Btn onClick={() => action(markRepliedAction, p.id)} color="#2563eb" disabled={isPending}>A répondu</Btn>
                    )}
                    {(p.status === "contacted" || p.status === "replied") && (
                      <Btn onClick={() => action(markConvertedAction, p.id)} color="#7c3aed" disabled={isPending}>Converti ✓</Btn>
                    )}
                    {p.status !== "unsubscribed" && (
                      <Btn onClick={() => action(unsubscribeProspectAction, p.id)} color="#94a3b8" disabled={isPending}>Stop</Btn>
                    )}
                    <Btn onClick={() => action(deleteProspectAction, p.id)} color="#dc2626" disabled={isPending}>✕</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Btn({ onClick, color, children, disabled }: { onClick: () => void; color: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "3px 10px", fontSize: 11, fontWeight: 600, borderRadius: 9999, border: "none", cursor: "pointer",
      background: color + "18", color, opacity: disabled ? 0.5 : 1,
    }}>{children}</button>
  );
}

function Toggle({ name, label, defaultChecked = true }: { name: string; label: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked);
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
      <input type="hidden" name={name} value={on ? "1" : "0"} />
      <div
        onClick={() => setOn(!on)}
        style={{
          width: 36, height: 20, borderRadius: 10, background: on ? "#0c8c5e" : "#e2e8f0",
          position: "relative", transition: "background 0.2s", flexShrink: 0,
        }}
      >
        <div style={{
          position: "absolute", top: 2, left: on ? 18 : 2, width: 16, height: 16,
          background: "white", borderRadius: 8, transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }} />
      </div>
      <span style={{ fontSize: 13, color: "#0a0f1a" }}>{label}</span>
    </label>
  );
}

function AddForm() {
  const [state, action, pending] = useActionState(addProspectAction, null);
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 24, maxWidth: 500 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>Ajouter un prospect</h2>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "#94a3b8" }}>L'email 1 est personnalisé par IA selon l'activité et la ville.</p>
      {state?.ok && <p style={{ color: "#0c8c5e", marginBottom: 16, fontSize: 13 }}>Prospect ajouté et séquence démarrée.</p>}
      {state?.error && <p style={{ color: "#dc2626", marginBottom: 16, fontSize: 13 }}>{state.error}</p>}
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field name="email" label="Email *" placeholder="contact@exemple.fr" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field name="firstName" label="Prénom" placeholder="Marie" />
          <Field name="lastName" label="Nom" placeholder="Dupont" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field name="city" label="Ville" placeholder="Lyon" />
          <Field name="activity" label="Activité" placeholder="Développeuse web" />
        </div>
        <Field name="notes" label="Notes" placeholder="Trouvé via LinkedIn..." />
        <div style={{ paddingTop: 4 }}>
          <Toggle name="autoStart" label="Envoyer l'email 1 immédiatement (IA)" defaultChecked={true} />
        </div>
        <button type="submit" disabled={pending} style={{
          marginTop: 8, padding: "10px 20px", background: "#0c8c5e", color: "white", border: "none",
          borderRadius: 9999, fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          {pending ? "Ajout en cours..." : "Ajouter"}
        </button>
      </form>
    </div>
  );
}

function Field({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>{label}</label>
      <input name={name} placeholder={placeholder} style={{
        width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8,
        fontSize: 13, color: "#0a0f1a", boxSizing: "border-box", outline: "none",
      }} />
    </div>
  );
}

function ImportForm() {
  const [state, action, pending] = useActionState(importProspectsAction, null);
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 24, maxWidth: 640 }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>Importer via CSV</h2>
      <p style={{ margin: "0 0 6px", fontSize: 13, color: "#64748b" }}>
        Format : <code style={{ background: "#f1f5f9", padding: "1px 6px", borderRadius: 4, fontSize: 12 }}>email,prenom,nom,ville,activite</code>
      </p>
      <p style={{ margin: "0 0 20px", fontSize: 12, color: "#94a3b8" }}>
        Avec "Auto-démarrer" activé, l'email 1 est personnalisé par IA et envoyé à chaque prospect importé.
      </p>
      {state?.ok && (
        <div style={{ background: "#ecfdf5", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: "#064e3b", fontWeight: 600 }}>
            {state.imported} importés • {state.started} séquences démarrées • {state.skipped} ignorés
          </p>
        </div>
      )}
      {state?.error && <p style={{ color: "#dc2626", marginBottom: 16, fontSize: 13 }}>{state.error}</p>}
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <textarea
          name="csv" rows={10}
          placeholder={"email,prenom,nom,ville,activite\nmarie@exemple.fr,Marie,Dupont,Lyon,Développeuse web\npierre@mail.fr,Pierre,,Paris,Consultant RH"}
          style={{ padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontFamily: "monospace", resize: "vertical", color: "#0a0f1a" }}
        />
        <Toggle name="autoStart" label="Auto-démarrer la séquence (email 1 IA envoyé immédiatement)" defaultChecked={true} />
        <button type="submit" disabled={pending} style={{
          padding: "10px 20px", background: "#0c8c5e", color: "white", border: "none",
          borderRadius: 9999, fontSize: 13, fontWeight: 600, cursor: "pointer", width: "fit-content",
        }}>
          {pending ? "Import en cours..." : "Importer"}
        </button>
      </form>
    </div>
  );
}

type SireneRow = { siret: string; name: string; activity: string; city: string; registeredAt: string };

function SireneSearch() {
  const [state, action, pending] = useActionState(searchSireneAction, { results: [] as SireneRow[] });
  return (
    <div>
      <div style={{ background: "#ecfdf5", border: "1px solid #bbf7d0", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#064e3b", lineHeight: 1.6 }}>
          <strong>Workflow :</strong> Cherche un type de freelance → note les noms → cherche-les sur LinkedIn → copie leur email → ajoute dans "Ajouter" avec auto-start. Le cron SIRENE ajoute aussi des prospects automatiquement chaque nuit.
        </p>
      </div>
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 24, maxWidth: 640, marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Rechercher des AEs sur SIRENE</h2>
        <form action={action} style={{ display: "flex", gap: 10 }}>
          <input name="q" placeholder="développeur web Paris, graphiste Lyon, consultant RH..." style={{
            flex: 1, padding: "9px 14px", border: "1px solid #e2e8f0", borderRadius: 9999, fontSize: 13, outline: "none",
          }} />
          <button type="submit" disabled={pending} style={{
            padding: "9px 20px", background: "#0a0f1a", color: "white", border: "none",
            borderRadius: 9999, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            {pending ? "..." : "Rechercher"}
          </button>
        </form>
      </div>

      {state.results.length > 0 && (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafb", borderBottom: "1px solid #e2e8f0" }}>
                {["Nom", "Activité", "Ville", "Inscription"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.results.map((r: SireneRow, i: number) => (
                <tr key={r.siret} style={{ borderBottom: i < state.results.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: "#0a0f1a" }}>{r.name}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>{r.activity}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>{r.city}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>
                    {r.registeredAt ? new Date(r.registeredAt).toLocaleDateString("fr-FR") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "10px 16px", background: "#f8fafb", borderTop: "1px solid #e2e8f0" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
              Note : SIRENE ne contient pas les emails. Cherche ces noms sur LinkedIn pour trouver leur contact.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ReplyTemplates() {
  const templates = [
    {
      title: "Ils demandent comment ça marche",
      subject: "Re: comment ça marche ?",
      text: `Bonjour [Prénom],

AutoNet fonctionne en 3 étapes :

1. Tu saisis chaque encaissement (client, montant, activité)
2. AutoNet calcule automatiquement : cotisations URSSAF, VFL impôt, disponible réel
3. Tu vois en temps réel combien tu peux te verser ce mois-ci sans stress

C'est accessible depuis n'importe quel appareil, et les taux sont mis à jour automatiquement chaque année.

Tu veux que je te crée un accès direct pour tester ? C'est gratuit, aucune CB.

[Ton prénom]`,
    },
    {
      title: "Ils disent qu'ils sont déjà sur un autre outil",
      subject: "Re: déjà équipé",
      text: `Bonjour [Prénom],

Pas de souci du tout !

La seule chose que je te suggère : vérifier que ton outil actuel prend bien en compte les taux 2026 mis à jour en janvier, et qu'il calcule la réserve URSSAF par trimestre (et non à la fin de l'année).

Si c'est le cas, tu n'as rien à changer.

Si jamais tu veux une deuxième opinion sur tes calculs, le calculateur AutoNet est gratuit et ne demande aucun compte : [URL calculateur]

Bonne continuation !
[Ton prénom]`,
    },
    {
      title: "Ils demandent le prix",
      subject: "Re: tarifs AutoNet",
      text: `Bonjour [Prénom],

Voilà les tarifs actuels :

• Gratuit : calculateur + 10 encaissements/mois
• Solo à 9 €/mois : encaissements illimités, export docs, radar TVA
• Lifetime bêta à 79 € une fois : tout Solo à vie + toutes les futures fonctionnalités

La plupart commencent par le plan gratuit pour tester, puis passent à Solo si ça leur convient.

Tu veux que je t'envoie un lien d'accès direct ?

[Ton prénom]`,
    },
    {
      title: "Ils ne répondent plus (relance douce)",
      subject: "Juste une question",
      text: `Bonjour [Prénom],

Je voulais juste savoir si mon email précédent t'avait bien atteint.

Si AutoNet ne correspond pas à ce que tu cherches, dis-le moi — pas de souci du tout, je te retire de ma liste.

Si tu veux encore un coup d'œil, voilà le lien : [URL register]

[Ton prénom]`,
    },
  ];

  const [copied, setCopied] = useState<number | null>(null);

  function copy(text: string, i: number) {
    navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <div style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16, marginBottom: 24 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
          Quand un prospect répond, clique <strong>"A répondu"</strong> dans le pipeline puis envoie manuellement un de ces templates depuis ton email. Le ton humain + personnalisé convertit 3× mieux qu'un message auto.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {templates.map((t, i) => (
          <div key={i} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 12 }}>
              <div>
                <h3 style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#0a0f1a" }}>{t.title}</h3>
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>Objet : {t.subject}</p>
              </div>
              <button onClick={() => copy(t.text, i)} style={{
                padding: "5px 14px", fontSize: 12, fontWeight: 600, borderRadius: 9999, flexShrink: 0,
                border: "1px solid #e2e8f0", background: copied === i ? "#ecfdf5" : "white",
                color: copied === i ? "#0c8c5e" : "#64748b", cursor: "pointer",
              }}>
                {copied === i ? "Copié ✓" : "Copier"}
              </button>
            </div>
            <pre style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
              {t.text}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinkedInTemplates() {
  const templates = [
    {
      title: "Demande de connexion (300 car.)",
      note: "Personnalise la 1ère ligne selon leur profil",
      text: `Bonjour [Prénom],

J'ai vu que tu es [activité] en freelance. J'ai créé AutoNet, un outil qui calcule exactement ce que tu peux te verser après chaque encaissement (URSSAF déduit, en temps réel).

Gratuit à tester. Si ça t'intéresse je t'envoie le lien.`,
    },
    {
      title: "Message après acceptation",
      note: "Envoyer dans les 24h après acceptation",
      text: `Merci pour la connexion [Prénom] !

Voilà le lien pour tester le calculateur AutoNet : https://autonet-psi.vercel.app/calculateur

Tu saisis un montant fictif et tu vois en 30 secondes combien tu peux vraiment te verser. Aucun compte requis pour tester.

Si tu as des questions n'hésite pas — je réponds vite.`,
    },
    {
      title: "Relance J+5 (pas de réponse)",
      note: "Si pas de réponse au message précédent",
      text: `[Prénom], juste pour savoir si tu avais eu le temps de jeter un œil à AutoNet.

Si ce n'est pas le bon moment ou pas pour toi, dis-le moi — pas de souci du tout !`,
    },
    {
      title: "Suivi si intéressé",
      note: "Si le prospect clique ou répond positivement",
      text: `Super [Prénom] !

Pour aller plus loin tu peux créer un compte gratuit ici (aucune CB) : https://autonet-psi.vercel.app/register

Et si tu veux qu'on regarde ensemble comment AutoNet s'adapte à ton activité, réponds-moi ici — je peux te faire une démo rapide par message.`,
    },
  ];

  const [copied, setCopied] = useState<number | null>(null);
  function copy(text: string, i: number) {
    navigator.clipboard.writeText(text);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <div style={{ background: "#ecfdf5", border: "1px solid #bbf7d0", borderRadius: 10, padding: 16, marginBottom: 24 }}>
        <p style={{ margin: "0 0 8px", fontSize: 13, color: "#064e3b", fontWeight: 700 }}>Setup Waalaxy en 5 min</p>
        <p style={{ margin: 0, fontSize: 13, color: "#064e3b", lineHeight: 1.6 }}>
          1. Crée une campagne "LinkedIn Visite + Message"<br />
          2. Source : recherche LinkedIn "auto-entrepreneur" + ton secteur cible<br />
          3. Étape 1 : Demande de connexion (message 1)<br />
          4. Étape 2 (délai 1j) : Message après acceptation<br />
          5. Étape 3 (délai 5j) : Relance si pas de réponse<br />
          6. Ceux qui répondent → récupère l'email → ajoute dans AutoNet avec auto-start
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {templates.map((t, i) => (
          <div key={i} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 12 }}>
              <div>
                <h3 style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#0a0f1a" }}>{t.title}</h3>
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>{t.note}</p>
              </div>
              <button onClick={() => copy(t.text, i)} style={{
                padding: "5px 14px", fontSize: 12, fontWeight: 600, borderRadius: 9999, flexShrink: 0,
                border: "1px solid #e2e8f0", background: copied === i ? "#ecfdf5" : "white",
                color: copied === i ? "#0c8c5e" : "#64748b", cursor: "pointer",
              }}>
                {copied === i ? "Copié ✓" : "Copier"}
              </button>
            </div>
            <pre style={{ margin: 0, fontSize: 12, color: "#64748b", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
              {t.text}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
