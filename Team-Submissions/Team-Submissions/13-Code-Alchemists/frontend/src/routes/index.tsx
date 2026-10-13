import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { HeroScene } from "@/components/veritas/HeroScene";
import { useMagnetic, useReveal } from "@/components/veritas/hooks";
import { BackgroundAtmosphere } from "@/components/veritas/BackgroundAtmosphere";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VERITAS — The truth deserves evidence" },
      { name: "description", content: "Discover VERITAS, a cinematic hackathon prototype exploring transparent claim verification, source comparison, and evidence-backed understanding." },
      { property: "og:title", content: "VERITAS — The truth deserves evidence" },
      { property: "og:description", content: "Evidence before assumption. Explore the VERITAS claim-verification prototype." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Lines({ lines, className = "" }: { lines: string[]; className?: string }) {
  return (
    <span className={className} data-reveal>
      {lines.map((l, i) => (
        <span key={i} className="line-mask"><span style={{ transitionDelay: `${i * 0.12}s` }}>{l}</span></span>
      ))}
    </span>
  );
}

function Index() {
  useReveal();
  const cta = useMagnetic<HTMLAnchorElement>();
  const cta2 = useMagnetic<HTMLAnchorElement>();
  const para = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const f = () => { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; if (para.current) para.current.style.transform = `translateY(${window.scrollY * 0.25}px)`; };
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  return (
    <div id="top">
        {/* Hero */}
        <section id="product" className="relative flex min-h-[92svh] items-end overflow-hidden px-6 pb-16 pt-32 md:px-10">
          <BackgroundAtmosphere variant="hero" />
          <div ref={para} className="absolute inset-0"><HeroScene /></div>
          <div className="relative mx-auto w-full max-w-[1600px]">
            <p className="eyebrow reveal mb-8">Information verification · Est. 2026</p>
            <h1 className="display hero-heading uppercase">
              <Lines lines={["The truth", "deserves"]} />
              <Lines lines={["evidence."]} className="block italic text-primary" />
            </h1>
            <div className="reveal mt-12 flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
              <p className="max-w-sm text-lg text-muted-foreground">VERITAS transforms information into evidence-backed understanding.</p>
              <div className="flex flex-wrap gap-4">
                <Button asChild variant="editorial"><Link ref={cta} to="/verify">Verify a claim →</Link></Button>
                <Button asChild variant="technical" className="btn btn-ghost h-auto"><Link to="/how-it-works">Explore how it works</Link></Button>
              </div>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="relative overflow-hidden border-t px-6 py-32 md:px-10 md:py-48">
          <BackgroundAtmosphere variant="archive" />
          <div className="relative mx-auto grid max-w-[1600px] gap-16 md:grid-cols-12">
            <p className="eyebrow reveal md:col-span-2">The problem</p>
            <h2 className="display section-heading uppercase md:col-span-10">
              <Lines lines={["Information", "moves fast."]} />
              <Lines lines={["Truth needs time."]} className="block italic text-muted-foreground" />
            </h2>
            <div className="reveal md:col-span-4 md:col-start-8">
              <p className="font-serif text-3xl leading-snug">Information is everywhere. Evidence is harder to find.</p>
              <p className="mt-6 text-muted-foreground">A claim can circle the world in an afternoon. Checking it properly — reading the study, finding the dataset, weighing the counter-evidence — takes hours most people don't have. VERITAS does the slow work, and shows you all of it.</p>
            </div>
            <div className="reveal grid grid-cols-3 gap-6 border-t pt-8 md:col-span-6 md:col-start-2 md:row-start-3">
              {[["6×", "faster spread of false claims"], ["40+", "sources weighed per claim"], ["100%", "of reasoning visible"]].map(([n, l]) => (
                <div key={l}><p className="display text-5xl md:text-6xl">{n}</p><p className="mt-2 text-xs text-muted-foreground">{l}</p></div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t px-6 py-24 md:px-10 md:py-32">
          <BackgroundAtmosphere variant="archive" />
          <div className="relative mx-auto max-w-[1600px]">
            <p className="eyebrow reveal text-primary">The VERITAS experience</p>
            <div className="mt-12 grid gap-10 md:grid-cols-3">
              {[
                { number: "01", title: "Investigate a claim.", copy: "Text, URLs, and images. Start with a question, then follow the reasoning.", to: "/verify", label: "Verify a claim" },
                { number: "02", title: "Understand the process.", copy: "Five deliberate steps from a statement to a transparent explanation.", to: "/how-it-works", label: "How it works" },
                { number: "03", title: "Explore the record.", copy: "Trace agreement, contradiction, and context through the sample source network.", to: "/evidence", label: "Evidence & sources" },
              ].map((item) => <article key={item.number} className="reveal border-t pt-6"><p className="eyebrow text-primary">{item.number}</p><h2 className="mt-5 font-serif text-4xl">{item.title}</h2><p className="mt-5 max-w-sm leading-relaxed text-muted-foreground">{item.copy}</p><Button asChild variant="link" className="mt-7 h-auto whitespace-normal p-0 text-left"><Link to={item.to as "/verify" | "/how-it-works" | "/evidence"}>{item.label} →</Link></Button></article>)}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="about" className="relative overflow-hidden border-t px-6 py-40 text-center md:px-10">
          <BackgroundAtmosphere variant="archive" />
          <div className="absolute inset-0 opacity-60"><HeroScene variant="cta" /></div>
          <div className="relative">
            <h2 className="display section-heading uppercase">
              <Lines lines={["Be curious."]} />
              <Lines lines={["Then verify."]} className="block italic text-primary" />
            </h2>
            <Button asChild variant="editorial" className="reveal mt-14"><Link ref={cta2} to="/verify">Start verifying →</Link></Button>
          </div>
        </section>
    </div>
  );
}
