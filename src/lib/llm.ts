import { getServerEnv } from "@/lib/env";
import { getLangfuseClient } from "@/lib/langfuse";

interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

const TIMEOUT_MS = 180_000;
const LANGFUSE_CACHE_TTL_SECONDS = 60;
const LANGFUSE_FETCH_TIMEOUT_MS = 15_000;

const PLACEHOLDERS = [
  "input",
  "inputJson",
  "ast",
  "astJson",
  "AST",
  "humanOs",
  "human_os",
  "HumanOS",
  "identity",
  "profile",
  "userInput",
  "user_input",
  "humanOsProfile",
  "human_os_profile",
  "HumanOSProfile",
  "astProfile",
  "humanOsProfileA",
  "human_os_profile_a",
  "HumanOSProfileA",
  "humanOsProfileB",
  "human_os_profile_b",
  "HumanOSProfileB",
  "astA",
  "astB",
  "ASTA",
  "ASTB",
];

export function extractJson(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  }
  return trimmed;
}

/**
 * OpenAI JSON mode requires the word "json" somewhere in the messages.
 * Langfuse prompts often omit it, so we inject a short instruction when missing.
 */
function ensureJsonModeMessages(messages: LLMMessage[]): LLMMessage[] {
  const hasJsonWord = messages.some((m) => /\bjson\b/i.test(m.content));
  if (hasJsonWord) return messages;

  return [
    ...messages,
    {
      role: "user",
      content:
        "Return a single valid JSON object only. Do not include markdown fences or commentary outside the JSON.",
    },
  ];
}

export async function callOpenRouter(
  messages: LLMMessage[],
  temperature = 0.7,
  maxTokens = 16384,
): Promise<{ content: string; model: string }> {
  const env = getServerEnv();
  const finalMessages = ensureJsonModeMessages(messages);

  const response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": env.APP_URL,
      "X-Title": "Human OS Decoder",
    },
    body: JSON.stringify({
      model: env.OPENROUTER_MODEL,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" as const },
      messages: finalMessages,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`OpenRouter error: ${response.status} ${response.statusText} ${body}`);
  }

  const raw = (await response.json()) as OpenRouterResponse;
  if (raw.error?.message) {
    throw new Error(`OpenRouter API error: ${raw.error.message}`);
  }

  const content = raw.choices?.[0]?.message?.content ?? "";
  const model = raw.model ?? env.OPENROUTER_MODEL;
  if (!content.trim()) {
    throw new Error("OpenRouter returned an empty LLM response.");
  }

  return { content, model };
}

export function buildPromptVariables(payload: unknown): Record<string, string> {
  const json = JSON.stringify(payload, null, 2);
  const record =
    payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};

  const value = (...keys: string[]) => {
    for (const key of keys) {
      if (key in record && record[key] !== undefined && record[key] !== null) {
        return JSON.stringify(record[key], null, 2);
      }
    }
    return json;
  };

  const ast = value("ast", "AST", "astProfile");
  const humanOs = value("human_os", "humanOs", "humanOsProfile", "profile");
  const astA = value("astA", "ASTA", "ast_a");
  const astB = value("astB", "ASTB", "ast_b");
  const humanOsA = value("humanOsProfileA", "human_os_profile_a", "profileA", "humanOsA");
  const humanOsB = value("humanOsProfileB", "human_os_profile_b", "profileB", "humanOsB");

  const vars: Record<string, string> = {
    input: json,
    inputJson: json,
    ast,
    astJson: ast,
    AST: ast,
    humanOs,
    human_os: humanOs,
    HumanOS: humanOs,
    humanOsProfile: humanOs,
    human_os_profile: humanOs,
    HumanOSProfile: humanOs,
    astProfile: ast,
    humanOsProfileA: humanOsA,
    human_os_profile_a: humanOsA,
    HumanOSProfileA: humanOsA,
    humanOsProfileB: humanOsB,
    human_os_profile_b: humanOsB,
    HumanOSProfileB: humanOsB,
    astA,
    astB,
    ASTA: astA,
    ASTB: astB,
    identity: "identity" in record ? JSON.stringify(record.identity, null, 2) : json,
    profile: humanOs,
    userInput: json,
    user_input: json,
  };

  return vars;
}

function ensureMessage(message: unknown, promptName: string): LLMMessage {
  if (!message || typeof message !== "object") {
    throw new Error(`Langfuse prompt "${promptName}" compiled to an unresolved placeholder.`);
  }
  const candidate = message as { role?: unknown; content?: unknown };
  if (
    (candidate.role !== "system" &&
      candidate.role !== "user" &&
      candidate.role !== "assistant") ||
    typeof candidate.content !== "string"
  ) {
    throw new Error(`Langfuse prompt "${promptName}" compiled to an invalid chat message.`);
  }
  const content = candidate.content.trim();
  if (!content) {
    throw new Error(`Langfuse prompt "${promptName}" contains an empty message.`);
  }
  return { role: candidate.role, content };
}

export async function buildLangfuseMessages(
  promptName: string,
  payload: unknown,
): Promise<LLMMessage[]> {
  const langfuse = getLangfuseClient();
  const promptClient = await langfuse.getPrompt(promptName, undefined, {
    type: "chat",
    cacheTtlSeconds: LANGFUSE_CACHE_TTL_SECONDS,
    fetchTimeoutMs: LANGFUSE_FETCH_TIMEOUT_MS,
    maxRetries: 1,
  });

  if (promptClient.isFallback) {
    throw new Error(`Langfuse prompt "${promptName}" resolved to a fallback prompt.`);
  }

  const variables = buildPromptVariables(payload);
  const inputMessage = variables.input;
  const placeholders: Record<string, LLMMessage[]> = Object.fromEntries(
    PLACEHOLDERS.map((name) => [
      name,
      [{ role: "user" as const, content: variables[name] ?? inputMessage }],
    ]),
  );

  const compiled = (
    promptClient as {
      compile: (
        variables?: Record<string, string>,
        placeholders?: Record<string, LLMMessage[]>,
      ) => string | unknown[];
    }
  ).compile(variables, placeholders);

  const messages =
    typeof compiled === "string"
      ? [{ role: "system" as const, content: compiled.trim() }]
      : compiled.map((m) => ensureMessage(m, promptName));

  if (messages.length === 0 || messages.every((m) => !m.content.trim())) {
    throw new Error(`Langfuse prompt "${promptName}" compiled to no usable messages.`);
  }

  const promptContainsInput = messages.some((m) => m.content.includes(inputMessage));
  if (!promptContainsInput) {
    messages.push({ role: "user", content: inputMessage });
  }

  return messages;
}

export async function runJsonPrompt(
  promptName: string,
  payload: unknown,
  temperature = 0.7,
  options?: { outputContract?: string; retries?: number },
): Promise<{ data: unknown; model: string; promptName: string }> {
  const attempts = Math.max(0, options?.retries ?? 0) + 1;
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const messages = await buildLangfuseMessages(promptName, payload);

      if (options?.outputContract?.trim()) {
        messages.push({
          role: "user",
          content: options.outputContract.trim(),
        });
      }
      if (attempt > 0) {
        messages.push({
          role: "user",
          content: "Your previous response was invalid. Return only a complete JSON object matching the required output contract.",
        });
      }

      const { content, model } = await callOpenRouter(messages, temperature);
      let parsed: unknown;
      try {
        parsed = JSON.parse(extractJson(content));
      } catch {
        throw new Error(`Prompt "${promptName}" returned invalid JSON.`);
      }
      return { data: parsed, model, promptName };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Prompt "${promptName}" failed.`);
}
