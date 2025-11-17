import pandas as pd
import requests
import csv
from tqdm import tqdm

# === 1️⃣ Read your exported Location CSV (semicolon separated) ===
input_file = "../DataSheets/Location_dataset.csv"   # rename this to your actual file
locations = pd.read_csv(input_file, sep=';')

# Verify structure
print("Loaded", len(locations), "locations.")
print("Columns:", locations.columns.tolist())

# === 2️⃣ Prepare output CSV ===
output_file = "../DataSheets/WeatherDaily_linked.csv"
fields = ["location_id","on_date","min_temp_c","max_temp_c","precip_mm","conditions","source"]
out = open(output_file, "w", newline="", encoding="utf-8")
writer = csv.writer(out)
writer.writerow(fields)

# === 3️⃣ Weather code map (WMO codes) ===
weather_map = {
    0: "Clear", 1: "Mainly clear", 2: "Partly cloudy", 3: "Cloudy",
    45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
    61: "Light rain", 63: "Moderate rain", 71: "Snow fall", 73: "Snow fall",
    80: "Rain showers", 81: "Rain showers", 95: "Thunderstorm"
}

START_DATE, END_DATE = "2025-10-20", "2025-10-26"

# === 4️⃣ Fetch weather for each city ===
print("Fetching weather data from Open-Meteo (this may take several minutes)...")

for _, row in tqdm(locations.iterrows(), total=len(locations)):
    loc_id = int(row["location_id"])
    lat, lon = row["lat"], row["lon"]
    tz = row["tz"] if "tz" in row and isinstance(row["tz"], str) else "UTC"

    url = (
        f"https://archive-api.open-meteo.com/v1/archive?"
        f"latitude={lat}&longitude={lon}"
        f"&start_date={START_DATE}&end_date={END_DATE}"
        "&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,weathercode"
        f"&timezone={tz}"
    )

    try:
        r = requests.get(url, timeout=20)
        data = r.json().get("daily", {})
        if not data or "time" not in data:
            print(f"⚠️ No data for location_id {loc_id}")
            continue

        for i, date in enumerate(data["time"]):
            writer.writerow([
                loc_id,
                date,
                data["temperature_2m_min"][i],
                data["temperature_2m_max"][i],
                data["precipitation_sum"][i],
                weather_map.get(data["weathercode"][i], "Unknown"),
                "Open-Meteo"
            ])

    except Exception as e:
        print(f"⚠️ Failed for location_id {loc_id}: {e}")

out.close()
print(f"✅ Done! Created '{output_file}' with real linked weather data.")
