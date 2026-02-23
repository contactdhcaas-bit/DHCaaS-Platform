from pymongo import MongoClient
from datetime import datetime, timezone

client = MongoClient('mongodb://localhost:27017')
db = client['dhcaas']
collection = db['catalog']

# Delete old item
collection.delete_many({'name': 'customers_data.csv'})
print('🗑️  Old item deleted')

# Create new item with exact Pydantic schema
catalog_item = {
    'name': 'customers_data.csv',
    'description': 'Customer dataset with 9 columns and 3 rows containing PII and financial data',
    'tags': ['Contact', 'Financial', 'High', 'Location', 'Medium', 'PII/Sensitive', 'Technical'],
    'columns': [
        {'name': 'customer_id', 'data_type': 'int64', 'sample_values': [1, 2, 3], 'null_count': 0, 'unique_count': 3, 'tags': ['Technical']},
        {'name': 'email', 'data_type': 'object', 'sample_values': ['john.doe@email.com'], 'null_count': 0, 'unique_count': 3, 'tags': ['PII/Sensitive']},
        {'name': 'phone', 'data_type': 'object', 'sample_values': ['555-1234'], 'null_count': 0, 'unique_count': 3, 'tags': ['Contact']},
        {'name': 'first_name', 'data_type': 'object', 'sample_values': ['John', 'Jane', 'Bob'], 'null_count': 0, 'unique_count': 3, 'tags': ['Contact']},
        {'name': 'salary', 'data_type': 'int64', 'sample_values': [75000, 85000, 65000], 'null_count': 0, 'unique_count': 3, 'tags': ['Financial']},
    ],
    'row_count': 3,
    'quality_score': 85.5,
    'owner_id': 'system',
    'scan_id': 'test-scan-001',
    'total_incidents': 0,
    'critical_incidents': 0,
    'created_at': datetime.now(timezone.utc),
    'updated_at': datetime.now(timezone.utc),
    'last_scanned_at': datetime.now(timezone.utc)
}

result = collection.insert_one(catalog_item)
print(f'✅ New item created: {result.inserted_id}')

# Verify
count = collection.count_documents({})
print(f'📊 Total items: {count}')

client.close()
