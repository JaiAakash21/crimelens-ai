# CrimeLens AI

Urban Safety Intelligence Platform powered by Artificial Intelligence for incident classification, crime hotspot detection, risk scoring, and smart crime reporting.

CrimeLens AI is an intelligent platform that empowers citizens and law enforcement agencies by providing real-time incident reporting, AI-assisted crime analysis, interactive crime mapping, and predictive insights to improve public safety.

## Key Features
# Smart Incident Reporting
Report crime incidents in real time
Add title, description, category, and location
Simple and user-friendly reporting interface

# Interactive Crime Map
Google Maps integration
Display reported incidents geographically
Visualize crime-prone areas

# Hotspot Detection
Detect areas with high crime concentration
Support preventive policing
Dynamic hotspot visualization

# Smart Route Planning
OSRM Routing integration
Suggest safer routes
Avoid high-risk areas

# Admin Dashboard
Monitor reported incidents
Visualize crime trends
Generate analytical reports
Manage users and incidents

## Project Goals
Improve public safety
Enable smarter crime reporting
Support proactive policing
Provide AI-assisted decision making
Enhance transparency between citizens and authorities
Build safer and smarter communities

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
