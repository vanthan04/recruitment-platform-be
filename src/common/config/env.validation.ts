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
  // boot. `.allow('')` only on the dev/`otherwise` branch — a blank value
  // must still fail `.required()` in production (a `.env` template
  // represents "not set" as `KEY=`, which the base string type otherwise
  // rejects as readily as an actually-required field would reject
  // `undefined`, crashing boot for a reason that reads like this one but
  // isn't).
  CORS_ORIGIN: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional(),
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
  // console's "Redis Connect" tab (ioredis snippet). For local dev, matches
  // docker-compose.yml's redis service (redis://localhost:6379). Required:
  // distributed rate-limit storage and account login-lockout tracking both
  // depend on it — see RedisModule. (createRedisClient's own null-URL
  // fallback stays in place as defense in depth for tests that construct a
  // ConfigService directly, bypassing this schema — it should never trigger
  // via the app's real boot path.)
  REDIS_URL: Joi.string().required(),
  // Failed-login lockout (per email, independent of the IP-based throttler).
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

  // `.allow('')` on every `otherwise` branch below, same reasoning as
  // CORS_ORIGIN above: `.env.example` templates every one of these blank
  // when the other storage provider is active, and a bare `Joi.optional()`
  // rejects that blank value exactly as strictly as `.required()` would
  // reject it missing — crashing boot for whichever provider *isn't*
  // selected, not just failing to configure the one that is.
  S3_REGION: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  S3_BUCKET: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  S3_ACCESS_KEY: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  S3_SECRET_KEY: Joi.string().when('STORAGE_PROVIDER', {
    is: 's3',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  // Set both when pointing at an S3-compatible endpoint (LocalStack, MinIO,
  // R2); leave unset for real AWS S3.
  S3_ENDPOINT: Joi.string().allow('').optional(),
  S3_FORCE_PATH_STYLE: Joi.boolean().default(false),
  // Only needed for providers (e.g. Cloudflare R2) where the private SigV4
  // endpoint above can't also serve public GETs — set this to the public
  // domain (r2.dev / custom domain) so upload() returns a fetchable URL.
  S3_PUBLIC_URL_BASE: Joi.string().allow('').optional(),

  // Supabase Storage Configuration (only used when STORAGE_PROVIDER=supabase)
  // — same `.allow('')` reasoning as the S3_* block above.
  SUPABASE_PROJECT_REF: Joi.string().when('STORAGE_PROVIDER', {
    is: 'supabase',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  SUPABASE_S3_REGION: Joi.string().when('STORAGE_PROVIDER', {
    is: 'supabase',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  SUPABASE_S3_ACCESS_KEY: Joi.string().when('STORAGE_PROVIDER', {
    is: 'supabase',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  SUPABASE_S3_SECRET_KEY: Joi.string().when('STORAGE_PROVIDER', {
    is: 'supabase',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  SUPABASE_STORAGE_BUCKET: Joi.string().when('STORAGE_PROVIDER', {
    is: 'supabase',
    then: Joi.required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  // Only needed if the generic /files/upload flow (avatars, chat
  // attachments) is used against Supabase and public reads are enabled.
  SUPABASE_PUBLIC_URL_BASE: Joi.string().allow('').optional(),

  // Max CV upload size in bytes (default 10MB)
  CV_MAX_FILE_SIZE: Joi.number().default(10 * 1024 * 1024),

  // AI features — see src/modules/ai. Optional so the app still boots
  // without any of this configured; each AI endpoint just fails at call
  // time until its provider's API key is set, same reasoning as the OAuth
  // vars above.
  //
  // Each capability picks its own provider/model independently — e.g.
  // matching can run on Claude while screening runs on GPT — see
  // chat-model.provider.ts's buildChatModel(). Whichever provider a
  // capability names, its API key always comes from the corresponding
  // provider-keyed var below (ANTHROPIC_API_KEY etc.), not a per-capability key.
  // `.allow('')` on every *_AI_MODEL below matters for the same reason it
  // does on the OAuth vars above: `.env.example` documents leaving these
  // blank to mean "use the provider's default" (see chat-model.provider.ts),
  // which a `.env` file represents as `KEY=` (empty string), not an absent
  // line — plain `.optional()` only tolerates `undefined` and would crash
  // the entire app at boot on a literal empty value, not just fail the one
  // AI capability that left it blank.
  MATCHING_AI_PROVIDER: Joi.string()
    .valid('anthropic', 'openai', 'google')
    .default('google'),
  MATCHING_AI_MODEL: Joi.string().allow('').optional(),
  CV_ANALYSIS_AI_PROVIDER: Joi.string()
    .valid('anthropic', 'openai', 'google')
    .default('google'),
  CV_ANALYSIS_AI_MODEL: Joi.string().allow('').optional(),
  SCREENING_AI_PROVIDER: Joi.string()
    .valid('anthropic', 'openai', 'google')
    .default('google'),
  SCREENING_AI_MODEL: Joi.string().allow('').optional(),
  SKILL_SUGGESTION_AI_PROVIDER: Joi.string()
    .valid('anthropic', 'openai', 'google')
    .default('google'),
  SKILL_SUGGESTION_AI_MODEL: Joi.string().allow('').optional(),
  JOB_DRAFT_AI_PROVIDER: Joi.string()
    .valid('anthropic', 'openai', 'google')
    .default('google'),
  JOB_DRAFT_AI_MODEL: Joi.string().allow('').optional(),
  ANTHROPIC_API_KEY: Joi.string().allow('').optional(),
  OPENAI_API_KEY: Joi.string().allow('').optional(),
  GOOGLE_API_KEY: Joi.string().allow('').optional(),
  // Shared across every capability — only provider/model differ per capability.
  AI_TEMPERATURE: Joi.number().min(0).max(1).default(0.2),
  AI_REQUEST_TIMEOUT_MS: Joi.number().default(30_000),
  AI_MAX_RESPONSE_TOKENS: Joi.number().default(4096),
  // Upper bound on how many deterministically-filtered candidates are ever
  // sent to the LLM for one matching request.
  AI_MAX_CANDIDATES: Joi.number().default(30),
  // Safety-net cron batch size — see AnalyzePendingCvsCron.
  AI_ANALYSIS_BATCH_SIZE: Joi.number().default(20),
});
