"""
Scan Store Service - In-Memory Storage for Scan Jobs
Manages scan job lifecycle and state
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class ScanStatus(str, Enum):
    """Scan job status enumeration"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ScanStore:
    """
    In-memory storage for scan jobs
    
    This is a simple implementation using a dictionary.
    In production, this should be replaced with a database (MongoDB, PostgreSQL, etc.)
    """
    
    def __init__(self):
        """Initialize the scan store with empty jobs dictionary"""
        self._jobs: Dict[str, dict] = {}
        logger.info("Scan store initialized")
    
    def create_job(self, job_data: dict) -> dict:
        """
        Create and store a new scan job
        
        Args:
            job_data: Dictionary containing job information
            
        Returns:
            The created job data
        """
        job_id = job_data.get("job_id")
        if not job_id:
            raise ValueError("job_id is required in job_data")
        
        self._jobs[job_id] = job_data
        logger.info(f"Created scan job: {job_id}")
        return job_data
    
    def get_job(self, job_id: str) -> Optional[dict]:
        """
        Get a scan job by ID
        
        Args:
            job_id: The unique job identifier
            
        Returns:
            Job data dictionary if found, None otherwise
        """
        job = self._jobs.get(job_id)
        if job:
            logger.debug(f"Retrieved job: {job_id}, status: {job.get('status')}")
        else:
            logger.warning(f"Job not found: {job_id}")
        return job
    
    def update_job(self, job_id: str, updates: dict) -> Optional[dict]:
        """
        Update a scan job with new data
        
        Args:
            job_id: The unique job identifier
            updates: Dictionary of fields to update
            
        Returns:
            Updated job data if found, None otherwise
        """
        if job_id in self._jobs:
            self._jobs[job_id].update(updates)
            self._jobs[job_id]["updated_at"] = datetime.utcnow().isoformat()
            logger.info(f"Updated job: {job_id}, new status: {updates.get('status', 'N/A')}")
            return self._jobs[job_id]
        
        logger.warning(f"Cannot update - job not found: {job_id}")
        return None
    
    def list_jobs(
        self,
        page: int = 1,
        page_size: int = 20,
        status: Optional[str] = None
    ) -> Tuple[List[dict], int]:
        """
        List scan jobs with pagination and optional status filter
        
        Args:
            page: Page number (1-indexed)
            page_size: Number of jobs per page
            status: Optional status filter (pending, running, completed, failed)
            
        Returns:
            Tuple of (list of jobs, total count)
        """
        jobs = list(self._jobs.values())
        
        # Filter by status if provided
        if status:
            jobs = [j for j in jobs if j.get("status") == status]
            logger.debug(f"Filtered jobs by status '{status}': {len(jobs)} results")
        
        # Sort by created_at descending (newest first)
        jobs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        # Calculate pagination
        total = len(jobs)
        start = (page - 1) * page_size
        end = start + page_size
        
        paginated_jobs = jobs[start:end]
        
        logger.debug(f"Listed jobs: page {page}, size {page_size}, total {total}")
        return paginated_jobs, total
    
    def delete_job(self, job_id: str) -> bool:
        """
        Delete a scan job
        
        Args:
            job_id: The unique job identifier
            
        Returns:
            True if deleted, False if not found
        """
        if job_id in self._jobs:
            del self._jobs[job_id]
            logger.info(f"Deleted job: {job_id}")
            return True
        
        logger.warning(f"Cannot delete - job not found: {job_id}")
        return False
    
    def get_job_count(self) -> int:
        """
        Get total number of jobs in store
        
        Returns:
            Total job count
        """
        count = len(self._jobs)
        logger.debug(f"Total jobs in store: {count}")
        return count
    
    def get_jobs_by_status(self, status: str) -> List[dict]:
        """
        Get all jobs with a specific status
        
        Args:
            status: The status to filter by
            
        Returns:
            List of jobs with the given status
        """
        jobs = [j for j in self._jobs.values() if j.get("status") == status]
        logger.debug(f"Jobs with status '{status}': {len(jobs)}")
        return jobs
    
    def clear_all(self) -> int:
        """
        Clear all jobs from store (use with caution!)
        
        Returns:
            Number of jobs cleared
        """
        count = len(self._jobs)
        self._jobs.clear()
        logger.warning(f"Cleared all jobs from store: {count} jobs removed")
        return count


# Global singleton instance
# This instance is imported and used throughout the application
scan_store = ScanStore()
