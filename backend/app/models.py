"""Pydantic models matching the schemas in /openapi.yaml.

Fields are snake_case in Python but (de)serialize as camelCase JSON, via
CamelModel's alias generator, to match the frontend/openapi.yaml contract
exactly.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    def set_fields(self) -> dict:
        """Fields the client actually sent, as live values (nested models kept
        as model instances, not dicts) — safe to `setattr` onto another model
        without re-validation. Plain `model_dump(exclude_unset=True)` would
        flatten nested models into dicts and silently break their type."""
        return {name: getattr(self, name) for name in self.model_fields_set}


class ChecklistItem(CamelModel):
    id: str
    text: str
    done: bool


class Card(CamelModel):
    id: str
    title: str
    notes: str = ""
    label_ids: list[str] = Field(default_factory=list)
    due_date: date | None = None
    checklist: list[ChecklistItem] = Field(default_factory=list)
    archived: bool = False
    created_at: datetime
    updated_at: datetime


class CardPatch(CamelModel):
    """Any subset of Card's editable fields."""

    title: str | None = None
    notes: str | None = None
    label_ids: list[str] | None = None
    due_date: date | None = None
    checklist: list[ChecklistItem] | None = None


class Column(CamelModel):
    id: str
    title: str
    wip_limit: int | None = None
    cards: list[Card] = Field(default_factory=list)


class ColumnPatch(CamelModel):
    title: str | None = None
    wip_limit: int | None = None


class Board(CamelModel):
    id: str
    title: str
    created_at: datetime
    columns: list[Column] = Field(default_factory=list)


class Label(CamelModel):
    id: str
    name: str
    color: str


class Settings(CamelModel):
    theme: Literal["auto", "light", "dark"] = "auto"
    accent: str = "hangat"
    last_export_at: datetime | None = None


class SettingsPatch(CamelModel):
    theme: Literal["auto", "light", "dark"] | None = None
    accent: str | None = None


class AppState(CamelModel):
    version: int
    active_board_id: str | None
    settings: Settings
    labels: list[Label] = Field(default_factory=list)
    boards: list[Board] = Field(default_factory=list)


# ---- Request bodies ----


class CreateBoardRequest(CamelModel):
    title: str | None = None


class RenameBoardRequest(CamelModel):
    title: str


class CreateColumnRequest(CamelModel):
    title: str | None = None


class ReorderColumnsRequest(CamelModel):
    column_ids: list[str]


class CreateCardRequest(CamelModel):
    title: str


class MoveCardRequest(CamelModel):
    to_column_id: str
    to_index: int = Field(ge=0)


class ArchiveCardRequest(CamelModel):
    archived: bool


class CreateLabelRequest(CamelModel):
    name: str
    color: str


class ImportRequest(CamelModel):
    data: AppState
    mode: Literal["merge", "replace"]


class ErrorMessage(CamelModel):
    message: str
