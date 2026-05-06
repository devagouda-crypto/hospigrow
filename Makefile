.PHONY: help install up down dev build clean middleware-dev middleware-test logs

help:
	@echo "Hospigrow — common tasks"
	@echo ""
	@echo "  make install         Install all frontend dependencies (pnpm)"
	@echo "  make up              Start the local stack (Postgres, Redis, LDAP, Keycloak, middleware)"
	@echo "  make down            Stop the stack"
	@echo "  make dev             Run all three frontend apps in dev mode"
	@echo "  make middleware-dev  Run the middleware locally (without docker)"
	@echo "  make build           Build everything for production"
	@echo "  make logs            Tail logs from the docker stack"
	@echo "  make clean           Remove all node_modules, .next, dist directories"

install:
	pnpm install

up:
	docker compose up -d
	@echo ""
	@echo "Stack starting. Once Keycloak is ready (~30s):"
	@echo "  Hospital app   → http://localhost:3000  (run: make dev)"
	@echo "  Staff app      → http://localhost:3001"
	@echo "  Patient app    → http://localhost:3002"
	@echo "  Middleware     → http://localhost:8000/docs"
	@echo "  Keycloak admin → http://localhost:8080  (admin / admin)"

down:
	docker compose down

dev:
	pnpm dev

build:
	pnpm build

middleware-dev:
	cd services/middleware && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

middleware-test:
	cd services/middleware && pytest -q

logs:
	docker compose logs -f --tail=100

clean:
	rm -rf node_modules .turbo
	find . -type d \( -name node_modules -o -name .next -o -name dist -o -name .turbo \) -prune -exec rm -rf {} +
