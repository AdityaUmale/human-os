import { describe, expect, it } from "vitest";
import { getPgPoolConfig } from "@/lib/prisma";

describe("database pool configuration", () => {
  it("uses a serverless-safe client limit by default", () => {
    expect(getPgPoolConfig("postgresql://localhost/postgres").max).toBe(1);
  });
});
