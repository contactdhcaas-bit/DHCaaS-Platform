/**
 * S3 File Browser - Full-Screen File Explorer
 * Windows Explorer / Finder style interface for S3 files
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  InputAdornment,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Snackbar,
  Checkbox,
  Menu,
  MenuItem,
  Toolbar,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  Folder,
  FileText,
  Download,
  Scan,
  ChevronRight,
  Home,
  ArrowLeft,
  MoreVertical,
  RefreshCw,
  Filter,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import connectorService, { S3File, AWSCredentials } from '../services/connectorService';

const S3FileBrowser: React.FC = () => {
  const { connectionId } = useParams<{ connectionId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<S3File[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<S3File[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [scanningFiles, setScanningFiles] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentBucket, setCurrentBucket] = useState<string>('');
  const [credentials, setCredentials] = useState<AWSCredentials | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadConnection();
  }, [connectionId]);

  useEffect(() => {
    filterAndSortFiles();
  }, [files, searchQuery, sortBy, sortOrder]);

  const loadConnection = async () => {
    try {
      // Load stored credentials from localStorage
      const storedConnection = localStorage.getItem(`s3_connection_${connectionId}`);
      
      if (!storedConnection) {
        setSnackbar({
          open: true,
          message: 'Connection not found. Please reconnect.',
          severity: 'error',
        });
        setTimeout(() => navigate('/connectors'), 2000);
        return;
      }

      const connection = JSON.parse(storedConnection);
      setCredentials(connection.credentials);
      setCurrentBucket(connection.buckets[0] || '');

      // Load files from first bucket
      if (connection.buckets[0]) {
        await loadFiles(connection.credentials, connection.buckets[0]);
      }
    } catch (error) {
      console.error('Failed to load connection:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load connection',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async (creds: AWSCredentials, bucket: string) => {
    setLoading(true);
    try {
      const response = await connectorService.listFiles(creds, bucket);
      
      if (response.success) {
        setFiles(response.files);
        setSnackbar({
          open: true,
          message: `Loaded ${response.file_count} files from ${bucket}`,
          severity: 'success',
        });
      } else {
        throw new Error('Failed to load files');
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || 'Failed to load files',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortFiles = () => {
    let result = [...files];

    // Filter by search query
    if (searchQuery) {
      result = result.filter((file) =>
        file.key.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort files
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.key.localeCompare(b.key);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
          comparison =
            new Date(a.last_modified || 0).getTime() -
            new Date(b.last_modified || 0).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredFiles(result);
  };

  const handleScanFile = async (file: S3File) => {
    if (!credentials) return;

    setScanningFiles((prev) => new Set(prev).add(file.key));

    try {
      const response = await connectorService.scanS3File({
        bucket_name: currentBucket,
        file_key: file.key,
        aws_access_key_id: credentials.aws_access_key_id,
        aws_secret_access_key: credentials.aws_secret_access_key,
        region_name: credentials.region_name,
        scan_name: `S3 Scan - ${file.key}`,
      });

      if (response.success && response.job_id) {
        setSnackbar({
          open: true,
          message: `Successfully scanned ${file.key}!`,
          severity: 'success',
        });

        // Redirect to scan results after a short delay
        setTimeout(() => {
          navigate(`/quality/${response.job_id}`);
        }, 1500);
      } else {
        throw new Error('Scan failed');
      }
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || `Failed to scan ${file.key}`,
        severity: 'error',
      });
    } finally {
      setScanningFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(file.key);
        return newSet;
      });
    }
  };

  const handleSelectFile = (fileKey: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileKey)) {
        newSet.delete(fileKey);
      } else {
        newSet.add(fileKey);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map((f) => f.key)));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const getFileColor = (extension: string): string => {
    switch (extension.toLowerCase()) {
      case 'csv':
        return '#22c55e';
      case 'xlsx':
      case 'xls':
        return '#3b82f6';
      case 'json':
        return '#f59e0b';
      case 'parquet':
        return '#8b5cf6';
      default:
        return '#64748b';
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <IconButton
              onClick={() => navigate('/connectors')}
              sx={{
                color: 'white',
                background: 'rgba(255, 255, 255, 0.05)',
                '&:hover': { background: 'rgba(255, 255, 255, 0.1)' },
              }}
            >
              <ArrowLeft size={20} />
            </IconButton>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                S3 File Browser
              </Typography>
              <Breadcrumbs
                separator={<ChevronRight size={16} color="#94a3b8" />}
                sx={{ mt: 1 }}
              >
                <Link
                  color="inherit"
                  href="#"
                  sx={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  <Home size={14} />
                  S3
                </Link>
                <Typography sx={{ color: '#60a5fa', fontWeight: 600 }}>
                  {currentBucket}
                </Typography>
              </Breadcrumbs>
            </Box>
          </Box>

          {/* Toolbar */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              p: 2,
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
            }}
          >
            <TextField
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                flexGrow: 1,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(59, 130, 246, 0.5)' },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color="#94a3b8" />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              onClick={() => credentials && loadFiles(credentials, currentBucket)}
              startIcon={<RefreshCw size={16} />}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                '&:hover': { borderColor: '#60a5fa', background: 'rgba(96, 165, 250, 0.1)' },
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* File Table */}
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress />
            <Typography sx={{ color: 'white', mt: 2 }}>Loading files...</Typography>
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                      onChange={handleSelectAll}
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>File Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Size</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Last Modified</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow
                    key={file.key}
                    hover
                    sx={{
                      '&:hover': { background: 'rgba(255, 255, 255, 0.02)' },
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedFiles.has(file.key)}
                        onChange={() => handleSelectFile(file.key)}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FileText size={18} color="#60a5fa" />
                        <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                          {file.key}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getFileExtension(file.key)}
                        size="small"
                        sx={{
                          background: getFileColor(getFileExtension(file.key)) + '20',
                          color: getFileColor(getFileExtension(file.key)),
                          border: `1px solid ${getFileColor(getFileExtension(file.key))}40`,
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{formatFileSize(file.size)}</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{formatDate(file.last_modified)}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleScanFile(file)}
                        disabled={scanningFiles.has(file.key)}
                        startIcon={
                          scanningFiles.has(file.key) ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <Scan size={16} />
                          )
                        }
                        sx={{
                          minWidth: 120,
                          background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                          },
                        }}
                      >
                        {scanningFiles.has(file.key) ? 'Scanning...' : 'Scan File'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {filteredFiles.length === 0 && !loading && (
          <Box
            sx={{
              textAlign: 'center',
              py: 8,
              color: 'rgba(148, 163, 184, 0.8)',
            }}
          >
            <Typography variant="h6">No files found</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {searchQuery ? 'Try a different search query' : 'This bucket is empty'}
            </Typography>
          </Box>
        )}
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default S3FileBrowser;
