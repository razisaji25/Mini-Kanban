# Papanku — Mini Kanban

A small, personal Kanban board. No login, no server-side accounts, no
collaboration — just boards, columns, and cards for organizing your own
work. See [`_docs/specs.md`](_docs/specs.md) for the full product spec (in
Indonesian) this project was built against.

## Features

- **Boards, columns, cards** — create, rename, reorder, and delete at every
  level. Columns support an optional WIP limit that flags itself (softly)
  when exceeded.
- **Card details** — multi-line notes, colored labels, a due date, and a
  checklist with a progress indicator.
- **Drag and drop** — works with mouse, touch (long-press to start, so a
  scroll gesture isn't hijacked), and keyboard (`Alt`+arrow keys on a
  selected card). A "Move to…" dropdown is always available as a fallback.
- **Search & filter** — by title/notes text, by label, and by due date
  (overdue / due today).
- **Themes** — light/dark/auto, plus a choice of accent colors.
- **Backup** — export the whole board to a JSON file and re-import it later
  (merge or replace), with a gentle reminder if you haven't exported in a
  while.
- **Responsive** — one column at a time on phones (with a swipe/dot
  indicator), a few columns on tablets, full board with a side detail panel
  on desktop.

## Tech stack

| Layer    | Stack                                                              |
|----------|---------------------------------------------------------------------|
| Frontend | Plain HTML/CSS/JS (ES modules), no build step, no framework        |
| Backend  | [FastAPI](https://fastapi.tiangolo.com/) + [uv](https://docs.astral.sh/uv/) for dependency management |
| Data     | In-memory mock store (see [Persistence](#persistence) below)       |
| API spec | [OpenAPI 3.0](openapi.yaml)                                        |
| Tests    | `pytest`, via FastAPI's `TestClient`                                |

## Project structure

```
.
├── openapi.yaml            # API contract the frontend and backend both honor
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── js/
│       ├── api.js          # the ONLY module that talks to the backend
│       ├── main.js         # app state, event wiring
│       ├── render.js       # DOM rendering
│       └── dragdrop.js     # pointer-based drag & drop (mouse/touch)
├── backend/
│   ├── app/
│   │   ├── main.py         # FastAPI app, CORS, error handling
│   │   ├── models.py       # Pydantic schemas (mirrors openapi.yaml)
│   │   ├── store.py        # mock database + business logic
│   │   └── routers/        # one module per resource (boards, cards, …)
│   └── tests/               # one test file per router
├── scripts/
│   └── stop-port.(sh|ps1)  # kills whatever is bound to a given port
├── dev.ps1 / test.ps1      # PowerShell entry points (no `make` on Windows)
└── Makefile                # entry points for bash-like shells
```

## Prerequisites

- [uv](https://docs.astral.sh/uv/getting-started/installation/) (manages
  the backend's Python version and dependencies — you don't need Python
  pre-installed separately)
- Python 3.x, for serving the frontend statically (`python -m http.server`)
- A modern browser (Chrome, Edge, Firefox, or Safari, last two years)

`make` is **not** required — see below.

## Running the app

The backend serves the API on **`http://localhost:8030`**; the frontend is
just static files served on **`http://localhost:8000`**. Both need to be
running at the same time.

### Windows / PowerShell

```powershell
.\dev.ps1
```

Starts the backend and the static frontend server together. Press `Ctrl+C`
to stop both — cleanup is handled by `scripts/stop-port.ps1`, which finds
and kills whatever is actually bound to the backend's port (necessary
because `uv run` spawns nested child processes, so the PID a naive
`Start-Process` call hands back isn't always the one really holding the
port).

If PowerShell refuses to run the script:

```powershell
powershell -ExecutionPolicy Bypass -File .\dev.ps1
```

### macOS / Linux / Git Bash (with `make` installed)

```sh
make dev
```

Same thing, implemented with a `trap` + `scripts/stop-port.sh` for cleanup
on `Ctrl+C`.

### Running the pieces separately

```sh
# Backend only
cd backend && uv run uvicorn app.main:app --reload --port 8030
# or: make run / .\... (there's no separate run.ps1; use dev.ps1)

# Frontend only, from frontend/
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser. The frontend's backend
client is centralized in [`frontend/js/api.js`](frontend/js/api.js) — the
`BASE_URL` constant there is the one place that knows where the backend
lives.

## Running tests

```powershell
.\test.ps1          # PowerShell
```
```sh
make test           # bash-like shells
# or directly:
cd backend && uv run pytest
```

44 tests cover every endpoint in `openapi.yaml`, including edge cases like
default titles, WIP-limit-clear-via-explicit-`null`, move-index clamping,
and merge-vs-replace import semantics.

## API

The full contract — every endpoint, request/response shape, and which ones
need auth (none; this app has no accounts) — is documented in
[`openapi.yaml`](openapi.yaml). With the backend running, interactive docs
are also available at `http://localhost:8030/docs`.

Every backend endpoint returns the **entire application state** after a
mutation (not just the changed resource), because the frontend just
replaces its local copy of the state with whatever a call resolves to and
re-renders from that — simple, at the cost of slightly larger responses.

## Persistence

The backend currently uses an **in-memory mock store**
([`backend/app/store.py`](backend/app/store.py)) — data lives only as long
as the server process is running and resets to a seeded example board on
restart or on `POST /api/reset`. It's a placeholder for a real database;
every router talks to `Store` through the same small set of methods
(`create_board`, `move_card`, `import_json`, …), so swapping the storage
layer later shouldn't require touching the routers at all.

Until that swap happens, use **Export → JSON** in the app to keep a durable
copy of your data, since it does not survive a server restart.

## Configuration

| What            | Where                                          | Default                    |
|-----------------|-------------------------------------------------|-----------------------------|
| Backend port    | `dev.ps1` / `Makefile` (`--port` flag)          | `8030`                     |
| Backend base URL used by the frontend | `frontend/js/api.js` (`BASE_URL`) | `http://localhost:8030/api` |
| Frontend port   | `dev.ps1` / `Makefile` (`http.server` arg)      | `8000`                     |
| CORS            | `backend/app/main.py`                           | wide open (`*`) — dev only |

If you change the backend port, update it in both places above.

## Roadmap

Per the original spec's staged plan:

- [x] Stage 1 — boards, columns, cards, drag & drop, responsive layout
- [x] Stage 2 — labels, due dates, checklists, search & filter
- [x] Stage 3 — multiple boards, themes, export/import
- [ ] Stage 4 — installable PWA (offline support, home-screen icon)
- [ ] Stage 5 — real persistence and, if ever needed, multi-device sync
      (which would mean accounts — a deliberate non-goal for now)

## License

Personal / educational project. No license file yet — ask before reusing.
