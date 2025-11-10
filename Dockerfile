# ---------- builder ----------
FROM node:18-bullseye AS builder
WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH

# copiar manifiestos para cache
COPY package*.json ./
COPY package-lock.json ./

# intentar npm ci (determinista). si falla, caer a npm install --legacy-peer-deps (temporal)
RUN npm ci || npm install --legacy-peer-deps

# copiar código y construir
COPY . .
RUN npm run build

# dejar solo dependencias de producción
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