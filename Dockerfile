# Jason Stys: locked non-root replay service; source responsibilities: docs/SOURCE_MAP.md.
FROM node:24.18.1-bookworm-slim@sha256:235600a8101ab264e117b1768e925532262668dc9b581ef1dd7d96ced463b8e7 AS ui
WORKDIR /build
COPY package.json package-lock.json tsconfig.json vite.config.ts playwright.config.ts ./
COPY ui ./ui
COPY tests/browser ./tests/browser
RUN npm ci --ignore-scripts && npm run build
FROM python:3.14.6-slim-bookworm@sha256:4c92ffcde4dd6f1ff72a24518f49fd4990b27134987dfa31a733badde66df9f8
WORKDIR /app
COPY requirements.lock ./
RUN pip install --no-cache-dir --require-hashes -r requirements.lock && useradd --uid 10001 --create-home operator && mkdir /app/.runtime && chown operator:operator /app/.runtime
COPY console ./console
COPY --from=ui /build/dist ./dist
ENV PYTHONDONTWRITEBYTECODE=1 OPS_ADAPTER=replay
USER 10001:10001
EXPOSE 8840
CMD ["python", "-m", "uvicorn", "console.api:create_app", "--factory", "--host", "0.0.0.0", "--port", "8840", "--workers", "1", "--limit-concurrency", "32", "--no-access-log"]
