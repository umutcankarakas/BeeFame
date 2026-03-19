# BeeFame

**Fairness Analysis, Mitigation and Explainability** platform for ML models.

## Services

| Service | Description | Port |
|---|---|---|
| `frontend` | Next.js web UI | 3001 |
| `backend` | FastAPI — bias analysis & mitigation | 8000 |
| `beespector` | FastAPI — model inspection & explainability | 8001 |
| `redis` | Cache for analysis results | 6379 |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (must be running)

## Running with Docker (recommended)

```bash
# Clone the repo
git clone https://github.com/umutcankarakas/BeeFame.git
cd BeeFame

# Start all services
docker compose up --build
```

Then open **http://localhost:3001** in your browser.

> **First build takes ~10–15 minutes** — the backend pulls PyTorch and several ML fairness libraries (~3 GB). Subsequent builds are fast thanks to Docker layer caching.

To stop everything:
```bash
docker compose down
```

## API Docs

Once running, interactive API docs are available at:
- Backend: http://localhost:8000/docs
- Beespector: http://localhost:8001/docs

## Environment Variables

Copy `.env.example` to `.env` if you need to override the defaults:

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_BEEFAME_API_URL` | `http://localhost:8000` | Backend API URL seen by the browser |
| `NEXT_PUBLIC_BEESPECTOR_URL` | `http://localhost:8001` | Beespector API URL seen by the browser |

## Project Structure

```
BeeFame/
├── backend/          # FastAPI — fairness analysis & mitigation API
│   ├── app/
│   │   ├── controller/   # Route handlers
│   │   ├── service/      # Business logic + Redis caching
│   │   ├── model/        # Pydantic schemas
│   │   ├── repository/   # Data access
│   │   └── data/         # Static JSON (datasets, classifiers, methods)
│   ├── dockerfile
│   └── requirements.txt
│
├── beespector/       # FastAPI — model inspection & partial dependence API
│   ├── main.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/         # Next.js 13 — web UI
│   ├── src/
│   │   ├── pages/        # Next.js pages (demo, beespector, index)
│   │   ├── components/   # React components
│   │   ├── lib/          # Axios API clients
│   │   └── contexts/     # React context (shared state)
│   ├── Dockerfile
│   └── package.json
│
└── docker-compose.yml
```

## Running Services Individually (without Docker)

### Backend
```bash
cd backend/app
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Requires Redis running locally on port 6379.

### Beespector
```bash
cd beespector
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

### Frontend
```bash
cd frontend
npm install
npm run dev   # runs on http://localhost:3000 (dev) or start for port 3001
```
