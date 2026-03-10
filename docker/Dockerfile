FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
COPY requirements_dashboard.txt .

# Install Python dependencies
# We install the main requirements first, then dashboard specifics
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir -r requirements_dashboard.txt

# Copy application code
COPY preprocessor.py .
COPY dashboard.py .
COPY dashboard/ dashboard/
COPY models/production/ models/production/

# Expose port
EXPOSE 8501

# Run the application
# server.address 0.0.0.0 is crucial for Docker
CMD ["streamlit", "run", "dashboard.py", "--server.port", "8501", "--server.address", "0.0.0.0"]
