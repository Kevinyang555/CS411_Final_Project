# 🔍 Seoul → Bengbu: Complete Data Flow Explanation

## What Happens When You Submit This Query

### **User Action:**
```
Origin: Seoul
Destination: Bengbu
Start Date: 2025-10-20
End Date: 2025-10-26
Budget: 1000 USD
Temperature: 60-80°F
Max Flight Price: 500 USD
```

---

## 📊 Complete Execution Flow

### **STEP 1: Frontend Converts Temperature**
**File:** `smart-travel-planner-frontend/src/App.jsx:287-300`

The frontend converts Fahrenheit to Celsius before sending to backend:
```javascript
const tempMin = form.tempMin ? (parseFloat(form.tempMin) - 32) * (5 / 9) : null;
const tempMax = form.tempMax ? (parseFloat(form.tempMax) - 32) * (5 / 9) : null;
```

**Result:**
- 60°F → 15.6°C
- 80°F → 26.7°C

---

### **STEP 2: Frontend Sends POST Request**
**File:** `smart-travel-planner-frontend/src/App.jsx:301-321`

```javascript
const response = await fetch("http://localhost:3000/api/trip-summary", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    origin: "Seoul",
    destination: "Bengbu",
    startDate: "2025-10-20",
    endDate: "2025-10-26",
    budget: 1000,
    currency: "USD",
    tempMin: 15.6,
    tempMax: 26.7,
    crowdPreference: "less",
    maxFlightPrice: 500
  })
});
```

**HTTP Request:**
```
POST http://localhost:3000/api/trip-summary
Content-Type: application/json

{ origin: "Seoul", destination: "Bengbu", ... }
```

---

### **STEP 3: Backend Receives Request**
**File:** `smart-travel-planner-backend/src/server.js:24-27`

Express server logs the request:
```
2025-11-17T02:29:40.778Z - POST /api/trip-summary
```

Routes to: `src/routes/api.js:6` → `getTripSummary()` controller

---

### **STEP 4: Database Query #1 - Find Seoul's Location ID**
**File:** `smart-travel-planner-backend/src/controllers/tripController.js:50-53`

```sql
SELECT location_id, name, country, lat, lon
FROM Location
WHERE name LIKE '%Seoul%'
LIMIT 1
```

**Result:**
```javascript
{
  location_id: 9,
  name: 'Seoul',
  country: 'Korea, South',
  lat: '37.566700',
  lon: '126.983300'
}
```

---

### **STEP 5: Database Query #2 - Find Bengbu's Location ID**
**File:** `smart-travel-planner-backend/src/controllers/tripController.js:55-58`

```sql
SELECT location_id, name, country, lat, lon
FROM Location
WHERE name LIKE '%Bengbu%'
LIMIT 1
```

**Result:**
```javascript
{
  location_id: 244,
  name: 'Bengbu',
  country: 'China',
  lat: '32.917000',
  lon: '117.389000'
}
```

---

### **STEP 6: Database Query #3 - Get 7 Days of Weather**
**File:** `smart-travel-planner-backend/src/controllers/tripController.js:76-88`

```sql
SELECT on_date, min_temp_c, max_temp_c, precip_mm, conditions
FROM WeatherDaily
WHERE location_id = 244
  AND on_date BETWEEN '2025-10-20' AND '2025-10-26'
ORDER BY on_date
```

**Result (7 rows):**
```
2025-10-20: 7.0°C - 11.6°C, 5.60mm, Unknown
2025-10-21: 7.3°C - 12.4°C, 0.10mm, Light drizzle
2025-10-22: 7.6°C - 15.9°C, 0.00mm, Cloudy
2025-10-23: 8.1°C - 16.8°C, 0.00mm, Clear
2025-10-24: 10.4°C - 17.7°C, 0.20mm, Light drizzle
2025-10-25: 11.1°C - 14.8°C, 5.80mm, Light rain
2025-10-26: 8.6°C - 17.0°C, 0.00mm, Cloudy
```

**Backend calculates averages:**
- Average High: 15.2°C (59.3°F)
- Average Low: 8.7°C (47.7°F)
- Average Precipitation: 1.7mm

---

### **STEP 7: Database Query #4 - Find Flights (Complex JOIN)**
**File:** `smart-travel-planner-backend/src/controllers/tripController.js:104-133`

```sql
SELECT
  f.flight_id, f.carrier_code, f.flight_number,
  f.price, f.currency, f.depart_time, f.arrive_time,
  l1.name AS origin_city,
  l2.name AS destination_city
FROM FlightOption f
JOIN flight_origin fo ON f.flight_id = fo.flight_id
JOIN flight_destination fd ON f.flight_id = fd.flight_id
JOIN Location l1 ON fo.location_id = l1.location_id
JOIN Location l2 ON fd.location_id = l2.location_id
WHERE fo.location_id = 9    -- Seoul
  AND fd.location_id = 244  -- Bengbu
  AND f.price <= 500        -- Max price filter
ORDER BY f.price ASC        -- Cheapest first
LIMIT 15
```

**Result (2 flights):**
```javascript
[
  {
    flightId: 'xxx',
    carrierCode: 'AC',
    flightNumber: '330',
    price: 178.89,
    currency: 'USD',
    departTime: '2025-01-01 09:47:00',
    arriveTime: '2025-01-01 21:47:00'
  },
  {
    flightId: 'yyy',
    carrierCode: 'MO',
    flightNumber: '502',
    price: 195.64,
    currency: 'USD',
    departTime: '2025-01-15 14:00:00',
    arriveTime: '2025-01-15 18:00:00'
  }
]
```

---

### **STEP 8: Database Query #5 - Get Attractions**
**File:** `smart-travel-planner-backend/src/controllers/tripController.js:149-161`

```sql
SELECT attraction_id AS id, name, category, rating, lat, lon
FROM Attraction
WHERE location_id = 244  -- Bengbu
LIMIT 20
```

**Result (10 attractions):**
```javascript
[
  { id: 1, name: 'Gaixiagu Zhanchang', category: 'tourist_attraction', rating: 5.0 },
  { id: 2, name: 'Bengbu Museum', category: 'museum', rating: 5.0 },
  { id: 3, name: 'Zhu Yuan', category: 'tourist_attraction', rating: 4.0 },
  { id: 4, name: 'Long Zi Hu', category: 'tourist_attraction', rating: 0.0 },
  { id: 5, name: 'Green Tianyuan', category: 'tourist_attraction', rating: 0.0 },
  // ... 5 more attractions
]
```

---

### **STEP 9: Backend Builds JSON Response**
**File:** `smart-travel-planner-backend/src/controllers/tripController.js:179-196`

```javascript
{
  location: {
    name: "Bengbu",
    country: "China"
  },
  weatherSummary: {
    avgHigh: 15.2,      // °C
    avgLow: 8.7,        // °C
    avgPrecip: 1.7,     // mm
    conditionsSummary: "Mixed weather conditions"
  },
  weatherDaily: [
    { date: "2025-10-20", min: 7.0, max: 11.6, precip: 5.6, conditions: "Unknown" },
    // ... 6 more days
  ],
  flights: [
    { flightId: 'xxx', carrierCode: 'AC', flightNumber: '330', price: 178.89, ... },
    { flightId: 'yyy', carrierCode: 'MO', flightNumber: '502', price: 195.64, ... }
  ],
  attractions: [
    { id: 1, name: 'Gaixiagu Zhanchang', category: 'tourist_attraction', rating: 5.0, ... },
    // ... 9 more attractions
  ],
  bestTimeToVisit: {
    label: "Based on weather data",
    explanation: "Mixed weather conditions"
  }
}
```

**Backend logs:**
```
✅ Successfully retrieved trip data for Bengbu
   Weather: 7 days
   Flights: 2 options
   Attractions: 10 places
```

---

### **STEP 10: Frontend Receives and Displays Data**
**File:** `smart-travel-planner-frontend/src/App.jsx:301-321`

```javascript
const data = await response.json();
setSummary(data);         // Store in React state
setItinerary([]);         // Clear previous itinerary
```

Frontend renders:
1. **Trip Summary Header** - Shows Bengbu, China with weather averages
2. **Weather Table** - 7 rows for Oct 20-26 (converts °C back to °F for display)
3. **Flight Table** - 2 flights sorted by price
4. **Attractions Grid** - 10 attractions with "Add to itinerary" buttons

---

## ✅ Does "Add to Itinerary" Work?

### **YES, but it's client-side only (not saved to database)**

**File:** `smart-travel-planner-frontend/src/App.jsx:324-341`

```javascript
function handleAddToItinerary(attraction) {
  setItinerary((prev) => {
    // Check if already added (prevent duplicates)
    if (prev.some((item) => item.attraction.id === attraction.id)) {
      return prev;  // Already in itinerary, don't add again
    }

    // Add new itinerary item
    return [
      ...prev,
      {
        id: `${attraction.id}-${prev.length + 1}`,
        attraction: attraction,           // Full attraction object
        visitDate: form.startDate,        // Defaults to trip start date
        startTime: "10:00",               // Default visit time
        endTime: "12:00",                 // Default end time
        notes: "",                        // Empty notes
      },
    ];
  });
}
```

### **What Happens When You Click "Add to itinerary":**

1. **User clicks** "Add to itinerary" on "Bengbu Museum"
2. **React calls** `handleAddToItinerary(attraction)`
3. **Checks for duplicate** - If already added, ignores the click
4. **Adds to state** - Creates new itinerary item with:
   - `id`: `"2-1"` (attraction ID + position)
   - `attraction`: Full museum object (name, category, rating, lat/lon)
   - `visitDate`: `"2025-10-20"` (your start date)
   - `startTime`: `"10:00"` (default)
   - `endTime`: `"12:00"` (default)
   - `notes`: `""` (empty)
5. **UI updates** - "Itinerary" tab now shows 1 item

### **Additional Itinerary Features:**

**Update visit details:**
```javascript
function updateItineraryItem(id, field, value) {
  setItinerary((prev) =>
    prev.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    )
  );
}
```

**Remove from itinerary:**
```javascript
function removeItineraryItem(id) {
  setItinerary((prev) => prev.filter((item) => item.id !== id));
}
```

---

## ⚠️ Important Limitations

### **1. No Database Persistence**
- Itinerary is stored in **React state only**
- Refreshing the page **loses all itinerary data**
- No API calls to save itinerary to backend

### **2. No User Authentication**
- Frontend accepts any name/email
- No backend validation
- Itinerary is not tied to a user account

### **3. Future Enhancement Needed**
To persist itinerary, you would need:

**Backend:**
```sql
CREATE TABLE Itinerary (
  itinerary_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  trip_id INT,
  attraction_id INT,
  visit_date DATE,
  start_time TIME,
  end_time TIME,
  notes TEXT
);
```

**API Endpoint:**
```javascript
POST /api/itinerary
{
  userId: 123,
  attractionId: 2,
  visitDate: "2025-10-20",
  startTime: "10:00",
  endTime: "12:00",
  notes: "Visit the museum"
}
```

---

## 📊 Database Tables Involved

| Table | Rows Queried | Purpose |
|-------|--------------|---------|
| **Location** | 2 | Find Seoul (ID: 9) and Bengbu (ID: 244) |
| **WeatherDaily** | 7 | Get weather for Oct 20-26 in Bengbu |
| **FlightOption** | 2 | Find flights under $500 |
| **flight_origin** | 2 | Link flights to Seoul (origin) |
| **flight_destination** | 2 | Link flights to Bengbu (destination) |
| **Attraction** | 10 | Get attractions in Bengbu |

**Total Database Queries:** 5 queries (1 for origin, 1 for destination, 1 for weather, 1 for flights, 1 for attractions)

---

## 🚀 Summary for Demo

When demonstrating Seoul → Bengbu to your professor, you can explain:

1. **"User enters trip details in React frontend"**
2. **"Frontend converts Fahrenheit to Celsius and sends POST request to backend"**
3. **"Backend queries Cloud SQL database 5 times:"**
   - Location lookup for Seoul and Bengbu
   - Weather data for 7 days
   - Flight search with JOIN across 5 tables
   - Attraction search
4. **"Backend calculates weather averages and builds JSON response"**
5. **"Frontend receives data and displays it in organized tabs"**
6. **"User can add attractions to itinerary (stored in browser memory)"**

**Key Technical Achievement:**
- Full-stack data flow from user input → database query → formatted response
- Complex SQL JOINs across 7 tables
- Temperature unit conversion (bidirectional)
- Price filtering and sorting
- Real-time data aggregation

---

## ✅ Ready for Demo!

Your Seoul → Bengbu query is the **perfect demo** because it has:
- ✅ Complete weather data (7 days)
- ✅ Multiple flight options (2 flights under $500)
- ✅ Good attractions (10 places with ratings)
- ✅ Demonstrates all features working together
