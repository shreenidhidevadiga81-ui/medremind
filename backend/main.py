from fastapi import FastAPI

app = FastAPI(title="MedRemind API")


@app.get("/")
def root():
    return {"message": "MedRemind API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}