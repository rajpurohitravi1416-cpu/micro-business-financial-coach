# MysHopUpdates

MysHopUpdates is a small-business management application. The frontend uses React, TypeScript, and Vite; the API uses FastAPI and SQLite.

## Features

- Dashboard with cash, sales, profit, and business insights
- Sales, purchases, products, inventory, expenses, customer, and udhaar tracking
- Debt coaching, business coach, and government scheme information
- English, Hindi, regional Indian language, and Hinglish interface options
- Responsive desktop and mobile navigation, with browser voice input and read-aloud support

## Run the frontend

```bash
npm install
npm run dev
```

The frontend uses `http://localhost:8000` for the API by default. Set `VITE_API_BASE_URL` to use a different API address.

## Run the API locally

In one terminal, install and start the backend from the `backend` folder:

```bash
cd backend
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

In another terminal, start the frontend from the repository root:

```bash
npm install
npm run dev
```

The default SQLite URL is `sqlite:///./bizz_brains.db`, resolved from the backend process's current working directory. Starting the API creates the database file and any missing tables. In this project, starting it from `backend` creates `backend/bizz_brains.db`.

## Create the predefined Admin account

Run this once from the `backend` folder, then enter the Admin name, email, and a strong password when prompted:

```bash
python -m app.seed_admin
```

The command creates an Admin only if one does not already exist. Registration through the app always creates a Shop Owner. For Docker Compose, start the stack first, then run `docker compose exec backend python -m app.seed_admin` (use the backend service name from `docker-compose.yml`).

For local development, the session cookie is suitable for localhost over HTTP. For an HTTPS deployment, set `COOKIE_SECURE=true` in the backend environment. Keep the API and frontend origins aligned with the allowed CORS origins in `backend/app/main.py` when hosting them elsewhere.

## Run the API with Docker Compose

From the repository root:

```bash
docker compose up --build
```

The API listens on port 8000. Its SQLite database file is `backend/bizz_brains.db` in the provided Compose setup. Before the first authentication schema change, startup makes a timestamped SQLite backup beside the database. Existing business records remain in place; legacy shops can be assigned to their owner from the Admin dashboard.

## Backend tests

From `backend`:

```bash
pip install -r requirements-dev.txt
pytest -q
```

## WhatsApp Udhaar reminders

The Udhaar page reads saved Udhaar and customer records from the API. **Send WhatsApp Reminder** opens WhatsApp with the customer's saved number and a prefilled message containing the shop name, remaining balance, and due date. The shop owner reviews and sends it manually; MysHopUpdates does not send messages or report delivery.

## Ollama business coach

The Coach page calls the authenticated FastAPI route. Ollama runs separately on the backend machine; the backend sends only the signed-in shop's sales, purchases, expenses, inventory, and Udhaar summaries. It does not send customer names or phone numbers.

For local development, the backend defaults to `OLLAMA_BASE_URL=http://localhost:11434` and `OLLAMA_MODEL=qwen3:8b`. For Ollama Cloud, set backend environment variables `OLLAMA_BASE_URL=https://ollama.com`, `OLLAMA_MODEL` to a model enabled for your Ollama Cloud account, and `OLLAMA_API_KEY` to your key. The key is read only by FastAPI and is sent as a Bearer token to `ollama.com`; local Ollama requests do not receive it. The Coach checks `/api/tags` and shows whether the selected model is available.

Do not put the key in React/Vite variables or commit it. In Render, add `OLLAMA_API_KEY` as a secret environment variable on the backend service. To select the cloud model, use a model listed for your account by Ollama's cloud model catalog or authenticated `https://ollama.com/api/tags` response; set its exact identifier as `OLLAMA_MODEL`. The local default `qwen3:8b` is used only for local Ollama and is not assumed to exist in the cloud.

For Docker Compose, the URL defaults to `http://host.docker.internal:11434`, which reaches local Ollama on the host. To use Cloud, set `OLLAMA_BASE_URL=https://ollama.com`, `OLLAMA_MODEL` to an available cloud model, and `OLLAMA_API_KEY` in the environment before `docker compose up --build`. Compose passes the key only to the backend container.

## Build and lint

```bash
npm run build
npm run lint
```
