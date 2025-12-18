# contracts/customer_orders.yaml
version: "1.0"
dataset:
  id: customer_orders
  name: "Customer Orders"
  domain: sales
  owner: data-engineering@company.com
  description: "Production customer order data"

schema:
  type: parquet
  columns:
    - name: order_id
      type: string
      required: true
      unique: true
      description: "Unique order identifier"
      pii: false
      
    - name: customer_id
      type: string
      required: true
      description: "Customer identifier"
      pii: false
      foreign_key:
        table: customers
        column: customer_id
        
    - name: order_date
      type: timestamp
      required: true
      description: "Order placement timestamp"
      
    - name: total_amount
      type: decimal(10,2)
      required: true
      constraints:
        min: 0
        max: 1000000
        
    - name: email
      type: string
      required: true
      pii: true
      pii_type: email
      
    - name: status
      type: string
      required: true
      enum: [pending, processing, shipped, delivered, cancelled]

quality_rules:
  - name: completeness_check
    type: completeness
    columns: [order_id, customer_id, order_date, total_amount]
    threshold: 0.99
    severity: HIGH
    
  - name: referential_integrity
    type: foreign_key_check
    source_column: customer_id
    target_table: customers
    target_column: customer_id
    severity: CRITICAL
    
  - name: amount_range_check
    type: range_check
    column: total_amount
    min: 0
    max: 1000000
    severity: HIGH
    
  - name: freshness_check
    type: freshness
    timestamp_column: order_date
    max_age_hours: 24
    severity: HIGH
    
  - name: pii_protection
    type: pii_detection
    columns: [email]
    pii_types: [email]
    action: mask
    severity: CRITICAL

retention:
  hot_days: 7
  warm_days: 30
  cold_days: 365
  archive_days: 2555  # 7 years for compliance
  
compliance:
  frameworks: [GDPR, CCPA]
  data_classification: confidential
  encryption_required: true
  region_restrictions: [us-east-1, eu-west-1]
  
sla:
  availability: 99.9
  max_latency_ms: 500
  max_downtime_minutes: 43  # 99.9% uptime
  
monitoring:
  health_check_interval_minutes: 5
  alert_on_violation: true
  alert_channels: [slack, email, pagerduty]
  
lineage:
  upstream_dependencies:
    - raw.orders
    - raw.customers
  downstream_consumers:
    - analytics.daily_sales_summary
    - reporting.customer_lifetime_value
    
change_management:
  require_approval: true
  approvers:
    - data-engineering-lead@company.com
    - compliance-team@company.com
  breaking_changes_require_migration: true
  migration_window_days: 14
