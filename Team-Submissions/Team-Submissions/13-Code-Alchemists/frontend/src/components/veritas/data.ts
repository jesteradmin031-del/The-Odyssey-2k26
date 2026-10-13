export const EXAMPLE_CLAIM = "Electric vehicles produce more emissions than petrol cars.";

export const STAGES = [
  { n: "01", t: "Claim", d: "A statement is isolated, parsed and broken into checkable assertions — who, what, when, how much." },
  { n: "02", t: "Retrieve", d: "Primary research, official datasets and reputable reporting are gathered from across the record." },
  { n: "03", t: "Compare", d: "Sources are weighed against each other. Agreement, contradiction and context are mapped." },
  { n: "04", t: "Verify", d: "Evidence quality, recency and independence are scored to reach a calibrated judgement." },
  { n: "05", t: "Explain", d: "A plain-language verdict, with every source visible. Nothing hidden behind a number." },
];

export const STEPS = ["Analyzing claim", "Retrieving evidence", "Comparing sources", "Assessing evidence", "Generating verdict"];

export type Source = { name: string; date: string; relevance: "High" | "Medium"; supports: boolean; note: string; title: string };

export const SOURCES: Source[] = [
  { name: "Nature Climate Change", date: "2024", relevance: "High", supports: false, title: "Lifecycle emissions of electric vehicles", note: "Lifecycle studies generally find lower total emissions for electric vehicles than petrol cars across most electricity grids." },
  { name: "International Energy Agency", date: "2024", relevance: "High", supports: false, title: "Battery production and lifetime emissions", note: "Electric vehicles begin with higher manufacturing emissions, but lower emissions during driving can offset that difference." },
  { name: "ICCT Lifecycle Report", date: "2023", relevance: "High", supports: false, title: "Comparing vehicle emissions across a full lifetime", note: "The supplied example describes substantially lower lifetime emissions for electric vehicles registered in Europe." },
  { name: "Coal-grid regional study", date: "2022", relevance: "Medium", supports: true, title: "The effect of coal-dependent electricity grids", note: "On coal-dominant grids, early-life emissions can exceed petrol vehicles. This is a limited case, not a general conclusion." },
];

export function isSampleClaim(claim: string) {
  return claim.trim().toLowerCase().replace(/[.!?]+$/, "") === EXAMPLE_CLAIM.toLowerCase().replace(/[.!?]+$/, "");
}
