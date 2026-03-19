# BeeFair

## Requirements

- **Python**: Version 3.9 or higher
- **Dependencies**: Install using the provided `requirements.txt`

## Setup

### 1. Clone the repository

```
git clone https://github.com/ITU-BeeFair/beefair-backend.git
cd beefair-backend
```

If you want to develop with a virtual environment skip to step 3.

### 2. Run with Docker

Make sure you have Docker installed.

If the server is going to be started for the first time:
```
docker-compose up --build
```

On subsequent starts:
```
docker-compose up
```

Lastly, to close the server:
```
docker-compose down
```

### 3. Run with virtual environment

```
python -m venv venv
source venv/bin/activate  # For Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API documentation will be available at:

- Swagger UI: `http://127.0.0.1:8000/docs`
- Redoc: `http://127.0.0.1:8000/redoc`


### 4. To Run CLI

```
docker-compose up
docker-compose exec cli python -m cli.cli_macos_linux
```