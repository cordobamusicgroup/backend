#!/bin/bash

# File name: start_containers.sh

# Usage: ./start_containers.sh [environment_name]

# Validate argument
if [ -z "$1" ]; then
  echo "[Start Containers Script] No environment specified. Provide the environment name (e.g., staging, development)."
  exit 1
fi

TARGET_ENVIRONMENT=$1
ENVIRONMENT_FILE=".env.${TARGET_ENVIRONMENT}"

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo "[Start Containers Script] docker-compose is not installed. Please install it and try again."
    exit 1
fi

# Stop and remove existing containers
echo "[Start Containers Script] Stopping and removing existing containers for $TARGET_ENVIRONMENT..."
docker compose --env-file "$ENVIRONMENT_FILE" down
sleep 10  # Adding a delay to ensure proper shutdown

if [ $? -ne 0 ]; then
    echo "[Start Containers Script] Error while stopping and removing containers for $TARGET_ENVIRONMENT."
    exit 1
fi

# Build the containers
echo "[Start Containers Script] Building the containers for $TARGET_ENVIRONMENT..."
docker compose --env-file "$ENVIRONMENT_FILE" build

if [ $? -ne 0 ]; then
    echo "[Start Containers Script] Error during container build for $TARGET_ENVIRONMENT."
    exit 1
fi

# Start the containers in the background
echo "[Start Containers Script] Starting the containers for $TARGET_ENVIRONMENT..."
docker compose --env-file "$ENVIRONMENT_FILE" up -d

if [ $? -ne 0 ]; then
    echo "[Start Containers Script] Error while starting the containers for $TARGET_ENVIRONMENT."
    exit 1
fi

echo "[Start Containers Script] Containers for $TARGET_ENVIRONMENT started successfully."

# Clean up unused Docker resources
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