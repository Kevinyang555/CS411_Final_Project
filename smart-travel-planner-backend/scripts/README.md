# Database Testing & Demo Scripts

This folder contains utility scripts for testing database queries, finding demo data, and debugging the Smart Travel Planner backend.

## Running Scripts

All scripts should be run from the **backend root directory**:

```bash
cd C:\Users\kevin\CS 411\smart-travel-planner-backend
node scripts/<script-name>.js
```

**Requirements:**
- Cloud SQL Proxy must be running
- Backend `.env` file must be configured

---

## 📄 Script Descriptions

### `find-demo-data.js`
**Purpose:** Find the best city combinations for demo presentations

**What it does:**
- Queries database for cities with most weather data
- Finds available flight routes
- Identifies cities with attractions
- Recommends complete trip combinations

**Use case:** Finding demo queries before Seoul → Bengbu was chosen

**Output:**
```
📊 Cities with weather data:
  Bengbu, China: 7 records (2025-10-20 to 2025-10-26)

✈️  Available flight routes:
  Seoul → Bengbu: 2 flights (from $178.89)

🎯 RECOMMENDED DEMO QUERIES:
  1. Seoul → Bengbu, China
     ✈️  Flights: 2
     🌤️  Weather: 7 days
     🎭 Attractions: 10
```

---

### `check-popularity-table.js`
**Purpose:** Verify AttractionPopularity table structure and data

**What it does:**
- Checks if AttractionPopularity table exists
- Shows table schema (columns, types)
- Displays sample data
- Checks which Bengbu attractions have busyness data

**Use case:** Debugging busyness index feature before integration

**Output:**
```
✅ AttractionPopularity table exists!

Table structure:
  pop_id         | int      | PRIMARY KEY
  attraction_id  | bigint   | FOREIGN KEY
  on_date        | date
  hour           | tinyint  (0-23)
  busyness_index | tinyint  (0-100)

Sample data (first 10 rows):
  attraction_id: 1 (Tokyo Tower)
  on_date: 2025-04-01
  hour: 0
  busyness_index: 11
```

---

### `check-which-attractions-have-data.js`
**Purpose:** List all attractions that have busyness data

**What it does:**
- Finds attractions with at least one busyness record
- Calculates average busyness for each attraction
- Shows date range of available data
- Counts total data points per attraction

**Use case:** Identifying which attractions can demonstrate the busyness feature

**Output:**
```
Found 15 attractions with busyness data:

  Attraction ID 1: Tokyo Tower
    Category: observation_deck
    Data points: 24 (1 day of hourly data)
    Date range: 2025-04-01 to 2025-04-01
    Average busyness: 43.4

  Attraction ID 2: Tokyo Skytree
    Category: observation_deck
    Data points: 24
    Average busyness: 48.3

Total attractions with busyness data: 15
```

---

### `find-demo-with-busyness.js`
**Purpose:** Find demo queries that include busyness data

**What it does:**
- Identifies cities with attractions that have busyness data
- Finds flight routes TO those cities
- Ensures weather data is available
- Ranks results by completeness (flights + weather + busyness)

**Use case:** Finding Shangrao → Tokyo demo query after busyness feature was added

**Output:**
```
📍 Cities with attractions that have busyness data:

Tokyo, Japan (ID: 1)
  Attractions with busyness: 10
  Names: Tokyo Tower, Tokyo Skytree, Senso-ji, ...

Jakarta, Indonesia (ID: 2)
  Attractions with busyness: 5

🎯 RECOMMENDED DEMO QUERIES (with busyness data):

1. Shangrao → Tokyo, Japan
   ✈️  Flights: 1 (from $190.13)
   🌤️  Weather: 7 days (2025-10-20 to 2025-10-26)
   🎭 Attractions: 10
   📊 Busyness data: 240 data points

2. Kano → Tokyo, Japan
   ✈️  Flights: 1 (from $454.87)
   📊 Busyness data: 240 data points
```

---

### `test-shangrao-tokyo.js`
**Purpose:** Test the complete trip query for Shangrao → Tokyo demo

**What it does:**
- Executes the exact SQL queries used by the backend
- Shows step-by-step data retrieval:
  1. Location lookup (Shangrao ID: 82, Tokyo ID: 1)
  2. Attractions with busyness index
  3. Flight search
- Displays formatted results matching what frontend will receive

**Use case:** Verifying demo query works before presenting to professor

**Output:**
```
🧪 Testing Shangrao → Tokyo query with busyness data

Origin: Shangrao, China (ID: 82)
Destination: Tokyo, Japan (ID: 1)

🎭 Testing attractions with busyness index:

Found 10 attractions in Tokyo:

1. Tokyo Tower
   Category: observation_deck
   Rating: 4.5
   Busyness Index: 43/100
   Data Points: 24 (1 days of hourly data)

2. Tokyo Skytree
   Rating: 4.4
   Busyness Index: 48/100

✈️  Testing flight query:

Found 1 flight(s):
  AC330: $190.13 USD

✅ DEMO QUERY READY!
```

---

### `trace-seoul-bengbu.js`
**Purpose:** Trace the complete execution flow for Seoul → Bengbu query

**What it does:**
- Shows every SQL query executed by the backend
- Displays results at each step
- Demonstrates the data pipeline from user input to final response
- Includes temperature conversion examples

**Use case:** Educational - explaining the complete data flow to professor

**Output:**
```
🔍 TRACING: Seoul → Bengbu Query Execution

======================================================================
USER INPUT:
  Origin: Seoul
  Destination: Bengbu
  Start Date: 2025-10-20
  End Date: 2025-10-26
  Budget: 1000 USD
  Temp Range: 60-80°F (15.6-26.7°C)
======================================================================

📍 STEP 1: Looking up location IDs...

SQL Query for Origin:
  SELECT location_id, name, country, lat, lon
  FROM Location
  WHERE name LIKE "%Seoul%"
  LIMIT 1

Result:
  location_id: 9
  name: 'Seoul'
  country: 'Korea, South'

[... continues through all 5 steps ...]

✅ COMPLETE! This JSON response is sent back to the React frontend.
```

---

## 🎯 Common Workflows

### Before Demo Presentation
```bash
# 1. Find the best demo query
node scripts/find-demo-with-busyness.js

# 2. Test the chosen query
node scripts/test-shangrao-tokyo.js

# 3. Trace the full execution (for explaining to professor)
node scripts/trace-seoul-bengbu.js
```

### Debugging Busyness Feature
```bash
# 1. Check if table exists
node scripts/check-popularity-table.js

# 2. See which attractions have data
node scripts/check-which-attractions-have-data.js

# 3. Find cities with busyness data
node scripts/find-demo-with-busyness.js
```

### Finding New Demo Data
```bash
# 1. Find all possible combinations
node scripts/find-demo-data.js

# 2. Filter to only those with busyness
node scripts/find-demo-with-busyness.js
```

---

## 📊 Database Tables Queried

These scripts interact with the following tables:

1. **Location** - City information (500 cities)
2. **WeatherDaily** - Weather forecasts (3,500 records)
3. **FlightOption** - Flight details (1,824 flights)
4. **flight_origin** - Junction table for flight origins
5. **flight_destination** - Junction table for flight destinations
6. **Attraction** - Tourist attractions
7. **AttractionPopularity** - Hourly busyness data (360 records for 15 attractions)

---

## 🔧 Troubleshooting

**Error: "Database connection failed"**
- Ensure Cloud SQL Proxy is running: `.\cloud-sql-proxy.exe cs-411-team-128:us-central1:smart-travel-db`
- Check `.env` file has correct credentials

**Error: "Cannot find module './src/config/database.js'"**
- Run script from backend root directory, not from scripts folder
- Use: `node scripts/<script-name>.js`

**No results returned**
- Database might not have data for that city combination
- Try using recommended demo queries from `find-demo-with-busyness.js`

---

## 📝 Notes

- All scripts use the same database connection pool as the backend
- Scripts automatically close database connection when complete
- Safe to run scripts while backend server is running
- Scripts do NOT modify data (read-only queries)
