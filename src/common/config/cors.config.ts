export interface ResolvedCorsOptions {
  origin: string[] | boolean;
  credentials: true;
}

/**
 * Shared CORS resolution for both the HTTP server (bootstrap.ts) and the
 * Socket.IO server (common/adapters/socket-io.adapter.ts) — previously
 * duplicated verbatim in both places. Unset CORS_ORIGIN means "reflect any
 * origin" (the dev-friendly default; required in production instead, see
 * env.validation.ts); set means an explicit comma-separated allowlist.
 */
export function resolveCorsOptions(
  corsOrigin: string | undefined,
): ResolvedCorsOptions {
  return {
    origin: corsOrigin ? corsOrigin.split(',').map((o) => o.trim()) : true,
    credentials: true,
  };
}
