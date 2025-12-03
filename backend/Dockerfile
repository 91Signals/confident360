# Use official Python runtime
FROM python:3.11-slim

WORKDIR /app
ENV DEBIAN_FRONTEND=noninteractive

# Install all Playwright system deps for Chromium on Debian 12 (Trixie/Bookworm)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget gnupg ca-certificates \
    build-essential \
    libnss3 libxss1 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libxfixes3 \
    libpango-1.0-0 libgbm1 libasound2 libatspi2.0-0 libxshmfence1 \
    fonts-liberation xauth xvfb \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Install Playwright + Chromium
RUN pip install playwright \
    && playwright install chromium \
    && playwright install-deps

# Copy backend
COPY . .

ENV PORT=8080
EXPOSE 8080

# Playwright requires SINGLE worker
# CMD ["gunicorn", "-w", "4", "-t", "600", "-b", "0.0.0.0:8080", "app:app"]

CMD ["gunicorn", "-w", "1", "-t", "3600", "-b", "0.0.0.0:8080", "--chdir", "/app", "app:app"]
# Start the Flask application using Gunicorn
# CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8080", "--chdir", "/app", "app:app"]

