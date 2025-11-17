import pandas as pd
import random
from datetime import datetime

# === Parameters ===
output_csv = "attraction_popularity_15_oneday.csv"
attraction_ids = list(range(1, 16))  # First 15 attractions
on_date = datetime(2025, 4, 1)  # Single date
hours = list(range(24))

# === Generate Data ===
records = []
pop_id = 1

for attr_id in attraction_ids:
    for hour in hours:
        # Simulate realistic busyness pattern
        if 10 <= hour <= 13 or 17 <= hour <= 20:
            busyness = random.randint(50, 90)
        elif 8 <= hour < 10 or 14 <= hour < 17 or 20 < hour <= 22:
            busyness = random.randint(25, 60)
        else:
            busyness = random.randint(5, 30)

        records.append({
            "pop_id": pop_id,
            "attraction_id": attr_id,
            "on_date": on_date.strftime("%Y-%m-%d"),
            "hour": hour,
            "busyness_index": busyness
        })
        pop_id += 1

# === Save CSV ===
df = pd.DataFrame(records)
df.to_csv(output_csv, index=False)
print(f"✅ Saved {len(df)} records to '{output_csv}'")
