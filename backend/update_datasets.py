# update_datasets.py
"""
Update dataset metadata in MongoDB to point to actual CSV files
"""

from app.database import get_sync_database

def update_dataset_file_paths():
    """Update file paths for sample datasets"""
    try:
        db = get_sync_database()
        datasets_col = db["datasets"]
        
        # Update sample_sales
        result1 = datasets_col.update_one(
            {"id": "sample_sales"},
            {"$set": {"table_name": "sales.csv", "file_path": "sales.csv"}}
        )
        
        # Update sample_customers
        result2 = datasets_col.update_one(
            {"id": "sample_customers"},
            {"$set": {"table_name": "customers.csv", "file_path": "customers.csv"}}
        )
        
        print("=" * 60)
        print("Dataset Update Results:")
        print("=" * 60)
        print(f"sample_sales updated: {result1.modified_count} document(s)")
        print(f"sample_customers updated: {result2.modified_count} document(s)")
        print("=" * 60)
        print("✅ Datasets updated successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error updating datasets: {str(e)}")

if __name__ == "__main__":
    update_dataset_file_paths()
