import Link from "next/link";
import { LogoMark } from "@/components/ui/logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f8fafb] text-[#0a0f1a]">
      <header className="border-b border-[#e2e8f0] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3.5">
          <Link className="flex items-center gap-2.5 text-[14px] font-bold tracking-[-0.02em] text-[#0a0f1a]" href="/">
            <LogoMark size={28} />
            AutoNet
          </Link>
          <nav className="flex gap-1 text-[13px]">
            <Link className="rounded-full px-3 py-1.5 text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0a0f1a]" href="/confidentialite">Confidentialité</Link>
            <Link className="rounded-full px-3 py-1.5 text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0a0f1a]" href="/conditions-generales">CGU</Link>
            <Link className="rounded-full px-3 py-1.5 text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0a0f1a]" href="/mentions-legales">Mentions légales</Link>
          </nav>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-5 py-12">
        <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h1:text-[28px] prose-h2:text-[18px] prose-p:text-[14px] prose-p:leading-relaxed prose-p:text-[#64748b]">
          {children}
        </div>
      </article>
    </main>
  );
}
