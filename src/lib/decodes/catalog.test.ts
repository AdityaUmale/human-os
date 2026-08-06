import { describe, expect, it } from "vitest";
import { DECODE_CATALOG, canonicalPair, decodeIdentityKey } from "@/lib/decodes/catalog";
import { birthFingerprint } from "@/lib/decodes/service";
import { getDomain } from "@/lib/catalog/domains";

describe("decode catalog", () => {
  it("keeps the product-defined insight counts", () => {
    expect(DECODE_CATALOG.BOSS.insights).toHaveLength(4);
    expect(DECODE_CATALOG.PARTNER.insights).toHaveLength(4);
    expect(DECODE_CATALOG.LOVE_COMPAT.insights).toHaveLength(3);
    expect(DECODE_CATALOG.WORK_COMPAT.insights).toHaveLength(3);
  });

  it("canonicalizes interaction pairs independent of selection order", () => {
    expect(canonicalPair("z", "a")).toEqual(["a", "z"]);
    expect(decodeIdentityKey("LOVE_COMPAT", "z", "a")).toBe(decodeIdentityKey("LOVE_COMPAT", "a", "z"));
  });

  it("normalizes duplicate birth details consistently", () => {
    const first = birthFingerprint({ fullName: "  Alex   Johnson ", dateOfBirth: "1990-01-02", timeOfBirth: "09:30", timeUnknown: false, placeName: "Mumbai", lat: 19.076, lng: 72.8777, timezone: "Asia/Kolkata" });
    const second = birthFingerprint({ fullName: "Alex Johnson", dateOfBirth: "1990-01-02", timeOfBirth: "09:30", timeUnknown: false, placeName: "Mumbai", lat: 19.076004, lng: 72.877704, timezone: "Asia/Kolkata" });
    expect(first).toBe(second);
  });

  it("keeps the Energy map domain enabled when its renderer is configured", () => {
    expect(getDomain("energy")?.available).toBe(true);
  });
});
