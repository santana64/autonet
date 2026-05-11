import { AppShell } from "@/components/app/app-shell";
import { requireUserOrRedirect, ensureUserDefaults } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserOrRedirect();
  await ensureUserDefaults(user.id);
  return <AppShell userEmail={user.email}>{children}</AppShell>;
}
