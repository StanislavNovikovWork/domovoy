#!/usr/bin/env bash
# Деплой на VPS: собираем образ локально (на сервере не хватает памяти для сборки),
# отправляем по SSH и перезапускаем контейнер.
set -euo pipefail

HOST="${DEPLOY_HOST:-deploy@194.226.99.207}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/cash_vps}"
REMOTE_DIR="${DEPLOY_DIR:-cash}"
SSH=(ssh -i "$KEY" -o IdentitiesOnly=yes "$HOST")

cd "$(dirname "$0")"

echo "==> Сборка образа (linux/amd64)"
docker buildx build --platform linux/amd64 -t cash-app:latest --load .

echo "==> Отправка файлов и образа на сервер"
"${SSH[@]}" "mkdir -p ~/$REMOTE_DIR"
scp -i "$KEY" -o IdentitiesOnly=yes compose.yaml "$HOST:$REMOTE_DIR/compose.yaml"
docker save cash-app:latest | gzip | "${SSH[@]}" "gunzip | docker load"

echo "==> Перезапуск"
# пересоздаём только app: postgres как зависимость будет запущен, если не работает,
# но не пересоздаётся (для этого нужен --always-recreate-deps) — база не простаивает при деплое
"${SSH[@]}" "cd ~/$REMOTE_DIR && test -f .env.production && test -f .env.db || { echo 'Нет ~/$REMOTE_DIR/.env.production или .env.db на сервере'; exit 1; } && docker compose up -d --force-recreate app && docker image prune -f >/dev/null"

echo "==> Готово"
"${SSH[@]}" "cd ~/$REMOTE_DIR && docker compose ps"
