const DEFAULT_NEXT_PATH = "/dashboard";

/**
 * Restricts post-auth redirects to same-origin relative paths so the
 * `next` query param can't be abused as an open redirect.
 */
export function sanitizeNextPath(next: string | null | undefined): string {
  if (!next) return DEFAULT_NEXT_PATH;
  // Must be an absolute path within this app: "/foo", not "//evil.com",
  // "https://evil.com", or "/\evil.com" (browsers normalize \ to /).
  if (!next.startsWith("/")) return DEFAULT_NEXT_PATH;
  if (next.startsWith("//") || next.startsWith("/\\")) return DEFAULT_NEXT_PATH;
  return next;
}
