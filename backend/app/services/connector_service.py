"""
Connection Tester Service
Tests database connections for PostgreSQL and MySQL connectors.
Handles timeouts, errors, and returns structured responses.
Supports schema introspection for data quality checks.
"""

import psycopg2
import pymysql
import time
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class ConnectionTester:
    """
    Service class for testing database connections and extracting schemas.
    Supports PostgreSQL and MySQL with timeout and error handling.
    """
    
    # Connection timeout in seconds
    TIMEOUT_SECONDS = 5
    
    @staticmethod
    def test_postgres(config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Test PostgreSQL database connection.
        
        Args:
            config: Dictionary containing connection parameters
                - host (str): Database host
                - port (int): Database port
                - username (str): Database username
                - password (str): Database password
                - database (str): Database name
                - ssl (bool, optional): Use SSL connection
        
        Returns:
            Dictionary with status, message, latency_ms, and details
        """
        start_time = time.time()
        connection = None
        cursor = None
        
        try:
            # Extract connection parameters
            host = config.get('host')
            port = config.get('port', 5432)
            username = config.get('username')
            password = config.get('password')
            database = config.get('database')
            ssl_mode = 'require' if config.get('ssl', False) else 'prefer'
            
            # Validate required parameters
            if not all([host, username, password, database]):
                return {
                    'status': 'error',
                    'message': 'Missing required connection parameters (host, username, password, database)',
                    'latency_ms': 0,
                    'details': None
                }
            
            # Attempt connection
            logger.info(f"Testing PostgreSQL connection to {host}:{port}/{database}")
            
            connection = psycopg2.connect(
                host=host,
                port=port,
                user=username,
                password=password,
                database=database,
                sslmode=ssl_mode,
                connect_timeout=ConnectionTester.TIMEOUT_SECONDS
            )
            
            # Execute test query
            cursor = connection.cursor()
            cursor.execute("SELECT version();")
            version_result = cursor.fetchone()
            server_version = version_result[0] if version_result else "Unknown"
            
            # Get table count
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_schema NOT IN ('pg_catalog', 'information_schema');
            """)
            table_count = cursor.fetchone()[0]
            
            # Calculate latency
            latency_ms = int((time.time() - start_time) * 1000)
            
            logger.info(f"PostgreSQL connection successful: {host}:{port}/{database}")
            
            return {
                'status': 'success',
                'message': 'Connection established successfully!',
                'latency_ms': latency_ms,
                'details': {
                    'server_version': server_version.split(',')[0],
                    'database': database,
                    'tables_count': table_count,
                    'connection_type': 'PostgreSQL'
                }
            }
            
        except psycopg2.OperationalError as e:
            latency_ms = int((time.time() - start_time) * 1000)
            error_msg = str(e).strip()
            
            logger.error(f"PostgreSQL connection failed: {error_msg}")
            
            # Parse common error types
            if 'password authentication failed' in error_msg:
                hint = 'Check username and password'
            elif 'could not connect to server' in error_msg or 'Connection refused' in error_msg:
                hint = 'Check host and port, ensure server is running'
            elif 'database' in error_msg and 'does not exist' in error_msg:
                hint = 'Database name does not exist on server'
            elif 'timeout' in error_msg.lower():
                hint = 'Connection timeout - check network and firewall settings'
            else:
                hint = 'Verify connection parameters'
            
            return {
                'status': 'error',
                'message': f'Connection failed: {error_msg}',
                'latency_ms': latency_ms,
                'details': {
                    'error_type': 'OperationalError',
                    'hint': hint
                }
            }
            
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            error_msg = str(e)
            
            logger.error(f"Unexpected PostgreSQL error: {error_msg}")
            
            return {
                'status': 'error',
                'message': f'Unexpected error: {error_msg}',
                'latency_ms': latency_ms,
                'details': {
                    'error_type': type(e).__name__,
                    'hint': 'Contact system administrator'
                }
            }
            
        finally:
            # Clean up resources
            if cursor:
                try:
                    cursor.close()
                except Exception as e:
                    logger.warning(f"Error closing PostgreSQL cursor: {e}")
            if connection:
                try:
                    connection.close()
                except Exception as e:
                    logger.warning(f"Error closing PostgreSQL connection: {e}")
    
    @staticmethod
    def test_mysql(config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Test MySQL database connection.
        
        Args:
            config: Dictionary containing connection parameters
                - host (str): Database host
                - port (int): Database port
                - username (str): Database username
                - password (str): Database password
                - database (str): Database name
                - ssl (bool, optional): Use SSL connection
        
        Returns:
            Dictionary with status, message, latency_ms, and details
        """
        start_time = time.time()
        connection = None
        cursor = None
        
        try:
            # Extract connection parameters
            host = config.get('host')
            port = config.get('port', 3306)
            username = config.get('username')
            password = config.get('password')
            database = config.get('database')
            use_ssl = config.get('ssl', False)
            
            # Validate required parameters
            if not all([host, username, password, database]):
                return {
                    'status': 'error',
                    'message': 'Missing required connection parameters (host, username, password, database)',
                    'latency_ms': 0,
                    'details': None
                }
            
            # Attempt connection
            logger.info(f"Testing MySQL connection to {host}:{port}/{database}")
            
            ssl_config = {'ssl': True} if use_ssl else None
            
            connection = pymysql.connect(
                host=host,
                port=port,
                user=username,
                password=password,
                database=database,
                connect_timeout=ConnectionTester.TIMEOUT_SECONDS,
                **({'ssl': ssl_config} if ssl_config else {})
            )
            
            # Execute test query
            cursor = connection.cursor()
            cursor.execute("SELECT VERSION();")
            version_result = cursor.fetchone()
            server_version = version_result[0] if version_result else "Unknown"
            
            # Get table count
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_schema = %s;
            """, (database,))
            table_count = cursor.fetchone()[0]
            
            # Calculate latency
            latency_ms = int((time.time() - start_time) * 1000)
            
            logger.info(f"MySQL connection successful: {host}:{port}/{database}")
            
            return {
                'status': 'success',
                'message': 'Connection established successfully!',
                'latency_ms': latency_ms,
                'details': {
                    'server_version': server_version,
                    'database': database,
                    'tables_count': table_count,
                    'connection_type': 'MySQL'
                }
            }
            
        except pymysql.OperationalError as e:
            latency_ms = int((time.time() - start_time) * 1000)
            error_code = e.args[0] if e.args else None
            error_msg = e.args[1] if len(e.args) > 1 else str(e)
            
            logger.error(f"MySQL connection failed: {error_msg}")
            
            # Parse common error codes
            if error_code == 1045:
                hint = 'Invalid username or password'
            elif error_code == 2003:
                hint = 'Cannot connect to MySQL server - check host and port'
            elif error_code == 1049:
                hint = 'Database does not exist'
            elif error_code == 2013:
                hint = 'Lost connection to server - check network stability'
            else:
                hint = 'Verify connection parameters'
            
            return {
                'status': 'error',
                'message': f'Connection failed: {error_msg}',
                'latency_ms': latency_ms,
                'details': {
                    'error_type': 'OperationalError',
                    'error_code': error_code,
                    'hint': hint
                }
            }
            
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            error_msg = str(e)
            
            logger.error(f"Unexpected MySQL error: {error_msg}")
            
            return {
                'status': 'error',
                'message': f'Unexpected error: {error_msg}',
                'latency_ms': latency_ms,
                'details': {
                    'error_type': type(e).__name__,
                    'hint': 'Contact system administrator'
                }
            }
            
        finally:
            # Clean up resources
            if cursor:
                try:
                    cursor.close()
                except Exception as e:
                    logger.warning(f"Error closing MySQL cursor: {e}")
            if connection:
                try:
                    connection.close()
                except Exception as e:
                    logger.warning(f"Error closing MySQL connection: {e}")

    # ══════════════════════════════════════════════════════════════
    # SCHEMA INTROSPECTION METHODS - HARDENED
    # ══════════════════════════════════════════════════════════════

    @staticmethod
    def get_postgres_schema(config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract complete schema from PostgreSQL database.
        HARDENED: Never crashes, always returns structured response.
        
        Args:
            config: Dictionary containing connection parameters
        
        Returns:
            Dictionary with status, schema, table_count, and message
        """
        connection = None
        cursor = None
        
        try:
            # Extract and validate connection parameters
            host = config.get('host')
            port = config.get('port', 5432)
            username = config.get('username')
            password = config.get('password')
            database = config.get('database')
            ssl_mode = 'require' if config.get('ssl', False) else 'prefer'
            
            # Validate required parameters
            if not all([host, username, password, database]):
                logger.error("PostgreSQL schema extraction: Missing required parameters")
                return {
                    'status': 'error',
                    'schema': {},
                    'table_count': 0,
                    'message': 'Missing required connection parameters'
                }
            
            logger.info(f"Extracting PostgreSQL schema from {host}:{port}/{database}")
            
            # Connect to database with timeout
            connection = psycopg2.connect(
                host=host,
                port=port,
                user=username,
                password=password,
                database=database,
                sslmode=ssl_mode,
                connect_timeout=10
            )
            
            cursor = connection.cursor()
            
            # Query to get all tables and columns (excluding system schemas)
            query = """
                SELECT 
                    t.table_name,
                    c.column_name,
                    c.data_type,
                    c.is_nullable
                FROM 
                    information_schema.tables t
                JOIN 
                    information_schema.columns c 
                    ON t.table_name = c.table_name 
                    AND t.table_schema = c.table_schema
                WHERE 
                    t.table_schema NOT IN ('information_schema', 'pg_catalog')
                    AND t.table_type = 'BASE TABLE'
                ORDER BY 
                    t.table_name, c.ordinal_position;
            """
            
            cursor.execute(query)
            rows = cursor.fetchall()
            
            # Build schema dictionary
            schema = {}
            for table_name, column_name, data_type, is_nullable in rows:
                if table_name not in schema:
                    schema[table_name] = []
                
                schema[table_name].append({
                    'column': column_name,
                    'type': data_type,
                    'nullable': is_nullable == 'YES'
                })
            
            table_count = len(schema)
            logger.info(f"Successfully extracted PostgreSQL schema: {table_count} tables")
            
            return {
                'status': 'success',
                'schema': schema,
                'table_count': table_count,
                'message': f'Successfully extracted schema for {table_count} table{"s" if table_count != 1 else ""}'
            }
            
        except psycopg2.OperationalError as e:
            error_msg = str(e).strip()
            logger.error(f"PostgreSQL connection error during schema extraction: {error_msg}")
            
            return {
                'status': 'error',
                'schema': {},
                'table_count': 0,
                'message': f'Connection failed: {error_msg}'
            }
            
        except psycopg2.Error as e:
            error_msg = str(e).strip()
            logger.error(f"PostgreSQL error during schema extraction: {error_msg}")
            
            return {
                'status': 'error',
                'schema': {},
                'table_count': 0,
                'message': f'Database error: {error_msg}'
            }
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Unexpected error during PostgreSQL schema extraction: {error_msg}", exc_info=True)
            
            return {
                'status': 'error',
                'schema': {},
                'table_count': 0,
                'message': f'Unexpected error: {error_msg}'
            }
            
        finally:
            # Always clean up resources
            if cursor:
                try:
                    cursor.close()
                except Exception as e:
                    logger.warning(f"Error closing PostgreSQL cursor: {e}")
            if connection:
                try:
                    connection.close()
                except Exception as e:
                    logger.warning(f"Error closing PostgreSQL connection: {e}")

    @staticmethod
    def get_mysql_schema(config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract complete schema from MySQL database.
        HARDENED: Never crashes, always returns structured response.
        
        Args:
            config: Dictionary containing connection parameters
        
        Returns:
            Dictionary with status, schema, table_count, and message
        """
        connection = None
        cursor = None
        
        try:
            # Extract and validate connection parameters
            host = config.get('host')
            port = config.get('port', 3306)
            username = config.get('username')
            password = config.get('password')
            database = config.get('database')
            use_ssl = config.get('ssl', False)
            
            # Validate required parameters
            if not all([host, username, password, database]):
                logger.error("MySQL schema extraction: Missing required parameters")
                return {
                    'status': 'error',
                    'schema': {},
                    'table_count': 0,
                    'message': 'Missing required connection parameters'
                }
            
            logger.info(f"Extracting MySQL schema from {host}:{port}/{database}")
            
            # Connect to database with timeout
            ssl_config = {'ssl': True} if use_ssl else None
            
            connection = pymysql.connect(
                host=host,
                port=port,
                user=username,
                password=password,
                database=database,
                connect_timeout=10,
                **({'ssl': ssl_config} if ssl_config else {})
            )
            
            cursor = connection.cursor()
            
            # Query to get all tables and columns from information_schema
            query = """
                SELECT 
                    TABLE_NAME,
                    COLUMN_NAME,
                    COLUMN_TYPE,
                    IS_NULLABLE
                FROM 
                    information_schema.COLUMNS
                WHERE 
                    TABLE_SCHEMA = %s
                ORDER BY 
                    TABLE_NAME, ORDINAL_POSITION;
            """
            
            cursor.execute(query, (database,))
            rows = cursor.fetchall()
            
            # Build schema dictionary
            schema = {}
            for table_name, column_name, column_type, is_nullable in rows:
                if table_name not in schema:
                    schema[table_name] = []
                
                schema[table_name].append({
                    'column': column_name,
                    'type': column_type,
                    'nullable': is_nullable == 'YES'
                })
            
            table_count = len(schema)
            logger.info(f"Successfully extracted MySQL schema: {table_count} tables")
            
            return {
                'status': 'success',
                'schema': schema,
                'table_count': table_count,
                'message': f'Successfully extracted schema for {table_count} table{"s" if table_count != 1 else ""}'
            }
            
        except pymysql.OperationalError as e:
            error_msg = str(e)
            logger.error(f"MySQL connection error during schema extraction: {error_msg}")
            
            return {
                'status': 'error',
                'schema': {},
                'table_count': 0,
                'message': f'Connection failed: {error_msg}'
            }
            
        except pymysql.Error as e:
            error_msg = str(e)
            logger.error(f"MySQL error during schema extraction: {error_msg}")
            
            return {
                'status': 'error',
                'schema': {},
                'table_count': 0,
                'message': f'Database error: {error_msg}'
            }
            
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Unexpected error during MySQL schema extraction: {error_msg}", exc_info=True)
            
            return {
                'status': 'error',
                'schema': {},
                'table_count': 0,
                'message': f'Unexpected error: {error_msg}'
            }
            
        finally:
            # Always clean up resources
            if cursor:
                try:
                    cursor.close()
                except Exception as e:
                    logger.warning(f"Error closing MySQL cursor: {e}")
            if connection:
                try:
                    connection.close()
                except Exception as e:
                    logger.warning(f"Error closing MySQL connection: {e}")


class ConnectionTestException(Exception):
    """Custom exception for connection testing errors."""
    pass
