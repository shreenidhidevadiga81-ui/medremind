from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401
from .database import Base, SessionLocal, engine
from .routers import auth, dashboard, medicines, nurses, residents, vitals
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
app.include_router(residents.router)
app.include_router(medicines.router)
app.include_router(vitals.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "MedRemind API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}