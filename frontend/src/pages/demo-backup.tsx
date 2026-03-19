import { useState } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Paper,
  Container,
  CardActionArea,
  Chip,
  Link,
  Divider,
  Stack,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from '@mui/material';
import {
  ScienceOutlined,
  DatasetOutlined,
  CheckCircleOutline,
  ErrorOutline,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { NextPage } from 'next';
import { Layout as MarketingLayout } from 'src/layouts/marketing';
import { Seo } from 'src/components/seo';

interface SensitiveFeature {
  Unprivilaged: string;
  privilaged: string;
}

interface Dataset {
  id: string;
  name: string;
  url: string;
  instances: number;
  description: string;
  sensitive_features: {
    [key: string]: SensitiveFeature;
  };
}

interface Classifier {
  id: string;
  name: string;
  url: string;
  description: string;
  type: string;
}

interface BiasMetric {
  name: string;
  value: number;
  threshold: number;
  hasBias: boolean;
  mitigatedValue?: number;
  mitigatedHasBias?: boolean;
}

interface BiasSection {
  protectedAttribute: string;
  privilegedGroup: string;
  unprivilegedGroup: string;
  accuracy: number;
  biasedMetricsCount: number;
  totalMetrics: number;
  metrics: BiasMetric[];
}

interface Mitigation {
  id: string;
  name: string;
  type: string;
  url: string;
  description: string;
}

const datasets: Dataset[] = [
  {
    id: '0hzH0cVrqPVZ7bKpi5bY',
    name: 'Statlog (German Credit Data)',
    url: 'https://archive.ics.uci.edu/dataset/144/statlog+german+credit+data',
    instances: 1000,
    description:
      'This dataset classifies people described by a set of attributes as good or bad credit risks. Comes in two formats (one all numeric). Also comes with a cost matrix.',
    sensitive_features: {
      Age: {
        Unprivilaged: 'Young',
        privilaged: 'Old',
      },
      Gender: {
        Unprivilaged: 'Female',
        privilaged: 'Male',
      },
    },
  },
  {
    id: 'CmbeQiBHymxPXatftpO3',
    name: 'Census Income',
    url: 'https://archive.ics.uci.edu/dataset/20/census+income',
    instances: 48842,
    description:
      'Predict whether income exceeds $50K/yr based on census data. Also known as Adult dataset.',
    sensitive_features: {
      Age: {
        Unprivilaged: 'Young',
        privilaged: 'Old',
      },
      Race: {
        Unprivilaged: 'Non-white',
        privilaged: 'White',
      },
      Gender: {
        Unprivilaged: 'Female',
        privilaged: 'Male',
      },
    },
  },
];

const classifiers: Classifier[] = [
  {
    id: '5rrHu73JrkcGvyYfriUl',
    name: 'Support Vector Classification (SVC)',
    description:
      'A versatile classifier that separates data using hyperplanes in high-dimensional space.',
    type: 'Linear Classification',
    url: 'https://scikit-learn.org/dev/modules/generated/sklearn.svm.SVC.html',
  },
  {
    id: '7kLm9nOpQrSt4uVwXyZ2',
    name: 'Random Forest Classifier',
    description:
      'An ensemble learning method that constructs multiple decision trees and outputs the class that is the mode of the classes.',
    type: 'Ensemble Learning',
    url: 'https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html',
  },
  {
    id: '3aB8cD2eF5gH1iJ4kL7m',
    name: 'Logistic Regression',
    description:
      'A linear model for classification that predicts the probability of occurrence of an event.',
    type: 'Linear Classification',
    url: 'https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html',
  },
  {
    id: '9mN6pQ4rS7tU2vW5xY8z',
    name: 'XGBoost Classifier',
    description:
      'An optimized gradient boosting library designed to be highly efficient, flexible and portable.',
    type: 'Ensemble Learning',
    url: 'https://xgboost.readthedocs.io/en/stable/python/python_api.html#xgboost.XGBClassifier',
  },
];

const biasData: BiasSection[] = [
  {
    protectedAttribute: 'Sex',
    privilegedGroup: 'Female',
    unprivilegedGroup: 'Male',
    accuracy: 66,
    biasedMetricsCount: 4,
    totalMetrics: 5,
    metrics: [
      { name: 'Statistical Parity', value: 0.7, threshold: 0.8, hasBias: true },
      { name: 'Equal Opportunity', value: 0.65, threshold: 0.8, hasBias: true },
      { name: 'Average Odds', value: 0.75, threshold: 0.8, hasBias: true },
      { name: 'Disparate Impact', value: 0.85, threshold: 0.8, hasBias: false },
      { name: 'Theil Index', value: 0.6, threshold: 0.8, hasBias: true },
    ],
  },
  {
    protectedAttribute: 'Race',
    privilegedGroup: 'White',
    unprivilegedGroup: 'Non-white',
    accuracy: 68,
    biasedMetricsCount: 3,
    totalMetrics: 5,
    metrics: [
      {
        name: 'Statistical Parity',
        value: 0.82,
        threshold: 0.8,
        hasBias: false,
      },
      { name: 'Equal Opportunity', value: 0.7, threshold: 0.8, hasBias: true },
      { name: 'Average Odds', value: 0.68, threshold: 0.8, hasBias: true },
      { name: 'Disparate Impact', value: 0.75, threshold: 0.8, hasBias: true },
      { name: 'Theil Index', value: 0.83, threshold: 0.8, hasBias: false },
    ],
  },
];

const biasDataAfterMitigation: BiasSection[] = [
  {
    protectedAttribute: 'Sex',
    privilegedGroup: 'Female',
    unprivilegedGroup: 'Male',
    accuracy: 64,
    biasedMetricsCount: 1,
    totalMetrics: 5,
    metrics: [
      {
        name: 'Statistical Parity',
        value: 0.7,
        mitigatedValue: 0.85,
        threshold: 0.8,
        hasBias: true,
        mitigatedHasBias: false,
      },
      {
        name: 'Equal Opportunity',
        value: 0.65,
        mitigatedValue: 0.82,
        threshold: 0.8,
        hasBias: true,
        mitigatedHasBias: false,
      },
      {
        name: 'Average Odds',
        value: 0.75,
        mitigatedValue: 0.79,
        threshold: 0.8,
        hasBias: true,
        mitigatedHasBias: true,
      },
      {
        name: 'Disparate Impact',
        value: 0.85,
        mitigatedValue: 0.88,
        threshold: 0.8,
        hasBias: false,
        mitigatedHasBias: false,
      },
      {
        name: 'Theil Index',
        value: 0.6,
        mitigatedValue: 0.81,
        threshold: 0.8,
        hasBias: true,
        mitigatedHasBias: false,
      },
    ],
  },
  {
    protectedAttribute: 'Race',
    privilegedGroup: 'White',
    unprivilegedGroup: 'Non-white',
    accuracy: 65,
    biasedMetricsCount: 0,
    totalMetrics: 5,
    metrics: [
      {
        name: 'Statistical Parity',
        value: 0.82,
        mitigatedValue: 0.89,
        threshold: 0.8,
        hasBias: false,
        mitigatedHasBias: false,
      },
      {
        name: 'Equal Opportunity',
        value: 0.7,
        mitigatedValue: 0.84,
        threshold: 0.8,
        hasBias: true,
        mitigatedHasBias: false,
      },
      {
        name: 'Average Odds',
        value: 0.68,
        mitigatedValue: 0.83,
        threshold: 0.8,
        hasBias: true,
        mitigatedHasBias: false,
      },
      {
        name: 'Disparate Impact',
        value: 0.75,
        mitigatedValue: 0.86,
        threshold: 0.8,
        hasBias: true,
        mitigatedHasBias: false,
      },
      {
        name: 'Theil Index',
        value: 0.83,
        mitigatedValue: 0.85,
        threshold: 0.8,
        hasBias: false,
        mitigatedHasBias: false,
      },
    ],
  },
];

const mitigations: Mitigation[] = [
  {
    id: '1lnP0yjB5oPH3U7SfD41',
    name: 'Prevalence Sampling',
    type: 'Preprocessing',
    url: 'https://github.com/dssg/aequitas/blob/master/src/aequitas/flow/methods/preprocessing/prevalence_sample.py',
    description:
      'Predict whether income exceeds $50K/yr based on census data. Also known as Adult dataset.',
  },
  {
    id: 'leU6NlZveVngIUFl4q0Z',
    name: 'Relabeller',
    type: 'Preprocessing',
    url: 'https://github.com/cosmicBboy/themis-ml/blob/master/themis_ml/preprocessing/relabelling.py',
    description:
      'Relabels target variables using a function that can compute a decision boundary in input data space using heuristic.',
  },
  {
    id: 'm7UDlJAHTIaMf0XHJZ4w',
    name: 'Data Repaierer',
    type: 'Preprocessing',
    url: 'https://github.com/dssg/aequitas/blob/master/src/aequitas/flow/methods/preprocessing/data_repairer.py',
    description:
      'Transforms the data distribution so that a given feature distribution is marginally independent of the sensitive attribute, s.',
  },
];

const MetricChart = ({
  metric,
  showComparison = false,
}: {
  metric: BiasMetric;
  showComparison?: boolean;
}) => {
  const data = [
    { name: '0', value: 0 },
    { name: '0.2', value: 0.2 },
    { name: '0.4', value: 0.4 },
    { name: '0.6', value: 0.6 },
    { name: '0.8', value: 0.8 },
    { name: '1.0', value: 1.0 },
  ].map((point) => ({
    ...point,
    threshold: metric.threshold,
    current: point.value === Math.round(metric.value * 10) / 10 ? metric.value : null,
    mitigated:
      showComparison &&
      metric.mitigatedValue &&
      point.value === Math.round(metric.mitigatedValue * 10) / 10
        ? metric.mitigatedValue
        : null,
  }));

  return (
    <Box
      sx={{
        width: '100%',
        height: 200,
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        },
      }}
    >
      <Box
        sx={{
          mb: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="body2">{metric.name}</Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {showComparison && (
            <>
              <Typography
                variant="body2"
                sx={{
                  color: metric.hasBias ? '#ef5350' : '#66bb6a',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                Original: {(metric.value * 100).toFixed(1)}%
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: metric.mitigatedHasBias ? '#ef5350' : '#66bb6a',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                Mitigated: {(metric.mitigatedValue! * 100).toFixed(1)}%
              </Typography>
            </>
          )}
          {!showComparison && (
            <Typography
              variant="body2"
              sx={{
                color: metric.hasBias ? '#ef5350' : '#66bb6a',
                fontWeight: 500,
              }}
            >
              {(metric.value * 100).toFixed(1)}%
            </Typography>
          )}
        </Box>
      </Box>
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <LineChart
          data={data}
          margin={{ top: 5, right: 5, left: -30, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f0f0f0"
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            domain={[0, 1]}
            ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
          />
          <Tooltip
            contentStyle={{
              background: '#fff',
              border: 'none',
              borderRadius: 8,
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number) => [(value * 100).toFixed(1) + '%']}
          />
          <Line
            type="monotone"
            dataKey="threshold"
            stroke="#9e9e9e"
            strokeDasharray="5 5"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={metric.hasBias ? '#ef5350' : '#66bb6a'}
            strokeWidth={2}
            dot={false}
            name="Original"
          />
          <Line
            type="monotone"
            dataKey="current"
            stroke={metric.hasBias ? '#ef5350' : '#66bb6a'}
            strokeWidth={0}
            dot={{
              r: 6,
              fill: metric.hasBias ? '#ef5350' : '#66bb6a',
              strokeWidth: 2,
              stroke: '#fff',
            }}
          />
          {showComparison && (
            <>
              <Line
                type="monotone"
                dataKey="mitigated"
                stroke={metric.mitigatedHasBias ? '#ef5350' : '#66bb6a'}
                strokeWidth={0}
                dot={{
                  r: 6,
                  fill: metric.mitigatedHasBias ? '#ef5350' : '#66bb6a',
                  strokeWidth: 2,
                  stroke: '#fff',
                }}
                strokeDasharray="3 3"
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

const SelectionSummary = ({
  dataset,
  classifier,
  mitigation,
  activeStep,
}: {
  dataset: Dataset | null;
  classifier: Classifier | null;
  mitigation: string;
  activeStep: number;
}) => {
  if (activeStep === 0) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 2,
        bgcolor: 'background.default',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack spacing={1}>
        {activeStep >= 1 && dataset && classifier && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DatasetOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{ fontWeight: 500 }}
              >
                Dataset: {dataset.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScienceOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{ fontWeight: 500 }}
              >
                Selected Classifier: {classifier.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleOutline sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{ fontWeight: 500 }}
              >
                Mitigation: {mitigations.find((m) => m.id === mitigation)?.name || 'None'}
              </Typography>
            </Box>
          </>
        )}
      </Stack>
    </Paper>
  );
};

const Page: NextPage = () => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [selectedClassifier, setSelectedClassifier] = useState<Classifier | null>(null);
  const [selectedMitigation, setSelectedMitigation] = useState<string>('');

  const steps = [
    'Select Dataset & Classifier',
    'Check Bias Metrics',
    'Select Mitigation',
    'Review Results',
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleDatasetSelect = (dataset: Dataset) => {
    setSelectedDataset(dataset);
  };

  const handleClassifierSelect = (classifier: Classifier) => {
    setSelectedClassifier(classifier);
  };

  const handleMitigationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMitigation(event.target.value);
  };

  const renderStepContent = (step: number) => {
    return (
      <>
        <SelectionSummary
          dataset={selectedDataset}
          classifier={selectedClassifier}
          mitigation={selectedMitigation}
          activeStep={activeStep}
        />
        {(() => {
          switch (step) {
            case 0:
              return (
                <Stack spacing={4}>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}
                    >
                      Select Dataset
                    </Typography>
                    <Grid
                      container
                      spacing={3}
                    >
                      {datasets.map((dataset) => (
                        <Grid
                          item
                          xs={12}
                          key={dataset.id}
                        >
                          <Card
                            elevation={selectedDataset?.id === dataset.id ? 6 : 1}
                            sx={{
                              borderWidth: 2,
                              borderStyle: 'solid',
                              borderColor:
                                selectedDataset?.id === dataset.id ? 'primary.main' : 'transparent',
                              position: 'relative',
                            }}
                          >
                            {selectedDataset?.id === dataset.id && (
                              <CheckCircleOutline
                                sx={{
                                  position: 'absolute',
                                  top: 12,
                                  right: 12,
                                  color: 'primary.main',
                                  fontSize: 24,
                                  zIndex: 1,
                                }}
                              />
                            )}
                            <CardActionArea onClick={() => handleDatasetSelect(dataset)}>
                              <CardContent sx={{ p: 3 }}>
                                <Stack spacing={2}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <DatasetOutlined
                                      sx={{
                                        mr: 1.5,
                                        color: 'primary.main',
                                        fontSize: 28,
                                      }}
                                    />
                                    <Typography
                                      variant="h6"
                                      component="div"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {dataset.name}
                                    </Typography>
                                  </Box>
                                  <Typography
                                    color="text.secondary"
                                    sx={{ lineHeight: 1.6 }}
                                  >
                                    {dataset.description}
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      gap: 1,
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <Chip
                                      label={`${dataset.instances.toLocaleString()} instances`}
                                      size="small"
                                      color="primary"
                                      sx={{ fontWeight: 500 }}
                                    />
                                    <Link
                                      href={dataset.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{ textDecoration: 'none' }}
                                    >
                                      <Chip
                                        label="View Dataset"
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        clickable
                                        sx={{ fontWeight: 500 }}
                                      />
                                    </Link>
                                  </Box>
                                  <Divider sx={{ my: 1 }} />
                                  <Box>
                                    <Typography
                                      variant="subtitle2"
                                      color="primary"
                                      sx={{ mb: 1.5, fontWeight: 600 }}
                                    >
                                      Sensitive Features
                                    </Typography>
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      flexWrap="wrap"
                                      useFlexGap
                                    >
                                      {Object.entries(dataset.sensitive_features).map(
                                        ([feature, values]) => (
                                          <Chip
                                            key={feature}
                                            label={`${feature}: ${values.Unprivilaged} vs ${values.privilaged}`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ mb: 1 }}
                                          />
                                        )
                                      )}
                                    </Stack>
                                  </Box>
                                </Stack>
                              </CardContent>
                            </CardActionArea>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}
                    >
                      Select Classifier
                    </Typography>
                    <Grid
                      container
                      spacing={3}
                    >
                      {classifiers.map((classifier) => (
                        <Grid
                          item
                          xs={12}
                          md={6}
                          key={classifier.id}
                        >
                          <Card
                            elevation={selectedClassifier?.id === classifier.id ? 6 : 1}
                            sx={{
                              borderWidth: 2,
                              borderStyle: 'solid',
                              borderColor:
                                selectedClassifier?.id === classifier.id
                                  ? 'primary.main'
                                  : 'transparent',
                              position: 'relative',
                            }}
                          >
                            {selectedClassifier?.id === classifier.id && (
                              <CheckCircleOutline
                                sx={{
                                  position: 'absolute',
                                  top: 12,
                                  right: 12,
                                  color: 'primary.main',
                                  fontSize: 24,
                                }}
                              />
                            )}
                            <CardActionArea
                              onClick={() => handleClassifierSelect(classifier)}
                              sx={{ height: '100%' }}
                            >
                              <CardContent>
                                <Stack spacing={2}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <ScienceOutlined
                                      sx={{
                                        mr: 1.5,
                                        color: 'primary.main',
                                        fontSize: 28,
                                      }}
                                    />
                                    <Typography
                                      variant="h6"
                                      component="div"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {classifier.name}
                                    </Typography>
                                  </Box>
                                  <Typography
                                    color="text.secondary"
                                    sx={{ lineHeight: 1.6 }}
                                  >
                                    {classifier.description}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                                    <Chip
                                      label={classifier.type}
                                      size="small"
                                      color="primary"
                                      sx={{ fontWeight: 500 }}
                                    />
                                    <Link
                                      href={classifier.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      sx={{ textDecoration: 'none' }}
                                    >
                                      <Chip
                                        label="Documentation"
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                        clickable
                                        sx={{ fontWeight: 500 }}
                                      />
                                    </Link>
                                  </Box>
                                </Stack>
                              </CardContent>
                            </CardActionArea>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Stack>
              );
            case 1:
              return (
                <Stack spacing={4}>
                  <Box>
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Check bias metrics
                    </Typography>
                  </Box>

                  {biasData.map((section, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                    >
                      <Stack spacing={3}>
                        <Box>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ color: 'primary.main', fontWeight: 600 }}
                          >
                            Protected Attribute: {section.protectedAttribute}
                          </Typography>
                          <Grid
                            container
                            spacing={2}
                          >
                            <Grid
                              item
                              xs={12}
                              sm={6}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                <strong>Privileged Group:</strong> {section.privilegedGroup}
                              </Typography>
                            </Grid>
                            <Grid
                              item
                              xs={12}
                              sm={6}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                <strong>Unprivileged Group:</strong> {section.unprivilegedGroup}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>

                        <Alert
                          severity={section.biasedMetricsCount > 2 ? 'error' : 'warning'}
                          icon={<ErrorOutline />}
                          sx={{
                            borderRadius: 2,
                            '& .MuiAlert-icon': {
                              alignItems: 'center',
                            },
                          }}
                        >
                          <Typography variant="body2">
                            Accuracy with no mitigation applied is {section.accuracy}%
                          </Typography>
                          <Typography variant="body2">
                            With default thresholds, bias against unprivileged group detected in{' '}
                            <strong>
                              {section.biasedMetricsCount} out of {section.totalMetrics}
                            </strong>{' '}
                            metrics
                          </Typography>
                        </Alert>

                        <Grid
                          container
                          spacing={3}
                        >
                          {section.metrics.map((metric, idx) => (
                            <Grid
                              item
                              xs={12}
                              sm={6}
                              md={2}
                              key={idx}
                            >
                              <MetricChart metric={metric} />
                            </Grid>
                          ))}
                        </Grid>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              );
            case 2:
              return (
                <Stack spacing={4}>
                  <Box>
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Select Mitigation Strategy
                    </Typography>
                    <Typography
                      color="text.secondary"
                      paragraph
                    >
                      Choose a mitigation method to reduce bias in the model
                    </Typography>
                  </Box>

                  <FormControl>
                    <RadioGroup
                      value={selectedMitigation}
                      onChange={handleMitigationChange}
                    >
                      <Stack spacing={2}>
                        {mitigations.map((mitigation) => (
                          <Paper
                            key={mitigation.id}
                            elevation={0}
                            sx={{
                              p: 3,
                              borderRadius: 2,
                              bgcolor: 'background.default',
                              border: '1px solid',
                              borderColor:
                                selectedMitigation === mitigation.id ? 'primary.main' : 'divider',
                              transition: 'all 0.3s ease-in-out',
                              '&:hover': {
                                borderColor: 'primary.main',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              },
                            }}
                          >
                            <FormControlLabel
                              value={mitigation.id}
                              control={
                                <Radio
                                  sx={{
                                    color: 'primary.main',
                                    '&.Mui-checked': {
                                      color: 'primary.main',
                                    },
                                  }}
                                />
                              }
                              label={
                                <Box sx={{ ml: 1 }}>
                                  <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 600, mb: 1 }}
                                  >
                                    {mitigation.name}
                                  </Typography>
                                  <Stack spacing={2}>
                                    <Typography color="text.secondary">
                                      {mitigation.description}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <Chip
                                        label={mitigation.type}
                                        size="small"
                                        color="primary"
                                        sx={{ fontWeight: 500 }}
                                      />
                                      <Link
                                        href={mitigation.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ textDecoration: 'none' }}
                                      >
                                        <Chip
                                          label="View Implementation"
                                          size="small"
                                          color="primary"
                                          variant="outlined"
                                          clickable
                                          sx={{ fontWeight: 500 }}
                                        />
                                      </Link>
                                    </Box>
                                  </Stack>
                                </Box>
                              }
                              sx={{
                                margin: 0,
                                width: '100%',
                                alignItems: 'flex-start',
                              }}
                            />
                          </Paper>
                        ))}
                      </Stack>
                    </RadioGroup>
                  </FormControl>
                </Stack>
              );
            case 3:
              return (
                <Stack spacing={4}>
                  <Box>
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{ fontWeight: 600 }}
                    >
                      Review Mitigation Results
                    </Typography>
                    <Typography
                      color="text.secondary"
                      paragraph
                    >
                      Dataset: Compas (ProPublica recidivism)
                    </Typography>
                    <Typography color="text.secondary">
                      Mitigation: {mitigations.find((m) => m.id === selectedMitigation)?.name}
                    </Typography>
                  </Box>

                  {biasDataAfterMitigation.map((section, index) => (
                    <Paper
                      key={index}
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        bgcolor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Stack spacing={3}>
                        <Box>
                          <Typography
                            variant="h6"
                            gutterBottom
                            sx={{ color: 'primary.main', fontWeight: 600 }}
                          >
                            Protected Attribute: {section.protectedAttribute}
                          </Typography>
                          <Grid
                            container
                            spacing={2}
                          >
                            <Grid
                              item
                              xs={12}
                              sm={6}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Privileged Group: {section.privilegedGroup}
                              </Typography>
                            </Grid>
                            <Grid
                              item
                              xs={12}
                              sm={6}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                Unprivileged Group: {section.unprivilegedGroup}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>

                        <Alert
                          severity={section.biasedMetricsCount > 0 ? 'warning' : 'success'}
                          icon={<ErrorOutline />}
                          sx={{
                            borderRadius: 2,
                            '& .MuiAlert-icon': {
                              alignItems: 'center',
                            },
                          }}
                        >
                          <Typography variant="body2">
                            Accuracy after mitigation: {section.accuracy}%
                          </Typography>
                          <Typography variant="body2">
                            With mitigation applied, bias detected in{' '}
                            <strong>
                              {section.biasedMetricsCount} out of {section.totalMetrics}
                            </strong>{' '}
                            metrics
                          </Typography>
                        </Alert>

                        <Grid
                          container
                          spacing={3}
                        >
                          {section.metrics.map((metric, idx) => (
                            <Grid
                              item
                              xs={12}
                              sm={6}
                              md={4}
                              key={idx}
                            >
                              <MetricChart
                                metric={metric}
                                showComparison={true}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              );
            default:
              return null;
          }
        })()}
      </>
    );
  };

  return (
    <>
      <Seo title="Demo" />
      <Box
        component="main"
        sx={{
          background: '#f5f5f5',
          mt: '100px',
          py: 2,
        }}
      >
        <Container maxWidth="xl">
          <Paper
            sx={{ p: 3 }}
            elevation={0}
          >
            <Stepper
              activeStep={activeStep}
              sx={{
                mb: 6,
                '& .MuiStepLabel-root .Mui-completed': {
                  color: '#002d62',
                },
                '& .MuiStepLabel-root .Mui-active': {
                  color: '#002d62',
                },
                '& .MuiStepLabel-label': {
                  mt: 1,
                  fontWeight: 500,
                  fontFamily: 'Inter, sans-serif',
                },
                '& .MuiStepConnector-line': {
                  borderColor: 'divider',
                },
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {renderStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 6 }}>
              <Button
                variant="contained"
                disabled={activeStep === 0}
                onClick={handleBack}
                size="large"
                sx={{ mr: 2 }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={
                  (activeStep === 0 && (!selectedDataset || !selectedClassifier)) ||
                  (activeStep === 2 && !selectedMitigation)
                }
                size="large"
              >
                {activeStep === steps.length - 1 ? 'Apply Mitigation' : 'Next'}
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
};
Page.getLayout = (page) => <MarketingLayout>{page}</MarketingLayout>;

export default Page;
