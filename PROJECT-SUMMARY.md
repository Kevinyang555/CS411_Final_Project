# Smart Travel Planner - Project Summary

## Overview

A full-stack travel planning application that helps users search for destinations, view weather/flights/attractions, and manage trip itineraries.

---

## Frontend Features

### 1. Trip Search & Planning
- **Location:** `smart-travel-planner-frontend/src/App.jsx` (lines 180-350)
- Search by origin, destination, dates
- Filter by max flight price
- Displays weather forecast, flight options, and attractions

### 2. User Authentication
- **Location:** `smart-travel-planner-frontend/src/App.jsx` (lines 50-80)
- Google OAuth login via `@react-oauth/google`
- Creates/retrieves user from database on login

### 3. Trip CRUD Operations
- **Create Trip:** Click "Add to Itinerary" on any attraction (line 400-450)
- **Read Trips:** "My Trips" sidebar shows all user trips (line 500-550)
- **Update Itinerary:** Edit visit dates/times for items (line 600-650)
- **Delete Trip/Item:** Remove trips or individual items (line 700-750)

### 4. Keyword Search
- **Location:** `smart-travel-planner-frontend/src/App.jsx` (lines 200-250)
- Search destinations by city name
- Results displayed in organized cards

### 5. Explore Destinations (pre-built analytics)
- **Location:** `smart-travel-planner-frontend/src/App.jsx` (Explore tab)
- Inputs: start date (7-day window) and month (for price trends)
- Calls backend explore endpoints for sunny cities, colder cities, cheap flights to good-weather places, and monthly route price trends

---

## Backend Structure

### Server Entry Point
- **File:** `smart-travel-planner-backend/src/server.js`
- Express server on port 3000
- CORS configured for frontend (localhost:5173)

### API Routes
- **File:** `smart-travel-planner-backend/src/routes/api.js`

| Method | Endpoint | Function |
|--------|----------|----------|
| POST | `/api/userLogin` | User login/registration |
| POST | `/api/trip-summary` | Get weather, flights, attractions |
| POST | `/api/trips` | Create trip with first item |
| GET | `/api/trips/user/:userId` | Get all user trips |
| GET | `/api/trips/:tripId` | Get trip with itinerary |
| PUT | `/api/trips/:tripId/itinerary/:itemId` | Update itinerary item |
| DELETE | `/api/trips/:tripId/itinerary/:itemId` | Remove itinerary item |
| DELETE | `/api/trips/:tripId` | Delete entire trip |
| GET | `/api/explore/sunny-cities` | Sunniest cities (7-day window) |
| GET | `/api/explore/cold-cities` | Colder cities than country avg (7-day window) |
| GET | `/api/explore/cheap-flights-good-weather` | Cheapest flights + good weather (price/temp/precip filters) |
| GET | `/api/explore/monthly-route-avg` | Monthly route price trends |

### Controllers
- `userController.js` - User authentication
- `tripController.js` - Weather/flights/attractions queries
- `tripItineraryController.js` - Trip and itinerary CRUD
- `exploreController.js` - Explore analytics endpoints (sunny, cold, cheap flights, monthly price trends)

### Database Connection
- **File:** `smart-travel-planner-backend/src/config/database.js`
- MySQL connection pool via `mysql2/promise`
- Connects to Cloud SQL via proxy

---

## Database Advanced Features

### Location of SQL Setup
- **File:** `SmartTravel/Queries/trip_itinerary_setup.sql`

### Stored Procedures (3)

#### 1. CreateTripWithFirstItem
Creates a new trip and adds the first attraction in one operation.
- **Advanced Queries Used:**
  - JOIN (Attraction + Location tables)
  - Subquery (check user exists)
  - GROUP BY with COUNT aggregation

#### 2. AddItineraryItem
Adds an attraction to an existing trip.
- **Advanced Queries Used:**
  - Aggregation (MAX for item_id, sort_order)
  - JOIN (ItineraryItem + Attraction)

#### 3. GetUserTripsWithStats
Gets all trips for a user with itinerary statistics.
- **Advanced Queries Used:**
  - JOIN (Trip + ItineraryItem)
  - GROUP BY with COUNT
  - Subquery with GROUP_CONCAT

### Triggers (2)

#### 1. after_itinerary_insert
- **Event:** AFTER INSERT on ItineraryItem
- **Condition:** IF NEW.trip_id IS NOT NULL
- **Action:** UPDATE Trip SET item_count = item_count + 1

#### 2. after_itinerary_delete
- **Event:** AFTER DELETE on ItineraryItem
- **Condition:** IF OLD.trip_id IS NOT NULL
- **Action:** UPDATE Trip SET item_count = item_count - 1

### Transactions (2)

#### 1. createTripWithFirstItem (tripItineraryController.js:29-53)
- **Isolation Level:** READ COMMITTED
- **Purpose:** Atomic creation of trip + first itinerary item
- **Rollback:** If any step fails, entire operation is undone

#### 2. getTripWithItinerary (tripItineraryController.js:194-243)
- **Isolation Level:** REPEATABLE READ
- **Purpose:** Consistent read of trip + all itinerary items
- **Why this level:** Ensures both queries see the same data snapshot

### Constraints
- PRIMARY KEY on all tables (trip_id, user_id, item_id, etc.)
- FOREIGN KEY: Trip.user_id -> UserAccount.user_id
- FOREIGN KEY: ItineraryItem.trip_id -> Trip.trip_id
- FOREIGN KEY: ItineraryItem.attraction_id -> Attraction.attraction_id
- DEFAULT: Trip.item_count = 0

---

## Requirements Checklist

| Requirement | Status | Location |
|-------------|--------|----------|
| CRUD on non-user table | Done | Trip and ItineraryItem tables |
| Keyword search | Done | Destination search in App.jsx |
| Stored Procedures (2+ advanced queries) | Done | 3 procedures in trip_itinerary_setup.sql |
| Transactions (correct isolation, 2+ advanced queries) | Done | 2 transactions in tripItineraryController.js |
| Triggers (event, condition, action) | Done | 2 triggers in trip_itinerary_setup.sql |
| Constraints | Done | PKs, FKs, DEFAULTs on tables |
| Frontend accessible | Done | All features available via React UI |

---

## How to Run

### Backend
```bash
cd smart-travel-planner-backend
npm install
# Start Cloud SQL Proxy first
npm start
```

### Frontend
```bash
cd smart-travel-planner-frontend
npm install
npm run dev
```

### Database Setup
```bash
# Connect to MySQL and run:
source SmartTravel/Queries/trip_itinerary_setup.sql
```
