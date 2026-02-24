/**
 * Connector Card Component
 * Enterprise-grade card for cloud integration services
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Cloud,
  Database,
  CheckCircle2,
  Clock,
  HardDrive,
  TrendingUp,
} from 'lucide-react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  LinearProgress,
} from '@mui/material';

export interface ConnectorMetrics {
  bucketsCount?: number;
  filesCount?: number;
  dataSize?: string;
  lastSync?: string;
}

export interface ConnectorCardProps {
  id: string;
  name: string;
  description: string;
  provider: 'aws' | 'azure' | 'gcp' | 'snowflake';
  category: 'Cloud Storage' | 'Database' | 'CRM' | 'Warehouse';
  isConnected: boolean;
  isComingSoon?: boolean;
  logo: string;
  brandColor: string;
  metrics?: ConnectorMetrics;
  onConnect: () => void;
  onManage?: () => void;
}

const ConnectorCard: React.FC<ConnectorCardProps> = ({
  id,
  name,
  description,
  provider,
  category,
  isConnected,
  isComingSoon,
  logo,
  brandColor,
  metrics,
  onConnect,
  onManage,
}) => {
  const getBrandGradient = () => {
    switch (provider) {
      case 'aws':
        return 'linear-gradient(135deg, #FF9900 0%, #FF6600 100%)';
      case 'azure':
        return 'linear-gradient(135deg, #0078D4 0%, #00BCF2 100%)';
      case 'gcp':
        return 'linear-gradient(135deg, #4285F4 0%, #DB4437 50%, #F4B400 100%)';
      case 'snowflake':
        return 'linear-gradient(135deg, #29B5E8 0%, #1E88E5 100%)';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      style={{ height: '100%' }}
    >
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'visible',
          transition: 'all 0.3s ease',
          border: '1px solid',
          borderColor: isConnected ? `${brandColor}40` : 'divider',
          '&:hover': {
            boxShadow: isComingSoon ? 2 : 8,
            borderColor: isConnected ? brandColor : 'primary.main',
          },
          opacity: isComingSoon ? 0.7 : 1,
        }}
      >
        {/* Status Indicator */}
        {isConnected && (
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: 16,
              zIndex: 1,
            }}
          >
            <Chip
              icon={<CheckCircle2 size={14} />}
              label="Active"
              size="small"
              sx={{
                bgcolor: 'success.main',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem',
                boxShadow: 2,
              }}
            />
          </Box>
        )}

        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  background: getBrandGradient(),
                  boxShadow: `0 4px 12px ${brandColor}40`,
                  mr: 2,
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                  {logo}
                </Typography>
              </Avatar>
            </motion.div>

            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 0.5,
                  color: 'text.primary',
                }}
              >
                {name}
              </Typography>
              <Chip
                label={category}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: `${brandColor}15`,
                  color: brandColor,
                }}
              />
            </Box>
          </Box>

          {/* Description */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, minHeight: 40 }}
          >
            {description}
          </Typography>

          {/* Metrics (If Connected) */}
          {isConnected && metrics && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                bgcolor: 'background.default',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                {metrics.bucketsCount !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Database size={16} color={brandColor} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {metrics.bucketsCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Buckets
                      </Typography>
                    </Box>
                  </Box>
                )}

                {metrics.dataSize && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HardDrive size={16} color={brandColor} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {metrics.dataSize}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Data Size
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {metrics.lastSync && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Clock size={14} color="#64748b" />
                  <Typography variant="caption" color="text.secondary">
                    Last synced {metrics.lastSync}
                  </Typography>
                </Box>
              )}

              {/* Activity Indicator */}
              <Box sx={{ mt: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 0.5,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Sync Progress
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: 'success.main' }}
                  >
                    100%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={100}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    bgcolor: `${brandColor}20`,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: brandColor,
                    },
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Action Button */}
          {isComingSoon ? (
            <Button
              fullWidth
              disabled
              variant="outlined"
              sx={{ fontWeight: 600 }}
            >
              Coming Soon
            </Button>
          ) : isConnected ? (
            <Button
              fullWidth
              variant="contained"
              onClick={onManage}
              sx={{
                fontWeight: 600,
                background: getBrandGradient(),
                '&:hover': {
                  opacity: 0.9,
                },
              }}
            >
              Manage Connection
            </Button>
          ) : (
            <Button
              fullWidth
              variant="outlined"
              onClick={onConnect}
              sx={{
                fontWeight: 600,
                borderColor: brandColor,
                color: brandColor,
                '&:hover': {
                  borderColor: brandColor,
                  bgcolor: `${brandColor}10`,
                },
              }}
              startIcon={<Cloud size={18} />}
            >
              Connect Now
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ConnectorCard;
