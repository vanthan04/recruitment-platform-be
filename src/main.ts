import { Logger } from '@nestjs/common';
import { createHttpApp } from '@/bootstrap';

async function bootstrap() {
  const app = await createHttpApp();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `Application is running on: http://localhost:${port}`,
    'Bootstrap',
  );
}
bootstrap();
