# app/core/__init__.py
"""
Core Package
Database and configuration utilities
"""

from .database import (
    connect_to_mongo,
    close_mongo_connection,
    create_indexes,
    get_database,
    get_collection,
    check_connection,
    get_database_stats
)

__all__ = [
    "connect_to_mongo",
    "close_mongo_connection",
    "create_indexes",
    "get_database",
    "get_collection",
    "check_connection",
    "get_database_stats"
]
