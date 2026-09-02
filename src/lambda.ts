import 'source-map-support/register';
import type { RequestListener } from 'http';
import serverlessExpress from '@codegenie/serverless-express';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';
import { createHttpApp } from '@/bootstrap';

/**
 * API Gateway entry point: Client -> API Gateway -> this Lambda -> NestJS.
 * The serverless-express instance is cached on the module scope so a warm
 * execution environment reuses the same Nest DI container instead of
 * re-bootstrapping the app on every invocation.
 */
type ApiHandler = Handler<APIGatewayProxyEvent, APIGatewayProxyResult>;

let cachedHandler: ApiHandler;

async function bootstrap(): Promise<ApiHandler> {
  const app = await createHttpApp();
  await app.init();
  const expressInstance = app.getHttpAdapter().getInstance() as RequestListener;
  return serverlessExpress<APIGatewayProxyEvent, APIGatewayProxyResult>({ app: expressInstance });
}

export const handler: ApiHandler = async (event, context, callback) => {
  cachedHandler ??= await bootstrap();
  return cachedHandler(event, context, callback);
};
