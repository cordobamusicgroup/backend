#!/bin/bash

# File name: start_containers.sh

# Usage: ./start_containers.sh [prod|preview]

# Validate argument
if [ -z "$1" ]; then
  echo "[CMG-DEV] No environment specified. Use 'prod' or 'preview'."
  exit 1
fi

ENV=$1
ENV_FILE=".env.${ENV}"

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo "[CMG-DEV] docker-compose is not installed. Please install it and try again."
    exit 1
fi

# Stop and remove existing containers
echo "[CMG-DEV] Stopping and removing existing containers for $ENV..."
docker compose --env-file "$ENV_FILE" down
sleep 10  # Adding a delay to ensure proper shutdown

if [ $? -ne 0 ]; then
    echo "[CMG-DEV] Error while stopping and removing containers for $ENV."
    exit 1
fi

# Build the containers
echo "[CMG-DEV] Building the containers for $ENV..."
docker compose --env-file "$ENV_FILE" build

if [ $? -ne 0 ]; then
    echo "[CMG-DEV] Error during container build for $ENV."
    exit 1
fi

# Start the containers in the background
echo "[CMG-DEV] Starting the containers for $ENV..."
docker compose --env-file "$ENV_FILE" up -d

if [ $? -ne 0 ]; then
    echo "[CMG-DEV] Error while starting the containers for $ENV."
    exit 1
fi

echo "[CMG-DEV] Containers for $ENV started successfully."
