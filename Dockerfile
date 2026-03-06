# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production=false

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production server (for SSR)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]

# ----------------------------------------------------------
# Alternative: Static export for Azure Static Web Apps / Blob Storage
# ----------------------------------------------------------
# To use static export:
# 1. Uncomment `output: 'export'` in next.config.ts
# 2. Run: npm run build
# 3. Deploy the /out folder to:
#    - Azure Static Web Apps
#    - Azure Blob Storage with static website enabled
#    - Any CDN or static hosting service
# ----------------------------------------------------------
