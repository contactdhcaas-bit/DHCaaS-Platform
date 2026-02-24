// src/components/SavedReportsWidget.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  Timeline,
  PieChart as PieChartIcon,
  ShowChart,
  ScatterPlot,
  Delete,
  Refresh,
  TrendingUp,
  AssessmentOutlined,
  AddCircleOutline,
} from '@mui/icons-material';

interface SavedReport {
  id: string;
  title: string;
  description?: string;
  dataset_id: string;
  chart_type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  x_field: string;
  y_field: string;
  aggregation: string;
  created_at: string;
  updated_at?: string;
}

const SavedReportsWidget: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const loadReports = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/v1/reports', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load reports');
      }

      const data = await response.json();
      setReports(data.reports || []);
    } catch (err: any) {
      console.error('Error loading reports:', err);
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDeleteReport = async (reportId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this report?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/v1/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete report');
      }

      // Remove from state
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err: any) {
      console.error('Error deleting report:', err);
      alert('Failed to delete report');
    }
  };

  const handleOpenReport = (reportId: string) => {
    navigate(`/reports/builder?reportId=${reportId}`);
  };

  const getChartIcon = (chartType: string) => {
    switch (chartType) {
      case 'bar':
        return <BarChartIcon sx={{ fontSize: 40, color: '#8884d8' }} />;
      case 'line':
        return <Timeline sx={{ fontSize: 40, color: '#82ca9d' }} />;
      case 'pie':
        return <PieChartIcon sx={{ fontSize: 40, color: '#ffc658' }} />;
      case 'area':
        return <ShowChart sx={{ fontSize: 40, color: '#ff8042' }} />;
      case 'scatter':
        return <ScatterPlot sx={{ fontSize: 40, color: '#0088fe' }} />;
      default:
        return <BarChartIcon sx={{ fontSize: 40, color: '#8884d8' }} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, bgcolor: '#1a1f3a', color: '#fff', borderRadius: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <TrendingUp sx={{ color: '#8884d8' }} />
          <Typography variant="h6">My Reports</Typography>
        </Box>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, bgcolor: '#1a1f3a', color: '#fff', borderRadius: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <TrendingUp sx={{ color: '#8884d8' }} />
          <Typography variant="h6">My Reports</Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={loadReports} startIcon={<Refresh />} variant="outlined">
          Retry
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, bgcolor: '#1a1f3a', color: '#fff', borderRadius: 3 }}>
      {/* Header - Always Visible */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <TrendingUp sx={{ color: '#8884d8' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            My Reports
          </Typography>
          <Chip
            label={reports.length}
            size="small"
            sx={{ 
              bgcolor: reports.length > 0 ? '#8884d8' : '#2a2f4a', 
              color: '#fff',
              fontWeight: 600 
            }}
          />
        </Box>
        {reports.length > 0 && (
          <Tooltip title="Refresh">
            <IconButton onClick={loadReports} size="small" sx={{ color: '#b0b0b0' }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Empty State */}
      {reports.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 280,
            bgcolor: '#0a0e27',
            borderRadius: 2,
            border: '2px dashed #2a2f4a',
            p: 4,
            textAlign: 'center',
          }}
        >
          <AssessmentOutlined 
            sx={{ 
              fontSize: 80, 
              color: '#8884d8',
              opacity: 0.2,
              mb: 2 
            }} 
          />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: '#fff' }}>
            No Reports Yet
          </Typography>
          <Typography variant="body1" sx={{ color: '#b0b0b0', mb: 3, maxWidth: 400 }}>
            Start analyzing your data to uncover insights. Create interactive charts and dashboards with just a few clicks.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddCircleOutline />}
            onClick={() => navigate('/reports/builder')}
            sx={{
              bgcolor: '#8884d8',
              '&:hover': { bgcolor: '#7773c7' },
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Create New Report
          </Button>
        </Box>
      ) : (
        /* Reports Grid */
        <Grid container spacing={2}>
          {reports.map((report) => (
            <Grid item xs={12} sm={6} md={4} key={report.id}>
              <Card
                sx={{
                  bgcolor: '#2a2f4a',
                  color: '#fff',
                  height: '100%',
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': { 
                    bgcolor: '#3a3f5a',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(136, 132, 216, 0.15)',
                  },
                }}
              >
                <CardActionArea onClick={() => handleOpenReport(report.id)}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      {getChartIcon(report.chart_type)}
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteReport(report.id, e)}
                        sx={{ 
                          color: '#ff8042',
                          '&:hover': { bgcolor: 'rgba(255, 128, 66, 0.1)' }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>

                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      noWrap
                      sx={{ fontWeight: 600 }}
                    >
                      {report.title}
                    </Typography>

                    {report.description && (
                      <Typography
                        variant="body2"
                        color="#b0b0b0"
                        sx={{
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          minHeight: 40,
                        }}
                      >
                        {report.description}
                      </Typography>
                    )}

                    <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                      <Chip
                        label={report.chart_type.toUpperCase()}
                        size="small"
                        sx={{ 
                          bgcolor: '#0a0e27', 
                          color: '#8884d8',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                      <Chip
                        label={report.aggregation.toUpperCase()}
                        size="small"
                        sx={{ 
                          bgcolor: '#0a0e27', 
                          color: '#82ca9d',
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>

                    <Typography variant="caption" color="#b0b0b0">
                      📅 {formatDate(report.created_at)}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
};

export default SavedReportsWidget;
