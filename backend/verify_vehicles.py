import sys
from pathlib import Path

root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import urllib.request
import json
from sqlalchemy import text
from backend.database import engine

def post_json(url, data):
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as res:
        return res.status, json.loads(res.read().decode())

def get_json(url):
    with urllib.request.urlopen(url) as res:
        return res.status, json.loads(res.read().decode())

print("=== 1. TESTING REPEATED GPS LOCATION UPDATES FOR V001 ===")
# Ping 1
p1_status, p1 = post_json("http://127.0.0.1:8000/api/vehicles/location", {
    "vehicle_id": "V001",
    "latitude": 24.817,
    "longitude": 93.936
})
print("Ping 1 (24.817, 93.936) ->", p1_status, p1["message"])

# Ping 2
p2_status, p2 = post_json("http://127.0.0.1:8000/api/vehicles/location", {
    "vehicle_id": "V001",
    "latitude": 24.830,
    "longitude": 93.942
})
print("Ping 2 (24.830, 93.942) ->", p2_status, p2["message"])

# Ping 3
p3_status, p3 = post_json("http://127.0.0.1:8000/api/vehicles/location", {
    "vehicle_id": "V001",
    "latitude": 24.850,
    "longitude": 93.955
})
print("Ping 3 (24.850, 93.955) ->", p3_status, p3["message"])

print("\n=== 2. TESTING GET /api/vehicles ===")
v_all_status, v_all = get_json("http://127.0.0.1:8000/api/vehicles")
print("GET /api/vehicles ->", v_all_status, "Total tracked:", v_all["total"])
for veh in v_all["vehicles"]:
    if veh["vehicle_id"] == "V001":
        print("V001 in all-vehicles list shows latest coords:", veh["latitude"], veh["longitude"])

print("\n=== 3. TESTING GET /api/vehicles/V001/location (LATEST) ===")
v_latest_status, v_latest = get_json("http://127.0.0.1:8000/api/vehicles/V001/location")
print("GET /api/vehicles/V001/location ->", v_latest_status, v_latest["location"]["latitude"], v_latest["location"]["longitude"])

print("\n=== 4. TESTING GET /api/vehicles/V001/locations (HISTORY) ===")
v_hist_status, v_hist = get_json("http://127.0.0.1:8000/api/vehicles/V001/locations")
print("GET /api/vehicles/V001/locations ->", v_hist_status, "Total history records:", v_hist["total_records"])
for idx, point in enumerate(v_hist["history"][-3:]):
    print(f"   Recent point: Lat={point['latitude']}, Lng={point['longitude']}, Time={point['timestamp']}")

print("\n=== 5. TESTING 404 FOR UNKNOWN VEHICLE ===")
for endpoint in ["location", "locations"]:
    try:
        urllib.request.urlopen(f"http://127.0.0.1:8000/api/vehicles/NON_EXISTENT/{endpoint}")
    except urllib.error.HTTPError as e:
        print(f"GET /api/vehicles/NON_EXISTENT/{endpoint} -> 404 OK, detail:", json.loads(e.read().decode())["detail"])

print("\n=== 6. VERIFYING DIRECT POSTGRESQL ROWS IN vehicle_locations ===")
with engine.connect() as conn:
    count = conn.execute(text("SELECT count(id) FROM vehicle_locations WHERE vehicle_id = 'V001'")).scalar()
    print(f"Total rows in PostgreSQL vehicle_locations for V001: {count}")

print("\n=== 7. CONFIRMING ALL OTHER ENDPOINTS ARE INTACT ===")
print("Health:", get_json("http://127.0.0.1:8000/api/health")[0])
print("DB Test:", get_json("http://127.0.0.1:8000/api/db-test")[0])
print("Incidents GET:", get_json("http://127.0.0.1:8000/api/incidents")[0])
print("ML Predict:", post_json("http://127.0.0.1:8000/api/risk/predict", {"latitude": 24.817, "longitude": 93.936, "rainfall": 120.5, "slope": 35.2, "landslide_history": 3})[0])
print("GIS Routes:", post_json("http://127.0.0.1:8000/api/routes", {"source_latitude": 24.817, "source_longitude": 93.936, "destination_latitude": 26.144, "destination_longitude": 91.736})[0])
print("Routes Evaluate:", post_json("http://127.0.0.1:8000/api/routes/evaluate", {"source_latitude": 24.817, "source_longitude": 93.936, "destination_latitude": 26.144, "destination_longitude": 91.736})[0])
