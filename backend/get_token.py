import requests

url = "https://pfuotjcjgccjvddnyrsv.supabase.co"

api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdW90amNqZ2NjanZkZG55cnN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMTg0NTAsImV4cCI6MjA5NzY5NDQ1MH0.fO4WpjANz_fqqXE5D15bJMz1gLUjeT4t6W5WUQcWEhk"

r = requests.post(
    f"{url}/auth/v1/token?grant_type=password",
    headers={
        "apikey": api_key,
        "Content-Type": "application/json"
    },
    json={
        "email": "test1@example.com",
        "password": "Password123!"
    }
)

print(r.status_code)
print(r.json())