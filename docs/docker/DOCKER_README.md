# 🐳 Docker Deployment Guide

## Преглед

Този проект използва **Docker Compose** за лесен deployment на FastAPI inference layer с Redis persistence.

## 📦 Архитектура

```
├── FastAPI Container (hr_churn_api)
│   ├── Port: 8000
│   ├── LightGBM Model (v9_causal)
│   ├── HRDataPreprocessor (NEW!)
│   ├── v9 Artifacts (scaler, encoders, imputation)
│   └── SHAP Explainer
│
├── Redis Container (hr_churn_redis)
│   ├── Port: 6379
│   ├── Persistent Volume
│   └── 24h TTL за batch results
```

## 🚀 Quick Start

### 1. Build и Start Containers

```bash
# Build и start всички services
docker-compose up --build

# В detached mode (background)
docker-compose up -d --build
```

### 2. Проверка на Health

```bash
# FastAPI health check
curl http://localhost:8000/health

# Redis health check
docker-compose exec redis redis-cli ping
```

### 3. Test API

```bash
# Single prediction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Department": "IT",
    "Gender": "Male",
    "Age": 35,
    "Job_Title": "Senior",
    "Years_At_Company": 5,
    "Education_Level": "Master",
    "Performance_Score": 3,
    "Monthly_Salary": 7500,
    "Work_Hours_Per_Week": 45,
    "Projects_Handled": 12,
    "Overtime_Hours": 10,
    "Sick_Days": 3,
    "Remote_Work_Frequency": 50,
    "Team_Size": 8,
    "Training_Hours": 40,
    "Promotions": 1
  }'
```

### 4. Stop Containers

```bash
# Stop всички services
docker-compose down

# Stop + delete volumes (тотално cleanup)
docker-compose down -v
```

## 🔧 Local Development (без Docker)

Ако искаш да run-ваш local без Docker:

### 1. Start Redis

```bash
# MacOS (с Homebrew)
brew install redis
redis-server

# Или с Docker само за Redis
docker run -d -p 6379:6379 redis:7-alpine
```

### 2. Start FastAPI

```bash
# Install dependencies
pip install -r requirements.txt

# Set Redis URL
export REDIS_URL="redis://localhost:6379/0"

# Start server
uvicorn app:app --reload --port 8000
```

## 📊 Redis Monitoring

### View All Batch Results

```bash
docker-compose exec redis redis-cli KEYS "batch:*"
```

### Get Specific Batch

```bash
docker-compose exec redis redis-cli GET "batch:YOUR_BATCH_ID"
```

### Check Redis Memory Usage

```bash
docker-compose exec redis redis-cli INFO memory
```

### Flush All Data (cleanup)

```bash
docker-compose exec redis redis-cli FLUSHALL
```

## 🔍 Logs

```bash
# View all logs
docker-compose logs

# Follow logs (live)
docker-compose logs -f

# FastAPI logs only
docker-compose logs -f fastapi

# Redis logs only
docker-compose logs -f redis
```

## ⚙️ Configuration

### Environment Variables

**docker-compose.yml**:
```yaml
environment:
  - REDIS_URL=redis://redis:6379/0  # Redis connection
  - LOG_LEVEL=INFO                   # Logging level
```

**Redis Settings**:
- **Max Memory**: 512MB
- **Eviction Policy**: allkeys-lru (evict least recently used)
- **TTL**: 24 hours (86400 seconds)
- **Persistence**: AOF (Append Only File)

## 🛠️ Troubleshooting

### Container не стартира

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs fastapi
```

### Redis connection failed

```bash
# Verify Redis is running
docker-compose exec redis redis-cli ping
# Expected output: PONG

# Rebuild containers
docker-compose down
docker-compose up --build
```

### Model file missing

Уверете се че всички v9 production файлове съществуват:
```bash
ls -la models/production/v9_causal.txt
ls -la models/production/scaler_v9.joblib
ls -la models/production/encoders_v9.joblib
ls -la models/production/imputation_defaults_v9.joblib
ls -la preprocessor.py
```

## 📈 Production Deployment

### AWS EC2 / DigitalOcean

```bash
# 1. SSH в server
ssh user@your-server-ip

# 2. Clone repository
git clone <your-repo>
cd <your-repo>

# 3. Start services
docker-compose up -d --build

# 4. Setup nginx reverse proxy (optional)
# See nginx.conf example below
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔐 Security Best Practices

1. **Redis Password** (production):
```yaml
# docker-compose.yml
redis:
  command: redis-server --requirepass YOUR_STRONG_PASSWORD
```

2. **Network Isolation**:
```yaml
networks:
  backend:
    driver: bridge
```

3. **Read-only Model Mount**:
```yaml
volumes:
  - ./models:/app/models:ro
```

## 📊 Performance Tuning

### Redis Memory

Adjust based on your workload:
```yaml
redis:
  command: redis-server --maxmemory 1gb --maxmemory-policy allkeys-lru
```

### FastAPI Workers (Gunicorn)

```dockerfile
# Dockerfile
CMD ["gunicorn", "app:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

## 🧪 Testing

```bash
# Run tests with Docker
docker-compose exec fastapi pytest test_app.py -v

# Stress test с 3000 employees
docker-compose exec fastapi python3 test_batch_3000.py
```

## 📁 File Structure

```
.
├── app.py                  # FastAPI application
├── preprocessor.py         # Production-ready preprocessor (NEW!)
├── Dockerfile              # FastAPI container config
├── docker-compose.yml      # Multi-container setup
├── docker_build_test.sh    # Build verification script (NEW!)
├── requirements_api.txt    # Production dependencies
├── test_app.py            # Unit tests
├── test_batch_3000.py     # Stress tests
├── test_preprocessor.py   # Preprocessor tests (NEW!)
└── models/
    └── production/
        ├── v9_causal.txt               # LightGBM model
        ├── scaler_v9.joblib            # StandardScaler (NEW!)
        ├── encoders_v9.joblib          # LabelEncoders (NEW!)
        └── imputation_defaults_v9.joblib  # Imputation values (NEW!)
```
