import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
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
  Grid,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { beespectorApi } from 'src/lib/beespectorAxios';
import { Features, SortableKeys } from 'src/types/beespector/feature';

function FeaturesPage() {
  const [features, setFeatures] = useState<Features[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortableKeys>('count');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await beespectorApi.get('/features');

      // For now, if the endpoint returns empty, generate dummy data
      if (!response.data.features || response.data.features.length === 0) {
        // Generate dummy feature statistics
        const dummyFeatures: Features[] = [
          {
            featureName: 'age',
            count: 200,
            missing: 0,
            mean: 38.5,
            min: 17,
            max: 90,
            median: 37,
            std: 13.6,
            histogram: [
              { bin: '17-25', value: 25 },
              { bin: '26-35', value: 50 },
              { bin: '36-45', value: 60 },
              { bin: '46-55', value: 40 },
              { bin: '56-65', value: 20 },
              { bin: '66+', value: 5 },
            ],
          },
          {
            featureName: 'hours_per_week',
            count: 200,
            missing: 0,
            mean: 40.4,
            min: 1,
            max: 99,
            median: 40,
            std: 12.3,
            histogram: [
              { bin: '1-20', value: 15 },
              { bin: '21-30', value: 25 },
              { bin: '31-40', value: 100 },
              { bin: '41-50', value: 40 },
              { bin: '51-60', value: 15 },
              { bin: '61+', value: 5 },
            ],
          },
          {
            featureName: 'capital_gain',
            count: 200,
            missing: 0,
            mean: 1077.6,
            min: 0,
            max: 99999,
            median: 0,
            std: 7385.3,
            histogram: [
              { bin: '0', value: 180 },
              { bin: '1-5000', value: 10 },
              { bin: '5001-10000', value: 5 },
              { bin: '10001-50000', value: 3 },
              { bin: '50001+', value: 2 },
            ],
          },
          {
            featureName: 'education_num',
            count: 200,
            missing: 0,
            mean: 10.1,
            min: 1,
            max: 16,
            median: 10,
            std: 2.6,
            histogram: [
              { bin: '1-4', value: 10 },
              { bin: '5-8', value: 30 },
              { bin: '9-12', value: 120 },
              { bin: '13-16', value: 40 },
            ],
          },
        ];
        setFeatures(dummyFeatures);
        if (dummyFeatures.length > 0) {
          setSelectedFeature(dummyFeatures[0].featureName);
        }
      } else {
        setFeatures(response.data.features);
        if (response.data.features.length > 0) {
          setSelectedFeature(response.data.features[0].featureName);
        }
      }
    } catch (err: any) {
      console.error('Error fetching features:', err);
      setError('Failed to fetch feature statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const sortedFeatures = [...features].sort((a, b) => {
    if (
      sortBy === 'count' ||
      sortBy === 'missing' ||
      sortBy === 'mean' ||
      sortBy === 'min' ||
      sortBy === 'max' ||
      sortBy === 'median' ||
      sortBy === 'std'
    ) {
      return b[sortBy] - a[sortBy];
    }
    return 0;
  });

  const selectedFeatureData = features.find((f) => f.featureName === selectedFeature);

  if (isLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading feature statistics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
      >
        Features Analysis
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        paragraph
      >
        Explore statistical properties and distributions of features in the dataset.
      </Typography>

      <Grid
        container
        spacing={3}
      >
        <Grid
          item
          xs={12}
          md={7}
        >
          <Paper sx={{ p: 2 }}>
            <Box
              sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Typography variant="h6">Feature Statistics</Typography>
              <FormControl
                size="small"
                sx={{ minWidth: 120 }}
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

            <TableContainer sx={{ maxHeight: 400 }}>
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
                    <TableCell align="right">Median</TableCell>
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
                      <TableCell align="right">{feature.median}</TableCell>
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
              variant="h6"
              gutterBottom
            >
              Distribution: {selectedFeature}
            </Typography>
            {selectedFeatureData && (
              <Box sx={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={selectedFeatureData.histogram}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bin" />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      fill="#8884d8"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default FeaturesPage;
