import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { beespectorApi } from 'src/lib/beespectorAxios';
import { Features, SortableKeys } from 'src/types/beespector/feature';

type Props = {
  datasetSlug: string;
};

function DatasetFeaturesPreview({ datasetSlug }: Props) {
  const [features, setFeatures] = useState<Features[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortableKeys>('count');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!datasetSlug) return;
    setIsLoading(true);
    setError(null);
    setFeatures([]);
    setSelectedFeature('');

    beespectorApi
      .get(`/features/${datasetSlug}`)
      .then((response) => {
        const data: Features[] = response.data.features || [];
        setFeatures(data);
        if (data.length > 0) setSelectedFeature(data[0].featureName);
      })
      .catch((err: any) => {
        console.error('Error fetching dataset features:', err);
        setError('Could not load feature statistics for this dataset.');
      })
      .finally(() => setIsLoading(false));
  }, [datasetSlug]);

  const sortedFeatures = [...features].sort((a, b) => b[sortBy] - a[sortBy]);
  const selectedFeatureData = features.find((f) => f.featureName === selectedFeature);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
        <CircularProgress size={22} />
        <Typography
          variant="body2"
          color="text.secondary"
        >
          Loading feature statistics for <strong>{datasetSlug}</strong>…
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="warning"
        sx={{ my: 1 }}
      >
        {error}
      </Alert>
    );
  }

  if (features.length === 0) return null;

  return (
    <Grid
      container
      spacing={2}
    >
      <Grid
        item
        xs={12}
        md={7}
      >
        <Paper sx={{ p: 2 }}>
          <Box
            sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600 }}
            >
              Feature Statistics
            </Typography>
            <FormControl
              size="small"
              sx={{ minWidth: 110 }}
            >
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                label="Sort by"
                onChange={(e) => setSortBy(e.target.value as SortableKeys)}
              >
                <MenuItem value="count">Count</MenuItem>
                <MenuItem value="missing">Missing</MenuItem>
                <MenuItem value="mean">Mean</MenuItem>
                <MenuItem value="std">Std Dev</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TableContainer sx={{ maxHeight: 280 }}>
            <Table
              stickyHeader
              size="small"
            >
              <TableHead>
                <TableRow>
                  <TableCell>Feature</TableCell>
                  <TableCell align="right">Count</TableCell>
                  <TableCell align="right">Missing</TableCell>
                  <TableCell align="right">Mean</TableCell>
                  <TableCell align="right">Min</TableCell>
                  <TableCell align="right">Max</TableCell>
                  <TableCell align="right">Std</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedFeatures.map((feature) => (
                  <TableRow
                    key={feature.featureName}
                    hover
                    selected={feature.featureName === selectedFeature}
                    onClick={() => setSelectedFeature(feature.featureName)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{feature.featureName}</TableCell>
                    <TableCell align="right">{feature.count}</TableCell>
                    <TableCell align="right">{feature.missing}</TableCell>
                    <TableCell align="right">{feature.mean.toFixed(2)}</TableCell>
                    <TableCell align="right">{feature.min}</TableCell>
                    <TableCell align="right">{feature.max}</TableCell>
                    <TableCell align="right">{feature.std.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      <Grid
        item
        xs={12}
        md={5}
      >
        <Paper sx={{ p: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, mb: 1 }}
          >
            Distribution: {selectedFeature || '—'}
          </Typography>
          {selectedFeatureData ? (
            <Box sx={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={selectedFeatureData.histogram}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="bin"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    fill="#062A54"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Click a row on the left to see its distribution.
            </Typography>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}

export default DatasetFeaturesPreview;
