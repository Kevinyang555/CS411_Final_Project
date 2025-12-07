import React, { useState, useEffect } from "react";

function cToF(c) {
  return (c * 9) / 5 + 32;
}

function fToC(f) {
  return ((f - 32) * 5) / 9;
}

const API_BASE = "http://localhost:3000/api";

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

  // Lift TripPlanner state to App level so it persists across tab switches
  const [plannerState, setPlannerState] = useState({
    form: {
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
    },
    summary: null,
    itinerary: [],
    currentTripId: null,
    tripName: "",
  });

  if (!user) {
    return <SignInPage onSignIn={setUser} />;
  }

  return (
    <div className="app">
      <Sidebar user={user} activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main">
        <Header user={user} />
        <div className="main-content">
          {activeTab === "planner" && (
            <TripPlanner
              user={user}
              plannerState={plannerState}
              setPlannerState={setPlannerState}
            />
          )}
          {activeTab === "trips" && <MyTrips user={user} />}
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

  async function handleSubmit(e) {
    // e.preventDefault();
    // if (!fullName || !email) return;
    // onSignIn({ fullName, email });

    e.preventDefault();
    if (!fullName || !email) return;

    try {
      const response = await fetch("http://localhost:3000/api/userLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email: email,
        }),
      });

      if (!response.ok) {
        console.error("Login failed", await response.json());
        return;
      }

      const data = await response.json();

      onSignIn({
        fullName: data.name,
        email: data.email,
        userId: data.userId,
      });
    } catch (err) {
      console.error("Error calling /api/userLogin:", err);
    }
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

function TripPlanner({ user, plannerState, setPlannerState }) {
  // Use lifted state from App
  const { form, summary, itinerary, currentTripId, tripName } = plannerState;

  // Local-only state (doesn't need to persist)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTripNameModal, setShowTripNameModal] = useState(false);
  const [pendingAttraction, setPendingAttraction] = useState(null);
  const [savingItinerary, setSavingItinerary] = useState(false);
  const [localTripName, setLocalTripName] = useState("");

  function updateField(field, value) {
    setPlannerState((prev) => ({
      ...prev,
      form: { ...prev.form, [field]: value },
    }));
  }

  function setSummary(newSummary) {
    setPlannerState((prev) => ({ ...prev, summary: newSummary }));
  }

  function setItinerary(updater) {
    setPlannerState((prev) => ({
      ...prev,
      itinerary: typeof updater === "function" ? updater(prev.itinerary) : updater,
    }));
  }

  function setCurrentTripId(id) {
    setPlannerState((prev) => ({ ...prev, currentTripId: id }));
  }

  function setTripName(name) {
    setPlannerState((prev) => ({ ...prev, tripName: name }));
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

  // Called when user clicks "Add to itinerary" on an attraction
  function handleAddToItinerary(attraction) {
    // Check if attraction already in itinerary
    if (itinerary.some((item) => item.attraction.id === attraction.id)) {
      return;
    }

    // If no trip exists yet, show modal to get trip name
    if (!currentTripId) {
      setPendingAttraction(attraction);
      setShowTripNameModal(true);
      return;
    }

    // Trip exists, add item directly
    addItemToExistingTrip(attraction);
  }

  // Create new trip with first itinerary item
  async function handleCreateTripWithItem() {
    if (!localTripName.trim() || !pendingAttraction) return;

    setSavingItinerary(true);
    try {
      const response = await fetch("http://localhost:3000/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.userId,
          tripName: localTripName.trim(),
          origin: form.origin,
          destination: form.destination,
          startDate: form.startDate,
          endDate: form.endDate,
          attraction: pendingAttraction,
          visitDate: form.startDate,
          startTime: "10:00",
          endTime: "12:00",
          notes: "",
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create trip");
      }

      const data = await response.json();
      setCurrentTripId(data.tripId);
      setTripName(localTripName.trim());

      // Add to local itinerary state
      setItinerary([
        {
          id: `${pendingAttraction.id}-1`,
          itemId: data.itemId,
          attraction: pendingAttraction,
          visitDate: form.startDate,
          startTime: "10:00",
          endTime: "12:00",
          notes: "",
        },
      ]);

      setShowTripNameModal(false);
      setPendingAttraction(null);
      setLocalTripName("");
      console.log(`Created trip "${localTripName}" with ID ${data.tripId}`);
    } catch (err) {
      console.error("Error creating trip:", err);
      setError(err.message);
    } finally {
      setSavingItinerary(false);
    }
  }

  // Add item to existing trip
  async function addItemToExistingTrip(attraction) {
    setSavingItinerary(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/trips/${currentTripId}/itinerary`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tripId: currentTripId,
            attraction: attraction,
            visitDate: form.startDate,
            startTime: "10:00",
            endTime: "12:00",
            notes: "",
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to add item");
      }

      const data = await response.json();

      // Add to local itinerary state
      setItinerary((prev) => [
        ...prev,
        {
          id: `${attraction.id}-${prev.length + 1}`,
          itemId: data.itemId,
          attraction,
          visitDate: form.startDate,
          startTime: "10:00",
          endTime: "12:00",
          notes: "",
        },
      ]);

      console.log(`Added item ${data.itemId} to trip ${currentTripId}`);
    } catch (err) {
      console.error("Error adding itinerary item:", err);
      setError(err.message);
    } finally {
      setSavingItinerary(false);
    }
  }

  // Update itinerary item locally and sync to backend
  async function updateItineraryItem(id, field, value) {
    // Update local state immediately
    setItinerary((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );

    // Find the item to get itemId for backend call
    const item = itinerary.find((i) => i.id === id);
    if (!item || !currentTripId || !item.itemId) return;

    // Sync to backend (debounced would be better, but this works)
    try {
      await fetch(
        `http://localhost:3000/api/trips/${currentTripId}/itinerary/${item.itemId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        }
      );
    } catch (err) {
      console.error("Error updating itinerary item:", err);
    }
  }

  // Remove itinerary item from local state and backend
  async function removeItineraryItem(id) {
    const item = itinerary.find((i) => i.id === id);

    // Remove from local state immediately
    setItinerary((prev) => prev.filter((item) => item.id !== id));

    // Delete from backend
    if (!item || !currentTripId || !item.itemId) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/trips/${currentTripId}/itinerary/${item.itemId}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        console.error("Failed to delete itinerary item from backend");
      }
    } catch (err) {
      console.error("Error removing itinerary item:", err);
    }
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
            tripName={tripName}
            currentTripId={currentTripId}
          />
        </>
      )}

      {/* Trip Name Modal */}
      {showTripNameModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Name Your Trip</h3>
            <p className="muted">
              Give your trip a name to save it and start building your itinerary.
            </p>
            <label className="field">
              <span>Trip name</span>
              <input
                type="text"
                className="input"
                value={localTripName}
                onChange={(e) => setLocalTripName(e.target.value)}
                placeholder={`Trip to ${form.destination || "..."}`}
                autoFocus
              />
            </label>
            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setShowTripNameModal(false);
                  setPendingAttraction(null);
                  setLocalTripName("");
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateTripWithItem}
                disabled={!localTripName.trim() || savingItinerary}
              >
                {savingItinerary ? "Creating..." : "Create Trip"}
              </button>
            </div>
          </div>
        </div>
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

function ItineraryPanel({ itinerary, onChange, onRemove, tripName, currentTripId }) {
  return (
    <section className="section">
      <div className="section-header">
        <h4>
          Trip itinerary
          {tripName && currentTripId && (
            <span className="chip chip-soft" style={{ marginLeft: "10px" }}>
              {tripName} (saved)
            </span>
          )}
        </h4>
        <p className="muted">
          Arrange visit dates and times for your selected attractions.
        </p>
      </div>
      {itinerary.length === 0 ? (
        <p className="muted">
          Use "Add to itinerary" in the attractions table to start building your
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

function MyTrips({ user }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripDetails, setTripDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Load trips on mount
  useEffect(() => {
    loadTrips();
  }, [user.userId]);

  async function loadTrips() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `http://localhost:3000/api/trips/user/${user.userId}`
      );
      if (!response.ok) throw new Error("Failed to load trips");
      const data = await response.json();
      setTrips(data.trips || []);
    } catch (err) {
      console.error("Error loading trips:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTripDetails(tripId) {
    setLoadingDetails(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/trips/${tripId}`
      );
      if (!response.ok) throw new Error("Failed to load trip details");
      const data = await response.json();
      setTripDetails(data);
      setSelectedTrip(tripId);
    } catch (err) {
      console.error("Error loading trip details:", err);
      setError(err.message);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleDeleteTrip(tripId) {
    if (!confirm("Are you sure you want to delete this trip?")) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/trips/${tripId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete trip");

      // Refresh trips list
      setTrips((prev) => prev.filter((t) => t.tripId !== tripId));
      if (selectedTrip === tripId) {
        setSelectedTrip(null);
        setTripDetails(null);
      }
    } catch (err) {
      console.error("Error deleting trip:", err);
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <section className="section">
        <div className="section-header">
          <h3>My Trips</h3>
          <p className="muted">
            View and manage your saved trips and itineraries.
          </p>
        </div>

        {loading ? (
          <p className="muted">Loading your trips...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : trips.length === 0 ? (
          <p className="muted">
            No trips yet. Go to "Plan a Trip" and add attractions to your
            itinerary to create your first trip.
          </p>
        ) : (
          <div className="trips-grid">
            {trips.map((trip) => (
              <div
                key={trip.tripId}
                className={`trip-card ${selectedTrip === trip.tripId ? "trip-card-selected" : ""}`}
              >
                <div className="trip-card-header">
                  <h4>{trip.tripName}</h4>
                  <button
                    className="btn btn-ghost tiny"
                    onClick={() => handleDeleteTrip(trip.tripId)}
                  >
                    Delete
                  </button>
                </div>
                <p className="muted">
                  {trip.origin && `${trip.origin} → `}
                  {trip.destination || "Destination TBD"}
                </p>
                <p className="muted tiny">
                  {trip.startDate && trip.endDate
                    ? `${trip.startDate} to ${trip.endDate}`
                    : "Dates not set"}
                </p>
                <div className="trip-card-footer">
                  <span className="chip chip-soft">
                    {trip.itineraryCount || 0} item(s)
                  </span>
                  {trip.categories && (
                    <span className="chip chip-soft">{trip.categories}</span>
                  )}
                </div>
                <button
                  className="btn btn-outline tiny"
                  onClick={() => loadTripDetails(trip.tripId)}
                  disabled={loadingDetails}
                >
                  {loadingDetails && selectedTrip === trip.tripId
                    ? "Loading..."
                    : "View Details"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trip Details Section */}
      {tripDetails && (
        <section className="section">
          <div className="section-header">
            <h4>{tripDetails.trip.tripName} - Itinerary</h4>
            <p className="muted">
              {tripDetails.trip.destination}
              {tripDetails.trip.startDate &&
                ` | ${tripDetails.trip.startDate} to ${tripDetails.trip.endDate}`}
            </p>
          </div>
          {tripDetails.itinerary.length === 0 ? (
            <p className="muted">No itinerary items for this trip.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Attraction</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {tripDetails.itinerary.map((item) => (
                  <tr key={item.itemId}>
                    <td>{item.attraction.name}</td>
                    <td>{item.attraction.category}</td>
                    <td>{item.visitDate}</td>
                    <td>
                      {item.startTime} - {item.endTime}
                    </td>
                    <td>{item.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}

// ----------------------------- Explore tab ------------------------------

function Explore() {
  const [sunnyCities, setSunnyCities] = useState([]);
  const [coldCities, setColdCities] = useState([]);
  const [cheapFlights, setCheapFlights] = useState([]);
  const [monthlyAvg, setMonthlyAvg] = useState([]);
  const [loading, setLoading] = useState({
    sunny: false,
    cold: false,
    cheap: false,
    monthly: false,
  });

  async function fetchExplore(path, setter, key, fallback) {
    setLoading((prev) => ({ ...prev, [key]: true }));
    const data = await safeFetchJSON(`${API_BASE}${path}`, {}, fallback);
    setter(data || []);
    setLoading((prev) => ({ ...prev, [key]: false }));
  }

  async function loadSunnyCities() {
    await fetchExplore(
      "/explore/sunny-cities?limit=10",
      setSunnyCities,
      "sunny",
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
  }

  async function loadColdCities() {
    await fetchExplore(
      "/explore/cold-cities?minDelta=2&limit=10",
      setColdCities,
      "cold",
      [
        {
          city: "Denver",
          country: "USA",
          city_avg_max: 4,
          country_avg_max: 12,
        },
      ]
    );
  }

  async function loadCheapFlights() {
    await fetchExplore(
      "/explore/cheap-flights-good-weather?minTemp=15&maxTemp=28&maxPrecip=3&maxPrice=1000&limit=15",
      setCheapFlights,
      "cheap",
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
  }

  async function loadMonthlyAvg() {
    await fetchExplore(
      "/explore/monthly-route-avg?limit=20",
      setMonthlyAvg,
      "monthly",
      [
        {
          origin_city: "Chicago",
          destination_city: "Seattle",
          month: 3,
          avg_price: 315.2,
        },
      ]
    );
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
            loading={loading.sunny}
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
            loading={loading.cold}
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
            loading={loading.cheap}
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
            loading={loading.monthly}
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
