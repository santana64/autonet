import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <Link className="font-bold" href="/">
            AutoNet
          </Link>
          <nav className="flex gap-4 text-sm text-slate-600">
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/conditions-generales">CGU/CGV</Link>
            <Link href="/cookies">Cookies</Link>
          </nav>
        </div>
      </header>
      <article className="prose prose-slate mx-auto max-w-4xl px-4 py-10">{children}</article>
    </main>
  );
}
