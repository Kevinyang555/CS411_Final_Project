# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Travel Planner is a full-stack application for CS 411 (Group 128) that integrates weather data, flight information, crowd metrics, and attractions into a unified trip planning interface.

## Architecture

- **Frontend:** React 19 + Vite 7 (`smart-travel-planner-frontend/`)
- **Backend:** Node.js + Express 5 (`smart-travel-planner-backend/`)
- **Database:** MySQL on Google Cloud SQL (`cs-411-team-128:us-central1:smart-travel-db`)
- **Connection:** Cloud SQL Proxy required for database access

## Development Commands

### Running the Full Stack (3 terminals required)

**Terminal 1: Cloud SQL Proxy**
```bash
cd C:\Users\kevin\cloud-sql-proxy
.\cloud-sql-proxy.exe cs-411-team-128:us-central1:smart-travel-db
# Wait for: "Listening on 127.0.0.1:3306"
```

**Terminal 2: Backend (port 3000)**
```bash
cd smart-travel-planner-backend
npm run dev
```

**Terminal 3: Frontend (port 5173)**
```bash
cd smart-travel-planner-frontend
npm run dev
```

### Frontend Commands
```bash
cd smart-travel-planner-frontend
npm run dev      # Start Vite dev server with HMR
npm run build    # Build production bundle
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Backend Commands
```bash
cd smart-travel-planner-backend
npm run dev      # Start with nodemon (auto-restart)
npm start        # Production mode
```

## Code Architecture

### Frontend (`smart-travel-planner-frontend/src/`)

Single-page app with all components in `App.jsx`. Uses tab-based navigation (no router library).

**Key components:**
- `SignInPage` - Frontend-only auth (no backend validation)
- `TripPlanner` - Main feature, calls POST `/api/trip-summary`
- `Explore` - 4 analytics cards (currently mock data)
- `TripsPlaceholder` - Saved trips (not yet implemented)

**Temperature handling:** User inputs Fahrenheit, converts to Celsius for API (`fToC()`), converts back for display (`cToF()`).

### Backend (`smart-travel-planner-backend/src/`)

```
src/
├── config/database.js       # MySQL connection pool
├── controllers/tripController.js  # Trip planning logic
├── routes/api.js            # Route definitions
└── server.js                # Express entry point
```

### API Endpoints

**POST /api/trip-summary** - Main trip planning query
- Input: `{ origin, destination, startDate, endDate, budget, currency, tempMin, tempMax, crowdPreference, maxFlightPrice }`
- Queries 5+ tables with complex JOINs
- Returns: weather summary, flights, attractions with busyness index

**GET /health** - Health check

### Database Schema

| Table | Description |
|-------|-------------|
| Location | 500 cities (location_id, name, country, lat, lon) |
| WeatherDaily | Weather records (on_date, min_temp_c, max_temp_c, precip_mm, conditions) |
| FlightOption | Flights (carrier_code, flight_number, price, depart_time, arrive_time) |
| flight_origin | Junction: flight_id → origin location_id |
| flight_destination | Junction: flight_id → destination location_id |
| Attraction | Tourist attractions (name, category, rating, lat, lon) |
| AttractionPopularity | Hourly busyness data (attraction_id, on_date, hour, busyness_index) |

## Demo Data

**Best test query:** Shangrao → Tokyo (2025-10-20 to 2025-10-26)
- Returns 1 flight, 7 days weather, 10 attractions with busyness data

## Known Limitations

1. Explore endpoints use mock data (not implemented in backend)
2. Sign-in is cosmetic (no backend auth)
3. My Trips and Itinerary are client-side only (no persistence)
4. Requires all 3 services running simultaneously
