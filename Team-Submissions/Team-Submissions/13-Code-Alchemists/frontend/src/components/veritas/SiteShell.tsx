import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BackgroundAtmosphere } from "./BackgroundAtmosphere";
import { Nav, NAV_LINKS } from "./Nav";

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="veritas-page overflow-x-clip">
      <BackgroundAtmosphere />
      <div className="grain" aria-hidden />
      <Nav />
      <main id="main-content" key={pathname} className="page-transition">{children}</main>
      <footer className="border-t px-6 py-14 md:px-10">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div><Link to="/" className="font-serif text-4xl">VERITAS</Link><p className="mt-2 font-serif text-lg italic text-muted-foreground">Evidence before assumption.</p></div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-8">
            {NAV_LINKS.map(({ label, to }) => <Link key={to} to={to} className="eyebrow link-u text-foreground" activeOptions={{ exact: true }} activeProps={{ className: "text-primary" }}>{label}</Link>)}
          </nav>
          <p className="eyebrow">© 2026 Veritas · Prototype</p>
        </div>
      </footer>
    </div>
  );
}