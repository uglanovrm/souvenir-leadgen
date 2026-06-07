#!/usr/bin/env bash
set -euo pipefail

echo "== Mac prep for OpenClaw 6-hour sprint =="

echo "Current directory: $(pwd)"

echo "== Git status =="
git status || true

echo "== Creating/switching branch =="
git checkout -b feature/6h-openclaw-mvp 2>/dev/null || git checkout feature/6h-openclaw-mvp

echo "== Starting caffeinate to keep Mac awake =="
if [ -f .caffeinate.pid ] && kill -0 "$(cat .caffeinate.pid)" 2>/dev/null; then
  echo "caffeinate already running with pid $(cat .caffeinate.pid)"
else
  caffeinate -dimsu & echo $! > .caffeinate.pid
  echo "caffeinate pid: $(cat .caffeinate.pid)"
fi

echo "== Creating initial log files if missing =="
touch PROGRESS_LOG.md OPENCLAW_6H_REPORT.md

echo "Ready. Paste OPENCLAW_6H_AUTONOMOUS_PROMPT.md into OpenClaw."
