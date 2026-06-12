import { z } from "zod";
import { SUPPORTED_LANGUAGES } from "@linguabridge/shared";

const languageCodes = SUPPORTED_LANGUAGES.map((lang) => lang.code) as [
  string,
  ...string[],
];

export const profileSettingsSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(80, "Display name must be 80 characters or fewer."),
  preferredLanguage: z.enum(languageCodes, {
    message: "Choose a supported language.",
  }),
});

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
