import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponse } from '@/common/dtos/api-response';
import { PrismaService } from '@/modules/prisma/prisma.service';

@ApiTags('app')
@Controller('healthcheck')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Readiness check — confirms the API can actually reach its database',
  })
  @SwaggerResponse({ status: 200, description: 'Service is up and can reach the database' })
  @SwaggerResponse({ status: 503, description: 'Service is up but the database is unreachable' })
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      // Deliberately no exception detail in the response — same rationale
      // as GlobalExceptionFilter's 5xx sanitization: this endpoint is
      // typically unauthenticated (load balancer / orchestrator probes),
      // so it shouldn't hand out infrastructure details either.
      throw new ServiceUnavailableException('Database is not reachable');
    }

    return ApiResponse.ok(null, 'Service is up and running');
  }
}
