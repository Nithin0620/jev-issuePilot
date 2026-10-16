import { describe, expect, it, afterEach } from "vitest";
import { POST } from "../src/app/api/auth/register/route";
import { db } from "../src/lib/db";

describe("POST /api/auth/register", () => {
  const createdEmails: string[] = [];

  afterEach(async () => {
    if (createdEmails.length > 0) {
      try {
        await db.user.deleteMany({
          where: { email: { in: createdEmails } },
        });
      } catch {
        // Ignore if DB offline
      }
      createdEmails.length = 0;
    }
  });

  it("rejects invalid registration payload when password is too short", async () => {
    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "invalid-email",
        password: "123",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates a new user account and returns 201", async () => {
    const uniqueEmail = `engineer-${Date.now()}@issuepilot.local`;
    createdEmails.push(uniqueEmail);

    const req = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Platform Engineer",
        email: uniqueEmail,
        password: "securepassword123",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.user.email).toBe(uniqueEmail);
    expect(data.user.name).toBe("Platform Engineer");
  });
});
