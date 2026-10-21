# сборка идёт на архитектуре машины, где запущен docker (быстро, без эмуляции);
# итоговый образ runner собирается уже под архитектуру сервера
FROM --platform=$BUILDPLATFORM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL нужен только чтобы модули загрузились при сборке; к базе во время сборки никто не подключается
ENV DATABASE_URL=postgresql://build:build@localhost/build
ENV NEXT_TELEMETRY_DISABLED=1
RUN yarn build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]
