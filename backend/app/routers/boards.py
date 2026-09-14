from fastapi import APIRouter, Depends

from app.models import AppState, CreateBoardRequest, RenameBoardRequest
from app.store import Store, get_store

router = APIRouter(prefix="/boards", tags=["Boards"])


@router.post("", response_model=AppState)
def create_board(body: CreateBoardRequest, store: Store = Depends(get_store)) -> AppState:
    return store.create_board(body.title)


@router.patch("/{board_id}", response_model=AppState)
def rename_board(board_id: str, body: RenameBoardRequest, store: Store = Depends(get_store)) -> AppState:
    return store.rename_board(board_id, body.title)


@router.delete("/{board_id}", response_model=AppState)
def delete_board(board_id: str, store: Store = Depends(get_store)) -> AppState:
    return store.delete_board(board_id)


@router.post("/{board_id}/activate", response_model=AppState)
def activate_board(board_id: str, store: Store = Depends(get_store)) -> AppState:
    return store.set_active_board(board_id)
