from fastapi import APIRouter, Depends

from app.models import AppState, SettingsPatch
from app.store import Store, get_store

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.patch("", response_model=AppState)
def update_settings(body: SettingsPatch, store: Store = Depends(get_store)) -> AppState:
    return store.update_settings(body.set_fields())


@router.post("/mark-exported", response_model=AppState)
def mark_exported(store: Store = Depends(get_store)) -> AppState:
    return store.mark_exported()
