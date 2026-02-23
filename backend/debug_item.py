from pymongo import MongoClient
import json

client = MongoClient('mongodb://localhost:27017')
db = client['dhcaas']
collection = db['catalog']

item = collection.find_one({'name': 'customers_data.csv'})

if item:
    # Convert ObjectId to string
    item['_id'] = str(item['_id'])
    
    print('Item from MongoDB:')
    print(json.dumps(item, indent=2, default=str))
    
    # Check required fields for CatalogItem model
    required = ['name', 'description', 'tags', 'columns', 'row_count', 'quality_score', 'created_at', 'updated_at']
    
    print('\n\nField Check:')
    for field in required:
        exists = field in item
        value = item.get(field, 'MISSING')
        print(f'  {field}: {"✅" if exists else "❌"} = {type(value).__name__}')

client.close()
