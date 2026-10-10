import { describe, expect, it, beforeEach } from "vitest";
import { checkRateLimit, clearRateLimits } from "../src/lib/ratelimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    clearRateLimits();
  });

  it("allows requests under the limit", () => {
    const res1 = checkRateLimit("user-1", { maxRequests: 2, windowMs: 1000 });
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(1);

    const res2 = checkRateLimit("user-1", { maxRequests: 2, windowMs: 1000 });
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(0);
  });

  it("blocks requests that exceed the limit", () => {
    checkRateLimit("user-2", { maxRequests: 2, windowMs: 1000 });
    checkRateLimit("user-2", { maxRequests: 2, windowMs: 1000 });

    const blocked = checkRateLimit("user-2", { maxRequests: 2, windowMs: 1000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetInMs).toBeGreaterThan(0);
  });

  it("differentiates different client identifiers", () => {
    checkRateLimit("client-A", { maxRequests: 1, windowMs: 1000 });
    const blockedA = checkRateLimit("client-A", { maxRequests: 1, windowMs: 1000 });
    expect(blockedA.allowed).toBe(false);

    const allowedB = checkRateLimit("client-B", { maxRequests: 1, windowMs: 1000 });
    expect(allowedB.allowed).toBe(true);
  });
});
