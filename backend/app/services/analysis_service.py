# app/services/analysis_service.py
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


class AnalysisService:
    """Service for analytics and chart data aggregation"""

    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None

    async def connect(self):
        """Connect to MongoDB"""
        if not self.client:
            self.client = AsyncIOMotorClient(settings.MONGODB_URL)
            self.db = self.client[settings.DATABASE_NAME]
            logger.info("✅ AnalysisService connected to MongoDB")

    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("❌ AnalysisService disconnected from MongoDB")

    async def get_chart_data(
        self,
        dataset_id: str,
        x_axis: str,
        y_axis: str,
        agg_type: str = "sum",
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Generate chart data by aggregating dataset rows
        
        Args:
            dataset_id: The dataset/job ID
            x_axis: The dimension field (e.g., "region", "month")
            y_axis: The measure field (e.g., "revenue", "orders")
            agg_type: Aggregation type (sum, avg, count, min, max)
            limit: Maximum number of data points to return
            
        Returns:
            List of chart data points: [{"name": "North", "value": 12345}, ...]
        """
        await self.connect()

        try:
            # Get the dataset/job to find the collection name
            jobs_collection = self.db["data_quality_jobs"]
            job = await jobs_collection.find_one({"_id": ObjectId(dataset_id)})

            if not job:
                logger.error(f"Dataset not found: {dataset_id}")
                return []

            # Get the collection where data rows are stored
            # Assuming rows are stored in a collection named after the job
            collection_name = f"job_{dataset_id}_data"
            data_collection = self.db[collection_name]

            # Check if collection exists
            collection_names = await self.db.list_collection_names()
            if collection_name not in collection_names:
                logger.warning(f"Data collection not found: {collection_name}")
                return []

            # Build aggregation pipeline based on agg_type
            aggregation_operator = self._get_aggregation_operator(agg_type, y_axis)

            pipeline = [
                # Group by x_axis field
                {
                    "$group": {
                        "_id": f"${x_axis}",
                        "value": aggregation_operator
                    }
                },
                # Sort by value descending
                {"$sort": {"value": -1}},
                # Limit results for performance
                {"$limit": limit},
                # Project to clean format
                {
                    "$project": {
                        "_id": 0,
                        "name": "$_id",
                        "value": 1
                    }
                }
            ]

            # Execute aggregation
            cursor = data_collection.aggregate(pipeline)
            results = await cursor.to_list(length=limit)

            logger.info(f"✅ Generated chart data: {len(results)} points for {x_axis} vs {y_axis}")
            return results

        except Exception as e:
            logger.error(f"❌ Error generating chart data: {str(e)}")
            return []

    def _get_aggregation_operator(self, agg_type: str, field: str) -> Dict[str, Any]:
        """
        Get MongoDB aggregation operator based on type
        
        Args:
            agg_type: sum, avg, count, min, max
            field: The field to aggregate
            
        Returns:
            MongoDB aggregation operator dict
        """
        operators = {
            "sum": {"$sum": f"${field}"},
            "avg": {"$avg": f"${field}"},
            "count": {"$sum": 1},
            "min": {"$min": f"${field}"},
            "max": {"$max": f"${field}"}
        }
        
        return operators.get(agg_type.lower(), {"$sum": f"${field}"})

    async def get_available_fields(self, dataset_id: str) -> Dict[str, List[str]]:
        """
        Get available dimensions and measures from a dataset
        
        Args:
            dataset_id: The dataset/job ID
            
        Returns:
            Dict with "dimensions" and "measures" lists
        """
        await self.connect()

        try:
            collection_name = f"job_{dataset_id}_data"
            data_collection = self.db[collection_name]

            # Get a sample document to infer schema
            sample = await data_collection.find_one()
            
            if not sample:
                return {"dimensions": [], "measures": []}

            dimensions = []
            measures = []

            for field, value in sample.items():
                if field == "_id":
                    continue
                
                # Classify as dimension (string) or measure (numeric)
                if isinstance(value, (int, float)):
                    measures.append(field)
                elif isinstance(value, str):
                    dimensions.append(field)

            logger.info(f"✅ Found {len(dimensions)} dimensions and {len(measures)} measures")
            return {
                "dimensions": dimensions,
                "measures": measures
            }

        except Exception as e:
            logger.error(f"❌ Error getting available fields: {str(e)}")
            return {"dimensions": [], "measures": []}

    async def get_datasets(self) -> List[Dict[str, Any]]:
        """
        Get list of available datasets for analysis
        
        Returns:
            List of datasets with id, name, and row count
        """
        await self.connect()

        try:
            jobs_collection = self.db["data_quality_jobs"]
            
            # Get all completed jobs
            cursor = jobs_collection.find(
                {"status": "completed"},
                {"_id": 1, "filename": 1, "total_rows": 1, "created_at": 1}
            ).sort("created_at", -1).limit(50)

            jobs = await cursor.to_list(length=50)

            datasets = [
                {
                    "id": str(job["_id"]),
                    "name": job.get("filename", "Unnamed Dataset"),
                    "rows": job.get("total_rows", 0),
                    "created_at": job.get("created_at")
                }
                for job in jobs
            ]

            logger.info(f"✅ Found {len(datasets)} available datasets")
            return datasets

        except Exception as e:
            logger.error(f"❌ Error getting datasets: {str(e)}")
            return []


# Global instance
analysis_service = AnalysisService()
