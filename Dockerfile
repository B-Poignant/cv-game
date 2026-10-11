# syntax=docker/dockerfile:1
# cv-game: one image running the Colyseus server and serving the built client (F-081).

# --- Build: type-check, build the client (dist/) and the server (build/server/) ---
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build

# --- Runtime: production dependencies and the built output only ---
FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    PORT=2567
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/build ./build

USER node
EXPOSE 2567

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" > /dev/null || exit 1

CMD ["node", "build/server/index.js"]
