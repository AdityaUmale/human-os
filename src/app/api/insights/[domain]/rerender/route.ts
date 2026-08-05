import { NextResponse } from "next/server";
import { isDomainKey } from "@/lib/catalog/domains";
import { renderDomainInsights } from "@/lib/human-os/domain-render";
import { requireUser } from "@/lib/session";

export const maxDuration = 300;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Start domain re-render. Returns immediately so the browser never sees an empty body
 * from a long-running LLM call timing out mid-response.
 *
 * Query ?wait=1 to run synchronously (debug only; can take 1–2+ minutes).
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ domain: string }> },
) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { domain } = await context.params;
    if (!isDomainKey(domain)) {
      return NextResponse.json({ error: "Unknown domain" }, { status: 404 });
    }

    const wait = new URL(request.url).searchParams.get("wait") === "1";

    if (wait) {
      const result = await renderDomainInsights(user.id, domain);
      return NextResponse.json({ ok: true, mode: "sync", ...result });
    }

    // Fire-and-forget background render
    void renderDomainInsights(user.id, domain)
      .then((result) => {
        console.info(`[insights/${domain}/rerender] done`, result.renderedKeys);
      })
      .catch((error) => {
        console.error(
          `[insights/${domain}/rerender] failed`,
          error instanceof Error ? error.message : error,
        );
      });

    return NextResponse.json({
      ok: true,
      mode: "async",
      status: "STARTED",
      domain,
      message: "Re-render started. Poll status or refresh the page in about a minute.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rerender failed";
    console.error("[insights/rerender]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
