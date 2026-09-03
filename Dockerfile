# Deploy path: a single always-on AWS EC2 instance — see DEPLOY.md. Not
# Lambda: the chat module's real Socket.IO WebSocket connections can't
# survive Lambda's per-request invocation model (see ROADMAP.md P11),
# which is why this project runs as a long-lived container instead.
# Runs main.ts's regular long-lived HTTP server.

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
