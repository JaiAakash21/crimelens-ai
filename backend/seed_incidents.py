#!/usr/bin/env python3
"""Seed 25 incidents in two clusters around Bangalore via the FastAPI app.

Cluster A: 15 incidents within 100m of (12.9716, 77.5946)
Cluster B: 10 incidents within 100m of (12.9352, 77.6245)

Usage:
    python seed_incidents.py

Requires:
    pip install requests python-dotenv
    A running FastAPI server (default http://localhost:8000)
    A .env file with SUPABASE_URL and SUPABASE_ANON_KEY
"""

import math
import os
import random
import sys
from datetime import datetime, timezone, timedelta

import requests
from dotenv import load_dotenv

load_dotenv()

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

INCIDENT_TYPES = ["theft", "assault", "vandalism"]

RADIUS_M = 100.0

# degrees-per-meter at ~13°N
LAT_DEG_PER_M = 1.0 / 111_111.0
LNG_DEG_PER_M = 1.0 / (111_111.0 * math.cos(math.radians(12.95)))

CLUSTERS = [
    {"label": "A", "count": 15, "center_lat": 12.9716, "center_lng": 77.5946},
    {"label": "B", "count": 10, "center_lat": 12.9352, "center_lng": 77.6245},
]

TITLES = [
    "Phone snatched near bus stop",
    "Bag stolen from parked car",
    "Wallet pickpocketed in market",
    "Bicycle stolen from outside store",
    "Laptop taken from coffee shop",
    "Purse grabbed on footpath",
    "Cash stolen from shop counter",
    "Package stolen from doorstep",
    "Jewelry snatched on main road",
    "Motorcycle stolen overnight",
    "Group assaulted near park",
    "Woman pushed and robbed",
    "Man attacked after ATM visit",
    "Teens assaulted outside mall",
    "Driver assaulted during road rage",
    "Pedestrian struck and robbed",
    "Elderly man shoved for phone",
    "Woman harassed on bus stop",
    "Couple threatened for valuables",
    "Delivery rider attacked",
    "Street light broken near junction",
    "Park bench destroyed overnight",
    "Graffiti sprayed on wall",
    "Mailbox smashed on corner road",
    "Car window smashed overnight",
    "Fence torn near construction site",
    "Bus stop shelter damaged",
    "Shop sign vandalized",
    "Public trash can set on fire",
    "Traffic mirror shattered",
]

DESCRIPTIONS = [
    "The victim reported the incident to nearby authorities. The area has limited CCTV coverage and street lighting is poor.",
    "Bystanders attempted to help but the perpetrators fled before police arrived. The area is known for similar incidents.",
    "Local residents heard commotion and called the helpline. The incident occurred during evening hours when visibility was low.",
    "Security footage from a neighboring building is being reviewed. The suspect was described as wearing dark clothing.",
    "The victim sustained minor injuries and was treated at a nearby clinic. A formal complaint has been filed.",
    "Police have increased patrols in the area following this and similar recent incidents reported by residents.",
    "The area has been flagged as a potential hotspot by community safety groups. Residents are urged to remain cautious.",
    "An investigation is underway and local authorities are appealing for any witnesses to come forward with information.",
    "This is the third such incident reported this month in the same vicinity. Community watch programs are being strengthened.",
    "The victim managed to note down the license plate number of the vehicle used by the suspects and has shared it with police.",
]


def sign_in() -> str:
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
    }
    # Replace with your test credentials
    payload = {
        "email": "your_test_email@example.com",
        "password": "your_test_password_here",
    }
    resp = requests.post(url, json=payload, headers=headers)
    resp.raise_for_status()
    data = resp.json()
    token = data["access_token"]
    print(f"Signed in as {data['user']['email']} (user_id: {data['user']['id']})")
    return token


def random_point_within_100m(center_lat: float, center_lng: float):
    angle = random.uniform(0, 2 * math.pi)
    r = random.uniform(0, RADIUS_M)
    dlat = r * math.cos(angle) * LAT_DEG_PER_M
    dlng = r * math.sin(angle) * LNG_DEG_PER_M
    return round(center_lat + dlat, 6), round(center_lng + dlng, 6)


def random_past_datetime():
    minutes_ago = random.randint(30, 60 * 24 * 14)
    dt = datetime.now(timezone.utc) - timedelta(minutes=minutes_ago)
    return dt.isoformat()


def main():
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        print("ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env")
        sys.exit(1)

    print(f"API: {API_BASE_URL}")
    print(f"Supabase: {SUPABASE_URL}\n")

    token = sign_in()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    created_ids = []
    cluster_counts: dict[str, int] = {}
    idx = 0
    for cluster in CLUSTERS:
        cluster_counts[cluster["label"]] = 0
        for _ in range(cluster["count"]):
            idx += 1
            lat, lng = random_point_within_100m(
                cluster["center_lat"], cluster["center_lng"]
            )
            title = random.choice(TITLES)
            description = random.choice(DESCRIPTIONS)
            incident_type = random.choice(INCIDENT_TYPES)
            occurred_at = random_past_datetime()

            payload = {
                "title": title,
                "description": description,
                "incident_type": incident_type,
                "lat": lat,
                "lng": lng,
                "occurred_at": occurred_at,
            }

            resp = requests.post(
                f"{API_BASE_URL}/api/v1/incidents",
                json=payload,
                headers=headers,
            )

            if resp.status_code == 201:
                data = resp.json()
                created_ids.append(data["id"])
                cluster_counts[cluster["label"]] += 1
                print(
                    f"  [{idx}/25] Cluster {cluster['label']}  ({lat}, {lng})  {incident_type}  →  {data['id']}"
                )
            else:
                print(f"  [{idx}/25] FAILED ({resp.status_code}): {resp.text[:200]}")

    print(f"\n=== Created {len(created_ids)} incidents ===")
    print(f"  Cluster A (12.9716, 77.5946): {cluster_counts.get('A', 0)} created")
    print(f"  Cluster B (12.9352, 77.6245): {cluster_counts.get('B', 0)} created")
    for cid in created_ids:
        print(f"  {cid}")
    print()


if __name__ == "__main__":
    main()
