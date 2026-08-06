import type { DecodeKind } from "@prisma/client";

export type PeopleDecoderType =
  | "PARTNER"
  | "BOSS"
  | "PARENT"
  | "CHILD"
  | "EMPLOYEE"
  | "COLLEAGUE";

export type InteractionType = "LOVE_COMPAT" | "WORK_COMPAT";
export type DecodeType = PeopleDecoderType | InteractionType;
export type DecodeStatus = "GENERATING" | "COMPLETED" | "FAILED";
export type ParticipantSummary = { id: string; name: string; kind: "SELF" | "PERSON" };
export type LockedInsightSummary = {
  id: string;
  insightKey: string;
  title: string;
  description: string;
  unlockCost: number;
  unlockedAt: string | Date | null;
};

export type DecodeInsightMeta = {
  key: string;
  title: string;
  description: string;
  readTime: string;
  layout: string;
};

export type DecodeCatalog = {
  kind: DecodeType;
  title: string;
  subtitle: string;
  promptKey: keyof ReturnType<typeof import("@/lib/langfuse").getPromptNames>;
  insights: DecodeInsightMeta[];
};

const people = (
  kind: PeopleDecoderType,
  title: string,
  subtitle: string,
  promptKey: DecodeCatalog["promptKey"],
  insights: Array<[string, string, string, string]>,
): DecodeCatalog => ({
  kind,
  title,
  subtitle,
  promptKey,
  insights: insights.map(([key, insightTitle, description, readTime], ordinal) => ({
    key,
    title: insightTitle,
    description,
    readTime,
    layout: `people-${kind.toLowerCase()}-${ordinal + 1}`,
  })),
});

const interaction = (
  kind: InteractionType,
  title: string,
  subtitle: string,
  promptKey: DecodeCatalog["promptKey"],
  insights: Array<[string, string, string, string]>,
): DecodeCatalog => ({
  kind,
  title,
  subtitle,
  promptKey,
  insights: insights.map(([key, insightTitle, description, readTime], ordinal) => ({
    key,
    title: insightTitle,
    description,
    readTime,
    layout: `interaction-${kind.toLowerCase()}-${ordinal + 1}`,
  })),
});

export const DECODE_CATALOG: Record<DecodeType, DecodeCatalog> = {
  PARTNER: people("PARTNER", "Partner Decoder", "Understand how they love, communicate and navigate relationships.", "PARTNER_RENDERER", [
    ["relationship-signature", "Relationship Signature", "A concise overview of how they love, communicate and experience relationships.", "~2 min read"],
    ["core-relationship-wiring", "Core Relationship Wiring", "Understand the invisible patterns that shape how they build trust and express affection.", "~3 min read"],
    ["relationship-mirror", "Relationship Mirror", "Discover what it consistently feels like to build a relationship with this person.", "~3 min read"],
    ["loving-them-well", "Loving Them Well", "Practical guidance for building trust and communicating better.", "~2 min read"],
  ]),
  BOSS: people("BOSS", "Boss Decoder", "Understand how they lead, communicate and make decisions.", "BOSS_RENDERER", [
    ["leadership-signature", "Leadership Signature", "A concise overview of how this leader naturally operates.", "~2 min read"],
    ["core-leadership-wiring", "Core Leadership Wiring", "The operating systems that drive this leader.", "~3 min read"],
    ["behaviour-mirror", "Behaviour Mirror", "See what working with this leader consistently feels like.", "~3 min read"],
    ["working-with-them", "Working With Them", "Practical guidance for succeeding under this leader.", "~2 min read"],
  ]),
  PARENT: people("PARENT", "Parent Decoder", "Understand what it is like to have this person as a parent.", "PARENT_RENDERER", [
    ["parenting-signature", "Parenting Signature", "A concise overview of how they parent.", "~2 min read"],
    ["core-parenting-wiring", "Core Parenting Wiring", "The patterns that shape how they raise and protect.", "~3 min read"],
    ["parenting-mirror", "Parenting Mirror", "Discover what it consistently feels like to be raised by them.", "~3 min read"],
    ["relating-with-them-well", "Relating With Them Well", "Practical guidance for communicating and repairing with them.", "~2 min read"],
  ]),
  CHILD: people("CHILD", "Child Decoder", "Understand how to support this child through their Human OS.", "CHILD_RENDERER", [
    ["child-signature", "Child Signature", "A concise overview of how this child naturally develops.", "~2 min read"],
    ["development-wiring", "Development Wiring", "The patterns that shape how they learn and grow.", "~3 min read"],
    ["parenting-mirror", "Parenting Mirror", "See what supporting this child consistently requires.", "~3 min read"],
    ["raising-them-well", "Raising Them Well", "Practical guidance for helping this child thrive.", "~2 min read"],
  ]),
  EMPLOYEE: people("EMPLOYEE", "Employee Decoder", "Understand how this person works, grows and performs.", "EMPLOYEE_RENDERER", [
    ["employee-signature", "Employee Signature", "A concise overview of how this person naturally works.", "~2 min read"],
    ["core-work-wiring", "Core Work Wiring", "The operating systems that drive their performance.", "~3 min read"],
    ["work-mirror", "Work Mirror", "Discover what managing this person consistently feels like.", "~3 min read"],
    ["managing-them-well", "Managing Them Well", "Practical guidance for helping them perform and grow.", "~2 min read"],
  ]),
  COLLEAGUE: people("COLLEAGUE", "Colleague Decoder", "Understand how this person collaborates, communicates and contributes.", "COLLEAGUE_RENDERER", [
    ["collaboration-signature", "Collaboration Signature", "A concise overview of how they work alongside others.", "~2 min read"],
    ["core-collaboration-wiring", "Core Collaboration Wiring", "The patterns that shape how they contribute.", "~3 min read"],
    ["collaboration-mirror", "Collaboration Mirror", "Discover what working with this colleague consistently feels like.", "~3 min read"],
    ["working-together", "Working Together", "Practical guidance for collaborating more effectively.", "~2 min read"],
  ]),
  LOVE_COMPAT: interaction("LOVE_COMPAT", "Love Compatibility", "Understand the strengths, friction and natural dynamics between two people.", "LOVE_COMPAT_RENDERER", [
    ["strengths", "Strengths", "Discover where these two Human OS profiles naturally complement one another.", "~3 min read"],
    ["friction-points", "Friction Points", "Reveal recurring misunderstandings and conflict patterns.", "~3 min read"],
    ["growing-together", "Growing Together", "Practical guidance for building a healthier relationship.", "~2 min read"],
  ]),
  WORK_COMPAT: interaction("WORK_COMPAT", "Work Compatibility", "Understand how two people collaborate, communicate and perform together.", "WORK_COMPAT_RENDERER", [
    ["strengths", "Strengths", "Discover where these two Human OS profiles naturally complement one another at work.", "~3 min read"],
    ["friction-points", "Friction Points", "Reveal recurring misunderstandings and collaboration friction.", "~3 min read"],
    ["working-better-together", "Working Better Together", "Practical guidance for collaborating more effectively.", "~2 min read"],
  ]),
};

export function getDecodeCatalog(kind: DecodeType): DecodeCatalog {
  return DECODE_CATALOG[kind];
}

export function isDecodeType(value: string): value is DecodeType {
  return Object.prototype.hasOwnProperty.call(DECODE_CATALOG, value);
}

export function isPeopleDecoderType(value: string): value is PeopleDecoderType {
  return ["PARTNER", "BOSS", "PARENT", "CHILD", "EMPLOYEE", "COLLEAGUE"].includes(value);
}

export function isInteractionType(value: string): value is InteractionType {
  return ["LOVE_COMPAT", "WORK_COMPAT"].includes(value);
}

export function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function decodeIdentityKey(kind: DecodeType, primary: string, secondary?: string) {
  if (!secondary) return `people:${kind}:${primary}`;
  const [a, b] = canonicalPair(primary, secondary);
  return `interaction:${kind}:${a}:${b}`;
}

export function prismaDecodeKind(kind: DecodeType): DecodeKind {
  return kind as DecodeKind;
}
