from app.models.catalog import CatalogItem, ColumnMetadata
from pymongo import MongoClient
from bson import ObjectId

client = MongoClient('mongodb://localhost:27017')
db = client['dhcaas']
collection = db['catalog']

item = collection.find_one({'name': 'customers_data.csv'})
item['_id'] = str(item['_id'])

print('Trying to create CatalogItem from MongoDB data...\n')

try:
    catalog_item = CatalogItem(**item)
    print('✅ SUCCESS! Model validation passed')
    print(f'Name: {catalog_item.name}')
    print(f'Tags: {catalog_item.tags}')
except Exception as e:
    print(f'❌ VALIDATION ERROR:')
    print(f'{type(e).__name__}: {str(e)}')
    print('\nThis is the issue preventing API from returning data!')

client.close()
