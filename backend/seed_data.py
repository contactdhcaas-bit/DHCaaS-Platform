import asyncio
from database import scans_col
from datetime import datetime

async def add_test_data():
    test_scans = [
        {
            'filename': 'users_table.csv',
            'compliance_score': 88.5,
            'has_pii': True,
            'owner': 'Analytics Team',
            'created_at': datetime.now(),
            'database_type': 'MySQL Production',
            'total_rows': 15420
        },
        {
            'filename': 'orders_history.csv',
            'compliance_score': 92.3,
            'has_pii': False,
            'owner': 'Sales Team',
            'created_at': datetime.now(),
            'database_type': 'PostgreSQL',
            'total_rows': 48302
        },
        {
            'filename': 'products_catalog.csv',
            'compliance_score': 85.7,
            'has_pii': False,
            'owner': 'Product Team',
            'created_at': datetime.now(),
            'database_type': 'MySQL Production',
            'total_rows': 3204
        },
        {
            'filename': 'customer_profiles.csv',
            'compliance_score': 78.9,
            'has_pii': True,
            'owner': 'Marketing Team',
            'created_at': datetime.now(),
            'database_type': 'MongoDB',
            'total_rows': 9876
        }
    ]
    
    result = await scans_col.insert_many(test_scans)
    print(f'✅ Inserted {len(result.inserted_ids)} documents')
    
    count = await scans_col.count_documents({})
    print(f'📊 Total documents in database: {count}')

asyncio.run(add_test_data())
