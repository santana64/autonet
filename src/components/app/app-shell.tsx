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
    <div className="min-h-screen bg-[#f8fafd] text-[#061b31]">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-[#d8dfe8] bg-white lg:flex">
        {/* Logo */}
        <div className="border-b border-[#d8dfe8] px-4 py-4">
          <Link className="flex items-center gap-2.5" href="/app">
            <LogoMark size={32} />
            <span className="text-[15px] font-bold tracking-tight text-[#061b31]">AutoNet</span>
          </Link>
          <p className="mt-2 text-xs font-medium text-[#64748d]">Le cockpit financier de l'indépendant.</p>
        </div>

        {/* Nav */}
        <NavLinks />

        {/* Footer */}
        <div className="border-t border-[#d8dfe8] px-3 py-3">
          {/* User avatar */}
          <Link
            className="mb-2 flex items-center gap-3 rounded-[6px] px-3 py-2 transition-colors hover:bg-[#f4f7fb]"
            href="/app/account"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eef4f8] text-[10px] font-bold text-[#0c8c5e]">
              {initials(userEmail)}
            </span>
            <span className="min-w-0 flex-1 truncate text-xs text-[#50617a]">{userEmail}</span>
          </Link>
          <form action={logoutAction}>
            <Button className="w-full" type="submit" variant="ghost">
              <LogOut aria-hidden className="h-4 w-4" />
              Déconnexion
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-10 border-b border-[#d8dfe8] bg-white/95 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link className="flex items-center gap-2 font-bold text-[#061b31]" href="/app">
              <LogoMark size={28} />
              AutoNet
            </Link>
            <Link
              className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef4f8] text-[10px] font-bold text-[#0c8c5e]"
              href="/app/account"
            >
              {initials(userEmail)}
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>

        <footer className="mx-auto max-w-7xl px-4 pb-24 text-xs leading-5 text-[#64748d] sm:px-6 lg:pb-8 lg:px-8">
          {LEGAL_DISCLAIMER}
        </footer>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#d8dfe8] bg-white/95 backdrop-blur lg:hidden">
        <MobileNavLinks />
      </div>
    </div>
  );
}
