import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { VerifyDemo } from "@/components/veritas/VerifyDemo";
import { EvidenceNetwork, type NetworkSource } from "@/components/veritas/EvidenceNetwork";
import { useReveal } from "@/components/veritas/hooks";

export const Route = createFileRoute("/verify")({
  head: () => ({ meta: [
    { title: "Verify a Claim — VERITAS" },
    { name: "description", content: "Verify text claims with the VERITAS backend, and explore URL and image inputs. See the verdict, explanation, and evidence." },
    { property: "og:title", content: "Verify a Claim — VERITAS" },
    { property: "og:description", content: "A clear claim-to-evidence verification experience for text, URLs, and images." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: VerifyPage,
});

function VerifyPage() {
  useReveal();
  const [claim, setClaim] = useState<string | null>(null);
  const [sources, setSources] = useState<NetworkSource[] | undefined>(undefined);
  const [selected, setSelected] = useState<number | null>(null);
  return <div className="pt-16 md:pt-20">
    <VerifyDemo onResult={(c, s) => { setClaim(c); setSources(s); }} selected={selected} onSelect={setSelected} />
    {claim !== null && <EvidenceNetwork claim={claim} sources={sources} selected={selected} onSelect={setSelected} />}
  </div>;
}
