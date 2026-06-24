# CrimeLens AI

Urban safety intelligence platform — AI-powered incident classification, hotspot detection, and risk scoring.

## Prerequisites

- Python 3.11+
- Node.js 20+
- npm 9+

## Backend

```bash
cd backend

# Create & activate venv
python -m venv venv
# Windows: .\venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install google-genai

# Configure environment
cp .env.example .env   # edit with your API keys

# Run server
python -m uvicorn api.main:app --reload --port 8000
```

API docs at `http://localhost:8000/docs`.

### Tests

```bash
cd backend
python -m pytest tests/ -v
```

### Lint

```bash
cd backend
ruff check .
```

## Dashboard (Next.js)

```bash
cd apps/dashboard
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm run start        # serve production build
```

Default API URL: `http://localhost:8000/api/v1`. Override with `NEXT_PUBLIC_API_URL` env var.

## Mobile (React Native / Expo)

```bash
cd apps/mobile
npm install --legacy-peer-deps
cp .env.example .env   # Supabase credentials (pre-filled for dev)
npx expo start         # opens Expo dev tools (scan QR with Expo Go)
npx expo start --web   # web preview
npx expo start --android   # Android emulator
npx expo start --ios       # iOS simulator
```

### Typecheck

```bash
cd apps/mobile
npx tsc --noEmit
```

> **Web note**: `react-native-maps` is native-only. The map view works on iOS/Android simulators but uses a simplified view on web. Some features (location, secure store) gracefully fall back on web.

## Project Structure

```
crimelens ai/
├── backend/           # FastAPI + Supabase + Gemini
│   ├── api/
│   │   ├── routers/   # Endpoints (incidents, hotspots, classify, etc.)
│   │   ├── services/  # Business logic (classifier, risk engine, hotspot detection)
│   │   ├── models/    # Pydantic schemas
│   │   └── utils/     # Helpers (geo, pagination)
│   └── tests/
├── apps/
│   ├── dashboard/     # Next.js 14 admin panel (shadcn/ui, React Query)
│   └── mobile/        # Expo SDK 56 React Native app (Expo Router, Zustand)
└── packages/          # Shared packages
```
