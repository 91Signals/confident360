# Base image with Playwright + Chromium already installed
FROM mcr.microsoft.com/playwright/python:v1.47.0-jammy

WORKDIR /app

# Copy only requirements first to enable Docker caching
COPY requirements.txt .

# Install Python deps (using cache)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the backend source code
COPY . .

# Cloud Run port
ENV PORT=8080
EXPOSE 8080

# Playwright requires a single worker
CMD ["gunicorn", "-w", "1", "-t", "3600", "-b", "0.0.0.0:8080", "--chdir", "/app", "app:app"]
