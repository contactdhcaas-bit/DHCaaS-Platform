# lambda/connectors/snowflake_connector.py
import snowflake.connector
from snowflake.connector import DictCursor
import boto3
import json
from typing import Dict, List, Any
from datetime import datetime

secretsmanager = boto3.client('secretsmanager')
dynamodb = boto3.resource('dynamodb')

class SnowflakeConnector:
    """Connect to Snowflake and sync metadata/lineage to DHCaaS"""
    
    def __init__(self, tenant_id: str, connection_id: str):
        self.tenant_id = tenant_id
        self.connection_id = connection_id
        self.credentials = self._get_credentials()
        self.connection = None
        
    def _get_credentials(self) -> Dict:
        """Retrieve Snowflake credentials from Secrets Manager"""
        secret = secretsmanager.get_secret_value(
            SecretId=f'dhcaas/{self.tenant_id}/snowflake/{self.connection_id}'
        )
        return json.loads(secret['SecretString'])
    
    def connect(self):
        """Establish connection to Snowflake"""
        self.connection = snowflake.connector.connect(
            account=self.credentials['account'],
            user=self.credentials['user'],
            password=self.credentials['password'],
            warehouse=self.credentials.get('warehouse'),
            database=self.credentials.get('database'),
            schema=self.credentials.get('schema'),
            role=self.credentials.get('role')
        )
        
    def sync_metadata(self) -> Dict:
        """Sync table metadata from Snowflake to DHCaaS catalog"""
        if not self.connection:
            self.connect()
        
        cursor = self.connection.cursor(DictCursor)
        
        # Get all tables in database
        cursor.execute("""
            SELECT 
                table_catalog,
                table_schema,
                table_name,
                table_type,
                row_count,
                bytes,
                created,
                last_altered,
                comment
            FROM information_schema.tables
            WHERE table_schema != 'INFORMATION_SCHEMA'
        """)
        
        tables = cursor.fetchall()
        synced_datasets = []
        
        for table in tables:
            # Get column metadata
            cursor.execute(f"""
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    column_default,
                    comment
                FROM information_schema.columns
                WHERE table_catalog = '{table['TABLE_CATALOG']}'
                  AND table_schema = '{table['TABLE_SCHEMA']}'
                  AND table_name = '{table['TABLE_NAME']}'
                ORDER BY ordinal_position
            """)
            
            columns = cursor.fetchall()
            
            # Register dataset in DHCaaS
            dataset = {
                'dataset_id': f"snowflake.{table['TABLE_SCHEMA']}.{table['TABLE_NAME']}",
                'name': table['TABLE_NAME'],
                'type': 'snowflake_table',
                'source': 'snowflake',
                'connection_id': self.connection_id,
                'schema': {
                    'columns': [
                        {
                            'name': col['COLUMN_NAME'],
                            'type': col['DATA_TYPE'],
                            'nullable': col['IS_NULLABLE'] == 'YES',
                            'description': col['COMMENT']
                        }
                        for col in columns
                    ]
                },
                'metadata': {
                    'database': table['TABLE_CATALOG'],
                    'schema': table['TABLE_SCHEMA'],
                    'row_count': table['ROW_COUNT'],
                    'size_bytes': table['BYTES'],
                    'created_at': str(table['CREATED']),
                    'last_modified': str(table['LAST_ALTERED']),
                    'description': table['COMMENT']
                },
                'sync_timestamp': datetime.utcnow().isoformat()
            }
            
            # Store in DHCaaS catalog
            self._register_dataset(dataset)
            synced_datasets.append(dataset['dataset_id'])
        
        cursor.close()
        
        return {
            'success': True,
            'synced_tables': len(synced_datasets),
            'datasets': synced_datasets
        }
    
    def sync_query_history(self, hours: int = 24) -> Dict:
        """Sync query history for lineage extraction"""
        if not self.connection:
            self.connect()
        
        cursor = self.connection.cursor(DictCursor)
        
        # Get recent queries
        cursor.execute(f"""
            SELECT 
                query_id,
                query_text,
                database_name,
                schema_name,
                query_type,
                user_name,
                start_time,
                end_time,
                total_elapsed_time,
                rows_produced,
                bytes_scanned
            FROM snowflake.account_usage.query_history
            WHERE start_time >= DATEADD(hour, -{hours}, CURRENT_TIMESTAMP())
              AND query_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE_TABLE_AS_SELECT', 'MERGE')
            ORDER BY start_time DESC
            LIMIT 10000
        """)
        
        queries = cursor.fetchall()
        lineage_entries = []
        
        # Parse each query for lineage
        from lambda.lineage_parser.sql_parser import SQLLineageParser
        parser = SQLLineageParser(self.tenant_id, dialect='snowflake')
        
        for query in queries:
            try:
                lineage = parser.parse_query(
                    query['QUERY_TEXT'],
                    query_metadata={
                        'query_id': query['QUERY_ID'],
                        'user': query['USER_NAME'],
                        'timestamp': str(query['START_TIME']),
                        'source': 'snowflake'
                    }
                )
                lineage_entries.append(lineage)
            except Exception as e:
                print(f"Failed to parse query {query['QUERY_ID']}: {e}")
        
        cursor.close()
        
        return {
            'success': True,
            'queries_processed': len(queries),
            'lineage_entries': len(lineage_entries)
        }
    
    def execute_quality_check(self, table_name: str, check_config: Dict) -> Dict:
        """Execute data quality check on Snowflake table"""
        if not self.connection:
            self.connect()
        
        cursor = self.connection.cursor(DictCursor)
        
        check_type = check_config['type']
        
        if check_type == 'completeness':
            columns = check_config['columns']
            threshold = check_config.get('threshold', 0.95)
            
            violations = []
            for column in columns:
                cursor.execute(f"""
                    SELECT 
                        COUNT(*) as total_rows,
                        COUNT({column}) as non_null_rows,
                        (COUNT({column})::FLOAT / COUNT(*)) as completeness
                    FROM {table_name}
                """)
                
                result = cursor.fetchone()
                completeness = result['COMPLETENESS']
                
                if completeness < threshold:
                    violations.append({
                        'column': column,
                        'completeness': completeness,
                        'threshold': threshold,
                        'message': f"Column {column} completeness {completeness*100:.2f}% below threshold"
                    })
            
            return {
                'success': len(violations) == 0,
                'check_type': 'completeness',
                'violations': violations
            }
            
        elif check_type == 'row_count':
            min_rows = check_config.get('min_rows', 0)
            max_rows = check_config.get('max_rows', float('inf'))
            
            cursor.execute(f"SELECT COUNT(*) as row_count FROM {table_name}")
            row_count = cursor.fetchone()['ROW_COUNT']
            
            violations = []
            if row_count < min_rows:
                violations.append({
                    'message': f"Row count {row_count} below minimum {min_rows}",
                    'actual': row_count,
                    'expected_min': min_rows
                })
            elif row_count > max_rows:
                violations.append({
                    'message': f"Row count {row_count} exceeds maximum {max_rows}",
                    'actual': row_count,
                    'expected_max': max_rows
                })
            
            return {
                'success': len(violations) == 0,
                'check_type': 'row_count',
                'violations': violations,
                'row_count': row_count
            }
        
        cursor.close()
    
    def _register_dataset(self, dataset: Dict):
        """Register dataset in DHCaaS catalog"""
        datasets_table = dynamodb.Table('dhcaas-datasets')
        
        datasets_table.put_item(
            Item={
                'datasetId': dataset['dataset_id'],
                'tenantId': self.tenant_id,
                'name': dataset['name'],
                'type': dataset['type'],
                'source': dataset['source'],
                'connection_id': dataset['connection_id'],
                'schema': dataset['schema'],
                'metadata': dataset['metadata'],
                'sync_timestamp': dataset['sync_timestamp']
            }
        )
    
    def close(self):
        """Close Snowflake connection"""
        if self.connection:
            self.connection.close()


def lambda_handler(event, context):
    """Lambda handler for Snowflake connector operations"""
    
    action = event['action']
    tenant_id = event['tenant_id']
    connection_id = event['connection_id']
    
    connector = SnowflakeConnector(tenant_id, connection_id)
    
    try:
        if action == 'sync_metadata':
            result = connector.sync_metadata()
        elif action == 'sync_query_history':
            hours = event.get('hours', 24)
            result = connector.sync_query_history(hours)
        elif action == 'execute_quality_check':
            table_name = event['table_name']
            check_config = event['check_config']
            result = connector.execute_quality_check(table_name, check_config)
        else:
            result = {'success': False, 'error': 'Unknown action'}
    finally:
        connector.close()
    
    return {
        'statusCode': 200,
        'body': json.dumps(result, default=str)
    }
