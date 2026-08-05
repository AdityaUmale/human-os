import type { DomainInsight } from "@/lib/catalog/domains";
import { pickString, pickStringArray } from "@/lib/human-os/schemas";

function normKey(k: string) {
  return k.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getByAliases(payload: Record<string, unknown>, ...aliases: string[]): unknown {
  const wanted = aliases.map(normKey).filter(Boolean);
  for (const [k, v] of Object.entries(payload)) {
    const nk = normKey(k);
    if (wanted.includes(nk)) return v;
  }
  for (const [k, v] of Object.entries(payload)) {
    const nk = normKey(k);
    if (wanted.some((w) => w.length > 3 && (nk.includes(w) || w.includes(nk)))) {
      return v;
    }
  }
  return undefined;
}

function asSide(v: unknown): { title: string; desc: string } | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const rec = v as Record<string, unknown>;
  const title = pickString(
    rec.title,
    rec.Title,
    rec.name,
    rec.Name,
    getByAliases(rec, "title", "name", "label"),
  );
  const desc = pickString(
    rec.description,
    rec.Description,
    rec.desc,
    rec.text,
    getByAliases(rec, "description", "desc", "text"),
  );
  if (!title && !desc) return null;
  return { title: title || "Side", desc };
}

function principlesFrom(value: unknown): Array<{ title: string; desc: string }> {
  if (!Array.isArray(value)) return [];
  return value.map((p) => {
    if (typeof p === "string") {
      const idx = p.indexOf(":");
      if (idx > 0 && idx < 48) {
        return { title: p.slice(0, idx).trim(), desc: p.slice(idx + 1).trim() };
      }
      return { title: p, desc: "" };
    }
    if (p && typeof p === "object") {
      const rec = p as Record<string, unknown>;
      return {
        title:
          pickString(rec.title, rec.Title, rec.name, rec.Name, getByAliases(rec, "title", "name")) ||
          "Principle",
        desc: pickString(
          rec.description,
          rec.Description,
          rec.desc,
          getByAliases(rec, "description", "desc"),
        ),
      };
    }
    return { title: String(p), desc: "" };
  });
}

function firstLongString(payload: Record<string, unknown>): string {
  let best = "";
  for (const [k, v] of Object.entries(payload)) {
    if (k.startsWith("_")) continue;
    if (typeof v === "string" && v.length > best.length && !v.includes("could not be fully structured")) {
      best = v;
    }
  }
  return best.length > 40 ? best : best;
}

function humanizeKey(k: string) {
  return k
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export type InsightView = {
  mainNarrative: string;
  bulletGroups: Array<{ title: string; items: string[] }>;
  whyThisMatters: string;
  whyBothExist: string;
  extraParagraphs: Array<{ title: string; text: string }>;
  principles: Array<{ title: string; desc: string }>;
  sideA: { title: string; desc: string } | null;
  sideB: { title: string; desc: string } | null;
};

/**
 * Build a display model from LLM payload + insight catalog metadata.
 */
export function viewFromInsight(
  payload: Record<string, unknown>,
  insight: DomainInsight,
): InsightView {
  let mainNarrative = pickString(
    getByAliases(
      payload,
      "mainNarrative",
      "main_narrative",
      "Main Narrative",
      "narrative",
      "introduction",
      "Introduction",
      "intro",
      "operating_style",
      "influence_style",
      "working_style",
      "developmental_theme",
    ),
  );

  if (!mainNarrative) {
    mainNarrative = firstLongString(payload);
  }

  const whyThisMatters = pickString(
    getByAliases(payload, "why_this_matters", "whyThisMatters", "Why This Matters"),
  );

  const whyBothExist = pickString(
    getByAliases(payload, "why_both_exist", "whyBothExist", "Why Both Exist"),
  );

  const bulletGroups = insight.bulletSections.map((section) => ({
    title: section.title,
    items: pickStringArray(getByAliases(payload, ...section.aliases, section.title)),
  }));

  // Fill empty bullet groups from leftover string/array fields
  const usedKeys = new Set<string>();
  for (const section of insight.bulletSections) {
    for (const a of section.aliases) usedKeys.add(normKey(a));
  }
  usedKeys.add(normKey("mainnarrative"));
  usedKeys.add(normKey("main_narrative"));
  usedKeys.add(normKey("why_this_matters"));
  usedKeys.add(normKey("introduction"));

  if (bulletGroups.every((g) => g.items.length === 0)) {
    for (const [k, v] of Object.entries(payload)) {
      if (k.startsWith("_")) continue;
      if (usedKeys.has(normKey(k))) continue;
      if (Array.isArray(v) && v.length) {
        bulletGroups.push({ title: humanizeKey(k), items: pickStringArray(v) });
      } else if (typeof v === "string" && v.trim() && v !== mainNarrative && v !== whyThisMatters) {
        bulletGroups.push({ title: humanizeKey(k), items: [v.trim()] });
      }
    }
  } else {
    // For empty individual sections, try alias-less fill already done
    // Also: map remaining string fields into empty sections in order
    const leftover: Array<{ title: string; items: string[] }> = [];
    for (const [k, v] of Object.entries(payload)) {
      if (k.startsWith("_")) continue;
      if (typeof v === "string" && v.trim() && v !== mainNarrative && v !== whyThisMatters) {
        const already = bulletGroups.some((g) => g.items.includes(v.trim()));
        if (!already && v.length < 400) leftover.push({ title: humanizeKey(k), items: [v.trim()] });
      }
      if (Array.isArray(v) && v.length && typeof v[0] === "string") {
        const already = bulletGroups.some((g) => g.title && g.items.length);
        if (!bulletGroups.some((g) => g.items.length && JSON.stringify(g.items) === JSON.stringify(v))) {
          leftover.push({ title: humanizeKey(k), items: pickStringArray(v) });
        }
      }
    }
    // Assign leftover into empty bullet slots
    let li = 0;
    for (const g of bulletGroups) {
      if (g.items.length === 0 && leftover[li]) {
        g.items = leftover[li].items;
        // keep catalog title
        li++;
      }
    }
    // Extra leftovers become extra groups
    while (li < leftover.length) {
      bulletGroups.push(leftover[li++]);
    }
  }

  const extraParagraphs = (insight.extraParagraphs ?? [])
    .map((p) => ({
      title: p.title,
      text: pickString(getByAliases(payload, ...p.aliases, p.title)),
    }))
    .filter((p) => p.text);

  const principles = principlesFrom(
    getByAliases(payload, "core_principles", "corePrinciples", "Core Principles"),
  );

  const sideA = asSide(getByAliases(payload, "side_a", "sideA", "Side A"));
  const sideB = asSide(getByAliases(payload, "side_b", "sideB", "Side B"));

  return {
    mainNarrative,
    bulletGroups: bulletGroups.filter((g) => g.items.length > 0),
    whyThisMatters,
    whyBothExist,
    extraParagraphs,
    principles,
    sideA,
    sideB,
  };
}

/** @deprecated */
export function viewFromPayload(payload: Record<string, unknown>) {
  const view = viewFromInsight(payload, {
    key: "generic",
    title: "",
    desc: "",
    anchorQuestion: "",
    layout: "narrative-3",
    bulletSections: [
      { title: "Section A", aliases: ["bullets_a", "items"] },
      { title: "Section B", aliases: ["bullets_b"] },
      { title: "Section C", aliases: ["bullets_c"] },
    ],
  });
  return {
    mainNarrative: view.mainNarrative,
    bulletsA: view.bulletGroups[0]?.items ?? [],
    bulletsB: view.bulletGroups[1]?.items ?? [],
    bulletsC: view.bulletGroups[2]?.items ?? [],
    whyThisMatters: view.whyThisMatters,
    whyBothExist: view.whyBothExist,
    principles: view.principles,
    sideA: view.sideA,
    sideB: view.sideB,
  };
}
