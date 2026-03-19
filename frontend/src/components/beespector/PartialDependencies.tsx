import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { beespectorApi } from 'src/lib/beespectorAxios';
import { PartialDependenceData } from 'src/types/beespector/partial-dependence';

const formatFeatureName = (feature: string): string => {
  if (feature.startsWith('attribute')) {
    const attrNum = feature.replace('attribute', '');
    const attrDescriptions: Record<string, string> = {
      '13': 'Age',
      '5': 'Credit Amount',
      '2': 'Duration',
    };
    return attrDescriptions[attrNum] || `Attribute ${attrNum}`;
  }
  return feature
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function PartialDependencies() {
  const [partialDepData, setPartialDepData] = useState<PartialDependenceData | null>(null);
  const [featureOptions, setFeatureOptions] = useState<string[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPartialDependenceData();
  }, []);

  const fetchPartialDependenceData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await beespectorApi.get('/partial_dependence');
      const data: PartialDependenceData = response.data.partial_dependence_data;
      setPartialDepData(data);

      const features = Object.keys(data);
      setFeatureOptions(features);
      if (features.length > 0) {
        setSelectedFeature(features[0]);
      }
    } catch (err: any) {
      console.error('Error fetching partial dependence data:', err);
      setError(
        'Failed to fetch partial dependence data. The calculation may have failed on the server.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Calculating partial dependence plots...</Typography>
      </Box>
    );
  }

  if (error || !partialDepData || featureOptions.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'No partial dependence data available.'}</Alert>
      </Box>
    );
  }

  const chartData = partialDepData[selectedFeature] || [];

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
      >
        Partial Dependence
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        paragraph
      >
        Visualize how model predictions change as a feature varies, comparing the base and mitigated
        models.
      </Typography>

      <Grid
        container
        spacing={3}
      >
        <Grid
          item
          xs={12}
        >
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                mb: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Typography variant="h6">Partial Dependence Plot</Typography>
              <FormControl
                size="small"
                sx={{ minWidth: 200 }}
              >
                <InputLabel>Feature</InputLabel>
                <Select
                  value={selectedFeature}
                  label="Feature"
                  onChange={(e) => setSelectedFeature(e.target.value)}
                >
                  {featureOptions.map((f) => (
                    <MenuItem
                      key={f}
                      value={f}
                    >
                      {formatFeatureName(f)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    label={{
                      value: formatFeatureName(selectedFeature),
                      position: 'insideBottom',
                      offset: -5,
                    }}
                  />
                  <YAxis
                    label={{
                      value: 'Avg. Prediction Probability',
                      angle: -90,
                      position: 'insideLeft',
                    }}
                    domain={[0, 1]}
                  />
                  <Tooltip formatter={(value: number) => value.toFixed(3)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="base"
                    stroke="#8884d8"
                    name="Base Model"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="mitigated"
                    stroke="#82ca9d"
                    name="Mitigated Model"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default PartialDependencies;
