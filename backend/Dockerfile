FROM mcr.microsoft.com/playwright/python:v1.40.0-jammy

WORKDIR /app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Ensure Playwright browsers are installed
RUN playwright install chromium

# Copy app code
COPY . .

# Run FastAPI backend
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
