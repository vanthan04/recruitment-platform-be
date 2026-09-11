/** DI token for the shared ioredis client (null when REDIS_URL isn't configured). */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
