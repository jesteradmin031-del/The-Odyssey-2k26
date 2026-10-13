import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { EXAMPLE_CLAIM, SOURCES, STEPS, isSampleClaim } from "./data";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Link2, ImagePlus, Upload, X } from "lucide-react";
import { verifyText, verifyUrl, verifyImage, type Verdict, type VerifyResponse } from "@/lib/api";
import type { NetworkSource } from "./EvidenceNetwork";

type InputMode = "text" | "url" | "image";
type Submission = { mode: InputMode; value: string; preview: string | null; context: string };
type Outcome = { response: VerifyResponse | null; error: string | null };
type Item = { name: string; title: string; date: string; relevance: string; label: string; tone: string; summary: string; url: string | null };

const VERDICT_TONE: Record<string, string> = { SUPPORTED: "text-support", CONTRADICTED: "text-destructive", MISLEADING: "text-violet", UNVERIFIED: "text-unverified" };
const NET_TONE: Record<string, NetworkSource["tone"]> = { SUPPORTED: "support", CONTRADICTED: "destructive", MISLEADING: "muted", UNVERIFIED: "muted" };

function safeUrl(url: string | undefined) {
  if (!url) return null;
  try { const u = new URL(url); return u.protocol === "http:" || u.protocol === "https:" ? u : null; } catch { return null; }
}
function apiItems(r: VerifyResponse): Item[] {
  return r.claims.map((c) => {
    const s = c.sources[0];
    return {
      name: s ? safeUrl(s.url)?.hostname ?? s.title : "VERITAS research",
      title: c.claim_text,
      date: s?.source_date || "n/a",
      relevance: "—",
      label: c.status,
      tone: VERDICT_TONE[c.status] ?? "text-unverified",
      summary: c.explanation + (s?.snippet ? ` ${s.snippet}` : ""),
      url: safeUrl(s?.url)?.href ?? null,
    };
  });
}
function apiNetwork(r: VerifyResponse): NetworkSource[] {
  return r.claims.map((c) => {
    const s = c.sources[0];
    return { name: s ? safeUrl(s.url)?.hostname ?? s.title : "VERITAS research", date: s?.source_date || "n/a", note: c.explanation, label: c.status, tone: NET_TONE[c.status] ?? "muted" };
  });
}

export function VerifyDemo({ onResult, selected, onSelect }: { onResult: (claim: string, sources?: NetworkSource[] | undefined) => void; selected: number | null; onSelect: (index: number | null) => void }) {
  const [claim, setClaim] = useState("");
  const [mode, setMode] = useState<InputMode>("text");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState<{ name: string; preview: string; file: File } | null>(null);
  const [imageContext, setImageContext] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<Submission | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const runId = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const running = step >= 0 && done === null;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => () => { if (image) URL.revokeObjectURL(image.preview); }, [image]);

  const pickImage = async (file?: File) => {
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Choose a JPG, PNG, or WebP image."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Choose an image smaller than 8 MB."); return; }
    const preview = URL.createObjectURL(file);
    try {
      const bitmap = await createImageBitmap(file);
      bitmap.close();
      setImage({ name: file.name, preview, file });
    } catch { URL.revokeObjectURL(preview); setError("This image could not be opened. Please choose another file."); }
  };

  const run = () => {
    if (running) return;
    setError("");
    if (mode === "text" && !claim.trim()) return;
    if (mode === "image" && !image) return;
    if (mode === "url") {
      try { const parsed = new URL(url.trim()); if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(); }
      catch { setError("Enter a complete website URL beginning with https:// or http://."); return; }
    }
    const original = mode === "text" ? claim : mode === "url" ? url : image?.name ?? "";
    const submission: Submission = { mode, value: original, preview: mode === "image" ? image?.preview ?? null : null, context: imageContext };
    const id = ++runId.current;
    const toOutcome = (p: Promise<VerifyResponse>): Promise<Outcome> =>
      p.then((response) => ({ response, error: null }), (e: unknown) => ({ response: null, error: e instanceof Error ? e.message : "Unknown error." }));
    const request: Promise<Outcome> | null =
      mode === "text" && isSampleClaim(original.trim()) ? null
      : mode === "text" ? toOutcome(verifyText(original.trim()))
      : mode === "url" ? toOutcome(verifyUrl(original.trim()))
      : toOutcome(verifyImage(image!.file));
    setSubmitted(submission);
    setOutcome(null);
    timers.current.forEach(clearTimeout);
    setDone(null); setStep(0); onSelect(null);
    const fast = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timers.current = STEPS.map((_, i) => setTimeout(() => setStep(i), i * (fast ? 150 : 1100)));
    timers.current.push(setTimeout(async () => {
      const result = request ? await request : null;
      if (id !== runId.current) return;
      setOutcome(result);
      setDone(original);
      if (result?.response) onResult(original, apiNetwork(result.response));
      else if (result?.error && !isSampleClaim(original)) onResult(original, []);
      else onResult(original);
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: fast ? "instant" : "smooth", block: "start" }));
    }, STEPS.length * (fast ? 150 : 1100)));
  };

  return (
    <section id="verify" className="border-t px-6 py-24 md:px-10 md:py-32">
      <div className="mx-auto max-w-[1600px]">
        <p className="eyebrow reveal text-primary">VERITAS / Investigation</p>
        <h1 className="display verify-heading reveal mt-6">VERIFY A CLAIM</h1>
        <p className="reveal mt-8 max-w-xl text-lg text-muted-foreground">Paste a statement, headline, or claim and let VERITAS investigate it.</p>
        <div className="mt-12 grid gap-12 md:grid-cols-12">
          <form className="md:col-span-7" onSubmit={(e) => { e.preventDefault(); run(); }}>
            <div className="verification-input p-6 md:p-8">
              <Tabs value={mode} onValueChange={(value) => { if (value === "text" || value === "url" || value === "image") { setMode(value); setError(""); setDone(null); setStep(-1); } }}>
                <TabsList aria-label="Verification input type" className="mb-7 grid h-12 w-full grid-cols-3 rounded-none bg-secondary">
                  <TabsTrigger value="text" disabled={running} className="h-full gap-2 rounded-none"><FileText className="size-4" />Text</TabsTrigger>
                  <TabsTrigger value="url" disabled={running} className="h-full gap-2 rounded-none"><Link2 className="size-4" />URL</TabsTrigger>
                  <TabsTrigger value="image" disabled={running} className="h-full gap-2 rounded-none"><ImagePlus className="size-4" />Image</TabsTrigger>
                </TabsList>
                <TabsContent value="text">
                  <label htmlFor="claim" className="eyebrow">Claim under investigation</label>
                  <textarea id="claim" rows={4} value={claim} disabled={running} onChange={(e) => setClaim(e.target.value)} placeholder="Enter the claim you want to verify..." className="mt-5 min-h-40 w-full resize-y bg-transparent font-serif text-3xl leading-snug outline-none placeholder:text-muted-foreground md:text-4xl" />
                </TabsContent>
                <TabsContent value="url" className="min-h-56">
                  <label htmlFor="claim-url" className="eyebrow">Website / Article URL</label>
                  <input id="claim-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} disabled={running} placeholder="https://example.com/article" className="mt-6 w-full border-b border-input bg-transparent py-4 text-lg outline-none placeholder:text-muted-foreground focus:border-primary" />
                  <p className="mt-6 text-sm leading-relaxed text-muted-foreground">The backend reads the page, extracts its claims, and checks each one against live sources.</p>
                </TabsContent>
                <TabsContent value="image">
                  <label className="eyebrow" htmlFor="claim-image">Image / Screenshot</label>
                  <input ref={fileInput} id="claim-image" type="file" accept="image/jpeg,image/png,image/webp" disabled={running} className="sr-only" onChange={(e) => { void pickImage(e.target.files?.[0]); e.target.value = ""; }} />
                  <div className="relative mt-5 border border-dashed border-input p-5" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (!running) void pickImage(e.dataTransfer.files[0]); }}>
                    {image ? <><img src={image.preview} alt="Selected image for verification" className="max-h-72 w-full object-contain" /><div className="mt-4 flex items-center justify-between gap-3"><span className="break-all text-sm text-muted-foreground">{image.name}</span><Button type="button" variant="ghost" size="icon" title="Remove image" aria-label="Remove image" disabled={running} onClick={() => { setImage(null); setDone(null); }}><X /></Button></div></> : <Button type="button" variant="ghost" disabled={running} onClick={() => fileInput.current?.click()} className="flex h-44 w-full flex-col gap-4 whitespace-normal"><Upload className="size-6" /><span className="text-base">Upload an image or drop it here</span><span className="text-sm text-muted-foreground">JPG, PNG, WebP · up to 8 MB</span></Button>}
                  </div>
                  <label htmlFor="image-context" className="eyebrow mt-6 block">Claim or context (optional)</label>
                  <textarea id="image-context" rows={2} value={imageContext} disabled={running} onChange={(e) => setImageContext(e.target.value)} placeholder="What is this image claiming to show?" className="mt-3 w-full resize-y border-b bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground focus:border-primary" />
                  <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-primary"><span>CLAIMS IN IMAGE</span><span>AUTHENTICITY & CONTEXT</span></div>
                </TabsContent>
              </Tabs>
              {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-5 border-t pt-6">
                <span className="eyebrow">{mode === "text" ? "Statement / Headline / Claim" : mode === "url" ? "URL / Article / Source" : "Claims / Authenticity / Context"}</span>
                <Button type="submit" variant="editorial" disabled={running || (mode === "text" ? !claim.trim() : mode === "url" ? !url.trim() : !image)}>{running ? "INVESTIGATING" : mode === "text" ? "VERIFY CLAIM" : mode === "url" ? "VERIFY URL" : "VERIFY IMAGE"} <span aria-hidden>→</span></Button>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-sm text-muted-foreground">Claims are checked by the VERITAS backend against live sources.</p>
              <Button type="button" variant="link" disabled={running} onClick={() => { setMode("text"); setClaim(EXAMPLE_CLAIM); setDone(null); setStep(-1); }} className="h-auto p-0 text-sm">Try the sample claim →</Button>
            </div>
          </form>
          <ol className="space-y-6 md:col-span-4 md:col-start-9" aria-label="Verification progress" aria-live="polite" aria-busy={running}>
            {STEPS.map((s, i) => {
              const state = done || step > i ? "done" : step === i ? "active" : "";
              return <li key={s} className={`transition-opacity duration-500 ${state ? "opacity-100" : "opacity-50"}`}>
                <div className="flex items-center gap-4 font-mono text-xs uppercase"><span className="text-primary">0{i + 1}</span><span className="flex-1">{s}{state === "active" && <span className="pulse">…</span>}</span><span className="text-support">{state === "done" ? "✓" : ""}</span></div>
                <div className={`bar mt-3 ${state}`}><i /></div>
              </li>;
            })}
          </ol>
        </div>
        {done !== null && submitted && <div ref={resultRef} className="mt-24 scroll-mt-28"><Result claim={done} submission={submitted} outcome={outcome} selected={selected} onSelect={onSelect} /></div>}
      </div>
    </section>
  );
}

function Result({ claim, submission, outcome, selected, onSelect }: { claim: string; submission: Submission; outcome: Outcome | null; selected: number | null; onSelect: (index: number | null) => void }) {
  const response = outcome?.response ?? null;
  const failed = !!outcome?.error;
  const sample = submission.mode === "text" && !response && !failed && isSampleClaim(claim);
  const items: Item[] = response ? apiItems(response)
    : sample ? SOURCES.map((s) => ({ name: s.name, title: s.title, date: s.date, relevance: s.relevance, label: s.supports ? "PARTIALLY SUPPORTS CLAIM" : "CONTRADICTS CLAIM", tone: s.supports ? "text-support" : "text-destructive", summary: s.note, url: null }))
    : [];
  const verdict: Verdict = response ? response.overall_verdict : sample ? "MISLEADING" : "UNVERIFIED";
  const confidence = response ? <>{response.claims.length}<span className="text-4xl"> claim{response.claims.length === 1 ? "" : "s"} checked</span></>
    : sample ? <>87<span className="text-4xl">%</span></> : <span className="text-4xl">Not assessed</span>;
  const note = response ? response.summary
    : sample ? "Illustrative verdict · 87% is a sample value, not a live assessment. Evidence below comes from the supplied prototype."
    : failed ? "No verdict was produced." : "No verdict can be reached without relevant evidence. This claim has not been investigated.";
  const why = response ? response.claims.map((c) => c.explanation).filter(Boolean).join(" ") || response.summary
    : sample ? "The sample evidence points to lower lifetime emissions for electric vehicles, even though making their batteries produces more emissions at first. Electricity from coal can narrow that benefit. The claim takes a limited case and presents it as true for all electric vehicles."
    : failed ? "The VERITAS backend could not be reached or returned an error, so no verdict was produced."
    : "VERITAS has no connected research service for this input. There is no evidence available, so it would be misleading to label it true or false.";
  return <div className="border-t pt-12" aria-live="polite">
    <p className="eyebrow text-primary">VERIFICATION RESULT</p>
    {failed && <div role="alert" className="mt-5 text-destructive"><p>Verification request failed: {outcome?.error}</p>{!sample && <p className="mt-1">No verdict was produced.</p>}</div>}
    <div className="verdict-in mt-7 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
      <h3 className={`display verdict-label ${VERDICT_TONE[verdict] ?? "text-unverified"}`}>{verdict}</h3>
      <div><p className="eyebrow">{response ? "CLAIMS CHECKED" : "CONFIDENCE"}</p><p className="display mt-3 text-7xl">{confidence}</p></div>
    </div>
    <p className="mt-6 text-sm text-muted-foreground">{note}</p>
    <section className="result-section verdict-in"><h4 className="eyebrow">{submission.mode === "text" ? "YOUR CLAIM" : submission.mode === "url" ? "YOUR URL" : "YOUR IMAGE"}</h4><blockquote className="mt-5 whitespace-pre-wrap break-words font-serif text-3xl leading-snug md:text-4xl">{claim}</blockquote>
      {submission.mode === "image" && submission.preview && <><img src={submission.preview} alt="Your submitted image" className="mt-6 max-h-96 w-full max-w-2xl object-contain object-left" />{submission.context && <p className="mt-5 whitespace-pre-wrap break-words text-lg">{submission.context}</p>}</>}
    </section>
    {submission.mode === "image" && !response && <section className="result-section"><h4 className="eyebrow text-primary">IMAGE ASSESSMENT</h4><div className="mt-6 grid gap-8 md:grid-cols-2"><div><h5 className="text-lg">Claims in image</h5><p className="mt-2 font-mono text-sm text-unverified">NOT ASSESSED</p><p className="mt-3 leading-relaxed text-muted-foreground">No text extraction or evidence research has run for this image.</p></div><div><h5 className="text-lg">Authenticity & context</h5><p className="mt-2 font-mono text-sm text-unverified">NOT ASSESSED</p><p className="mt-3 leading-relaxed text-muted-foreground">Manipulation, AI generation, and original context have not been checked. Appearance alone cannot prove authenticity.</p></div></div></section>}
    {submission.mode === "url" && !response && <p className="mt-6 text-lg text-muted-foreground">The URL was accepted, but its page has not been retrieved or assessed.</p>}
    <section className="result-section verdict-in"><h4 className="eyebrow text-primary">WHY?</h4><p className="result-copy mt-5">{why}</p></section>
    <section className="result-section"><h4 className="eyebrow text-primary">EVIDENCE <span className="ml-3 text-muted-foreground">/ {items.length.toString().padStart(2, "0")}</span></h4>
      {sample && <p className="mt-4 text-sm text-muted-foreground">Sample source records · titles are descriptive labels, not verified publication citations.</p>}
      <div className="mt-7">{items.map((s, i) => <article id={`evidence-${i}`} key={`${s.name}-${i}`} className={`evidence-item ${selected === i ? "selected" : ""}`}>
        <div className="flex flex-col justify-between gap-4 md:flex-row"><div><p className="eyebrow">SOURCE / 0{i + 1}</p><p className="mt-2 text-xl font-medium">{s.name}</p></div><p className={`font-mono text-sm ${s.tone}`}>{s.label}</p></div>
        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto_auto]"><div><p className="eyebrow">TITLE</p><h5 className="mt-2 font-serif text-3xl leading-snug">{s.title}</h5></div><div><p className="eyebrow">DATE</p><p className="mt-2 text-base">{s.date}</p></div><div><p className="eyebrow">RELEVANCE</p><p className="mt-2 font-mono text-sm text-primary">{s.relevance.toUpperCase()}</p></div></div>
        <p className="eyebrow mt-6">SHORT SUMMARY</p><p className="mt-2 max-w-3xl text-lg leading-relaxed text-muted-foreground">{s.summary}</p>
      </article>)}</div>{!items.length && <p className="mt-5 text-lg text-muted-foreground">No evidence retrieved for this claim.</p>}
    </section>
    <section className="result-section"><h4 className="eyebrow text-primary">SOURCES</h4><div className="mt-5 flex flex-col items-start gap-3">{items.map((s, i) => s.url
      ? <a key={`${s.name}-${i}`} href={s.url} target="_blank" rel="noopener noreferrer" className="text-base text-primary underline-offset-4 hover:underline" onFocus={() => onSelect(i)} onMouseEnter={() => onSelect(i)}><span className="mr-3 font-mono text-xs text-muted-foreground">0{i + 1}</span>{s.name} ↗</a>
      : <Button key={`${s.name}-${i}`} variant="link" className="h-auto whitespace-normal p-0 text-left text-base" onFocus={() => onSelect(i)} onClick={() => { onSelect(i); document.getElementById(`evidence-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}><span className="mr-3 font-mono text-xs text-muted-foreground">0{i + 1}</span>{s.name}</Button>)}</div>{!items.length && <p className="mt-5 text-lg text-muted-foreground">No sources used.</p>}</section>
  </div>;
}
