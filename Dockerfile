## Multi-stage Dockerfile for building and running the NestJS app with Node 18
## Builder: full Node image to install deps and build TypeScript
FROM node:18-bullseye AS builder
WORKDIR /app

# copy dependency manifests first for caching
COPY package*.json ./
COPY package-lock.json ./

# install all deps (including dev) to build the project
RUN npm ci

# copy source and build
COPY . .
RUN npm run build

# remove dev dependencies to keep only production deps (prune)
RUN npm prune --production

## Runner: slim image with only production files
FROM node:18-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# copy built artifacts and production node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Expose the default Nest port (adjust if your app uses a different port)
EXPOSE 3001

# Start the app
CMD ["node", "dist/main.js"]
