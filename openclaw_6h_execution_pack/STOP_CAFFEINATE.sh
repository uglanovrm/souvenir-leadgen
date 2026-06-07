#!/usr/bin/env bash
set -euo pipefail
if [ -f .caffeinate.pid ]; then
  kill "$(cat .caffeinate.pid)" 2>/dev/null || true
  rm -f .caffeinate.pid
  echo "Stopped caffeinate."
else
  echo "No .caffeinate.pid found."
fi
