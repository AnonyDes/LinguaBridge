FROM node:24-bookworm-slim

RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @linguabridge/api... build

ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
CMD ["pnpm", "--filter", "@linguabridge/api", "start"]
