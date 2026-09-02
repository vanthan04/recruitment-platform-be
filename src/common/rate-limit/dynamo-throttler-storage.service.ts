import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ThrottlerStorage } from '@nestjs/throttler';

/**
 * DynamoDB-backed ThrottlerStorage.
 *
 * @nestjs/throttler's default ThrottlerStorageService keeps counters in an
 * in-process Map, which is only correct for a single long-lived process.
 * On Lambda, concurrent invocations run in separate execution environments
 * with independent memory, so an in-memory counter under-counts and lets
 * far more requests through than the configured limit. This swaps the
 * counter for an atomic DynamoDB update, shared by every invocation.
 *
 * Window-bucketing (rather than the library's mutable expiresAt/isBlocked
 * fields) is used so the increment is a single atomic `ADD`, with no
 * read-modify-write race: the bucket key embeds the current window, so a
 * new window is automatically a fresh item, and DynamoDB TTL reclaims old
 * buckets. This is a faithful match for this app's usage because none of
 * its @Throttle() calls set a custom blockDuration, so the library's own
 * default (blockDuration === ttl) already means "blocked for the rest of
 * the window" — exactly what bucketing gives us for free.
 */
@Injectable()
export class DynamoThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(DynamoThrottlerStorage.name);
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(private readonly configService: ConfigService) {
    this.tableName = this.configService.get<string>('RATE_LIMIT_TABLE')!;
    this.client = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        region: this.configService.get<string>('AWS_REGION'),
        // Same escape hatch as S3_ENDPOINT (s3-storage.provider.ts): points at
        // DynamoDB Local for local dev/testing instead of real AWS.
        endpoint: this.configService.get<string>('DYNAMODB_ENDPOINT'),
      }),
    );
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    _blockDuration: number,
    throttlerName: string,
  ) {
    const now = Date.now();
    const windowStart = Math.floor(now / ttl) * ttl;
    const windowEnd = windowStart + ttl;
    const bucketKey = `${throttlerName}#${key}#${windowStart}`;
    const timeToExpire = Math.max(0, Math.ceil((windowEnd - now) / 1000));

    try {
      const result = await this.client.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { pk: bucketKey },
          UpdateExpression:
            'ADD hits :incr SET expiresAt = if_not_exists(expiresAt, :exp)',
          ExpressionAttributeValues: {
            ':incr': 1,
            ':exp': Math.ceil(windowEnd / 1000),
          },
          ReturnValues: 'UPDATED_NEW',
        }),
      );

      const totalHits = (result.Attributes?.hits as number) ?? 1;
      const isBlocked = totalHits > limit;

      return {
        totalHits,
        timeToExpire,
        isBlocked,
        timeToBlockExpire: isBlocked ? timeToExpire : 0,
      };
    } catch (error) {
      // Fail open: a DynamoDB blip must not take the whole API down with it —
      // rate limiting is a protective layer, not core business logic. Every
      // guarded route would otherwise 500 for as long as the table is
      // unreachable.
      this.logger.error(
        `Rate-limit storage unavailable, allowing request through: ${(error as Error).message}`,
      );
      return {
        totalHits: 0,
        timeToExpire,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }
}
