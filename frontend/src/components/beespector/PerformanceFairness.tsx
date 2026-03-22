import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  Stack,
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

const BASE_COLOR = '#1976d2';
const MIT_COLOR = '#2e7d32';

// Shows the numeric delta between base and mitigated values.
// isPositiveGood = true means higher values are better (accuracy, F1, AUC).
const DeltaChip = ({
  base,
  mitigated,
  isPositiveGood = true,
  format = (v: number) => (v >= 0 ? `+${v.toFixed(3)}` : v.toFixed(3)),
}: {
  base: number;
  mitigated: number;
  isPositiveGood?: boolean;
  format?: (v: number) => string;
}) => {
  const delta = mitigated - base;
  const improved = isPositiveGood ? delta >= 0 : delta <= 0;
  return (
    <Chip
      label={format(delta)}
      size="small"
      sx={{
        bgcolor: improved ? 'rgba(46,125,50,0.15)' : 'rgba(211,47,47,0.12)',
        color: improved ? 'success.dark' : 'error.dark',
        fontWeight: 700,
        fontSize: '0.72rem',
        height: 22,
        borderRadius: 1,
      }}
    />
  );
};

// Delta chip where improvement means getting closer to a target (e.g. 0 or 1).
const DeltaChipTarget = ({
  base,
  mitigated,
  target,
}: {
  base: number;
  mitigated: number;
  target: number;
}) => {
  const improved = Math.abs(mitigated - target) < Math.abs(base - target);
  const delta = mitigated - base;
  const label = delta >= 0 ? `+${delta.toFixed(3)}` : delta.toFixed(3);
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        bgcolor: improved ? 'rgba(46,125,50,0.15)' : 'rgba(211,47,47,0.12)',
        color: improved ? 'success.dark' : 'error.dark',
        fontWeight: 700,
        fontSize: '0.72rem',
        height: 22,
        borderRadius: 1,
      }}
    />
  );
};

const MetricRow = ({
  label,
  description,
  baseValue,
  mitigatedValue,
  format = (v: number) => v.toFixed(3),
  higherIsBetter = true,
  targetValue,
}: {
  label: string;
  description: string;
  baseValue: number;
  mitigatedValue?: number;
  format?: (v: number) => string;
  higherIsBetter?: boolean;
  targetValue?: number;
}) => (
  <Box sx={{ py: 1.5 }}>
    <Typography
      variant="body2"
      sx={{ fontWeight: 600, mb: 0.25 }}
    >
      {label}
    </Typography>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: 'block', mb: 1, lineHeight: 1.4 }}
    >
      {description}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Box
          sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: BASE_COLOR, flexShrink: 0 }}
        />
        <Typography
          variant="body2"
          sx={{ fontWeight: 500, color: BASE_COLOR }}
        >
          Base: {format(baseValue)}
        </Typography>
      </Box>
      {mitigatedValue !== undefined && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: MIT_COLOR, flexShrink: 0 }}
            />
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: MIT_COLOR }}
            >
              Mitigated: {format(mitigatedValue)}
            </Typography>
          </Box>
          {targetValue !== undefined ? (
            <DeltaChipTarget
              base={baseValue}
              mitigated={mitigatedValue}
              target={targetValue}
            />
          ) : (
            <DeltaChip
              base={baseValue}
              mitigated={mitigatedValue}
              isPositiveGood={higherIsBetter}
            />
          )}
        </>
      )}
    </Box>
  </Box>
);

const CmCell = ({
  value,
  total,
  bgcolor,
  label,
}: {
  value: number;
  total: number;
  bgcolor: string;
  label: string;
}) => (
  <Box
    sx={{
      p: 1,
      bgcolor,
      borderRadius: 1,
      textAlign: 'center',
      border: '1px solid',
      borderColor: 'divider',
    }}
  >
    <Typography
      variant="h6"
      sx={{ fontWeight: 700, lineHeight: 1.2 }}
    >
      {value}
    </Typography>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ display: 'block' }}
    >
      {((value / total) * 100).toFixed(1)}%
    </Typography>
    <Typography
      variant="caption"
      sx={{ display: 'block', fontWeight: 600 }}
    >
      {label}
    </Typography>
  </Box>
);

const ConfusionMatrixBlock = ({
  cm,
  title,
  color,
}: {
  cm: { tn: number; fp: number; fn: number; tp: number };
  title: string;
  color: string;
}) => {
  const total = cm.tn + cm.fp + cm.fn + cm.tp;
  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, color, mb: 1 }}
      >
        {title}
      </Typography>
      <Grid
        container
        spacing={0.75}
      >
        <Grid
          item
          xs={6}
        >
          <CmCell
            value={cm.tn}
            total={total}
            bgcolor="rgba(46,125,50,0.10)"
            label="True Negative"
          />
        </Grid>
        <Grid
          item
          xs={6}
        >
          <CmCell
            value={cm.fp}
            total={total}
            bgcolor="rgba(211,47,47,0.10)"
            label="False Positive"
          />
        </Grid>
        <Grid
          item
          xs={6}
        >
          <CmCell
            value={cm.fn}
            total={total}
            bgcolor="rgba(211,47,47,0.10)"
            label="False Negative"
          />
        </Grid>
        <Grid
          item
          xs={6}
        >
          <CmCell
            value={cm.tp}
            total={total}
            bgcolor="rgba(46,125,50,0.10)"
            label="True Positive"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

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

  const hasMitigated =
    performanceData.mitigated_performance_metrics !== undefined &&
    performanceData.mitigated_fairness_metrics !== undefined;

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
      >
        Performance & Fairness
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        paragraph
      >
        {hasMitigated
          ? 'Side-by-side comparison of the base model and the mitigated model. Delta chips show the change — green means improvement, red means regression.'
          : 'Performance metrics and fairness indicators for the base model before mitigation.'}
      </Typography>

      <Grid
        container
        spacing={3}
      >
        {/* ── Performance Metrics ── */}
        <Grid
          item
          xs={12}
          md={4}
        >
          <Paper sx={{ p: 2.5, height: '100%' }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
              gutterBottom
            >
              Performance Metrics
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <MetricRow
              label="Accuracy"
              description="Share of all predictions that are correct. Higher is better."
              baseValue={performanceData.performance_metrics.Accuracy}
              mitigatedValue={performanceData.mitigated_performance_metrics?.Accuracy}
              format={(v) => `${(v * 100).toFixed(1)}%`}
              higherIsBetter
            />
            <Divider />
            <MetricRow
              label="F1 Score"
              description="Harmonic mean of precision and recall (0–1). Higher is better."
              baseValue={performanceData.performance_metrics.F1Score}
              mitigatedValue={performanceData.mitigated_performance_metrics?.F1Score}
              higherIsBetter
            />
            <Divider />
            <MetricRow
              label="AUC — Area Under Curve"
              description="Ability to distinguish between classes (0–1). Higher is better."
              baseValue={performanceData.performance_metrics.AUC}
              mitigatedValue={performanceData.mitigated_performance_metrics?.AUC}
              higherIsBetter
            />
          </Paper>
        </Grid>

        {/* ── Fairness Metrics ── */}
        <Grid
          item
          xs={12}
          md={4}
        >
          <Paper sx={{ p: 2.5, height: '100%' }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
              gutterBottom
            >
              Fairness Metrics
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <MetricRow
              label="Statistical Parity Difference"
              description="Difference in positive prediction rates between groups. Ideal = 0."
              baseValue={performanceData.fairness_metrics.StatisticalParityDiff}
              mitigatedValue={performanceData.mitigated_fairness_metrics?.StatisticalParityDiff}
              targetValue={0}
            />
            <Divider />
            <MetricRow
              label="Disparate Impact"
              description="Ratio of positive rates across groups. Ideal = 1.0 (0.8–1.2 is acceptable)."
              baseValue={performanceData.fairness_metrics.DisparateImpact}
              mitigatedValue={performanceData.mitigated_fairness_metrics?.DisparateImpact}
              targetValue={1}
            />
            <Divider />
            <MetricRow
              label="Equal Opportunity Difference"
              description="Difference in true positive rates between groups. Ideal = 0."
              baseValue={performanceData.fairness_metrics.EqualOpportunityDiff}
              mitigatedValue={performanceData.mitigated_fairness_metrics?.EqualOpportunityDiff}
              targetValue={0}
            />
          </Paper>
        </Grid>

        {/* ── Confusion Matrix ── */}
        <Grid
          item
          xs={12}
          md={4}
        >
          <Paper sx={{ p: 2.5, height: '100%' }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700 }}
              gutterBottom
            >
              Confusion Matrix
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 1.5 }}
            >
              Green cells = correct predictions. Red cells = errors.
            </Typography>
            <Stack spacing={hasMitigated ? 2.5 : 0}>
              <ConfusionMatrixBlock
                cm={performanceData.confusion_matrix}
                title={hasMitigated ? 'Base Model' : 'Confusion Matrix'}
                color={BASE_COLOR}
              />
              {hasMitigated && performanceData.mitigated_confusion_matrix && (
                <ConfusionMatrixBlock
                  cm={performanceData.mitigated_confusion_matrix}
                  title="Mitigated Model"
                  color={MIT_COLOR}
                />
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* ── ROC Curve ── */}
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
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 1 }}
            >
              True Positive Rate vs False Positive Rate. Closer to the top-left corner = better.
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={[]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    dataKey="fpr"
                    tickCount={6}
                    label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    type="number"
                    domain={[0, 1]}
                    tickCount={6}
                    label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip formatter={(value: number) => value.toFixed(3)} />
                  <Legend />
                  <Line
                    type="monotone"
                    data={performanceData.roc_curve}
                    dataKey="tpr"
                    stroke={BASE_COLOR}
                    name="Base Model"
                    strokeWidth={2}
                    dot={false}
                  />
                  {performanceData.mitigated_roc_curve && (
                    <Line
                      type="monotone"
                      data={performanceData.mitigated_roc_curve}
                      dataKey="tpr"
                      stroke={MIT_COLOR}
                      name="Mitigated Model"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                  <Line
                    type="monotone"
                    data={[
                      { fpr: 0, tpr: 0 },
                      { fpr: 1, tpr: 1 },
                    ]}
                    dataKey="tpr"
                    stroke="#bbb"
                    strokeDasharray="5 5"
                    name="Random"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* ── Precision-Recall Curve ── */}
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
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 1 }}
            >
              Precision vs Recall. Closer to the top-right corner = better.
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={[]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    dataKey="recall"
                    tickCount={6}
                    label={{ value: 'Recall', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    type="number"
                    domain={[0, 1]}
                    tickCount={6}
                    label={{ value: 'Precision', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip formatter={(value: number) => value.toFixed(3)} />
                  <Legend />
                  <Line
                    type="monotone"
                    data={performanceData.pr_curve}
                    dataKey="precision"
                    stroke={BASE_COLOR}
                    name="Base Model"
                    strokeWidth={2}
                    dot={false}
                  />
                  {performanceData.mitigated_pr_curve && (
                    <Line
                      type="monotone"
                      data={performanceData.mitigated_pr_curve}
                      dataKey="precision"
                      stroke={MIT_COLOR}
                      name="Mitigated Model"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
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
