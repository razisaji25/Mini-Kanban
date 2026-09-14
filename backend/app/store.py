"""Mock database.

An in-memory stand-in for a real database, mirroring the logic that used to
live in the frontend's mock (frontend/js/api.js). Swap this module's guts for
real persistence later; the router layer only calls the methods below.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from app.models import (
    AppState,
    Board,
    Card,
    Column,
    Label,
    Settings,
)


class NotFoundError(Exception):
    """Raised when a referenced board, column, card, or label doesn't exist."""


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def now() -> datetime:
    return datetime.now(UTC)


def seed_state() -> AppState:
    board_id = new_id("b")
    col1, col2, col3 = new_id("c"), new_id("c"), new_id("c")
    label1, label2 = new_id("l"), new_id("l")
    card1 = new_id("k")
    created = now()

    return AppState(
        version=1,
        active_board_id=board_id,
        settings=Settings(theme="auto", accent="hangat", last_export_at=None),
        labels=[
            Label(id=label1, name="Penting", color="#E8584F"),
            Label(id=label2, name="Belajar", color="#3B82F6"),
        ],
        boards=[
            Board(
                id=board_id,
                title="Papan Pertama",
                created_at=created,
                columns=[
                    Column(
                        id=col1,
                        title="Rencana",
                        wip_limit=None,
                        cards=[
                            Card(
                                id=card1,
                                title="Coba geser kartu ini ke kolom sebelah",
                                notes="Tekan kartu untuk membuka detail: catatan, label, tanggal, dan checklist.",
                                label_ids=[label2],
                                due_date=None,
                                checklist=[],
                                archived=False,
                                created_at=created,
                                updated_at=created,
                            )
                        ],
                    ),
                    Column(id=col2, title="Dikerjakan", wip_limit=None, cards=[]),
                    Column(id=col3, title="Selesai", wip_limit=None, cards=[]),
                ],
            )
        ],
    )


class Store:
    def __init__(self) -> None:
        self.state: AppState = seed_state()

    def reset(self) -> AppState:
        self.state = seed_state()
        return self.state

    # ---- lookups ----

    def _find_board(self, board_id: str) -> Board:
        for board in self.state.boards:
            if board.id == board_id:
                return board
        raise NotFoundError(f"Papan tidak ditemukan: {board_id}")

    def _find_column(self, board: Board, column_id: str) -> Column:
        for column in board.columns:
            if column.id == column_id:
                return column
        raise NotFoundError(f"Kolom tidak ditemukan: {column_id}")

    def _find_card_location(self, board: Board, card_id: str) -> tuple[Column, int, Card]:
        for column in board.columns:
            for index, card in enumerate(column.cards):
                if card.id == card_id:
                    return column, index, card
        raise NotFoundError(f"Kartu tidak ditemukan: {card_id}")

    # ---- state ----

    def get_state(self) -> AppState:
        return self.state

    # ---- boards ----

    def create_board(self, title: str | None) -> AppState:
        board = Board(id=new_id("b"), title=title or "Papan Baru", created_at=now(), columns=[])
        self.state.boards.append(board)
        self.state.active_board_id = board.id
        return self.state

    def rename_board(self, board_id: str, title: str) -> AppState:
        self._find_board(board_id).title = title
        return self.state

    def delete_board(self, board_id: str) -> AppState:
        self._find_board(board_id)  # raises if missing
        self.state.boards = [b for b in self.state.boards if b.id != board_id]
        if self.state.active_board_id == board_id:
            self.state.active_board_id = self.state.boards[0].id if self.state.boards else None
        return self.state

    def set_active_board(self, board_id: str) -> AppState:
        self._find_board(board_id)  # raises if missing
        self.state.active_board_id = board_id
        return self.state

    # ---- columns ----

    def create_column(self, board_id: str, title: str | None) -> AppState:
        board = self._find_board(board_id)
        board.columns.append(Column(id=new_id("c"), title=title or "Kolom Baru", wip_limit=None, cards=[]))
        return self.state

    def update_column(self, board_id: str, column_id: str, title: str | None, wip_limit: int | None, wip_limit_set: bool) -> AppState:
        column = self._find_column(self._find_board(board_id), column_id)
        if title is not None:
            column.title = title
        if wip_limit_set:
            column.wip_limit = wip_limit
        return self.state

    def reorder_columns(self, board_id: str, column_ids: list[str]) -> AppState:
        board = self._find_board(board_id)
        by_id = {c.id: c for c in board.columns}
        board.columns = [by_id[cid] for cid in column_ids if cid in by_id]
        return self.state

    def delete_column(self, board_id: str, column_id: str) -> AppState:
        board = self._find_board(board_id)
        self._find_column(board, column_id)  # raises if missing
        board.columns = [c for c in board.columns if c.id != column_id]
        return self.state

    # ---- cards ----

    def create_card(self, board_id: str, column_id: str, title: str) -> AppState:
        column = self._find_column(self._find_board(board_id), column_id)
        t = now()
        column.cards.append(
            Card(
                id=new_id("k"),
                title=title,
                notes="",
                label_ids=[],
                due_date=None,
                checklist=[],
                archived=False,
                created_at=t,
                updated_at=t,
            )
        )
        return self.state

    def update_card(self, board_id: str, card_id: str, patch: dict) -> AppState:
        board = self._find_board(board_id)
        _, _, card = self._find_card_location(board, card_id)
        for field, value in patch.items():
            setattr(card, field, value)
        card.updated_at = now()
        return self.state

    def move_card(self, board_id: str, card_id: str, to_column_id: str, to_index: int) -> AppState:
        board = self._find_board(board_id)
        from_column, index, card = self._find_card_location(board, card_id)
        to_column = self._find_column(board, to_column_id)
        from_column.cards.pop(index)
        clamped_index = max(0, min(to_index, len(to_column.cards)))
        to_column.cards.insert(clamped_index, card)
        card.updated_at = now()
        return self.state

    def duplicate_card(self, board_id: str, card_id: str) -> AppState:
        board = self._find_board(board_id)
        column, index, card = self._find_card_location(board, card_id)
        t = now()
        copy = card.model_copy(
            update={
                "id": new_id("k"),
                "title": f"{card.title} (salinan)",
                "created_at": t,
                "updated_at": t,
            },
            deep=True,
        )
        column.cards.insert(index + 1, copy)
        return self.state

    def archive_card(self, board_id: str, card_id: str, archived: bool) -> AppState:
        board = self._find_board(board_id)
        _, _, card = self._find_card_location(board, card_id)
        card.archived = archived
        card.updated_at = now()
        return self.state

    def delete_card(self, board_id: str, card_id: str) -> AppState:
        board = self._find_board(board_id)
        column, index, _ = self._find_card_location(board, card_id)
        column.cards.pop(index)
        return self.state

    # ---- labels ----

    def create_label(self, name: str, color: str) -> AppState:
        self.state.labels.append(Label(id=new_id("l"), name=name, color=color))
        return self.state

    def delete_label(self, label_id: str) -> AppState:
        if not any(l.id == label_id for l in self.state.labels):
            raise NotFoundError(f"Label tidak ditemukan: {label_id}")
        self.state.labels = [l for l in self.state.labels if l.id != label_id]
        for board in self.state.boards:
            for column in board.columns:
                for card in column.cards:
                    card.label_ids = [lid for lid in card.label_ids if lid != label_id]
        return self.state

    # ---- settings & backup ----

    def update_settings(self, patch: dict) -> AppState:
        for field, value in patch.items():
            setattr(self.state.settings, field, value)
        return self.state

    def mark_exported(self) -> AppState:
        self.state.settings.last_export_at = now()
        return self.state

    def export_json(self) -> AppState:
        return self.state

    def import_json(self, incoming: AppState, mode: str) -> AppState:
        if mode == "replace":
            self.state = incoming.model_copy(deep=True)
        else:
            existing_board_ids = {b.id for b in self.state.boards}
            for board in incoming.boards:
                if board.id not in existing_board_ids:
                    self.state.boards.append(board.model_copy(deep=True))
            existing_label_ids = {l.id for l in self.state.labels}
            for label in incoming.labels:
                if label.id not in existing_label_ids:
                    self.state.labels.append(label.model_copy(deep=True))
        return self.state


store = Store()


def get_store() -> Store:
    return store
