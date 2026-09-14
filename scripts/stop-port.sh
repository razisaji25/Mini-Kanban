#!/usr/bin/env bash
# Kill whatever is listening on the given TCP port.
#
# `uv run <server>` spawns nested child processes, so on Windows the PID a
# shell's `$!` captures after backgrounding it is not the PID actually
# holding the port — killing it leaves the real server running. Looking up
# the port's owner via netstat and killing that PID directly is what
# actually works here.

set -euo pipefail

port="${1:?usage: stop-port.sh <port>}"

pid="$(netstat -ano 2>/dev/null | awk -v p="127.0.0.1:$port " '$0 ~ p && /LISTENING/ {print $NF}' | head -1)"

if [ -z "$pid" ]; then
  exit 0
fi

if command -v taskkill >/dev/null 2>&1; then
  taskkill //PID "$pid" //F >/dev/null 2>&1 || true
else
  kill "$pid" 2>/dev/null || true
fi
