import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse as SwaggerResponse, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '@/common/dtos/api-response';
import { MailService } from '@/modules/mail/mail.service';

@ApiTags('app')
@Controller('healthcheck')
export class AppController {
  constructor(private readonly mailService: MailService) { }

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @SwaggerResponse({ status: 200, description: 'Service is up and running' })
  check() {
    return ApiResponse.ok(null, 'Service is up and running in development mode');
  }
}
