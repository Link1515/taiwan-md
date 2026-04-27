#!/usr/bin/env bash
# Start Taiwan.md Harvest backend in a detached tmux session.
#
# Why tmux instead of launchd: spawned `claude` CLI needs macOS Keychain
# access for OAuth subscription auth. launchd-managed processes run in a
# limited security context and cannot read user keychain. A tmux session
# launched from your interactive shell inherits full keychain access.
#
# Usage:
#   bash start.sh         # start (idempotent — re-attaches if already running)
#   bash status.sh        # check
#   bash attach.sh        # tmux attach -t harvest
#   bash stop.sh          # kill the session
#
# Auto-start at login (optional): add to ~/.zprofile or ~/.zshrc:
#   bash /Users/cheyuwu/Projects/taiwan-md/docs/semiont/harvest/backend/tmux/start.sh

set -euo pipefail

SESSION="harvest"
BACKEND_DIR="/Users/cheyuwu/Projects/taiwan-md/docs/semiont/harvest/backend"
LOG_DIR="$HOME/Library/Logs/taiwan-md-harvest"

mkdir -p "$LOG_DIR"

# Already running?
if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "ℹ️  tmux session '$SESSION' already exists."
  echo "    attach: tmux attach -t $SESSION"
  echo "    detach: ctrl+b d"
  echo "    stop:   bash stop.sh"
  exit 0
fi

# Sanity: claude must be authed via subscription. If not, abort with hint.
AUTH_STATE=$(~/.bun/bin/claude auth status 2>/dev/null | grep loggedIn || true)
if [[ "$AUTH_STATE" != *"true"* ]]; then
  echo "❌ claude CLI not authenticated. Run: ~/.bun/bin/claude setup-token"
  exit 1
fi

# Confirm port 4319 free
if lsof -ti :4319 >/dev/null 2>&1; then
  echo "❌ Port 4319 already in use. Stop existing harvest first."
  lsof -i :4319
  exit 1
fi

# Create the session
tmux new-session -d -s "$SESSION" -c "$BACKEND_DIR"

# Set logging via pipe-pane (tmux captures stdout/stderr to file)
tmux pipe-pane -t "$SESSION" "cat >> '$LOG_DIR/tmux.log'"

# Send the run command
tmux send-keys -t "$SESSION" "echo '🧬 Taiwan.md Harvest — tmux start at $(date)'" C-m
tmux send-keys -t "$SESSION" "export HARVEST_LOG_PRETTY=true HARVEST_LOG_LEVEL=info HARVEST_AUTO_COMMIT_REPORT=true" C-m
tmux send-keys -t "$SESSION" "bun run src/server.ts" C-m

# Wait briefly + verify
sleep 3
if curl -s http://localhost:4319/api/health >/dev/null 2>&1; then
  echo "✅ Harvest backend up in tmux session '$SESSION'."
  echo "   📡 http://localhost:4319/api/health"
  echo "   🔑 inheriting your shell's keychain access — spawned claude will auth via your subscription"
  echo "   📋 attach: tmux attach -t $SESSION (ctrl+b d to detach)"
  echo "   📋 logs:   tail -f $LOG_DIR/tmux.log"
  echo "   📋 stop:   bash $(dirname "$0")/stop.sh"
else
  echo "⚠️  Started tmux but http://localhost:4319 not responding. Check log:"
  echo "    tmux attach -t $SESSION"
  exit 2
fi
