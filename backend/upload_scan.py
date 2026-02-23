import requests
import json

url = 'http://localhost:8000/api/v1/analysis/scan'

with open('customers_data.csv', 'rb') as f:
    files = {'file': ('customers_data.csv', f, 'text/csv')}
    response = requests.post(url, files=files)
    
if response.status_code == 200:
    result = response.json()
    print('\n' + '='*70)
    print('✅ SCAN COMPLETED SUCCESSFULLY')
    print('='*70)
    print(f"Score: {result.get('score', 'N/A')}/100")
    print(f"Rows: {result.get('rows', 'N/A')}")
    print(f"Columns: {result.get('columns', 'N/A')}")
    print(f"Tags: {', '.join(result.get('tags', []))}")
    print(f"Issues: {len(result.get('issues', []))}")
    print('='*70)
    print('\nFull Response:')
    print(json.dumps(result, indent=2))
else:
    print('Error:', response.text)
