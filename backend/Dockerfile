# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY backend/package.json backend/package-lock.json* backend/pnpm-lock.yaml* ./
RUN if [ -f pnpm-lock.yaml ]; then npm i -g pnpm@9 && pnpm i --frozen-lockfile; \
    else npm ci; fi

FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN if [ -f pnpm-lock.yaml ]; then npm i -g pnpm@9 && pnpm -C backend run build; \
    else npm --prefix backend run build; fi

FROM node:20-alpine AS runner
WORKDIR /app/backend
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
COPY --from=build /app/backend/dist ./dist
COPY backend/package.json ./package.json
RUN npm pkg delete scripts.dev >/dev/null 2>&1 || true \
 && npm pkg set scripts.start="node dist/index.js"
USER nodejs
EXPOSE 3000 3001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:3000/metrics || exit 1
CMD ["node","dist/index.js"]
