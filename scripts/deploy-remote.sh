#!/usr/bin/env bash
# Runs ON the EC2 instance, invoked remotely by .github/workflows/deploy.yml
# via SSM Run Command. Not meant to be run by hand except for debugging a
# failed deploy directly on the instance.
set -euo pipefail

IMAGE="$1"
ECR_REGISTRY="$2"
AWS_REGION="$3"
SSM_PATH="$4"
CONTAINER_NAME="$5"

aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"
docker pull "$IMAGE"

ENV_ARGS=()
while IFS=$'\t' read -r name value; do
  [ -z "$name" ] && continue
  ENV_ARGS+=(-e "${name##*/}=${value}")
done < <(aws ssm get-parameters-by-path \
  --path "$SSM_PATH" --with-decryption --region "$AWS_REGION" \
  --query "Parameters[].[Name,Value]" --output text)

docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
docker rm "$CONTAINER_NAME" >/dev/null 2>&1 || true

docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p 8080:8080 \
  "${ENV_ARGS[@]}" \
  "$IMAGE"

# Keep the instance's disk from filling up with old image layers.
docker image prune -af --filter "until=24h" >/dev/null 2>&1 || true
