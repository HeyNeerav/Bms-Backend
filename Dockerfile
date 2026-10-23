# ---------- Build Stage ----------

FROM node:26.12.1-bookworm-slim AS builder

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g pnpm

WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm prune --prod


# ---------- Production Stage ----------

FROM node:26.12.1-bookworm-slim

WORKDIR /app

# Chromium and required runtime libraries for Puppeteer
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        chromium \
        ca-certificates \
        fonts-liberation \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libcups2 \
        libdbus-1-3 \
        libdrm2 \
        libgbm1 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libx11-6 \
        libx11-xcb1 \
        libxcb1 \
        libxcomposite1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxrandr2 \
        xdg-utils \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Production dependencies
COPY --from=builder --chown=node:node \
    /app/node_modules ./node_modules

# Compiled application
COPY --from=builder --chown=node:node \
    /app/dist ./dist

# Runtime assets
COPY --from=builder --chown=node:node \
    /app/package.json ./package.json

COPY --from=builder --chown=node:node \
    /app/public ./public

# Invoice templates required at runtime
COPY --from=builder --chown=node:node \
    /app/src/modules/invoice/templates \
    ./dist/src/modules/invoice/templates

USER node

EXPOSE 3000

CMD ["node", "dist/index.mjs"]