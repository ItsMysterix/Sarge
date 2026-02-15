# syntax=docker/dockerfile:1

# Monorepo-aware backend image build
FROM node:25-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN if [ -f pnpm-lock.yaml ]; then npm i -g pnpm@9 && pnpm install --frozen-lockfile; \
	else npm install --legacy-peer-deps; fi

FROM node:25-alpine AS build
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
# Build workspace packages then backend
RUN if [ -f pnpm-lock.yaml ]; then npm i -g pnpm@9 && pnpm install && pnpm -r run build; \
	else npm --prefix backend run build; fi

FROM node:25-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
# Copy backend runtime and dependencies
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=deps /app/node_modules ./node_modules
COPY backend/package.json ./backend/package.json
# Ensure workspace packages used at runtime exist for pnpm workspace links
COPY --from=build /app/packages/sarge-core/dist ./packages/sarge-core/dist
COPY --from=build /app/packages/sarge-core/package.json ./packages/sarge-core/package.json
COPY --from=build /app/packages/sarge-services-s3/dist ./packages/sarge-services-s3/dist
COPY --from=build /app/packages/sarge-services-s3/package.json ./packages/sarge-services-s3/package.json
COPY --from=build /app/packages/sarge-services-dynamo/dist ./packages/sarge-services-dynamo/dist
COPY --from=build /app/packages/sarge-services-dynamo/package.json ./packages/sarge-services-dynamo/package.json
USER nodejs
EXPOSE 3000 3001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:3000/metrics || exit 1
CMD ["node","backend/dist/index.js"]
