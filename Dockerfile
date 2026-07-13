# syntax=docker/dockerfile:1

FROM node:22-slim AS frontend-builder
WORKDIR /repo
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN --mount=type=cache,target=/root/.npm \
    cd frontend && npm ci
COPY templates ./templates
COPY registry ./registry
COPY frontend ./frontend
RUN cd frontend && npm run build

FROM python:3.12-slim AS backend
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/
WORKDIR /app

COPY backend/pyproject.toml backend/uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

COPY backend/app ./app
# Absolute destination on purpose: app/registry/__init__.py resolves the data
# as BACKEND_ROOT.parent / "registry", which is /registry inside the image.
COPY registry /registry
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

COPY --from=frontend-builder /repo/frontend/out ./static

ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000

# Invoke uvicorn directly from the synced venv rather than via `uv run`,
# which would otherwise re-sync (including dev dependencies) over the
# network on every container start.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
