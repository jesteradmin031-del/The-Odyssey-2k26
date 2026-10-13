import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { SOURCES, isSampleClaim } from "./data";

const POS = [{ x: 16, y: 18 }, { x: 84, y: 18 }, { x: 16, y: 82 }, { x: 84, y: 82 }];

export type NetworkSource = { name: string; date: string; note: string; label: string; tone: "support" | "destructive" | "muted" };

const TONE = { support: "text-support", destructive: "text-destructive", muted: "text-muted-foreground" } as const;

const SAMPLE: NetworkSource[] = SOURCES.map((s) => ({ name: s.name, date: s.date, note: s.note, label: s.supports ? "PARTIAL SUPPORT" : "CONTRADICTS", tone: s.supports ? "support" : "destructive" }));

export function EvidenceNetwork({ claim, selected, onSelect, sources: given }: { claim: string; selected: number | null; onSelect: (index: number | null) => void; sources?: NetworkSource[] | undefined }) {
  const pinned = useRef<number | null>(null);
  const sources = given ?? (isSampleClaim(claim) ? SAMPLE : []);
  const select = (i: number) => {
    pinned.current = i;
    onSelect(i);
    document.getElementById(`evidence-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <section id="evidence" className="border-t px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid gap-8 md:grid-cols-12">
          <p className="eyebrow reveal md:col-span-3">EVIDENCE NETWORK</p>
          <h2 className="display reveal text-5xl md:col-span-8 md:text-7xl">Every verdict shows <em className="text-primary">its working.</em></h2>
        </div>
        <p className="eyebrow mt-10 text-primary">CLAIM → EVIDENCE → SOURCES</p>
        <div className="network-field relative mt-10 hidden min-h-[580px] md:block">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {sources.map((_, i) => { const p = POS[i]; if (!p) return null; return <path key={i} d={`M50 50 C ${(50 + p.x) / 2} 50, ${(50 + p.x) / 2} ${p.y}, ${p.x} ${p.y}`} vectorEffect="non-scaling-stroke" className={`edge ${selected === i ? "hot" : ""}`} />; })}
          </svg>
          <div className="network-core absolute left-1/2 top-1/2 w-[38%] max-w-sm -translate-x-1/2 -translate-y-1/2">
            <p className="eyebrow text-primary">CLAIM</p><p className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap font-serif text-2xl">{claim}</p>
          </div>
          {sources.slice(0, POS.length).map((s, i) => <Button key={`${s.name}-${i}`} variant="technical" onMouseEnter={() => onSelect(i)} onMouseLeave={() => onSelect(pinned.current)} onFocus={() => onSelect(i)} onBlur={() => onSelect(pinned.current)} onClick={() => select(i)} aria-label={`Highlight evidence from ${s.name}`} aria-pressed={selected === i}
            className={`network-node absolute w-[24%] max-w-64 -translate-x-1/2 -translate-y-1/2 ${selected === i ? "border-primary" : ""} ${selected !== null && selected !== i ? "opacity-50" : ""}`}
            style={{ left: `${POS[i]?.x}%`, top: `${POS[i]?.y}%` }}>
            <span className="eyebrow">SOURCE 0{i + 1} · {s.date}</span><span className="mt-2 text-left text-lg">{s.name}</span><span className={`mt-3 font-mono text-xs ${TONE[s.tone]}`}>{s.label}</span><span className="mt-3 text-left text-sm text-muted-foreground">{s.note}</span>
          </Button>)}
        </div>
        <div className="mt-8 md:hidden">
          <div className="network-core"><p className="eyebrow text-primary">CLAIM</p><p className="mt-3 whitespace-pre-wrap font-serif text-2xl leading-snug">{claim}</p></div>
          {sources.map((s, i) => <div key={`${s.name}-${i}`}><div className="mx-auto h-8 w-px bg-border" /><Button variant="technical" aria-pressed={selected === i} onClick={() => select(i)} className={`network-node w-full ${selected === i ? "border-primary" : ""}`}><span className="eyebrow">EVIDENCE 0{i + 1} / SOURCE</span><span className="mt-2 text-lg">{s.name}</span><span className={`mt-2 font-mono text-xs ${TONE[s.tone]}`}>{s.label}</span></Button></div>)}
        </div>
        {!sources.length && <p className="mt-8 text-lg text-muted-foreground">No evidence or source connections available for this claim.</p>}
      </div>
    </section>
  );
}
