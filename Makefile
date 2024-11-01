ENV ?= production
ENV_FILE = .env.$(ENV)
IMAGE_NAME = cmg-api-$(ENV)
DOCKER_COMPOSE = docker compose --env-file $(ENV_FILE)
START_SCRIPT = ./start_containers.sh $(ENV)


.PHONY: build start stop restart clean deploy

# Construir la imagen Docker
build:
	@echo "Building Docker images for $(ENV)..."
	$(DOCKER_COMPOSE) build

# Iniciar contenedores en modo detach
start:
	@echo "Starting containers for $(ENV)..."
	$(DOCKER_COMPOSE) up -d

# Detener y eliminar contenedores
stop:
	@echo "Stopping containers for $(ENV)..."
	$(DOCKER_COMPOSE) down

# Reiniciar contenedores
restart: stop start

# Limpiar recursos Docker
clean:
	@echo "Cleaning up Docker images, containers, and volumes..."
	docker image prune -a -f
	docker volume prune -f
	docker builder prune --filter "until=24h" -f

# Desplegar: Construye y lanza los contenedores
deploy:
	@echo "Deploying containers for $(ENV)..."
	make build
	make start
