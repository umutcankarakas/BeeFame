## Prerequisites

- Python 3.7+
- Pip

## Setup

1.  Clone the repository:
    ```bash
    git clone <repository_url>
    cd beespector_api
    ```

2.  Create a virtual environment:
    ```bash
    python -m venv venv
    ```

3.  Activate the virtual environment:
    - Windows (cmd): `venv\Scripts\activate`
    - Windows (PowerShell): `venv\Scripts\Activate.ps1`
    - macOS/Linux: `source venv/bin/activate`

4.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Running the API

With the virtual environment activated, run the Uvicorn server from the root of the `beespector_api` directory:

```bash
uvicorn main:app --reload --port 8001

The API will be available at http://127.0.0.1:8001.
Interactive documentation (Swagger UI) can be found at http://127.0.0.1:8000/docs.
API Endpoints
GET /api/datapoints: Retrieves initial data points with base and mitigated model predictions.
PUT /api/datapoints/{point_id}/evaluate: Accepts modified features for a point and returns re-evaluated predictions.
GET /api/features: (Placeholder) To retrieve feature statistics.
GET /api/performance_fairness: (Placeholder) To retrieve model performance and fairness metrics.
GET /api/partial_dependence: (Placeholder) To retrieve partial dependence plot data.
```

## Running the API with Docker (latest)
docker build -t beespector-api:latest .
docker run --rm -p 8001:8001 beespector-api:latest

Then, check endpoints on http://localhost:8001/docs