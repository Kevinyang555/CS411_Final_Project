import pandas as pd

# === 1️⃣  Read your dataset ===
input_file = "../DataSheets/worldcities.csv"  # change if file name is different
df = pd.read_csv(input_file)

# === 2️⃣  Rename and keep the needed columns ===
# Map 'city' → 'name' and 'lng' → 'lon'
df = df.rename(columns={
    "city": "name",
    "lng": "lon"
})

# === 3️⃣  Add a timezone column (since missing in source) ===
df["tz"] = "UTC"  # default fallback timezone, can update later if needed

# === 4️⃣  Keep only relevant columns for your Location table ===
df_clean = df[["name", "country", "lat", "lon", "tz"]]

# === 5️⃣  Take first 500 rows ===
df_clean_500 = df_clean.head(500)

# === 6️⃣  Save to a new CSV ===
output_file = "../DataSheets/Location_clean_500.csv"
df_clean_500.to_csv(output_file, index=False)

print(f"✅ Saved cleaned file with 500 rows to {output_file}")
print("Columns in exported file:", df_clean_500.columns.tolist())
print(df_clean_500.head(10))
