import { Module } from '@nestjs/common';
import { DynamoThrottlerStorage } from '@/common/rate-limit/dynamo-throttler-storage.service';

@Module({
  providers: [DynamoThrottlerStorage],
  exports: [DynamoThrottlerStorage],
})
export class RateLimitModule {}
