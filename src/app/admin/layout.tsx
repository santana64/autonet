import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FOUNDER_EMAIL } from "@/actions/lead";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || user.email !== FOUNDER_EMAIL) redirect("/");
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafb", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ background: "#0a0f1a", padding: "14px 28px", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ color: "white", fontWeight: 700, fontSize: 14, letterSpacing: "-0.02em" }}>AutoNet Admin</span>
        <a href="/admin/prospecting" style={{ color: "#94a3b8", fontSize: 13, textDecoration: "none" }}>Prospection</a>
      </header>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>{children}</main>
    </div>
  );
}
