# Deploy path: AWS ECS Fargate (always-on container), not Lambda — see
# DEPLOY.md. The Lambda code (src/lambda.ts, ROADMAP.md P11) is still in
# the repo but unused by this path: the chat module's real Socket.IO
# WebSocket connections can't survive Lambda's per-request invocation
# model, which is why this project moved to an always-on container
# instead. Runs main.ts's regular long-lived HTTP server.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
EXPOSE 8080
CMD ["node", "dist/src/main"]
