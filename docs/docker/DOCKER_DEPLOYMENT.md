# 🐳 Docker Deployment - Quick Reference

## ✅ What's Included in the Docker Image

The updated Docker image now includes:

### Application Files
- ✅ `app.py` - FastAPI inference API
- ✅ `preprocessor.py` - Production-ready data preprocessor (NEW!)

### Model & Artifacts
- ✅ `models/production/v9_causal.txt` - LightGBM model (2.6MB)
- ✅ `models/production/scaler_v9.joblib` - StandardScaler (1.4KB)
- ✅ `models/production/encoders_v9.joblib` - LabelEncoders (1.3KB)
- ✅ `models/production/imputation_defaults_v9.joblib` - Imputation values (616B)

### Dependencies
All required packages from `requirements_api.txt`:
- FastAPI, Uvicorn, Pydantic
- LightGBM, SHAP, pandas, numpy, scikit-learn, joblib
- Redis client

---

## 🚀 Build & Deploy

### Step 1: Start Docker Desktop

Ensure Docker Desktop is running:
```bash
docker info
```

### Step 2: Build with Automated Script (Recommended)

```bash
# Make script executable (first time only)
chmod +x docker_build_test.sh

# Run automated build & verification
./docker_build_test.sh
```

The script will:
- ✅ Check Docker daemon
- ✅ Verify all required files
- ✅ Build Docker image
- ✅ Test preprocessor import
- ✅ Verify v9 artifacts
- ✅ Show image size

### Step 3: Start Services

```bash
# Start FastAPI + Redis
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Step 4: Verify Deployment

```bash
# Health check
curl http://localhost:8000/health

# Expected output:
# {
#   "status": "healthy",
#   "model_loaded": true,
#   "shap_ready": true
# }
```

---

## 🧪 Testing the Preprocessor in Docker

### Test 1: Verify Preprocessor is in Image

```bash
docker run --rm hr-churn-api:v9-preprocessor ls -la /app/preprocessor.py
```

Expected: File exists in container

### Test 2: Test Import

```bash
docker run --rm hr-churn-api:v9-preprocessor \
  python -c "from preprocessor import create_preprocessor; print('✓ OK')"
```

Expected output: `✓ OK`

### Test 3: Full Integration Test

```bash
# Inside running container
docker-compose exec fastapi python test_preprocessor.py
```

Expected: 6/6 tests passed

---

## 📊 Image Size

Expected image size: **~800MB - 1.2GB**

Breakdown:
- Base image (python:3.11-slim): ~150MB
- Python packages: ~500MB
- Application code: ~5MB
- Model & artifacts: ~3MB

To check:
```bash
docker images hr-churn-api:v9-preprocessor
```

---

## 🔄 Update & Rebuild

### When to Rebuild

Rebuild the image when:
- `preprocessor.py` changes
- `app.py` changes
- v9 artifacts update
- Dependencies change

### Quick Rebuild

```bash
# Stop containers
docker-compose down

# Rebuild and start
docker-compose up -d --build

# Or use the test script
./docker_build_test.sh
```

---

## 🐛 Troubleshooting

### Issue: "preprocessor.py not found"

**Solution:**
```bash
# Verify file exists locally
ls -la preprocessor.py

# Check .dockerignore doesn't exclude it
cat .dockerignore | grep -i preprocessor

# Rebuild from scratch
docker-compose build --no-cache
```

### Issue: "ModuleNotFoundError: No module named 'preprocessor'"

**Solution:**
```bash
# Check if file was copied to image
docker run --rm hr-churn-api:v9-preprocessor ls -la /app/

# Verify working directory in Dockerfile
# Should show WORKDIR /app
```

### Issue: "Artifact loading failed"

**Solution:**
```bash
# Verify all artifacts exist locally
ls -la models/production/*.joblib
ls -la models/production/v9_causal.txt

# Check if artifacts were copied to image
docker run --rm hr-churn-api:v9-preprocessor \
  ls -la /app/models/production/

# Rebuild with verbose output
docker-compose build --progress=plain
```

### Issue: Docker build fails with "COPY failed"

**Solution:**
```bash
# Ensure you're in project root
pwd
# Should show: .../2526-dzi-ai-ATApostolov21

# Verify Dockerfile paths match actual file locations
ls -la Dockerfile
ls -la preprocessor.py
ls -la models/production/
```

---

## 📝 Dockerfile Changes Summary

### Before (Old)
```dockerfile
# Copy application code
COPY app.py .

# Create models directory
RUN mkdir -p models/production
```

### After (New)
```dockerfile
# Copy application code
COPY app.py .
COPY preprocessor.py .

# Copy v9 production artifacts
COPY models/production/v9_causal.txt models/production/
COPY models/production/scaler_v9.joblib models/production/
COPY models/production/encoders_v9.joblib models/production/
COPY models/production/imputation_defaults_v9.joblib models/production/
```

**Key changes:**
- ✅ Added `preprocessor.py` copy
- ✅ Explicitly copy v9 artifacts instead of mounting
- ✅ Self-contained image (no external volume dependencies for artifacts)

---

## 🎯 Production Checklist

Before deploying to production:

- [ ] Run `./docker_build_test.sh` successfully
- [ ] All 6 preprocessor tests pass
- [ ] Health endpoint returns `200 OK`
- [ ] Redis connection works
- [ ] Test single prediction endpoint
- [ ] Test batch prediction endpoint
- [ ] Review logs for warnings/errors
- [ ] Verify image size is reasonable (< 1.5GB)
- [ ] Test with sample production data

---

## 🔗 Next Steps

1. **Local Testing**: Test API endpoints thoroughly
2. **Load Testing**: Run `test_batch_3000.py` stress test
3. **Cloud Deploy**: Push image to registry (Docker Hub, ECR, GCR)
4. **Monitoring**: Set up logging aggregation and metrics
5. **CI/CD**: Automate build pipeline

---

## 📚 Additional Resources

- Full Docker guide: [DOCKER_README.md](./DOCKER_README.md)
- Preprocessor docs: [walkthrough.md](/.gemini/antigravity/brain/.../walkthrough.md)
- API documentation: http://localhost:8000/docs (after deployment)
- FastAPI source: [app.py](./app.py)
- Preprocessor source: [preprocessor.py](./preprocessor.py)

---

**Ready to deploy! 🚀**
