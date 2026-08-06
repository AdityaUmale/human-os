import { describe, expect, it } from "vitest";
import { buildPromptVariables, getOpenRouterMaxTokens } from "@/lib/llm";

describe("Langfuse prompt variables", () => {
  it("keeps Human OS and AST inputs separate", () => {
    const vars = buildPromptVariables({ humanOsProfile: { identity: { answer: "profile" } }, ast: { sun: "chart" } });
    expect(JSON.parse(vars.humanOsProfile)).toEqual({ identity: { answer: "profile" } });
    expect(JSON.parse(vars.ast)).toEqual({ sun: "chart" });
    expect(vars.input).toContain("profile");
    expect(vars.input).toContain("chart");
  });

  it("keeps both interaction profiles and charts distinct", () => {
    const vars = buildPromptVariables({ humanOsProfileA: { id: "a" }, humanOsProfileB: { id: "b" }, astA: { id: "ast-a" }, astB: { id: "ast-b" } });
    expect(JSON.parse(vars.humanOsProfileA)).toEqual({ id: "a" });
    expect(JSON.parse(vars.humanOsProfileB)).toEqual({ id: "b" });
    expect(JSON.parse(vars.astA)).toEqual({ id: "ast-a" });
    expect(JSON.parse(vars.astB)).toEqual({ id: "ast-b" });
  });

  it("keeps the default completion request within a small OpenRouter balance", () => {
    expect(getOpenRouterMaxTokens()).toBeLessThanOrEqual(3_000);
  });
});
