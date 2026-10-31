from fastapi import FastAPI

from . import models  # noqa: F401
from .database import Base, SessionLocal, engine
from .routers import auth
from .seed import seed_admin

Base.metadata.create_all(bind=engine)

with SessionLocal() as db:
    seed_admin(db)

app = FastAPI(title="MedRemind API")
app.include_router(auth.router)


@app.get("/")
def root():
    return {"message": "MedRemind API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}