"""Test script for POST /api/sync – offline-first data synchronization."""
import urllib.request
import json

BASE = "http://127.0.0.1:8000"

def post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers={"Content-Type": "application/json"})
    try:
        resp = urllib.request.urlopen(req)
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def get(path):
    try:
        resp = urllib.request.urlopen(f"{BASE}{path}")
        return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

print("=" * 60)
print("TEST 1: Sync a batch of records (1 location + 1 incident)")
print("=" * 60)
status, data = post("/api/sync", {
    "records": [
        {
            "client_record_id": "loc-V101-20260916-103000",
            "record_type": "vehicle_location",
            "vehicle_id": "V101",
            "latitude": 24.817,
            "longitude": 93.936,
            "timestamp": "2026-09-16T10:30:00"
        },
        {
            "client_record_id": "inc-V101-20260916-103200",
            "record_type": "incident",
            "vehicle_id": "V101",
            "latitude": 24.817,
            "longitude": 93.936,
            "incident_type": "LANDSLIDE",
            "description": "Road blockage near Jiribam",
            "timestamp": "2026-09-16T10:32:00"
        }
    ]
})
print(f"Status: {status}")
print(json.dumps(data, indent=2))
assert status == 200
assert data["synced"] == 2
assert data["duplicates"] == 0
assert data["failed"] == 0
print("PASS\n")

print("=" * 60)
print("TEST 2: Retry same batch (idempotency – should be duplicates)")
print("=" * 60)
status, data = post("/api/sync", {
    "records": [
        {
            "client_record_id": "loc-V101-20260916-103000",
            "record_type": "vehicle_location",
            "vehicle_id": "V101",
            "latitude": 24.817,
            "longitude": 93.936,
            "timestamp": "2026-09-16T10:30:00"
        },
        {
            "client_record_id": "inc-V101-20260916-103200",
            "record_type": "incident",
            "vehicle_id": "V101",
            "latitude": 24.817,
            "longitude": 93.936,
            "incident_type": "LANDSLIDE",
            "description": "Road blockage near Jiribam",
            "timestamp": "2026-09-16T10:32:00"
        }
    ]
})
print(f"Status: {status}")
print(json.dumps(data, indent=2))
assert status == 200
assert data["synced"] == 0
assert data["duplicates"] == 2
print("PASS\n")

print("=" * 60)
print("TEST 3: Unknown record_type (should fail)")
print("=" * 60)
status, data = post("/api/sync", {
    "records": [
        {
            "client_record_id": "bad-001",
            "record_type": "unknown_type",
            "vehicle_id": "V101",
            "latitude": 24.817,
            "longitude": 93.936
        }
    ]
})
print(f"Status: {status}")
print(json.dumps(data, indent=2))
assert status == 200
assert data["failed"] == 1
print("PASS\n")

print("=" * 60)
print("TEST 4: Incident missing incident_type (should fail)")
print("=" * 60)
status, data = post("/api/sync", {
    "records": [
        {
            "client_record_id": "inc-bad-001",
            "record_type": "incident",
            "vehicle_id": "V101",
            "latitude": 24.817,
            "longitude": 93.936
        }
    ]
})
print(f"Status: {status}")
print(json.dumps(data, indent=2))
assert status == 200
assert data["failed"] == 1
print("PASS\n")

print("=" * 60)
print("TEST 5: Verify vehicle V101 and its location were created")
print("=" * 60)
status, data = get("/api/vehicles")
print(f"GET /api/vehicles => {status}")
v101_found = any(v.get("vehicle_id") == "V101" for v in data) if isinstance(data, list) else False
print(f"Vehicle V101 found: {v101_found}")
assert v101_found
print("PASS\n")

status, data = get("/api/vehicles/V101/location")
print(f"GET /api/vehicles/V101/location => {status}")
print(json.dumps(data, indent=2))
assert status == 200
print("PASS\n")

print("=" * 60)
print("TEST 6: Verify incident appears in incidents list")
print("=" * 60)
status, data = get("/api/incidents")
print(f"GET /api/incidents => {status}")
inc_found = any(i.get("vehicle_id") == "V101" and i.get("incident_type") == "LANDSLIDE" for i in data) if isinstance(data, list) else False
print(f"Incident for V101 found: {inc_found}")
assert inc_found
print("PASS\n")

print("=" * 60)
print("TEST 7: Validate coordinate bounds (should 422)")
print("=" * 60)
status, data = post("/api/sync", {
    "records": [
        {
            "client_record_id": "bad-coord-001",
            "record_type": "vehicle_location",
            "vehicle_id": "V101",
            "latitude": 999.0,
            "longitude": 93.936
        }
    ]
})
print(f"Status: {status}")
assert status == 422
print("PASS\n")

print("=" * 60)
print("TEST 8: Existing endpoints still work")
print("=" * 60)
status, _ = get("/api/health")
print(f"GET /api/health => {status}")
assert status == 200

status, _ = get("/api/db-test")
print(f"GET /api/db-test => {status}")
assert status == 200
print("PASS\n")

print("=" * 60)
print("ALL TESTS PASSED")
print("=" * 60)
