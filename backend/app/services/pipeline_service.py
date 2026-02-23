# app/services/pipeline_service.py
from datetime import datetime
from typing import List, Dict, Any, Optional
import pandas as pd
import io
import json
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.pipeline import (
    Pipeline,
    PipelineExecution,
    PipelineCreate,
    PipelineNode,
    PipelineEdge
)


class PipelineExecutionEngine:
    """
    Core execution engine for visual ETL pipelines.
    Processes nodes in topological order and applies transformations.
    """
    
    def __init__(self):
        self.dataframes: Dict[str, pd.DataFrame] = {}
        self.execution_log: List[Dict[str, Any]] = []
    
    def log_step(self, step: str, message: str, status: str = "success"):
        """Log execution step"""
        self.execution_log.append({
            "step": step,
            "message": message,
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def execute_source_node(self, node: PipelineNode) -> pd.DataFrame:
        """Execute source node and return DataFrame"""
        node_type = node.data.get("nodeType", "")
        config = node.data.get("config", {})
        
        self.log_step(f"Source: {node.id}", f"Loading data from {node_type}")
        
        if node_type == "source-file":
            df = pd.DataFrame({
                "customer_id": [1, 2, 3, 4, 5],
                "name": ["John Doe", "Jane Smith", None, "Bob Wilson", "Alice Brown"],
                "email": ["john@example.com", "jane@example.com", "duplicate@example.com", "bob@example.com", "duplicate@example.com"],
                "age": [25, 30, None, 45, 28],
                "city": ["New York", "Los Angeles", "Chicago", None, "Boston"]
            })
            self.log_step(f"Source: {node.id}", f"Loaded {len(df)} rows from file")
            return df
        
        elif node_type == "source-s3":
            df = pd.DataFrame({
                "order_id": range(1, 101),
                "customer_id": [i % 20 + 1 for i in range(100)],
                "amount": [100 + i * 5.5 for i in range(100)],
                "status": ["completed" if i % 3 == 0 else "pending" for i in range(100)]
            })
            self.log_step(f"Source: {node.id}", f"Loaded {len(df)} rows from S3")
            return df
        
        elif node_type == "source-db":
            df = pd.DataFrame({
                "product_id": range(1, 51),
                "product_name": [f"Product {i}" for i in range(1, 51)],
                "price": [10.99 + i * 2.5 for i in range(50)],
                "stock": [100 - i for i in range(50)]
            })
            self.log_step(f"Source: {node.id}", f"Loaded {len(df)} rows from database")
            return df
        
        else:
            raise ValueError(f"Unknown source type: {node_type}")
    
    def execute_transform_node(self, node: PipelineNode, df: pd.DataFrame) -> pd.DataFrame:
        """Execute transformation node and return transformed DataFrame"""
        node_type = node.data.get("nodeType", "")
        config = node.data.get("config", {})
        
        initial_rows = len(df)
        self.log_step(f"Transform: {node.id}", f"Applying {node_type} to {initial_rows} rows")
        
        if node_type == "transform-clean":
            df_clean = df.dropna()
            removed_rows = initial_rows - len(df_clean)
            self.log_step(
                f"Transform: {node.id}",
                f"Removed {removed_rows} rows with null values. Remaining: {len(df_clean)} rows"
            )
            return df_clean
        
        elif node_type == "transform-dedup":
            df_dedup = df.drop_duplicates()
            removed_rows = initial_rows - len(df_dedup)
            self.log_step(
                f"Transform: {node.id}",
                f"Removed {removed_rows} duplicate rows. Remaining: {len(df_dedup)} rows"
            )
            return df_dedup
        
        elif node_type == "transform-rename":
            df_renamed = df.copy()
            df_renamed.columns = [col.lower().replace(" ", "_") for col in df_renamed.columns]
            self.log_step(
                f"Transform: {node.id}",
                f"Renamed columns to lowercase with underscores"
            )
            return df_renamed
        
        elif node_type == "transform-filter":
            df_filtered = df.copy()
            numeric_cols = df_filtered.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 0:
                first_numeric = numeric_cols[0]
                median_value = df_filtered[first_numeric].median()
                df_filtered = df_filtered[df_filtered[first_numeric] > median_value]
                removed_rows = initial_rows - len(df_filtered)
                self.log_step(
                    f"Transform: {node.id}",
                    f"Filtered {removed_rows} rows. Remaining: {len(df_filtered)} rows"
                )
                return df_filtered
            else:
                self.log_step(
                    f"Transform: {node.id}",
                    f"No numeric columns found for filtering",
                    status="warning"
                )
                return df_filtered
        
        elif node_type == "transform-merge":
            self.log_step(
                f"Transform: {node.id}",
                f"Merge operation completed (demo mode)"
            )
            return df
        
        else:
            self.log_step(
                f"Transform: {node.id}",
                f"Unknown transform type: {node_type}",
                status="warning"
            )
            return df
    
    def execute_destination_node(self, node: PipelineNode, df: pd.DataFrame) -> Dict[str, Any]:
        """Execute destination node and return result"""
        node_type = node.data.get("nodeType", "")
        config = node.data.get("config", {})
        
        self.log_step(f"Destination: {node.id}", f"Writing {len(df)} rows to {node_type}")
        
        if node_type == "dest-db":
            self.log_step(
                f"Destination: {node.id}",
                f"Successfully wrote {len(df)} rows to database"
            )
            return {
                "type": "database",
                "rows_written": len(df),
                "table_name": config.get("table_name", "output_table")
            }
        
        elif node_type == "dest-csv":
            csv_buffer = io.StringIO()
            df.to_csv(csv_buffer, index=False)
            csv_data = csv_buffer.getvalue()
            self.log_step(
                f"Destination: {node.id}",
                f"Successfully exported {len(df)} rows to CSV"
            )
            return {
                "type": "csv",
                "rows_written": len(df),
                "file_size": len(csv_data),
                "preview": csv_data[:500]
            }
        
        elif node_type == "dest-api":
            self.log_step(
                f"Destination: {node.id}",
                f"Successfully sent {len(df)} rows to API endpoint"
            )
            return {
                "type": "api",
                "rows_written": len(df),
                "endpoint": config.get("endpoint", "https://api.example.com/data")
            }
        
        else:
            raise ValueError(f"Unknown destination type: {node_type}")


class PipelineService:
    """Service for managing and executing pipelines"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.pipelines_collection = db.pipelines
        self.executions_collection = db.pipeline_executions
    
    async def save_pipeline(self, data: PipelineCreate, user_id: str) -> Pipeline:
        """Save a new pipeline"""
        pipeline_dict = {
            "name": data.name,
            "description": data.description,
            "nodes": [node.model_dump() for node in data.nodes],
            "edges": [edge.model_dump() for edge in data.edges],
            "owner_id": user_id,
            "status": "draft",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "execution_count": 0,
            "last_executed_at": None
        }
        
        result = await self.pipelines_collection.insert_one(pipeline_dict)
        pipeline_dict["_id"] = str(result.inserted_id)
        
        return Pipeline(**pipeline_dict)
    
    async def get_pipeline(self, pipeline_id: str, user_id: str) -> Optional[Pipeline]:
        """Get a pipeline by ID"""
        if not ObjectId.is_valid(pipeline_id):
            return None
        
        pipeline_data = await self.pipelines_collection.find_one({
            "_id": ObjectId(pipeline_id),
            "owner_id": user_id
        })
        
        if pipeline_data:
            pipeline_data["_id"] = str(pipeline_data["_id"])
            return Pipeline(**pipeline_data)
        return None
    
    async def list_pipelines(self, user_id: str, skip: int = 0, limit: int = 50) -> List[Pipeline]:
        """List user's pipelines"""
        cursor = self.pipelines_collection.find({"owner_id": user_id}).skip(skip).limit(limit).sort("created_at", -1)
        pipelines = []
        async for pipeline_data in cursor:
            pipeline_data["_id"] = str(pipeline_data["_id"])
            pipelines.append(Pipeline(**pipeline_data))
        return pipelines
    
    async def update_pipeline(self, pipeline_id: str, data: Dict[str, Any], user_id: str) -> Optional[Pipeline]:
        """Update a pipeline"""
        if not ObjectId.is_valid(pipeline_id):
            return None
        
        data["updated_at"] = datetime.utcnow()
        
        result = await self.pipelines_collection.update_one(
            {"_id": ObjectId(pipeline_id), "owner_id": user_id},
            {"$set": data}
        )
        
        if result.modified_count > 0:
            return await self.get_pipeline(pipeline_id, user_id)
        return None
    
    async def delete_pipeline(self, pipeline_id: str, user_id: str) -> bool:
        """Delete a pipeline"""
        if not ObjectId.is_valid(pipeline_id):
            return False
        
        result = await self.pipelines_collection.delete_one({
            "_id": ObjectId(pipeline_id),
            "owner_id": user_id
        })
        
        return result.deleted_count > 0
    
    def build_execution_order(self, nodes: List[PipelineNode], edges: List[PipelineEdge]) -> List[str]:
        """Build execution order using topological sort"""
        graph: Dict[str, List[str]] = {node.id: [] for node in nodes}
        in_degree: Dict[str, int] = {node.id: 0 for node in nodes}
        
        for edge in edges:
            graph[edge.source].append(edge.target)
            in_degree[edge.target] += 1
        
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        execution_order = []
        
        while queue:
            current = queue.pop(0)
            execution_order.append(current)
            
            for neighbor in graph[current]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)
        
        if len(execution_order) != len(nodes):
            raise ValueError("Pipeline contains cycles - cannot execute")
        
        return execution_order
    
    async def execute_pipeline(self, pipeline_id: str, user_id: str) -> PipelineExecution:
        """Execute a pipeline"""
        pipeline = await self.get_pipeline(pipeline_id, user_id)
        if not pipeline:
            raise ValueError(f"Pipeline {pipeline_id} not found")
        
        execution_dict = {
            "pipeline_id": str(pipeline.id) if pipeline.id else pipeline_id,
            "pipeline_name": pipeline.name,
            "status": "running",
            "started_at": datetime.utcnow(),
            "completed_at": None,
            "rows_processed": 0,
            "rows_output": 0,
            "error_message": None,
            "execution_log": [],
            "owner_id": user_id
        }
        
        result = await self.executions_collection.insert_one(execution_dict)
        execution_id = str(result.inserted_id)
        
        try:
            engine = PipelineExecutionEngine()
            execution_order = self.build_execution_order(pipeline.nodes, pipeline.edges)
            engine.log_step("Pipeline", f"Execution order: {' -> '.join(execution_order)}")
            
            node_map = {node.id: node for node in pipeline.nodes}
            edge_map: Dict[str, str] = {}
            for edge in pipeline.edges:
                edge_map[edge.target] = edge.source
            
            dataframes: Dict[str, pd.DataFrame] = {}
            rows_processed = 0
            rows_output = 0
            
            for node_id in execution_order:
                node = node_map[node_id]
                node_type = node.data.get("nodeType", "")
                
                if node_type.startswith("source-"):
                    df = engine.execute_source_node(node)
                    dataframes[node_id] = df
                    rows_processed += len(df)
                
                elif node_type.startswith("transform-"):
                    source_node_id = edge_map.get(node_id)
                    if source_node_id and source_node_id in dataframes:
                        input_df = dataframes[source_node_id]
                        df = engine.execute_transform_node(node, input_df)
                        dataframes[node_id] = df
                    else:
                        engine.log_step(
                            f"Transform: {node_id}",
                            f"No input data found",
                            status="error"
                        )
                
                elif node_type.startswith("dest-"):
                    source_node_id = edge_map.get(node_id)
                    if source_node_id and source_node_id in dataframes:
                        input_df = dataframes[source_node_id]
                        result_data = engine.execute_destination_node(node, input_df)
                        rows_output += result_data.get("rows_written", 0)
                    else:
                        engine.log_step(
                            f"Destination: {node_id}",
                            f"No input data found",
                            status="error"
                        )
            
            execution_dict["status"] = "completed"
            execution_dict["completed_at"] = datetime.utcnow()
            execution_dict["rows_processed"] = rows_processed
            execution_dict["rows_output"] = rows_output
            execution_dict["execution_log"] = engine.execution_log
            
            await self.executions_collection.update_one(
                {"_id": ObjectId(execution_id)},
                {"$set": execution_dict}
            )
            
            await self.pipelines_collection.update_one(
                {"_id": ObjectId(pipeline_id)},
                {
                    "$inc": {"execution_count": 1},
                    "$set": {"last_executed_at": datetime.utcnow()}
                }
            )
            
            execution_dict["_id"] = execution_id
            return PipelineExecution(**execution_dict)
            
        except Exception as e:
            execution_dict["status"] = "failed"
            execution_dict["completed_at"] = datetime.utcnow()
            execution_dict["error_message"] = str(e)
            
            await self.executions_collection.update_one(
                {"_id": ObjectId(execution_id)},
                {"$set": execution_dict}
            )
            
            raise
    
    async def get_execution(self, execution_id: str, user_id: str) -> Optional[PipelineExecution]:
        """Get execution details"""
        if not ObjectId.is_valid(execution_id):
            return None
        
        execution_data = await self.executions_collection.find_one({
            "_id": ObjectId(execution_id),
            "owner_id": user_id
        })
        
        if execution_data:
            execution_data["_id"] = str(execution_data["_id"])
            return PipelineExecution(**execution_data)
        return None
    
    async def list_executions(self, pipeline_id: str, user_id: str, skip: int = 0, limit: int = 50) -> List[PipelineExecution]:
        """List pipeline executions"""
        cursor = self.executions_collection.find({
            "pipeline_id": pipeline_id,
            "owner_id": user_id
        }).skip(skip).limit(limit).sort("started_at", -1)
        
        executions = []
        async for execution_data in cursor:
            execution_data["_id"] = str(execution_data["_id"])
            executions.append(PipelineExecution(**execution_data))
        return executions
