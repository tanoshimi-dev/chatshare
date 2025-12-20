.PHONY: help build up down restart logs ps clean db-migrate db-reset test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker containers
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-nginx: ## View nginx logs
	docker-compose logs -f nginx

ps: ## List running containers
	docker-compose ps

clean: ## Remove all containers, volumes, and images
	docker-compose down -v --rmi all

clean-volumes: ## Remove all volumes (WARNING: deletes all data)
	docker-compose down -v

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U chatshare -d chatshare_db

redis-cli: ## Open Redis CLI
	docker-compose exec redis redis-cli

backend-shell: ## Open backend container shell
	docker-compose exec backend sh

dev: ## Start services in development mode
	docker-compose up

prod: build up ## Build and start in production mode

test: ## Run backend tests
	cd app && go test -v ./...

init: ## Initialize the project (copy .env.example to .env)
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo ".env file created. Please edit it with your configuration."; \
	else \
		echo ".env file already exists."; \
	fi
