# Deploying to AWS (ECS Fargate)

This is a **skeleton** — `ecs-task-definition.json` and
`.github/workflows/deploy.yml` are ready to run once you've created the
AWS resources below and filled in the placeholders. Nothing here creates
AWS resources for you.

## Why ECS Fargate, not Lambda

The chat module uses real Socket.IO (long-lived WebSocket connections).
Lambda + API Gateway HTTP API can't hold those open — each invocation
only lives for the duration of one request. An always-on container keeps
WebSockets working with zero application changes. The Lambda code
(`src/lambda.ts`, `src/handlers/`) is still in the repo but unused by
this deploy path.

## 1. AWS resources to create once (manually, via Console/CLI/your IaC of choice)

- **ECR repository** — holds the Docker images the deploy workflow pushes.
- **ECS cluster** (Fargate).
- **VPC + subnets + security group** — security group should allow inbound
  on container port 8080 from the ALB's security group only (not the
  public internet directly).
- **Application Load Balancer** + target group (health check path
  `/api/v1/healthcheck`, matches `ecs-task-definition.json`'s own
  container health check) + listener.
- **IAM execution role** (`executionRoleArn` in the task def) —
  `AmazonECSTaskExecutionRolePolicy` + `secretsmanager:GetSecretValue` on
  the secrets you create in step 2.
- **IAM task role** (`taskRoleArn` in the task def) — permissions the
  *application* needs at runtime: S3 (`s3:PutObject`/`s3:DeleteObject` on
  your upload bucket, matches `s3-storage.provider.ts`) and DynamoDB
  (`dynamodb:UpdateItem` on your rate-limit table, matches
  `dynamo-throttler-storage.service.ts`).
- **DynamoDB table** for rate limiting — partition key `pk` (String).
  Optionally enable TTL on the `expiresAt` attribute (Number, epoch
  seconds) so old rate-limit buckets clean themselves up.
- **ECS service** on the cluster, using the `recruitment-platform-be`
  task definition family, attached to the target group above.
- **Postgres** reachable from the ECS security group (you said you
  already have one — just make sure its security group allows inbound
  from the ECS tasks' security group).

## 2. Secrets Manager entries

Create one secret per sensitive value, then paste each ARN into the
matching `secrets[].valueFrom` placeholder in `ecs-task-definition.json`:

`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MAIL_HOST`,
`MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`, `S3_BUCKET`,
`S3_ACCESS_KEY`, `S3_SECRET_KEY`.

The non-secret vars (`PORT`, `API_PREFIX`, `CORS_ORIGIN`, `LOG_LEVEL`,
`S3_REGION`, `AWS_REGION`, `RATE_LIMIT_TABLE`, `JWT_EXPIRATION`,
`JWT_REFRESH_EXPIRATION`) are plain values — edit them directly in
`ecs-task-definition.json`'s `environment` array.

## 3. GitHub Secrets & Variables (for the deploy workflow only)

These are **separate** from the Secrets Manager entries above — GitHub
Secrets only let the `deploy.yml` workflow authenticate to AWS and know
*where* to deploy. They are never read by the running container; the
container only ever reads Secrets Manager (step 2). Don't put the same
value in both places expecting them to do the same job.

**Secrets** (repo Settings → Secrets and variables → Actions → Secrets):
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` — credentials
  for an IAM user that can push to ECR and update the ECS service. Prefer
  swapping these for OIDC (`role-to-assume` in
  `aws-actions/configure-aws-credentials`) once you're comfortable with
  the setup — no long-lived keys stored anywhere.

**Variables** (same page, Variables tab):
- `ECR_REPOSITORY` — the repo name from step 1.
- `ECS_CLUSTER` — the cluster name from step 1.
- `ECS_SERVICE` — the service name from step 1.

## 4. Running a deploy

Actions tab → **Deploy** workflow → **Run workflow**. It's
`workflow_dispatch`-only (not on push) until you've finished the setup
above.

## Deferred: the two cron handlers

`src/handlers/close-expired-jobs.handler.ts` and
`job-alert-digest.handler.ts` were written as Lambda targets for
EventBridge Scheduler (see `ROADMAP.md` P11) and aren't wired into this
ECS deploy. Once you're ready, the natural replacement is an
**EventBridge Scheduler rule targeting `ecs:RunTask`** — same Docker
image, same task definition, but overriding the container command to run
one of these handlers standalone instead of the HTTP server. Not built
yet; flagging so it doesn't get lost.

## Known follow-up (not a blocker)

`S3StorageProvider` takes explicit `S3_ACCESS_KEY`/`S3_SECRET_KEY`
credentials rather than relying on the task role's IAM permissions for
S3 access. Works fine as configured here, but a future cleanup could
drop the explicit keys from the S3 client and lean on the task role
instead — one less secret to manage.
