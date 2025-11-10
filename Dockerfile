# ---------- builder ----------
FROM node:18-bullseye AS builder
WORKDIR /app

# cache deps
COPY package*.json ./
COPY package-lock.json ./

# usar legacy-peer-deps para evitar ERESOLVE (temporal)
RUN npm ci --legacy-peer-deps

# copy source and build
COPY . .
RUN npm run build

# remove dev deps
RUN npm prune --production

# ---------- runner ----------
FROM node:18-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3001
CMD ["node", "dist/main.js"]