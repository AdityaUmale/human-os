import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  OPENROUTER_MODEL: z.string().default("openai/gpt-4o"),
  LANGFUSE_PUBLIC_KEY: z.string().min(1),
  LANGFUSE_SECRET_KEY: z.string().min(1),
  LANGFUSE_BASE_URL: z.string().url(),
  LANGFUSE_PROMPT_HUMAN_OS_COMPILER: z.string().default("HUMAN OS COMPILER v1.0"),
  LANGFUSE_PROMPT_IDENTITY_RENDERER: z.string().default("Identity Renderer v1.0"),
  LANGFUSE_PROMPT_MIND_RENDERER: z.string().default("Mind Renderer v1.0"),
  LANGFUSE_PROMPT_EMOTIONS_RENDERER: z.string().default("Emotions Renderer v1.0"),
  LANGFUSE_PROMPT_RELATIONSHIPS_RENDERER: z.string().default("Relationship Renderer v1.0"),
  LANGFUSE_PROMPT_ENERGY_RENDERER: z.string().default("Energy Renderer v1.0"),
  LANGFUSE_PROMPT_WORK_RENDERER: z.string().default("Work Renderer v1.0"),
  LANGFUSE_PROMPT_GROWTH_RENDERER: z.string().default("Growth Renderer v1.0"),
  LANGFUSE_PROMPT_SEASON_RENDERER: z.string().default("Season Renderer v1.0"),
  LANGFUSE_PROMPT_PARTNER_RENDERER: z.string().min(1),
  LANGFUSE_PROMPT_BOSS_RENDERER: z.string().min(1),
  LANGFUSE_PROMPT_PARENT_RENDERER: z.string().min(1),
  LANGFUSE_PROMPT_CHILD_RENDERER: z.string().min(1),
  LANGFUSE_PROMPT_EMPLOYEE_RENDERER: z.string().min(1),
  LANGFUSE_PROMPT_COLLEAGUE_RENDERER: z.string().min(1),
  LANGFUSE_PROMPT_LOVE_COMPAT_RENDERER: z.string().min(1),
  LANGFUSE_PROMPT_WORK_COMPAT_RENDERER: z.string().min(1),
  SESSION_SECRET: z.string().min(16),
  APP_URL: z.string().url().default("http://localhost:3000"),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o",
    LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY,
    LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY,
    LANGFUSE_BASE_URL: process.env.LANGFUSE_BASE_URL,
    LANGFUSE_PROMPT_HUMAN_OS_COMPILER:
      process.env.LANGFUSE_PROMPT_HUMAN_OS_COMPILER ?? "HUMAN OS COMPILER v1.0",
    LANGFUSE_PROMPT_IDENTITY_RENDERER:
      process.env.LANGFUSE_PROMPT_IDENTITY_RENDERER ?? "Identity Renderer v1.0",
    LANGFUSE_PROMPT_MIND_RENDERER:
      process.env.LANGFUSE_PROMPT_MIND_RENDERER ?? "Mind Renderer v1.0",
    LANGFUSE_PROMPT_EMOTIONS_RENDERER:
      process.env.LANGFUSE_PROMPT_EMOTIONS_RENDERER ?? "Emotions Renderer v1.0",
    LANGFUSE_PROMPT_RELATIONSHIPS_RENDERER:
      process.env.LANGFUSE_PROMPT_RELATIONSHIPS_RENDERER ?? "Relationship Renderer v1.0",
    LANGFUSE_PROMPT_ENERGY_RENDERER:
      process.env.LANGFUSE_PROMPT_ENERGY_RENDERER ?? "Energy Renderer v1.0",
    LANGFUSE_PROMPT_WORK_RENDERER:
      process.env.LANGFUSE_PROMPT_WORK_RENDERER ?? "Work Renderer v1.0",
    LANGFUSE_PROMPT_GROWTH_RENDERER:
      process.env.LANGFUSE_PROMPT_GROWTH_RENDERER ?? "Growth Renderer v1.0",
    LANGFUSE_PROMPT_SEASON_RENDERER:
      process.env.LANGFUSE_PROMPT_SEASON_RENDERER ?? "Season Renderer v1.0",
    LANGFUSE_PROMPT_PARTNER_RENDERER: process.env.LANGFUSE_PROMPT_PARTNER_RENDERER ?? "Partner Decoder Renderer",
    LANGFUSE_PROMPT_BOSS_RENDERER: process.env.LANGFUSE_PROMPT_BOSS_RENDERER ?? "Boss Decoder Renderer",
    LANGFUSE_PROMPT_PARENT_RENDERER: process.env.LANGFUSE_PROMPT_PARENT_RENDERER ?? "Parent Decoder Renderer",
    LANGFUSE_PROMPT_CHILD_RENDERER: process.env.LANGFUSE_PROMPT_CHILD_RENDERER ?? "Child Decoder Renderer",
    LANGFUSE_PROMPT_EMPLOYEE_RENDERER: process.env.LANGFUSE_PROMPT_EMPLOYEE_RENDERER ?? "Employee Decoder Renderer",
    LANGFUSE_PROMPT_COLLEAGUE_RENDERER: process.env.LANGFUSE_PROMPT_COLLEAGUE_RENDERER ?? "Colleague Decoder Renderer",
    LANGFUSE_PROMPT_LOVE_COMPAT_RENDERER: process.env.LANGFUSE_PROMPT_LOVE_COMPAT_RENDERER ?? "Love Compatibility Renderer",
    LANGFUSE_PROMPT_WORK_COMPAT_RENDERER: process.env.LANGFUSE_PROMPT_WORK_COMPAT_RENDERER ?? "Work Compatibility Renderer",
    SESSION_SECRET: process.env.SESSION_SECRET,
    APP_URL: process.env.APP_URL ?? "http://localhost:3000",
  });

  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid server environment: ${message}`);
  }

  cached = parsed.data;
  return cached;
}

export function hasServerEnv() {
  return Boolean(
    process.env.DATABASE_URL &&
      process.env.OPENROUTER_API_KEY &&
      process.env.LANGFUSE_PUBLIC_KEY &&
      process.env.LANGFUSE_SECRET_KEY &&
      process.env.LANGFUSE_BASE_URL &&
      process.env.SESSION_SECRET,
  );
}
