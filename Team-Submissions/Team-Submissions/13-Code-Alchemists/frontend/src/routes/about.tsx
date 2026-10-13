import { createFileRoute, Link } from "@tanstack/react-router";
import { PageIntro } from "@/components/veritas/PageIntro";
import { BackgroundAtmosphere } from "@/components/veritas/BackgroundAtmosphere";
import { useReveal } from "@/components/veritas/hooks";
import { Button } from "@/components/ui/button";
import { UserRound } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About VERITAS — Mission & Team" },
    { name: "description", content: "VERITAS is a hackathon project built to make evidence easier to find, understand, and trust. Meet the project roles and explore our mission." },
    { property: "og:title", content: "About VERITAS — Mission & Team" },
    { property: "og:description", content: "Evidence before assumption. The purpose, mission, and team behind the VERITAS prototype." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AboutPage,
});

function AboutPage() {
  useReveal();
  return <>
    <PageIntro number="04 / About VERITAS" title="Evidence before" accent="assumption."><p>VERITAS explores a simple idea: understanding a claim should start with its evidence, not its popularity.</p></PageIntro>
    <section className="px-6 py-20 md:px-10 md:py-28"><div className="mx-auto grid max-w-[1600px] gap-10 md:grid-cols-12"><h2 className="eyebrow reveal text-primary md:col-span-3">ABOUT VERITAS</h2><div className="reveal max-w-3xl md:col-span-8"><p className="font-serif text-3xl leading-snug md:text-4xl">A clearer way to question what we read, see, and share.</p><p className="mt-6 text-lg leading-relaxed text-muted-foreground">Built as a hackathon prototype, VERITAS brings the claim, verdict, explanation, and sources into one readable experience. Its evidence network makes agreement and contradiction visible without hiding the record behind a score.</p><p className="mt-5 text-lg leading-relaxed text-muted-foreground">Today, verification is a local demonstration with illustrative evidence. Connecting live research is the next step; unsupported claims remain unverified.</p></div></div></section>
    <section className="relative overflow-hidden border-y px-6 py-24 md:px-10 md:py-32"><BackgroundAtmosphere variant="archive" /><div className="relative mx-auto max-w-[1600px]"><h2 className="eyebrow reveal text-primary">OUR MISSION</h2><p className="reveal mt-8 max-w-4xl font-serif text-5xl leading-tight md:text-7xl">Make evidence easier to find, understand, and <em className="text-primary">trust.</em></p></div></section>
    <section className="px-6 py-20 md:px-10 md:py-28"><div className="mx-auto max-w-[1600px]"><h2 className="eyebrow reveal text-primary">THE TEAM</h2><div className="mt-12 grid gap-10 md:grid-cols-3">{["Frontend / UI", "Backend / IR", "AI / ML"].map((role, i) => <article key={role} className="reveal border-t pt-8"><div className="mb-8 flex items-center justify-between"><UserRound className="size-10 text-primary" strokeWidth={1} aria-hidden /><span className="eyebrow">0{i + 1}</span></div><h3 className="font-serif text-3xl">TEAM MEMBER</h3><p className="mt-3 text-muted-foreground">{role}</p><p className="eyebrow mt-5">Placeholder</p></article>)}</div></div></section>
    <section className="border-t px-6 py-16 md:px-10"><div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-8"><p className="font-serif text-4xl">Be curious. Then verify.</p><Button asChild variant="editorial"><Link to="/verify">Verify a claim <span aria-hidden>→</span></Link></Button></div></section>
  </>;
}