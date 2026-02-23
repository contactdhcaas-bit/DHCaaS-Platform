import requests

# Run validation
job_id = "a4df64f4-81a0-4feb-b318-da708635d8d6"
response = requests.post(f"http://localhost:8000/api/v1/rules/validate/{job_id}")

print("✅ Validation Response:")
print(f"Status: {response.status_code}")
print(f"Result: {response.json()}")
