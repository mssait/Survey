# SurveyTool

A full-stack survey creation and response collection application built with React, Node.js, Express, and PostgreSQL.

## Features

- Create and manage surveys with multiple question types (text, multiple choice, checkbox, rating)
- Publish/unpublish surveys to control access
- Share survey links with respondents
- Collect and view aggregated results with visual charts
- Responsive, modern UI built with Tailwind CSS

## Project Structure

```
Survey/
├── backend/          # Node.js/Express API server
│   ├── src/
│   │   ├── config/   # Database configuration
│   │   ├── routes/   # API route handlers
│   │   └── app.js    # Express app entry point
│   ├── migrations/   # SQL database schema
│   ├── Dockerfile
│   └── .env.example
├── frontend/         # React + Vite frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page-level components
│   │   ├── services/    # API client
│   │   └── App.jsx
│   ├── Dockerfile
│   └── nginx.conf
└── docker-compose.yml
```

## Local Development (Without Docker)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup

Create the database and run the schema:

```bash
createdb surveydb
psql surveydb < backend/migrations/init.sql
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials if needed
npm install
npm run dev
```

The backend will start on `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`.

## Local Development (With Docker)

### Prerequisites

- Docker
- Docker Compose

### Start All Services

```bash
docker-compose up --build
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 5000
- Frontend on port 5173

### Stop All Services

```bash
docker-compose down
```

To remove volumes (database data):

```bash
docker-compose down -v
```

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

| Variable       | Default              | Description              |
|---------------|----------------------|--------------------------|
| PORT          | 5000                 | Backend server port      |
| DB_HOST       | localhost            | PostgreSQL host          |
| DB_PORT       | 5432                 | PostgreSQL port          |
| DB_NAME       | surveydb             | Database name            |
| DB_USER       | postgres             | Database user            |
| DB_PASSWORD   | postgres             | Database password        |
| FRONTEND_URL  | http://localhost:5173| Allowed CORS origin      |

## API Endpoints

### Surveys

| Method | Path                          | Description                    |
|--------|-------------------------------|--------------------------------|
| GET    | /api/surveys                  | List all surveys               |
| POST   | /api/surveys                  | Create a new survey            |
| GET    | /api/surveys/:id              | Get survey with questions      |
| PUT    | /api/surveys/:id              | Update survey and questions    |
| DELETE | /api/surveys/:id              | Delete survey                  |
| PATCH  | /api/surveys/:id/publish      | Toggle published state         |
| GET    | /api/surveys/:id/results      | Get aggregated results         |

### Responses

| Method | Path                          | Description                    |
|--------|-------------------------------|--------------------------------|
| POST   | /api/responses                | Submit a response              |
| GET    | /api/responses/survey/:id     | Get all responses for a survey |
