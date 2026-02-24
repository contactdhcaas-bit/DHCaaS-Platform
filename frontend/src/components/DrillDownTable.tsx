// src/components/DrillDownTable.tsx
import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Pagination,
  Chip,
} from '@mui/material';
import {
  ArrowUpward,
  ArrowDownward,
  Download,
  TableChart,
} from '@mui/icons-material';

interface DrillDownTableProps {
  data: Array<Record<string, any>>;
  columns: string[];
  loading?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

const DrillDownTable: React.FC<DrillDownTableProps> = ({ data, columns, loading = false }) => {
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const rowsPerPage = 10;

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      // Handle different data types
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal || '').toLowerCase();
      const bStr = String(bVal || '').toLowerCase();

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [data, sortColumn, sortDirection]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, page]);

  const totalPages = Math.ceil(data.length / rowsPerPage);

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (data.length === 0) return;

    const headers = columns.join(',');
    const rows = data.map((row) =>
      columns.map((col) => {
        const value = row[col];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `data_export_${Date.now()}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <Box
        sx={{
          bgcolor: 'rgba(30, 41, 59, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          p: 4,
          textAlign: 'center',
        }}
      >
        <Typography variant="body1" sx={{ color: 'rgb(148, 163, 184)' }}>
          Loading table data...
        </Typography>
      </Box>
    );
  }

  if (data.length === 0) {
    return null;
  }

  return (
    <Paper
      sx={{
        bgcolor: 'rgba(30, 41, 59, 0.3)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {/* Prominent Header with Export Button */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 3,
          bgcolor: 'rgb(30, 41, 59)',
          borderBottom: '1px solid rgb(51, 65, 85)',
        }}
      >
        <Box display="flex" alignItems="center">
          <TableChart sx={{ color: 'rgb(99, 102, 241)', mr: 1.5, fontSize: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ color: 'rgb(203, 213, 225)', fontWeight: 600 }}>
              Data Drill-Down
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgb(148, 163, 184)' }}>
              {data.length} total rows • Click headers to sort
            </Typography>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <Chip
            label={`Page ${page} of ${totalPages}`}
            size="small"
            sx={{
              bgcolor: 'rgba(99, 102, 241, 0.2)',
              color: 'rgb(165, 180, 252)',
              borderColor: 'rgba(99, 102, 241, 0.4)',
              fontWeight: 500,
            }}
          />
          
          {/* Prominent Export Button */}
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportCSV}
            sx={{
              bgcolor: 'rgb(16, 185, 129)',
              color: 'white',
              px: 3,
              py: 1,
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'rgb(5, 150, 105)',
              },
              boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)',
            }}
          >
            Download CSV
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer sx={{ maxHeight: 500 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column}
                  onClick={() => handleSort(column)}
                  sx={{
                    bgcolor: 'rgb(30, 41, 59)',
                    color: 'rgb(148, 163, 184)',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: '2px solid rgba(99, 102, 241, 0.3)',
                    '&:hover': {
                      bgcolor: 'rgb(51, 65, 85)',
                    },
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    {column}
                    {sortColumn === column && (
                      <Box ml={1}>
                        {sortDirection === 'asc' ? (
                          <ArrowUpward sx={{ fontSize: 16, color: 'rgb(99, 102, 241)' }} />
                        ) : (
                          <ArrowDownward sx={{ fontSize: 16, color: 'rgb(99, 102, 241)' }} />
                        )}
                      </Box>
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                sx={{
                  '&:hover': {
                    bgcolor: 'rgba(51, 65, 85, 0.5)',
                  },
                  transition: 'background-color 0.2s ease',
                  borderBottom: '1px solid rgba(51, 65, 85, 0.8)',
                }}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column}
                    sx={{
                      color: 'rgb(203, 213, 225)',
                      fontSize: '0.875rem',
                      bgcolor: 'transparent',
                      borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
                    }}
                  >
                    {typeof row[column] === 'number'
                      ? row[column].toLocaleString(undefined, { maximumFractionDigits: 2 })
                      : String(row[column] || '-')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          bgcolor: 'rgba(15, 23, 42, 0.5)',
        }}
      >
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
          sx={{
            '& .MuiPaginationItem-root': {
              color: 'rgb(203, 213, 225)',
              borderColor: 'rgba(99, 102, 241, 0.3)',
            },
            '& .Mui-selected': {
              bgcolor: 'rgba(99, 102, 241, 0.4) !important',
              color: 'rgb(165, 180, 252)',
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default DrillDownTable;
