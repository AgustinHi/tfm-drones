from fastapi import FastAPI

app = FastAPI(title="TFM Drones API")

@app.get("/health")
def health():
    return {"status": "ok"}
