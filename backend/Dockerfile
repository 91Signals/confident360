# ============================================
# Stage 1: Base image with system dependencies
# ============================================
FROM python:3.11-slim AS base

WORKDIR /app
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=0
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies in one layer with cleanup
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget gnupg ca-certificates \
    libnss3 libxss1 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libxfixes3 \
    libpango-1.0-0 libgbm1 libasound2 libatspi2.0-0 libxshmfence1 \
    fonts-liberation xauth xvfb \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# ============================================
# Stage 2: Python dependencies
# ============================================
FROM base AS python-deps

# Copy only requirements first for better layer caching
COPY requirements.txt .

# Install Python packages (pip cache will be in layer)
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# ============================================
# Stage 3: Playwright installation
# ============================================
FROM python-deps AS playwright-install

# Install Playwright and Chromium
RUN pip install playwright && \
    playwright install chromium && \
    playwright install-deps chromium

# ============================================
# Stage 4: Final runtime image
# ============================================
FROM playwright-install AS runtime

# Copy application code (done last for best caching)
COPY . .

# Environment variables
ENV PORT=8080
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Run with single worker (Playwright compatibility)
CMD ["gunicorn", "-w", "1", "-t", "3600", "-b", "0.0.0.0:8080", "--chdir", "/app", "app:app"]

