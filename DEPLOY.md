# Deploying to AWS (single EC2 instance)

This is a **skeleton** — `scripts/deploy-remote.sh` and
`.github/workflows/deploy.yml` are ready to run once the AWS resources
below exist and the placeholders are filled in. Nothing here creates AWS
resources for you; that's the job of the separate
[`recruitment-platform-infra`](../recruitment-platform-infra) repo (Terraform).

## Why one EC2 instance, not Lambda or ECS

The chat module uses real Socket.IO (long-lived WebSocket connections).
Lambda + API Gateway HTTP API can't hold those open — each invocation
only lives for the duration of one request. An always-on instance keeps
WebSockets working with zero application changes. ECS Fargate would also
work, but its usual pairing with an Application Load Balancer adds a
fixed ~$16-18/month regardless of traffic — not worth it at this scale.
One `t3.micro` EC2 instance running the Docker image directly is
materially cheaper and simple enough to reason about by hand.

The old Lambda entry point (`src/lambda.ts`) and its EventBridge-targeted
cron handlers (`src/handlers/`) have been removed — see `ROADMAP.md` P11
for that migration's history. Cron jobs now run in-process via
`@nestjs/schedule` (`src/modules/job/application/jobs/close-expired-jobs.cron.ts`,
`src/modules/job-alert/application/jobs/job-alert-digest.cron.ts`), and
rate limiting uses `@nestjs/throttler`'s default in-memory storage —
both rely on this being one persistent process, which a single EC2
instance is.

## 1. AWS resources (provisioned by `recruitment-platform-infra`, not here)

That repo's Terraform creates the EC2 instance, Elastic IP, security
group, IAM instance role, ECR repository, S3 upload bucket, and SSM
Parameter Store entries. See its `README.md` for the one-time bootstrap
step and how to run its `infra.yml` workflow. Once applied, note its
outputs — you'll need the EC2 instance ID and ECR repository name below.

## 2. SSM Parameter Store entries

The infra repo's Terraform creates one SecureString parameter per
sensitive env var under `/recruitment-platform/prod/`:

`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRATION`, `JWT_REFRESH_SECRET`,
`JWT_REFRESH_EXPIRATION`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`,
`MAIL_PASS`, `MAIL_FROM`, `PORT`, `API_PREFIX`, `S3_REGION`, `S3_BUCKET`,
`S3_ACCESS_KEY`, `S3_SECRET_KEY`.

`JWT_EXPIRATION` and `JWT_REFRESH_EXPIRATION` are both required by
`env.validation.ts` (no default) — the container fails to boot without
them, so don't skip these two when provisioning the path above.

Also set `CORS_ORIGIN` (comma-separated allowed origins, e.g. the
frontend's production domain) under the same path. It's the one entry
here that isn't strictly required — `env.validation.ts` allows it to be
omitted — but omitting it makes both the HTTP CORS policy (`bootstrap.ts`)
and the Socket.IO CORS policy (`socket-io.adapter.ts`) reflect *any*
origin while still allowing credentials, which is fine for local dev but
not something you want left on by default in production.

`scripts/deploy-remote.sh` reads every parameter under that path at
deploy time and passes each as a `-e KEY=VALUE` flag to `docker run` — so
adding a new env var is just adding a new parameter under the same path,
no workflow change needed. The path itself is set once, in
`deploy.yml`'s `SSM_PARAM_PATH`.

## 3. GitHub Secrets & Variables (for the deploy workflow only)

These are **separate** from the SSM Parameter Store entries above —
GitHub Secrets only let `deploy.yml` authenticate to AWS and know *where*
to deploy. They're never read by the running container; the container
only ever reads SSM Parameter Store (step 2). Don't put the same value
in both places expecting them to do the same job.

**Secrets** (repo Settings → Secrets and variables → Actions → Secrets):
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` — credentials
  for a **narrow-permission** IAM user: `ecr:*` on this repository's ECR
  repo and `ssm:SendCommand`/`ssm:GetCommandInvocation` on this one EC2
  instance. Deliberately not the same, broader credentials the infra
  repo uses to provision resources — least privilege, and a leaked deploy
  key can't rewrite infrastructure. Prefer swapping these for OIDC
  (`role-to-assume` in `aws-actions/configure-aws-credentials`) once
  you're comfortable with the setup — no long-lived keys stored anywhere.

**Variables** (same page, Variables tab):
- `ECR_REPOSITORY` — the repo name, from the infra repo's Terraform output.
- `EC2_INSTANCE_ID` — the instance ID, from the infra repo's Terraform output.

## 4. Running a deploy

Actions tab → **Deploy** workflow → **Run workflow**. It's
`workflow_dispatch`-only (not on push) until you've finished the setup
above. Under the hood: builds the Docker image, pushes it to ECR, then
uses **SSM Run Command** (not SSH — no open port 22, no stored SSH keys
for CI) to tell the already-running instance to pull the new image, read
the current env vars from SSM Parameter Store, and restart the
container.

## Known follow-up (not a blocker)

`S3StorageProvider` takes explicit `S3_ACCESS_KEY`/`S3_SECRET_KEY`
credentials rather than relying on the instance role's IAM permissions
for S3 access. Works fine as configured here, but a future cleanup could
drop the explicit keys from the S3 client and lean on the instance role
instead — one less secret to manage.
