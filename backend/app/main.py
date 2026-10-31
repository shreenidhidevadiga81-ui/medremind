from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401
from .database import Base, SessionLocal, engine
from .routers import auth, nurses
from .seed import seed_admin

Base.metadata.create_all(bind=engine)

with SessionLocal() as db:
    seed_admin(db)

app = FastAPI(title="MedRemind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(nurses.router)


@app.get("/")
def root():
    return {"message": "MedRemind API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}