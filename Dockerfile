# Builds and runs the CairnOS MCP server over stdio (used by Glama's checks).
# It boots, self-migrates a fresh local SQLite database, and answers MCP
# introspection (initialize + tools/list). All logs go to stderr; stdout
# carries only JSON-RPC, so the protocol stream stays clean.
FROM node:22-bookworm-slim

# better-sqlite3 compiles a native addon, which needs a build toolchain.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile

# Keep the database and migrations resolvable inside the container.
ENV CAIRN_DATA_DIR=/data \
    CAIRN_MIGRATIONS_DIR=/app/packages/db/migrations
RUN mkdir -p /data

# stdio MCP server.
CMD ["node", "--import", "tsx", "apps/mcp-server/src/index.ts"]
