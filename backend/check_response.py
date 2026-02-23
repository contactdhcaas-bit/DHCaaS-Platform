import requests
import json

url = 'http://localhost:8000/api/v1/analysis/scan'

with open('customers_data.csv', 'rb') as f:
    files = {'file': ('customers_data.csv', f, 'text/csv')}
    response = requests.post(url, files=files)
    
print('Status Code:', response.status_code)
print('\nFull Response:')
print(json.dumps(response.json(), indent=2))
