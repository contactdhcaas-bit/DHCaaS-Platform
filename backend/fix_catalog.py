from pymongo import MongoClient
from datetime import datetime, timezone

client = MongoClient('mongodb://localhost:27017')
db = client['dhcaas']
collection = db['catalog']

# Get the item
item = collection.find_one({'name': 'customers_data.csv'})

if item:
    print(f'Found item: {item["_id"]}')
    
    # Ensure all required fields exist
    if 'created_at' not in item or not isinstance(item['created_at'], datetime):
        item['created_at'] = datetime.now(timezone.utc)
    
    if 'updated_at' not in item or not isinstance(item['updated_at'], datetime):
        item['updated_at'] = datetime.now(timezone.utc)
    
    # Update
    collection.replace_one({'_id': item['_id']}, item)
    print('✅ Item fixed')
    
    # Fetch again
    updated = collection.find_one({'_id': item['_id']})
    print(f'Name: {updated["name"]}')
    print(f'Tags: {updated["tags"]}')
    print(f'Columns: {len(updated["columns"])}')
else:
    print('❌ Item not found')

client.close()
