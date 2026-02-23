import requests
import json
from pymongo import MongoClient
from datetime import datetime, timezone

# Scan file
url = 'http://localhost:8000/api/v1/analysis/scan'
with open('customers_data.csv', 'rb') as f:
    files = {'file': ('customers_data.csv', f, 'text/csv')}
    response = requests.post(url, files=files)

scan_data = response.json()
print('✅ Scan completed')

# Extract tags from classification
tags = set()
for col_name, col_data in scan_data.get('smart_tags', {}).items():
    category = col_data.get('category', '')
    sensitivity = col_data.get('sensitivity', '')
    if category:
        tags.add(category)
    if sensitivity:
        tags.add(sensitivity)

tags = sorted([t for t in tags if t])

print(f'📊 Tags extracted: {tags}')

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017')
db = client['dhcaas']
collection = db['catalog']

# Create catalog item from scan data
catalog_item = {
    'name': scan_data['file_name'],
    'description': f"Dataset with {scan_data['dataset_summary']['total_columns']} columns and {scan_data['dataset_summary']['total_rows']} rows. Contains {scan_data['dataset_summary']['pii_columns']} PII columns.",
    'tags': tags,
    'columns': [
        {
            'name': col['name'],
            'data_type': col['data_type'],
            'tags': [col['ai_classification']['category'], col['ai_classification']['sensitivity']],
            'null_count': col['null_count'],
            'unique_count': col['unique_count'],
            'sample_values': col.get('sample_values', [])[:5]
        }
        for col in scan_data['columns']
    ],
    'row_count': scan_data['dataset_summary']['total_rows'],
    'quality_score': 85.5,
    'owner_id': 'system',
    'scan_id': scan_data['analysis_id'],
    'total_incidents': 0,
    'critical_incidents': 0,
    'created_at': datetime.now(timezone.utc),
    'updated_at': datetime.now(timezone.utc),
    'last_scanned_at': datetime.now(timezone.utc)
}

# Insert or update (FIXED)
result = collection.replace_one(
    {'name': scan_data['file_name']},
    catalog_item,
    upsert=True
)

if result.upserted_id:
    print(f'✅ New catalog item created: {result.upserted_id}')
else:
    print(f'✅ Catalog item updated for: {scan_data["file_name"]}')

print(f'📊 Tags: {", ".join(tags)}')

# Verify
count = collection.count_documents({})
print(f'📂 Total catalog items: {count}')

client.close()
