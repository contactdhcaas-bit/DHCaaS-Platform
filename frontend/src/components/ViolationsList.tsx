import React, { useEffect, useState } from 'react';
import { getScanViolations, PolicyViolation } from '../services/scanService';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  WarningAmber as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';

interface ViolationsListProps {
  scanId: string;
}

const ViolationsList: React.FC<ViolationsListProps> = ({ scanId }) => {
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchViolations = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getScanViolations(scanId);
        setViolations(data);
      } catch (err: any) {
        console.error('Failed to fetch violations:', err);
        setError(err.response?.data?.message || 'Failed to load violations');
      } finally {
        setLoading(false);
      }
    };

    if (scanId) {
      fetchViolations();
    }
  }, [scanId]);

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  // Empty state - All Clear
  if (violations.length === 0) {
    return (
      <Alert
        severity="success"
        icon={<CheckIcon fontSize="large" />}
        sx={{
          mt: 2,
          py: 3,
          backgroundColor: '#e8f5e9',
          border: '2px solid #4caf50',
          '& .MuiAlert-icon': {
            fontSize: '2rem',
          },
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          ✅ All Clear - Compliant
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          This scan has no policy violations. All quality checks passed successfully.
        </Typography>
      </Alert>
    );
  }

  // Violations list
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {violations.length} Policy Violation{violations.length > 1 ? 's' : ''} Detected
      </Typography>

      <Stack spacing={2}>
        {violations.map((violation) => {
          const isCritical = violation.severity === 'critical';
          
          return (
            <Card
              key={violation.id}
              sx={{
                border: `2px solid ${isCritical ? '#d32f2f' : '#ff9800'}`,
                backgroundColor: isCritical ? '#ffebee' : '#fff3e0',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {isCritical ? (
                      <ErrorIcon sx={{ color: '#d32f2f', fontSize: 28 }} />
                    ) : (
                      <WarningIcon sx={{ color: '#ff9800', fontSize: 28 }} />
                    )}
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {violation.policy_name}
                    </Typography>
                  </Box>
                  
                  <Chip
                    label={isCritical ? 'CRITICAL' : 'WARNING'}
                    size="small"
                    sx={{
                      backgroundColor: isCritical ? '#d32f2f' : '#ff9800',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      px: 1,
                    }}
                  />
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="body1" sx={{ mb: 2, color: '#333' }}>
                  {violation.message}
                </Typography>

                {violation.metadata && Object.keys(violation.metadata).length > 0 && (
                  <Box
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      borderRadius: 1,
                      p: 1.5,
                      mt: 2,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>
                      Additional Details:
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {Object.entries(violation.metadata).map(([key, value]) => (
                        <Typography key={key} variant="caption" display="block" sx={{ color: '#555' }}>
                          <strong>{key}:</strong> {String(value)}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}

                <Typography
                  variant="caption"
                  sx={{ display: 'block', mt: 2, color: '#999', fontStyle: 'italic' }}
                >
                  Violated at: {new Date(violation.violated_at).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};

export default ViolationsList;
