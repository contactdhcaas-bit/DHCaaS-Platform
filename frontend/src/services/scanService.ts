// Add this import at the top if not already there
import api from './api';

// Add this interface for the violation response
export interface PolicyViolation {
  id: string;
  scan_id: string;
  policy_id: string;
  policy_name: string;
  severity: 'critical' | 'warning';
  message: string;
  violated_at: string;
  metadata?: Record<string, any>;
}

// Add this function to your scanService
export const getScanViolations = async (scanId: string): Promise<PolicyViolation[]> => {
  try {
    const response = await api.get(`/scan-jobs/violations/${scanId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching scan violations:', error);
    throw error;
  }
};

// Export it
export default {
  // ... your existing exports
  getScanViolations,
};
