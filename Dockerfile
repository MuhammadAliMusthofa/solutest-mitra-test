# syntax=docker/dockerfile:1
# Frontend Solutest Mitra — Next.js (output standalone) di Node.js 24.

# === Stage 1: dependencies ===
FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

# === Stage 2: build ===
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* di-inline saat build, jadi wajib dikirim sebagai build-arg.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_MOCK=false
ARG NEXT_PUBLIC_APP_NAME="Solutest Mitra"
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_MOCK=${NEXT_PUBLIC_MOCK} \
    NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME} \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# === Stage 3: runtime ===
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0

RUN addgroup -S nodejs -g 1001 && adduser -S nextjs -u 1001 -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080

# Cloud Run mengisi PORT saat runtime; server.js standalone membaca PORT & HOSTNAME.
CMD ["node", "server.js"]
