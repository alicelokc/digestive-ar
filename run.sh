#!/usr/bin/env bash
# Start a local static server for Digestive AR (camera needs localhost/HTTPS)
cd "$(dirname "$0")"
PORT="${1:-8080}"
echo "消化系統 AR → http://localhost:${PORT}/"
echo "按 Ctrl+C 停止"
python3 -m http.server "$PORT"
