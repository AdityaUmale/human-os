import { computeChart } from "@/lib/astrology/compute-chart";
import {
  canonicalPair,
  decodeIdentityKey,
  getDecodeCatalog,
  isInteractionType,
  isPeopleDecoderType,
  prismaDecodeKind,
  type DecodeType,
  type InteractionType,
  type PeopleDecoderType,
} from "@/lib/decodes/catalog";
import { buildDecodeOutputContract, normalizeDecodeBundle } from "@/lib/decodes/contracts";
import { prisma } from "@/lib/prisma";
import { getPromptNames } from "@/lib/langfuse";
import { runJsonPrompt } from "@/lib/llm";
import { humanOsProfileSchema } from "@/lib/human-os/schemas";
import type { Prisma } from "@prisma/client";

export type BirthDetailsInput = {
  fullName: string;
  dateOfBirth: string;
  timeOfBirth: string | null;
  timeUnknown: boolean;
  placeName: string;
  lat: number;
  lng: number;
  timezone: string;
};

export class DecodeServiceError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "DecodeServiceError";
  }
}

export function birthFingerprint(input: BirthDetailsInput) {
  const time = input.timeUnknown ? "unknown" : input.timeOfBirth || "00:00";
  return [
    input.fullName.trim().toLowerCase().replace(/\s+/g, " "),
    input.dateOfBirth,
    time,
    input.placeName.trim().toLowerCase().replace(/\s+/g, " "),
    input.lat.toFixed(5),
    input.lng.toFixed(5),
    input.timezone,
  ].join("|");
}

function chartTime(birth: BirthDetailsInput) {
  if (birth.timeUnknown || !birth.timeOfBirth) return "12:00:00";
  return birth.timeOfBirth.length === 5 ? `${birth.timeOfBirth}:00` : birth.timeOfBirth;
}

function jsonObject(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function ensureSelfSubject(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
  if (!user) throw new DecodeServiceError("NOT_FOUND", "User not found.");
  return prisma.subject.upsert({
    where: { sourceUserId: userId },
    create: {
      ownerUserId: userId,
      sourceUserId: userId,
      kind: "SELF",
      displayName: user.name || "You",
    },
    update: { displayName: user.name || "You" },
  });
}

export async function createPersonDecode(userId: string, kind: PeopleDecoderType, birth: BirthDetailsInput) {
  if (!isPeopleDecoderType(kind)) throw new DecodeServiceError("INVALID_TYPE", "Unknown People decoder.");
  const fingerprint = birthFingerprint(birth);
  const catalog = getDecodeCatalog(kind);

  const existingSubject = await prisma.subject.findFirst({
    where: {
      ownerUserId: userId,
      kind: "PERSON",
      birthDetails: { is: { fingerprint } },
    },
  });

  const subject = existingSubject ?? (await prisma.subject.create({
    data: {
      ownerUserId: userId,
      kind: "PERSON",
      displayName: birth.fullName.trim(),
      birthDetails: {
        create: {
          ...birth,
          fingerprint,
          timeOfBirth: birth.timeUnknown ? null : birth.timeOfBirth,
        },
      },
    },
  }));

  const identityKey = decodeIdentityKey(kind, subject.id);
  const existingDecode = await prisma.decode.findUnique({
    where: { ownerUserId_identityKey: { ownerUserId: userId, identityKey } },
  });
  if (existingDecode) return { subjectId: subject.id, decodeId: existingDecode.id, reused: true };

  const decode = await prisma.decode.create({
    data: {
      ownerUserId: userId,
      kind: prismaDecodeKind(kind),
      identityKey,
      primarySubjectId: subject.id,
      status: "GENERATING",
    },
  });
  console.info(`[decode] created ${catalog.title}`, decode.id);
  return { subjectId: subject.id, decodeId: decode.id, reused: false };
}

export async function createLensDecode(userId: string, subjectId: string, kind: PeopleDecoderType) {
  if (!isPeopleDecoderType(kind)) throw new DecodeServiceError("INVALID_TYPE", "Unknown People decoder.");
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, ownerUserId: userId, kind: "PERSON" } });
  if (!subject) throw new DecodeServiceError("NOT_FOUND", "Person not found.");
  const identityKey = decodeIdentityKey(kind, subject.id);
  const existing = await prisma.decode.findUnique({
    where: { ownerUserId_identityKey: { ownerUserId: userId, identityKey } },
  });
  if (existing) return { subjectId, decodeId: existing.id, reused: true };
  const decode = await prisma.decode.create({
    data: {
      ownerUserId: userId,
      kind: prismaDecodeKind(kind),
      identityKey,
      primarySubjectId: subject.id,
      status: "GENERATING",
    },
  });
  return { subjectId, decodeId: decode.id, reused: false };
}

export async function createInteractionDecode(userId: string, kind: InteractionType, subjectAId: string, subjectBId: string) {
  if (!isInteractionType(kind)) throw new DecodeServiceError("INVALID_TYPE", "Unknown Interaction type.");
  if (subjectAId === subjectBId) throw new DecodeServiceError("SAME_SUBJECT", "Choose two different people.");

  const [a, b] = canonicalPair(subjectAId, subjectBId);
  const subjects = await prisma.subject.findMany({ where: { ownerUserId: userId, id: { in: [a, b] } } });
  if (subjects.length !== 2) throw new DecodeServiceError("NOT_FOUND", "One or both people could not be found.");

  const identityKey = decodeIdentityKey(kind, a, b);
  const existing = await prisma.decode.findUnique({
    where: { ownerUserId_identityKey: { ownerUserId: userId, identityKey } },
  });
  if (existing) return { decodeId: existing.id, reused: true };

  const decode = await prisma.decode.create({
    data: {
      ownerUserId: userId,
      kind: prismaDecodeKind(kind),
      identityKey,
      primarySubjectId: a,
      secondarySubjectId: b,
      status: "GENERATING",
    },
  });
  return { decodeId: decode.id, reused: false };
}

const subjectGenerationLocks = new Map<string, Promise<{ profile: Record<string, unknown>; ast: Record<string, unknown> }>>();

async function generatePersonHumanOsWork(subjectId: string) {
  const subject = await prisma.subject.findFirst({
    where: { id: subjectId, kind: "PERSON" },
    include: { birthDetails: true, humanOs: { include: { astSnapshot: true } } },
  });
  if (!subject?.birthDetails) throw new DecodeServiceError("NOT_READY", "Birth details are missing.");
  if (subject.humanOs?.status === "COMPLETED" && subject.humanOs.profile && subject.humanOs.astSnapshot) {
    return { profile: subject.humanOs.profile as Record<string, unknown>, ast: subject.humanOs.astSnapshot.payload as Record<string, unknown> };
  }

  const birth = subject.birthDetails;
  const chart = await computeChart({
    date: birth.dateOfBirth,
    time: chartTime(birth),
    lat: birth.lat,
    lng: birth.lng,
    city: birth.placeName,
    timezone: birth.timezone,
    timeAccuracy: birth.timeUnknown ? "unknown" : "exact",
    uncertaintyMinutes: birth.timeUnknown ? 360 : null,
    timeSource: birth.timeUnknown ? "unknown" : "user",
  });
  const ast = await prisma.subjectAstSnapshot.create({ data: { subjectId, payload: jsonObject(chart) } });

  const prompts = getPromptNames();
  const compiled = await runJsonPrompt(prompts.HUMAN_OS_COMPILER, chart, 0.5, { retries: 1 });
  const profile = humanOsProfileSchema.parse(compiled.data);
  const existing = await prisma.subjectHumanOsProfile.findUnique({ where: { subjectId } });
  if (existing) {
    await prisma.subjectHumanOsProfile.update({
      where: { id: existing.id },
      data: { astSnapshotId: ast.id, profile: jsonObject(profile), model: compiled.model, promptName: compiled.promptName, status: "COMPLETED", completedAt: new Date(), error: null },
    });
  } else {
    await prisma.subjectHumanOsProfile.create({
      data: { subjectId, astSnapshotId: ast.id, profile: jsonObject(profile), model: compiled.model, promptName: compiled.promptName, status: "COMPLETED", completedAt: new Date() },
    });
  }
  return { profile: profile as Record<string, unknown>, ast: chart as Record<string, unknown> };
}

async function generatePersonHumanOs(subjectId: string) {
  const existing = subjectGenerationLocks.get(subjectId);
  if (existing) return existing;
  const work = generatePersonHumanOsWork(subjectId).finally(() => subjectGenerationLocks.delete(subjectId));
  subjectGenerationLocks.set(subjectId, work);
  return work;
}

async function loadSubjectContext(userId: string, subjectId: string) {
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, ownerUserId: userId } });
  if (!subject) throw new DecodeServiceError("NOT_FOUND", "Subject not found.");
  if (subject.kind === "PERSON") return generatePersonHumanOs(subject.id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { humanOs: { include: { astSnapshot: true } } },
  });
  if (!user?.humanOs || user.humanOs.status !== "COMPLETED" || !user.humanOs.profile || !user.humanOs.astSnapshot) {
    throw new DecodeServiceError("NOT_READY", "Your Human OS is not ready.");
  }
  return { profile: user.humanOs.profile as Record<string, unknown>, ast: user.humanOs.astSnapshot.payload as Record<string, unknown> };
}

async function renderDecode(decodeId: string) {
  const decode = await prisma.decode.findUnique({
    where: { id: decodeId },
    include: { primarySubject: true, secondarySubject: true },
  });
  if (!decode) throw new DecodeServiceError("NOT_FOUND", "Decode not found.");
  const catalog = getDecodeCatalog(decode.kind as DecodeType);
  const prompts = getPromptNames();

  try {
    let rendered: { data: unknown; model: string; promptName: string };
    if (decode.secondarySubjectId && isInteractionType(decode.kind)) {
      const [a, b] = await Promise.all([
        loadSubjectContext(decode.ownerUserId, decode.primarySubjectId),
        loadSubjectContext(decode.ownerUserId, decode.secondarySubjectId),
      ]);
      rendered = await runJsonPrompt(
        prompts[catalog.promptKey],
        { humanOsProfileA: a.profile, humanOsProfileB: b.profile, astA: a.ast, astB: b.ast },
        0.5,
        { outputContract: buildDecodeOutputContract(catalog), retries: 1 },
      );
    } else if (isPeopleDecoderType(decode.kind)) {
      const context = await loadSubjectContext(decode.ownerUserId, decode.primarySubjectId);
      rendered = await runJsonPrompt(
        prompts[catalog.promptKey],
        { humanOsProfile: context.profile, ast: context.ast, profile: context.profile },
        0.5,
        { outputContract: buildDecodeOutputContract(catalog), retries: 1 },
      );
    } else {
      throw new DecodeServiceError("INVALID_TYPE", "Unsupported decode type.");
    }

    const bundle = normalizeDecodeBundle(rendered.data, catalog);
    await prisma.$transaction(async (tx) => {
      await tx.decodeInsight.deleteMany({ where: { decodeId } });
      await tx.decodeInsight.createMany({
        data: catalog.insights.map((insight, ordinal) => ({
          decodeId,
          insightKey: insight.key,
          ordinal,
          title: insight.title,
          description: insight.description,
          layout: insight.layout,
          payload: jsonObject(bundle[insight.key]),
          unlockCost: 2,
        })),
      });
      await tx.decode.update({
        where: { id: decodeId },
        data: { status: "COMPLETED", model: rendered.model, promptName: rendered.promptName, completedAt: new Date(), error: null },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Decode generation failed.";
    await prisma.decode.update({ where: { id: decodeId }, data: { status: "FAILED", error: message } }).catch(() => undefined);
    throw error;
  }
}

export async function generateDecode(decodeId: string) {
  const decode = await prisma.decode.findUnique({ where: { id: decodeId } });
  if (!decode) throw new DecodeServiceError("NOT_FOUND", "Decode not found.");
  if (decode.status === "COMPLETED") return;
  if (isPeopleDecoderType(decode.kind)) await generatePersonHumanOs(decode.primarySubjectId);
  await renderDecode(decodeId);
}

export async function getOwnedDecode(userId: string, decodeId: string) {
  return prisma.decode.findFirst({
    where: { id: decodeId, ownerUserId: userId },
    include: {
      primarySubject: true,
      secondarySubject: true,
      insights: { orderBy: { ordinal: "asc" } },
    },
  });
}

export async function listPeople(userId: string) {
  return prisma.subject.findMany({
    where: { ownerUserId: userId, kind: "PERSON" },
    include: {
      birthDetails: true,
      primaryDecodes: { where: { kind: { in: ["PARTNER", "BOSS", "PARENT", "CHILD", "EMPLOYEE", "COLLEAGUE"] } }, orderBy: { createdAt: "asc" }, include: { insights: { select: { id: true, unlockedAt: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function retryDecode(userId: string, decodeId: string) {
  const decode = await prisma.decode.findFirst({ where: { id: decodeId, ownerUserId: userId } });
  if (!decode) throw new DecodeServiceError("NOT_FOUND", "Decode not found.");
  if (decode.status !== "FAILED") return decode;
  return prisma.decode.update({ where: { id: decode.id }, data: { status: "GENERATING", error: null } });
}

export async function listInteractions(userId: string) {
  return prisma.decode.findMany({
    where: { ownerUserId: userId, kind: { in: ["LOVE_COMPAT", "WORK_COMPAT"] } },
    include: { primarySubject: true, secondarySubject: true, insights: { select: { id: true, unlockedAt: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listSubjectsForPicker(userId: string) {
  const self = await ensureSelfSubject(userId);
  const people = await listPeople(userId);
  return [self, ...people].map((subject) => ({ id: subject.id, name: subject.displayName, kind: subject.kind }));
}

export async function unlockDecodeInsight(userId: string, insightId: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
    const insight = await tx.decodeInsight.findFirst({ where: { id: insightId, decode: { ownerUserId: userId } } });
    if (!insight) throw new DecodeServiceError("NOT_FOUND", "Insight not found.");
    if (insight.unlockedAt) return { balance: (await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { creditBalance: true } })).creditBalance, insight };

    const changed = await tx.user.updateMany({ where: { id: userId, creditBalance: { gte: insight.unlockCost } }, data: { creditBalance: { decrement: insight.unlockCost } } });
    if (changed.count !== 1) throw new DecodeServiceError("INSUFFICIENT_CREDITS", "You do not have enough credits to unlock this insight.");
    const unlocked = await tx.decodeInsight.update({ where: { id: insight.id }, data: { unlockedAt: new Date() } });
    await tx.creditTransaction.create({ data: { userId, decodeInsightId: insight.id, idempotencyKey: `insight:${insight.id}`, amount: -insight.unlockCost, reason: "decode-insight-unlock" } });
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { creditBalance: true } });
    return { balance: user.creditBalance, insight: unlocked };
      }, { isolationLevel: "Serializable" });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && (error as { code?: string }).code === "P2034" && attempt < 2) continue;
      throw error;
    }
  }
  throw new DecodeServiceError("UNLOCK_FAILED", "Could not unlock this insight.");
}
