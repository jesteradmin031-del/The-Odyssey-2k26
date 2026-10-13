from fastapi import FastAPI

app = FastAPI(
    title="VERITAS API",
    description="AI-powered claim verification platform",
    version="1.0.0",
)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}