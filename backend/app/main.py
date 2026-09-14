from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import backup, boards, cards, columns, labels, settings, state
from app.store import NotFoundError

app = FastAPI(title="Mini Kanban API", version="1.0.0")

# Dev-only: the static frontend is served from its own origin/port with no
# cookies or auth involved (specs.md 2.2 rules out accounts), so a wide-open
# policy is fine here. Tighten this to the real frontend origin before
# deploying anywhere shared.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(NotFoundError)
def handle_not_found(request: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(status_code=404, content={"message": str(exc)})


app.include_router(state.router, prefix="/api")
app.include_router(boards.router, prefix="/api")
app.include_router(columns.router, prefix="/api")
app.include_router(cards.router, prefix="/api")
app.include_router(labels.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(backup.router, prefix="/api")
