# Not the real deploy path — production deploys to AWS Lambda via
# @codegenie/serverless-express (see src/lambda.ts, ROADMAP.md P11). This
# exists for CI-buildability checks and as an option for a future
# always-on-server deploy target.

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
CMD ["node", "dist/main"]
