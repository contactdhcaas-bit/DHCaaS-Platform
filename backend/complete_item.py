from pymongo import MongoClient
from datetime import datetime, timezone

client = MongoClient('mongodb://localhost:27017')
db = client['dhcaas']
collection = db['catalog']

# Update to ensure all fields are correct
collection.update_one(
    {'name': 'customers_data.csv'},
    {
        '$set': {
            'last_scanned_at': datetime.now(timezone.utc),
            'owner_id': None
        }
    }
)

print('✅ Item updated with all required fields')

# Check item
item = collection.find_one({'name': 'customers_data.csv'})
print(f'Fields: {list(item.keys())}')

client.close()
