export type Verdict = "SUPPORTED" | "MISLEADING" | "CONTRADICTED" | "UNVERIFIED";
export type ApiSource = { title: string; url: string; snippet: string | null; source_date: string | null };
export type ApiClaim = { id: number; claim_text: string; status: Verdict; explanation: string; sources: ApiSource[] };
export type VerifyResponse = {
  id: number;
  input_type: "text" | "url" | "image";
  source_ref: string | null;
  original_text: string;
  overall_verdict: Verdict;
  summary: string;
  created_at: string;
  claims: ApiClaim[];
};

export const API_BASE = ((import.meta.env['VITE_API_URL'] as string | undefined) || "http://localhost:8000").replace(/\/+$/, "");

async function request(path: string, init: RequestInit): Promise<VerifyResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, signal: controller.signal });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw new Error("The request timed out after 120 seconds.");
    throw new Error(`Could not reach the VERITAS backend at ${API_BASE}.`);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    let detail = `The backend returned an error (HTTP ${res.status}).`;
    try {
      const body = (await res.json()) as { detail?: unknown };
      if (typeof body.detail === "string" && body.detail) detail = body.detail;
    } catch { /* keep default */ }
    throw new Error(detail);
  }
  return (await res.json()) as VerifyResponse;
}

export function verifyText(text: string): Promise<VerifyResponse> {
  return request("/api/verify/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export function verifyUrl(url: string): Promise<VerifyResponse> {
  return request("/api/verify/url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

export function verifyImage(file: File): Promise<VerifyResponse> {
  const form = new FormData();
  form.append("file", file);
  return request("/api/verify/image", { method: "POST", body: form });
}
