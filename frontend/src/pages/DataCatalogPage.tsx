/**
 * Data Catalog Page
 * Browse, search, and filter auto-discovered datasets with smart tags
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  TextField,
  Grid,
  Typography,
  Chip,
  LinearProgress,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
  CircularProgress,
  Alert,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Storage as StorageIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { catalogService, CatalogItem, CatalogStats } from '../services/catalogService';

const DataCatalogPage: React.FC = () => {
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const availableTags = [
    'PII/Sensitive',
    'Financial',
    'Contact',
    'Location',
    'Technical',
    'High',
    'Medium',
    'Low',
  ];

  const loadCatalog = async () => {
    try {
      setLoading(true);
      setError(null);

      const tagsParam = selectedTags.length > 0 ? selectedTags.join(',') : undefined;
      const searchParam = searchQuery.trim() || undefined;

      const [catalogData, statsData] = await Promise.all([
        catalogService.getCatalogItems(page, 20, tagsParam, searchParam),
        catalogService.getCatalogStats(),
      ]);

      setCatalogItems(catalogData.items);
      setTotalItems(catalogData.total);
      setStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load catalog');
      console.error('Catalog load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [page, selectedTags]);

  const handleSearch = () => {
    setPage(1);
    loadCatalog();
  };

  const handleTagChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedTags(typeof value === 'string' ? value.split(',') : value);
    setPage(1);
  };

  const getTagColor = (tag: string): 'error' | 'warning' | 'success' | 'info' | 'default' => {
    if (tag.includes('PII') || tag === 'High') return 'error';
    if (tag === 'Financial' || tag === 'Medium') return 'warning';
    if (tag === 'Low') return 'success';
    return 'info';
  };

  const getQualityColor = (score: number): string => {
    if (score >= 90) return '#4caf50';
    if (score >= 70) return '#ff9800';
    return '#f44336';
  };

  const countSensitiveColumns = (item: CatalogItem): number => {
    return item.columns.filter(col => 
      col.tags?.some(tag => tag === 'PII/Sensitive' || tag === 'High')
    ).length;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          📂 Data Catalog
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Browse and search auto-discovered datasets with smart tagging
        </Typography>
      </Box>

      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Total Datasets
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {stats.total_datasets}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssessmentIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Avg Quality Score
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {stats.average_quality_score.toFixed(1)}%
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircleIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Total Rows
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {stats.total_rows.toLocaleString()}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SecurityIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Unique Tags
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {stats.unique_tags}
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search datasets by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filter by Tags</InputLabel>
              <Select
                multiple
                value={selectedTags}
                onChange={handleTagChange}
                label="Filter by Tags"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {availableTags.map((tag) => (
                  <MenuItem key={tag} value={tag}>
                    {tag}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && catalogItems.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Dataset</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Smart Tags</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Columns</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rows</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Quality Score</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {catalogItems.map((item) => {
                const sensitiveCount = countSensitiveColumns(item);
                return (
                  <TableRow key={item.id || item._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <StorageIcon color="primary" sx={{ mr: 1 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {item.name}
                          </Typography>
                          {item.description && (
                            <Typography variant="caption" color="text.secondary">
                              {item.description.substring(0, 60)}...
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {item.tags.slice(0, 3).map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            color={getTagColor(tag)}
                          />
                        ))}
                        {item.tags.length > 3 && (
                          <Chip
                            label={`+${item.tags.length - 3}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {item.columns.length} total
                      </Typography>
                      {sensitiveCount > 0 && (
                        <Typography variant="caption" color="error">
                          {sensitiveCount} sensitive
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {item.row_count.toLocaleString()}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ width: 100 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ mr: 1 }}>
                            {item.quality_score?.toFixed(1)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={item.quality_score || 0}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getQualityColor(item.quality_score || 0),
                            },
                          }}
                        />
                      </Box>
                    </TableCell>

                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small" color="primary">
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && catalogItems.length === 0 && (
        <Card sx={{ p: 8, textAlign: 'center' }}>
          <StorageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Datasets Found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery || selectedTags.length > 0
              ? 'Try adjusting your search or filters'
              : 'Upload datasets via /api/v1/analysis/scan to see them here'}
          </Typography>
        </Card>
      )}

      {!loading && catalogItems.length > 0 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {catalogItems.length} of {totalItems} datasets
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DataCatalogPage;

