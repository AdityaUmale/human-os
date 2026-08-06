import { prisma } from "@/lib/prisma";
import { getPromptNames } from "@/lib/langfuse";
import { runJsonPrompt } from "@/lib/llm";
import {
  DOMAIN_CATALOG,
  getDomain,
  type DomainKey,
} from "@/lib/catalog/domains";
import {
  fillInsightsFromProfile,
  isInsightPayloadUsable,
  normalizeDomainBundle,
} from "@/lib/human-os/schemas";
import { buildDomainOutputContract } from "@/lib/human-os/output-schema";

export async function renderDomainInsights(userId: string, domainKey: DomainKey) {
  const domain = getDomain(domainKey);
  if (!domain) throw new Error(`Unknown domain: ${domainKey}`);
  if (!domain.available) {
    throw new Error(`Domain "${domainKey}" is disabled (no Langfuse prompt configured).`);
  }

  const humanOs = await prisma.humanOsProfile.findUnique({
    where: { userId },
    include: { astSnapshot: true },
  });

  if (!humanOs || humanOs.status !== "COMPLETED" || !humanOs.profile || !humanOs.astSnapshot) {
    throw new Error("Human OS profile is not ready.");
  }

  const profile =
    typeof humanOs.profile === "string"
      ? JSON.parse(humanOs.profile)
      : (humanOs.profile as Record<string, unknown>);

  // Pass full profile (renderers may use other domains for context)
  const promptInput = {
    human_os: profile,
    humanOsProfile: profile,
    profile,
    ast: humanOs.astSnapshot.payload,
    AST: humanOs.astSnapshot.payload,
    [domain.profileKey]: profile[domain.profileKey] ?? null,
    // also top-level for prompts that expect flat input
    ...profile,
  };

  const prompts = getPromptNames();
  const promptName =
    (prompts as Record<string, string>)[domain.promptEnvKey] ?? domain.defaultPromptName;

  console.info(`[domain-render] ${domainKey} via prompt "${promptName}"`);

  const rendered = await runJsonPrompt(promptName, promptInput, 0.5, {
    outputContract: buildDomainOutputContract(domain),
  });
  const rawTopKeys =
    rendered.data && typeof rendered.data === "object"
      ? Object.keys(rendered.data as object)
      : [];

  console.info(`[domain-render] ${domainKey} top keys:`, rawTopKeys);

  let bundle = normalizeDomainBundle(rendered.data, domain.insights);
  console.info(`[domain-render] ${domainKey} normalized:`, Object.keys(bundle));

  // Always backfill missing/broken insights from stored Human OS profile
  const domainSlice = profile[domain.profileKey];
  bundle = fillInsightsFromProfile(domainSlice, domain.insights, bundle);
  console.info(`[domain-render] ${domainKey} after profile fill:`, Object.keys(bundle));

  const rawSnippet =
    rendered.data && typeof rendered.data === "object"
      ? JSON.stringify(rendered.data).slice(0, 2000)
      : String(rendered.data ?? "").slice(0, 2000);

  await prisma.insightRender.deleteMany({
    where: { userId, domain: domainKey, humanOsId: humanOs.id },
  });

  const created: string[] = [];

  for (const insight of domain.insights) {
    let payload: Record<string, unknown> = bundle[insight.key] ?? {};

    if (isInsightPayloadUsable(payload)) {
      created.push(insight.key);
    } else {
      // Last resort: still try profile-only synthesis for this key alone
      const filled = fillInsightsFromProfile(domainSlice, [insight], {});
      if (isInsightPayloadUsable(filled[insight.key] ?? {})) {
        payload = filled[insight.key];
        created.push(insight.key);
      } else {
        payload = {
          title: insight.title,
          anchorQuestion: insight.anchorQuestion,
          mainNarrative:
            "This insight could not be fully structured from the model response. Use Re-render on this domain.",
          whyThisMatters: "",
          _rawKeys: Object.keys(bundle),
          _debugTopKeys: rawTopKeys,
          _rawSnippet: rawSnippet,
        };
      }
    }

    await prisma.insightRender.create({
      data: {
        userId,
        humanOsId: humanOs.id,
        domain: domainKey,
        insightKey: insight.key,
        layout: insight.layout,
        payload: payload as object,
        model: rendered.model,
        promptName: rendered.promptName,
      },
    });
  }

  return {
    domain: domainKey,
    model: rendered.model,
    renderedKeys: created,
    rawTopKeys,
  };
}

export async function renderIdentityInsights(userId: string) {
  return renderDomainInsights(userId, "identity");
}

/**
 * Render every *available* domain. Energy (and any available:false) is skipped.
 */
export async function renderAllDomains(userId: string) {
  const results: Array<{ domain: string; ok: boolean; error?: string; renderedKeys?: string[] }> =
    [];

  for (const domain of DOMAIN_CATALOG.filter((d) => d.available)) {
    try {
      const r = await renderDomainInsights(userId, domain.key);
      results.push({ domain: domain.key, ok: true, renderedKeys: r.renderedKeys });
    } catch (e) {
      const message = e instanceof Error ? e.message : "render failed";
      console.error(`[domain-render] ${domain.key} failed:`, message);
      results.push({ domain: domain.key, ok: false, error: message });
    }
  }

  return results;
}
