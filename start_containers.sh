#!/bin/bash
set -euo pipefail

# 🚀 File name: start_containers.sh
# 📌 Usage: ./start_containers.sh [environment]

# 🎨 ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 🛠️ Validate argument
if [ -z "${1-}" ]; then
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
export COMPOSE_PROJECT_NAME="cmg-api-${ENV}"

# 🐳 Check if Docker and Compose are installed
if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
  echo -e "${RED}❌ Error: Docker Compose is not installed. Please install it and try again.${NC}"
  exit 1
fi

# 📄 Check if the .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ Error: Environment file $ENV_FILE does not exist.${NC}"
  exit 1
fi

echo -e "${CYAN}🔧 Environment: ${ENV}${NC}"
echo -e "${CYAN}📄 Using .env file: ${ENV_FILE}${NC}"
echo -e "${CYAN}📦 Docker Project Name: ${COMPOSE_PROJECT_NAME}${NC}"

# 🛑 Stop and remove existing containers
echo -e "${YELLOW}🛑 Stopping and removing existing containers for ${ENV}...${NC}"
docker compose --env-file "$ENV_FILE" down

# 🔨 Build the containers
echo -e "${CYAN}🔨 Building the containers for ${ENV}...${NC}"
docker compose --env-file "$ENV_FILE" build

# 🚀 Start the containers in detached mode
echo -e "${GREEN}🚀 Starting the containers for ${ENV}...${NC}"
docker compose --env-file "$ENV_FILE" up -d

echo -e "${GREEN}✅ Containers for ${ENV} started successfully.${NC}"

# 🧹 Clean up unused Docker resources
echo -e "${YELLOW}🧹 Cleaning up unused Docker resources...${NC}"

# 🗑️ Remove unused images
docker image prune -a -f

# 📦 Clean build cache older than 24 hours
echo -e "${YELLOW}🗄️ Cleaning build cache older than 24 hours...${NC}"
docker builder prune --filter "until=24h" -f

# 🔄 Remove unused volumes
docker volume prune -f

echo -e "${GREEN}🎉 Cleanup completed successfully.${NC}"
