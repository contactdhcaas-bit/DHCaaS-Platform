// frontend/src/pages/NewScanPage.tsx
import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as StorageIcon,
  Storage as DatabaseIcon,
  Visibility,
  VisibilityOff,
  Language as LanguageIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`scan-tabpanel-${index}`}
      aria-labelledby={`scan-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const NewScanPage: React.FC = () => {
  const navigate = useNavigate();

  // Theme tokens (matched to Dashboard look)
  const themeTokens = useMemo(
    () => ({
      appBg: '#111828',
      cardBg: '#242c3b',
      cardBorder: 'rgba(255,255,255,0.10)',
      divider: 'rgba(255,255,255,0.10)',
      textPrimary: '#ffffff',
      textSecondary: 'rgba(255,255,255,0.70)',
      textMuted: 'rgba(255,255,255,0.55)',
      inputBg: 'rgba(255,255,255,0.06)',
      inputBorder: 'rgba(255,255,255,0.14)',
      inputBorderHover: 'rgba(255,255,255,0.22)',
      inputBorderFocus: 'rgba(116,71,221,0.75)', // #7447dd
      purple: '#7447dd',
      purple2: '#5b6cff',
      shadow: '0 18px 45px rgba(0,0,0,0.45)',
      radius: 14,
    }),
    []
  );

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Database config
  const [dbConfig, setDbConfig] = useState({
    source_type: 'postgresql',
    host: 'localhost',
    port: '5432',
    database: '',
    username: '',
    password: '',
    table: '',
  });

  // S3 config
  const [s3Config, setS3Config] = useState({
    bucket: '',
    key: '',
    region: 'us-east-1',
    aws_access_key_id: '',
    aws_secret_access_key: '',
    s3_file_format: 'csv',
  });

  // Global options
  const [scanOptions, setScanOptions] = useState({
    email_mx_validation: false,
    mx_timeout: 5,
  });

  const [language, setLanguage] = useState('en');
  const [datasourceName, setDatasourceName] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
  };

  const handleDbConfigChange = (field: string, value: string) => {
    setDbConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleS3ConfigChange = (field: string, value: string) => {
    setS3Config((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (tabValue === 0) {
      if (!dbConfig.host || !dbConfig.database || !dbConfig.username || !dbConfig.table) {
        setError('Please fill in all required database fields');
        return false;
      }
    } else {
      if (!s3Config.bucket || !s3Config.key) {
        setError('Please provide S3 Bucket and File Key');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload: any = {
        scan_options: scanOptions,
        language: language,
        datasource_name: datasourceName || undefined,
      };

      if (tabValue === 0) {
        payload.source_type = dbConfig.source_type;
        payload.source_config = {
          host: dbConfig.host,
          port: parseInt(dbConfig.port),
          database: dbConfig.database,
          username: dbConfig.username,
          password: dbConfig.password,
          table: dbConfig.table,
        };
      } else {
        payload.source_type = 's3';
        payload.source_config = {
          bucket: s3Config.bucket,
          key: s3Config.key,
          region: s3Config.region,
          s3_file_format: s3Config.s3_file_format,
        };

        if (s3Config.aws_access_key_id && s3Config.aws_secret_access_key) {
          payload.source_config.aws_access_key_id = s3Config.aws_access_key_id;
          payload.source_config.aws_secret_access_key = s3Config.aws_secret_access_key;
        }
      }

      const response = await axios.post(`${API_BASE_URL}/api/v1/scan-jobs/`, payload);
      navigate(`/scans/${response.data.job_id}`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to create scan job';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Shared dark styles
  const cardSx = {
    p: { xs: 2.5, md: 3.5 },
    borderRadius: `${themeTokens.radius}px`,
    background: `linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%), ${themeTokens.cardBg}`,
    border: `1px solid ${themeTokens.cardBorder}`,
    boxShadow: themeTokens.shadow,
  };

  const labelSx = {
    color: themeTokens.textSecondary,
    fontWeight: 600,
  };

  const sectionTitleSx = {
    color: themeTokens.textPrimary,
    fontWeight: 700,
    letterSpacing: 0.2,
  };

  const helperTextSx = {
    color: themeTokens.textMuted,
  };

  const darkTextFieldSx = {
    '& .MuiInputLabel-root': {
      color: themeTokens.textSecondary,
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: themeTokens.textSecondary,
    },
    '& .MuiOutlinedInput-root': {
      color: themeTokens.textPrimary,
      backgroundColor: themeTokens.inputBg,
      borderRadius: '12px',
      '& fieldset': {
        borderColor: themeTokens.inputBorder,
      },
      '&:hover fieldset': {
        borderColor: themeTokens.inputBorderHover,
      },
      '&.Mui-focused fieldset': {
        borderColor: themeTokens.inputBorderFocus,
      },
    },
    '& .MuiFormHelperText-root': {
      color: themeTokens.textMuted,
    },
    '& input::placeholder': {
      color: 'rgba(255,255,255,0.35)',
      opacity: 1,
    },
  };

  const darkSelectSx = {
    '& .MuiInputLabel-root': {
      color: themeTokens.textSecondary,
    },
    '& .MuiOutlinedInput-root': {
      color: themeTokens.textPrimary,
      backgroundColor: themeTokens.inputBg,
      borderRadius: '12px',
      '& fieldset': {
        borderColor: themeTokens.inputBorder,
      },
      '&:hover fieldset': {
        borderColor: themeTokens.inputBorderHover,
      },
      '&.Mui-focused fieldset': {
        borderColor: themeTokens.inputBorderFocus,
      },
      '& .MuiSvgIcon-root': {
        color: themeTokens.textSecondary,
      },
    },
  };

  const segmentedTabsSx = {
    minHeight: 44,
    '& .MuiTabs-flexContainer': {
      gap: 6,
    },
    '& .MuiTabs-indicator': {
      display: 'none',
    },
    '& .MuiTab-root': {
      minHeight: 44,
      textTransform: 'none' as const,
      fontWeight: 700,
      borderRadius: '12px',
      color: themeTokens.textSecondary,
      backgroundColor: 'rgba(255,255,255,0.04)',
      border: `1px solid ${themeTokens.cardBorder}`,
      px: 2,
      py: 1,
      '& .MuiTab-iconWrapper': {
        color: themeTokens.textSecondary,
      },
      '&:hover': {
        backgroundColor: 'rgba(255,255,255,0.06)',
      },
      '&.Mui-selected': {
        color: themeTokens.textPrimary,
        background: `linear-gradient(90deg, ${themeTokens.purple} 0%, ${themeTokens.purple2} 100%)`,
        borderColor: 'rgba(255,255,255,0.14)',
        '& .MuiTab-iconWrapper': {
          color: '#fff',
        },
      },
    },
  };

  const primaryButtonSx = {
    borderRadius: '12px',
    px: 2.2,
    py: 1.15,
    fontWeight: 800,
    textTransform: 'none' as const,
    color: '#fff',
    background: `linear-gradient(90deg, ${themeTokens.purple} 0%, ${themeTokens.purple2} 100%)`,
    boxShadow: '0 12px 28px rgba(116,71,221,0.28)',
    '&:hover': {
      background: `linear-gradient(90deg, rgba(116,71,221,0.92) 0%, rgba(91,108,255,0.92) 100%)`,
      boxShadow: '0 14px 34px rgba(116,71,221,0.34)',
    },
    '&.Mui-disabled': {
      color: 'rgba(255,255,255,0.55)',
      background: 'rgba(255,255,255,0.10)',
      boxShadow: 'none',
    },
  };

  const secondaryButtonSx = {
    borderRadius: '12px',
    px: 2.0,
    py: 1.1,
    fontWeight: 800,
    textTransform: 'none' as const,
    color: themeTokens.textPrimary,
    borderColor: 'rgba(255,255,255,0.18)',
    '&:hover': {
      borderColor: 'rgba(255,255,255,0.28)',
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        px: { xs: 2, md: 4 },
        py: { xs: 3, md: 5 },
        backgroundColor: themeTokens.appBg,
        backgroundImage:
          'radial-gradient(1200px 500px at 20% 0%, rgba(116,71,221,0.12), transparent 60%), radial-gradient(900px 450px at 80% 10%, rgba(15,43,42,0.25), transparent 55%)',
      }}
    >
      <Box sx={{ maxWidth: 980, mx: 'auto' }}>
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="h4" sx={sectionTitleSx} gutterBottom>
            Create New Scan Job
          </Typography>
          <Typography variant="body2" sx={{ color: themeTokens.textSecondary }}>
            Configure a new data quality scan for your database or S3 files
          </Typography>
        </Box>

        <Paper elevation={0} sx={cardSx}>
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: '12px',
                backgroundColor: 'rgba(239,68,68,0.12)',
                color: themeTokens.textPrimary,
                border: '1px solid rgba(239,68,68,0.25)',
                '& .MuiAlert-icon': { color: 'rgba(239,68,68,0.95)' },
              }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          {/* Segmented Tabs */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="scan source tabs" sx={segmentedTabsSx}>
              <Tab
                icon={<DatabaseIcon fontSize="small" />}
                iconPosition="start"
                label="Database Scan"
                id="scan-tab-0"
                aria-controls="scan-tabpanel-0"
              />
              <Tab
                icon={<StorageIcon fontSize="small" />}
                iconPosition="start"
                label="S3 File Scan"
                id="scan-tab-1"
                aria-controls="scan-tabpanel-1"
              />
            </Tabs>
          </Box>

          <Divider sx={{ borderColor: themeTokens.divider }} />

          {/* Database Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2.2}>
              <Grid item xs={12}>
                <FormControl fullWidth sx={darkSelectSx}>
                  <InputLabel sx={labelSx}>Database Type</InputLabel>
                  <Select
                    value={dbConfig.source_type}
                    label="Database Type"
                    onChange={(e) => handleDbConfigChange('source_type', e.target.value)}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: '#0f172a',
                          color: themeTokens.textPrimary,
                          border: `1px solid ${themeTokens.cardBorder}`,
                        },
                      },
                    }}
                  >
                    <MenuItem value="postgresql">PostgreSQL</MenuItem>
                    <MenuItem value="mysql">MySQL</MenuItem>
                    <MenuItem value="sqlite">SQLite</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {dbConfig.source_type !== 'sqlite' && (
                <>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label="Host"
                      placeholder="localhost"
                      value={dbConfig.host}
                      onChange={(e) => handleDbConfigChange('host', e.target.value)}
                      required
                      sx={darkTextFieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Port"
                      placeholder="5432"
                      value={dbConfig.port}
                      onChange={(e) => handleDbConfigChange('port', e.target.value)}
                      required
                      sx={darkTextFieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Database Name"
                      placeholder="mydb"
                      value={dbConfig.database}
                      onChange={(e) => handleDbConfigChange('database', e.target.value)}
                      required
                      sx={darkTextFieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Table Name"
                      placeholder="users"
                      value={dbConfig.table}
                      onChange={(e) => handleDbConfigChange('table', e.target.value)}
                      required
                      sx={darkTextFieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      placeholder="postgres"
                      value={dbConfig.username}
                      onChange={(e) => handleDbConfigChange('username', e.target.value)}
                      required
                      sx={darkTextFieldSx}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={dbConfig.password}
                      onChange={(e) => handleDbConfigChange('password', e.target.value)}
                      required
                      sx={darkTextFieldSx}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              sx={{ color: themeTokens.textSecondary }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </>
              )}

              {dbConfig.source_type === 'sqlite' && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="SQLite File Path"
                      placeholder="/path/to/database.db"
                      value={dbConfig.database}
                      onChange={(e) => handleDbConfigChange('database', e.target.value)}
                      required
                      sx={darkTextFieldSx}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Table Name"
                      placeholder="users"
                      value={dbConfig.table}
                      onChange={(e) => handleDbConfigChange('table', e.target.value)}
                      required
                      sx={darkTextFieldSx}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </TabPanel>

          {/* S3 Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={2.2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="S3 Bucket Name"
                  placeholder="my-data-bucket"
                  value={s3Config.bucket}
                  onChange={(e) => handleS3ConfigChange('bucket', e.target.value)}
                  required
                  sx={darkTextFieldSx}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="File Key (Path)"
                  placeholder="datasets/users.csv"
                  value={s3Config.key}
                  onChange={(e) => handleS3ConfigChange('key', e.target.value)}
                  required
                  sx={darkTextFieldSx}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={darkSelectSx}>
                  <InputLabel sx={labelSx}>AWS Region</InputLabel>
                  <Select
                    value={s3Config.region}
                    label="AWS Region"
                    onChange={(e) => handleS3ConfigChange('region', e.target.value)}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: '#0f172a',
                          color: themeTokens.textPrimary,
                          border: `1px solid ${themeTokens.cardBorder}`,
                        },
                      },
                    }}
                  >
                    <MenuItem value="us-east-1">US East (N. Virginia)</MenuItem>
                    <MenuItem value="us-east-2">US East (Ohio)</MenuItem>
                    <MenuItem value="us-west-1">US West (N. California)</MenuItem>
                    <MenuItem value="us-west-2">US West (Oregon)</MenuItem>
                    <MenuItem value="eu-west-1">EU (Ireland)</MenuItem>
                    <MenuItem value="eu-central-1">EU (Frankfurt)</MenuItem>
                    <MenuItem value="ap-southeast-1">Asia Pacific (Singapore)</MenuItem>
                    <MenuItem value="ap-northeast-1">Asia Pacific (Tokyo)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={darkSelectSx}>
                  <InputLabel sx={labelSx}>File Format</InputLabel>
                  <Select
                    value={s3Config.s3_file_format}
                    label="File Format"
                    onChange={(e) => handleS3ConfigChange('s3_file_format', e.target.value)}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: '#0f172a',
                          color: themeTokens.textPrimary,
                          border: `1px solid ${themeTokens.cardBorder}`,
                        },
                      },
                    }}
                  >
                    <MenuItem value="csv">CSV</MenuItem>
                    <MenuItem value="json">JSON</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ color: themeTokens.textSecondary, fontWeight: 700 }}>
                  AWS Credentials (Optional)
                </Typography>
                <Typography variant="caption" sx={helperTextSx}>
                  Leave empty to use an IAM role / instance profile
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="AWS Access Key ID"
                  placeholder="AKIA..."
                  value={s3Config.aws_access_key_id}
                  onChange={(e) => handleS3ConfigChange('aws_access_key_id', e.target.value)}
                  sx={darkTextFieldSx}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="AWS Secret Access Key"
                  type={showSecretKey ? 'text' : 'password'}
                  placeholder="Enter secret key"
                  value={s3Config.aws_secret_access_key}
                  onChange={(e) => handleS3ConfigChange('aws_secret_access_key', e.target.value)}
                  sx={darkTextFieldSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          edge="end"
                          sx={{ color: themeTokens.textSecondary }}
                        >
                          {showSecretKey ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </TabPanel>

          <Divider sx={{ my: 3.5, borderColor: themeTokens.divider }} />

          {/* Global Options */}
          <Box>
            <Typography variant="h6" sx={{ ...sectionTitleSx, fontSize: 18 }} gutterBottom>
              Scan Options
            </Typography>

            <Grid container spacing={2.2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Datasource Name (Optional)"
                  placeholder="My Production Database"
                  value={datasourceName}
                  onChange={(e) => setDatasourceName(e.target.value)}
                  helperText="A friendly name for this scan"
                  sx={darkTextFieldSx}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={darkSelectSx}>
                  <InputLabel sx={labelSx}>
                    <LanguageIcon sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle' }} />
                    Language
                  </InputLabel>
                  <Select
                    value={language}
                    label="Language"
                    onChange={(e) => setLanguage(e.target.value)}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: '#0f172a',
                          color: themeTokens.textPrimary,
                          border: `1px solid ${themeTokens.cardBorder}`,
                        },
                      },
                    }}
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  sx={{
                    alignItems: 'flex-start',
                    m: 0,
                    '& .MuiFormControlLabel-label': { width: '100%' },
                  }}
                  control={
                    <Checkbox
                      checked={scanOptions.email_mx_validation}
                      onChange={(e) =>
                        setScanOptions({
                          ...scanOptions,
                          email_mx_validation: e.target.checked,
                        })
                      }
                      icon={<CheckIcon sx={{ opacity: 0.25 }} />}
                      checkedIcon={<CheckIcon color="success" />}
                      sx={{
                        mt: 0.3,
                        color: 'rgba(255,255,255,0.35)',
                        '&.Mui-checked': { color: themeTokens.purple },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ color: themeTokens.textPrimary, fontWeight: 750 }}>
                        Enable Advanced Email Validation (MX Check)
                      </Typography>
                      <Typography variant="caption" sx={helperTextSx}>
                        Verify email domains have valid MX records (may increase scan time)
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              {scanOptions.email_mx_validation && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="MX Validation Timeout (seconds)"
                    value={scanOptions.mx_timeout}
                    onChange={(e) =>
                      setScanOptions({
                        ...scanOptions,
                        mx_timeout: parseInt(e.target.value) || 5,
                      })
                    }
                    inputProps={{ min: 1, max: 30 }}
                    helperText="DNS query timeout per domain"
                    sx={darkTextFieldSx}
                  />
                </Grid>
              )}
            </Grid>
          </Box>

          <Divider sx={{ my: 3.5, borderColor: themeTokens.divider }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={() => navigate('/scans')} disabled={loading} sx={secondaryButtonSx}>
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              sx={primaryButtonSx}
              startIcon={loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : undefined}
            >
              {loading ? 'Creating Scan...' : 'Create Scan Job'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default NewScanPage;
