import { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Container,
  CardActionArea,
  Chip,
  Link,
  Stack,
  Alert,
  FormControl,
  TextField,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import {
  ScienceOutlined,
  DatasetOutlined,
  CheckCircleOutline,
  ErrorOutline,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  Cell,
  LineChart,
  Line,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { NextPage } from 'next';
import { Layout as MarketingLayout } from 'src/layouts/marketing';
import { Seo } from 'src/components/seo';
import { api } from 'src/lib/axios';
import { useBeeFame } from 'src/contexts/BeeFameContext';
import BeespectorNavbar from 'src/components/beespector/Navbar';
import DatapointEditor from 'src/components/beespector/DatapointEditor';
import PerformanceFairness from 'src/components/beespector/PerformanceFairness';
import DatasetFeaturesPreview from 'src/components/beespector/DatasetFeaturesPreview';
import { beespectorApi } from 'src/lib/beespectorAxios';

interface SensitiveFeature {
  name: string;
  unprivileged: string;
  privileged: string;
}

interface Dataset {
  id: number;
  name: string;
  slug: string;
  url: string;
  instances: number;
  description: string;
  sensitive_features: SensitiveFeature[];
}

interface Classifier {
  id: number;
  name: string;
  url: string;
  params: {
    title: string;
    type: 'int' | 'float' | 'str' | 'bool';
    default?: number | string | boolean;
  }[];
}

interface BiasMetric {
  name: string;
  value: number;
  mitigatedValue?: number;
}

interface BiasAnalysis {
  'Method Name': string;
  Classifier: string;
  Dataset: string;
  'Dataset Name': string;
  'Sensitive Column': string;
  'Model Accuracy': number;
  'Statistical Parity Difference': number;
  'Equal Opportunity Difference': number;
  'Average Odds Difference': number;
  'Disparate Impact': number;
  'Theil Index': number;
}

interface ChartDataItem {
  name: string;
  value: number;
}

interface BiasSection {
  datasetName?: string;
  methodName?: string;
  protectedAttribute: string;
  classifierName?: string;
  privilegedGroup: string;
  unprivilegedGroup: string;
  accuracy: number;
  mitigatedAccuracy?: number;
  metrics: BiasMetric[];
  biasedMetricsCount?: number;
  totalMetrics?: number;
}

interface AnalysisResponse {
  data: BiasAnalysis[];
}

interface Mitigation {
  id: string;
  name: string;
  type: string;
  url: string;
  description: string;
}

const MetricChart = ({ metric }: { metric: BiasMetric }) => {
  const data: ChartDataItem[] = [
    { name: 'original', value: metric.value },
    ...(metric.mitigatedValue ? [{ name: 'mitigated', value: metric.mitigatedValue }] : []),
  ];

  // Determine y-axis range based on metric name
  const getYAxisConfig = (metricName: string) => {
    if (metricName === 'Disparate Impact') {
      return {
        domain: [0, 2],
        ticks: [0, 0.5, 1, 1.5, 2],
        referenceLine: 1,
      };
    }
    return {
      domain: [-1, 1],
      ticks: [-1, -0.5, 0, 0.5, 1],
      referenceLine: 0,
    };
  };

  const yAxisConfig = getYAxisConfig(metric.name);

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
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#1976d2',
                mr: 1,
              }}
            />
            Original: {metric.value.toFixed(2)}
          </Typography>
          {metric.mitigatedValue !== undefined && (
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#2e7d32',
                  mr: 1,
                }}
              />
              Mitigated: {metric.mitigatedValue.toFixed(2)}
            </Typography>
          )}
        </Stack>
      </Box>
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={data}
          margin={{ top: 20, right: 5, left: 5, bottom: 5 }}
          barSize={40}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f0f0f0"
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            axisLine={false}
          />
          <YAxis
            domain={yAxisConfig.domain}
            ticks={yAxisConfig.ticks}
            tick={{ fontSize: 12 }}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2)]}
            contentStyle={{
              background: '#fff',
              border: 'none',
              borderRadius: 8,
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          />
          <ReferenceLine
            y={yAxisConfig.referenceLine}
            stroke="#666"
            strokeWidth={1}
            label={{
              value: metric.name === 'Disparate Impact' ? 'Fair' : '',
              position: 'right',
              fill: '#666',
            }}
          />
          {metric.name === 'Disparate Impact' && (
            <>
              <ReferenceLine
                y={0.8}
                stroke="#666"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <ReferenceLine
                y={1.2}
                stroke="#666"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            </>
          )}
          <Bar
            dataKey="value"
            fill={undefined}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.name === 'original' ? '#1976d2' : '#2e7d32'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

const MetricLineChart = ({ metric }: { metric: BiasMetric }) => {
  const data: ChartDataItem[] = [
    { name: 'original', value: metric.value },
    ...(metric.mitigatedValue ? [{ name: 'mitigated', value: metric.mitigatedValue }] : []),
  ];

  // Determine y-axis range based on metric name
  const getYAxisConfig = (metricName: string) => {
    if (metricName === 'Disparate Impact') {
      return {
        domain: [0, 2],
        ticks: [0, 0.5, 1, 1.5, 2],
        referenceLine: 1,
      };
    }
    return {
      domain: [-1, 1],
      ticks: [-1, -0.5, 0, 0.5, 1],
      referenceLine: 0,
    };
  };

  const yAxisConfig = getYAxisConfig(metric.name);

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
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#1976d2',
                mr: 1,
              }}
            />
            Original: {metric.value.toFixed(2)}
          </Typography>
          {metric.mitigatedValue !== undefined && (
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#2e7d32',
                  mr: 1,
                }}
              />
              Mitigated: {metric.mitigatedValue.toFixed(2)}
            </Typography>
          )}
        </Stack>
      </Box>
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <LineChart
          data={data}
          margin={{ top: 20, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f0f0f0"
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            axisLine={false}
          />
          <YAxis
            domain={yAxisConfig.domain}
            ticks={yAxisConfig.ticks}
            tick={{ fontSize: 12 }}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: number) => [value.toFixed(2)]}
            contentStyle={{
              background: '#fff',
              border: 'none',
              borderRadius: 8,
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          />
          <ReferenceLine
            y={yAxisConfig.referenceLine}
            stroke="#666"
            strokeWidth={1}
            label={{
              value: metric.name === 'Disparate Impact' ? 'Fair' : '',
              position: 'right',
              fill: '#666',
            }}
          />
          {metric.name === 'Disparate Impact' && (
            <>
              <ReferenceLine
                y={0.8}
                stroke="#666"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <ReferenceLine
                y={1.2}
                stroke="#666"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            </>
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#1976d2"
            strokeWidth={2}
            dot={{
              stroke: '#1976d2',
              strokeWidth: 2,
              r: 4,
              fill: '#fff',
            }}
            activeDot={{
              stroke: '#1976d2',
              strokeWidth: 2,
              r: 6,
              fill: '#fff',
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

const MetricRadarChart = ({ metrics }: { metrics: BiasMetric[] }) => {
  // Transform data for radar chart
  const data = metrics.map((metric) => ({
    name: metric.name.replace(/([A-Z])/g, ' $1').trim(), // Add spaces before capital letters
    original: Math.abs(metric.value).toFixed(2),
    mitigated: metric.mitigatedValue ? Math.abs(metric.mitigatedValue).toFixed(2) : undefined,
  }));

  return (
    <Box
      sx={{
        width: '100%',
        height: 300,
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.2s ease-in-out',
        mb: 2,
        pb: 4,
      }}
    >
      <Typography
        variant="h6"
        align="center"
        gutterBottom
        sx={{ fontWeight: 500 }}
      >
        Metrics Overview
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Stack
          direction="row"
          spacing={3}
          justifyContent="center"
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#1976d2',
                mr: 1,
                opacity: 0.7,
              }}
            />
            Original
          </Typography>
          {metrics.some((m) => m.mitigatedValue !== undefined) && (
            <Typography
              variant="body2"
              sx={{
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#2e7d32',
                  mr: 1,
                  opacity: 0.7,
                }}
              />
              Mitigated
            </Typography>
          )}
        </Stack>
      </Box>
      <ResponsiveContainer
        width="100%"
        height="85%"
      >
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="80%"
          data={data}
        >
          <PolarGrid gridType="polygon" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: 'text.secondary', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 1]}
            tick={{ fontSize: 12 }}
          />
          <Radar
            name="Original"
            dataKey="original"
            stroke="#1976d2"
            fill="#1976d2"
            fillOpacity={0.3}
          />
          {metrics.some((m) => m.mitigatedValue !== undefined) && (
            <Radar
              name="Mitigated"
              dataKey="mitigated"
              stroke="#2e7d32"
              fill="#2e7d32"
              fillOpacity={0.3}
            />
          )}
          <Tooltip
            /* formatter={(value: number) => [value?.toFixed(3)]} */
            contentStyle={{
              background: '#fff',
              border: 'none',
              borderRadius: 8,
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            }}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
};

const SelectionSummary = ({
  datasets,
  classifiers,
  mitigations,
  activeStep,
}: {
  datasets: Dataset[];
  classifiers: Classifier[];
  mitigations: string[];
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
        {activeStep >= 1 && datasets.length > 0 && classifiers.length > 0 && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DatasetOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{ fontWeight: 500 }}
              >
                Selected Datasets: {datasets.map((dataset) => dataset.name).join(', ')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScienceOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{ fontWeight: 500 }}
              >
                Selected Classifiers: {classifiers.map((classifier) => classifier.name).join(', ')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleOutline sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography
                variant="body2"
                sx={{ fontWeight: 500 }}
              >
                Selected Mitigations: {mitigations.length > 0 ? mitigations.join(', ') : 'None'}
              </Typography>
            </Box>
          </>
        )}
      </Stack>
    </Paper>
  );
};

const Page: NextPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([]);
  const [selectedClassifiers, setSelectedClassifiers] = useState<Classifier[]>([]);
  const [selectedMitigations, setSelectedMitigations] = useState<string[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [classifiers, setClassifiers] = useState<Classifier[]>([]);
  const [mitigations, setMitigations] = useState<Mitigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<BiasSection[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [testSize, setTestSize] = useState(0.2);
  const [classifierParams, setClassifierParams] = useState<{
    [classifierId: number]: { [param: string]: any };
  }>({});
  const [paramPage, setParamPage] = useState<Record<number, number>>({});

  // Dataset feature accordion state (Step 1)
  const [featureAccordionExpanded, setFeatureAccordionExpanded] = useState(false);
  const [featureAccordionDatasetIdx, setFeatureAccordionDatasetIdx] = useState(0);

  // Beespector Step 4 state
  const [beespectorActiveTab, setBeespectorActiveTab] = useState('performance');
  const [isInitializingBeespector, setIsInitializingBeespector] = useState(false);
  const [beespectorInitError, setBeespectorInitError] = useState<string | null>(null);
  const [beespectorContextInfo, setBeespectorContextInfo] = useState<any>(null);

  const {
    setSelectedDatasets: setContextDatasets,
    setSelectedClassifiers: setContextClassifiers,
    setSelectedMitigations: setContextMitigations,
    setAnalysisData: setContextAnalysisData,
    setClassifierParams: setContextClassifierParams,
  } = useBeeFame();

  // Initialize Beespector context when entering Step 4
  useEffect(() => {
    if (activeStep === 4) {
      setBeespectorActiveTab('performance');
      initializeBeespector();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);

  const initializeBeespector = async () => {
    if (selectedDatasets.length === 0 || selectedClassifiers.length === 0) return;
    setIsInitializingBeespector(true);
    setBeespectorInitError(null);
    setBeespectorContextInfo(null);
    try {
      const dataset = selectedDatasets[0];
      const classifier = selectedClassifiers[0];
      const mitigation = selectedMitigations.length > 0 ? selectedMitigations[0] : 'None';
      const sensitiveFeatureConfig = dataset.sensitive_features[0];
      let sensitiveFeatureName = sensitiveFeatureConfig.name.toLowerCase();
      if (sensitiveFeatureName === 'gender') sensitiveFeatureName = 'sex';
      const classifierSlug = classifier.name
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace('_(svc)', '')
        .replace('_classifier', '');
      const initParams = {
        dataset_name: dataset.slug,
        base_classifier: classifierSlug,
        classifier_params: classifierParams[classifier.id] || {},
        mitigation_method: mitigation.toLowerCase().replace(/\s+/g, '_'),
        sensitive_feature: sensitiveFeatureName,
      };
      const response = await beespectorApi.post('/initialize_context', initParams);
      setBeespectorContextInfo(response.data);
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Unknown error';
      setBeespectorInitError(msg);
    } finally {
      setIsInitializingBeespector(false);
    }
  };

  // Reset accordion dataset index when dataset selection changes
  useEffect(() => {
    setFeatureAccordionDatasetIdx(0);
  }, [selectedDatasets.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [datasetsResponse, classifiersResponse, mitigationsResponse] = await Promise.all([
          api.get('/datasets'),
          api.get('/classifiers'),
          api.get('/methods'),
        ]);

        setDatasets(datasetsResponse.data.data);
        setClassifiers(classifiersResponse.data.data);
        setMitigations(mitigationsResponse.data.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch data. Please try again later.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const steps = [
    'Select Dataset & Classifier',
    'Check Bias Metrics',
    'Select Mitigation',
    'Review Results',
    'Deep Dive',
  ];

  const handleNext = async () => {
    if (activeStep === 0 && selectedDatasets.length > 0 && selectedClassifiers.length > 0) {
      setActiveStep((prevStep) => prevStep + 1);
      setAnalysisLoading(true);
      setAnalysisError(null);
      try {
        const response = await api.post<AnalysisResponse>('/analysis', {
          dataset_names: selectedDatasets.map((dataset) => dataset.slug),
          classifiers: selectedClassifiers.map((classifier) => ({
            name: classifier.name,
            params: classifierParams[classifier.id] || {},
          })),
          test_size: testSize,
        });

        // Transform API response to BiasSection format
        const transformedData: BiasSection[] = response.data.data.map((analysis) => {
          const dataset = selectedDatasets.find((d) =>
            d.sensitive_features.some((f) => f.name === analysis['Sensitive Column'])
          );
          const sensitiveFeature = dataset?.sensitive_features.find(
            (feature) => feature.name === analysis['Sensitive Column']
          );

          const metrics: BiasMetric[] = [
            {
              name: 'Statistical Parity Difference (1-m)',
              value: 1 - analysis['Statistical Parity Difference'],
            },
            {
              name: 'Equal Opportunity Difference (1-m)',
              value: 1 - analysis['Equal Opportunity Difference'],
            },
            {
              name: 'Average Odds Difference (1-m)',
              value: 1 - analysis['Average Odds Difference'],
            },
            { name: 'Disparate Impact (m)', value: analysis['Disparate Impact'] },
            { name: 'Theil Index (1-m)', value: 1 - analysis['Theil Index'] },
          ];

          return {
            datasetName: analysis?.Dataset,
            classifierName: analysis['Classifier'],
            protectedAttribute: analysis['Sensitive Column'],
            privilegedGroup: sensitiveFeature?.privileged || '',
            unprivilegedGroup: sensitiveFeature?.unprivileged || '',
            accuracy: analysis['Model Accuracy'] * 100,
            metrics,
          };
        });

        setAnalysisData(transformedData);
        setContextAnalysisData(transformedData);
      } catch (err) {
        setAnalysisError('Failed to analyze dataset. Please try again.');
        console.error('Error analyzing dataset:', err);
      } finally {
        setAnalysisLoading(false);
      }
    } else if (activeStep === 2 && selectedMitigations.length > 0) {
      setActiveStep((prevStep) => prevStep + 1);
      setAnalysisLoading(true);
      setAnalysisError(null);
      /* console.log('analysis data : ', analysisData); */
      try {
        const response = await api.post<AnalysisResponse>('/evaluation', {
          dataset_names: selectedDatasets.map((dataset) => dataset.slug),
          classifier_names: selectedClassifiers.map((classifier) => classifier.name),
          method_names: selectedMitigations,
          test_size: testSize,
        });
        /* console.log('mitigation result before merging : ', response.data.data);
        console.log('analysis data before merging : ', analysisData); */
        // Update existing analysis data with mitigation results
        const newData = response.data.data;
        const updated = analysisData.flatMap((entry) => {
          const relatedMitigations = newData.filter(
            (m: any) =>
              m['Dataset Name'] === entry.datasetName &&
              m['Sensitive Column'] === entry.protectedAttribute &&
              m['Model Name'] === entry.classifierName
          );

          return relatedMitigations.map((m) => {
            const mitigationMetrics = {
              'Statistical Parity Difference (1-m)': 1 - m['Statistical Parity Difference'],
              'Equal Opportunity Difference (1-m)': 1 - m['Equal Opportunity Difference'],
              'Average Odds Difference (1-m)': 1 - m['Average Odds Difference'],
              'Disparate Impact (m)': m['Disparate Impact'],
              'Theil Index (1-m)': 1 - m['Theil Index'],
            };

            const newMetrics = entry.metrics.map((metric: any) => ({
              ...metric,
              /* @ts-ignore */
              mitigatedValue: mitigationMetrics[metric.name],
            }));

            return {
              ...entry,
              methodName: m['Method Name'],
              mitigatedAccuracy: m['Model Accuracy'] * 100,
              metrics: newMetrics,
            };
          });
        });
        console.log('updated data after merging : ', updated);
        const updatedData = analysisData.map((section, index) => {
          /*  console.log('section : ', section);
          console.log('index : ', index); */
          const mitigatedResult = response.data.data;
          const mitigatedForSection = mitigatedResult.filter(
            (mItem) =>
              mItem['Dataset Name'] === section.datasetName &&
              mItem['Sensitive Column'] === section.protectedAttribute
          );

          /* console.log('mitigatedForSection :', mitigatedForSection); */

          const manipulatedMitigated = mitigatedForSection.map((item) => {
            const mitigatedValues: BiasMetric[] = [
              {
                name: 'Statistical Parity Difference (1-m)',
                value: 1 - item['Statistical Parity Difference'],
              },
              {
                name: 'Equal Opportunity Difference (1-m)',
                value: 1 - item['Equal Opportunity Difference'],
              },
              {
                name: 'Average Odds Difference (1-m)',
                value: 1 - item['Average Odds Difference'],
              },
              { name: 'Disparate Impact (m)', value: item['Disparate Impact'] },
              { name: 'Theil Index (1-m)', value: 1 - item['Theil Index'] },
            ];
            return {
              ...section,
              methodName: item['Method Name'],
              mitigatedAccuracy: item['Model Accuracy'] * 100,
              metrics: section.metrics.map((metric) => ({
                ...metric,
                mitigatedValue: mitigatedValues.find((mValue) => mValue.name === metric.name)
                  ?.value,
              })) as BiasMetric[],
            };
          });

          /* console.log('manipulatedMitigated : ', manipulatedMitigated); */

          return manipulatedMitigated;
        });
        // TO DO: Fix it nested array proble
        setAnalysisData(updated);
        setContextAnalysisData(updated);
      } catch (err) {
        setAnalysisError('Failed to apply mitigation. Please try again.');
        console.error('Error applying mitigation:', err);
      } finally {
        setAnalysisLoading(false);
      }
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    if (activeStep === 1) {
      setSelectedDatasets([]);
      setSelectedClassifiers([]);
    }

    if (activeStep === 3) {
      setSelectedMitigations([]);
    }
    /* setSelectedDatasets([]);
    setSelectedClassifiers([]);
    setSelectedMitigations([]); */
  };

  const handleDatasetSelect = (dataset: Dataset) => {
    setSelectedDatasets((prevDatasets) => {
      const isSelected = prevDatasets.some((d) => d.id === dataset.id);
      let newDatasets;
      if (isSelected) {
        newDatasets = prevDatasets.filter((d) => d.id !== dataset.id);
      } else {
        newDatasets = [...prevDatasets, dataset];
      }
      // Update context
      setContextDatasets(newDatasets);
      return newDatasets;
    });
  };

  const handleClassifierSelect = (classifier: Classifier) => {
    const isSelected = selectedClassifiers.some((c) => c.id === classifier.id);

    if (isSelected) {
      setSelectedClassifiers((prev) => {
        const newClassifiers = prev.filter((c) => c.id !== classifier.id);
        setContextClassifiers(newClassifiers);
        return newClassifiers;
      });
      setClassifierParams((prev) => {
        const updated = { ...prev };
        delete updated[classifier.id];
        setContextClassifierParams(updated);
        return updated;
      });
    } else {
      setSelectedClassifiers((prev) => {
        const newClassifiers = [...prev, classifier];
        setContextClassifiers(newClassifiers);
        return newClassifiers;
      });
      setClassifierParams((prev) => {
        const updated = {
          ...prev,
          [classifier.id]: Object.fromEntries(
            classifier.params.map((param) => [param.title, param.default ?? ''])
          ),
        };
        setContextClassifierParams(updated);
        return updated;
      });
    }
  };

  const handleMitigationSelect = (mitigation: string) => {
    setSelectedMitigations((prevMitigations) => {
      const isSelected = prevMitigations.includes(mitigation);
      let newMitigations;
      if (isSelected) {
        newMitigations = prevMitigations.filter((m) => m !== mitigation);
      } else {
        newMitigations = [...prevMitigations, mitigation];
      }
      // Update context
      setContextMitigations(newMitigations);
      return newMitigations;
    });
  };

  const renderStepContent = (step: number) => {
    return (
      <>
        <SelectionSummary
          datasets={selectedDatasets}
          classifiers={selectedClassifiers}
          mitigations={selectedMitigations}
          activeStep={activeStep}
        />
        {(() => {
          switch (step) {
            case 0:
              return (
                <>
                  <Box sx={{ mt: 4 }}>
                    {loading ? (
                      <Box
                        sx={{
                          minHeight: 400,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 2,
                        }}
                      >
                        <CircularProgress size={48} />
                        <Typography
                          variant="h6"
                          color="text.secondary"
                        >
                          Loading available datasets and classifiers...
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Please wait while we prepare the options
                        </Typography>
                      </Box>
                    ) : error ? (
                      <Alert
                        severity="error"
                        sx={{ mb: 2 }}
                      >
                        {error}
                      </Alert>
                    ) : (
                      <>
                        <Alert
                          icon={<ErrorOutline />}
                          severity="info"
                          sx={{ mb: 2 }}
                        >
                          In test scenarios where default parameters are employed, the results are
                          retrieved from a precomputed cache to ensure consistency and reduce
                          computation time.
                        </Alert>
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
                              xs={12}
                              md={6}
                              key={dataset.id}
                            >
                              <Card
                                sx={{
                                  height: '100%',
                                  cursor: 'pointer',
                                  borderWidth: 2,
                                  borderStyle: 'solid',
                                  borderColor: selectedDatasets.some((d) => d.id === dataset.id)
                                    ? 'primary.main'
                                    : 'transparent',
                                  position: 'relative',
                                }}
                              >
                                {selectedDatasets.some((d) => d.id === dataset.id) && (
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
                                  onClick={() => handleDatasetSelect(dataset)}
                                  sx={{
                                    height: '100%',
                                    alignItems: 'flex-start',
                                    '& .MuiCardContent-root': {
                                      height: '100%',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-start',
                                    },
                                  }}
                                >
                                  <CardContent>
                                    <Typography
                                      variant="h6"
                                      component="div"
                                      gutterBottom
                                    >
                                      {dataset.name}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ mb: 2 }}
                                    >
                                      {dataset.description}
                                    </Typography>
                                    <Stack
                                      direction="row"
                                      spacing={1}
                                      sx={{ mb: 2 }}
                                    >
                                      <Chip
                                        icon={<DatasetOutlined />}
                                        label={`${dataset.instances} instances`}
                                        size="small"
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
                                        />
                                      </Link>
                                    </Stack>
                                    <Typography
                                      variant="subtitle2"
                                      gutterBottom
                                      sx={{ mb: 1 }}
                                    >
                                      Sensitive Features:
                                    </Typography>
                                    {dataset.sensitive_features.map((feature, index) => (
                                      <Box
                                        key={index}
                                        sx={{ mb: 1.5 }}
                                      >
                                        <Typography
                                          variant="subtitle2"
                                          sx={{ mb: 0.5 }}
                                        >
                                          {feature.name}
                                        </Typography>
                                        <Stack
                                          direction="row"
                                          spacing={2}
                                        >
                                          <Stack
                                            direction="row"
                                            spacing={0.5}
                                            alignItems="center"
                                          >
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                            >
                                              Unprivileged:
                                            </Typography>
                                            <Chip
                                              label={feature.unprivileged}
                                              size="small"
                                              variant="outlined"
                                            />
                                          </Stack>
                                          <Stack
                                            direction="row"
                                            spacing={0.5}
                                            alignItems="center"
                                          >
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                            >
                                              Privileged:
                                            </Typography>
                                            <Chip
                                              label={feature.privileged}
                                              size="small"
                                              variant="outlined"
                                            />
                                          </Stack>
                                        </Stack>
                                      </Box>
                                    ))}
                                  </CardContent>
                                </CardActionArea>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>

                        {/* Dataset Feature Preview Accordion */}
                        {selectedDatasets.length > 0 && (
                          <Accordion
                            expanded={featureAccordionExpanded}
                            onChange={(_, exp) => setFeatureAccordionExpanded(exp)}
                            sx={{ mt: 3, mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2, '&:before': { display: 'none' } }}
                            elevation={0}
                          >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Typography sx={{ fontWeight: 600 }}>
                                Dataset Feature Overview
                                {selectedDatasets.length === 1 ? ` — ${selectedDatasets[0].name}` : ` (${selectedDatasets.length} datasets)`}
                              </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              {featureAccordionExpanded && (
                                <>
                                  {selectedDatasets.length > 1 && (
                                    <Tabs
                                      value={featureAccordionDatasetIdx}
                                      onChange={(_, v) => setFeatureAccordionDatasetIdx(v)}
                                      sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                                    >
                                      {selectedDatasets.map((ds, i) => (
                                        <Tab
                                          key={ds.id}
                                          label={ds.name}
                                          value={i}
                                        />
                                      ))}
                                    </Tabs>
                                  )}
                                  <DatasetFeaturesPreview
                                    datasetSlug={
                                      selectedDatasets[featureAccordionDatasetIdx]?.slug ||
                                      selectedDatasets[0].slug
                                    }
                                  />
                                </>
                              )}
                            </AccordionDetails>
                          </Accordion>
                        )}

                        <Typography
                          variant="h6"
                          sx={{ mb: 2, mt: 4, fontWeight: 600, color: 'primary.main' }}
                        >
                          Select Test/Train Split Ratio
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}>
                          <FormControl sx={{ width: '100%' }}>
                            <TextField
                              label="Test size"
                              type="number"
                              value={testSize}
                              onChange={(event) => {
                                const nextValue = Number(event.target.value);
                                if (!Number.isNaN(nextValue)) {
                                  setTestSize(nextValue);
                                }
                              }}
                              inputProps={{ min: 0.05, max: 0.95, step: 0.05 }}
                              helperText="Use a value between 0 and 1 (e.g., 0.2 = 20% test, 80% train)."
                            />
                          </FormControl>
                        </Paper>

                        <Typography
                          variant="h6"
                          sx={{ mb: 2, mt: 4, fontWeight: 600, color: 'primary.main' }}
                        >
                          Select Classifier
                        </Typography>
                        <Alert severity="info">
                          All parameters are constant for demo to get faster results.
                        </Alert>
                        <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                          <FormControl sx={{ width: '100%' }}>
                            <Grid
                              container
                              spacing={2}
                            >
                              {classifiers.map((classifier) => (
                                <Grid
                                  xs={12}
                                  md={6}
                                  key={classifier.id}
                                >
                                  <Paper
                                    elevation={0}
                                    onClick={() => handleClassifierSelect(classifier)}
                                    sx={{
                                      p: 1.5,
                                      borderRadius: 1,
                                      border: '1px solid',
                                      borderColor: selectedClassifiers.some(
                                        (c) => c.id === classifier.id
                                      )
                                        ? 'primary.main'
                                        : 'divider',
                                      bgcolor: 'background.paper',
                                      transition: 'all 0.2s',
                                      height: '100%',
                                      cursor: 'pointer',
                                      '&:hover': {
                                        borderColor: 'primary.main',
                                      },
                                    }}
                                  >
                                    <Stack
                                      direction="row"
                                      alignItems="center"
                                      spacing={2}
                                      sx={{ width: '100%' }}
                                    >
                                      <Box
                                        sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}
                                      >
                                        <ScienceOutlined
                                          sx={{
                                            mr: 1,
                                            color: selectedClassifiers.some(
                                              (c) => c.id === classifier.id
                                            )
                                              ? 'primary.main'
                                              : 'text.secondary',
                                          }}
                                        />
                                        <Typography
                                          sx={{
                                            fontWeight: selectedClassifiers.some(
                                              (c) => c.id === classifier.id
                                            )
                                              ? 600
                                              : 400,
                                            color: selectedClassifiers.some(
                                              (c) => c.id === classifier.id
                                            )
                                              ? 'primary.main'
                                              : 'text.primary',
                                          }}
                                        >
                                          {classifier.name}
                                        </Typography>
                                      </Box>
                                      <Link
                                        href={classifier.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        sx={{ textDecoration: 'none' }}
                                      >
                                        <Chip
                                          label="Documentation"
                                          size="small"
                                          variant="outlined"
                                          color={
                                            selectedClassifiers.some((c) => c.id === classifier.id)
                                              ? 'primary'
                                              : 'default'
                                          }
                                          sx={{
                                            height: 24,
                                            '&:hover': {
                                              bgcolor: 'primary.main',
                                              color: 'white',
                                              '& .MuiChip-label': {
                                                color: 'white',
                                              },
                                            },
                                          }}
                                        />
                                      </Link>
                                      {selectedClassifiers.some((c) => c.id === classifier.id) && (
                                        <CheckCircleOutline
                                          sx={{
                                            color: 'primary.main',
                                            fontSize: 20,
                                          }}
                                        />
                                      )}
                                    </Stack>
                                    {selectedClassifiers.some((c) => c.id === classifier.id) && (
                                      <Box sx={{ mt: 2, ml: 4 }}>
                                        {(() => {
                                          const currentPage = paramPage[classifier.id] ?? 0;
                                          const startIndex = currentPage * 4;
                                          const paginatedParams = classifier.params.slice(
                                            startIndex,
                                            startIndex + 4
                                          );
                                          const totalPages = Math.ceil(
                                            classifier.params.length / 4
                                          );

                                          return (
                                            <>
                                              <Grid
                                                container
                                                spacing={2}
                                              >
                                                {paginatedParams.map((param, idx) => (
                                                  <Grid
                                                    xs={12}
                                                    sm={6}
                                                    key={param.title + idx}
                                                  >
                                                    <Typography
                                                      variant="caption"
                                                      sx={{ fontWeight: 600 }}
                                                    >
                                                      {param.title} ({param.type})
                                                    </Typography>
                                                    <input
                                                      type={
                                                        param.type === 'int' ||
                                                        param.type === 'float'
                                                          ? 'number'
                                                          : 'text'
                                                      }
                                                      disabled
                                                      value={
                                                        classifierParams[classifier.id]?.[
                                                          param.title
                                                        ] ?? ''
                                                      }
                                                      onClick={(e) => e.stopPropagation()}
                                                      onChange={(e) =>
                                                        setClassifierParams((prev) => ({
                                                          ...prev,
                                                          [classifier.id]: {
                                                            ...prev[classifier.id],
                                                            [param.title]:
                                                              param.type === 'int'
                                                                ? parseInt(e.target.value)
                                                                : param.type === 'float'
                                                                ? parseFloat(e.target.value)
                                                                : e.target.value,
                                                          },
                                                        }))
                                                      }
                                                      style={{
                                                        marginTop: 4,
                                                        width: '100%',
                                                        padding: '6px 10px',
                                                        borderRadius: 4,
                                                        border: '1px solid #ccc',
                                                        backgroundColor: '#f5f5f5',
                                                        pointerEvents: 'none',
                                                      }}
                                                    />
                                                  </Grid>
                                                ))}
                                              </Grid>
                                              {totalPages > 1 && (
                                                <Box
                                                  sx={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    mt: 2,
                                                  }}
                                                >
                                                  <Button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setParamPage((prev) => ({
                                                        ...prev,
                                                        [classifier.id]: Math.max(
                                                          (prev[classifier.id] ?? 0) - 1,
                                                          0
                                                        ),
                                                      }));
                                                    }}
                                                    disabled={currentPage === 0}
                                                    size="small"
                                                  >
                                                    ← Prev
                                                  </Button>
                                                  <Box
                                                    sx={{
                                                      mx: 2,
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                    }}
                                                  >
                                                    Page {currentPage + 1} of {totalPages}
                                                  </Box>
                                                  <Button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setParamPage((prev) => ({
                                                        ...prev,
                                                        [classifier.id]: Math.min(
                                                          currentPage + 1,
                                                          totalPages - 1
                                                        ),
                                                      }));
                                                    }}
                                                    disabled={currentPage >= totalPages - 1}
                                                    size="small"
                                                  >
                                                    Next →
                                                  </Button>
                                                </Box>
                                              )}
                                            </>
                                          );
                                        })()}
                                      </Box>
                                    )}
                                  </Paper>
                                </Grid>
                              ))}
                            </Grid>
                          </FormControl>
                        </Paper>
                      </>
                    )}
                  </Box>
                </>
              );
            case 1:
              return (
                <Stack spacing={4}>
                  {analysisLoading ? (
                    <Box
                      sx={{
                        minHeight: 400,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                      }}
                    >
                      <CircularProgress size={48} />
                      <Typography
                        variant="h6"
                        color="text.secondary"
                      >
                        Analyzing dataset with selected classifier...
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        It may take up to 10 minutes, depending on your dataset and classifier
                        choice.
                      </Typography>
                    </Box>
                  ) : analysisError ? (
                    <Alert severity="error">{analysisError}</Alert>
                  ) : (
                    <>
                      <Box>
                        <Typography
                          variant="h5"
                          sx={{ fontWeight: 600 }}
                        >
                          Check bias metrics
                        </Typography>
                      </Box>
                      <Grid
                        container
                        spacing={2}
                      >
                        {analysisData.map((section, index) => (
                          <Grid
                            key={index}
                            xs={6}
                          >
                            <Card
                              sx={{
                                border: '1px solid transparent',
                                borderColor: 'divider',
                                borderRadius: 2,
                                py: 3,
                                px: 2,
                              }}
                            >
                              <Typography
                                variant="h6"
                                sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}
                              >
                                {
                                  selectedDatasets.find((ds) => ds.slug === section.datasetName)
                                    ?.name
                                }
                              </Typography>
                              <Stack spacing={3}>
                                <Box>
                                  <Grid
                                    container
                                    spacing={2}
                                  >
                                    <Grid
                                      xs={12}
                                      sm={12}
                                    >
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ fontWeight: 600 }}
                                      >
                                        Protected Attribute: {section.protectedAttribute}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        <strong>Classifier: </strong> {section.classifierName}
                                      </Typography>
                                    </Grid>
                                  </Grid>

                                  <Grid
                                    container
                                    spacing={2}
                                  >
                                    <Grid
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
                                      xs={12}
                                      sm={6}
                                    >
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        <strong>Unprivileged Group:</strong>{' '}
                                        {section.unprivilegedGroup}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                </Box>

                                <Alert
                                  severity="info"
                                  icon={<ErrorOutline />}
                                  sx={{
                                    borderRadius: 2,
                                    '& .MuiAlert-icon': {
                                      alignItems: 'center',
                                    },
                                  }}
                                >
                                  <Typography variant="body2">
                                    Model Accuracy: {section.accuracy.toFixed(1)}%
                                  </Typography>
                                </Alert>

                                <Grid
                                  container
                                  spacing={3}
                                >
                                  <Grid xs={12}>
                                    <MetricRadarChart metrics={section.metrics} />
                                  </Grid>
                                </Grid>
                              </Stack>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </>
                  )}
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

                  {loading ? (
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      minHeight="200px"
                    >
                      <CircularProgress />
                    </Box>
                  ) : error ? (
                    <Alert
                      severity="error"
                      sx={{ mb: 2 }}
                    >
                      {error}
                    </Alert>
                  ) : (
                    <FormControl>
                      <Stack spacing={2}>
                        {mitigations.map((mitigation) => (
                          <Paper
                            key={mitigation.id}
                            elevation={0}
                            onClick={() => handleMitigationSelect(mitigation.name)}
                            sx={{
                              p: 3,
                              borderRadius: 2,
                              bgcolor: 'background.default',
                              border: '1px solid',
                              borderColor: selectedMitigations.includes(mitigation.name)
                                ? 'primary.main'
                                : 'divider',
                              transition: 'all 0.3s ease-in-out',
                              cursor: 'pointer',
                              '&:hover': {
                                borderColor: 'primary.main',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              },
                            }}
                          >
                            <Box sx={{ ml: 1 }}>
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={2}
                                sx={{ width: '100%' }}
                              >
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      fontWeight: selectedMitigations.includes(mitigation.name)
                                        ? 600
                                        : 500,
                                      mb: 1,
                                      color: selectedMitigations.includes(mitigation.name)
                                        ? 'primary.main'
                                        : 'text.primary',
                                    }}
                                  >
                                    {mitigation.name}
                                  </Typography>
                                  <Typography color="text.secondary">
                                    {mitigation.description}
                                  </Typography>
                                </Box>
                                {selectedMitigations.includes(mitigation.name) && (
                                  <CheckCircleOutline
                                    sx={{
                                      color: 'primary.main',
                                      fontSize: 24,
                                    }}
                                  />
                                )}
                              </Stack>
                              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                <Chip
                                  label={mitigation.type}
                                  size="small"
                                  color={
                                    selectedMitigations.includes(mitigation.name)
                                      ? 'primary'
                                      : 'default'
                                  }
                                  sx={{ fontWeight: 500 }}
                                />
                                <Link
                                  href={mitigation.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  sx={{ textDecoration: 'none' }}
                                >
                                  <Chip
                                    label="View Implementation"
                                    size="small"
                                    color={
                                      selectedMitigations.includes(mitigation.name)
                                        ? 'primary'
                                        : 'default'
                                    }
                                    variant="outlined"
                                    clickable
                                    sx={{ fontWeight: 500 }}
                                  />
                                </Link>
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    </FormControl>
                  )}
                </Stack>
              );
            case 3:
              return (
                <Stack spacing={4}>
                  <Box>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 600 }}
                    >
                      Review Mitigation Results
                    </Typography>
                  </Box>

                  {analysisLoading ? (
                    <Box
                      sx={{
                        minHeight: 400,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                      }}
                    >
                      <CircularProgress size={48} />
                      <Typography
                        variant="h6"
                        color="text.secondary"
                      >
                        Applying mitigation and analyzing results...
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        It may take up to 10 minutes, depending on your dataset and classifier
                        choice.
                      </Typography>
                    </Box>
                  ) : analysisError ? (
                    <Alert severity="error">{analysisError}</Alert>
                  ) : (
                    <>
                      {(selectedDatasets.length > 1 ||
                        selectedClassifiers.length > 1 ||
                        selectedMitigations.length > 1) && (
                        <Alert
                          severity="info"
                          sx={{ mb: 2 }}
                        >
                          The Deep Dive step requires exactly one dataset, one classifier, and one
                          mitigation to be selected. Please go back and adjust your selections before
                          continuing.
                        </Alert>
                      )}
                      <Grid
                        container
                        spacing={2}
                      >
                        {analysisData.map((section, index) => (
                          <Grid
                            xs={6}
                            key={index}
                          >
                            <Card
                              sx={{
                                border: '1px solid transparent',
                                borderColor: 'divider',
                                borderRadius: 2,
                                py: 3,
                                px: 2,
                              }}
                            >
                              <Stack spacing={3}>
                                <Box>
                                  <Typography
                                    variant="h6"
                                    sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}
                                  >
                                    {
                                      selectedDatasets.find((ds) => ds.slug === section.datasetName)
                                        ?.name
                                    }{' '}
                                    <Chip
                                      size="small"
                                      sx={{ ml: 1 }}
                                      label={section.methodName}
                                    />
                                  </Typography>

                                  <Grid
                                    container
                                    spacing={2}
                                  >
                                    <Grid
                                      xs={12}
                                      sm={6}
                                    >
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{ fontWeight: 600 }}
                                      >
                                        Protected Attribute: {section.protectedAttribute}
                                      </Typography>
                                    </Grid>
                                    <Grid
                                      xs={12}
                                      sm={6}
                                    >
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                        sx={{
                                          overflow: 'hidden',
                                          whiteSpace: 'nowrap',
                                          textOverflow: 'ellipsis',
                                          width: '100%',
                                        }}
                                      >
                                        <strong>Classifier: </strong> {section.classifierName}
                                      </Typography>
                                    </Grid>

                                    <Grid
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
                                      xs={12}
                                      sm={6}
                                    >
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        <strong>Unprivileged Group:</strong>{' '}
                                        {section.unprivilegedGroup}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                </Box>

                                {section.mitigatedAccuracy && (
                                  <Alert
                                    severity={
                                      section.mitigatedAccuracy >= section.accuracy
                                        ? 'success'
                                        : 'warning'
                                    }
                                    icon={<ErrorOutline />}
                                    sx={{
                                      borderRadius: 2,
                                      '& .MuiAlert-icon': {
                                        alignItems: 'center',
                                      },
                                    }}
                                  >
                                    <Stack spacing={1}>
                                      <Typography variant="body2">
                                        Original Accuracy: {section.accuracy.toFixed(1)}%
                                      </Typography>
                                      <Typography variant="body2">
                                        Accuracy after mitigation:{' '}
                                        {section.mitigatedAccuracy.toFixed(1)}%{' '}
                                        <Typography
                                          component="span"
                                          color={
                                            section.mitigatedAccuracy >= section.accuracy
                                              ? 'success.main'
                                              : 'warning.main'
                                          }
                                          sx={{ fontWeight: 500 }}
                                        >
                                          (
                                          {section.mitigatedAccuracy >= section.accuracy ? '+' : ''}
                                          {(section.mitigatedAccuracy - section.accuracy).toFixed(
                                            1
                                          )}
                                          %)
                                        </Typography>
                                      </Typography>
                                      {section.biasedMetricsCount !== undefined &&
                                        section.totalMetrics !== undefined && (
                                          <Typography variant="body2">
                                            With mitigation applied, bias detected in{' '}
                                            <strong>
                                              {section.biasedMetricsCount} out of{' '}
                                              {section.totalMetrics}
                                            </strong>{' '}
                                            metrics
                                          </Typography>
                                        )}
                                    </Stack>
                                  </Alert>
                                )}

                                <Grid
                                  container
                                  spacing={3}
                                >
                                  {/* {section.metrics.map((metric, idx) => (
                                <Grid
                                  item
                                  xs={12}
                                  key={idx}
                                >
                                  <Stack spacing={3}>
                                    <Grid
                                      container
                                      spacing={3}
                                    >
                                      <Grid
                                        item
                                        xs={12}
                                        md={6}
                                      >
                                        <MetricChart metric={metric} />
                                      </Grid>
                                      <Grid
                                        item
                                        xs={12}
                                        md={6}
                                      >
                                        <MetricLineChart metric={metric} />
                                      </Grid>
                                    </Grid>
                                  </Stack>
                                </Grid>
                              ))} */}
                                  <Grid xs={12}>
                                    <MetricRadarChart metrics={section.metrics} />
                                  </Grid>
                                </Grid>
                              </Stack>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </>
                  )}
                </Stack>
              );
            case 4:
              return (
                <Box>
                  {/* Context info chips */}
                  {beespectorContextInfo && (
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}
                    >
                      {selectedDatasets[0] && (
                        <Chip
                          label={`Dataset: ${selectedDatasets[0].name}`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      )}
                      {selectedClassifiers[0] && (
                        <Chip
                          label={`Classifier: ${selectedClassifiers[0].name}`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      )}
                      {selectedMitigations[0] && (
                        <Chip
                          label={`Mitigation: ${selectedMitigations[0]}`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      )}
                    </Stack>
                  )}

                  {isInitializingBeespector ? (
                    <Box
                      sx={{
                        minHeight: 400,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                        textAlign: 'center',
                      }}
                    >
                      <CircularProgress size={48} />
                      <Typography
                        variant="h6"
                        color="text.secondary"
                      >
                        Initializing Deep Dive…
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        Training the model with your selections. This may take up to a minute.
                      </Typography>
                    </Box>
                  ) : beespectorInitError ? (
                    <Box sx={{ py: 2 }}>
                      <Alert
                        severity="error"
                        sx={{ mb: 2 }}
                      >
                        {beespectorInitError}
                      </Alert>
                      <Button
                        variant="outlined"
                        onClick={initializeBeespector}
                      >
                        Retry
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <BeespectorNavbar
                        activeTab={beespectorActiveTab}
                        onChangeTab={setBeespectorActiveTab}
                        tabs={[
                          { id: 'performance', label: 'Performance & Fairness' },
                          { id: 'datapoint', label: 'Datapoint Editor' },
                        ]}
                      />
                      <Box sx={{ mt: 3, minHeight: 600 }}>
                        {beespectorActiveTab === 'performance' && <PerformanceFairness />}
                        {beespectorActiveTab === 'datapoint' && <DatapointEditor />}
                      </Box>
                    </>
                  )}
                </Box>
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
              {activeStep === steps.length - 1 ? null : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={
                    (activeStep === 0 &&
                      (selectedDatasets.length === 0 || selectedClassifiers.length === 0)) ||
                    (activeStep === 2 && selectedMitigations.length === 0) ||
                    (activeStep === 3 &&
                      (selectedDatasets.length !== 1 ||
                        selectedClassifiers.length !== 1 ||
                        selectedMitigations.length !== 1))
                  }
                  size="large"
                >
                  Next
                </Button>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
};
Page.getLayout = (page) => <MarketingLayout>{page}</MarketingLayout>;

export default Page;
