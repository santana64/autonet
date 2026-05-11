import Link from "next/link";
import {
  BarChart3,
  CalendarClock,
  CreditCard,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Settings,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LEGAL_DISCLAIMER } from "@/domain/rules/default-rules";

const navItems = [
  { href: "/app", label: "Cash", icon: LayoutDashboard },
  { href: "/app/entries", label: "Encaissements", icon: WalletCards },
  { href: "/app/simulateur", label: "Décisions", icon: BarChart3 },
  { href: "/app/previsions", label: "Prévisions", icon: TrendingUp },
  { href: "/app/reserve", label: "Réserve", icon: PiggyBank },
  { href: "/app/seuils", label: "Seuils", icon: Gauge },
  { href: "/app/reminders", label: "Rappels", icon: CalendarClock },
  { href: "/app/documents", label: "Documents", icon: FileText },
  { href: "/app/settings", label: "Réglages", icon: Settings },
  { href: "/app/billing", label: "Offre", icon: CreditCard },
];

export function AppShell({ children, userEmail }: { children: React.ReactNode; userEmail: string }) {
  return (
    <div className="min-h-screen bg-[#f8fafd] text-[#061b31]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[#d8dfe8] bg-white lg:flex lg:flex-col">
        <div className="border-b border-[#d8dfe8] p-5">
          <Link href="/app" className="flex items-center gap-3 text-lg font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#0c8c5e] text-sm text-white shadow-[0_8px_18px_rgba(12,140,94,0.18)]">
              AN
            </span>
            <span>AutoNet</span>
          </Link>
          <p className="mt-1 text-sm font-medium text-[#50617a]">Le cockpit financier de l'indépendant.</p>
          <p className="mt-3 truncate rounded-[6px] border border-[#d8dfe8] bg-[#f8fafd] px-3 py-2 text-xs text-[#50617a]">
            {userEmail}
          </p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className="flex items-center gap-3 rounded-[6px] px-3 py-2 text-sm font-medium text-[#50617a] transition hover:bg-[#eef4f8] hover:text-[#061b31]"
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden className="h-4 w-4 text-[#64748d]" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[#d8dfe8] p-3">
          <Link
            className="mb-2 block rounded-[6px] bg-[#eef4f8] px-3 py-2 text-xs leading-5 text-[#50617a] hover:text-[#061b31]"
            href="/app/account"
          >
            Compte, sécurité et export RGPD
          </Link>
          <form action={logoutAction}>
            <Button className="w-full" type="submit" variant="ghost">
              <LogOut aria-hidden className="h-4 w-4" />
              Déconnexion
            </Button>
          </form>
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-[#d8dfe8] bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="font-bold text-[#061b31]">AutoNet</div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <Link
                className="whitespace-nowrap rounded-[6px] bg-[#eef4f8] px-3 py-2 text-xs font-medium text-[#50617a]"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs leading-5 text-[#64748d] sm:px-6 lg:px-8">
          {LEGAL_DISCLAIMER}
        </footer>
      </div>
    </div>
  );
}
