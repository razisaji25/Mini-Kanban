from fastapi import APIRouter, Depends

from app.models import AppState, ColumnPatch, CreateColumnRequest, ReorderColumnsRequest
from app.store import Store, get_store

router = APIRouter(prefix="/boards/{board_id}", tags=["Columns"])


@router.post("/columns", response_model=AppState)
def create_column(board_id: str, body: CreateColumnRequest, store: Store = Depends(get_store)) -> AppState:
    return store.create_column(board_id, body.title)


@router.patch("/columns/reorder", response_model=AppState)
def reorder_columns(board_id: str, body: ReorderColumnsRequest, store: Store = Depends(get_store)) -> AppState:
    return store.reorder_columns(board_id, body.column_ids)


@router.patch("/columns/{column_id}", response_model=AppState)
def update_column(board_id: str, column_id: str, body: ColumnPatch, store: Store = Depends(get_store)) -> AppState:
    provided = body.model_fields_set
    return store.update_column(
        board_id,
        column_id,
        title=body.title if "title" in provided else None,
        wip_limit=body.wip_limit if "wip_limit" in provided else None,
        wip_limit_set="wip_limit" in provided,
    )


@router.delete("/columns/{column_id}", response_model=AppState)
def delete_column(board_id: str, column_id: str, store: Store = Depends(get_store)) -> AppState:
    return store.delete_column(board_id, column_id)
