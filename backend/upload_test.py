import requests

url = 'http://localhost:8000/api/v2/scan/advanced'

with open('customers_data.csv', 'rb') as f:
    files = {'file': ('customers_data.csv', f, 'text/csv')}
    response = requests.post(url, files=files)
    
print('Status:', response.status_code)
print('Response:', response.json())
