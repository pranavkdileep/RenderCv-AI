## Render CV AI

AI-powered resume and CV generator with live preview, PDF export, and an API-driven backend. The frontend is built with Next.js, and the backend is a Python service running in Docker.

**Live URL:** https://render-cv-ai.vercel.app/

---

## Demo Video



https://github.com/user-attachments/assets/995fa5a3-8705-4307-a9a5-f2f451507494



---

## Screenshots


<img width="1918" height="928" alt="image" src="https://github.com/user-attachments/assets/e9a15af5-90fe-4d83-953f-98615bd8cd0e" />



---

## Project Structure

- `app/` – Next.js frontend (App Router)
- `components/` – Reusable UI components (editor, preview, modals, etc.)
- `actions/` – Server actions for rendering PDF/SVG and integrating with AI services
- `backend/` – Python backend service (Dockerized)

---

## Getting Started

This project consists of two parts:

1. **Frontend:** Next.js application
2. **Backend:** Python API running in Docker

You can run them independently during development.

---

## Frontend (Next.js)

### Prerequisites

- Node.js (LTS recommended)
- npm (or yarn/pnpm/bun, adjust commands accordingly)

### Installation

From the project root (`ai-resume`):

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000.

### Production Build

```bash
npm run build
npm start
```

---

## Backend (Python, Docker)

The backend lives in the `backend/` directory and is packaged as a Docker container.

### Prerequisites

- Docker installed and running

### Build the Docker Image

From the project root (`ai-resume`):

```bash
docker build --pull --rm -f backend/Dockerfile -t airesume:latest backend
```

### Run the Backend Container

```bash
docker run --rm -p 5000:5000 --name airesume-backend airesume:latest
```

The backend API will be available at http://localhost:5000 (adjust if your `backend/main.py` or `app.py` uses a different port).

You may need to configure the frontend to point to this backend URL via environment variables (for example, `NEXT_PUBLIC_API_BASE_URL`).

---

## Environment Variables

Depending on your AI provider or external services, you may need to define environment variables, for example:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
GEMINI_API_KEY=your-key-here
```

Create a `.env.local` file in the project root for local development and ensure sensitive values are not committed to version control.

---

## License

This project is for personal and portfolio use.
