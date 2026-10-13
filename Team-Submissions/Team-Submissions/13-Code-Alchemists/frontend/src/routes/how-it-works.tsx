import { createFileRoute, Link } from "@tanstack/react-router";
import { Process } from "@/components/veritas/Process";
import { PageIntro } from "@/components/veritas/PageIntro";
import { useReveal } from "@/components/veritas/hooks";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({ meta: [
    { title: "How Verification Works — VERITAS" },
    { name: "description", content: "Follow the five-step VERITAS pipeline: isolate a claim, retrieve sources, compare evidence, verify, and explain the reasoning." },
    { property: "og:title", content: "How Verification Works — VERITAS" },
    { property: "og:description", content: "From a single statement to a transparent verdict: the five stages of VERITAS." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  useReveal();
  return <>
    <PageIntro number="02 / The process" title="From claim" accent="to clarity."><p>One statement. Five deliberate steps. A verdict grounded in evidence, with the reasoning left open.</p></PageIntro>
    <div className="mx-auto max-w-[1600px] px-6 py-8 md:px-10"><p className="text-sm leading-relaxed text-muted-foreground">The intended research pipeline · the current prototype simulates these stages using sample evidence; live retrieval and assessment are not connected.</p></div>
    <Process />
    <section className="border-t px-6 py-20 md:px-10"><div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-8 md:flex-row md:items-center"><h2 className="font-serif text-4xl md:text-5xl">Evidence, not a black box.</h2><Button asChild variant="editorial"><Link to="/verify">Verify a claim <span aria-hidden>→</span></Link></Button></div></section>
  </>;
}