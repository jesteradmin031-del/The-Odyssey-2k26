import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link, useRouterState } from "@tanstack/react-router";

export const NAV_LINKS = [
  { label: "Product", to: "/" },
  { label: "How it works", to: "/how-it-works" },
  { label: "Evidence", to: "/evidence" },
  { label: "About", to: "/about" },
] as const;

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 30);
    f(); window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  return (
    <header className={`nav fixed inset-x-0 top-0 z-50 ${scrolled || open ? "scrolled" : ""}`}>
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-5 md:px-10">
        <Link to="/" aria-label="VERITAS home" className="font-serif text-2xl">VERITAS</Link>
        <nav aria-label="Main navigation" className="hidden gap-10 md:flex">
          {NAV_LINKS.map(({ label, to }) => <Link key={to} to={to} activeOptions={{ exact: true }} activeProps={{ className: "nav-active" }} className="eyebrow link-u text-foreground">{label}</Link>)}
        </nav>
        <Button asChild variant="technical" className="hidden h-auto py-2.5 font-mono text-xs uppercase md:inline-flex"><Link to="/verify" activeProps={{ className: "border-primary" }}>Verify a claim <span aria-hidden>→</span></Link></Button>
        <Button variant="ghost" className="eyebrow text-foreground md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-navigation">
          {open ? "Close" : "Menu"}
        </Button>
      </div>
      {open && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="flex flex-col gap-6 px-6 pb-10 pt-4 md:hidden">
          {[...NAV_LINKS, { label: "Verify a claim", to: "/verify" as const }].map(({ label, to }) => (
            <Link key={to} to={to} activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }} onClick={() => setOpen(false)} className="font-serif text-4xl">{label}</Link>
          ))}
        </nav>
      )}
    </header>
  );
}
