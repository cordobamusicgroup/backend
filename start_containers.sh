#!/bin/bash

# File name: start_containers.sh

# Validate argument
VALID_ENVS=("production" "staging")

if [[ ! " ${VALID_ENVS[@]} " =~ " $1 " ]]; then
  echo "[Start Containers Script] Invalid environment specified. Use 'production' or 'staging'."
  exit 1
fi

ENV=$1
ENV_FILE=".env.${ENV}"

# Check prerequisites
check_prerequisites() {
  if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    echo "[Start Containers Script] Docker Compose is not installed. Please install it and try again."
    exit 1
  fi

  if [ ! -f "$ENV_FILE" ]; then
    echo "[Start Containers Script] Environment file $ENV_FILE does not exist."
    exit 1
  fi
}

# Stop and remove existing containers
stop_containers() {
  echo "[Start Containers Script] Stopping and removing existing containers for $ENV..."
  docker compose --env-file "$ENV_FILE" down
  if [ $? -ne 0 ]; then
    echo "[Start Containers Script] Error while stopping containers for $ENV."
    exit 1
  fi
}

# Build containers
build_containers() {
  echo "[Start Containers Script] Building the containers for $ENV..."
  docker compose --env-file "$ENV_FILE" build
  if [ $? -ne 0 ]; then
    echo "[Start Containers Script] Error during container build for $ENV."
    exit 1
  fi
}

# Start containers
start_containers() {
  echo "[Start Containers Script] Starting the containers for $ENV..."
  docker compose --env-file "$ENV_FILE" up -d
  if [ $? -ne 0 ]; then
    echo "[Start Containers Script] Error while starting the containers for $ENV."
    exit 1
  fi
}

# Clean up unused Docker resources
clean_docker_resources() {
  echo "[Start Containers Script] Cleaning up unused Docker resources..."
  docker image prune -a -f
  docker builder prune --filter "until=24h" -f
  docker volume prune -f
}

# Main process
main() {
  check_prerequisites
  stop_containers
  build_containers
  start_containers
  clean_docker_resources
  echo "[Start Containers Script] Containers for $ENV started and cleaned up successfully."
}

main
