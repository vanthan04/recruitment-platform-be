import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHttpApp } from '@/bootstrap';

async function bootstrap() {
  const app = await createHttpApp();

  const port = app.get(ConfigService).get<string>('PORT') || 3000;
  await app.listen(port);
  Logger.log(
    `Application is running on: http://localhost:${port}`,
    'Bootstrap',
  );
}
bootstrap();
