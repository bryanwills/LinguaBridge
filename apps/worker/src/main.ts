import pino from "pino";
import { loadEnv } from "./config/env.js";

/**
 * LinguaBridge translation worker.
 *
 * Phase 0 scaffold: boots, validates environment, and exits cleanly.
 * Phase 5 (feature/ai-translation-worker) implements:
 *   1. Join LiveKit room as agent participant.
 *   2. Subscribe to participant audio tracks.
 *   3. Stream audio chunks to the provider (src/providers/*).
 *   4. Publish partial/final caption events to the data channel.
 *   5. Persist final transcript segments when room consent allows.
 *
 * Failure rules (docs/architecture.md): captions failing must never
 * end the video call; reconnect when safe; stop when the room empties;
 * avoid retry storms.
 */
async function main(): Promise<void> {
  const env = loadEnv();
  const logger = pino({ level: env.WORKER_LOG_LEVEL, name: env.WORKER_NAME });

  logger.info(
    { provider: env.AI_PROVIDER, roomPrefix: env.WORKER_ROOM_PREFIX },
    "worker scaffold booted — translation pipeline lands in feature/ai-translation-worker",
  );
}

main().catch((error: unknown) => {
  console.error("worker failed to start", error);
  process.exit(1);
});
