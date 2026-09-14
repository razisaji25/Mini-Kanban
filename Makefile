.PHONY: help install run test dev

help:
	@echo "make install  - install backend dependencies (uv sync)"
	@echo "make run      - run the backend dev server on http://localhost:8030"
	@echo "make test     - run the backend test suite"
	@echo "make dev      - run backend (8030) and frontend (8000) together"

install:
	cd backend && uv sync

run:
	cd backend && uv run uvicorn app.main:app --reload --port 8030

test:
	cd backend && uv run pytest

dev:
	@echo "Backend:  http://localhost:8030"
	@echo "Frontend: http://localhost:8000"
	@echo "Press Ctrl+C to stop both."
	@(cd backend && uv run uvicorn app.main:app --port 8030) & \
	trap "bash scripts/stop-port.sh 8030" EXIT INT TERM; \
	cd frontend && python -m http.server 8000
