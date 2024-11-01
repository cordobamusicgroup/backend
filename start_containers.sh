#!/bin/bash

# File name: start_containers.sh

# Usage: ./start_containers.sh [env]

# Validate argument
if [ -z "$1" ]; then
  echo "[Start Containers Script] No environment specified. Use 'production' or 'staging'."
  exit 1
fi

ENV=$1

# Ensure ENV is either 'production' or 'staging'
if [[ "$ENV" != "production" && "$ENV" != "staging" ]]; then
  echo "[Start Containers Script] Invalid environment specified. Only 'production' or 'staging' are allowed."
  exit 1
fi

ENV_FILE=".env.${ENV}"

# Check if docker compose is installed
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    echo "[Start Containers Script] Docker Compose is not installed. Please install it and try again."
    exit 1
fi

# Check if the .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "[Start Containers Script] Environment file $ENV_FILE does not exist."
  exit 1
fi

# Stop and remove existing containers
echo "[Start Containers Script] Stopping and removing existing containers for $ENV..."
docker compose --env-file "$ENV_FILE" down
sleep 10  # Adding a delay to ensure proper shutdown

if [ $? -ne 0 ]; then
    echo "[Start Containers Script] Error while stopping and removing containers for $ENV."
    exit 1
fi

# Build the containers
echo "[Start Containers Script] Building the containers for $ENV..."
docker compose --env-file "$ENV_FILE" build

if [ $? -ne 0 ]; then
    echo "[Start Containers Script] Error during container build for $ENV."
    exit 1
fi

# Start the containers in the background
echo "[Start Containers Script] Starting the containers for $ENV..."
docker compose --env-file "$ENV_FILE" up -d

if [ $? -ne 0 ]; then
    echo "[Start Containers Script] Error while starting the containers for $ENV."
    exit 1
fi

echo "[Start Containers Script] Containers for $ENV started successfully."

# Optional: Clean up unused Docker resources
echo "[Start Containers Script] Cleaning up unused Docker resources..."

# Remove unused images
docker image prune -a -f
if [ $? -ne 0 ]; then
    echo "[Start Containers Script] Error while pruning Docker images."
    exit 1
fi

# Clean build cache only if older than 24 hours
echo "[Start Containers Script] Cleaning build cache older than 24 hours..."
docker builder prune --filter "until=24h" -f
if [ $? -ne 0 ]; then
    echo "[Start Containers Script] Error while cleaning build cache older than 24 hours."
    exit 1
fi

# Remove unused volumes
docker volume prune -f
if [ $? -ne 0 ]; then
    echo "[Start Containers Script] Error while pruning Docker volumes."
    exit 1
fi

echo "[Start Containers Script] Cleanup completed successfully."
