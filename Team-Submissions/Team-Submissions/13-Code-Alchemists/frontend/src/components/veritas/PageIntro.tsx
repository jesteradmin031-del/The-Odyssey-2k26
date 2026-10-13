import type { ReactNode } from "react";
import { BackgroundAtmosphere } from "./BackgroundAtmosphere";

export function PageIntro({ number, title, accent, children }: { number: string; title: string; accent: string; children: ReactNode }) {
  return (
    <header className="relative overflow-hidden border-b px-6 pb-16 pt-36 md:px-10 md:pb-20 md:pt-44">
      <BackgroundAtmosphere variant="archive" />
      <div className="relative mx-auto max-w-[1600px]">
        <p className="eyebrow reveal text-primary">VERITAS / {number}</p>
        <h1 className="display section-heading reveal mt-8 uppercase">{title}<em className="mt-2 block text-primary">{accent}</em></h1>
        <div className="reveal mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </header>
  );
}