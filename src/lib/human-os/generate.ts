import { prisma } from "@/lib/prisma";
import { computeChart } from "@/lib/astrology/compute-chart";
import { getPromptNames } from "@/lib/langfuse";
import { runJsonPrompt } from "@/lib/llm";
import { humanOsProfileSchema } from "@/lib/human-os/schemas";
import { renderAllDomains } from "@/lib/human-os/domain-render";

export async function generateHumanOsForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { birthDetails: true, humanOs: true },
  });

  if (!user?.birthDetails) {
    throw new Error("Birth details are required before generating Human OS.");
  }

  const birth = user.birthDetails;

  // Mark / create generating profile
  let profileRow = user.humanOs;
  if (profileRow) {
    profileRow = await prisma.humanOsProfile.update({
      where: { id: profileRow.id },
      data: { status: "GENERATING", error: null, completedAt: null },
    });
  }

  try {
    const time =
      birth.timeUnknown || !birth.timeOfBirth
        ? "12:00:00"
        : birth.timeOfBirth.length === 5
          ? `${birth.timeOfBirth}:00`
          : birth.timeOfBirth;

    const chart = await computeChart({
      date: birth.dateOfBirth,
      time,
      lat: birth.lat,
      lng: birth.lng,
      city: birth.placeName,
      timezone: birth.timezone,
      timeAccuracy: birth.timeUnknown ? "unknown" : "exact",
      uncertaintyMinutes: birth.timeUnknown ? 360 : null,
      timeSource: birth.timeUnknown ? "unknown" : "user",
    });

    const ast = await prisma.astSnapshot.create({
      data: {
        userId,
        rulesVersion: "v0.2",
        payload: chart as object,
      },
    });

    if (!profileRow) {
      profileRow = await prisma.humanOsProfile.create({
        data: {
          userId,
          astSnapshotId: ast.id,
          status: "GENERATING",
        },
      });
    } else {
      profileRow = await prisma.humanOsProfile.update({
        where: { id: profileRow.id },
        data: { astSnapshotId: ast.id, status: "GENERATING", error: null },
      });
    }

    const prompts = getPromptNames();

    // Compiler: AST → Human OS
    const compiled = await runJsonPrompt(prompts.HUMAN_OS_COMPILER, chart, 0.5);
    const profile = humanOsProfileSchema.parse(compiled.data);

    await prisma.humanOsProfile.update({
      where: { id: profileRow.id },
      data: {
        profile: profile as object,
        model: compiled.model,
        promptName: compiled.promptName,
        status: "GENERATING",
      },
    });

    // Mark completed so identity renderer can load profile
    await prisma.humanOsProfile.update({
      where: { id: profileRow.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        error: null,
      },
    });

    // All domain renderers (Identity, Mind, …) — sequential; partial failures logged
    await renderAllDomains(userId);

    if (birth.fullName && !user.name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: birth.fullName },
      });
    }

    return { status: "COMPLETED" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    if (profileRow) {
      await prisma.humanOsProfile.update({
        where: { id: profileRow.id },
        data: { status: "FAILED", error: message },
      });
    } else {
      // Create failed stub if we never got a row
      const dummyAst = await prisma.astSnapshot.create({
        data: { userId, payload: { error: message } },
      });
      await prisma.humanOsProfile.create({
        data: {
          userId,
          astSnapshotId: dummyAst.id,
          status: "FAILED",
          error: message,
        },
      });
    }
    throw error;
  }
}
