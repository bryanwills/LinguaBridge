import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  LIVEKIT_HTTP_URL: z.string().url().default("http://localhost:7880"),
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_API_SECRET: z.string().min(1),
  AI_PROVIDER: z.enum(["openai", "mock"]).default("mock"),
  OPENAI_API_KEY: z.string().optional(),
  WORKER_NAME: z.string().default("translation-worker-local"),
  WORKER_LOG_LEVEL: z
    .enum(["trace", "debug", "info", "warn", "error"])
    .default("info"),
  WORKER_ROOM_PREFIX: z.string().default("linguabridge"),
});

export type WorkerEnv = z.infer<typeof envSchema>;

export function loadEnv(): WorkerEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // Log shape problems without echoing secret values.
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Worker environment invalid — ${issues}`);
  }
  return parsed.data;
}
