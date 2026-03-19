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
import { PerformanceType } from 'src/types/beespector/performance';

function PerformanceFairness() {
  const [performanceData, setPerformanceData] = useState<PerformanceType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await beespectorApi.get('/performance_fairness');
      setPerformanceData(response.data);
    } catch (err: any) {
      console.error('Error fetching performance data:', err);
      setError('Failed to fetch performance metrics from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading performance metrics...</Typography>
      </Box>
    );
  }

  if (error || !performanceData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'No data available'}</Alert>
      </Box>
    );
  }

  const { confusion_matrix: cm } = performanceData;
  const total = cm.tn + cm.fp + cm.fn + cm.tp;

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
      >
        Performance & Fairness (Base Model)
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        paragraph
      >
        Detailed performance metrics and fairness indicators for the base model before mitigation.
      </Typography>

      <Grid
        container
        spacing={3}
      >
        <Grid
          item
          xs={12}
          md={4}
        >
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography
              variant="h6"
              gutterBottom
            >
              Performance Metrics
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Accuracy
                </Typography>
                <Typography variant="h5">
                  {(performanceData.performance_metrics.Accuracy * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  F1 Score
                </Typography>
                <Typography variant="h5">
                  {performanceData.performance_metrics.F1Score.toFixed(3)}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  AUC
                </Typography>
                <Typography variant="h5">
                  {performanceData.performance_metrics.AUC.toFixed(3)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid
          item
          xs={12}
          md={4}
        >
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography
              variant="h6"
              gutterBottom
            >
              Fairness Metrics
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 3 }}>
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Statistical Parity Difference
                </Typography>
                <Typography variant="h5">
                  {performanceData.fairness_metrics.StatisticalParityDiff.toFixed(3)}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Disparate Impact
                </Typography>
                <Typography variant="h5">
                  {performanceData.fairness_metrics.DisparateImpact.toFixed(3)}
                </Typography>
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Equal Opportunity Difference
                </Typography>
                <Typography variant="h5">
                  {performanceData.fairness_metrics.EqualOpportunityDiff.toFixed(3)}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid
          item
          xs={12}
          md={4}
        >
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography
              variant="h6"
              gutterBottom
            >
              Confusion Matrix
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell align="center">Pred Neg</TableCell>
                    <TableCell align="center">Pred Pos</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Actual Neg</TableCell>
                    <TableCell align="center">
                      <strong>{cm.tn}</strong>
                      <Typography
                        variant="caption"
                        display="block"
                      >
                        ({((cm.tn / total) * 100).toFixed(1)}%)
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {cm.fp}
                      <Typography
                        variant="caption"
                        display="block"
                      >
                        ({((cm.fp / total) * 100).toFixed(1)}%)
                      </Typography>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Actual Pos</TableCell>
                    <TableCell align="center">
                      {cm.fn}
                      <Typography
                        variant="caption"
                        display="block"
                      >
                        ({((cm.fn / total) * 100).toFixed(1)}%)
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <strong>{cm.tp}</strong>
                      <Typography
                        variant="caption"
                        display="block"
                      >
                        ({((cm.tp / total) * 100).toFixed(1)}%)
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid
          item
          xs={12}
          md={6}
        >
          <Paper sx={{ p: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
            >
              ROC Curve
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={performanceData.roc_curve}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    dataKey="fpr"
                    label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    type="number"
                    domain={[0, 1]}
                    label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip formatter={(value: number) => value.toFixed(3)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tpr"
                    stroke="#8884d8"
                    name="ROC"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    data={[
                      { fpr: 0, tpr: 0 },
                      { fpr: 1, tpr: 1 },
                    ]}
                    dataKey="tpr"
                    stroke="#999"
                    strokeDasharray="5 5"
                    name="Random"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid
          item
          xs={12}
          md={6}
        >
          <Paper sx={{ p: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
            >
              Precision-Recall Curve
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={performanceData.pr_curve}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    dataKey="recall"
                    label={{ value: 'Recall', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    type="number"
                    domain={[0, 1]}
                    label={{ value: 'Precision', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip formatter={(value: number) => value.toFixed(3)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="precision"
                    stroke="#82ca9d"
                    name="PR Curve"
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

export default PerformanceFairness;
