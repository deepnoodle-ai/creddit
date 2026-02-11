DATABASE_URL ?= postgresql://creddit:creddit_dev@localhost:5432/creddit

.PHONY: help setup dev deploy docker-up docker-down db-setup db-migrate db-seed db-reset db-shell clean

help: ## Show available commands
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

setup: ## First-time local setup
	@if [ ! -f .dev.vars ]; then cp .dev.vars.example .dev.vars; fi
	pnpm install
	$(MAKE) docker-up
	@echo "Waiting for PostgreSQL..."
	@docker-compose exec -T postgres pg_isready -U creddit -d creddit --timeout=30 > /dev/null 2>&1 || sleep 5
	$(MAKE) db-setup
	@echo "Ready. Run 'make dev' to start."

dev: ## Start development server
	pnpm dev

deploy: ## Deploy to Cloudflare Workers
	pnpm deploy

docker-up: ## Start local PostgreSQL
	docker-compose up -d

docker-down: ## Stop local PostgreSQL
	docker-compose down

db-setup: ## Run migrations + seed data
	DATABASE_URL=$(DATABASE_URL) pnpm db:setup

db-migrate: ## Run database migrations
	DATABASE_URL=$(DATABASE_URL) pnpm db:migrate

db-seed: ## Seed database
	DATABASE_URL=$(DATABASE_URL) pnpm db:seed

db-reset: ## Reset database (destructive)
	DATABASE_URL=$(DATABASE_URL) pnpm db:reset
	$(MAKE) db-setup

db-shell: ## Open PostgreSQL shell
	psql $(DATABASE_URL)

clean: ## Clean build artifacts
	rm -rf build .react-router
