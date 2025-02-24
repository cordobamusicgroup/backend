#!/bin/bash

# 🚀 File name: start_containers.sh
# 📌 Usage: ./start_containers.sh [environment]

# 🎨 ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 🛠️ Validate argument
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: No environment specified. Use 'production' or 'staging'.${NC}"
  exit 1
fi

ENV=$1

# 🔄 Ensure ENV is either 'production' or 'staging'
if [[ "$ENV" != "production" && "$ENV" != "staging" ]]; then
  echo -e "${RED}❌ Error: Invalid environment specified. Allowed values: 'production' or 'staging'.${NC}"
  exit 1
fi

ENV_FILE=".env.${ENV}"

# 🐳 Check if Docker is installed
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
  echo -e "${RED}❌ Error: Docker Compose is not installed. Please install it and try again.${NC}"
  exit 1
fi

# 📄 Check if the .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ Error: Environment file $ENV_FILE does not exist.${NC}"
  exit 1
fi

# 🛑 Stop and remove existing containers
echo -e "${YELLOW}🛑 Stopping and removing existing containers for ${ENV}...${NC}"
docker compose --env-file "$ENV_FILE" down
sleep 5  # Shorter wait time for smoother execution

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Error: Failed to stop and remove containers for ${ENV}.${NC}"
  exit 1
fi

# 🔨 Build the containers
echo -e "${CYAN}🔨 Building the containers for ${ENV}...${NC}"
docker compose --env-file "$ENV_FILE" build

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Error: Failed to build containers for ${ENV}.${NC}"
  exit 1
fi

# 🚀 Start the containers in detached mode
echo -e "${GREEN}🚀 Starting the containers for ${ENV}...${NC}"
docker compose --env-file "$ENV_FILE" up -d

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Error: Failed to start containers for ${ENV}.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Containers for ${ENV} started successfully.${NC}"

# 🧹 Clean up unused Docker resources
echo -e "${YELLOW}🧹 Cleaning up unused Docker resources...${NC}"

# 🗑️ Remove unused images
docker image prune -a -f
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Error: Failed to prune unused Docker images.${NC}"
  exit 1
fi

# 📦 Clean build cache older than 24 hours
echo -e "${YELLOW}🗄️ Cleaning build cache older than 24 hours...${NC}"
docker builder prune --filter "until=24h" -f
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Error: Failed to clean old build cache.${NC}"
  exit 1
fi

# 🔄 Remove unused volumes
docker volume prune -f
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Error: Failed to prune unused Docker volumes.${NC}"
  exit 1
fi

echo -e "${GREEN}🎉 Cleanup completed successfully.${NC}"
