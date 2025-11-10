# ---------- builder ----------
FROM node:18-bullseye AS builder
WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH

# copiar manifests
COPY package*.json ./
COPY package-lock.json ./

# instalar (intentar ci; si falla, instalar con legacy peer deps para permitir la compilación)
# NOTA: si npm ci funciona, se mantiene la reproducibilidad.
RUN npm ci || npm install --legacy-peer-deps

# copiar código y construir
COPY . .
RUN npm run build

# reemplazar node_modules por solo dependencias de producción en una nueva resolución (evita prune)
# usamos --omit=dev y --legacy-peer-deps para tolerar los peer-deps mientras instalamos sólo prod.
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

# ---------- runner ----------
FROM node:18-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3001
CMD ["node", "dist/main.js"]