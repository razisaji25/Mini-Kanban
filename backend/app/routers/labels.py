from fastapi import APIRouter, Depends

from app.models import AppState, CreateLabelRequest
from app.store import Store, get_store

router = APIRouter(prefix="/labels", tags=["Labels"])


@router.post("", response_model=AppState)
def create_label(body: CreateLabelRequest, store: Store = Depends(get_store)) -> AppState:
    return store.create_label(body.name, body.color)


@router.delete("/{label_id}", response_model=AppState)
def delete_label(label_id: str, store: Store = Depends(get_store)) -> AppState:
    return store.delete_label(label_id)
