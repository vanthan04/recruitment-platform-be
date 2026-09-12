# Deploy path: Railway, as a single always-on container — see DEPLOY.md.
# Not a serverless/per-request platform: the chat module's real Socket.IO
# WebSocket connections can't survive a per-invocation execution model,
# which is why this needs to run as a long-lived container.
# Runs main.ts's regular long-lived HTTP server.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production-only node_modules — the `build` stage's node_modules carries
# every devDependency (typescript, @nestjs/cli, prisma CLI, ...) needed to
# generate the client and compile, none of which the running app needs.
# Three of those dev tools are added back deliberately below: the CMD at
# the bottom of this file runs `prisma migrate deploy` and `npm run
# db:seed` (ts-node --transpile-only) as part of container startup, so
# prisma/ts-node/typescript have to actually be present at runtime, not
# just at build time — versions read from package.json so they can't drift
# from what @prisma/client (a real, non-dev dependency) was generated
# against in the build stage above.
FROM node:24-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && \
    npm install --no-save \
      "prisma@$(node -p "require('./package.json').devDependencies.prisma")" \
      "ts-node@$(node -p "require('./package.json').devDependencies['ts-node']")" \
      "typescript@$(node -p "require('./package.json').devDependencies.typescript")"

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=prod-deps /app/node_modules ./node_modules
# The generated Prisma client (from `npx prisma generate` in the build
# stage) lives in node_modules/.prisma/client, separate from the
# @prisma/client package itself — prod-deps' plain `npm ci --omit=dev`
# installs the package but never runs generate, so this has to come from
# build explicitly or @prisma/client has nothing to load at runtime.
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
# Both needed by the `prisma migrate deploy` step in CMD below:
# prisma.config.ts (Prisma 7's CLI config — datasource.url etc., see its
# own comments) and tsconfig.json (ts-node --transpile-only, run by `npm
# run db:seed`, needs compiler options even without full type-checking).
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY --from=build /app/package.json ./package.json
# The `node` user/group ships built into the base image (uid/gid 1000) —
# no need to create one. Ownership must be set explicitly since the COPY
# --from steps above default to root.
RUN chown -R node:node /app
USER node
EXPOSE 8080
# Runs on every container start (Railway redeploys = a fresh container,
# not a long-lived one that skips this on restart). Both commands are
# idempotent — `migrate deploy` only applies not-yet-applied migrations,
# `db:seed` upserts — so this is safe to repeat on every boot, including
# a plain restart with no new deploy. If either fails, the container exits
# non-zero and never starts serving traffic; Railway's own healthcheck
# then keeps the previous deployment running instead of cutting over to a
# broken one.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run db:seed && node dist/src/main"]
