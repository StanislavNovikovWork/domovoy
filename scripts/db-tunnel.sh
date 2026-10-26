#!/usr/bin/env bash
# SSH-туннель к серверному Postgres: 127.0.0.1:5432 -> postgres на VPS.
# Крутится в цикле и переподключается, если соединение отвалилось.
HOST="${DEPLOY_HOST:-deploy@194.226.99.207}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/cash_vps}"

while true; do
  ssh -i "$KEY" -o IdentitiesOnly=yes -o ExitOnForwardFailure=yes \
    -o ServerAliveInterval=15 -o ServerAliveCountMax=3 \
    -N -L 5432:127.0.0.1:5432 "$HOST"
  echo "tunnel down, reconnecting..."
  sleep 2
done
