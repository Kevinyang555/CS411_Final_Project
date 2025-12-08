# 🎯 Smart Travel Planner - DEMO GUIDE
## CS 411 Group 128 - Professor Demonstration

---

## ⚡ QUICK START (5 Minutes Before Demo)

### Step 1: Start Cloud SQL Proxy
Open **Terminal 1** (PowerShell):
```powershell
cd C:\Users\kevin\cloud-sql-proxy
.\cloud-sql-proxy.exe cs-411-team-128:us-central1:smart-travel-db
```
✅ Wait for: `Listening on 127.0.0.1:3306`
**KEEP THIS TERMINAL OPEN!**

---

### Step 2: Start Backend Server
Open **Terminal 2** (PowerShell):
```powershell
cd "C:\Users\kevin\CS 411\smart-travel-planner-backend"
npm run dev
```
✅ Wait for:
```
✅ Database connection successful!
🚀 Smart Travel Planner Backend Server
   Server running at: http://localhost:3000
```
**KEEP THIS TERMINAL OPEN!**

---

### Step 3: Start Frontend
Open **Terminal 3** (PowerShell):
```powershell
cd "C:\Users\kevin\CS 411\smart-travel-planner-frontend"
npm run dev
```
✅ Wait for: `Local: http://localhost:5173/`
**KEEP THIS TERMINAL OPEN!**

---

### Step 4: Open Browser
Open Chrome/Firefox and go to:
```
http://localhost:5173
```

---

## 🎬 DEMO SCRIPT

### Part 1: Sign In (30 seconds)
1. Enter any name: **"Demo User"**
2. Enter any email: **"demo@cs411.com"**
3. Click **"Continue"**

---

### Part 2: Main Trip Planning Demo (2 minutes)

**USE THIS QUERY (guaranteed to have all data + busyness index):**

| Field | Value |
|-------|-------|
| **Origin city** | Shangrao |
| **Destination city** | Tokyo |
| **Start date** | 2025-10-20 |
| **End date** | 2025-10-26 |
| **Budget** | 1000 |
| **Currency** | USD |
| **Temperature range** | 60 to 80 °F |
| **Crowd preference** | Less crowded |
| **Max flight price** | 500 |

Click **"Get trip snapshot"**

---

### What the Professor Will See:

✅ **Trip Summary Header**
- Location: Tokyo, Japan
- Average high/low temperatures
- Average precipitation
- Best time to visit recommendation

✅ **Weather Snapshot Table**
- 7 days of daily forecasts (Oct 20-26, 2025)
- Min/Max temperatures in Fahrenheit
- Precipitation in mm
- Weather conditions

✅ **Flight Options Table**
- 1 flight from Shangrao to Tokyo
- Carrier code: AC330
- Price: $190.13 USD
- Departure and arrival times
- **Sorted by price** (cheapest first)

✅ **Attractions & Crowdedness** ⭐ NEW FEATURE!
- 10 attractions in Tokyo
- Categories (observation_deck, tourist_attraction, garden, etc.)
- Ratings (3.8 - 4.5 stars)
- **Busyness Index (0-100)** showing crowd levels
  - Tokyo Skytree: 48/100 (moderate crowds)
  - Momiji Waterfall: 47/100 (moderate crowds)
  - Tokyo Tower: 43/100 (less crowded)
- "Add to itinerary" buttons

---

### Part 3: Explain the Architecture (1 minute)

**Open Terminal 2 (Backend)** and show the logs:
```
📍 Trip query: Shangrao → Tokyo (2025-10-20 to 2025-10-26)
   Origin: Shangrao, China (ID: 82)
   Destination: Tokyo, Japan (ID: 1)
✅ Successfully retrieved trip data for Tokyo
   Weather: 7 days
   Flights: 1 option
   Attractions: 10 places
```

**Explain the data flow:**
```
[React Frontend] → [Express Backend] → [Cloud SQL Database]
  Port 5173           Port 3000          Google Cloud
```

1. **Frontend (React + Vite)**
   - User enters trip details
   - Converts °F to °C
   - Sends POST request to backend

2. **Backend (Node.js + Express)**
   - Receives request at `/api/trip-summary`
   - Queries Cloud SQL database:
     - Finds location IDs
     - Gets weather data (7 days)
     - Searches flights
     - Retrieves attractions with busyness index
   - Formats and returns JSON

3. **Database (Cloud SQL - MySQL)**
   - 500 locations worldwide
   - 3,500 weather records
   - 1,824 flights
   - Attractions with categories and ratings
   - Busyness data (360 hourly records for 15 attractions)

---

## 🎓 KEY FEATURES TO HIGHLIGHT

### 1. **Data Integration**
"We integrated multiple datasets into a single query:
- Weather API data (OpenWeatherMap)
- Flight data (OpenFlights dataset)
- Attractions data
   - All stored in normalized relational database"

### 2. **Advanced SQL Queries**
"Our backend uses complex JOINs across 8 tables:
- Location (origin/destination)
- WeatherDaily (7-day forecast)
- FlightOption + flight_origin + flight_destination
- Attraction + AttractionPopularity (with LEFT JOIN)
- Aggregations for weather summaries AND busyness averages"

### 3. **Temperature Conversion**
"Frontend accepts Fahrenheit (user-friendly in US)
Backend stores Celsius (international standard)
Automatic conversion in both directions"

### 4. **Filtering & Sorting**
"Users can filter flights by max price
Results sorted by price (cheapest first)
Weather filtered by date range"

### 5. **Explore Destinations (pre-built analytics)**
- **Sunniest cities this week:** GET `/api/explore/sunny-cities?startDate=2025-10-20&limit=10`
- **Colder cities than country average:** GET `/api/explore/cold-cities?startDate=2025-10-20&minDelta=2&limit=10`
- **Cheapest flights to good-weather places:** GET `/api/explore/cheap-flights-good-weather?minTemp=15&maxTemp=28&maxPrecip=3&maxPrice=1000&limit=15` (date-agnostic)
- **Monthly route price trends:** GET `/api/explore/monthly-route-avg?month=2025-10&limit=20`
- Frontend Explore tab has inputs for start date (7-day window) and month; click each card to load results.

---

## 🔧 TROUBLESHOOTING

### If Cloud SQL Proxy fails:
```powershell
# Re-authenticate
gcloud auth application-default login
# Then restart proxy
```

### If backend can't connect:
```powershell
# Check if proxy is running
netstat -an | findstr "3306"
# Should show: 127.0.0.1:3306
```

### If frontend shows error:
1. Check browser console (F12)
2. Verify backend is running at http://localhost:3000/health
3. Check CORS is enabled in backend

---

## 📊 BACKUP DEMO QUERIES (If Needed)

### Query 2: Kano → Tokyo (with busyness data)
- **Origin:** Kano
- **Destination:** Tokyo
- **Dates:** 2025-10-20 to 2025-10-26
- **Has:** 1 flight ($454.87), 7 days weather, 10 attractions with busyness

### Query 3: Medellin → Jakarta (with busyness data)
- **Origin:** Medellín
- **Destination:** Jakarta
- **Dates:** 2025-10-20 to 2025-10-26
- **Has:** 1 flight ($351.69), 7 days weather, 10 attractions with busyness

### Query 4: Seoul → Bengbu (NO busyness data - fallback)
- **Origin:** Seoul
- **Destination:** Bengbu
- **Dates:** 2025-10-20 to 2025-10-26
- **Has:** 2 flights, 7 days weather, 10 attractions (no busyness index)

---

## ✅ PRE-DEMO CHECKLIST

**Night Before:**
- [ ] All terminals close properly
- [ ] Cloud SQL Proxy installed at: `C:\Users\kevin\cloud-sql-proxy\`
- [ ] Authenticated with: `gcloud auth application-default login`

**Morning of Demo:**
- [ ] Start Cloud SQL Proxy (Terminal 1)
- [ ] Start Backend (Terminal 2)
- [ ] Start Frontend (Terminal 3)
- [ ] Test with Shangrao → Tokyo query
- [ ] Verify all data appears correctly (especially busyness index!)

**During Demo:**
- [ ] Show working application first
- [ ] Then explain architecture
- [ ] Show backend logs
- [ ] Mention future enhancements (user auth, more APIs)

---

## 🚀 TALKING POINTS

1. **Problem Solved:**
   "Traditional trip planning requires checking multiple websites.
   Our app consolidates weather, flights, and attractions in one place."

2. **Technical Achievement:**
   "We built a full-stack application with React frontend,
   Node.js backend, and Google Cloud SQL database.
   All three components communicate in real-time."

3. **Database Design:**
   "We normalized our schema to BCNF.
   Used proper foreign keys, indexes for performance.
   500 locations, 3,500+ weather records, 1,800+ flights."

4. **Advanced Features:**
   "Temperature unit conversion, price filtering,
   date range queries, aggregated weather summaries,
   sorted results, JOIN queries across 7 tables."

---

## 📞 EMERGENCY CONTACTS

If something breaks during demo:
- Database: Already has data, won't change
- Backend: Can restart quickly (30 seconds)
- Frontend: Pure React, can refresh browser

**Good luck with your demo! 🎉**
