from fastapi import APIRouter, Depends

from app.models import AppState
from app.store import Store, get_store

router = APIRouter(tags=["State"])


@router.get("/state", response_model=AppState)
def get_state(store: Store = Depends(get_store)) -> AppState:
    return store.get_state()
