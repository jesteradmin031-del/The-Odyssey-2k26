const LABELS = ["ISOLATE THE STATEMENT", "GATHER THE RECORD", "WEIGH AGREEMENT", "CALIBRATE THE VERDICT", "SHOW THE REASONING"];

export function PipelineVisual({ step }: { step: number }) {
  return (
    <div className="pipeline-visual mt-8 max-w-md" aria-hidden>
      <svg viewBox="0 0 400 110" className="h-28 w-full">
        {[55, 125, 200, 275, 345].map((x, i) => (
          <g key={x} className={i <= step ? "pipeline-lit" : "pipeline-dim"}>
            {i < 4 && <path d={`M ${x + 13} 55 H ${x + 57}`} className="pipeline-edge" />}
            <circle cx={x} cy="55" r={i === step ? 16 : 8} className="pipeline-point" />
            {i === step && <circle cx={x} cy="55" r="27" className="pipeline-ring pulse" />}
            <text x={x} y="98" textAnchor="middle" className="pipeline-label">0{i + 1}</text>
          </g>
        ))}
        {step === 1 && <><path d="M125 39 V12 H175" className="pipeline-edge" /><path d="M125 71 V82 H85" className="pipeline-edge" /></>}
        {step === 2 && <><path d="M185 40 L165 15 H235 L215 40" className="pipeline-edge" /><path d="M185 70 L165 85 H235 L215 70" className="pipeline-edge" /></>}
        {step === 3 && <path d="m267 55 6 6 11-13" className="pipeline-check" />}
        {step === 4 && <><path d="M330 32 H360 M330 23 H350 M330 78 H360" className="pipeline-edge" /></>}
      </svg>
      <p className="eyebrow text-primary">{LABELS[step]}</p>
    </div>
  );
}