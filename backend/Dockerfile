# ============================================
# Base image with system dependencies
# ============================================
FROM python:3.11-slim

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PORT=8080

# --------------------------------------------
# System dependencies required by Playwright
# --------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    ca-certificates \
    libnss3 \
    libxss1 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxfixes3 \
    libpango-1.0-0 \
    libgbm1 \
    libasound2 \
    libatspi2.0-0 \
    libxshmfence1 \
    fonts-liberation \
    libdrm2 \
    libglib2.0-0 \
    libdbus-1-3 \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# --------------------------------------------
# Python dependencies
# --------------------------------------------
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# --------------------------------------------
# Install Playwright browsers (Chromium only)
# --------------------------------------------
RUN playwright install --with-deps chromium

# --------------------------------------------
# Application code
# --------------------------------------------
COPY . .

EXPOSE 8080

# --------------------------------------------
# Healthcheck
# --------------------------------------------
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# --------------------------------------------
# Run app
# Single worker = Playwright safe
# Long timeout = Gemini + scraping
# --------------------------------------------
CMD ["gunicorn", "-w", "1", "-t", "3600", "-b", "0.0.0.0:8080", "app:app"]
