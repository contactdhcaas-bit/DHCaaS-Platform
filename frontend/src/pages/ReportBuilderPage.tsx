// src/pages/ReportBuilderPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert as MuiAlert,
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  Timeline,
  PieChart as PieChartIcon,
  ShowChart,
  ScatterPlot,
  Download,
  Save,
  Info,
  Refresh,
} from '@mui/icons-material';
import {
  BarChart as RechartsBarChart,
  LineChart,
  PieChart as RechartsPieChart,
  AreaChart,
  ScatterChart,
  Bar,
  Line,
  Pie,
  Area,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

import analysisService, {
  ChartDataRequest,
  ChartDataResponse,
  Dataset,
} from '../services/analysisService';

interface Field {
  name: string;
  type: 'dimension' | 'measure';
}

interface ChartConfig {
  datasetId: string;
  xField: string;
  yField: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  colorBy?: string;
}

const ReportBuilderPage: React.FC = () => {
  const navigate = useNavigate();

  // Dataset state
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [loadingDatasets, setLoadingDatasets] = useState<boolean>(true);

  // Fields state
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [measures, setMeasures] = useState<string[]>([]);
  const [loadingFields, setLoadingFields] = useState<boolean>(false);

  // Chart configuration state
  const [config, setConfig] = useState<ChartConfig>({
    datasetId: '',
    xField: '',
    yField: '',
    aggregation: 'sum',
    chartType: 'bar',
    colorBy: undefined,
  });

  // Chart data state
  const [chartData, setChartData] = useState<any[]>([]);
  const [loadingChart, setLoadingChart] = useState<boolean>(false);
  const [chartError, setChartError] = useState<string>('');

  // UI state
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Save dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);
  const [reportTitle, setReportTitle] = useState<string>('');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string>('');

  // Effect 1: Load datasets on mount
  useEffect(() => {
    const loadDatasets = async () => {
      try {
        setLoadingDatasets(true);
        const response = await analysisService.getAvailableDatasets();
        setDatasets(response.datasets);
        
        // Auto-select first dataset if available
        if (response.datasets.length > 0) {
          const firstDataset = response.datasets[0];
          setSelectedDataset(firstDataset.id);
          setConfig((prev) => ({ ...prev, datasetId: firstDataset.id }));
        }
      } catch (error: any) {
        console.error('Error loading datasets:', error);
        setChartError(error.message || 'Failed to load datasets');
      } finally {
        setLoadingDatasets(false);
      }
    };

    loadDatasets();
  }, []);

  // Effect 2: Load fields when dataset changes
  useEffect(() => {
    const loadFields = async () => {
      if (!selectedDataset) {
        setDimensions([]);
        setMeasures([]);
        return;
      }

      try {
        setLoadingFields(true);
        setChartError('');
        
        const fieldsResponse = await analysisService.getAvailableFields(selectedDataset);
        
        setDimensions(fieldsResponse.dimensions || []);
        setMeasures(fieldsResponse.measures || []);

        // Auto-select first dimension and first measure
        if (fieldsResponse.dimensions.length > 0 && fieldsResponse.measures.length > 0) {
          setConfig((prev) => ({
            ...prev,
            datasetId: selectedDataset,
            xField: fieldsResponse.dimensions[0],
            yField: fieldsResponse.measures[0],
          }));
        }
      } catch (error: any) {
        console.error('Error loading fields:', error);
        setChartError(error.message || 'Failed to load dataset fields');
        setDimensions([]);
        setMeasures([]);
      } finally {
        setLoadingFields(false);
      }
    };

    loadFields();
  }, [selectedDataset]);

  // Effect 3: Generate chart when configuration changes
  useEffect(() => {
    const generateChart = async () => {
      // Validate configuration
      if (!config.datasetId || !config.xField || !config.yField) {
        setChartData([]);
        return;
      }

      try {
        setLoadingChart(true);
        setChartError('');

        const request: ChartDataRequest = {
          dataset_id: config.datasetId,
          x_field: config.xField,
          y_field: config.yField,
          aggregation: config.aggregation,
          limit: 20,
        };

        const response: ChartDataResponse = await analysisService.getChartData(request);
        
        // Transform data for Recharts
        const transformedData = response.data.map((point) => ({
          name: point.name,
          value: point.value,
          [config.yField]: point.value,
        }));

        setChartData(transformedData);
      } catch (error: any) {
        console.error('Error generating chart:', error);
        setChartError(error.message || 'Failed to generate chart');
        setChartData([]);
      } finally {
        setLoadingChart(false);
      }
    };

    generateChart();
  }, [config.datasetId, config.xField, config.yField, config.aggregation]);

  // Handler: Dataset selection
  const handleDatasetChange = (datasetId: string) => {
    setSelectedDataset(datasetId);
    setConfig((prev) => ({
      ...prev,
      datasetId,
      xField: '',
      yField: '',
    }));
    setChartData([]);
  };

  // Handler: Field selection
  const handleFieldChange = (fieldType: 'x' | 'y', fieldName: string) => {
    if (fieldType === 'x') {
      setConfig((prev) => ({ ...prev, xField: fieldName }));
    } else {
      setConfig((prev) => ({ ...prev, yField: fieldName }));
    }
  };

  // Handler: Aggregation change
  const handleAggregationChange = (aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max') => {
    setConfig((prev) => ({ ...prev, aggregation }));
  };

  // Handler: Chart type change
  const handleChartTypeChange = (chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter') => {
    setConfig((prev) => ({ ...prev, chartType }));
  };

  // Handler: Save report
  const handleSaveReport = async () => {
    if (!reportTitle.trim()) {
      setSaveError('Please enter a report title');
      return;
    }

    if (!config.datasetId || !config.xField || !config.yField) {
      setSaveError('Please configure all chart fields before saving');
      return;
    }

    try {
      setSaving(true);
      setSaveError('');

      const reportData = {
        title: reportTitle.trim(),
        description: reportDescription.trim() || null,
        dataset_id: config.datasetId,
        chart_type: config.chartType,
        x_field: config.xField,
        y_field: config.yField,
        aggregation: config.aggregation,
        config: {
          colorBy: config.colorBy,
          chartData: chartData.slice(0, 5), // Save first 5 data points for preview
        },
      };

      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/v1/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save report');
      }

      const savedReport = await response.json();
      console.log('Report saved successfully:', savedReport);

      // Show success message
      setSaveSuccess(true);
      setSaveDialogOpen(false);
      setReportTitle('');
      setReportDescription('');

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error('Error saving report:', error);
      setSaveError(error.message || 'Failed to save report');
    } finally {
      setSaving(false);
    }
  };

  // Filter fields by search term
  const filteredDimensions = dimensions.filter((dim) =>
    dim.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMeasures = measures.filter((measure) =>
    measure.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe', '#00c49f'];

  // Render chart based on type
  const renderChart = () => {
    if (loadingChart) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height={400}>
          <CircularProgress />
        </Box>
      );
    }

    if (chartError) {
      return (
        <Alert severity="error" sx={{ m: 2 }}>
          {chartError}
        </Alert>
      );
    }

    if (chartData.length === 0) {
      return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={400}>
          <Typography color="text.secondary" variant="h6" gutterBottom>
            Start Your Analysis
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Select a dataset from the left panel to automatically generate insights
          </Typography>
        </Box>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
    };

    switch (config.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsBarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name={config.yField} />
            </RechartsBarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" name={config.yField} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsPieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" name={config.yField} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis dataKey="value" />
              <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name={config.yField} data={chartData} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#0a0e27', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#fff', mb: 3 }}>
        Enterprise Report Builder
      </Typography>
      <Typography variant="body2" sx={{ color: '#b0b0b0', mb: 4 }}>
        Drag and drop fields to build interactive analytics reports
      </Typography>

      <Grid container spacing={3}>
        {/* Left Panel - Dataset & Fields */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, bgcolor: '#1a1f3a', color: '#fff', height: '100%' }}>
            {/* Dataset Selector */}
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Dataset
            </Typography>
            <FormControl fullWidth size="small" sx={{ mb: 3 }}>
              {loadingDatasets ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : datasets.length === 0 ? (
                <Alert severity="warning">No datasets available</Alert>
              ) : (
                <Select
                  value={selectedDataset}
                  onChange={(e) => handleDatasetChange(e.target.value)}
                  sx={{ bgcolor: '#2a2f4a', color: '#fff' }}
                >
                  {datasets.map((dataset) => (
                    <MenuItem key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            </FormControl>

            {/* Search Fields */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2, bgcolor: '#2a2f4a', borderRadius: 1 }}
              InputProps={{ style: { color: '#fff' } }}
            />

            <Divider sx={{ my: 2, bgcolor: '#3a3f5a' }} />

            {/* Available Fields */}
            <Typography variant="subtitle2" gutterBottom sx={{ color: '#b0b0b0' }}>
              Available Fields ({dimensions.length + measures.length})
            </Typography>

            {loadingFields ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Box>
                {/* Dimensions */}
                <Typography variant="caption" sx={{ color: '#82ca9d', fontWeight: 600, mt: 2, display: 'block' }}>
                  📊 Dimensions
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {filteredDimensions.map((dim) => (
                    <Chip
                      key={dim}
                      label={dim}
                      size="small"
                      onClick={() => handleFieldChange('x', dim)}
                      sx={{
                        m: 0.5,
                        bgcolor: config.xField === dim ? '#82ca9d' : '#2a2f4a',
                        color: '#fff',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#82ca9d' },
                      }}
                      icon={<Info fontSize="small" />}
                    />
                  ))}
                </Box>

                {/* Measures */}
                <Typography variant="caption" sx={{ color: '#8884d8', fontWeight: 600, mt: 2, display: 'block' }}>
                  📈 Measures
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {filteredMeasures.map((measure) => (
                    <Chip
                      key={measure}
                      label={measure}
                      size="small"
                      onClick={() => handleFieldChange('y', measure)}
                      sx={{
                        m: 0.5,
                        bgcolor: config.yField === measure ? '#8884d8' : '#2a2f4a',
                        color: '#fff',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: '#8884d8' },
                      }}
                      icon={<Info fontSize="small" />}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Panel - Chart & Configuration */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2, bgcolor: '#1a1f3a', color: '#fff', mb: 2 }}>
            {/* Chart Type Toolbar */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" gap={1}>
                <Tooltip title="Bar Chart">
                  <IconButton
                    onClick={() => handleChartTypeChange('bar')}
                    sx={{ color: config.chartType === 'bar' ? '#8884d8' : '#b0b0b0' }}
                  >
                    <BarChartIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Line Chart">
                  <IconButton
                    onClick={() => handleChartTypeChange('line')}
                    sx={{ color: config.chartType === 'line' ? '#8884d8' : '#b0b0b0' }}
                  >
                    <Timeline />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Pie Chart">
                  <IconButton
                    onClick={() => handleChartTypeChange('pie')}
                    sx={{ color: config.chartType === 'pie' ? '#8884d8' : '#b0b0b0' }}
                  >
                    <PieChartIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Area Chart">
                  <IconButton
                    onClick={() => handleChartTypeChange('area')}
                    sx={{ color: config.chartType === 'area' ? '#8884d8' : '#b0b0b0' }}
                  >
                    <ShowChart />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Scatter Plot">
                  <IconButton
                    onClick={() => handleChartTypeChange('scatter')}
                    sx={{ color: config.chartType === 'scatter' ? '#8884d8' : '#b0b0b0' }}
                  >
                    <ScatterPlot />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box display="flex" gap={1}>
                <Button variant="outlined" startIcon={<Download />} size="small">
                  Export CSV
                </Button>
                <Button variant="outlined" startIcon={<Download />} size="small">
                  Export PDF
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  size="small"
                  onClick={() => setSaveDialogOpen(true)}
                  disabled={!config.datasetId || !config.xField || !config.yField}
                >
                  Save Report
                </Button>
              </Box>
            </Box>

            {/* Configuration Bar */}
            <Box display="flex" gap={2} mb={2} alignItems="center" flexWrap="wrap">
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel sx={{ color: '#b0b0b0' }}>X-Axis (Dimension)</InputLabel>
                <Select
                  value={config.xField}
                  label="X-Axis (Dimension)"
                  onChange={(e) => handleFieldChange('x', e.target.value)}
                  sx={{ bgcolor: '#2a2f4a', color: '#fff' }}
                >
                  {dimensions.map((dim) => (
                    <MenuItem key={dim} value={dim}>
                      {dim}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel sx={{ color: '#b0b0b0' }}>Y-Axis (Measure)</InputLabel>
                <Select
                  value={config.yField}
                  label="Y-Axis (Measure)"
                  onChange={(e) => handleFieldChange('y', e.target.value)}
                  sx={{ bgcolor: '#2a2f4a', color: '#fff' }}
                >
                  {measures.map((measure) => (
                    <MenuItem key={measure} value={measure}>
                      {measure}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: '#b0b0b0' }}>Aggregation</InputLabel>
                <Select
                  value={config.aggregation}
                  label="Aggregation"
                  onChange={(e) => handleAggregationChange(e.target.value as any)}
                  sx={{ bgcolor: '#2a2f4a', color: '#fff' }}
                >
                  <MenuItem value="sum">Sum</MenuItem>
                  <MenuItem value="avg">Average</MenuItem>
                  <MenuItem value="count">Count</MenuItem>
                  <MenuItem value="min">Min</MenuItem>
                  <MenuItem value="max">Max</MenuItem>
                </Select>
              </FormControl>

              <Chip
                label={`${chartData.length} data points`}
                size="small"
                sx={{ bgcolor: '#2a2f4a', color: '#b0b0b0' }}
              />
            </Box>

            {/* Chart Display */}
            <Box sx={{ bgcolor: '#0a0e27', borderRadius: 2, p: 2 }}>
              {renderChart()}
            </Box>
          </Paper>

          {/* Data Drill-Down Table */}
          {chartData.length > 0 && (
            <Paper sx={{ p: 2, bgcolor: '#1a1f3a', color: '#fff' }}>
              <Typography variant="h6" gutterBottom>
                Data Drill-Down: {config.xField} vs {config.yField}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#82ca9d', fontWeight: 600 }}>{config.xField}</TableCell>
                      <TableCell align="right" sx={{ color: '#8884d8', fontWeight: 600 }}>
                        {config.yField} ({config.aggregation})
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {chartData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell sx={{ color: '#fff' }}>{row.name}</TableCell>
                        <TableCell align="right" sx={{ color: '#fff' }}>
                          {typeof row.value === 'number' ? row.value.toLocaleString() : row.value}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Save Report Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => !saving && setSaveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#1a1f3a', color: '#fff' },
        }}
      >
        <DialogTitle>Save Report</DialogTitle>
        <DialogContent>
          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}
          
          <TextField
            autoFocus
            fullWidth
            label="Report Title"
            value={reportTitle}
            onChange={(e) => setReportTitle(e.target.value)}
            placeholder="e.g., Monthly Sales by Category"
            required
            sx={{ mt: 2, mb: 2, bgcolor: '#2a2f4a' }}
            InputLabelProps={{ style: { color: '#b0b0b0' } }}
            InputProps={{ style: { color: '#fff' } }}
          />
          
          <TextField
            fullWidth
            label="Description (Optional)"
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            placeholder="Describe what this report shows..."
            multiline
            rows={3}
            sx={{ mb: 2, bgcolor: '#2a2f4a' }}
            InputLabelProps={{ style: { color: '#b0b0b0' } }}
            InputProps={{ style: { color: '#fff' } }}
          />

          {/* Report Configuration Preview */}
          <Box sx={{ bgcolor: '#0a0e27', p: 2, borderRadius: 1 }}>
            <Typography variant="caption" sx={{ color: '#b0b0b0', display: 'block', mb: 1 }}>
              Configuration Preview:
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" color="#82ca9d">Dataset:</Typography>
                <Typography variant="body2">{datasets.find(d => d.id === config.datasetId)?.name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="#82ca9d">Chart Type:</Typography>
                <Typography variant="body2">{config.chartType.toUpperCase()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="#82ca9d">X-Axis:</Typography>
                <Typography variant="body2">{config.xField || 'Not set'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="#82ca9d">Y-Axis:</Typography>
                <Typography variant="body2">{config.yField || 'Not set'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="#82ca9d">Aggregation:</Typography>
                <Typography variant="body2">{config.aggregation.toUpperCase()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="#82ca9d">Data Points:</Typography>
                <Typography variant="body2">{chartData.length}</Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setSaveDialogOpen(false)} 
            disabled={saving}
            sx={{ color: '#b0b0b0' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveReport}
            variant="contained"
            disabled={saving || !reportTitle.trim()}
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
          >
            {saving ? 'Saving...' : 'Save Report'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={saveSuccess}
        autoHideDuration={3000}
        onClose={() => setSaveSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={() => setSaveSuccess(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          Report saved successfully! View it on the Dashboard.
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default ReportBuilderPage;
