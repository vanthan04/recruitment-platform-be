#!/bin/sh
# Runs automatically once LocalStack is ready (mounted to
# /etc/localstack/init/ready.d/). Creates the S3 bucket the app expects so
# uploads work immediately after `docker-compose up` — no manual AWS CLI step.
set -e

BUCKET="${S3_BUCKET:-recruitment-platform-local}"

if ! awslocal s3api head-bucket --bucket "$BUCKET" 2>/dev/null; then
  awslocal s3 mb "s3://$BUCKET"
fi
