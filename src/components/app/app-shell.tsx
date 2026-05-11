import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";
import { MobileNavLinks, NavLinks } from "@/components/app/nav-links";
import { LEGAL_DISCLAIMER } from "@/domain/rules/default-rules";

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export function AppShell({ children, userEmail }: { children: React.ReactNode; userEmail: string }) {
  return (
    <div className="min-h-screen bg-[#f8fafb] text-[#0a0f1a]">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-[220px] flex-col border-r border-[#e2e8f0] bg-white lg:flex">
        {/* Logo */}
        <div className="border-b border-[#e2e8f0] px-4 py-[14px]">
          <Link className="flex items-center gap-2.5" href="/app">
            <LogoMark size={30} />
            <span className="text-[14px] font-bold tracking-[-0.02em] text-[#0a0f1a]">AutoNet</span>
          </Link>
        </div>

        {/* Nav */}
        <NavLinks />

        {/* Footer */}
        <div className="border-t border-[#e2e8f0] px-3 py-3">
          <Link
            className="mb-1.5 flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 transition-colors hover:bg-[#f1f5f9]"
            href="/app/account"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ecfdf5] text-[10px] font-bold text-[#0c8c5e]">
              {initials(userEmail)}
            </span>
            <span className="min-w-0 flex-1 truncate text-[12px] text-[#64748b]">{userEmail}</span>
          </Link>
          <form action={logoutAction}>
            <Button className="w-full text-[12px]" type="submit" variant="ghost">
              <LogOut aria-hidden className="h-3.5 w-3.5" />
              Déconnexion
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-[220px]">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-10 border-b border-[#e2e8f0] bg-white/95 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link className="flex items-center gap-2 font-bold tracking-[-0.02em] text-[#0a0f1a]" href="/app">
              <LogoMark size={26} />
              AutoNet
            </Link>
            <Link
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ecfdf5] text-[10px] font-bold text-[#0c8c5e]"
              href="/app/account"
            >
              {initials(userEmail)}
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>

        <footer className="mx-auto max-w-7xl px-4 pb-24 text-[11px] leading-5 text-[#94a3b8] sm:px-6 lg:pb-8 lg:px-8">
          {LEGAL_DISCLAIMER}
        </footer>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e2e8f0] bg-white/95 backdrop-blur-md lg:hidden">
        <MobileNavLinks />
      </div>
    </div>
  );
}
