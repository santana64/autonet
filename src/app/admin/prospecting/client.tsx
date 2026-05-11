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
  new: "Nouveau",
  contacted: "Contacté",
  replied: "A répondu",
  converted: "Converti",
  unsubscribed: "Désabonné",
};

const STATUS_COLOR: Record<string, string> = {
  new: "#64748b",
  contacted: "#0c8c5e",
  replied: "#2563eb",
  converted: "#7c3aed",
  unsubscribed: "#dc2626",
};

export function ProspectingClient({ prospects, stats }: { prospects: Prospect[]; stats: Stats }) {
  const [tab, setTab] = useState<"pipeline" | "import" | "add" | "sirene" | "linkedin">("pipeline");
  const [filter, setFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  const filtered = filter === "all" ? prospects : prospects.filter((p) => p.status === filter);

  function action(fn: (id: string) => Promise<void>, id: string) {
    startTransition(async () => { await fn(id); window.location.reload(); });
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        {[
          { label: "Total", value: stats.total, color: "#0a0f1a" },
          { label: "Nouveaux", value: stats.new, color: "#64748b" },
          { label: "Contactés", value: stats.contacted, color: "#0c8c5e" },
          { label: "Réponses", value: stats.replied, color: "#2563eb" },
          { label: "Convertis", value: stats.converted, color: "#7c3aed" },
        ].map((s) => (
          <div key={s.label} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 20px", minWidth: 110 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f1f5f9", padding: 4, borderRadius: 9999, width: "fit-content" }}>
        {(["pipeline", "add", "import", "sirene", "linkedin"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "6px 16px", fontSize: 13, fontWeight: 600, borderRadius: 9999, border: "none", cursor: "pointer",
              background: tab === t ? "white" : "transparent",
              color: tab === t ? "#0a0f1a" : "#64748b",
              boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {{ pipeline: "Pipeline", add: "Ajouter", import: "Import CSV", sirene: "SIRENE", linkedin: "LinkedIn" }[t]}
          </button>
        ))}
      </div>

      {/* Pipeline tab */}
      {tab === "pipeline" && (
        <div>
          {/* Filter */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {["all", "new", "contacted", "replied", "converted", "unsubscribed"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "4px 14px", fontSize: 12, fontWeight: 600, borderRadius: 9999, border: "1px solid",
                borderColor: filter === f ? "#0c8c5e" : "#e2e8f0",
                background: filter === f ? "#ecfdf5" : "white",
                color: filter === f ? "#0c8c5e" : "#64748b",
                cursor: "pointer",
              }}>
                {f === "all" ? "Tous" : STATUS_LABEL[f]}
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafb", borderBottom: "1px solid #e2e8f0" }}>
                  {["Email", "Prénom", "Ville", "Activité", "Étape", "Statut", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 24, color: "#94a3b8", textAlign: "center" }}>Aucun prospect</td></tr>
                )}
                {filtered.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <td style={{ padding: "10px 14px", color: "#0a0f1a", fontWeight: 500 }}>{p.email}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{p.firstName ?? "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b" }}>{p.city ?? "—"}</td>
                    <td style={{ padding: "10px 14px", color: "#64748b", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.activity ?? "—"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ background: "#f1f5f9", color: "#64748b", borderRadius: 9999, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
                        Email {p.outboundStep}/3
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ color: STATUS_COLOR[p.status] ?? "#64748b", fontWeight: 600, fontSize: 12 }}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {p.status === "new" && (
                          <ActionBtn onClick={() => action(startSequenceAction, p.id)} color="#0c8c5e" disabled={isPending}>
                            Envoyer email 1
                          </ActionBtn>
                        )}
                        {p.status === "contacted" && (
                          <ActionBtn onClick={() => action(markRepliedAction, p.id)} color="#2563eb" disabled={isPending}>
                            A répondu
                          </ActionBtn>
                        )}
                        {(p.status === "contacted" || p.status === "replied") && (
                          <ActionBtn onClick={() => action(markConvertedAction, p.id)} color="#7c3aed" disabled={isPending}>
                            Converti
                          </ActionBtn>
                        )}
                        {p.status !== "unsubscribed" && (
                          <ActionBtn onClick={() => action(unsubscribeProspectAction, p.id)} color="#94a3b8" disabled={isPending}>
                            Stop
                          </ActionBtn>
                        )}
                        <ActionBtn onClick={() => action(deleteProspectAction, p.id)} color="#dc2626" disabled={isPending}>
                          ✕
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add tab */}
      {tab === "add" && <AddForm />}

      {/* Import CSV tab */}
      {tab === "import" && <ImportForm />}

      {/* SIRENE tab */}
      {tab === "sirene" && <SireneSearch />}

      {/* LinkedIn tab */}
      {tab === "linkedin" && <LinkedInTemplates />}
    </div>
  );
}

function ActionBtn({ onClick, color, children, disabled }: { onClick: () => void; color: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "3px 10px", fontSize: 11, fontWeight: 600, borderRadius: 9999, border: "none", cursor: "pointer",
      background: color + "15", color, opacity: disabled ? 0.5 : 1,
    }}>
      {children}
    </button>
  );
}

function AddForm() {
  const [state, action, pending] = useActionState(addProspectAction, null);
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 24, maxWidth: 480 }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>Ajouter un prospect</h2>
      {state?.ok && <p style={{ color: "#0c8c5e", marginBottom: 16, fontSize: 13 }}>Prospect ajouté.</p>}
      {state?.error && <p style={{ color: "#dc2626", marginBottom: 16, fontSize: 13 }}>{state.error}</p>}
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field name="email" label="Email *" placeholder="contact@exemple.fr" />
        <Field name="firstName" label="Prénom" placeholder="Marie" />
        <Field name="lastName" label="Nom" placeholder="Dupont" />
        <Field name="city" label="Ville" placeholder="Lyon" />
        <Field name="activity" label="Activité" placeholder="Développeur web freelance" />
        <Field name="notes" label="Notes" placeholder="Trouvé via LinkedIn..." />
        <button type="submit" disabled={pending} style={{
          marginTop: 8, padding: "10px 20px", background: "#0c8c5e", color: "white", border: "none",
          borderRadius: 9999, fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          {pending ? "Ajout..." : "Ajouter"}
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
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 24, maxWidth: 600 }}>
      <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>Importer via CSV</h2>
      <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
        Format : <code style={{ background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 }}>email,prenom,nom,ville,activite</code>
        <br />La première ligne (en-tête) est ignorée.
      </p>
      {state?.ok && (
        <p style={{ color: "#0c8c5e", marginBottom: 16, fontSize: 13 }}>
          {state.imported} importés, {state.skipped} ignorés.
        </p>
      )}
      {state?.error && <p style={{ color: "#dc2626", marginBottom: 16, fontSize: 13 }}>{state.error}</p>}
      <form action={action} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <textarea name="csv" rows={12} placeholder={"email,prenom,nom,ville,activite\nmarie@exemple.fr,Marie,Dupont,Lyon,Développeuse web\npierre@mail.fr,Pierre,,Paris,Consultant"}
          style={{ padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontFamily: "monospace", resize: "vertical", color: "#0a0f1a" }}
        />
        <button type="submit" disabled={pending} style={{
          padding: "10px 20px", background: "#0c8c5e", color: "white", border: "none",
          borderRadius: 9999, fontSize: 13, fontWeight: 600, cursor: "pointer", width: "fit-content",
        }}>
          {pending ? "Import..." : "Importer"}
        </button>
      </form>
    </div>
  );
}

type SireneResult = { siret: string; name: string; activity: string; city: string; registeredAt: string };

function SireneSearch() {
  const [state, action, pending] = useActionState(searchSireneAction, { results: [] as SireneResult[] });
  return (
    <div>
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 24, maxWidth: 600, marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>Rechercher sur SIRENE</h2>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b" }}>
          Trouve des auto-entrepreneurs par activité ou ville. Les emails ne sont pas dans SIRENE — à enrichir via LinkedIn.
        </p>
        <form action={action} style={{ display: "flex", gap: 10 }}>
          <input name="q" placeholder="développeur web Paris, graphiste Lyon..." style={{
            flex: 1, padding: "9px 14px", border: "1px solid #e2e8f0", borderRadius: 9999,
            fontSize: 13, outline: "none",
          }} />
          <button type="submit" disabled={pending} style={{
            padding: "9px 20px", background: "#0a0f1a", color: "white", border: "none",
            borderRadius: 9999, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
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
                {["Nom", "Activité (NAF)", "Ville", "Inscription", "SIRET"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.results.map((r: SireneResult, i: number) => (
                <tr key={r.siret} style={{ borderBottom: i < state.results.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 500, color: "#0a0f1a" }}>{r.name}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>{r.activity}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>{r.city}</td>
                  <td style={{ padding: "10px 14px", color: "#64748b" }}>{r.registeredAt ? new Date(r.registeredAt).toLocaleDateString("fr-FR") : "—"}</td>
                  <td style={{ padding: "10px 14px", color: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}>{r.siret}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "12px 16px", background: "#f8fafb", borderTop: "1px solid #e2e8f0" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
              Copie les noms → cherche sur LinkedIn → ajoute l'email via "Ajouter un prospect"
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function LinkedInTemplates() {
  const templates = [
    {
      title: "Message de connexion (300 car. max)",
      text: `Bonjour [Prénom],

Je vois que tu es auto-entrepreneur. J'ai créé AutoNet, un outil qui calcule exactement ce que tu peux te verser après chaque encaissement (URSSAF déduit, en temps réel).

Gratuit à tester — pas de CB. Si ça t'intéresse je t'envoie le lien.`,
    },
    {
      title: "Message de suivi (après acceptation)",
      text: `Merci pour la connexion [Prénom] !

Voilà le lien pour tester AutoNet : https://autonet-psi.vercel.app/calculateur

Tu saisis un encaissement fictif et tu vois en 30 secondes combien tu peux vraiment te verser. Si tu as des questions n'hésite pas.`,
    },
    {
      title: "Message relance (J+5 sans réponse)",
      text: `[Prénom], je voulais juste savoir si tu avais eu le temps de jeter un œil à AutoNet.

Si ce n'est pas le bon moment ou que ce n'est pas pour toi, dis-le moi — pas de souci du tout !`,
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
        <p style={{ margin: 0, fontSize: 13, color: "#064e3b", lineHeight: 1.6 }}>
          <strong>Setup Waalaxy :</strong> Crée une campagne "LinkedIn + Email", importe tes prospects SIRENE (cherche sur LinkedIn par nom), et colle ces messages dans les étapes Waalaxy. L'outil envoie automatiquement dans les délais que tu configures.
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {templates.map((t, i) => (
          <div key={i} style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0a0f1a" }}>{t.title}</h3>
              <button onClick={() => copy(t.text, i)} style={{
                padding: "4px 14px", fontSize: 12, fontWeight: 600, borderRadius: 9999,
                border: "1px solid #e2e8f0", background: copied === i ? "#ecfdf5" : "white",
                color: copied === i ? "#0c8c5e" : "#64748b", cursor: "pointer",
              }}>
                {copied === i ? "Copié ✓" : "Copier"}
              </button>
            </div>
            <pre style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
              {t.text}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
