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

# Tracks the last image that actually passed its health check — the only
# thing a rollback has to go on, since `docker run -d` returning success
# just means the process started, not that the app came up correctly.
LAST_GOOD_IMAGE_FILE="/opt/${CONTAINER_NAME}/last-good-image"
HEALTHCHECK_URL="http://localhost:8080/api/v1/healthcheck"
HEALTHCHECK_TIMEOUT_SECONDS=60
HEALTHCHECK_INTERVAL_SECONDS=2

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

run_container() {
  local image="$1"
  docker stop "$CONTAINER_NAME" >/dev/null 2>&1 || true
  docker rm "$CONTAINER_NAME" >/dev/null 2>&1 || true
  docker run -d \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    -p 8080:8080 \
    "${ENV_ARGS[@]}" \
    "$image"
}

wait_for_healthy() {
  local waited=0
  while [ "$waited" -lt "$HEALTHCHECK_TIMEOUT_SECONDS" ]; do
    if curl -fsS --max-time 5 "$HEALTHCHECK_URL" >/dev/null 2>&1; then
      return 0
    fi
    sleep "$HEALTHCHECK_INTERVAL_SECONDS"
    waited=$((waited + HEALTHCHECK_INTERVAL_SECONDS))
  done
  return 1
}

if run_container "$IMAGE" && wait_for_healthy; then
  echo "Deploy succeeded: $IMAGE is healthy."
  mkdir -p "$(dirname "$LAST_GOOD_IMAGE_FILE")"
  echo "$IMAGE" > "$LAST_GOOD_IMAGE_FILE"
else
  echo "New image failed its health check within ${HEALTHCHECK_TIMEOUT_SECONDS}s — rolling back." >&2
  docker logs --tail 100 "$CONTAINER_NAME" >&2 || true

  if [ -f "$LAST_GOOD_IMAGE_FILE" ]; then
    PREVIOUS_IMAGE="$(cat "$LAST_GOOD_IMAGE_FILE")"
    echo "Restoring last known-good image: $PREVIOUS_IMAGE" >&2
    run_container "$PREVIOUS_IMAGE"
    if wait_for_healthy; then
      echo "Rollback to $PREVIOUS_IMAGE succeeded." >&2
    else
      echo "Rollback image also failed its health check — instance may be down. Manual intervention needed." >&2
    fi
  else
    echo "No previous known-good image recorded (first deploy?) — nothing to roll back to." >&2
  fi

  # Still fail the deploy job itself: the *requested* image never became
  # healthy, even though the instance may now be back on the old one.
  exit 1
fi

# Keep the instance's disk from filling up with old image layers.
docker image prune -af --filter "until=24h" >/dev/null 2>&1 || true
