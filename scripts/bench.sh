#!/usr/bin/env bash
#
# Framework Adapter Benchmark Script
# 
# Usage: ./scripts/bench.sh [express|hono|compare]
#

set -e

PORT=7788
DURATION=10s
THREADS=4
CONNECTIONS=100

# Kill any process using the port
kill_port() {
  lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
  sleep 1
}

start_server() {
  local framework=$1
  echo ">>> Starting $framework server..."
  
  # Make sure port is free
  kill_port
  
  npx tsx test-adapter.ts "$framework" &
  SERVER_PID=$!
  sleep 3
  
  # Verify server is running
  if ! curl -s http://localhost:$PORT/ping > /dev/null 2>&1; then
    echo "ERROR: Server failed to start"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
  fi
}

stop_server() {
  if [ -n "$SERVER_PID" ]; then
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    unset SERVER_PID
  fi
  # Extra wait to ensure port is released
  sleep 2
  kill_port
}

run_benchmark() {
  local framework=$1
  echo ""
  echo "=== $framework Benchmark ($DURATION, $THREADS threads, $CONNECTIONS connections) ==="
  echo ""
  wrk -t$THREADS -c$CONNECTIONS -d$DURATION http://localhost:$PORT/ping
}

trap stop_server EXIT

case "${1:-compare}" in
  express)
    start_server express
    run_benchmark EXPRESS
    ;;
  hono)
    start_server hono
    run_benchmark HONO
    ;;
  compare)
    echo "══════════════════════════════════════════════════════════"
    echo "  Psychic Framework Adapter Benchmark"
    echo "══════════════════════════════════════════════════════════"
    echo ""
    
    # Express benchmark
    start_server express
    run_benchmark EXPRESS
    stop_server
    sleep 2
    
    echo ""
    echo "──────────────────────────────────────────────────────────"
    echo ""
    
    # Hono benchmark
    start_server hono
    run_benchmark HONO
    stop_server
    
    echo ""
    echo "══════════════════════════════════════════════════════════"
    ;;
  *)
    echo "Usage: $0 [express|hono|compare]"
    exit 1
    ;;
esac
