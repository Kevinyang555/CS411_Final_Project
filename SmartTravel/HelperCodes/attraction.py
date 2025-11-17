import requests
import pandas as pd
import time

API_KEY = "AIzaSyBv7NCrjXAorMab8LAFCA302wRNMATEboo"
CSV_PATH = "C:/Users/kevin/CS 411/SmartTravel/DataSheets/Location_dataset.csv"
OUTPUT_CSV = "attractions_google_v1.csv"

# Load city names (first 50)
df = pd.read_csv(CSV_PATH, sep=';').head(500)

headers = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": API_KEY,
    "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.types,places.location"
}

results = []

for idx, row in df.iterrows():
    city = row['name']
    country = row['country']
    location_id = row['location_id']

    query = f"Tourist attractions in {city}, {country}"
    body = {
        "textQuery": query,
        "pageSize": 10
    }

    print(f"🔍 {idx + 1}/500: {query}")

    try:
        response = requests.post(
            "https://places.googleapis.com/v1/places:searchText",
            headers=headers,
            json=body
        )
        data = response.json()

        if "places" in data:
            for place in data["places"]:
                results.append({
                    "location_id": location_id,
                    "name": place.get("displayName", {}).get("text"),
                    "category": place.get("types", [None])[0],
                    "rating": place.get("rating"),
                    "lat": place.get("location", {}).get("latitude"),
                    "lon": place.get("location", {}).get("longitude"),
                    "source": "Google Places New"
                })

    except Exception as e:
        print(f"❌ Error: {e}")

    time.sleep(1)

# Save results
out_df = pd.DataFrame(results)
out_df.to_csv(OUTPUT_CSV, index=False)
print(f"\n✅ Done! Saved {len(out_df)} places to {OUTPUT_CSV}")