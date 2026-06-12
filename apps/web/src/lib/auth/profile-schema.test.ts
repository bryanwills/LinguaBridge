import { describe, expect, it } from "vitest";
import { profileSettingsSchema } from "./profile-schema";

describe("profileSettingsSchema", () => {
  it("accepts a valid profile", () => {
    const result = profileSettingsSchema.safeParse({
      displayName: "Bryan",
      preferredLanguage: "en-US",
    });
    expect(result.success).toBe(true);
  });

  it("accepts es-PE (Gleny's default)", () => {
    const result = profileSettingsSchema.safeParse({
      displayName: "Gleny",
      preferredLanguage: "es-PE",
    });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from display name", () => {
    const result = profileSettingsSchema.parse({
      displayName: "  Bryan  ",
      preferredLanguage: "en-US",
    });
    expect(result.displayName).toBe("Bryan");
  });

  it("rejects empty display name", () => {
    const result = profileSettingsSchema.safeParse({
      displayName: "   ",
      preferredLanguage: "en-US",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unsupported languages", () => {
    const result = profileSettingsSchema.safeParse({
      displayName: "Bryan",
      preferredLanguage: "fr-FR",
    });
    expect(result.success).toBe(false);
  });

  it("rejects display names over 80 characters", () => {
    const result = profileSettingsSchema.safeParse({
      displayName: "x".repeat(81),
      preferredLanguage: "en-US",
    });
    expect(result.success).toBe(false);
  });
});
