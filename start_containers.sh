#!/bin/bash

# File name: start_containers.sh

# Valid environments
VALID_ENVS=("production" "staging")

# Validate argument
if [[ -z "$1" ]]; then
  echo "[Start Containers Script] No environment specified. Use 'production' or 'staging'."
  exit 1
fi

ENV=${1,,}
ENV_FILE=".env.${ENV}"

# Check if environment is valid
if [[ ! " ${VALID_ENVS[@]} " =~ " ${ENV} " ]]; then
  echo "[Start Containers Script] Invalid environment specified: '${ENV}'. Use 'production' or 'staging'."
  exit 1
fi

# Debugging information
echo "[Debug] ENV set to: '$ENV'"
echo "[Debug] ENV_FILE set to: '$ENV_FILE'"

# Check prerequisites
check_prerequisites() {
  if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    echo "[Start Containers Script] Docker Compose is not installed. Please install it and try again."
    exit 1
  fi

  if [ ! -f "$ENV_FILE" ]; then
    echo "[Start Containers Script] Environment file '$ENV_FILE' does not exist in $(pwd)."
    ls -l
    exit 1
  fi
}

stop_containers() {
  echo "[Start Containers Script] Stopping and removing existing containers for $ENV..."
  docker compose --env-file "$ENV_FILE" down
}

build_containers() {
  echo "[Start Containers Script] Building the containers for $ENV..."
  docker compose --env-file "$ENV_FILE" build
}

start_containers() {
  echo "[Start Containers Script] Starting the containers for $ENV..."
  docker compose --env-file "$ENV_FILE" up -d
}

clean_docker_resources() {
  echo "[Start Containers Script] Cleaning up unused Docker resources..."
  docker image prune -a -f
  docker builder prune --filter "until=24h" -f
  docker volume prune -f
}

main() {
  check_prerequisites
  stop_containers
  build_containers
  start_containers
  clean_docker_resources
  echo "[Start Containers Script] Containers for $ENV started and cleaned up successfully."
}

main
