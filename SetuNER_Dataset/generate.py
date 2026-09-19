#!/usr/bin/env python3
"""
SIH26002 - SetuNER dataset generator.
Produces a consistent, cross-referenced dataset for frontend (GeoJSON/JSON),
backend (PostgreSQL+PostGIS SQL) and ML (CSV).

All coordinates are real NER towns. All IDs are stable and cross-referenced.
"""
import json, math, random, os, csv
from datetime import datetime, timedelta, date

random.seed(42)
OUT = os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(OUT, "frontend"), exist_ok=True)
os.makedirs(os.path.join(OUT, "backend"), exist_ok=True)
os.makedirs(os.path.join(OUT, "ml"), exist_ok=True)

TODAY = date(2026, 9, 16)

# ---------------------------------------------------------------- states
STATES = [
    {"code": "AS", "name": "Assam",             "capital": "Dispur"},
    {"code": "AR", "name": "Arunachal Pradesh", "capital": "Itanagar"},
    {"code": "MN", "name": "Manipur",           "capital": "Imphal"},
    {"code": "ML", "name": "Meghalaya",         "capital": "Shillong"},
    {"code": "MZ", "name": "Mizoram",           "capital": "Aizawl"},
    {"code": "NL", "name": "Nagaland",          "capital": "Kohima"},
    {"code": "TR", "name": "Tripura",           "capital": "Agartala"},
    {"code": "SK", "name": "Sikkim",            "capital": "Gangtok"},
    # Siliguri is not in the NER but is its physical gateway — the Siliguri
    # Corridor ("Chicken's Neck") carries nearly all road freight into the
    # region, so the network is incomplete without it.
    {"code": "WB", "name": "West Bengal",       "capital": "Kolkata"},
]

# district: (id, name, state_code, lat, lon, elevation_m, terrain, population)
# terrain: plain | hilly | mountain
DISTRICTS = [
    # ---- Assam (Brahmaputra valley = mostly plains, flood prone)
    ("D-AS-01", "Kamrup Metropolitan", "AS", 26.1445, 91.7362,   55, "plain",    1253938),
    ("D-AS-02", "Nagaon",              "AS", 26.3464, 92.6840,   60, "plain",    2826006),
    ("D-AS-03", "Jorhat",              "AS", 26.7509, 94.2037,   90, "plain",    1092256),
    ("D-AS-04", "Dibrugarh",           "AS", 27.4728, 94.9120,  108, "plain",    1326335),
    ("D-AS-05", "Tinsukia",            "AS", 27.4922, 95.3468,  116, "plain",    1327929),
    ("D-AS-06", "Cachar",              "AS", 24.8333, 92.7789,   25, "plain",    1736617),
    ("D-AS-07", "Dima Hasao",          "AS", 25.1642, 93.0157,  680, "mountain",  214102),
    ("D-AS-08", "Karbi Anglong",       "AS", 25.8400, 93.4300,  186, "hilly",     956313),
    ("D-AS-09", "Sonitpur",            "AS", 26.6338, 92.8000,   79, "plain",    1924110),
    ("D-AS-10", "Bongaigaon",          "AS", 26.4769, 90.5583,   53, "plain",     738804),
    ("D-AS-11", "Sivasagar",           "AS", 26.9850, 94.6380,   97, "plain",    1151050),
    ("D-AS-12", "Karimganj",           "AS", 24.8697, 92.3592,   23, "plain",    1228686),
    # ---- Arunachal Pradesh (high mountain, most fragile)
    ("D-AR-01", "Papum Pare",          "AR", 27.0844, 93.6053,  440, "hilly",     176385),
    ("D-AR-02", "Tawang",              "AR", 27.5860, 91.8590, 3048, "mountain",   49977),
    ("D-AR-03", "West Kameng",         "AR", 27.2650, 92.4250, 2415, "mountain",   87013),
    ("D-AR-04", "Lower Subansiri",     "AR", 27.5450, 93.8300, 1564, "mountain",   83030),
    ("D-AR-05", "East Siang",          "AR", 28.0667, 95.3333,  153, "hilly",      99214),
    ("D-AR-06", "West Siang",          "AR", 28.1667, 94.8000,  620, "mountain",  112274),
    ("D-AR-07", "Lohit",               "AR", 27.9167, 96.1667,  231, "hilly",     145538),
    ("D-AR-08", "Changlang",           "AR", 27.1300, 95.7300,  200, "hilly",     148226),
    ("D-AR-09", "Dibang Valley",       "AR", 28.8000, 95.9000, 1968, "mountain",     8004),
    # ---- Manipur (hill districts landslide prone)
    ("D-MN-01", "Imphal West",         "MN", 24.8170, 93.9368,  786, "plain",     517992),
    ("D-MN-02", "Churachandpur",       "MN", 24.3333, 93.6833,  914, "mountain",  274143),
    ("D-MN-03", "Ukhrul",              "MN", 25.0500, 94.3667, 1662, "mountain",  183998),
    ("D-MN-04", "Tamenglong",          "MN", 24.9800, 93.5100, 1260, "mountain",  140651),
    ("D-MN-05", "Senapati",            "MN", 25.2700, 94.0200, 1061, "mountain",  479148),
    # ---- Meghalaya (highest rainfall on earth)
    ("D-ML-01", "East Khasi Hills",    "ML", 25.5788, 91.8933, 1496, "mountain",  825922),
    ("D-ML-02", "West Jaintia Hills",  "ML", 25.4500, 92.2000, 1380, "mountain",  270352),
    ("D-ML-03", "West Garo Hills",     "ML", 25.5142, 90.2026,  225, "hilly",     643291),
    ("D-ML-04", "East Garo Hills",     "ML", 25.4900, 90.6200,  450, "hilly",     317917),
    ("D-ML-05", "West Khasi Hills",    "ML", 25.5167, 91.2667, 1400, "mountain",  385601),
    # ---- Mizoram
    ("D-MZ-01", "Aizawl",              "MZ", 23.7271, 92.7176, 1132, "mountain",  400309),
    ("D-MZ-02", "Lunglei",             "MZ", 22.8800, 92.7300,  868, "mountain",  161428),
    ("D-MZ-03", "Champhai",            "MZ", 23.4736, 93.3290, 1678, "mountain",  125745),
    ("D-MZ-04", "Kolasib",             "MZ", 24.2200, 92.6800,  650, "hilly",      83955),
    ("D-MZ-05", "Serchhip",            "MZ", 23.3000, 92.8500, 1300, "mountain",   64937),
    # ---- Nagaland
    ("D-NL-01", "Kohima",              "NL", 25.6751, 94.1086, 1444, "mountain",  270063),
    ("D-NL-02", "Dimapur",             "NL", 25.9063, 93.7276,  145, "plain",     378811),
    ("D-NL-03", "Mokokchung",          "NL", 26.3220, 94.5150, 1325, "mountain",  194622),
    ("D-NL-04", "Wokha",               "NL", 26.0950, 94.2600, 1313, "mountain",  166343),
    ("D-NL-05", "Tuensang",            "NL", 26.2800, 94.8300, 1371, "mountain",  196596),
    # ---- Tripura
    ("D-TR-01", "West Tripura",        "TR", 23.8315, 91.2868,   13, "plain",     918000),
    ("D-TR-02", "North Tripura",       "TR", 24.3667, 92.1667,   45, "hilly",     417441),
    ("D-TR-03", "Dhalai",              "TR", 23.9333, 91.8500,   60, "hilly",     378230),
    ("D-TR-04", "South Tripura",       "TR", 23.2500, 91.4500,   20, "plain",     430751),
    # ---- Sikkim
    ("D-SK-01", "Gangtok",             "SK", 27.3389, 88.6065, 1650, "mountain",  283583),
    ("D-SK-02", "Mangan",              "SK", 27.5100, 88.5300, 1250, "mountain",   43709),
    ("D-SK-03", "Namchi",              "SK", 27.1667, 88.3500, 1675, "mountain",  146742),
    ("D-SK-04", "Gyalshing",           "SK", 27.2900, 88.2600, 1780, "mountain",  136299),
    # ---- Gateway (West Bengal) - Siliguri Corridor
    ("D-WB-01", "Siliguri",            "WB", 26.7271, 88.3953,  122, "plain",     701489),
]

DISTRICT_BY_ID = {d[0]: d for d in DISTRICTS}

# ---------------------------------------------------------------- corridors
# Real highway corridors. Each waypoint: (name, lat, lon, district_id)
CORRIDORS = [
    {
        "highway": "NH-27", "name": "Siliguri - Guwahati - Dibrugarh (East-West Corridor)",
        "importance": "national", "lanes": 4,
        "points": [
            ("Siliguri",       26.7271, 88.3953, "D-WB-01"),
            ("Bongaigaon",     26.4769, 90.5583, "D-AS-10"),
            ("Barpeta Road",   26.3220, 91.0050, "D-AS-10"),
            ("Nalbari",        26.4445, 91.4415, "D-AS-01"),
            ("Guwahati",       26.1445, 91.7362, "D-AS-01"),
            ("Nagaon",         26.3464, 92.6840, "D-AS-02"),
            ("Tezpur",         26.6338, 92.8000, "D-AS-09"),
            ("Golaghat",       26.5100, 93.9600, "D-AS-03"),
            ("Jorhat",         26.7509, 94.2037, "D-AS-03"),
            ("Sivasagar",      26.9850, 94.6380, "D-AS-11"),
            ("Dibrugarh",      27.4728, 94.9120, "D-AS-04"),
            ("Tinsukia",       27.4922, 95.3468, "D-AS-05"),
        ],
    },
    {
        "highway": "NH-6", "name": "Guwahati - Shillong - Silchar",
        "importance": "national", "lanes": 2,
        "points": [
            ("Guwahati",       26.1445, 91.7362, "D-AS-01"),
            ("Nongpoh",        25.9000, 91.8800, "D-ML-01"),
            ("Shillong",       25.5788, 91.8933, "D-ML-01"),
            ("Jowai",          25.4500, 92.2000, "D-ML-02"),
            ("Badarpur",       24.8697, 92.5900, "D-AS-12"),
            ("Silchar",        24.8333, 92.7789, "D-AS-06"),
        ],
    },
    {
        "highway": "NH-27-SPUR", "name": "Guwahati - Tura (Garo Hills)",
        "importance": "national", "lanes": 2,
        "points": [
            ("Guwahati",       26.1445, 91.7362, "D-AS-01"),
            ("Goalpara",       26.1667, 90.6167, "D-AS-10"),
            ("Tura",           25.5142, 90.2026, "D-ML-03"),
            ("Williamnagar",   25.4900, 90.6200, "D-ML-04"),
            ("Baghmara",       25.1900, 90.6300, "D-ML-04"),
        ],
    },
    {
        "highway": "NH-2", "name": "Dimapur - Kohima - Imphal (lifeline to Manipur)",
        "importance": "national", "lanes": 2,
        "points": [
            ("Dimapur",        25.9063, 93.7276, "D-NL-02"),
            ("Kohima",         25.6751, 94.1086, "D-NL-01"),
            ("Mao Gate",       25.5000, 94.1200, "D-MN-05"),
            ("Senapati",       25.2700, 94.0200, "D-MN-05"),
            ("Imphal",         24.8170, 93.9368, "D-MN-01"),
        ],
    },
    {
        "highway": "NH-29", "name": "Kohima - Mokokchung - Tuensang",
        "importance": "national", "lanes": 2,
        "points": [
            ("Kohima",         25.6751, 94.1086, "D-NL-01"),
            ("Wokha",          26.0950, 94.2600, "D-NL-04"),
            ("Mokokchung",     26.3220, 94.5150, "D-NL-03"),
            ("Tuensang",       26.2800, 94.8300, "D-NL-05"),
        ],
    },
    {
        "highway": "NH-37", "name": "Imphal - Tamenglong - Silchar (alternate to Manipur)",
        "importance": "national", "lanes": 2,
        "points": [
            ("Imphal",         24.8170, 93.9368, "D-MN-01"),
            ("Tamenglong",     24.9800, 93.5100, "D-MN-04"),
            ("Jiribam",        24.8000, 93.1200, "D-MN-04"),
            ("Silchar",        24.8333, 92.7789, "D-AS-06"),
        ],
    },
    {
        "highway": "NH-2-S", "name": "Imphal - Churachandpur - Ukhrul",
        "importance": "state", "lanes": 2,
        "points": [
            ("Churachandpur",  24.3333, 93.6833, "D-MN-02"),
            ("Imphal",         24.8170, 93.9368, "D-MN-01"),
            ("Ukhrul",         25.0500, 94.3667, "D-MN-03"),
        ],
    },
    {
        "highway": "NH-306", "name": "Silchar - Aizawl - Lunglei (Mizoram lifeline)",
        "importance": "national", "lanes": 2,
        "points": [
            ("Silchar",        24.8333, 92.7789, "D-AS-06"),
            ("Kolasib",        24.2200, 92.6800, "D-MZ-04"),
            ("Aizawl",         23.7271, 92.7176, "D-MZ-01"),
            ("Serchhip",       23.3000, 92.8500, "D-MZ-05"),
            ("Lunglei",        22.8800, 92.7300, "D-MZ-02"),
        ],
    },
    {
        "highway": "NH-302", "name": "Aizawl - Champhai (Myanmar border road)",
        "importance": "state", "lanes": 2,
        "points": [
            ("Aizawl",         23.7271, 92.7176, "D-MZ-01"),
            ("Champhai",       23.4736, 93.3290, "D-MZ-03"),
        ],
    },
    {
        "highway": "NH-8", "name": "Agartala - Dharmanagar (Tripura spine)",
        "importance": "national", "lanes": 2,
        "points": [
            ("Belonia",        23.2500, 91.4500, "D-TR-04"),
            ("Agartala",       23.8315, 91.2868, "D-TR-01"),
            ("Khowai",         24.0667, 91.6000, "D-TR-03"),
            ("Ambassa",        23.9333, 91.8500, "D-TR-03"),
            ("Kailashahar",    24.3167, 92.0167, "D-TR-02"),
            ("Dharmanagar",    24.3667, 92.1667, "D-TR-02"),
            ("Churaibari",     24.4200, 92.3300, "D-AS-12"),
            ("Karimganj",      24.8697, 92.3592, "D-AS-12"),
            ("Badarpur",       24.8697, 92.5900, "D-AS-12"),
        ],
    },
    {
        "highway": "NH-10", "name": "Siliguri - Gangtok (Sikkim's only lifeline)",
        "importance": "national", "lanes": 2,
        "points": [
            ("Siliguri",       26.7271, 88.3953, "D-WB-01"),
            ("Rangpo",         27.1800, 88.5300, "D-SK-01"),
            ("Singtam",        27.2350, 88.5000, "D-SK-01"),
            ("Gangtok",        27.3389, 88.6065, "D-SK-01"),
        ],
    },
    {
        "highway": "NH-310", "name": "Gangtok - Chungthang - Lachung (North Sikkim)",
        "importance": "national", "lanes": 1,
        "points": [
            ("Gangtok",        27.3389, 88.6065, "D-SK-01"),
            ("Mangan",         27.5100, 88.5300, "D-SK-02"),
            ("Chungthang",     27.6000, 88.6400, "D-SK-02"),
            ("Lachung",        27.6900, 88.7450, "D-SK-02"),
        ],
    },
    {
        "highway": "NH-510", "name": "Gangtok - Namchi - Gyalshing (South & West Sikkim)",
        "importance": "state", "lanes": 2,
        "points": [
            ("Gangtok",        27.3389, 88.6065, "D-SK-01"),
            ("Jorethang",      27.1100, 88.3200, "D-SK-03"),
            ("Namchi",         27.1667, 88.3500, "D-SK-03"),
            ("Gyalshing",      27.2900, 88.2600, "D-SK-04"),
            ("Yuksom",         27.3700, 88.2200, "D-SK-04"),
        ],
    },
    {
        "highway": "NH-15", "name": "Tezpur - Itanagar - North Lakhimpur",
        "importance": "national", "lanes": 2,
        "points": [
            ("Tezpur",             26.6338, 92.8000, "D-AS-09"),
            ("Itanagar",           27.0844, 93.6053, "D-AR-01"),
            ("North Lakhimpur",    27.2350, 94.1050, "D-AS-09"),
        ],
    },
    {
        "highway": "NH-13", "name": "Trans-Arunachal: Itanagar - Ziro - Aalo - Pasighat",
        "importance": "national", "lanes": 2,
        "points": [
            ("Itanagar",       27.0844, 93.6053, "D-AR-01"),
            ("Ziro",           27.5450, 93.8300, "D-AR-04"),
            ("Daporijo",       27.9833, 94.2167, "D-AR-06"),
            ("Aalo",           28.1667, 94.8000, "D-AR-06"),
            ("Pasighat",       28.0667, 95.3333, "D-AR-05"),
        ],
    },
    {
        "highway": "NH-13-W", "name": "Bhalukpong - Bomdila - Tawang (border road)",
        "importance": "national", "lanes": 1,
        "points": [
            ("Tezpur",         26.6338, 92.8000, "D-AS-09"),
            ("Bhalukpong",     27.0100, 92.6400, "D-AR-03"),
            ("Bomdila",        27.2650, 92.4250, "D-AR-03"),
            ("Tawang",         27.5860, 91.8590, "D-AR-02"),
        ],
    },
    {
        "highway": "NH-315", "name": "Pasighat - Roing - Tezu (East Arunachal)",
        "importance": "state", "lanes": 1,
        "points": [
            ("Pasighat",       28.0667, 95.3333, "D-AR-05"),
            ("Roing",          28.1300, 95.8300, "D-AR-09"),
            ("Tezu",           27.9167, 96.1667, "D-AR-07"),
            ("Namsai",         27.6667, 95.9000, "D-AR-07"),
        ],
    },
    {
        "highway": "NH-27-DH", "name": "Lumding - Haflong - Silchar (Dima Hasao hill route)",
        "importance": "state", "lanes": 1,
        "points": [
            ("Lumding",        25.7500, 93.1700, "D-AS-08"),
            ("Haflong",        25.1642, 93.0157, "D-AS-07"),
            ("Silchar",        24.8333, 92.7789, "D-AS-06"),
        ],
    },
    {
        "highway": "NH-36", "name": "Nagaon - Diphu - Dimapur (Karbi Anglong)",
        "importance": "state", "lanes": 2,
        "points": [
            ("Nagaon",         26.3464, 92.6840, "D-AS-02"),
            ("Diphu",          25.8400, 93.4300, "D-AS-08"),
            ("Dimapur",        25.9063, 93.7276, "D-NL-02"),
        ],
    },
]


def haversine_km(a_lat, a_lon, b_lat, b_lon):
    R = 6371.0
    p1, p2 = math.radians(a_lat), math.radians(b_lat)
    dp = math.radians(b_lat - a_lat)
    dl = math.radians(b_lon - a_lon)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(2 * R * math.asin(math.sqrt(h)), 2)


TERRAIN_SLOPE = {"plain": (1.0, 6.0), "hilly": (8.0, 22.0), "mountain": (20.0, 42.0)}
TERRAIN_SOIL = {"plain": "alluvial", "hilly": "lateritic", "mountain": "weathered_rock"}


def build_segments():
    segs = []
    n = 0
    for c in CORRIDORS:
        pts = c["points"]
        for i in range(len(pts) - 1):
            n += 1
            a, b = pts[i], pts[i + 1]
            a_name, a_lat, a_lon, a_did = a
            b_name, b_lat, b_lon, b_did = b
            da = DISTRICT_BY_ID[a_did]
            db = DISTRICT_BY_ID[b_did]
            # terrain of the harder of the two endpoints
            rank = {"plain": 0, "hilly": 1, "mountain": 2}
            terrain = da[6] if rank[da[6]] >= rank[db[6]] else db[6]
            elev = int((da[5] + db[5]) / 2)
            lo, hi = TERRAIN_SLOPE[terrain]
            slope = round(random.uniform(lo, hi), 1)
            length = haversine_km(a_lat, a_lon, b_lat, b_lon)
            # interpolate a mid vertex so the line isn't a bare straight edge
            mid_lat = round((a_lat + b_lat) / 2 + random.uniform(-0.035, 0.035), 5)
            mid_lon = round((a_lon + b_lon) / 2 + random.uniform(-0.035, 0.035), 5)
            seg = {
                "segment_id": f"SEG-{n:04d}",
                "highway_code": c["highway"],
                "corridor_name": c["name"],
                "from_name": a_name,
                "to_name": b_name,
                "from_district_id": a_did,
                "to_district_id": b_did,
                "importance": c["importance"],
                "lanes": c["lanes"],
                "length_km": length,
                "terrain": terrain,
                "avg_slope_deg": slope,
                "elevation_m": elev,
                "soil_type": TERRAIN_SOIL[terrain],
                "bridge_count": random.randint(0, 4 if terrain == "plain" else 7),
                "surface_quality": random.choice(["good", "fair", "fair", "poor"]) if terrain != "plain"
                                   else random.choice(["good", "good", "fair"]),
                "dist_to_river_km": round(random.uniform(0.2, 4.0) if terrain == "plain"
                                          else random.uniform(0.5, 18.0), 2),
                "geometry": [[a_lon, a_lat], [mid_lon, mid_lat], [b_lon, b_lat]],
            }
            segs.append(seg)
    return segs


SEGMENTS = build_segments()
SEG_BY_ID = {s["segment_id"]: s for s in SEGMENTS}

# ---------------------------------------------------------------- weather
# Indian monsoon shape: heavy Jun-Sep, dry Dec-Feb. NER is extremely wet.
MONTH_RAIN_MM = {1: 18, 2: 30, 3: 65, 4: 150, 5: 280, 6: 430,
                 7: 470, 8: 360, 9: 250, 10: 120, 11: 28, 12: 12}
# Meghalaya/upper Assam are far wetter than Tripura/Sikkim rain-shadow
STATE_RAIN_FACTOR = {"ML": 2.30, "AS": 1.15, "AR": 1.30, "MN": 0.80,
                     "MZ": 0.95, "NL": 0.85, "TR": 0.90, "SK": 1.05,
                     "WB": 1.20}  # Siliguri sits in the sub-Himalayan wet belt

WEATHER_DAYS = 120  # 120 days of daily history per district


def gen_weather():
    rows = []
    start = TODAY - timedelta(days=WEATHER_DAYS - 1)
    for d in DISTRICTS:
        did, dname, scode, lat, lon, elev, terrain, pop = d
        factor = STATE_RAIN_FACTOR[scode]
        # carry a wetness "memory" so storms last a few days, like real weather
        wet_streak = 0
        for i in range(WEATHER_DAYS):
            day = start + timedelta(days=i)
            base = MONTH_RAIN_MM[day.month] / 30.0 * factor
            if wet_streak > 0:
                mult = random.uniform(1.6, 3.4)
                wet_streak -= 1
            elif random.random() < 0.09:
                wet_streak = random.randint(1, 3)
                mult = random.uniform(2.5, 6.0)
            else:
                mult = random.uniform(0.0, 1.6)
            rain = round(max(0.0, base * mult), 1)
            temp_base = 30 - (elev / 1000.0) * 5.5
            temp_max = round(temp_base + random.uniform(-2.5, 3.5) - (rain / 60.0), 1)
            temp_min = round(temp_max - random.uniform(5.0, 10.0), 1)
            humidity = int(min(99, 58 + rain * 0.7 + random.uniform(-6, 8)))
            rows.append({
                "district_id": did,
                "district_name": dname,
                "state_code": scode,
                "obs_date": day.isoformat(),
                "rainfall_mm": rain,
                "temp_max_c": temp_max,
                "temp_min_c": temp_min,
                "humidity_pct": humidity,
                "wind_kmph": round(random.uniform(2, 26), 1),
                "source": "IMD-synthetic",
            })
    return rows


WEATHER = gen_weather()

# rolling rainfall lookup: (district_id, date) -> (r24, r72, r7d)
_by_district = {}
for w in WEATHER:
    _by_district.setdefault(w["district_id"], []).append(w)
for k in _by_district:
    _by_district[k].sort(key=lambda r: r["obs_date"])

RAIN_INDEX = {}
for did, rows in _by_district.items():
    vals = [r["rainfall_mm"] for r in rows]
    for i, r in enumerate(rows):
        r24 = vals[i]
        r72 = round(sum(vals[max(0, i - 2): i + 1]), 1)
        r7 = round(sum(vals[max(0, i - 6): i + 1]), 1)
        RAIN_INDEX[(did, r["obs_date"])] = (r24, r72, r7)


# ---------------------------------------------------------------- risk model
def risk_score(seg, r24, r72, r7, past_incidents):
    """Physically-motivated score. Same formula used for labels and for the
    'current' status so the dataset stays internally consistent."""
    s = 0.0
    s += (r72 / 100.0) * 2.6            # saturated soil is the main trigger
    s += (r24 / 100.0) * 1.7            # today's burst
    s += (r7 / 400.0) * 1.1             # season-long saturation
    s += (seg["avg_slope_deg"] / 10.0) * 1.5
    s += (seg["elevation_m"] / 1000.0) * 0.45
    s += past_incidents * 0.55
    s += {"good": 0.0, "fair": 0.5, "poor": 1.2}[seg["surface_quality"]]
    s += seg["bridge_count"] * 0.10
    if seg["terrain"] == "plain":       # plains flood instead of sliding
        s += max(0.0, (r72 - 120) / 100.0) * 1.8
        s -= 0.8
    if seg["dist_to_river_km"] < 1.5:
        s += 0.7
    return round(s, 3)


def risk_label(s):
    # Thresholds calibrated against the score distribution so the classes come
    # out realistically: most road-days are fine, a minority are genuinely bad.
    if s >= 9.8:
        return "high"
    if s >= 6.5:
        return "medium"
    return "low"


# stable per-segment incident history count
SEG_HISTORY = {s["segment_id"]: (random.randint(0, 5) if s["terrain"] == "mountain"
                                 else random.randint(0, 3) if s["terrain"] == "hilly"
                                 else random.randint(0, 1))
               for s in SEGMENTS}

# ---------------------------------------------------------------- ML dataset
def gen_ml_rows():
    rows = []
    dates = sorted({w["obs_date"] for w in WEATHER})
    for seg in SEGMENTS:
        did = seg["from_district_id"]
        hist = SEG_HISTORY[seg["segment_id"]]
        for dt in dates:
            key = (did, dt)
            if key not in RAIN_INDEX:
                continue
            r24, r72, r7 = RAIN_INDEX[key]
            s = risk_score(seg, r24, r72, r7, hist)
            # a little label noise so the model has something real to learn
            s_noisy = s + random.gauss(0, 0.35)
            rows.append({
                "segment_id": seg["segment_id"],
                "obs_date": dt,
                "rainfall_24h_mm": r24,
                "rainfall_72h_mm": r72,
                "rainfall_7d_mm": r7,
                "avg_slope_deg": seg["avg_slope_deg"],
                "elevation_m": seg["elevation_m"],
                "dist_to_river_km": seg["dist_to_river_km"],
                "past_incident_count": hist,
                "bridge_count": seg["bridge_count"],
                "lanes": seg["lanes"],
                "terrain": seg["terrain"],
                "soil_type": seg["soil_type"],
                "surface_quality": seg["surface_quality"],
                "risk_score": round(s, 3),
                "risk_label": risk_label(s_noisy),
            })
    return rows


ML_ROWS = gen_ml_rows()

# ---------------------------------------------------------------- live status
TODAY_STR = TODAY.isoformat()


def gen_current_status():
    out = []
    for seg in SEGMENTS:
        did = seg["from_district_id"]
        r24, r72, r7 = RAIN_INDEX[(did, TODAY_STR)]
        s = risk_score(seg, r24, r72, r7, SEG_HISTORY[seg["segment_id"]])
        label = risk_label(s)
        if label == "high":
            status = random.choice(["blocked", "restricted", "restricted"])
        elif label == "medium":
            status = random.choice(["open", "restricted"])
        else:
            status = "open"
        delay = {"open": 0, "restricted": random.randint(25, 120),
                 "blocked": random.randint(180, 900)}[status]
        out.append({
            "segment_id": seg["segment_id"],
            "as_of": TODAY_STR,
            "risk_score": round(s, 3),
            "risk_level": label,
            "status": status,
            "estimated_delay_min": delay,
            "rainfall_24h_mm": r24,
            "rainfall_72h_mm": r72,
            "confidence": round(random.uniform(0.72, 0.97), 2),
        })
    return out


STATUS = gen_current_status()
STATUS_BY_ID = {s["segment_id"]: s for s in STATUS}

# ---------------------------------------------------------------- incidents
INCIDENT_TYPES = ["landslide", "flood", "road_damage", "bridge_damage",
                  "tree_fall", "congestion", "accident"]
SEVERITY = ["low", "medium", "high", "critical"]
REPORTERS = [
    ("USR-001", "R. Hazarika",   "PWD Field Officer",        "Assam"),
    ("USR-002", "L. Syiem",      "District Disaster Officer", "Meghalaya"),
    ("USR-003", "T. Lotha",      "NH Maintenance Engineer",   "Nagaland"),
    ("USR-004", "K. Lalrinmawia","Block Development Officer", "Mizoram"),
    ("USR-005", "P. Tsering",    "Border Roads Supervisor",   "Arunachal Pradesh"),
    ("USR-006", "S. Debbarma",   "Transport Dept Inspector",  "Tripura"),
    ("USR-007", "N. Bhutia",     "Disaster Response Officer",  "Sikkim"),
    ("USR-008", "M. Singh",      "PWD Field Officer",          "Manipur"),
]


def gen_incidents(n=140):
    out = []
    # bias incidents toward genuinely risky segments
    weighted = []
    for s in SEGMENTS:
        w = {"mountain": 5, "hilly": 3, "plain": 1}[s["terrain"]]
        weighted += [s] * w
    for i in range(1, n + 1):
        seg = random.choice(weighted)
        days_ago = random.randint(0, WEATHER_DAYS - 1)
        when = TODAY - timedelta(days=days_ago)
        if seg["terrain"] == "plain":
            itype = random.choice(["flood", "road_damage", "congestion", "accident", "tree_fall"])
        else:
            itype = random.choice(["landslide", "landslide", "road_damage",
                                   "bridge_damage", "tree_fall", "flood"])
        sev = random.choices(SEVERITY, weights=[30, 38, 24, 8])[0]
        rep = random.choice(REPORTERS)
        a = seg["geometry"][0]
        b = seg["geometry"][-1]
        t = random.uniform(0.15, 0.85)
        lon = round(a[0] + (b[0] - a[0]) * t, 5)
        lat = round(a[1] + (b[1] - a[1]) * t, 5)
        resolved = days_ago > random.randint(1, 12)
        out.append({
            "incident_id": f"INC-{i:04d}",
            "segment_id": seg["segment_id"],
            "district_id": seg["from_district_id"],
            "incident_type": itype,
            "severity": sev,
            "latitude": lat,
            "longitude": lon,
            "reported_at": datetime.combine(
                when, datetime.min.time()).replace(
                hour=random.randint(5, 21), minute=random.choice([0, 15, 30, 45])).isoformat(),
            "reported_by_id": rep[0],
            "reported_by_name": rep[1],
            "reporter_role": rep[2],
            "description": f"{itype.replace('_',' ').title()} reported on {seg['highway_code']} "
                           f"between {seg['from_name']} and {seg['to_name']}.",
            "photo_url": f"/uploads/incidents/INC-{i:04d}.jpg",
            "status": "resolved" if resolved else random.choice(["open", "in_progress"]),
            "synced_offline": random.choice([True, False, False]),
            "verified": random.choice([True, True, False]),
        })
    return out


INCIDENTS = gen_incidents()

# ---------------------------------------------------------------- vehicles
CARGO = ["medicines", "food_grains", "fuel", "construction_material",
         "agri_produce", "relief_supplies", "lpg_cylinders", "vaccines"]
OPERATORS = ["NE Logistics Pvt Ltd", "Brahmaputra Carriers", "Hill Route Transport",
             "Assam State Transport", "Seven Sisters Freight", "Himalayan Movers"]


def gen_vehicles(n=40):
    out = []
    plates = ["AS", "AR", "MN", "ML", "MZ", "NL", "TR", "SK"]
    for i in range(1, n + 1):
        seg = random.choice(SEGMENTS)
        st = random.choice(plates)
        out.append({
            "vehicle_id": f"VEH-{i:03d}",
            "registration_no": f"{st}-{random.randint(1,31):02d}-"
                               f"{random.choice('ABCDEFGHJKLMNPQRSTUVWXYZ')}"
                               f"{random.choice('ABCDEFGHJKLMNPQRSTUVWXYZ')}-"
                               f"{random.randint(1000,9999)}",
            "vehicle_type": random.choice(["truck", "truck", "tanker", "mini_truck", "ambulance"]),
            "operator": random.choice(OPERATORS),
            "cargo_type": random.choice(CARGO),
            "capacity_tonnes": random.choice([3.5, 7.5, 9, 12, 16, 25]),
            "driver_name": random.choice(
                ["B. Das", "T. Marak", "J. Rongmei", "H. Lalthanga", "D. Sonowal",
                 "A. Rabha", "K. Jamir", "P. Chakma", "R. Lepcha", "S. Kashung"]),
            "driver_phone": f"+91-9{random.randint(100000000, 999999999)}",
            "origin_district_id": seg["from_district_id"],
            "destination_district_id": seg["to_district_id"],
            "current_segment_id": seg["segment_id"],
            "status": random.choices(
                ["in_transit", "delayed", "halted", "delivered"],
                weights=[52, 22, 10, 16])[0],
        })
    return out


VEHICLES = gen_vehicles()


def gen_gps_tracks():
    """One GPS ping trail per vehicle along its current segment."""
    out = []
    pid = 0
    for v in VEHICLES:
        seg = SEG_BY_ID[v["current_segment_id"]]
        geom = seg["geometry"]
        n_pings = random.randint(6, 14)
        base_time = datetime.combine(TODAY, datetime.min.time()).replace(hour=6)
        for k in range(n_pings):
            pid += 1
            t = k / max(1, n_pings - 1)
            # walk along the 3-vertex polyline
            if t <= 0.5:
                a, b, tt = geom[0], geom[1], t / 0.5
            else:
                a, b, tt = geom[1], geom[2], (t - 0.5) / 0.5
            lon = round(a[0] + (b[0] - a[0]) * tt, 5)
            lat = round(a[1] + (b[1] - a[1]) * tt, 5)
            speed = 0.0 if v["status"] == "halted" else round(random.uniform(12, 58), 1)
            out.append({
                "ping_id": f"GPS-{pid:05d}",
                "vehicle_id": v["vehicle_id"],
                "segment_id": seg["segment_id"],
                "latitude": lat,
                "longitude": lon,
                "speed_kmph": speed,
                "heading_deg": random.randint(0, 359),
                "recorded_at": (base_time + timedelta(minutes=25 * k)).isoformat(),
            })
    return out


GPS = gen_gps_tracks()

# ---------------------------------------------------------------- alerts
LANGS = {
    "en": "English", "as": "Assamese", "bn": "Bengali", "mni": "Meiteilon (Manipuri)",
    "kha": "Khasi", "lus": "Mizo", "nag": "Nagamese", "ne": "Nepali", "brx": "Bodo",
}
ALERT_TEXT = {
    "en": "Route {hw} between {a} and {b} is {st}. Estimated delay {d} minutes. Use alternate route.",
    "as": "{a} আৰু {b} ৰ মাজৰ {hw} পথ {st}। আনুমানিক পলম {d} মিনিট। বিকল্প পথ ব্যৱহাৰ কৰক।",
    "bn": "{a} এবং {b} এর মধ্যে {hw} সড়কটি {st}। আনুমানিক বিলম্ব {d} মিনিট। বিকল্প পথ ব্যবহার করুন।",
    "ne": "{a} र {b} बीचको {hw} मार्ग {st} छ। अनुमानित ढिलाइ {d} मिनेट। वैकल्पिक मार्ग प्रयोग गर्नुहोस्।",
    "lus": "{a} leh {b} inkar {hw} kawng chu {st} a ni. Hun hlawhtling {d} minute. Kawng dang hmang rawh.",
    "kha": "Ka lynti {hw} hapdeng {a} bad {b} ka long {st}. Ka por bakla {d} minit.",
    "mni": "{a} amasung {b} gi marakta leiba {hw} lambi asi {st} ni. Delay {d} minute.",
    "nag": "{a} aru {b} majot {hw} rasta {st} ase. Deri {d} minute hobo. Dusra rasta lagai.",
    "brx": "{a} आरो {b} नि गेजेरनि {hw} लामा {st}। बिबेब समाव {d} मिनिट।",
}


def gen_alerts():
    out = []
    aid = 0
    risky = [s for s in STATUS if s["risk_level"] in ("high", "medium")]
    for st in risky:
        seg = SEG_BY_ID[st["segment_id"]]
        aid += 1
        state_code = DISTRICT_BY_ID[seg["from_district_id"]][2]
        primary = {"AS": "as", "ML": "kha", "MN": "mni", "MZ": "lus",
                   "NL": "nag", "TR": "bn", "SK": "ne", "AR": "en",
                   "WB": "bn"}[state_code]
        langs = ["en", primary]
        msgs = {}
        for lg in langs:
            msgs[lg] = ALERT_TEXT[lg].format(
                hw=seg["highway_code"], a=seg["from_name"], b=seg["to_name"],
                st=st["status"], d=st["estimated_delay_min"])
        out.append({
            "alert_id": f"ALT-{aid:04d}",
            "segment_id": seg["segment_id"],
            "district_id": seg["from_district_id"],
            "alert_type": "road_blocked" if st["status"] == "blocked" else "high_risk_route",
            "severity": "critical" if st["status"] == "blocked" else
                        ("high" if st["risk_level"] == "high" else "medium"),
            "issued_at": datetime.combine(
                TODAY, datetime.min.time()).replace(
                hour=random.randint(5, 20), minute=random.choice([0, 10, 20, 30, 40, 50])).isoformat(),
            "expires_at": (datetime.combine(TODAY, datetime.min.time())
                           + timedelta(days=random.randint(1, 3))).isoformat(),
            "channels": random.choice([["push", "sms"], ["push"], ["push", "sms", "ivr"]]),
            "languages": langs,
            "messages": msgs,
            "acknowledged": random.choice([True, False]),
        })
    return out


ALERTS = gen_alerts()

# ---------------------------------------------------------------- write files
def w_json(rel, obj):
    p = os.path.join(OUT, rel)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)
    return p


def w_csv(rel, rows, fields=None):
    p = os.path.join(OUT, rel)
    fields = fields or list(rows[0].keys())
    with open(p, "w", newline="", encoding="utf-8") as f:
        wtr = csv.DictWriter(f, fieldnames=fields)
        wtr.writeheader()
        wtr.writerows(rows)
    return p


# --- frontend: districts GeoJSON (points) ---
districts_geojson = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [d[4], d[3]]},
        "properties": {
            "district_id": d[0], "name": d[1], "state_code": d[2],
            "state_name": next(s["name"] for s in STATES if s["code"] == d[2]),
            "elevation_m": d[5], "terrain": d[6], "population": d[7],
        },
    } for d in DISTRICTS],
}
w_json("frontend/districts.geojson", districts_geojson)

# --- frontend: roads GeoJSON with live risk baked in ---
roads_geojson = {
    "type": "FeatureCollection",
    "features": [],
}
for seg in SEGMENTS:
    st = STATUS_BY_ID[seg["segment_id"]]
    props = {k: v for k, v in seg.items() if k != "geometry"}
    props.update({
        "risk_level": st["risk_level"],
        "risk_score": st["risk_score"],
        "status": st["status"],
        "estimated_delay_min": st["estimated_delay_min"],
        "color": {"low": "#2C8C5E", "medium": "#E8A22A", "high": "#C0392B"}[st["risk_level"]],
    })
    roads_geojson["features"].append({
        "type": "Feature",
        "geometry": {"type": "LineString", "coordinates": seg["geometry"]},
        "properties": props,
    })
w_json("frontend/road_segments.geojson", roads_geojson)

# --- frontend: incidents GeoJSON ---
inc_geojson = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [i["longitude"], i["latitude"]]},
        "properties": {k: v for k, v in i.items() if k not in ("latitude", "longitude")},
    } for i in INCIDENTS],
}
w_json("frontend/incidents.geojson", inc_geojson)

# --- frontend: plain JSON feeds ---
w_json("frontend/states.json", STATES)
w_json("frontend/vehicles.json", VEHICLES)
w_json("frontend/gps_tracks.json", GPS)
w_json("frontend/alerts.json", ALERTS)
w_json("frontend/route_status.json", STATUS)

# dashboard rollup: per-district summary the UI can render without computing
rollup = []
for d in DISTRICTS:
    did = d[0]
    segs = [s for s in SEGMENTS if s["from_district_id"] == did or s["to_district_id"] == did]
    sts = [STATUS_BY_ID[s["segment_id"]] for s in segs]
    open_n = sum(1 for s in sts if s["status"] == "open")
    restr = sum(1 for s in sts if s["status"] == "restricted")
    blocked = sum(1 for s in sts if s["status"] == "blocked")
    r24, r72, r7 = RAIN_INDEX[(did, TODAY_STR)]
    inc_open = sum(1 for i in INCIDENTS if i["district_id"] == did and i["status"] != "resolved")
    worst = "low"
    for s in sts:
        if s["risk_level"] == "high":
            worst = "high"
            break
        if s["risk_level"] == "medium":
            worst = "medium"
    rollup.append({
        "district_id": did, "district_name": d[1], "state_code": d[2],
        "latitude": d[3], "longitude": d[4], "terrain": d[6], "population": d[7],
        "segments_total": len(segs), "segments_open": open_n,
        "segments_restricted": restr, "segments_blocked": blocked,
        "worst_risk_level": worst,
        "rainfall_24h_mm": r24, "rainfall_72h_mm": r72, "rainfall_7d_mm": r7,
        "open_incidents": inc_open,
        "accessibility_pct": round(100.0 * open_n / len(segs), 1) if segs else 100.0,
    })
w_json("frontend/district_status.json", rollup)

# --- ml + tabular ---
w_csv("ml/risk_training_data.csv", ML_ROWS)
w_csv("ml/weather_history.csv", WEATHER)
w_csv("ml/road_segments.csv", [
    {k: v for k, v in s.items() if k != "geometry"} for s in SEGMENTS])
w_csv("ml/incidents.csv", INCIDENTS)

print(json.dumps({
    "states": len(STATES),
    "districts": len(DISTRICTS),
    "road_segments": len(SEGMENTS),
    "weather_rows": len(WEATHER),
    "ml_rows": len(ML_ROWS),
    "incidents": len(INCIDENTS),
    "vehicles": len(VEHICLES),
    "gps_pings": len(GPS),
    "alerts": len(ALERTS),
    "district_rollup": len(rollup),
}, indent=2))
