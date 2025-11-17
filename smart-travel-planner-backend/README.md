# Smart Travel Planner - Backend API

Backend server for the Smart Travel Planner application (CS 411 Group 128).

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MySQL2** - Database client
- **Cloud SQL** - Google Cloud managed MySQL database

## Project Structure

```
src/
├── config/
│   └── database.js          # Database connection pool
├── controllers/
│   └── tripController.js    # Business logic for trip planning
├── routes/
│   └── api.js               # API route definitions
└── server.js                # Main entry point
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
The `.env` file is already configured with your database credentials.

### 3. Start Cloud SQL Proxy
**IMPORTANT**: The backend needs Cloud SQL Proxy running to connect to your database.

Download Cloud SQL Proxy:
- Windows: https://cloud.google.com/sql/docs/mysql/sql-proxy#install
- Or use: `gcloud sql auth-proxy`

Run the proxy:
```bash
cloud-sql-proxy cs-411-team-128:us-central1:smart-travel-db
```

This will create a local connection at `127.0.0.1:3306`.

### 4. Start Development Server
```bash
npm run dev
```

Server will start at: `http://localhost:3000`

## API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Trip Summary
```
POST /api/trip-summary
```

Request body:
```json
{
  "origin": "Chicago",
  "destination": "Barcelona",
  "startDate": "2025-01-01",
  "endDate": "2025-01-07",
  "budget": 1200,
  "currency": "USD",
  "tempMin": 15.6,
  "tempMax": 32.2,
  "crowdPreference": "less",
  "maxFlightPrice": 400
}
```

Response: Trip summary with weather, flights, and attractions.

## Database Tables Used

- **Location** (500 cities)
- **WeatherDaily** (3500 weather records)
- **FlightOption** (1824 flights)
- **flight_origin** / **flight_destination**
- **Attraction**
- **AttractionPopularity** (future)

## Development

- `npm start` - Production mode
- `npm run dev` - Development mode with auto-restart
