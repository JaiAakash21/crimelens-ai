# CrimeLens AI

Urban safety intelligence platform — AI-powered incident classification, hotspot detection, and risk scoring.

## Prerequisites

- Python 3.12+
- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)

## Backend

```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
pip install google-genai
cp .env.example .env   # then fill in your API keys
python -m uvicorn api.main:app --reload --port 8000
```

API docs at `http://localhost:8000/docs`.

### Run tests

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
npm run dev        # http://localhost:3000
npm run build      # production build
npm run start      # serve production build
```

## Mobile (React Native / Expo)

```bash
cd apps/mobile
npm install
npx expo start     # opens Expo dev tools
npx expo start --web    # web preview
npx expo start --android  # Android emulator
npx expo start --ios      # iOS simulator
```

### Typecheck

```bash
cd apps/mobile
npx tsc --noEmit
```

## Project Structure

```
crimelens ai/
├── backend/           # FastAPI + Supabase + Gemini
│   ├── api/
│   │   ├── routers/   # Endpoints
│   │   ├── services/  # Business logic
│   │   ├── models/    # Pydantic schemas
│   │   └── utils/     # Helpers (geo, pagination)
│   └── tests/
├── apps/
│   ├── dashboard/     # Next.js admin panel
│   └── mobile/        # Expo React Native app
└── packages/          # Shared packages
```
