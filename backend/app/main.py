# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from controller import analysis_router, dataset_router, method_router, classifier_router, evaluation_router

app = FastAPI(
    title="BeeFAME REST API",
    description="BeeFAME | Fairness Analysis Mitigation and Explainability",
    version="1.0.2",
)

# CORS related configuration 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Frontend URL:port
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],
)

@app.get("/status", summary="Health Check")
def get_status():
    return JSONResponse(content={
        "name": app.title,
        "version": app.version
    })

# Include routers
app.include_router(analysis_router)
app.include_router(dataset_router)
app.include_router(method_router)
app.include_router(classifier_router)
app.include_router(evaluation_router)
