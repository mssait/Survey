# Survey Tool

A full-stack survey application built with React, Node.js, Express, and PostgreSQL.

## Features

- **Survey Builder** — Create surveys with 4 question types: text, multiple choice, checkboxes, and rating (1–5)
- **Survey Management** — List, edit, publish/unpublish, and delete surveys
- **Survey Taking** — Shareable public link for respondents
- **Results Dashboard** — View aggregated responses with bar charts and rating distributions

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS, Axios |
| Backend  | Node.js, Express, express-validator |
| Database | PostgreSQL 15                       |
| Infra    | Docker, Docker Compose, Nginx       |

## Quick Start (Docker)

```bash
docker-compose up --build
```

Then open:
- **App**: http://localhost:5173
- **API**: http://localhost:5000/api

## Local Development (without Docker)

### Prerequisites
- Node.js 18+
- PostgreSQL 15+

### 1. Database setup

```bash
createdb surveydb
psql surveydb < backend/migrations/init.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # edit DB credentials if needed
npm install
npm run dev                  # starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                  # starts on http://localhost:5173
```

## API Reference

| Method | Endpoint                        | Description                    |
|--------|---------------------------------|--------------------------------|
| GET    | /api/surveys                    | List all surveys               |
| POST   | /api/surveys                    | Create survey with questions   |
| GET    | /api/surveys/:id                | Get survey with questions      |
| PUT    | /api/surveys/:id                | Update survey                  |
| DELETE | /api/surveys/:id                | Delete survey                  |
| PATCH  | /api/surveys/:id/publish        | Toggle published state         |
| GET    | /api/surveys/:id/results        | Get aggregated results         |
| POST   | /api/responses                  | Submit a response              |
| GET    | /api/responses/survey/:id       | Get all responses for a survey |

## Environment Variables

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=surveydb
DB_USER=postgres
DB_PASSWORD=postgres
FRONTEND_URL=http://localhost:5173
```
