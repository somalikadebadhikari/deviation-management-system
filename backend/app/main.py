"""
FastAPI application entrypoint for the Deviation Management backend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.api.routes import router

# Create tables on startup 
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Deviation Management Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def health_check():
    return {"status": "ok"}
