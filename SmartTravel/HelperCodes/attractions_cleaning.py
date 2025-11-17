import pandas as pd
from unidecode import unidecode  # pip install unidecode if needed

# Load raw data
df = pd.read_csv("../DataSheets/attractions_google_v1.csv")

# 1. Remove 'price_level' if present
if 'price_level' in df.columns:
    df = df.drop(columns=['price_level'])

# 2. Drop rows missing required fields
df = df.dropna(subset=['name', 'lat', 'lon'])

# 3. Convert non-English characters in 'name' to ASCII
df['name'] = df['name'].apply(lambda x: unidecode(str(x)))

# 4. Clean and standardize text columns
df['name'] = df['name'].str.strip()
df['category'] = df['category'].fillna('unknown').str.strip()
df['source'] = df['source'].fillna('unknown').str.strip()

# 5. Convert 'rating' to numeric; replace invalid/missing with 0.0
df['rating'] = pd.to_numeric(df['rating'], errors='coerce').fillna(0.0)

# 6. Save cleaned file
df.to_csv("../DataSheets/attractions_cleaned.csv", index=False)
print(f"✅ Cleaned data saved to 'attractions_cleaned.csv' ({len(df)} rows)")
