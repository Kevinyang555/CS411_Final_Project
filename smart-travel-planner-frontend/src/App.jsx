import React, { useState, useEffect } from "react";

function cToF(c) {
  return (c * 9) / 5 + 32;
}

function fToC(f) {
  return ((f - 32) * 5) / 9;
}

// --------- Fake API fallback helpers (replace with real fetch calls later) ---------

function mockTripSummary(payload) {
  const today = new Date();
  const formatDate = (d) => d.toISOString().slice(0, 10);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: formatDate(d),
      min: 12 + i,
      max: 20 + i,
      precip: i === 2 || i === 5 ? 4.8 : 0.4,
      conditions: i === 2 ? "Rain" : "Clear",
    });
  }

  return {
    location: { name: payload.destination, country: "Exampleland" },
    weatherSummary: {
      avgHigh: 22.4,
      avgLow: 14.3,
      avgPrecip: 1.2,
      conditionsSummary: "Mostly clear with light showers mid-week",
    },
    weatherDaily: days,
    flights: [
      {
        flightId: 1,
        carrierCode: "ST",
        flightNumber: "411",
        price: 325.5,
        currency: "USD",
        departTime: `${payload.startDate}T09:15`,
        arriveTime: `${payload.startDate}T13:45`,
        originCity: payload.origin,
        destinationCity: payload.destination,
      },
      {
        flightId: 2,
        carrierCode: "CS",
        flightNumber: "128",
        price: 289.99,
        currency: "USD",
        departTime: `${payload.startDate}T17:30`,
        arriveTime: `${payload.startDate}T22:05`,
        originCity: payload.origin,
        destinationCity: payload.destination,
      },
    ],
    attractions: [
      {
        id: 1,
        name: "Old Town Square",
        category: "Scenic",
        rating: 4.7,
        priceLevel: 1,
        busynessIndex: 40,
      },
      {
        id: 2,
        name: "Riverfront Museum",
        category: "Cultural",
        rating: 4.5,
        priceLevel: 2,
        busynessIndex: 65,
      },
      {
        id: 3,
        name: "Night Market Street",
        category: "Food",
        rating: 4.6,
        priceLevel: 1,
        busynessIndex: 80,
      },
    ],
    bestTimeToVisit: {
      label: "Mid-week (Tue–Thu)",
      explanation:
        "Balanced crowds, mild temperatures, and cheaper weekday flights.",
    },
  };
}

function safeFetchJSON(url, options, fallback) {
  return fetch(url, options)
    .then((res) => {
      if (!res.ok) throw new Error("HTTP error");
      return res.json();
    })
    .catch(() => fallback);
}

// ------------------------------- Main App -------------------------------

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("planner");

  if (!user) {
    return <SignInPage onSignIn={setUser} />;
  }

  return (
    <div className="app">
      <Sidebar user={user} activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main">
        <Header user={user} />
        <div className="main-content">
          {activeTab === "planner" && <TripPlanner />}
          {activeTab === "trips" && <TripsPlaceholder />}
          {activeTab === "explore" && <Explore />}
          {activeTab === "about" && <About />}
        </div>
      </main>
    </div>
  );
}

// ---------------------------- Auth / Layout ----------------------------

function SignInPage({ onSignIn }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!fullName || !email) return;
    onSignIn({ fullName, email });
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="logo">Smart Travel Planner</h1>
        <p className="muted">
          Sign in to start planning weather-aware, crowd-aware trips.
        </p>
        <form onSubmit={handleSubmit} className="form">
          <label className="field">
            <span>Full name</span>
            <input
              type="text"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alex Traveler"
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <button type="submit" className="btn btn-primary">
            Continue
          </button>
        </form>
        <p className="tiny muted">
        </p>
      </div>
    </div>
  );
}

function Sidebar({ user, activeTab, onTabChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">STP</div>
        <div>
          <div className="sidebar-title">Smart Travel Planner</div>
          <div className="sidebar-subtitle">CS 411 Group 128</div>
        </div>
      </div>
      <nav className="nav">
        <NavItem
          label="Plan a Trip"
          tab="planner"
          active={activeTab === "planner"}
          onClick={onTabChange}
        />
        <NavItem
          label="My Trips"
          tab="trips"
          active={activeTab === "trips"}
          onClick={onTabChange}
        />
        <NavItem
          label="Explore Destinations"
          tab="explore"
          active={activeTab === "explore"}
          onClick={onTabChange}
        />
        <NavItem
          label="About / How it works"
          tab="about"
          active={activeTab === "about"}
          onClick={onTabChange}
        />
      </nav>
      <div className="sidebar-footer">
        <div className="avatar">{user.fullName[0]?.toUpperCase()}</div>
        <div className="user-meta">
          <div className="user-name">{user.fullName}</div>
          <div className="user-email">{user.email}</div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ label, tab, active, onClick }) {
  return (
    <button
      className={`nav-item ${active ? "nav-item-active" : ""}`}
      onClick={() => onClick(tab)}
    >
      {label}
    </button>
  );
}

function Header({ user }) {
  return (
    <header className="header">
      <div>
        <h2>Welcome back, {user.fullName.split(" ")[0]} 👋</h2>
        <p className="muted">
          Plan smarter trips with integrated weather, crowds, and flights.
        </p>
      </div>
    </header>
  );
}

// ---------------------------- Trip Planner ----------------------------

function TripPlanner() {
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    startDate: "",
    endDate: "",
    budget: "",
    currency: "USD",
    tempMin: 60,
    tempMax: 90,
    crowdPreference: "less",
    maxFlightPrice: "",
  });
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [itinerary, setItinerary] = useState([]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.origin || !form.destination || !form.startDate || !form.endDate) {
      setError("Please fill in origin, destination, and dates.");
      return;
    }
    setLoading(true);
    const payload = {
      origin: form.origin,
      destination: form.destination,
      startDate: form.startDate,
      endDate: form.endDate,
      budget: form.budget ? Number(form.budget) : null,
      currency: form.currency,
      tempMin: fToC(Number(form.tempMin)), // user input in °F → send °C
      tempMax: fToC(Number(form.tempMax)), // user input in °F → send °C
      crowdPreference: form.crowdPreference,
      maxFlightPrice: form.maxFlightPrice
        ? Number(form.maxFlightPrice)
        : null,
    };

    try {
      // Call real backend API
      const response = await fetch("http://localhost:3000/api/trip-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSummary(data);
      setItinerary([]);
    } catch (err) {
      setError(`Unable to load trip summary: ${err.message}`);
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleAddToItinerary(attraction) {
    setItinerary((prev) => {
      if (prev.some((item) => item.attraction.id === attraction.id)) {
        return prev;
      }
      return [
        ...prev,
        {
          id: `${attraction.id}-${prev.length + 1}`,
          attraction,
          visitDate: form.startDate,
          startTime: "10:00",
          endTime: "12:00",
          notes: "",
        },
      ];
    });
  }

  function updateItineraryItem(id, field, value) {
    setItinerary((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  function removeItineraryItem(id) {
    setItinerary((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="page">
      <section className="section">
        <div className="section-header">
          <h3>Plan a Trip</h3>
          <p className="muted">
            Enter your destination, dates, and budget to see weather, flights,
            and attractions in one place.
          </p>
        </div>
        <form className="grid grid-2" onSubmit={handleSubmit}>
          <label className="field">
            <span>Origin city</span>
            <input
              className="input"
              value={form.origin}
              onChange={(e) => updateField("origin", e.target.value)}
              placeholder="Chicago"
            />
          </label>
          <label className="field">
            <span>Destination city</span>
            <input
              className="input"
              value={form.destination}
              onChange={(e) => updateField("destination", e.target.value)}
              placeholder="Barcelona"
            />
          </label>
          <label className="field">
            <span>Start date</span>
            <input
              type="date"
              className="input"
              value={form.startDate}
              onChange={(e) => updateField("startDate", e.target.value)}
            />
          </label>
          <label className="field">
            <span>End date</span>
            <input
              type="date"
              className="input"
              value={form.endDate}
              onChange={(e) => updateField("endDate", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Budget (optional)</span>
            <div className="input-group">
              <select
                className="input input-select"
                value={form.currency}
                onChange={(e) => updateField("currency", e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
              <input
                type="number"
                className="input"
                value={form.budget}
                onChange={(e) => updateField("budget", e.target.value)}
                placeholder="1200"
                min="0"
              />
            </div>
          </label>
          <label className="field">
            <span>Max flight price (optional)</span>
            <input
              type="number"
              className="input"
              value={form.maxFlightPrice}
              onChange={(e) =>
                updateField("maxFlightPrice", e.target.value)
              }
              placeholder="400"
              min="0"
            />
          </label>
          <label className="field">
            <span>Preferred temperature range (°F)</span>
            <div className="input-group">
              <input
                type="number"
                className="input"
                value={form.tempMin}
                onChange={(e) => updateField("tempMin", e.target.value)}
              />
              <span className="range-separator">to</span>
              <input
                type="number"
                className="input"
                value={form.tempMax}
                onChange={(e) => updateField("tempMax", e.target.value)}
              />
            </div>
          </label>
          <label className="field">
            <span>Crowd preference</span>
            <select
              className="input"
              value={form.crowdPreference}
              onChange={(e) =>
                updateField("crowdPreference", e.target.value)
              }
            >
              <option value="less">Less crowded</option>
              <option value="balanced">Balanced</option>
              <option value="lively">Lively / popular</option>
            </select>
          </label>
          <div className="field full-width">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Planning..." : "Get trip snapshot"}
            </button>
            {error && <p className="error">{error}</p>}
          </div>
        </form>
      </section>

      {summary && (
        <>
          <TripSummaryHeader summary={summary} />
          <div className="grid grid-2-stretch">
            <WeatherPanel summary={summary} />
            <FlightsPanel
              summary={summary}
              maxFlightPrice={
                form.maxFlightPrice ? Number(form.maxFlightPrice) : null
              }
            />
          </div>
          <AttractionsPanel
            summary={summary}
            onAddToItinerary={handleAddToItinerary}
          />
          <ItineraryPanel
            itinerary={itinerary}
            onChange={updateItineraryItem}
            onRemove={removeItineraryItem}
          />
        </>
      )}
    </div>
  );
}

function TripSummaryHeader({ summary }) {
  return (
    <section className="section summary-banner">
      <div>
        <h3>
          {summary.location.name}, {summary.location.country}
        </h3>
        <p className="muted">
          {summary.bestTimeToVisit?.explanation ??
            "Overview for your selected dates."}
        </p>
        {summary.bestTimeToVisit && (
          <span className="chip chip-soft">
            Best time to visit: {summary.bestTimeToVisit.label}
          </span>
        )}
      </div>
      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-label">Avg high</div>
          <div className="stat-value">
            {summary.weatherSummary?.avgHigh != null
            ? cToF(summary.weatherSummary.avgHigh).toFixed(1)
            : "—"}°F
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg low</div>
          <div className="stat-value">
            {summary.weatherSummary?.avgLow != null
            ? cToF(summary.weatherSummary.avgLow).toFixed(1)
            : "—"}°F
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg rain</div>
          <div className="stat-value">
            {summary.weatherSummary?.avgPrecip ?? "—"} mm
          </div>
        </div>
      </div>
    </section>
  );
}

function WeatherPanel({ summary }) {
  return (
    <section className="section">
      <div className="section-header">
        <h4>Weather snapshot</h4>
        <p className="muted">Daily temperatures and precipitation.</p>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Min (°F)</th>
            <th>Max (°F)</th>
            <th>Precip (mm)</th>
            <th>Conditions</th>
          </tr>
        </thead>
        <tbody>
          {summary.weatherDaily?.map((d) => (
            <tr key={d.date}>
              <td>{d.date}</td>
              <td>{cToF(d.min).toFixed(1)}</td>
              <td>{cToF(d.max).toFixed(1)}</td>
              <td>{d.precip}</td>
              <td>{d.conditions}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function FlightsPanel({ summary, maxFlightPrice }) {
  const flights = (summary.flights || []).filter((f) =>
    maxFlightPrice ? f.price <= maxFlightPrice : true
  );

  return (
    <section className="section">
      <div className="section-header">
        <h4>Flight options</h4>
        <p className="muted">
          Sorted by price. Filtered by your max price if provided.
        </p>
      </div>
      {flights.length === 0 ? (
        <p className="muted">No matching flights.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Flight</th>
              <th>Route</th>
              <th>Depart</th>
              <th>Arrive</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {flights.map((f) => (
              <tr key={f.flightId}>
                <td>
                  {f.carrierCode} {f.flightNumber}
                </td>
                <td>
                  {f.originCity} → {f.destinationCity}
                </td>
                <td>{f.departTime?.replace("T", " ")}</td>
                <td>{f.arriveTime?.replace("T", " ")}</td>
                <td>
                  {f.currency} {f.price.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function AttractionsPanel({ summary, onAddToItinerary }) {
  const [category, setCategory] = useState("all");
  const [maxBusyness, setMaxBusyness] = useState(100);

  const allAttractions = summary.attractions || [];
  const categories = ["all", ...new Set(allAttractions.map((a) => a.category))];

  const filtered = allAttractions.filter((a) => {
    if (category !== "all" && a.category !== category) return false;
    if (a.busynessIndex != null && a.busynessIndex > maxBusyness) return false;
    return true;
  });

  return (
    <section className="section">
      <div className="section-header">
        <h4>Attractions & crowdedness</h4>
        <p className="muted">
          Filter by type and busyness to match your ideal vibe.
        </p>
      </div>
      <div className="filters-row">
        <label className="field inline-field">
          <span>Category</span>
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All" : c}
              </option>
            ))}
          </select>
        </label>
        <label className="field inline-field">
          <span>Max busyness</span>
          <input
            type="range"
            min="0"
            max="100"
            value={maxBusyness}
            onChange={(e) => setMaxBusyness(Number(e.target.value))}
          />
          <span className="range-value">{maxBusyness}</span>
        </label>
      </div>
      {filtered.length === 0 ? (
        <p className="muted">No attractions match these filters.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Rating</th>
              <th>Price level</th>
              <th>Busyness</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.category}</td>
                <td>{a.rating ?? "—"}</td>
                <td>{a.priceLevel ?? "—"}</td>
                <td>
                  {a.busynessIndex != null ? `${a.busynessIndex}/100` : "—"}
                </td>
                <td>
                  <button
                    className="btn btn-ghost tiny"
                    onClick={() => onAddToItinerary(a)}
                  >
                    Add to itinerary
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function ItineraryPanel({ itinerary, onChange, onRemove }) {
  return (
    <section className="section">
      <div className="section-header">
        <h4>Trip itinerary</h4>
        <p className="muted">
          Arrange visit dates and times for your selected attractions.
        </p>
      </div>
      {itinerary.length === 0 ? (
        <p className="muted">
          Use “Add to itinerary” in the attractions table to start building your
          day-by-day plan.
        </p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Attraction</th>
              <th>Date</th>
              <th>Start</th>
              <th>End</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {itinerary.map((item) => (
              <tr key={item.id}>
                <td>{item.attraction.name}</td>
                <td>
                  <input
                    type="date"
                    className="input input-inline"
                    value={item.visitDate}
                    onChange={(e) =>
                      onChange(item.id, "visitDate", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="time"
                    className="input input-inline"
                    value={item.startTime}
                    onChange={(e) =>
                      onChange(item.id, "startTime", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    type="time"
                    className="input input-inline"
                    value={item.endTime}
                    onChange={(e) =>
                      onChange(item.id, "endTime", e.target.value)
                    }
                  />
                </td>
                <td>
                  <input
                    className="input input-inline"
                    value={item.notes}
                    onChange={(e) =>
                      onChange(item.id, "notes", e.target.value)
                    }
                    placeholder="Optional notes"
                  />
                </td>
                <td>
                  <button
                    className="btn btn-ghost tiny"
                    onClick={() => onRemove(item.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

// ----------------------------- My Trips tab -----------------------------

function TripsPlaceholder() {
  return (
    <div className="page">
      <section className="section">
        <div className="section-header">
          <h3>My Trips</h3>
          <p className="muted">
            This tab can connect to your Trip / Itinerary tables to list saved
            trips.
          </p>
        </div>
        <p className="muted">
          For now, this is a placeholder. Once your backend exposes endpoints
          like <code>/api/trips</code> and <code>/api/trips/:id</code>, you can:
        </p>
        <ul className="list">
          <li>List past and upcoming trips.</li>
          <li>Open a trip to reload its weather, flights, and itinerary.</li>
          <li>Allow users to edit or delete trips.</li>
        </ul>
      </section>
    </div>
  );
}

// ----------------------------- Explore tab ------------------------------

function Explore() {
  const [sunnyCities, setSunnyCities] = useState([]);
  const [coldCities, setColdCities] = useState([]);
  const [cheapFlights, setCheapFlights] = useState([]);
  const [monthlyAvg, setMonthlyAvg] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadSunnyCities() {
    setLoading(true);
    const data = await safeFetchJSON(
      "/api/explore/sunny-cities",
      {},
      [
        {
          city: "Lisbon",
          country: "Portugal",
          avg_high_c: 22.5,
          avg_rain_mm: 0.5,
          clear_days: 6,
        },
      ]
    );
    setSunnyCities(data);
    setLoading(false);
  }

  async function loadColdCities() {
    setLoading(true);
    const data = await safeFetchJSON(
      "/api/explore/cold-cities",
      {},
      [
        {
          city: "Denver",
          country: "USA",
          city_avg_max: 4,
          country_avg_max: 12,
        },
      ]
    );
    setColdCities(data);
    setLoading(false);
  }

  async function loadCheapFlights() {
    setLoading(true);
    const data = await safeFetchJSON(
      "/api/explore/cheap-flights-good-weather",
      {},
      [
        {
          flight_id: 1,
          flight_number: "411",
          price: 280.5,
          currency: "USD",
          depart_time: "2025-03-10T09:10",
          arrive_time: "2025-03-10T12:40",
          destination_city: "San Diego",
          destination_country: "USA",
        },
      ]
    );
    setCheapFlights(data);
    setLoading(false);
  }

  async function loadMonthlyAvg() {
    setLoading(true);
    const data = await safeFetchJSON(
      "/api/explore/monthly-route-avg",
      {},
      [
        {
          origin_city: "Chicago",
          destination_city: "Seattle",
          month: 3,
          avg_price: 315.2,
        },
      ]
    );
    setMonthlyAvg(data);
    setLoading(false);
  }

  return (
    <div className="page">
      <section className="section">
        <div className="section-header">
          <h3>Explore destinations</h3>
          <p className="muted">
            Use pre-built analytics: sunny cities, colder getaways, cheap flights
            to good-weather spots, and monthly price trends.
          </p>
        </div>
        <div className="explore-grid">
          <ExploreCard
            title="Sunniest cities this week"
            description="Top cities with many clear days and low precipitation."
            actionLabel="Load sunny cities"
            loading={loading}
            onAction={loadSunnyCities}
          >
            {sunnyCities.length > 0 && (
              <table className="table tiny-table">
                <thead>
                  <tr>
                    <th>City</th>
                    <th>Country</th>
                    <th>Avg high (°F)</th>
                    <th>Avg rain (mm)</th>
                    <th>Clear days</th>
                  </tr>
                </thead>
                <tbody>
                  {sunnyCities.map((c, idx) => (
                    <tr key={idx}>
                      <td>{c.city}</td>
                      <td>{c.country}</td>
                      <td>{cToF(c.avg_high_c).toFixed(1)}</td>
                      <td>{c.avg_rain_mm}</td>
                      <td>{c.clear_days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ExploreCard>

          <ExploreCard
            title="Colder cities than country average"
            description="Find local ski / cold-weather destinations."
            actionLabel="Load colder cities"
            loading={loading}
            onAction={loadColdCities}
          >
            {coldCities.length > 0 && (
              <table className="table tiny-table">
                <thead>
                  <tr>
                    <th>City</th>
                    <th>Country</th>
                    <th>City avg (°C)</th>
                    <th>Country avg (°C)</th>
                  </tr>
                </thead>
                <tbody>
                  {coldCities.map((c, idx) => (
                    <tr key={idx}>
                      <td>{c.city}</td>
                      <td>{c.country}</td>
                      <td>{c.city_avg_max}</td>
                      <td>{c.country_avg_max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ExploreCard>

          <ExploreCard
            title="Cheapest flights to good-weather places"
            description="Pair flight prices with pleasant temperature ranges."
            actionLabel="Load cheap flights"
            loading={loading}
            onAction={loadCheapFlights}
          >
            {cheapFlights.length > 0 && (
              <table className="table tiny-table">
                <thead>
                  <tr>
                    <th>Flight</th>
                    <th>Destination</th>
                    <th>Depart</th>
                    <th>Arrive</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {cheapFlights.map((f, idx) => (
                    <tr key={idx}>
                      <td>{f.flight_number}</td>
                      <td>
                        {f.destination_city}, {f.destination_country}
                      </td>
                      <td>{f.depart_time?.replace("T", " ")}</td>
                      <td>{f.arrive_time?.replace("T", " ")}</td>
                      <td>
                        {f.currency} {f.price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ExploreCard>

          <ExploreCard
            title="Monthly route price trends"
            description="Average price by month for each origin/destination."
            actionLabel="Load monthly averages"
            loading={loading}
            onAction={loadMonthlyAvg}
          >
            {monthlyAvg.length > 0 && (
              <table className="table tiny-table">
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Month</th>
                    <th>Avg price</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyAvg.map((r, idx) => (
                    <tr key={idx}>
                      <td>
                        {r.origin_city} → {r.destination_city}
                      </td>
                      <td>{r.month}</td>
                      <td>{r.avg_price.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ExploreCard>
        </div>
      </section>
    </div>
  );
}

function ExploreCard({
  title,
  description,
  actionLabel,
  loading,
  onAction,
  children,
}) {
  return (
    <div className="explore-card">
      <h4>{title}</h4>
      <p className="muted">{description}</p>
      <button
        className="btn btn-outline tiny"
        disabled={loading}
        onClick={onAction}
      >
        {loading ? "Loading..." : actionLabel}
      </button>
      <div className="explore-card-body">{children}</div>
    </div>
  );
}

// ----------------------------- About tab ------------------------------

function About() {
  return (
    <div className="page">
      <section className="section">
        <div className="section-header">
          <h3>About this app</h3>
        </div>
        <p className="muted">
          Smart Travel Planner is a course project that combines weather,
          air-quality, crowdedness, and flight data into a single interface so
          travelers can quickly answer questions like “What is the best time to
          visit X?” without jumping across multiple websites.
        </p>
        <ul className="list">
          <li>Weather and air quality via APIs such as OpenWeather and OpenAQ.</li>
          <li>
            Crowdedness and popularity from places APIs and datasets like Yelp /
            Google Places.
          </li>
          <li>Flight options from OpenFlights-backed datasets.</li>
          <li>
            A relational schema with users, trips, flights, locations, weather,
            attractions, and itinerary items.
          </li>
        </ul>
      </section>
    </div>
  );
}
