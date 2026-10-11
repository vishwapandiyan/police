#!/bin/bash
# Run this in a Terminal window so you can see API logs when the UI is clicked.
cd "$(dirname "$0")"
source venv/bin/activate
export TOKENIZERS_PARALLELISM=false
export OMP_NUM_THREADS=1
export PORT="${PORT:-5001}"
if lsof -ti:"$PORT" >/dev/null 2>&1; then
  echo "Stopping the process already using port $PORT..."
  lsof -ti:"$PORT" | xargs kill -9 2>/dev/null || true
  sleep 1
fi
echo "PRISM-PY API on http://localhost:$PORT"
echo "Leave this window open. UI clicks will print here."
python main_complete.py
