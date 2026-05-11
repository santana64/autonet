"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarClock,
  CreditCard,
  FileText,
  Gauge,
  LayoutDashboard,
  PiggyBank,
  Settings,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Cockpit",
    items: [
      { href: "/app", label: "Cash", icon: LayoutDashboard, exact: true },
      { href: "/app/entries", label: "Encaissements", icon: WalletCards },
      { href: "/app/reserve", label: "Réserve", icon: PiggyBank },
    ],
  },
  {
    label: "Analyse",
    items: [
      { href: "/app/simulateur", label: "Décisions", icon: BarChart3 },
      { href: "/app/previsions", label: "Prévisions", icon: TrendingUp },
      { href: "/app/seuils", label: "Seuils", icon: Gauge },
    ],
  },
  {
    label: "Suivi",
    items: [
      { href: "/app/reminders", label: "Rappels", icon: CalendarClock },
      { href: "/app/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    label: "Compte",
    items: [
      { href: "/app/settings", label: "Réglages", icon: Settings },
      { href: "/app/billing", label: "Offre", icon: CreditCard },
    ],
  },
];

export const mobileItems = [
  { href: "/app", label: "Cash", icon: LayoutDashboard, exact: true },
  { href: "/app/entries", label: "Encaissements", icon: WalletCards },
  { href: "/app/simulateur", label: "Décisions", icon: BarChart3 },
  { href: "/app/reserve", label: "Réserve", icon: PiggyBank },
  { href: "/app/seuils", label: "Seuils", icon: Gauge },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname.startsWith(href);
}

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto py-3">
      {groups.map((group) => (
        <div className="mb-4" key={group.label}>
          <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#64748d]">
            {group.label}
          </p>
          <div className="space-y-0.5 px-2">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  className={cn(
                    "flex items-center gap-3 rounded-[6px] px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[#eef4f8] text-[#061b31]"
                      : "text-[#50617a] hover:bg-[#f4f7fb] hover:text-[#061b31]"
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon
                    aria-hidden
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      active ? "text-[#0c8c5e]" : "text-[#8898aa]"
                    )}
                  />
                  <span className="flex-1">{item.label}</span>
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0c8c5e]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function MobileNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-around">
      {mobileItems.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link
            className="flex flex-col items-center gap-1 px-3 py-2"
            href={item.href}
            key={item.href}
          >
            <Icon
              aria-hidden
              className={cn(
                "h-5 w-5 transition-colors",
                active ? "text-[#0c8c5e]" : "text-[#8898aa]"
              )}
            />
            <span
              className={cn(
                "text-[10px] font-medium transition-colors",
                active ? "text-[#0c8c5e]" : "text-[#8898aa]"
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
