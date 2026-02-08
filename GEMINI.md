# Mindloop Project Context

## Project Overview
**Mindloop** is a comprehensive productivity suite designed for local-first workflow management. It provides tools for tracking intents, focus sessions, habits, and journals.

The project operates as a dual-interface application:
1.  **CLI:** A command-line interface for low-latency interaction.
2.  **Web Server/UI:** A local web server providing a visual interface and REST API.

**Key Technologies:**
*   **Language:** Go (Golang)
*   **CLI Framework:** [Cobra](https://github.com/spf13/cobra)
*   **ORM:** [GORM](https://gorm.io/)
*   **Database:** SQLite (Default) or PostgreSQL (BYODB mode)
*   **Web:** Go `net/http` with HTML templates (Server-Side Rendered)

## Architecture
The project follows a clean architecture pattern:
*   `cmd/`: Application entry points.
    *   `cmd/cli/`: CLI command definitions (Cobra).
    *   `cmd/server/`: Web server entry point.
*   `internal/core/`: Business logic domain (Focus, Habit, Intent, Journal, Summary).
*   `api/v1/`: HTTP handlers for the web server.
*   `db/`: Database connection and schema management.
*   `web/`: Static assets and HTML templates.

## Building and Running

The project uses a `Makefile` for build automation.

### Build
*   **Build All:** `make build` (Generates `mindloop` and `mindloop-server` binaries)
*   **Build CLI only:** `make build-cli`
*   **Build Server only:** `make build-server`

### Run
*   **CLI:**
    *   Run the binary directly: `./mindloop <command>` (e.g., `./mindloop help`)
*   **Server:**
    *   Run locally (foreground): `make run-server` (Default port: 8765)
    *   Start in background: `make start-server`
    *   Stop background server: `make kill-server`

### Testing
*   **Run Unit Tests:** `make test`

## Configuration
*   **Local Mode (Default):** Uses a local SQLite database (`mindloop_local.db`).
*   **BYODB Mode:** Can be configured to use an external PostgreSQL database via environment variables or `mindloop configure`.
*   **Environment Variables:** See `example.env` for available options.

## Development Conventions
*   **Formatting:** Run `make fmt` to format Go code.
*   **Project Structure:** Adheres to standard Go project layout conventions.
*   **Database:** Database logic is abstracted via GORM in `db/` and `internal/core`.
