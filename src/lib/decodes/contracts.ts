import { z } from "zod";
import type { DecodeCatalog } from "@/lib/decodes/catalog";

export const decodeInsightPayloadSchema = z.record(z.string(), z.unknown());

function compact(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function locateKey(raw: Record<string, unknown>, key: string, title: string) {
  const wanted = new Set([compact(key), compact(title)]);
  const exact = Object.keys(raw).find((candidate) => wanted.has(compact(candidate)));
  if (exact) return exact;
  return Object.keys(raw).find((candidate) => {
    const candidateKey = compact(candidate);
    return [...wanted].some((part) => part.length > 4 && (candidateKey.includes(part) || part.includes(candidateKey)));
  });
}

export function normalizeDecodeBundle(value: unknown, catalog: DecodeCatalog) {
  const parsed = z.record(z.string(), z.unknown()).safeParse(value);
  if (!parsed.success) throw new Error("Renderer returned a non-object JSON response.");

  const raw = parsed.data;
  const bundle: Record<string, Record<string, unknown>> = {};
  const missing: string[] = [];
  const consumed = new Set<string>();
  for (const insight of catalog.insights) {
    const sourceKey = locateKey(raw, insight.key, insight.title);
    const payload = sourceKey ? decodeInsightPayloadSchema.safeParse(raw[sourceKey]) : null;
    if (!payload?.success) {
      missing.push(insight.key);
      continue;
    }
    consumed.add(sourceKey!);
    bundle[insight.key] = payload.data;
  }
  if (missing.length) {
    throw new Error(`Renderer response is missing insights: ${missing.join(", ")}`);
  }
  const extras = Object.keys(raw).filter((key) => !consumed.has(key));
  if (extras.length) throw new Error(`Renderer response contains unexpected top-level keys: ${extras.join(", ")}`);
  return bundle;
}

export function buildDecodeOutputContract(catalog: DecodeCatalog) {
  const keys = catalog.insights.map((insight) => `- ${insight.key}`).join("\n");
  const example = catalog.insights
    .map((insight) => `  "${insight.key}": { "main_narrative": "...", "sections": ["..."], "why_this_matters": "..." }`)
    .join(",\n");
  return `OUTPUT FORMAT (required):
Return one JSON object with exactly these top-level insight keys:
${keys}

Each value must be an object containing the complete sections required by the renderer prompt.
Use concise prose and arrays for repeated observations. Do not return markdown, Human OS fields,
astrology terms, scores, or any wrapper object.

Example shape:
{
${example}
}`;
}
