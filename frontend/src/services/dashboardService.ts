// src/services/dashboardService.ts
import api from '../api/axios';

// ===== BACKEND RESPONSE INTERFACE =====
export interface DashboardStatsResponse {
  stats: {
    total_scans: number;
    active_incidents: number;
    total_sources: number;
    total_assets: number;
  };
  recent_scans: Array<{
    id: string;
    name: string;
    status: string;
    created_at: string;
  }>;
  recent_incidents: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    created_at: string;
    job_id?: string;        // ← ADDED
    rule_id?: string;       // ← ADDED
  }>;
  user: {
    email: string;
    role: string;
    full_name: string;
  };
}

// ===== LEGACY INTERFACE (For backwards compatibility) =====
export interface DashboardStats {
  total_scans: number;
  recent_scans: number;
  average_quality_score: number;
  active_policies: number;
  total_policies: number;
  integration_rows: number;
  active_api_keys: number;
  critical_violations: number;
  last_updated: string;
}

class DashboardService {
  /**
   * Get dashboard statistics from backend
   * Returns real data from MongoDB
   */
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    try {
      console.log('📊 Fetching dashboard stats...');
      
      const response = await api.get<DashboardStatsResponse>('/dashboard/stats');
      
      // ✅ ENSURE job_id and rule_id are present
      const processedData = {
        ...response.data,
        recent_incidents: response.data.recent_incidents.map((incident: any) => ({
          id: incident.id || incident._id,
          title: incident.title,
          severity: incident.severity,
          status: incident.status,
          created_at: incident.created_at,
          job_id: incident.job_id || incident.dataset_id || 'unknown',
          rule_id: incident.rule_id || incident.id,
        })),
      };
      
      console.log('✅ Dashboard stats received:', processedData);
      return processedData;
      
    } catch (error: any) {
      console.error('❌ Error fetching dashboard stats:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  }

  /**
   * Format large numbers with K/M suffix
   * @param num - Number to format
   * @returns Formatted string (e.g., "1.5K", "2.3M")
   */
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }

  /**
   * Get color class based on quality score
   * @param score - Quality score (0-100)
   * @returns Tailwind CSS color class
   */
  getQualityScoreColor(score: number): string {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  }

  /**
   * Get quality score label
   * @param score - Quality score (0-100)
   * @returns Label string
   */
  getQualityScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Improvement';
  }

  /**
   * Get severity color for incidents
   * @param severity - Incident severity (low, medium, high, critical)
   * @returns Tailwind CSS color class
   */
  getSeverityColor(severity: string): string {
    const severityMap: { [key: string]: string } = {
      critical: 'text-red-500 bg-red-500/10',
      high: 'text-orange-500 bg-orange-500/10',
      medium: 'text-yellow-500 bg-yellow-500/10',
      low: 'text-blue-500 bg-blue-500/10',
    };
    return severityMap[severity.toLowerCase()] || 'text-gray-500 bg-gray-500/10';
  }

  /**
   * Get status color for scans
   * @param status - Scan status (completed, running, failed, unknown)
   * @returns Tailwind CSS color class
   */
  getStatusColor(status: string): string {
    const statusMap: { [key: string]: string } = {
      completed: 'text-green-500 bg-green-500/10',
      running: 'text-blue-500 bg-blue-500/10',
      failed: 'text-red-500 bg-red-500/10',
      unknown: 'text-gray-500 bg-gray-500/10',
    };
    return statusMap[status.toLowerCase()] || 'text-gray-500 bg-gray-500/10';
  }

  /**
   * Format date string to relative time
   * @param dateString - ISO date string
   * @returns Relative time string (e.g., "2 hours ago")
   */
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  }

  /**
   * Format date string to short date
   * @param dateString - ISO date string
   * @returns Short date string (e.g., "Feb 18, 2026")
   */
  formatShortDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
