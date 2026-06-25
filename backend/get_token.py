# WARNING: This is a dev-only script. Do NOT use in production.
# Replace placeholders below with actual values from your .env file.
import os
import requests
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("SUPABASE_URL", "https://pfuotjcjgccjvddnyrsv.supabase.co")

api_key = os.getenv("SUPABASE_ANON_KEY", "your_supabase_anon_key_here")

r = requests.post(
    f"{url}/auth/v1/token?grant_type=password",
    headers={"apikey": api_key, "Content-Type": "application/json"},
    json={"email": "test1@example.com", "password": "Password123!"},
)

print(r.status_code)
print(r.json())
