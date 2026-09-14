from fastapi import APIRouter, Depends

from app.models import AppState, ImportRequest
from app.store import Store, get_store

router = APIRouter(tags=["Backup"])


@router.get("/export", response_model=AppState)
def export_json(store: Store = Depends(get_store)) -> AppState:
    return store.export_json()


@router.post("/import", response_model=AppState)
def import_json(body: ImportRequest, store: Store = Depends(get_store)) -> AppState:
    return store.import_json(body.data, body.mode)


@router.post("/reset", response_model=AppState)
def reset(store: Store = Depends(get_store)) -> AppState:
    return store.reset()
