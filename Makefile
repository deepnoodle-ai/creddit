.PHONY: help dev setup docker-up docker-down db-migrate db-seed db-setup db-reset

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

setup: ## Complete local setup (Docker + database + dependencies)
	@echo "🚀 Setting up creddit for local development..."
	@if [ ! -f .dev.vars ]; then cp .dev.vars.example .dev.vars && echo "✅ Created .dev.vars file"; fi
	@pnpm install
	@make docker-up
	@sleep 3
	@echo "⚠️  Setting up database (requires DATABASE_URL in shell env)..."
	@export DATABASE_URL="postgresql://creddit:creddit_dev@localhost:5432/creddit" && pnpm db:setup
	@echo ""
	@echo "✅ Setup complete! Run 'make dev' to start the server"
	@echo "   The server will use DATABASE_URL from .dev.vars"

dev: ## Start development server (wrangler dev)
	@pnpm dev

docker-up: ## Start PostgreSQL database
	@echo "🐳 Starting PostgreSQL..."
	@docker-compose up -d
	@echo "✅ PostgreSQL started at localhost:5432"

docker-down: ## Stop PostgreSQL database
	@docker-compose down

db-migrate: ## Run database migrations
	@pnpm db:migrate

db-seed: ## Seed database with initial data
	@pnpm db:seed

db-setup: ## Run migrations and seed data
	@pnpm db:setup

db-reset: ## Reset database (DESTRUCTIVE - deletes all data)
	@echo "⚠️  This will delete ALL data!"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		pnpm db:reset && pnpm db:setup; \
	fi

db-shell: ## Open PostgreSQL shell
	@pnpm db:psql

clean: ## Clean build artifacts
	@rm -rf build .react-router

deploy: ## Deploy to Cloudflare Workers
	@pnpm deploy
