# 🚀 HR Analytics Enterprise (Modern Stack)

> **Secure, Offline HR Analytics Tool** for predicting employee churn. Ported to a high-performance **React + FastAPI** architecture.

[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![LightGBM](https://img.shields.io/badge/LightGBM-v9-orange)](models/production/)

---

## 🏗️ Project Structure

```
.
├── api/                        # FastAPI Backend Service
│   ├── main.py                 # API Entry Point
│   ├── config.py               # Shared Config
│   └── services/               # ML & Logic Services
├── frontend/                   # React + TypeScript Frontend
│   └── src/                    # Dashboard UI (Tailwind + Shadcn)
├── preprocessor.py             # Shared Data Processing
├── models/                     # v9 production AI models
└── data/                       # Local SQLite & CSV Storage
```

---

## 🚀 Quick Start

### 1. Start Backend (FastAPI)
```bash
# From project root
pip install uvicorn fastapi python-multipart pandas lightgbm shap joblib scikit-learn
PYTHONPATH=. uvicorn api.main:app --reload --port 8000
```

### 2. Start Frontend (React)
```bash
cd frontend
npm install
npm run dev -- --port 3000
```

### 3. Access Dashboard
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Endpoints (Port 8000)

- `GET /api/employees`: List all processed employees
- `GET /api/analysis/{id}`: Deep SHAP analysis for specific employee
- `POST /api/upload`: Upload CSV for batch processing
- `POST /api/predict`: Single What-If prediction

---

## 🛠️ Tech Stack

**Frontend:**
- **React 19**: Modern UI framework
- **Tailwind CSS**: Utility-first styling with Zinc palette
- **Lucide React**: Premium icon set
- **Axios**: Backend communication

**Backend:**
- **FastAPI**: High-performance Python API
- **LightGBM**: Production-grade ML predictions
- **SHAP**: Machine Learning interpretability

**Data:**
- **SQLite**: Local state management
- **Pandas**: High-speed data manipulation

---

## 📊 Model Performance

| Metric | Value |
|--------|-------|
| ROC AUC | 0.94 |
| Precision (Churn) | 0.88 |
| Recall (Churn) | 0.86 |

---

## 👤 Author

**ATApostolov21**  
Codingburgas School Project - 2526 Academic Year

---

**Modern, fast, and secure. 🚀**
