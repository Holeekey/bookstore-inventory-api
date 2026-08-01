# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.json tsconfig.build.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

# `prisma generate` (postinstall) reads tsconfig.json to decide the extension
# of its own relative imports (.js vs .ts) — it must be present before npm ci,
# otherwise it can't find it and emits unresolvable ".ts" imports.
RUN npm ci

COPY . .

RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

RUN chown -R node:node /app
USER node

EXPOSE 3000

# Applies pending migrations against DATABASE_URL, then starts the server.
CMD ["sh", "-c", "npm run prisma:deploy && node dist/main.js"]
