#!/usr/bin/env bash
# Stop the harvest tmux session cleanly (SIGTERM the bun process first,
# wait, then kill the session).

set -euo pipefail
SESSION="harvest"

if ! tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "ℹ️  tmux session '$SESSION' not running."
  exit 0
fi

# Send Ctrl+C to give the bun process a chance to graceful-shutdown
# (closes SQLite, drains active sessions). Bun honours SIGINT.
echo "⏸  Sending SIGINT to harvest backend…"
tmux send-keys -t "$SESSION" C-c
sleep 3

if curl -s http://localhost:4319/api/health >/dev/null 2>&1; then
  echo "⚠️  Server still responding after 3s — sending SIGTERM"
  PID=$(lsof -ti :4319 | head -1)
  [ -n "$PID" ] && kill -TERM "$PID" 2>/dev/null || true
  sleep 2
fi

tmux kill-session -t "$SESSION" 2>/dev/null || true
echo "✅ Harvest tmux session stopped."
