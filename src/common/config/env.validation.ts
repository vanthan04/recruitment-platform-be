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

  // S3 File Upload Configuration
  S3_REGION: Joi.string().required(),
  S3_BUCKET: Joi.string().required(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_ENDPOINT: Joi.string().optional(),

  // Distributed rate-limiting (DynamoDB-backed @nestjs/throttler storage — see
  // src/common/rate-limit). AWS_REGION is populated automatically by the
  // Lambda runtime; only needs to be set explicitly for local dev.
  RATE_LIMIT_TABLE: Joi.string().required(),
  AWS_REGION: Joi.string().optional(),
  DYNAMODB_ENDPOINT: Joi.string().optional(),
});
