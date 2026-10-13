import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { PageIntro } from "@/components/veritas/PageIntro";
import { EvidenceNetwork } from "@/components/veritas/EvidenceNetwork";
import { EXAMPLE_CLAIM, SOURCES } from "@/components/veritas/data";
import { useReveal } from "@/components/veritas/hooks";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/evidence")({
  head: () => ({ meta: [
    { title: "Evidence & Sources — VERITAS" },
    { name: "description", content: "Explore illustrative VERITAS source records and their relationships to a sample claim through a linked evidence list and interactive network." },
    { property: "og:title", content: "Evidence & Sources — VERITAS" },
    { property: "og:description", content: "Trace the record from claim to source comparison and verdict in the VERITAS evidence explorer." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: EvidencePage,
});

function EvidencePage() {
  useReveal();
  const [selected, setSelected] = useState<number | null>(null);
  const pinned = useRef<number | null>(null);
  return <>
    <PageIntro number="03 / Evidence & sources" title="Follow" accent="the evidence."><p>A source is a starting point, not a verdict. Relevant findings are compared for what they support, what they contradict, and what context they leave out.</p></PageIntro>
    <section className="border-b px-6 py-12 md:px-10"><div className="mx-auto max-w-[1600px]"><h2 className="eyebrow text-primary">FROM CLAIM TO VERDICT</h2><ol className="mt-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">{["Claim", "Retrieved sources", "Relevant evidence", "Source comparison", "Verdict"].map((stage, i) => <li key={stage} className="flex items-center gap-5 lg:flex-1"><div><span className="eyebrow text-primary">0{i + 1}</span><p className="mt-2 text-base">{stage}</p></div>{i < 4 && <><ArrowRight className="ml-auto hidden size-4 shrink-0 text-primary lg:block" aria-hidden /><ArrowDown className="ml-auto size-4 text-primary lg:hidden" aria-hidden /></>}</li>)}</ol></div></section>
    <section className="px-6 py-16 md:px-10 md:py-24"><div className="mx-auto max-w-[1600px]"><p className="eyebrow text-primary">SAMPLE INVESTIGATION / LOCAL DEMONSTRATION</p><h2 className="mt-6 max-w-4xl font-serif text-3xl leading-snug md:text-5xl">{EXAMPLE_CLAIM}</h2><div className="mt-8 flex flex-wrap items-center gap-5"><span className="font-mono text-lg text-violet">MISLEADING</span><span className="font-mono text-sm text-muted-foreground">87% · illustrative confidence</span></div><p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">The sample record points to lower lifetime emissions for electric vehicles in most settings. Battery production and coal-dependent electricity can reduce that advantage, but do not establish the claim as a general rule.</p><p className="mt-5 text-sm text-muted-foreground">Mock source records · descriptive titles, not verified citations. No live retrieval or assessment has run.</p>
    <div className="mt-12 flex items-center justify-between gap-5"><h3 className="eyebrow text-primary">RELEVANT EVIDENCE / 04</h3>{selected !== null && <Button variant="link" className="h-auto p-0 text-sm" onClick={() => { pinned.current = null; setSelected(null); }}>Clear selection</Button>}</div>
    <div className="mt-6">{SOURCES.map((source, i) => <article key={source.name} id={`evidence-${i}`} className={`evidence-item ${selected === i ? "selected" : ""}`} onMouseEnter={() => setSelected(i)} onMouseLeave={() => setSelected(pinned.current)}><div className="flex flex-col justify-between gap-5 md:flex-row"><div><p className="eyebrow">SOURCE / 0{i + 1}</p><Button variant="link" className="mt-2 h-auto whitespace-normal p-0 text-left text-xl text-foreground" aria-pressed={selected === i} onFocus={() => setSelected(i)} onBlur={() => setSelected(pinned.current)} onClick={() => { pinned.current = i; setSelected(i); }}>{source.name}</Button></div><p className={`font-mono text-sm ${source.supports ? "text-support" : "text-destructive"}`}>{source.supports ? "PARTIALLY SUPPORTS CLAIM" : "CONTRADICTS CLAIM"}</p></div><div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto_auto]"><div><p className="eyebrow">TITLE</p><h4 className="mt-2 font-serif text-3xl leading-snug">{source.title}</h4></div><div><p className="eyebrow">DATE</p><p className="mt-2">{source.date}</p></div><div><p className="eyebrow">RELEVANCE</p><p className="mt-2 font-mono text-sm text-primary">{source.relevance.toUpperCase()}</p></div></div><p className="eyebrow mt-6">SHORT SUMMARY</p><p className="mt-2 max-w-3xl text-lg leading-relaxed text-muted-foreground">{source.note}</p></article>)}</div>
    </div></section>
    <EvidenceNetwork claim={EXAMPLE_CLAIM} selected={selected} onSelect={setSelected} />
  </>;
}