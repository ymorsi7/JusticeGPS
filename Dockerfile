FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy frontend and install dependencies
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm ci --only=production

# Build frontend
RUN npm run build

# Copy backend code
WORKDIR /app
COPY backend/ ./backend/
COPY sample_data/ ./sample_data/
COPY tests/ ./tests/
COPY llm_evaluate.py .

# Expose port
EXPOSE 8000

# Start the application
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"] 