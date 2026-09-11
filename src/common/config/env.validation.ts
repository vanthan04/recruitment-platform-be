import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(8080),
  API_PREFIX: Joi.string().default('api/v1'),
  DATABASE_URL: Joi.string().required(),
  // Optional in dev (falls back to reflecting any origin — see
  // bootstrap.ts/socket-io.adapter.ts) but required in production: an
  // operator forgetting to set this would otherwise silently leave the API
  // open to any origin with credentials, which is worse than refusing to
  // boot.
  CORS_ORIGIN: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .optional(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRATION: Joi.string().required(),

  // Upstash (or any ioredis-compatible) Redis connection string, e.g.
  // rediss://default:PASSWORD@HOST:PORT — get this from the Upstash
  // console's "Redis Connect" tab (ioredis snippet). Optional: unset means
  // rate limiting falls back to in-memory (per-process) storage and
  // account login-lockout tracking is disabled — see RedisModule.
  REDIS_URL: Joi.string().allow('').optional(),
  // Failed-login lockout (per email, independent of the IP-based
  // throttler). Only enforced when REDIS_URL is set.
  LOGIN_LOCKOUT_MAX_ATTEMPTS: Joi.number().default(10),
  LOGIN_LOCKOUT_WINDOW_SECONDS: Joi.number().default(900),
  LOGIN_LOCKOUT_DURATION_SECONDS: Joi.number().default(900),

  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().required(),
  MAIL_USER: Joi.string().required(),
  MAIL_PASS: Joi.string().required(),
  MAIL_FROM: Joi.string().required(),

  // Where the OAuth callback redirects the browser back to after login.
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),

  // Social login (Google/Facebook). Optional so the app still boots without
  // them configured — the /auth/google and /auth/facebook routes just fail
  // until real credentials are set. `.allow('')` matters here: a `.env`
  // template naturally represents "not set yet" as `KEY=` (empty string),
  // not as an absent line — plain `.optional()` only tolerates the key
  // being absent (`undefined`) and rejects an empty string, which would
  // otherwise crash the ENTIRE app at boot (ConfigModule.forRoot() throws
  // on a schema validation failure), not just the two OAuth routes.
  GOOGLE_CLIENT_ID: Joi.string().allow('').optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().allow('').optional(),
  GOOGLE_CALLBACK_URL: Joi.string().allow('').optional(),
  FACEBOOK_CLIENT_ID: Joi.string().allow('').optional(),
  FACEBOOK_CLIENT_SECRET: Joi.string().allow('').optional(),
  FACEBOOK_CALLBACK_URL: Joi.string().allow('').optional(),

  // File Upload Storage Configuration
  // 's3' (default): S3StorageProvider — real AWS S3, LocalStack (local dev),
  // or any other S3-compatible endpoint (Cloudflare R2, MinIO) via
  // S3_ENDPOINT. 'supabase': SupabaseStorageProvider — Supabase Storage's
  // own S3-compatible API, configured via the SUPABASE_* vars below instead.
  STORAGE_PROVIDER: Joi.string().valid('s3', 'supabase').default('s3'),

  S3_REGION: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  S3_BUCKET: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  S3_ACCESS_KEY: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  S3_SECRET_KEY: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  // Set both when pointing at an S3-compatible endpoint (LocalStack, MinIO,
  // R2); leave unset for real AWS S3.
  S3_ENDPOINT: Joi.string().optional(),
  S3_FORCE_PATH_STYLE: Joi.boolean().default(false),
  // Only needed for providers (e.g. Cloudflare R2) where the private SigV4
  // endpoint above can't also serve public GETs — set this to the public
  // domain (r2.dev / custom domain) so upload() returns a fetchable URL.
  S3_PUBLIC_URL_BASE: Joi.string().optional(),

  // Supabase Storage Configuration (only used when STORAGE_PROVIDER=supabase)
  SUPABASE_PROJECT_REF: Joi.string().when('STORAGE_PROVIDER', {
    is: 'supabase',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SUPABASE_S3_REGION: Joi.string().when('STORAGE_PROVIDER', {
    is: 'supabase',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SUPABASE_S3_ACCESS_KEY: Joi.string().when('STORAGE_PROVIDER', {
    is: 'supabase',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SUPABASE_S3_SECRET_KEY: Joi.string().when('STORAGE_PROVIDER', {
    is: 'supabase',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SUPABASE_STORAGE_BUCKET: Joi.string().when('STORAGE_PROVIDER', {
    is: 'supabase',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  // Only needed if the generic /files/upload flow (avatars, chat
  // attachments) is used against Supabase and public reads are enabled.
  SUPABASE_PUBLIC_URL_BASE: Joi.string().optional(),

  // Max CV upload size in bytes (default 10MB)
  CV_MAX_FILE_SIZE: Joi.number().default(10 * 1024 * 1024),

  // AI Recruitment Agent (Find Matching CVs) — see src/ai. Optional so the
  // app still boots without it configured; the matching endpoint and the
  // CV-analysis pipeline just fail at call time until a real key is set,
  // same reasoning as the OAuth vars above.
  AI_PROVIDER: Joi.string().valid('anthropic').default('anthropic'),
  AI_MODEL: Joi.string().default('claude-sonnet-5'),
  AI_API_KEY: Joi.string().allow('').optional(),
  // Upper bound on how many deterministically-filtered candidates are ever
  // sent to the LLM for one matching request.
  AI_MAX_CANDIDATES: Joi.number().default(30),
  AI_TEMPERATURE: Joi.number().min(0).max(1).default(0.2),
  AI_REQUEST_TIMEOUT_MS: Joi.number().default(30_000),
  // Safety-net cron batch size — see AnalyzePendingCvsCron.
  AI_ANALYSIS_BATCH_SIZE: Joi.number().default(20),
});
