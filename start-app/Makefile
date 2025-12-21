# Linear Shackles - Makefile
# Always use bun, never pnpm

.PHONY: dev build preview test lint format check install clean db-generate db-migrate db-push db-studio db-seed help

# Default target
.DEFAULT_GOAL := help

# =============================================================================
# Development
# =============================================================================

dev: ## Start development server
	bun dev

build: ## Build for production
	bun run build

preview: ## Preview production build
	bun run preview

# =============================================================================
# Code Quality
# =============================================================================

test: ## Run tests
	bun run test

lint: ## Run ESLint
	bun run lint

format: ## Run Prettier
	bun run format

check: ## Run Prettier + ESLint fix
	bun run check

# =============================================================================
# Dependencies
# =============================================================================

install: ## Install dependencies
	bun install

clean: ## Clean node_modules and reinstall
	rm -rf node_modules bun.lock
	bun install

# =============================================================================
# Database (Drizzle + SQLite)
# =============================================================================

db-generate: ## Generate Drizzle migrations
	bun run db:generate

db-migrate: ## Run Drizzle migrations
	bun run db:migrate

db-push: ## Push schema to database (dev)
	bun run db:push

db-studio: ## Open Drizzle Studio
	bun run db:studio

db-seed: ## Seed database with mock data
	bun run db:seed

db-reset: ## Reset database (push + seed)
	bun run db:push
	bun run db:seed

# =============================================================================
# Setup
# =============================================================================

setup: install db-push db-seed ## Full setup: install deps + setup DB
	@echo "✅ Setup complete! Run 'make dev' to start."

# =============================================================================
# Help
# =============================================================================

help: ## Show this help
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
