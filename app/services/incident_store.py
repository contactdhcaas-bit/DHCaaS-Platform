"""
DHCaaS Incident Data Store
===========================

Centralized data access layer for incident persistence and retrieval.

Provides:
- Thread-safe file operations with atomic writes
- CRUD operations for incident management
- Data validation and error handling
- JSON-based persistent storage

Author: DHCaaS Engineering Team
Version: 1.0
Date: February 05, 2026
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Optional

from fastapi import HTTPException, status

# Configure logging
logger = logging.getLogger(__name__)


class IncidentStoreError(Exception):
    """Base exception for incident store operations."""
    pass


class IncidentStore:
    """
    Centralized data access layer for incident persistence.
    
    Handles all file I/O operations with proper error handling,
    atomic writes, and data validation.
    
    Features:
    - Atomic file writes (temp file + rename)
    - Automatic file initialization
    - Comprehensive error handling
    - Operation logging
    """
    
    def __init__(self, file_path: Path):
        """
        Initialize incident store.
        
        Args:
            file_path: Path to incidents JSON file
        """
        self.file_path = file_path
        self._ensure_file_exists()
        logger.info(f"Incident store initialized at {self.file_path}")
    
    def _ensure_file_exists(self) -> None:
        """
        Ensure incidents store file exists with valid structure.
        
        Creates file with empty incidents array if it doesn't exist.
        """
        if not self.file_path.exists():
            logger.warning(
                f"Incidents store not found at {self.file_path}, "
                "creating new file with empty structure"
            )
            self._write_data({"incidents": []})
    
    def _read_data(self) -> dict[str, Any]:
        """
        Read and parse incidents data from file.
        
        Returns:
            Dictionary containing incidents array
            
        Raises:
            HTTPException: If file cannot be read or parsed
        """
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # Validate structure
            if not isinstance(data, dict):
                logger.error(f"Invalid incidents store structure: expected dict, got {type(data)}")
                raise ValueError("Incidents store must be a JSON object")
            
            if "incidents" not in data:
                logger.error("Incidents store missing 'incidents' key")
                raise ValueError("Incidents store missing 'incidents' key")
            
            if not isinstance(data["incidents"], list):
                logger.error(f"Invalid incidents type: expected list, got {type(data['incidents'])}")
                raise ValueError("Incidents must be a JSON array")
            
            logger.debug(f"Successfully read {len(data['incidents'])} incidents from store")
            return data
        
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse incidents store JSON: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Incidents data file is corrupted: {str(e)}"
            ) from e
        
        except ValueError as e:
            logger.error(f"Invalid incidents store structure: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e)
            ) from e
        
        except Exception as e:
            logger.error(f"Failed to read incidents store: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to read incidents data: {str(e)}"
            ) from e
    
    def _write_data(self, data: dict[str, Any]) -> None:
        """
        Write incidents data to file atomically.
        
        Uses atomic write pattern: write to temp file, then rename.
        This ensures file integrity even if write operation is interrupted.
        
        Args:
            data: Dictionary containing incidents array
            
        Raises:
            HTTPException: If file cannot be written
        """
        try:
            # Validate structure before writing
            if not isinstance(data, dict) or "incidents" not in data:
                raise ValueError("Invalid data structure for incidents store")
            
            # Atomic write: write to temp file first
            temp_path = self.file_path.with_suffix(".tmp")
            
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            # Atomic rename (replaces original file on all platforms)
            temp_path.replace(self.file_path)
            
            logger.debug(f"Successfully wrote {len(data['incidents'])} incidents to store")
        
        except ValueError as e:
            logger.error(f"Invalid data structure: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e)
            ) from e
        
        except Exception as e:
            logger.error(f"Failed to write incidents store: {e}")
            # Clean up temp file if it exists
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except:
                    pass
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save incidents data: {str(e)}"
            ) from e
    
    def get_all(self) -> list[dict[str, Any]]:
        """
        Retrieve all incidents from store.
        
        Returns:
            List of incident dictionaries
        """
        data = self._read_data()
        incidents = data.get("incidents", [])
        logger.info(f"Retrieved {len(incidents)} incidents from store")
        return incidents
    
    def get_by_id(self, incident_id: str) -> Optional[dict[str, Any]]:
        """
        Retrieve specific incident by ID.
        
        Args:
            incident_id: Unique incident identifier
            
        Returns:
            Incident dictionary if found, None otherwise
        """
        incidents = self.get_all()
        incident = next((inc for inc in incidents if inc.get("id") == incident_id), None)
        
        if incident:
            logger.debug(f"Found incident {incident_id}")
        else:
            logger.debug(f"Incident {incident_id} not found in store")
        
        return incident
    
    def update(self, incident_id: str, updates: dict[str, Any]) -> dict[str, Any]:
        """
        Update specific incident with new data.
        
        Args:
            incident_id: Unique incident identifier
            updates: Dictionary of fields to update
            
        Returns:
            Updated incident dictionary
            
        Raises:
            HTTPException: If incident not found
        """
        data = self._read_data()
        incidents = data["incidents"]
        
        # Find incident index
        incident_index = next(
            (i for i, inc in enumerate(incidents) if inc.get("id") == incident_id), 
            None
        )
        
        if incident_index is None:
            logger.warning(f"Attempted to update non-existent incident {incident_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Incident {incident_id} not found"
            )
        
        # Apply updates
        incidents[incident_index].update(updates)
        updated_incident = incidents[incident_index]
        
        # Save to file
        self._write_data(data)
        
        logger.info(f"Updated incident {incident_id} with fields: {list(updates.keys())}")
        return updated_incident
    
    def create(self, incident_data: dict[str, Any]) -> dict[str, Any]:
        """
        Create a new incident in the store.
        
        Args:
            incident_data: Complete incident data dictionary
            
        Returns:
            Created incident dictionary
            
        Raises:
            HTTPException: If incident with same ID already exists
        """
        data = self._read_data()
        incidents = data["incidents"]
        
        incident_id = incident_data.get("id")
        
        # Check for duplicate ID
        if any(inc.get("id") == incident_id for inc in incidents):
            logger.warning(f"Attempted to create duplicate incident {incident_id}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Incident {incident_id} already exists"
            )
        
        # Add new incident
        incidents.append(incident_data)
        
        # Save to file
        self._write_data(data)
        
        logger.info(f"Created new incident {incident_id}")
        return incident_data
    
    def delete(self, incident_id: str) -> dict[str, Any]:
        """
        Delete incident from store.
        
        Args:
            incident_id: Unique incident identifier
            
        Returns:
            Deleted incident dictionary
            
        Raises:
            HTTPException: If incident not found
        """
        data = self._read_data()
        incidents = data["incidents"]
        
        # Find and remove incident
        incident_index = next(
            (i for i, inc in enumerate(incidents) if inc.get("id") == incident_id), 
            None
        )
        
        if incident_index is None:
            logger.warning(f"Attempted to delete non-existent incident {incident_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Incident {incident_id} not found"
            )
        
        deleted_incident = incidents.pop(incident_index)
        
        # Save to file
        self._write_data(data)
        
        logger.info(f"Deleted incident {incident_id}")
        return deleted_incident
    
    def count(self) -> int:
        """
        Get total count of incidents in store.
        
        Returns:
            Number of incidents
        """
        incidents = self.get_all()
        return len(incidents)
