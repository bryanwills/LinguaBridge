import { describe, expect, it } from "vitest";
import { sanitizeNextPath } from "./redirect";

describe("sanitizeNextPath", () => {
  it("falls back to /dashboard when missing", () => {
    expect(sanitizeNextPath(null)).toBe("/dashboard");
    expect(sanitizeNextPath(undefined)).toBe("/dashboard");
    expect(sanitizeNextPath("")).toBe("/dashboard");
  });

  it("allows same-origin relative paths", () => {
    expect(sanitizeNextPath("/dashboard/settings")).toBe(
      "/dashboard/settings",
    );
    expect(sanitizeNextPath("/rooms/abc?tab=invite")).toBe(
      "/rooms/abc?tab=invite",
    );
  });

  it("rejects absolute URLs and protocol-relative URLs", () => {
    expect(sanitizeNextPath("https://evil.com")).toBe("/dashboard");
    expect(sanitizeNextPath("//evil.com")).toBe("/dashboard");
    expect(sanitizeNextPath("/\\evil.com")).toBe("/dashboard");
    expect(sanitizeNextPath("javascript:alert(1)")).toBe("/dashboard");
  });
});
