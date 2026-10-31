from fastapi import FastAPI

from . import models  # noqa: F401  (registers the tables)
from .database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MedRemind API")


@app.get("/")
def root():
    return {"message": "MedRemind API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}