from fastapi import APIRouter, Depends

from app.models import (
    AppState,
    ArchiveCardRequest,
    CardPatch,
    CreateCardRequest,
    MoveCardRequest,
)
from app.store import Store, get_store

router = APIRouter(prefix="/boards/{board_id}", tags=["Cards"])


@router.post("/columns/{column_id}/cards", response_model=AppState)
def create_card(board_id: str, column_id: str, body: CreateCardRequest, store: Store = Depends(get_store)) -> AppState:
    return store.create_card(board_id, column_id, body.title)


@router.patch("/cards/{card_id}", response_model=AppState)
def update_card(board_id: str, card_id: str, body: CardPatch, store: Store = Depends(get_store)) -> AppState:
    return store.update_card(board_id, card_id, body.set_fields())


@router.delete("/cards/{card_id}", response_model=AppState)
def delete_card(board_id: str, card_id: str, store: Store = Depends(get_store)) -> AppState:
    return store.delete_card(board_id, card_id)


@router.post("/cards/{card_id}/move", response_model=AppState)
def move_card(board_id: str, card_id: str, body: MoveCardRequest, store: Store = Depends(get_store)) -> AppState:
    return store.move_card(board_id, card_id, body.to_column_id, body.to_index)


@router.post("/cards/{card_id}/duplicate", response_model=AppState)
def duplicate_card(board_id: str, card_id: str, store: Store = Depends(get_store)) -> AppState:
    return store.duplicate_card(board_id, card_id)


@router.post("/cards/{card_id}/archive", response_model=AppState)
def archive_card(board_id: str, card_id: str, body: ArchiveCardRequest, store: Store = Depends(get_store)) -> AppState:
    return store.archive_card(board_id, card_id, body.archived)
