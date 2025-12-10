# Smart Travel Planner

A full-stack travel planning application that consolidates weather forecasts, flight options, and attractions into a single interface. Built for CS 411 (Database Systems) - Group 128.

## Features

### Trip Planning
- Search trips by origin, destination, and date range
- View 7-day weather forecasts for destinations
- Browse flight options sorted by price with optional price filtering
- Discover attractions with ratings and crowd/busyness indicators
- Build and manage trip itineraries

### Explore Destinations
- Find the sunniest cities for a given week
- Discover cities colder than their country average
- Search for cheap flights to destinations with good weather
- View monthly route price trends

### User Management
- User authentication with persistent sessions
- Save and manage multiple trips
- Add, update, and remove itinerary items

## Tech Stack

### Frontend
- React 19 with Vite
- Single-page application
- Communicates with backend via REST API

### Backend
- Node.js with Express 5
- MySQL database via mysql2/promise
- RESTful API design

### Database
- Google Cloud SQL (MySQL)
- Normalized schema with 8+ tables
- Stored procedures, triggers, and transactions

## Project Structure

```
CS 411/
├── smart-travel-planner-frontend/    # React frontend
│   ├── src/
│   │   ├── App.jsx                   # Main application component
│   │   └── styles.css                # Application styles
│   └── package.json
├── smart-travel-planner-backend/     # Express backend
│   ├── src/
│   │   ├── server.js                 # Entry point
│   │   ├── config/database.js        # MySQL connection pool
│   │   ├── routes/api.js             # Route definitions
│   │   └── controllers/
│   │       ├── userController.js     # User authentication
│   │       ├── tripController.js     # Trip queries (weather, flights, attractions)
│   │       ├── tripItineraryController.js  # Trip and itinerary CRUD
│   │       └── exploreController.js  # Explore analytics endpoints
│   └── package.json
└── SmartTravel/
    └── Queries/
        └── trip_itinerary_setup.sql  # Database schema, procedures, triggers
```

## Getting Started

### Prerequisites
- Node.js (v18+)
- Google Cloud SQL Proxy (for database access)
- Access to the Cloud SQL instance

### Database Setup

1. Start the Cloud SQL Proxy:
```bash
cd C:\Users\kevin\cloud-sql-proxy
.\cloud-sql-proxy.exe cs-411-team-128:us-central1:smart-travel-db
```
Wait for "Listening on 127.0.0.1:3306"

2. Run the database setup script (if needed):
```sql
source SmartTravel/Queries/trip_itinerary_setup.sql
```

### Backend

```bash
cd smart-travel-planner-backend
npm install
npm run dev
```
Server runs at http://localhost:3000

### Frontend

```bash
cd smart-travel-planner-frontend
npm install
npm run dev
```
Application runs at http://localhost:5173

## API Endpoints

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/userLogin` | Login or register user |

### Trip Planning
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trip-summary` | Get weather, flights, attractions for a trip |

### Trip Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trips` | Create trip with first itinerary item |
| GET | `/api/trips/user/:userId` | Get all trips for a user |
| GET | `/api/trips/:tripId` | Get trip with full itinerary |
| DELETE | `/api/trips/:tripId` | Delete a trip |

### Itinerary Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trips/:tripId/itinerary` | Add item to itinerary |
| PUT | `/api/trips/:tripId/itinerary/:itemId` | Update itinerary item |
| DELETE | `/api/trips/:tripId/itinerary/:itemId` | Remove itinerary item |

### Explore Destinations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/explore/sunny-cities` | Sunniest cities (7-day window) |
| GET | `/api/explore/cold-cities` | Cities colder than country average |
| GET | `/api/explore/cheap-flights-good-weather` | Cheap flights to good-weather destinations |
| GET | `/api/explore/monthly-route-avg` | Monthly route price trends |

## Database Design

### Tables
- **UserAccount** - User information
- **Location** - Cities with coordinates
- **WeatherDaily** - Daily weather forecasts
- **FlightOption** - Flight details and pricing
- **flight_origin / flight_destination** - Flight route mappings
- **Attraction** - Points of interest
- **AttractionPopularity** - Hourly busyness data
- **Trip** - User trips
- **ItineraryItem** - Items in a trip itinerary

### Stored Procedures
1. **CreateTripWithFirstItem** - Atomically creates a trip and adds the first attraction
2. **AddItineraryItem** - Adds an attraction to an existing trip with duplicate checking
3. **GetUserTripsWithStats** - Retrieves all trips for a user with item counts and categories

### Triggers
1. **after_itinerary_insert** - Increments trip item_count when an item is added
2. **after_itinerary_delete** - Decrements trip item_count when an item is removed

### Transactions
1. **createTripWithFirstItem** - Uses READ COMMITTED isolation for atomic trip creation
2. **getTripWithItinerary** - Uses REPEATABLE READ isolation for consistent trip/itinerary reads

## Sample Query

To test the application, try this query:

| Field | Value |
|-------|-------|
| Origin | Shangrao |
| Destination | Tokyo |
| Start Date | 2025-10-20 |
| End Date | 2025-10-26 |
| Max Flight Price | 500 |

This returns weather data, flight options, and attractions with busyness indicators.

## Data Sources

- Weather data: OpenWeatherMap API
- Flight data: OpenFlights dataset
- Attractions: Curated dataset with popularity metrics

## Authors

CS 411 Group 128
