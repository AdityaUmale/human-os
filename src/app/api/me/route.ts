import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    id: user.id,
    phone: user.phone,
    name: user.name,
    creditBalance: user.creditBalance,
    hasBirthDetails: Boolean(user.birthDetails),
    birthDetails: user.birthDetails
      ? {
          fullName: user.birthDetails.fullName,
          dateOfBirth: user.birthDetails.dateOfBirth,
          placeName: user.birthDetails.placeName,
          timezone: user.birthDetails.timezone,
        }
      : null,
    humanOsStatus: user.humanOs?.status ?? null,
    memberSince: user.createdAt,
  });
}
