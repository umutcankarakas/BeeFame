import React, { useEffect, useState, useCallback } from 'react';
import { debounce } from 'lodash';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Paper,
  Grid,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import ScatterPlot from './charts/ScatterPlot';
import {
  InitialDataPoint,
  DisplayDataPoint,
  EvaluatedPointData,
} from 'src/types/beespector/base-data';
import { beespectorApi } from 'src/lib/beespectorAxios';

const germanAttributeMap: Record<string, Record<string, string>> = {
  attribute1: { A11: '< 0 DM', A12: '0 to 200 DM', A13: '>= 200 DM', A14: 'No Account' },
  attribute3: {
    A30: 'No Credits/All Paid',
    A31: 'All Credits Here Paid',
    A32: 'Existing Credits Paid',
    A33: 'Past Delays',
    A34: 'Critical Account',
  },
  attribute4: {
    A40: 'Car (New)',
    A41: 'Car (Used)',
    A42: 'Furniture/Equipment',
    A43: 'Radio/TV',
    A44: 'Appliances',
    A45: 'Repairs',
    A46: 'Education',
    A48: 'Retraining',
    A49: 'Business',
    A410: 'Other',
  },
  attribute6: {
    A61: '< 100 DM',
    A62: '100-500 DM',
    A63: '500-1000 DM',
    A64: '>= 1000 DM',
    A65: 'Unknown/No Savings',
  },
  attribute7: {
    A71: 'Unemployed',
    A72: '< 1 Year',
    A73: '1-4 Years',
    A74: '4-7 Years',
    A75: '>= 7 Years',
  },
  attribute9: {
    A91: 'Male: Divorced/Separated',
    A92: 'Female: Divorced/Married',
    A93: 'Male: Single',
    A94: 'Male: Married/Widowed',
    A95: 'Female: Single',
  },
  attribute10: { A101: 'None', A102: 'Co-applicant', A103: 'Guarantor' },
  attribute12: {
    A121: 'Real Estate',
    A122: 'Savings Agreement/Insurance',
    A123: 'Car or Other',
    A124: 'No Property',
  },
  attribute14: { A141: 'Bank', A142: 'Stores', A143: 'None' },
  attribute15: { A151: 'Rent', A152: 'Own', A153: 'For Free' },
  attribute17: {
    A171: 'Unskilled - Non-resident',
    A172: 'Unskilled - Resident',
    A173: 'Skilled',
    A174: 'Management/Self-employed',
  },
  attribute19: { A191: 'None', A192: 'Yes' },
  attribute20: { A201: 'Yes', A202: 'No' },
};

const transformToDisplayDataPoint = (initialPoint: InitialDataPoint): DisplayDataPoint => ({
  id: initialPoint.id,
  x1: initialPoint.x1,
  x2: initialPoint.x2,
  true_label: initialPoint.true_label,
  features: initialPoint.features,
  base_pred_label: initialPoint.pred_label,
  base_pred_prob: initialPoint.pred_prob,
  mitigated_pred_label: initialPoint.mitigated_pred_label,
  mitigated_pred_prob: initialPoint.mitigated_pred_prob,
});

const formatFeatureName = (feature: string): string => {
  if (feature.startsWith('attribute')) {
    const attrNum = feature.replace('attribute', '');
    const attrDescriptions: Record<string, string> = {
      '1': 'Checking Account',
      '2': 'Duration (Months)',
      '3': 'Credit History',
      '4': 'Purpose',
      '5': 'Credit Amount',
      '6': 'Savings Account',
      '7': 'Employment Since',
      '8': 'Installment Rate',
      '9': 'Personal Status & Sex',
      '10': 'Other Debtors',
      '11': 'Present Residence (Years)',
      '12': 'Property',
      '13': 'Age (Years)',
      '14': 'Other Plans',
      '15': 'Housing',
      '16': 'Existing Credits',
      '17': 'Job',
      '18': 'Liable People',
      '19': 'Telephone',
      '20': 'Foreign Worker',
    };
    return attrDescriptions[attrNum] || `Attribute ${attrNum}`;
  }
  return feature
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function DatapointEditor() {
  const [allPoints, setAllPoints] = useState<DisplayDataPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<DisplayDataPoint | null>(null);
  const [internalSelectedPoint, setInternalSelectedPoint] = useState<DisplayDataPoint | null>(null);
  const [highlightedPointId, setHighlightedPointId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [axisLabels, setAxisLabels] = useState({ x1: 'X1', x2: 'X2' });
  const [contextInfo, setContextInfo] = useState<any>(null);
  const [categoricalOptions, setCategoricalOptions] = useState<Record<string, string[]>>({});

  const debouncedSetSelectedPoint = useCallback(
    debounce((point: DisplayDataPoint) => setSelectedPoint(point), 300),
    []
  );

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const contextRes = await beespectorApi.get('/context_info');
      const contextData = contextRes.data;
      setContextInfo(contextData);
      setAxisLabels({
        x1: formatFeatureName(contextData.x1_feature),
        x2: formatFeatureName(contextData.x2_feature),
      });
      const res = await beespectorApi.get('/datapoints');
      const initialData: InitialDataPoint[] = res.data.data;
      const displayData = initialData.map(transformToDisplayDataPoint);
      setAllPoints(displayData);
      if (displayData.length > 0) {
        const catOpts: Record<string, Set<string>> = {};
        const allFeatures = Object.keys(displayData[0].features);
        for (const featureKey of allFeatures) {
          const allValues = displayData.map((p) => p.features[featureKey]);
          const uniqueValues = new Set(
            allValues.filter((v) => v !== null && v !== undefined).map((v) => String(v))
          );
          const isString = typeof allValues.find((v) => v !== null) === 'string';
          if (isString || (uniqueValues.size > 1 && uniqueValues.size < 25))
            catOpts[featureKey] = uniqueValues;
        }
        const finalOpts: Record<string, string[]> = {};
        for (const key in catOpts) finalOpts[key] = Array.from(catOpts[key]).sort();
        setCategoricalOptions(finalOpts);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setInternalSelectedPoint(selectedPoint);
  }, [selectedPoint]);

  const handlePointClick = (pointId: number) => {
    const pointToSelect = allPoints.find((p) => p.id === pointId);
    if (pointToSelect) setSelectedPoint({ ...pointToSelect });
  };

  const handleFeatureChange = (featureKey: string, newValue: string | number) => {
    if (!internalSelectedPoint) return;
    setInternalSelectedPoint((prev) => {
      if (!prev) return null;
      const updatedFeatures = { ...prev.features, [featureKey]: newValue };
      const updatedPoint = { ...prev, features: updatedFeatures };
      if (contextInfo && featureKey === contextInfo.x1_feature)
        updatedPoint.x1 = typeof newValue === 'number' ? newValue : parseFloat(newValue);
      if (contextInfo && featureKey === contextInfo.x2_feature)
        updatedPoint.x2 = typeof newValue === 'number' ? newValue : parseFloat(newValue);
      debouncedSetSelectedPoint(updatedPoint);
      return updatedPoint;
    });
  };

  const handleUpdatePoint = async () => {
    if (!selectedPoint) return;
    setIsUpdating(true);
    const payload = { features: selectedPoint.features };
    try {
      const res = await beespectorApi.put<EvaluatedPointData>(
        `/datapoints/${selectedPoint.id}/evaluate`,
        payload
      );
      const evaluatedData = res.data;
      const updatedPoint = {
        id: evaluatedData.id,
        x1: evaluatedData.x1,
        x2: evaluatedData.x2,
        true_label: evaluatedData.true_label,
        features: evaluatedData.features,
        base_pred_label: evaluatedData.base_model_prediction.pred_label,
        base_pred_prob: evaluatedData.base_model_prediction.pred_prob,
        mitigated_pred_label: evaluatedData.mitigated_model_prediction.pred_label,
        mitigated_pred_prob: evaluatedData.mitigated_model_prediction.pred_prob,
      };
      setAllPoints((prev) => prev.map((p) => (p.id === evaluatedData.id ? updatedPoint : p)));
      setSelectedPoint(updatedPoint);
      setHighlightedPointId(evaluatedData.id);
      setTimeout(() => setHighlightedPointId(null), 2000);
    } catch (error: any) {
      console.error('Error updating point:', error);
      alert('Error updating point. Check console for details.');
    } finally {
      setIsUpdating(false);
    }
  };

  const basePlotData = allPoints.map((p) => ({
    id: p.id,
    x: p.x1,
    y: p.x2,
    pred_label: p.base_pred_label,
  }));
  const mitigatedPlotData = allPoints.map((p) => ({
    id: p.id,
    x: p.x1,
    y: p.x2,
    pred_label: p.mitigated_pred_label,
  }));
  const shapeFuncForScatter = (
    props: any,
    highlightId: number | null,
    currentSelectedId: number | null
  ) => {
    const { cx, cy, payload } = props;
    const isHighlighted = payload.id === highlightId;
    const isSelected = payload.id === currentSelectedId;
    const radius = isSelected ? 7 : 5;
    const fillColor = payload.pred_label === 1 ? '#ff4d4f' : '#1890ff';
    let stroke = isSelected ? '#FFD700' : '#fff';
    let strokeWidth = isSelected ? 2.5 : 1;
    if (isHighlighted) {
      stroke = payload.pred_label === 1 ? '#8B0000' : '#00008B';
      strokeWidth = 3;
    }
    return (
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={fillColor}
        stroke={stroke}
        strokeWidth={strokeWidth}
        style={{ cursor: 'pointer' }}
      />
    );
  };

  if (isLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading data...</Typography>
      </Box>
    );
  if (error)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );

  return (
    <Box>
      <Typography
        variant="h4"
        gutterBottom
      >
        Datapoint Editor
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        paragraph
      >
        Select a point, modify its features, and click Apply to see how its prediction changes for
        both models.
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, mt: 3, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 400 }}>
          <Paper sx={{ p: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
            >
              Base Model View
            </Typography>
            <ScatterPlot
              data={basePlotData}
              onPointClick={(data) => handlePointClick(data.id)}
              customShape={(props) =>
                shapeFuncForScatter(props, highlightedPointId, selectedPoint?.id ?? null)
              }
              xAxisLabel={axisLabels.x1}
              yAxisLabel={axisLabels.x2}
            />
          </Paper>
        </Box>

        <Box sx={{ flex: 1, minWidth: 400 }}>
          <Paper sx={{ p: 2 }}>
            <Typography
              variant="h6"
              gutterBottom
            >
              Fair Model View
            </Typography>
            <ScatterPlot
              data={mitigatedPlotData}
              onPointClick={(data) => handlePointClick(data.id)}
              customShape={(props) =>
                shapeFuncForScatter(props, highlightedPointId, selectedPoint?.id ?? null)
              }
              xAxisLabel={axisLabels.x1}
              yAxisLabel={axisLabels.x2}
            />
          </Paper>
        </Box>

        <Paper
          sx={{
            width: '420px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 300px)',
            p: 2,
          }}
        >
          {internalSelectedPoint ? (
            <>
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography variant="h6">Selected ID: {internalSelectedPoint.id}</Typography>
                  <Button
                    onClick={handleUpdatePoint}
                    variant="contained"
                    size="small"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Updating...' : 'Apply'}
                  </Button>
                </Box>
                <Chip
                  label={`True Label: ${internalSelectedPoint.true_label}`}
                  size="small"
                  color={internalSelectedPoint.true_label === 1 ? 'error' : 'primary'}
                />
                <Grid
                  container
                  spacing={1}
                  sx={{ mt: 1 }}
                >
                  <Grid
                    item
                    xs={6}
                  >
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                    >
                      Base Model Pred:
                    </Typography>
                    <Typography>
                      {internalSelectedPoint.base_pred_label} (
                      {internalSelectedPoint.base_pred_prob.toFixed(3)})
                    </Typography>
                  </Grid>
                  <Grid
                    item
                    xs={6}
                  >
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                    >
                      Fair Model Pred:
                    </Typography>
                    <Typography>
                      {internalSelectedPoint.mitigated_pred_label} (
                      {internalSelectedPoint.mitigated_pred_prob.toFixed(3)})
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography
                variant="subtitle1"
                fontWeight="bold"
              >
                Edit Features:
              </Typography>
              <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, mt: 1 }}>
                <Grid
                  container
                  spacing={2}
                >
                  {Object.entries(internalSelectedPoint.features).map(([key, val]) => {
                    const opts = categoricalOptions[key];
                    const isNumeric = typeof val === 'number' && !opts;
                    // --- NEW LOGIC for rendering dropdowns ---
                    const isGermanCategorical =
                      contextInfo?.dataset === 'german' && germanAttributeMap[key];

                    return (
                      <Grid
                        item
                        xs={12}
                        key={key}
                      >
                        {isGermanCategorical ? (
                          <FormControl
                            fullWidth
                            size="small"
                          >
                            <InputLabel>{formatFeatureName(key)}</InputLabel>
                            <Select
                              value={String(val ?? '')}
                              label={formatFeatureName(key)}
                              onChange={(e) => handleFeatureChange(key, e.target.value)}
                            >
                              {Object.entries(germanAttributeMap[key]).map(
                                ([code, description]) => (
                                  <MenuItem
                                    key={code}
                                    value={code}
                                  >
                                    {description} ({code})
                                  </MenuItem>
                                )
                              )}
                            </Select>
                          </FormControl>
                        ) : opts ? (
                          <FormControl
                            fullWidth
                            size="small"
                          >
                            <InputLabel>{formatFeatureName(key)}</InputLabel>
                            <Select
                              value={String(val ?? '')}
                              label={formatFeatureName(key)}
                              onChange={(e) => handleFeatureChange(key, e.target.value)}
                            >
                              {opts.map((o) => (
                                <MenuItem
                                  key={o}
                                  value={o}
                                >
                                  {o}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <TextField
                            fullWidth
                            size="small"
                            label={formatFeatureName(key)}
                            type={isNumeric ? 'number' : 'text'}
                            value={val ?? ''}
                            onChange={(e) =>
                              handleFeatureChange(
                                key,
                                isNumeric ? parseFloat(e.target.value) || 0 : e.target.value
                              )
                            }
                          />
                        )}
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
              }}
            >
              <Typography color="text.secondary">
                No point selected. Click a point on a chart.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default DatapointEditor;
