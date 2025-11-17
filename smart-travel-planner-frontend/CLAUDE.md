# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Smart Travel Planner is a **full-stack application** for a CS 411 course project (Group 128) that integrates weather data, flight information, crowd metrics, and attractions into a unified trip planning interface. The app helps users determine optimal times to visit destinations by combining multiple data sources.

**Architecture:**
- **Frontend:** React 19.2.0 + Vite 7.2.2 (this repository)
- **Backend:** Node.js + Express 5.1.0 (sibling repository: `smart-travel-planner-backend`)
- **Database:** MySQL on Google Cloud SQL (`cs-411-team-128:us-central1:smart-travel-db`)
- **Connection:** Cloud SQL Proxy for secure database access

## Development Commands

### Running the Full Application (3 Terminals Required)

**Terminal 1: Cloud SQL Proxy**
```bash
cd C:\Users\kevin\cloud-sql-proxy
.\cloud-sql-proxy.exe cs-411-team-128:us-central1:smart-travel-db
# Wait for: "Listening on 127.0.0.1:3306"
```

**Terminal 2: Backend Server**
```bash
cd C:\Users\kevin\CS 411\smart-travel-planner-backend
npm run dev
# Wait for: "Server running at: http://localhost:3000"
```

**Terminal 3: Frontend (this repo)**
```bash
npm run dev
# Wait for: "Local: http://localhost:5173/"
```

### Frontend Commands
- `npm run dev` - Start Vite development server with HMR
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint on all files

### Installation
- `npm install` - Install dependencies (required before first run)

### First-Time Setup
1. **Install Google Cloud CLI** (for Cloud SQL Proxy authentication)
2. **Authenticate:** `gcloud auth application-default login`
3. **Install backend dependencies:** `cd ../smart-travel-planner-backend && npm install`
4. **Install frontend dependencies:** `npm install` (in this directory)

## Application Architecture

### Single-Page Application Structure
The entire application is contained in `src/App.jsx` (1123 lines) with a component-based architecture. The app uses client-side routing via tab state rather than a routing library.

### Main Components & Flow

**Authentication Flow:**
- `SignInPage` - Simple form-based auth (stores user in local state, no backend integration yet)
- User object contains: `{ fullName, email }`

**Layout Components:**
- `Sidebar` - Navigation with 4 tabs: planner, trips, explore, about
- `Header` - Welcome message and context
- `App` - Root component managing auth state and active tab

**Core Features (4 Tabs):**

1. **Trip Planner (`TripPlanner`)** - Main feature
   - Form inputs: origin, destination, dates, budget, temperature range (°F), crowd preference, max flight price
   - Submits to `http://localhost:3000/api/trip-summary` (POST) with temperature converted from °F to °C
   - **✅ NOW CONNECTED TO REAL BACKEND** (no longer using mock data fallback)
   - Displays: `TripSummaryHeader`, `WeatherPanel`, `FlightsPanel`, `AttractionsPanel`, `ItineraryPanel`
   - Backend queries 5 database tables: Location, WeatherDaily, FlightOption, Attraction, AttractionPopularity

2. **My Trips (`TripsPlaceholder`)** - Placeholder for saved trips
   - Intended to integrate with `/api/trips` endpoints
   - Currently shows static placeholder content

3. **Explore Destinations (`Explore`)** - Analytics/discovery features
   - 4 explore cards with mock data fallbacks:
     - `/api/explore/sunny-cities` - Cities with clear weather
     - `/api/explore/cold-cities` - Cities colder than country average
     - `/api/explore/cheap-flights-good-weather` - Budget flights to pleasant destinations
     - `/api/explore/monthly-route-avg` - Price trends by month/route

4. **About (`About`)** - Static informational page

### Data Flow & API Integration

**Temperature Conversion:**
- User inputs temperature in Fahrenheit
- `fToC()` converts to Celsius before API submission (src/App.jsx:7-9)
- `cToF()` converts API responses back to Fahrenheit for display (src/App.jsx:3-5)

**API Pattern:**
- **Trip Summary:** Direct `fetch()` call to `http://localhost:3000/api/trip-summary` (src/App.jsx:301-321)
- **Explore endpoints:** Still use `safeFetchJSON()` with mock fallback (not yet implemented in backend)
- Temperature automatically converted °F → °C before sending to backend
- Backend returns Celsius, frontend converts back to Fahrenheit for display

**State Management:**
- Pure React hooks (useState, useEffect)
- No global state management library
- Component-local state for forms and data

### Key Data Structures

**Trip Summary Response (from Backend):**
```javascript
{
  location: { name, country },
  weatherSummary: { avgHigh, avgLow, avgPrecip, conditionsSummary },  // In Celsius
  weatherDaily: [{ date, min, max, precip, conditions }],  // In Celsius
  flights: [{ flightId, carrierCode, flightNumber, price, currency, departTime, arriveTime, originCity, destinationCity }],
  attractions: [{ id, name, category, rating, lat, lon, busynessIndex }],  // busynessIndex: 0-100 or null
  bestTimeToVisit: { label, explanation }
}
```

**Note:** Backend stores weather in Celsius. Frontend displays in Fahrenheit.

**Itinerary Items:**
```javascript
{
  id,
  attraction: { id, name, category, ... },
  visitDate,
  startTime,
  endTime,
  notes
}
```

## Styling

- CSS-in-CSS approach (no CSS-in-JS)
- Main stylesheet: `src/styles.css` (10,879 bytes)
- Component-specific styles: `src/App.css`
- Global styles: `src/index.css`

## Build Configuration

- **Bundler:** Vite 7.2.2
- **React version:** 19.2.0 (latest)
- **Plugin:** @vitejs/plugin-react (uses Babel for Fast Refresh)
- **ESLint:** Flat config format with React Hooks and React Refresh plugins

## Backend Integration

### ✅ Current Status: FULLY INTEGRATED

The frontend is now connected to a real Node.js/Express backend with MySQL database.

**Backend Repository:** `C:\Users\kevin\CS 411\smart-travel-planner-backend`

**Backend Stack:**
- **Runtime:** Node.js with ES6 modules
- **Framework:** Express 5.1.0
- **Database Client:** mysql2 (promise-based)
- **Database:** Google Cloud SQL (MySQL)
- **Connection:** Cloud SQL Proxy (local port 3306)

**Backend Structure:**
```
smart-travel-planner-backend/
├── src/
│   ├── config/
│   │   └── database.js          # MySQL connection pool
│   ├── controllers/
│   │   └── tripController.js    # Trip planning business logic
│   ├── routes/
│   │   └── api.js               # API route definitions
│   └── server.js                # Express server setup
├── scripts/                     # Database testing/demo scripts
│   ├── find-demo-data.js
│   ├── check-popularity-table.js
│   ├── find-demo-with-busyness.js
│   ├── test-shangrao-tokyo.js
│   └── trace-seoul-bengbu.js
├── .env                         # Database credentials (gitignored)
└── package.json
```

### Implemented Backend Endpoints

**✅ POST /api/trip-summary**
- **Purpose:** Main trip planning query
- **Input:** `{ origin, destination, startDate, endDate, budget, currency, tempMin, tempMax, crowdPreference, maxFlightPrice }`
- **Database Queries:**
  1. Find origin and destination location IDs (Location table)
  2. Get weather forecast (WeatherDaily table)
  3. Find flights with complex JOIN (FlightOption + flight_origin + flight_destination + Location)
  4. Get attractions with busyness index (Attraction + AttractionPopularity via LEFT JOIN)
- **Response:** Trip summary with weather, flights, attractions, and busyness data

**✅ GET /health**
- Health check endpoint (returns server status)

### Database Schema

**Tables Used:**
1. **Location** - 500 cities worldwide (location_id, name, country, lat, lon)
2. **WeatherDaily** - 3,500 weather records (on_date, min_temp_c, max_temp_c, precip_mm, conditions)
3. **FlightOption** - 1,824 flights (carrier_code, flight_number, price, depart_time, arrive_time)
4. **flight_origin** - Junction table (flight_id → origin location_id)
5. **flight_destination** - Junction table (flight_id → destination location_id)
6. **Attraction** - Tourist attractions (name, category, rating, lat, lon)
7. **AttractionPopularity** - Hourly busyness data (attraction_id, on_date, hour, busyness_index)

**Key SQL Features:**
- Complex 5-table JOINs for flight queries
- LEFT JOIN with AVG aggregation for busyness index
- Date range filtering for weather
- Price filtering and sorting for flights
- Normalized schema (3NF/BCNF)

### Demo Data

**Best demo query:** Shangrao → Tokyo (2025-10-20 to 2025-10-26)
- 1 flight: AC330 ($190.13 USD)
- 7 days of weather
- 10 attractions (all with busyness data: 39-48/100)

**Backup queries:** Kano → Tokyo, Medellín → Jakarta, Seoul → Bengbu

### Known Limitations

1. **Explore endpoints not yet implemented** - Still use mock data fallback
2. **No user authentication** - Sign-in is frontend-only (no backend validation)
3. **No trip persistence** - "My Trips" tab not connected to database
4. **Itinerary not saved** - Add to itinerary is client-side only (React state)

### Database Connection Requirements

1. **Cloud SQL Proxy must be running** on port 3306
2. **Google Cloud authentication** via `gcloud auth application-default login`
3. **Backend .env file** must contain valid credentials
4. **All three services** must run simultaneously: Proxy → Backend → Frontend

## File Structure

```
src/
├── App.jsx         # Main application (all components)
├── main.jsx        # React entry point
├── styles.css      # Main stylesheet
├── App.css         # Component styles
└── index.css       # Global styles
```

## Development Status & Future Work

### ✅ Completed Features

1. ✅ **Backend API integration** - Trip summary endpoint fully functional
2. ✅ **Database connection** - Google Cloud SQL with Cloud SQL Proxy
3. ✅ **Complex SQL queries** - Multi-table JOINs, aggregations, filtering
4. ✅ **Busyness index feature** - LEFT JOIN with AttractionPopularity table
5. ✅ **Temperature conversion** - Bidirectional °F ↔ °C conversion
6. ✅ **Weather data integration** - 7-day forecasts with averages
7. ✅ **Flight search** - Price filtering, sorting, multi-city support
8. ✅ **Attractions display** - Categories, ratings, busyness levels

### 🚧 In Progress / Future Work

1. **Explore endpoints** - 4 explore features still use mock data
   - `/api/explore/sunny-cities`
   - `/api/explore/cold-cities`
   - `/api/explore/cheap-flights-good-weather`
   - `/api/explore/monthly-route-avg`

2. **User authentication** - Backend validation and session management

3. **Trip persistence** - Save trips to database (My Trips tab)

4. **Itinerary persistence** - Save itinerary items to database

5. **TypeScript migration** - Convert from JavaScript to TypeScript

6. **More busyness data** - Currently only 15 attractions have data

7. **Advanced filtering** - Use crowd preference in backend queries

### 📝 Known Issues

1. **Itinerary resets on page refresh** - Client-side only (React state)
2. **Sign-in is cosmetic** - No backend user validation
3. **No error handling for offline mode** - App requires backend connection
