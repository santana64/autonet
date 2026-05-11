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
    <nav className="flex-1 overflow-y-auto py-4">
      {groups.map((group) => (
        <div className="mb-5" key={group.label}>
          <p className="mb-1.5 px-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#94a3b8]">
            {group.label}
          </p>
          <div className="space-y-0.5 px-2">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  className={cn(
                    "flex items-center gap-2.5 rounded-[7px] px-2.5 py-[7px] text-[13px] font-medium transition-colors",
                    active
                      ? "bg-[#ecfdf5] text-[#0a0f1a]"
                      : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0a0f1a]"
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon
                    aria-hidden
                    className={cn(
                      "h-[15px] w-[15px] shrink-0",
                      active ? "text-[#0c8c5e]" : "text-[#94a3b8]"
                    )}
                  />
                  <span className="flex-1 tracking-[-0.01em]">{item.label}</span>
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
    <nav className="flex items-center justify-around px-2">
      {mobileItems.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link
            className="flex flex-col items-center gap-1 px-3 py-2.5"
            href={item.href}
            key={item.href}
          >
            <Icon
              aria-hidden
              className={cn("h-5 w-5 transition-colors", active ? "text-[#0c8c5e]" : "text-[#94a3b8]")}
            />
            <span
              className={cn(
                "text-[10px] font-medium tracking-[-0.01em] transition-colors",
                active ? "text-[#0c8c5e]" : "text-[#94a3b8]"
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
