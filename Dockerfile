# Deploy path: a single always-on AWS EC2 instance — see DEPLOY.md. Not
# Lambda: the chat module's real Socket.IO WebSocket connections can't
# survive Lambda's per-request invocation model (see ROADMAP.md P11),
# which is why this project runs as a long-lived container instead.
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
FROM node:24-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

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
COPY --from=build /app/package.json ./package.json
# The `node` user/group ships built into the base image (uid/gid 1000) —
# no need to create one. Ownership must be set explicitly since the COPY
# --from steps above default to root.
RUN chown -R node:node /app
USER node
EXPOSE 8080
CMD ["node", "dist/src/main"]
