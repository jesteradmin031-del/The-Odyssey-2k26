import { useEffect, useRef, useState } from "react";
import { STAGES } from "./data";
import { PipelineVisual } from "./PipelineVisual";

export function Process() {
  const wrap = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    const f = () => {
      const el = wrap.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
       setP(total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0);
    };
    f(); window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  const active = Math.min(STAGES.length - 1, Math.floor(p * STAGES.length));

  return (
    <section id="how" className="border-t">
      {/* Desktop: pinned horizontal */}
      <div ref={wrap} className="relative hidden md:block" style={{ height: `${STAGES.length * 90}vh` }}>
        <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
          <div className="mx-auto mb-12 flex w-full max-w-[1600px] items-end justify-between px-10">
            <p className="eyebrow">How it works — {STAGES[active]?.n} / 05</p>
            <div className="flex gap-2">
              {STAGES.map((s, i) => <span key={s.n} className={`h-px w-12 transition-colors duration-700 ${i <= active ? "bg-primary" : "bg-border"}`} />)}
            </div>
          </div>
          <div className="flex gap-[8vw] pl-10 transition-transform duration-[900ms] ease-out" style={{ transform: `translateX(calc(${-p * (STAGES.length - 1)} * (55vw + 8vw)))` }}>
            {STAGES.map((s, i) => (
              <article key={s.n} className="w-[55vw] shrink-0 transition-opacity duration-700" style={{ opacity: i === active ? 1 : 0.18 }}>
                <span className="font-mono text-sm text-primary">{s.n}</span>
                <h2 className="display section-heading mt-4 uppercase">{s.t}</h2>
                <p className="mt-8 max-w-md text-lg text-muted-foreground">{s.d}</p>
                <PipelineVisual step={i} />
              </article>
            ))}
          </div>
        </div>
      </div>
      {/* Mobile: vertical */}
      <div className="space-y-20 px-6 py-24 md:hidden">
        <p className="eyebrow">How it works</p>
        {STAGES.map((s, i) => (
          <article key={s.n} className="reveal border-t pt-6">
            <span className="font-mono text-sm text-primary">{s.n}</span>
            <h2 className="display mt-2 text-6xl uppercase">{s.t}</h2>
            <p className="mt-4 text-muted-foreground">{s.d}</p>
            <PipelineVisual step={i} />
          </article>
        ))}
      </div>
    </section>
  );
}
