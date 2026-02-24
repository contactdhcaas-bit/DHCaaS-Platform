// src/components/DraggableField.tsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { BarChart, TextFields, CalendarToday } from '@mui/icons-material';
import { Box, Chip, Tooltip } from '@mui/material';

interface DraggableFieldProps {
  id: string;
  name: string;
  type: 'numeric' | 'text' | 'date';
}

const DraggableField: React.FC<DraggableFieldProps> = ({ id, name, type }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    data: { name, type },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 1000 : 1,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const getIcon = () => {
    switch (type) {
      case 'numeric':
        return <BarChart sx={{ fontSize: 16 }} />;
      case 'date':
        return <CalendarToday sx={{ fontSize: 16 }} />;
      default:
        return <TextFields sx={{ fontSize: 16 }} />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'numeric':
        return 'success';
      case 'date':
        return 'info';
      default:
        return 'default';
    }
  };

  const getTooltip = () => {
    switch (type) {
      case 'numeric':
        return 'Numeric field - Can be used for measures';
      case 'date':
        return 'Date field - Can be used for time-based analysis';
      default:
        return 'Text field - Can be used for dimensions';
    }
  };

  return (
    <Tooltip title={getTooltip()} placement="right">
      <Box
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        sx={{
          cursor: isDragging ? 'grabbing' : 'grab',
          mb: 1,
          transition: 'all 0.2s ease',
        }}
      >
        <Chip
          icon={getIcon()}
          label={name}
          color={getColor()}
          variant="outlined"
          sx={{
            width: '100%',
            justifyContent: 'flex-start',
            bgcolor: isDragging
              ? 'rgba(16, 185, 129, 0.2)'
              : 'rgba(16, 185, 129, 0.1)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            color: 'rgb(110, 231, 183)',
            '&:hover': {
              bgcolor: 'rgba(16, 185, 129, 0.3)',
              borderColor: 'rgba(16, 185, 129, 0.5)',
            },
            '& .MuiChip-icon': {
              color: 'rgb(110, 231, 183)',
            },
          }}
        />
      </Box>
    </Tooltip>
  );
};

export default DraggableField;
