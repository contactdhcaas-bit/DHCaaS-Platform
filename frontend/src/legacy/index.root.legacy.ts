// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  DATA_OWNER = 'DATA_OWNER',
  DATA_STEWARD = 'DATA_STEWARD',
  ANALYST = 'ANALYST',
  VIEWER = 'VIEWER'
}

export enum DataSourceType {
  POSTGRESQL = 'POSTGRESQL',
  MYSQL = 'MYSQL',
  SNOWFLAKE = 'SNOWFLAKE',
  BIGQUERY = 'BIGQUERY',
  REDSHIFT = 'REDSHIFT',
  DATABRICKS = 'DATABRICKS',
  S3 = 'S3'
}

export enum AssetType {
  TABLE = 'TABLE',
  VIEW = 'VIEW',
  DATASET = 'DATASET',
  PIPELINE = 'PIPELINE'
}

export enum RuleType {
  COMPLETENESS = 'COMPLETENESS',
  UNIQUENESS = 'UNIQUENESS',
  VALIDITY = 'VALIDITY',
  CONSISTENCY = 'CONSISTENCY',
  TIMELINESS = 'TIMELINESS',
  ACCURACY = 'ACCURACY'
}

export enum IncidentStatus {
  OPEN = 'OPEN',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  INVESTIGATING = 'INVESTIGATING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum IncidentSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  UNKNOWN = 'UNKNOWN'
}

// Core Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  settings: {
    aiEnabled: boolean;
    autoRemediation: boolean;
    notificationsEnabled: boolean;
    retentionDays: number;
  };
  createdAt: string;
}

export interface DataSource {
  id: string;
  organizationId: string;
  name: string;
  type: DataSourceType;
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastSyncAt?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface Asset {
  id: string;
  organizationId: string;
  dataSourceId: string;
  name: string;
  fullyQualifiedName: string;
  type: AssetType;
  schema?: string;
  description?: string;
  owner?: string;
  tags: string[];
  columns?: Column[];
  healthScore: number;
  healthStatus: HealthStatus;
  rowCount?: number;
  sizeBytes?: number;
  lastUpdatedAt?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface Column {
  name: string;
  dataType: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isNullable: boolean;
  description?: string;
  sampleValues?: string[];
}

export interface Rule {
  id: string;
  organizationId: string;
  assetId: string;
  name: string;
  description?: string;
  type: RuleType;
  severity: IncidentSeverity;
  enabled: boolean;
  schedule: string; // cron expression
  config: RuleConfig;
  lastRunAt?: string;
  lastRunStatus?: 'SUCCESS' | 'FAILED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleConfig {
  column?: string;
  threshold?: number;
  expression?: string;
  customSql?: string;
  parameters?: Record<string, any>;
}

export interface Evaluation {
  id: string;
  ruleId: string;
  assetId: string;
  status: 'PASSED' | 'FAILED' | 'ERROR';
  executedAt: string;
  executionTimeMs: number;
  result: {
    passed: boolean;
    actual?: number;
    expected?: number;
    violations?: number;
    message?: string;
    details?: Record<string, any>;
  };
}

export interface Incident {
  id: string;
  organizationId: string;
  assetId: string;
  ruleId?: string;
  evaluationId?: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignedTo?: string;
  impact?: {
    downstreamAssets: number;
    affectedUsers: number;
    estimatedCost?: number;
  };
  aiDiagnosis?: {
    rootCause?: string;
    recommendation?: string;
    confidence: number;
    generatedAt: string;
  };
  timeline: IncidentTimelineEvent[];
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface IncidentTimelineEvent {
  id: string;
  type: 'CREATED' | 'ACKNOWLEDGED' | 'COMMENT' | 'STATUS_CHANGE' | 'ASSIGNED' | 'RESOLVED';
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Alert {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: 'INCIDENT' | 'RULE_FAILURE' | 'ASSET_HEALTH' | 'ANOMALY';
  channels: ('EMAIL' | 'SLACK' | 'WEBHOOK')[];
  recipients: string[];
  conditions: {
    severity?: IncidentSeverity[];
    assetIds?: string[];
    ruleIds?: string[];
  };
  enabled: boolean;
  createdAt: string;
}

export interface DashboardKPI {
  totalAssets: number;
  healthyAssets: number;
  warningAssets: number;
  criticalAssets: number;
  openIncidents: number;
  rulesExecuted: number;
  avgHealthScore: number;
  trendData: TrendData[];
}

export interface TrendData {
  date: string;
  healthScore: number;
  incidents: number;
  rulesExecuted: number;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

// Filter and Query Types
export interface FilterOptions {
  search?: string;
  status?: string[];
  severity?: string[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// AI Types
export interface AIDiagnosisRequest {
  incidentId: string;
  context?: string;
}

export interface AIDiagnosisResponse {
  rootCause: string;
  recommendation: string;
  confidence: number;
  relatedIncidents?: string[];
  suggestedActions?: string[];
}

export interface AIRuleSuggestion {
  ruleType: RuleType;
  assetId: string;
  columnName?: string;
  confidence: number;
  reasoning: string;
  suggestedConfig: RuleConfig;
}
