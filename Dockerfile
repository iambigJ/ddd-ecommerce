# syntax=docker/dockerfile:1

# --- Stage 1: Builder ---
    FROM node:22-alpine AS builder

    
    WORKDIR /app
    
    RUN corepack enable
    
    COPY package.json pnpm-lock.yaml* ./
    
    RUN  pnpm install --frozen-lockfile
    
    COPY . .
    
    RUN pnpm exec nx build @ddd-ecommerce/api-gateway --configuration=production
    
    RUN pnpm prune --prod
    
    # --- Stage 2: Production ---
    FROM node:22-alpine AS production
    
    WORKDIR /app
    
    ENV NODE_ENV=production
    
    RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs
    
    COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
    COPY --from=builder --chown=nestjs:nodejs /app/apps/api-gateway/dist ./dist
    
    USER nestjs
    
    EXPOSE 3000
    
    CMD ["node", "dist/main.js"]