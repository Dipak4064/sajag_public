#!/usr/bin/env bash
# ==============================================================================
# SAJAG // PRAKOP (सजग) - Unified Platform Startup Script
# Starts:
#   1. Embedded MQTT Broker (Port 1883)
#   2. Emergency API Server (Port 4000)
#   3. Virtual ESP32 IoT Simulator (Port 4001)
#   4. Municipal Command Center Dashboard (Port 3001)
#   5. Citizen Emergency Response Portal PWA (Port 3000)
# ==============================================================================

set -e

# Detect base directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -d "$SCRIPT_DIR/sajag_backend" ] && [ -d "$SCRIPT_DIR/sajag_admin" ] && [ -d "$SCRIPT_DIR/sajag_public" ]; then
  BASE_DIR="$SCRIPT_DIR"
elif [ -d "$SCRIPT_DIR/../sajag_backend" ] && [ -d "$SCRIPT_DIR/../sajag_admin" ] && [ -d "$SCRIPT_DIR/../sajag_public" ]; then
  BASE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  BASE_DIR="/home/dipak/hacathon"
fi

BACKEND_DIR="$BASE_DIR/sajag_backend"
ADMIN_DIR="$BASE_DIR/sajag_admin"
PUBLIC_DIR="$BASE_DIR/sajag_public"

# ANSI Colors
CLR_RESET="\033[0m"
CLR_RED="\033[1;31m"
CLR_GREEN="\033[1;32m"
CLR_YELLOW="\033[1;33m"
CLR_BLUE="\033[1;34m"
CLR_PURPLE="\033[1;35m"
CLR_CYAN="\033[1;36m"
CLR_WHITE="\033[1;37m"
CLR_BOLD="\033[1m"

echo -e "${CLR_RED}====================================================================${CLR_RESET}"
echo -e "${CLR_WHITE}${CLR_BOLD}  🚨 SAJAG // PRAKOP (सजग) - Disaster Early Warning Platform${CLR_RESET}"
echo -e "${CLR_RED}====================================================================${CLR_RESET}"
echo -e "${CLR_CYAN}📁 Working Directory:${CLR_RESET} $BASE_DIR"

# Free any old processes holding our ports
kill_port_process() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "${CLR_YELLOW}⚡ Releasing port $port (Killing stale PID(s): $pids)...${CLR_RESET}"
    kill -9 $pids 2>/dev/null || true
  fi
}

echo -e "\n${CLR_YELLOW}🔍 Checking ports (1883, 4000, 4001, 3000, 3001)...${CLR_RESET}"
kill_port_process 1883
kill_port_process 4000
kill_port_process 4001
kill_port_process 3000
kill_port_process 3001

# Track child PIDs for clean exit
PIDS=()

cleanup() {
  echo -e "\n\n${CLR_RED}====================================================================${CLR_RESET}"
  echo -e "${CLR_YELLOW}🛑 Stopping all SAJAG services...${CLR_RESET}"
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill -TERM "$pid" 2>/dev/null || true
    fi
  done
  sleep 1
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
  done
  echo -e "${CLR_GREEN}✔ All services terminated cleanly.${CLR_RESET}"
  echo -e "${CLR_RED}====================================================================${CLR_RESET}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# 1. Start Embedded MQTT Broker (Port 1883)
echo -e "${CLR_CYAN}[1/5] Starting Embedded MQTT Broker (Port 1883)...${CLR_RESET}"
(
  cd "$BACKEND_DIR"
  node infrastructure/broker.js 2>&1 | sed -u "s/^/$(printf "${CLR_CYAN}[MQTT:1883]${CLR_RESET} ")/"
) &
PIDS+=($!)
sleep 1

# 2. Start Emergency API Server (Port 4000)
echo -e "${CLR_GREEN}[2/5] Starting Emergency API Server (Port 4000)...${CLR_RESET}"
(
  cd "$BACKEND_DIR"
  npm run dev:api 2>&1 | sed -u "s/^/$(printf "${CLR_GREEN}[API:4000]${CLR_RESET} ")/"
) &
PIDS+=($!)
sleep 1

# 3. Start Virtual ESP32 Simulator (Port 4001)
echo -e "${CLR_PURPLE}[3/5] Starting Virtual ESP32 IoT Simulator (Port 4001)...${CLR_RESET}"
(
  cd "$BACKEND_DIR"
  npm run dev:sim 2>&1 | sed -u "s/^/$(printf "${CLR_PURPLE}[SIM:4001]${CLR_RESET} ")/"
) &
PIDS+=($!)
sleep 1

# 4. Start Municipal Command Center (Port 3001)
echo -e "${CLR_YELLOW}[4/5] Starting Municipal Command Center Admin (Port 3001)...${CLR_RESET}"
(
  cd "$ADMIN_DIR"
  npm run dev 2>&1 | sed -u "s/^/$(printf "${CLR_YELLOW}[ADMIN:3001]${CLR_RESET} ")/"
) &
PIDS+=($!)

# 5. Start Citizen Emergency Portal (Port 3000)
echo -e "${CLR_RED}[5/5] Starting Citizen Emergency Portal PWA (Port 3000)...${CLR_RESET}"
(
  cd "$PUBLIC_DIR"
  npm run dev 2>&1 | sed -u "s/^/$(printf "${CLR_RED}[CITIZEN:3000]${CLR_RESET} ")/"
) &
PIDS+=($!)

echo -e "\n${CLR_GREEN}====================================================================${CLR_RESET}"
echo -e "${CLR_WHITE}${CLR_BOLD}  🚀 ALL SAJAG SERVICES ARE RUNNING!${CLR_RESET}"
echo -e "${CLR_GREEN}====================================================================${CLR_RESET}"
echo -e "  📱 ${CLR_BOLD}Citizen Public Portal:${CLR_RESET}    ${CLR_CYAN}http://localhost:3000${CLR_RESET}"
echo -e "  🏢 ${CLR_BOLD}Command Center Admin:${CLR_RESET}     ${CLR_CYAN}http://localhost:3001${CLR_RESET}"
echo -e "  ⚙️  ${CLR_BOLD}Backend API Health:${CLR_RESET}       ${CLR_CYAN}http://localhost:4000/health${CLR_RESET}"
echo -e "  📡 ${CLR_BOLD}Virtual ESP32 Sim:${CLR_RESET}        ${CLR_CYAN}http://localhost:4001${CLR_RESET}"
echo -e "  📶 ${CLR_BOLD}MQTT Telemetry Broker:${CLR_RESET}    ${CLR_CYAN}mqtt://localhost:1883${CLR_RESET}"
echo -e "${CLR_GREEN}====================================================================${CLR_RESET}"
echo -e "${CLR_YELLOW}Press Ctrl+C to stop all services simultaneously.${CLR_RESET}\n"

wait
