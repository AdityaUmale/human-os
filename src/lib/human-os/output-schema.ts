import type { DomainConfig, DomainInsight } from "@/lib/catalog/domains";

/**
 * Strong JSON contract appended to every domain renderer call so the model
 * returns insight-keyed objects instead of re-emitting Human OS profile fields.
 */
export function buildDomainOutputContract(domain: DomainConfig): string {
  const keys = domain.insights.map((i) => i.key);
  const examples = domain.insights
    .map((i) => {
      const sample = sampleForLayout(i);
      return `  "${i.key}": ${sample}`;
    })
    .join(",\n");

  return `OUTPUT FORMAT (required):
Return a single JSON object whose TOP-LEVEL keys are EXACTLY these insight ids (snake or kebab style as shown):
${keys.map((k) => `- ${k}`).join("\n")}

Do NOT wrap the result under "${domain.profileKey}" or "identity" / "mind" / etc.
Do NOT return Human OS profile fields (core_identity, adaptive_patterns, leadership, etc.) as top-level insight substitutes.
Do NOT return markdown.

Example shape:
{
${examples}
}

Each insight value must be an object with prose fields suitable for the UX (main_narrative or introduction, bullet arrays, why_this_matters). Use snake_case field names.`;
}

function sampleForLayout(insight: DomainInsight): string {
  if (insight.layout === "tension") {
    return `{
    "introduction": "...",
    "side_a": { "title": "...", "description": "..." },
    "side_b": { "title": "...", "description": "..." },
    "when_this_shows_up": ["...", "..."],
    "why_both_exist": "...",
    "why_this_matters": "..."
  }`;
  }
  if (insight.layout === "principles") {
    return `{
    "introduction": "...",
    "core_principles": [{ "title": "...", "description": "..." }],
    "how_they_shape_decisions": ["..."],
    "where_they_create_friction": ["..."],
    "why_this_matters": "..."
  }`;
  }
  if (insight.layout === "blind-spots") {
    return `{
    "introduction": "...",
    "common_blind_spots": ["..."],
    "how_they_usually_show_up": ["..."],
    "why_they_exist": "...",
    "why_this_matters": "..."
  }`;
  }
  // narrative-2 / narrative-3
  const bullets = insight.bulletSections
    .map((s, idx) => {
      const field = s.aliases[0] || `bullets_${idx + 1}`;
      return `    "${field}": ["...", "..."]`;
    })
    .join(",\n");
  return `{
    "main_narrative": "... 120-180 words ...",
${bullets},
    "why_this_matters": "..."
  }`;
}
