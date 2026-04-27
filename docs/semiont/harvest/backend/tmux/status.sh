#!/usr/bin/env bash
# Status snapshot: tmux session + HTTP health + active sessions count.

SESSION="harvest"

echo "━━━ tmux session ━━━"
if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "  ✅ '$SESSION' running"
  tmux list-windows -t "$SESSION" -F "  window: #{window_name} pid=#{pane_pid}"
else
  echo "  ❌ '$SESSION' not running. Start: bash start.sh"
  exit 1
fi

echo ""
echo "━━━ HTTP /api/health ━━━"
curl -s http://localhost:4319/api/health | python3 -m json.tool 2>/dev/null || echo "  ❌ not responding"

echo ""
echo "━━━ active sessions ━━━"
curl -s http://localhost:4319/api/sessions/active | python3 -m json.tool 2>/dev/null || true

echo ""
echo "━━━ task counts ━━━"
curl -s http://localhost:4319/api/tasks | python3 -c "
import sys, json
from collections import Counter
data = json.load(sys.stdin)
counts = Counter(t['status'] for t in data['tasks'])
for status, count in sorted(counts.items()):
    print(f'  {status}: {count}')
print(f'  total: {data[\"count\"]}')
" 2>/dev/null || true

echo ""
echo "━━━ commands ━━━"
echo "  attach: tmux attach -t $SESSION (ctrl+b d to detach)"
echo "  logs:   tail -f ~/Library/Logs/taiwan-md-harvest/tmux.log"
echo "  stop:   bash $(dirname "$0")/stop.sh"
