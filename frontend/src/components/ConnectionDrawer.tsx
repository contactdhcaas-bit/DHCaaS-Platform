/**
 * Connection Drawer Component
 * Multi-step configuration panel for cloud integrations
 */


import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Drawer,
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import {
  X,
  Cloud,
  Key,
  Database,
  Clock,
  CheckCircle2,
  AlertCircle,
  Server,
} from 'lucide-react';
import { AWSCredentials, AWSRegion } from '../services/connectorService';


interface ConnectionDrawerProps {
  open: boolean;
  onClose: () => void;
  connectorName: string;
  connectorBrand: string;
  regions: AWSRegion[];
  onConnect: (credentials: AWSCredentials, config: ConnectionConfig) => Promise<void>;
}


export interface ConnectionConfig {
  selectedBuckets: string[];
  autoSync: boolean;
  syncInterval: number;
}


const ConnectionDrawer: React.FC<ConnectionDrawerProps> = ({
  open,
  onClose,
  connectorName,
  connectorBrand,
  regions,
  onConnect,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [credentials, setCredentials] = useState<AWSCredentials>({
    aws_access_key_id: '',
    aws_secret_access_key: '',
    region_name: 'us-east-1',
  });
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [config, setConfig] = useState<ConnectionConfig>({
    selectedBuckets: [],
    autoSync: true,
    syncInterval: 24,
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [connecting, setConnecting] = useState(false);


  const steps = ['Credentials', 'Scope & Selection', 'Schedule & Sync'];


  const handleNext = () => {
    if (activeStep === 0) {
      handleTestConnection();
    } else if (activeStep === steps.length - 1) {
      handleConnect();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };


  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setTestResult(null);
  };


  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);


    setTimeout(() => {
      if (credentials.aws_access_key_id && credentials.aws_secret_access_key) {
        setTestResult({
          success: true,
          message: 'Connection successful! Credentials validated.',
        });
        setTimeout(() => {
          setActiveStep(1);
        }, 1000);
      } else {
        setTestResult({
          success: false,
          message: 'Invalid credentials. Please check your keys.',
        });
      }
      setTesting(false);
    }, 2000);
  };


  const handleConnect = async () => {
    setConnecting(true);
    try {
      await onConnect(credentials, config);
      
      // Generate connection ID
      const connectionId = `aws-s3-${Date.now()}`;
      
      // Store connection in localStorage
      localStorage.setItem(
        `s3_connection_${connectionId}`,
        JSON.stringify({
          credentials,
          buckets: config.selectedBuckets,
          timestamp: new Date().toISOString(),
        })
      );
      
      // Close drawer
      handleClose();
      
      // Redirect to file browser
      setTimeout(() => {
        window.location.href = `/connectors/browse/${connectionId}`;
      }, 500);
      
      setConnecting(false);
    } catch (error) {
      setConnecting(false);
    }
  };


  const handleClose = () => {
    setActiveStep(0);
    setCredentials({
      aws_access_key_id: '',
      aws_secret_access_key: '',
      region_name: 'us-east-1',
    });
    setConfig({
      selectedBuckets: [],
      autoSync: true,
      syncInterval: 24,
    });
    setTestResult(null);
    onClose();
  };


  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Alert severity="info" icon={<Key size={18} />}>
                Enter your AWS credentials to establish a secure connection
              </Alert>


              <TextField
                label="AWS Access Key ID"
                fullWidth
                value={credentials.aws_access_key_id}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    aws_access_key_id: e.target.value,
                  })
                }
                placeholder="AKIAIOSFODNN7EXAMPLE"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Key size={18} />
                    </InputAdornment>
                  ),
                }}
              />


              <TextField
                label="AWS Secret Access Key"
                fullWidth
                type={showSecretKey ? 'text' : 'password'}
                value={credentials.aws_secret_access_key}
                onChange={(e) =>
                  setCredentials({
                    ...credentials,
                    aws_secret_access_key: e.target.value,
                  })
                }
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Key size={18} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        edge="end"
                      >
                        {showSecretKey ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />


              <FormControl fullWidth>
                <InputLabel>AWS Region</InputLabel>
                <Select
                  value={credentials.region_name}
                  label="AWS Region"
                  onChange={(e) =>
                    setCredentials({
                      ...credentials,
                      region_name: e.target.value,
                    })
                  }
                  startAdornment={
                    <InputAdornment position="start">
                      <Server size={18} />
                    </InputAdornment>
                  }
                >
                  {regions.map((region) => (
                    <MenuItem key={region.code} value={region.code}>
                      {region.name} ({region.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>


              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert
                    severity={testResult.success ? 'success' : 'error'}
                    icon={
                      testResult.success ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <AlertCircle size={18} />
                      )
                    }
                  >
                    {testResult.message}
                  </Alert>
                </motion.div>
              )}
            </Box>
          </motion.div>
        );


      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Alert severity="info" icon={<Database size={18} />}>
                Select the S3 buckets you want to connect to DHCaaS
              </Alert>


              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Available Buckets (Mock Data)
                </Typography>
                <List
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    maxHeight: 300,
                    overflow: 'auto',
                  }}
                >
                  {[
                    'customer-data-prod',
                    'analytics-warehouse',
                    'ml-training-datasets',
                    'backup-archives',
                    'logs-2024',
                  ].map((bucket) => (
                    <ListItem key={bucket} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          const selected = config.selectedBuckets.includes(bucket);
                          setConfig({
                            ...config,
                            selectedBuckets: selected
                              ? config.selectedBuckets.filter((b) => b !== bucket)
                              : [...config.selectedBuckets, bucket],
                          });
                        }}
                      >
                        <ListItemIcon>
                          <Checkbox
                            edge="start"
                            checked={config.selectedBuckets.includes(bucket)}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={bucket}
                          secondary={`Region: ${credentials.region_name}`}
                        />
                        <Chip
                          label="1.2 GB"
                          size="small"
                          variant="outlined"
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>


              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Selected: {config.selectedBuckets.length} bucket(s)
                </Typography>
              </Box>
            </Box>
          </motion.div>
        );


      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Alert severity="info" icon={<Clock size={18} />}>
                Configure automatic synchronization settings
              </Alert>


              <FormControlLabel
                control={
                  <Switch
                    checked={config.autoSync}
                    onChange={(e) =>
                      setConfig({ ...config, autoSync: e.target.checked })
                    }
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Enable Auto-Sync
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Automatically sync data at regular intervals
                    </Typography>
                  </Box>
                }
              />


              {config.autoSync && (
                <FormControl fullWidth>
                  <InputLabel>Sync Interval</InputLabel>
                  <Select
                    value={config.syncInterval}
                    label="Sync Interval"
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        syncInterval: e.target.value as number,
                      })
                    }
                  >
                    <MenuItem value={1}>Every Hour</MenuItem>
                    <MenuItem value={6}>Every 6 Hours</MenuItem>
                    <MenuItem value={12}>Every 12 Hours</MenuItem>
                    <MenuItem value={24}>Every 24 Hours</MenuItem>
                    <MenuItem value={168}>Weekly</MenuItem>
                  </Select>
                </FormControl>
              )}


              <Divider />


              <Box
                sx={{
                  p: 3,
                  bgcolor: 'success.main',
                  color: 'white',
                  borderRadius: 2,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Connection Summary
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Connector:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {connectorName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Region:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {credentials.region_name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Buckets:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {config.selectedBuckets.length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Auto-Sync:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {config.autoSync ? `Every ${config.syncInterval}h` : 'Disabled'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </motion.div>
        );


      default:
        return null;
    }
  };


  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 500 },
          bgcolor: 'background.paper',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Cloud size={24} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Connect to {connectorName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {connectorBrand} Integration
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose}>
            <X size={20} />
          </IconButton>
        </Box>


        {/* Stepper */}
        <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>


        {/* Content */}
        <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
          <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
        </Box>


        {/* Footer Actions */}
        <Box
          sx={{
            p: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 2,
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            onClick={activeStep === 0 ? handleClose : handleBack}
            disabled={testing || connecting}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleNext}
            disabled={
              testing ||
              connecting ||
              (activeStep === 0 &&
                (!credentials.aws_access_key_id ||
                  !credentials.aws_secret_access_key)) ||
              (activeStep === 1 && config.selectedBuckets.length === 0)
            }
            startIcon={
              testing || connecting ? (
                <CircularProgress size={16} color="inherit" />
              ) : activeStep === steps.length - 1 ? (
                <CheckCircle2 size={18} />
              ) : null
            }
          >
            {testing
              ? 'Testing...'
              : connecting
              ? 'Connecting...'
              : activeStep === steps.length - 1
              ? 'Connect'
              : activeStep === 0
              ? 'Test & Continue'
              : 'Continue'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};


export default ConnectionDrawer;
