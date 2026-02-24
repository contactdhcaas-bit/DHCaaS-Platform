// src/components/DropZone.tsx
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { Close } from '@mui/icons-material';

interface DropZoneProps {
  id: string;
  label: string;
  value: string | null;
  onRemove: () => void;
  hint?: string;
}

const DropZone: React.FC<DropZoneProps> = ({ id, label, value, onRemove, hint }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgb(203, 213, 225)' }}>
        {label}
      </Typography>
      <Box
        ref={setNodeRef}
        sx={{
          border: '2px dashed',
          borderColor: isOver
            ? 'rgba(99, 102, 241, 0.8)'
            : value
            ? 'rgba(99, 102, 241, 0.5)'
            : 'rgba(99, 102, 241, 0.3)',
          borderRadius: 2,
          p: 2,
          minHeight: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: isOver
            ? 'rgba(99, 102, 241, 0.1)'
            : value
            ? 'rgba(99, 102, 241, 0.05)'
            : 'transparent',
          transition: 'all 0.2s ease',
          position: 'relative',
        }}
      >
        {value ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <Chip
              label={value}
              color="primary"
              sx={{
                bgcolor: 'rgba(99, 102, 241, 0.2)',
                color: 'rgb(165, 180, 252)',
                borderColor: 'rgba(99, 102, 241, 0.4)',
              }}
            />
            <IconButton
              size="small"
              onClick={onRemove}
              sx={{
                color: 'rgb(248, 113, 113)',
                '&:hover': { bgcolor: 'rgba(248, 113, 113, 0.1)' },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{
              color: 'rgb(148, 163, 184)',
              textAlign: 'center',
            }}
          >
            {hint || `Drag a field here`}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default DropZone;
