import { z } from "zod";
import type { DomainInsight } from "@/lib/catalog/domains";

export const identityDomainSchema = z
  .object({
    core_identity: z.record(z.string(), z.unknown()).optional(),
    adaptive_patterns: z.record(z.string(), z.unknown()).optional(),
    values: z.record(z.string(), z.unknown()).optional(),
    tensions: z.unknown().optional(),
    confidence: z.unknown().optional(),
    evidence: z.unknown().optional(),
  })
  .passthrough();

export const humanOsProfileSchema = z
  .object({
    identity: identityDomainSchema.optional(),
    mind: z.record(z.string(), z.unknown()).optional(),
    emotions: z.record(z.string(), z.unknown()).optional(),
    relationships: z.record(z.string(), z.unknown()).optional(),
    energy: z.record(z.string(), z.unknown()).optional(),
    work: z.record(z.string(), z.unknown()).optional(),
    growth: z.record(z.string(), z.unknown()).optional(),
    current_season: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export type HumanOsProfile = z.infer<typeof humanOsProfileSchema>;

export function pickString(...values: Array<unknown>) {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export function pickStringArray(...values: Array<unknown>) {
  for (const v of values) {
    if (Array.isArray(v) && v.length) {
      return v
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            const rec = item as Record<string, unknown>;
            return pickString(rec.text, rec.value, rec.label, rec.description, rec.desc, rec.title);
          }
          return String(item ?? "");
        })
        .filter(Boolean);
    }
    if (typeof v === "string" && v.trim()) {
      if (v.includes("\n") || v.includes("•")) {
        return v
          .split(/\n|•|·/)
          .map((s) => s.replace(/^[-*]\s*/, "").trim())
          .filter(Boolean);
      }
      return [v.trim()];
    }
  }
  return [] as string[];
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Strict matching only — avoid mapping Human OS field "values" → "values-architecture".
 */
function matchInsightKey(name: string, insights: DomainInsight[]): string | null {
  const n = norm(name);
  if (!n || n.length < 3) return null;

  // Human OS internal fields that must NEVER map to insights.
  // Do NOT block normalized insight ids (e.g. currentseason = current-season).
  const blocked = new Set([
    "identity",
    "mind",
    "emotions",
    "relationships",
    "energy",
    "work",
    "growth",
    "coreidentity",
    "adaptivepatterns",
    "values", // alone — not valuesarchitecture
    "tensions",
    "confidence",
    "evidence",
    "cognition",
    "decisions",
    "attention",
    "attachment",
    "communication",
    "conflict",
    "leadership",
    "execution",
    "influence",
    "profile",
    "data",
    "result",
    "output",
    "humanos",
    "input",
  ]);
  // Exact insight key/title always wins even if similar to blocked stems
  for (const insight of insights) {
    const keyCompact = norm(insight.key);
    const titleCompact = norm(insight.title);
    if (n === keyCompact || n === titleCompact) return insight.key;
  }
  if (blocked.has(n)) return null;

  // Require all significant title tokens for multi-word titles (length > 3)
  for (const insight of insights) {
    const tokens = (insight.title.toLowerCase().match(/[a-z]{4,}/g) || []).map(norm);
    if (tokens.length >= 2 && tokens.every((t) => n.includes(t))) {
      return insight.key;
    }
  }

  return null;
}

function contentScore(obj: Record<string, unknown>): number {
  let score = 0;
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("_")) continue;
    if (typeof v === "string" && v.trim().length > 20) score += 2;
    else if (typeof v === "string" && v.trim()) score += 1;
    else if (Array.isArray(v) && v.length) score += 2;
    else if (isPlainObject(v)) score += 1;
  }
  return score;
}

function looksLikeRenderedInsight(obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj).map(norm);
  const markers = [
    "mainnarrative",
    "main_narrative",
    "introduction",
    "whythismatters",
    "why_this_matters",
    "commonpatterns",
    "sidea",
    "side_a",
    "coreprinciples",
    "youfeelmostyourselfwhen",
    "commonblindspots",
    "youneedbeforeacting",
  ];
  return keys.some((k) => markers.some((m) => k.includes(m.replace(/_/g, "")) || m.replace(/_/g, "").includes(k)));
}

function looksLikeHumanOsDomain(obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj).map(norm);
  const hos = [
    "coreidentity",
    "adaptivepatterns",
    "cognitivearchitecture",
    "decisionmechanism",
    "emotionalarchitecture",
    "energygenerators",
    "stresssignature",
    "activeseason",
  ];
  return keys.some((k) => hos.includes(k));
}

/**
 * Convert Human OS domain primitives into pseudo-insight payloads when the LLM
 * accidentally returns profile structure instead of rendered insights.
 */
function synthesizeFromHumanOs(
  domainObj: Record<string, unknown>,
  insights: DomainInsight[],
): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};

  const map: Array<{ insightKey: string; sources: string[] }> = [
    { insightKey: "authentic-self", sources: ["core_identity", "coreIdentity"] },
    { insightKey: "protective-mask", sources: ["adaptive_patterns", "adaptivePatterns"] },
    { insightKey: "values-architecture", sources: ["values"] },
    { insightKey: "inner-conflicts", sources: ["tensions"] },
    { insightKey: "cognitive-style", sources: ["cognition", "cognitive_architecture", "cognitiveArchitecture"] },
    { insightKey: "decision-style", sources: ["decisions", "decision_mechanism", "decisionMechanism"] },
    { insightKey: "attention-focus", sources: ["attention", "attention_system", "attentionSystem"] },
    { insightKey: "blind-spots", sources: ["blind_spots", "blindSpots"] },
    { insightKey: "attachment-style", sources: ["attachment"] },
    { insightKey: "communication-style", sources: ["communication"] },
    { insightKey: "conflict-pattern", sources: ["conflict"] },
    { insightKey: "emotional-architecture", sources: ["emotional_architecture", "emotionalArchitecture"] },
    { insightKey: "emotional-triggers", sources: ["emotional_triggers", "emotionalTriggers"] },
    { insightKey: "emotional-recovery", sources: ["emotional_recovery", "emotionalRecovery"] },
    { insightKey: "leadership-style", sources: ["leadership"] },
    { insightKey: "execution-style", sources: ["execution"] },
    { insightKey: "influence-style", sources: ["influence"] },
    { insightKey: "stress-signature", sources: ["stress_signature", "stressSignature"] },
    { insightKey: "self-sabotage", sources: ["self_sabotage", "selfSabotage"] },
    { insightKey: "growth-edge", sources: ["growth_edge", "growthEdge"] },
    { insightKey: "current-season", sources: ["active_season", "activeSeason", "season"] },
    { insightKey: "active-lessons", sources: ["active_lessons", "activeLessons", "lessons"] },
    { insightKey: "current-opportunities", sources: ["current_opportunities", "currentOpportunities", "opportunities"] },
  ];

  const insightKeys = new Set(insights.map((i) => i.key));

  for (const { insightKey, sources } of map) {
    if (!insightKeys.has(insightKey)) continue;
    for (const src of sources) {
      const val = domainObj[src];
      if (!val) continue;
      if (typeof val === "string") {
        out[insightKey] = { main_narrative: val };
      } else if (isPlainObject(val)) {
        out[insightKey] = flattenHosToInsight(val);
      } else if (Array.isArray(val)) {
        out[insightKey] = { main_narrative: "", items: val };
      }
      break;
    }
  }

  return out;
}

function flattenHosToInsight(obj: Record<string, unknown>): Record<string, unknown> {
  const parts: string[] = [];
  const bullets: string[] = [];
  const out: Record<string, unknown> = {};

  // Inner conflicts shape
  if (Array.isArray(obj.conflicts) && obj.conflicts[0] && isPlainObject(obj.conflicts[0])) {
    const c = obj.conflicts[0] as Record<string, unknown>;
    const introduction =
      pickString(c.polarity, c.underlying_need) || "Two forces pull in different directions.";
    const sideADesc = pickString(c.side_a, c.sideA);
    const sideBDesc = pickString(c.side_b, c.sideB);
    out.introduction = introduction;
    out.side_a = {
      title: "Side A",
      description: sideADesc,
    };
    out.side_b = {
      title: "Side B",
      description: sideBDesc,
    };
    out.when_this_shows_up = pickStringArray(c.activated_by ? [String(c.activated_by)] : []);
    out.why_both_exist = pickString(c.underlying_need);
    out.why_this_matters =
      "Recognising both sides of this tension leads to wiser, less binary decisions.";
    out.main_narrative = [introduction, sideADesc, sideBDesc].filter(Boolean).join(" ");
    return out;
  }

  for (const [k, v] of Object.entries(obj)) {
    if (k === "confidence" || k === "evidence") continue;
    if (typeof v === "string" && v.trim()) {
      parts.push(v.trim());
      bullets.push(v.trim());
    } else if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === "string") bullets.push(item);
        else if (isPlainObject(item)) {
          const line = Object.values(item)
            .filter((x) => typeof x === "string")
            .join(" — ");
          if (line) bullets.push(line);
        }
      }
    } else if (isPlainObject(v)) {
      const nested = flattenHosToInsight(v);
      if (typeof nested.main_narrative === "string" && nested.main_narrative) {
        parts.push(nested.main_narrative);
      }
    }
  }

  out.main_narrative = parts.filter(Boolean).join(" ");
  if (bullets.length) {
    out.you_feel_most_yourself_when = bullets.slice(0, 5);
    out.common_patterns = bullets.slice(0, 5);
    out.thrives_in = bullets.slice(0, 5);
    out.items = bullets.slice(0, 5);
  }
  if (!out.main_narrative && bullets.length) {
    out.main_narrative = bullets.join(" ");
  }
  out.why_this_matters =
    "Recognising these operating patterns helps you make decisions that fit how you actually work.";
  return out;
}

/**
 * Fill any missing insight keys from the stored Human OS domain object.
 * Guarantees UI content even when the Langfuse renderer returns the wrong shape.
 */
export function fillInsightsFromProfile(
  domainSlice: unknown,
  insights: DomainInsight[],
  existing: Record<string, Record<string, unknown>> = {},
): Record<string, Record<string, unknown>> {
  const out = { ...existing };
  if (!isPlainObject(domainSlice)) return out;

  const synthesized = synthesizeFromHumanOs(domainSlice, insights);
  for (const insight of insights) {
    if (!isInsightPayloadUsable(out[insight.key] ?? {})) {
      if (synthesized[insight.key] && isInsightPayloadUsable(synthesized[insight.key])) {
        out[insight.key] = synthesized[insight.key];
      }
    }
  }
  return out;
}

/**
 * Map diverse LLM renderer JSON → { [insightKey]: payload }
 */
export function normalizeDomainBundle(
  raw: unknown,
  insights: DomainInsight[],
): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  if (!raw) return out;

  let root: unknown = raw;
  if (typeof root === "string") {
    try {
      root = JSON.parse(root);
    } catch {
      return out;
    }
  }
  if (!isPlainObject(root)) return out;

  const domainWrappers = [
    "data",
    "result",
    "output",
    "insights",
    "pages",
    "identity",
    "mind",
    "emotions",
    "relationships",
    "energy",
    "work",
    "growth",
    "current_season",
    "season",
    "profile",
  ];

  const objectsToScan: Record<string, unknown>[] = [root];

  for (const w of domainWrappers) {
    if (isPlainObject(root[w])) {
      const nested = root[w] as Record<string, unknown>;
      objectsToScan.push(nested);

      // If nested looks like Human OS domain, synthesize insights
      if (looksLikeHumanOsDomain(nested)) {
        Object.assign(out, synthesizeFromHumanOs(nested, insights));
      }
    }
    if (Array.isArray(root[w])) {
      for (const item of root[w] as unknown[]) {
        if (!isPlainObject(item)) continue;
        const title = String(item.title ?? item.name ?? item.key ?? item.id ?? "");
        const matched = matchInsightKey(title, insights);
        if (matched) out[matched] = item;
      }
    }
  }

  // Single-key wrap: { identity: { ... } }
  const rootKeys = Object.keys(root).filter((k) => !k.startsWith("_"));
  if (rootKeys.length === 1 && isPlainObject(root[rootKeys[0]])) {
    const only = root[rootKeys[0]] as Record<string, unknown>;
    objectsToScan.push(only);
    if (looksLikeHumanOsDomain(only)) {
      Object.assign(out, synthesizeFromHumanOs(only, insights));
    }
  }

  // Root itself is Human OS domain
  if (looksLikeHumanOsDomain(root)) {
    Object.assign(out, synthesizeFromHumanOs(root, insights));
  }

  function assign(key: string, value: Record<string, unknown>) {
    // Prefer objects that look like rendered insights over HOS blobs
    const prev = out[key];
    if (!prev) {
      out[key] = value;
      return;
    }
    const prevRendered = looksLikeRenderedInsight(prev);
    const nextRendered = looksLikeRenderedInsight(value);
    if (nextRendered && !prevRendered) out[key] = value;
    else if (nextRendered === prevRendered && contentScore(value) >= contentScore(prev)) {
      out[key] = value;
    }
  }

  for (const obj of objectsToScan) {
    for (const [k, v] of Object.entries(obj)) {
      if (!isPlainObject(v)) continue;
      const matched = matchInsightKey(k, insights);
      if (matched) assign(matched, v);
    }
  }

  function walk(node: unknown, path: string) {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    if (!isPlainObject(node)) return;

    if (looksLikeRenderedInsight(node)) {
      const title = String(node.title ?? node.name ?? "");
      const leaf = path.split(".").pop() || path;
      const matched = matchInsightKey(title, insights) || matchInsightKey(leaf, insights);
      if (matched) assign(matched, node);
    }

    for (const [k, v] of Object.entries(node)) {
      if (isPlainObject(v) || Array.isArray(v)) walk(v, path ? `${path}.${k}` : k);
    }
  }
  walk(root, "");

  // Positional fallback only if every value looks like a rendered insight
  if (Object.keys(out).length === 0) {
    const objectEntries = Object.entries(root).filter(
      ([k, v]) =>
        isPlainObject(v) &&
        !domainWrappers.includes(k) &&
        looksLikeRenderedInsight(v as Record<string, unknown>),
    );
    if (objectEntries.length === insights.length) {
      objectEntries.forEach(([, v], i) => {
        out[insights[i].key] = v as Record<string, unknown>;
      });
    }
  }

  return out;
}

export function normalizeIdentityBundle(raw: unknown): Record<string, Record<string, unknown>> {
  const legacy: DomainInsight[] = [
    {
      key: "authentic-self",
      title: "Authentic Self",
      desc: "",
      anchorQuestion: "",
      layout: "narrative-2",
      bulletSections: [],
    },
    {
      key: "protective-mask",
      title: "Protective Mask",
      desc: "",
      anchorQuestion: "",
      layout: "narrative-2",
      bulletSections: [],
    },
    {
      key: "values-architecture",
      title: "Values Architecture",
      desc: "",
      anchorQuestion: "",
      layout: "principles",
      bulletSections: [],
    },
    {
      key: "inner-conflicts",
      title: "Inner Conflicts",
      desc: "",
      anchorQuestion: "",
      layout: "tension",
      bulletSections: [],
    },
  ];
  return normalizeDomainBundle(raw, legacy);
}

export function isInsightPayloadUsable(payload: Record<string, unknown>): boolean {
  if (!payload || typeof payload !== "object") return false;

  const entries = Object.entries(payload).filter(([k]) => !k.startsWith("_"));
  if (!entries.length) return false;

  for (const [, v] of entries) {
    if (typeof v === "string") {
      if (v.includes("could not be fully structured")) return false;
      if (v.trim().length > 15) return true;
    }
    if (Array.isArray(v) && v.length > 0) return true;
    if (isPlainObject(v) && Object.keys(v).length > 0) return true;
  }

  const stringFields = entries.filter(
    ([, v]) => typeof v === "string" && (v as string).trim().length > 0,
  );
  if (stringFields.length >= 2) return true;

  return false;
}
