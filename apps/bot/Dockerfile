##############
# Base Image #
##############
FROM oven/bun:1-slim AS base

RUN useradd -m -d /home/node node

# Install Doppler CLI (Only for runtime)
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg && \
  curl -sLf --retry 3 --tlsv1.2 --proto "=https" \
  'https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key' | gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg && \
  echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" | tee /etc/apt/sources.list.d/doppler-cli.list && \
  apt-get update && apt-get -y install --no-install-recommends doppler && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app
USER node

###########
# Builder #
###########
FROM base AS builder

USER root

# Install turbo in a global directory accessible to node
RUN bun add -g turbo

# Ensure /app belongs to node
RUN mkdir -p /app && chown -R node:node /app

# Switch to node user before installing dependencies
WORKDIR /app

# Set PATH explicitly to include global binaries
ENV PATH="/home/node/.bun/bin:$PATH"

# Copy source code (after switching user)
COPY --chown=node:node . .

# Install dependencies & Build
RUN bun install --frozen-lockfile
RUN bun run build

RUN bun install --production --frozen-lockfile

# Remove any unnecessary files
RUN rm -rf /app/node_modules/.cache

##########
# Runner #
##########
FROM base AS runner

# Copy only the built app (no node_modules, no source files)
COPY --from=builder --chown=node:node /app /app

# Set the command to run the app
CMD ["doppler", "run", "--", "bun", "apps/bot/dist/index.js"]