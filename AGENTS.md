# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

All 11 document types in the catalog are supported, draftable via AI chat or a schema-driven form, gated behind user authentication. Document persistence is not yet implemented — see Implementation status below.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
Consider statically building the frontend and serving it via FastAPI, if that will work.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation status

As of 2026-07-12 (PL-6, all document types):

**Implemented**
- **Document registry** (PL-6): `registry/documents.json` is the single source of truth for all 11 document types — party roles, fields (kinds: text/date/money/choice/term), per-field LLM guidance, and template span bindings. Loaded by the backend at runtime (`app/registry/`) and by the frontend at build time (`lib/registry/`). Registry↔template drift is blocked by `tests/test_registry.py` (every `*_link` span in every template must be claimed by exactly one role/field, and vice versa).
- **AI chat drafting for all documents** (PL-5/PL-6): chat starts with no document selected; the LLM picks the `documentType` from the user's request (declining unsupported documents and offering the closest match), fills fields turn by turn via Structured Outputs, and can switch documents mid-chat with party/shared-field carry-over (`app/form_merge.py`). The Structured Outputs response model is generated per document from the registry (`app/patch_models.py`), so the LLM cannot emit unknown fields or invalid choice values. Forms are flat string maps on the wire (see `app/registry/models.py` for key conventions). A dropdown allows manual document selection/switching too.
- **Generic renderer**: one template parser (`lib/documentTree.ts`) handles both the NDA's flat clauses and the other templates' nested lists with `header_2/header_3` spans; `lib/resolveFieldSpans.ts` substitutes all five `*_link` span classes (possessive-aware); `DocumentForm.tsx`/`DocumentPreview.tsx` render any registry document (schema-driven form, generated cover block, N-party signature block, PDF download).
- **Backend** (`backend/`): uv-managed FastAPI app. SQLite DB deleted and recreated on every startup (`app/db.py`) with a `users` table. Auth endpoints: `POST /api/signup`, `POST /api/signin`, `POST /api/signout`, `GET /api/me` — argon2 password hashing, itsdangerous-signed HttpOnly session cookies (`SESSION_SECRET` from `.env`).
- **Frontend serving**: Next.js is built as a static export (`output: "export"`, `trailingSlash: true`) and served by FastAPI via a `StaticFiles` mount registered after the API routes. `/login/` page (signup/signin) gates the NDA creator through the client-side `AuthGate` component.
- **Docker**: multi-stage root `Dockerfile` (Node builds the static export → Python/uv runtime), single image, port 8000. Root `.env` is passed via `--env-file`.
- **Scripts** (`scripts/`): the six start/stop scripts listed above (start always rebuilds the image), plus `smoke-test.sh`/`smoke-test.ps1` which build, run, curl-verify, and tear down.
- **Tests**: `backend/tests/` — 111 pytest cases covering auth flows, cookie tampering, static/API route precedence, the chat endpoint (selection, switching, all 11 document types), form merging/carry-over, and registry↔template integrity. Run with `uv run pytest` from `backend/`.

**Not yet implemented**
- Document persistence (no documents table; nothing is saved server-side).

