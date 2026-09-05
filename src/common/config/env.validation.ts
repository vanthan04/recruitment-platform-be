import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().default(8080),
  API_PREFIX: Joi.string().default('api/v1'),
  DATABASE_URL: Joi.string().required(),
  CORS_ORIGIN: Joi.string().optional(),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .optional(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRATION: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRATION: Joi.string().required(),

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

  // S3 File Upload Configuration
  S3_REGION: Joi.string().required(),
  S3_BUCKET: Joi.string().required(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  // Set both when pointing at an S3-compatible endpoint (LocalStack, MinIO);
  // leave unset for real AWS S3.
  S3_ENDPOINT: Joi.string().optional(),
  S3_FORCE_PATH_STYLE: Joi.boolean().default(false),

  // Max CV upload size in bytes (default 10MB)
  CV_MAX_FILE_SIZE: Joi.number().default(10 * 1024 * 1024),
});
