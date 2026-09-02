import { Controller, Get } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponse } from '@/common/dtos/api-response';
import { IMailService } from '@/modules/mail/domain/ports/mail.service.port';

@ApiTags('app')
@Controller('healthcheck')
export class AppController {
  constructor(private readonly mailService: IMailService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @SwaggerResponse({ status: 200, description: 'Service is up and running' })
  check() {
    return ApiResponse.ok(
      null,
      'Service is up and running in development mode',
    );
  }
}
