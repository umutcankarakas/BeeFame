import React, { useState, useEffect } from 'react';
import {
  Box, Stepper, Step, StepLabel, Card, CardContent, Typography, Button,
  Paper, Container, CardActionArea, Chip, Link, Stack, Alert, FormControl,
  TextField, CircularProgress, Accordion, AccordionSummary, AccordionDetails,
  Tabs, Tab, Checkbox, FormControlLabel, FormGroup,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import {
  ScienceOutlined, DatasetOutlined, CheckCircleOutline, ErrorOutline,
  ExpandMore as ExpandMoreIcon, WarningAmberOutlined,
} from '@mui/icons-material';
import {
  Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
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

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface SensitiveFeature { name: string; unprivileged: string; privileged: string; }
interface Dataset { id: number; name: string; slug: string; url: string; instances: number; description: string; sensitive_features: SensitiveFeature[]; }
interface Classifier { id: number; name: string; url: string; params: { title: string; type: 'int' | 'float' | 'str' | 'bool'; default?: number | string | boolean; }[]; }
interface BiasMetric { name: string; value: number; mitigatedValue?: number; }

interface PerGroupMetric {
  SPD: number;
  EOD: number;
  AOD: number;
  DI: number;
  Theil: number;
  FPR_div: number | null;
  FNR_div: number | null;
  PPV: number | null;
  tpr: number | null;
  fpr: number | null;
  'Subgroup AUC': number | null;
  'BPSN AUC': number | null;
  'BNSP AUC': number | null;
  'Pinned AUC': number | null;
  accuracy: number | null;
}

interface BiasAnalysis {
  'Method Name': string; Classifier: string; Dataset: string; 'Dataset Name': string;
  'Sensitive Column': string; 'Model Accuracy': number;
  'Statistical Parity Difference': number | null; 'Equal Opportunity Difference': number | null;
  'Average Odds Difference': number | null; 'Disparate Impact': number | null; 'Theil Index': number | null;
  'Is Subgroup': boolean;
  'Per Group Metrics': Record<string, PerGroupMetric> | null;
  'Fairness Index': number | null;
  'Subgroup AUC': Record<string, number | null> | null;
  'BPSN AUC': Record<string, number | null> | null;
  'BNSP AUC': Record<string, number | null> | null;
  'Pinned AUC': Record<string, number | null> | null;
  'GMean AUC': number | null;
  'Equalized Odds Gap': Record<string, number | null> | null;
  'Predictive Parity Difference': Record<string, number | null> | null;
}

interface PerGroupSection {
  groupLabel: string;
  pairLabel: string;
  subgroupAccuracy: number | null;
  fprDiv: number | null;
  fnrDiv: number | null;
  ppv: number | null;
  metrics: BiasMetric[];
  subgroupAUC: number | null;
  bpsnAUC: number | null;
  bnspAUC: number | null;
  pinnedAUC: number | null;
  tpr?: number | null;
  fpr?: number | null;
  // mitigated counterparts — only set after mitigation step
  mitigatedSubgroupAccuracy?: number | null;
  mitigatedFprDiv?: number | null;
  mitigatedFnrDiv?: number | null;
  mitigatedPpv?: number | null;
  mitigatedSubgroupAUC?: number | null;
  mitigatedBpsnAUC?: number | null;
  mitigatedBnspAUC?: number | null;
  mitigatedPinnedAUC?: number | null;
  mitigatedTpr?: number | null;
  mitigatedFpr?: number | null;
}

interface BiasSection {
  datasetName?: string; methodName?: string; protectedAttribute: string;
  classifierName?: string;
  accuracy: number; mitigatedAccuracy?: number; metrics: BiasMetric[];
  biasedMetricsCount?: number; totalMetrics?: number; isSubgroup?: boolean;
  perGroupSections?: PerGroupSection[];
  subgroupAUC?: Record<string, number | null>;
  bpsnAUC?: Record<string, number | null>;
  bnspAUC?: Record<string, number | null>;
  pinnedAUC?: Record<string, number | null>;
  gmeanAUC?: number | null;
  equalizedOddsGap?: Record<string, number | null>;
  predictiveParityDiff?: Record<string, number | null>;
  fairnessIndex?: number | null;
}

interface AnalysisResponse { data: BiasAnalysis[]; }
interface Mitigation { id: string; name: string; type: string; url: string; description: string; }
interface SubgroupPair { col1: string; col2: string; col3?: string; label: string; instance_count: number; warning: boolean; privileged_label: string; unprivileged_label: string; }
interface SubgroupPairsResponse { data: { dataset_slug: string; pairs: SubgroupPair[]; }; }

// ─── Radar Chart ─────────────────────────────────────────────────────────────

const MetricRadarChart = ({ metrics, fixedDomain = false, transformNames = true }: { metrics: BiasMetric[]; fixedDomain?: boolean; transformNames?: boolean }) => {
  const data = metrics.map((m) => ({
    name: transformNames ? m.name.replace(/([A-Z])/g, ' $1').trim() : m.name,
    original: Math.abs(m.value).toFixed(3),
    mitigated: m.mitigatedValue !== undefined ? Math.abs(m.mitigatedValue).toFixed(3) : undefined,
  }));
  return (
    <Box sx={{ width: '100%', height: 300, p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', mb: 2, pb: 4 }}>
      <Typography variant="h6" align="center" gutterBottom sx={{ fontWeight: 500 }}>Metrics Overview</Typography>
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={3} justifyContent="center">
          <Typography variant="body2" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#1976d2', mr: 1, opacity: 0.7 }} />Original
          </Typography>
          {metrics.some((m) => m.mitigatedValue !== undefined) && (
            <Typography variant="body2" sx={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2e7d32', mr: 1, opacity: 0.7 }} />Mitigated
            </Typography>
          )}
        </Stack>
      </Box>
      <ResponsiveContainer width="100%" height="85%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid gridType="polygon" />
          <PolarAngleAxis dataKey="name" tick={{ fill: 'text.secondary', fontSize: 12 }} />
          <PolarRadiusAxis angle={90} domain={fixedDomain ? [0, 1] : [0, 'auto']} tick={{ fontSize: 12 }} />
          <Radar name="Original" dataKey="original" stroke="#1976d2" fill="#1976d2" fillOpacity={0.3} />
          {metrics.some((m) => m.mitigatedValue !== undefined) && (
            <Radar name="Mitigated" dataKey="mitigated" stroke="#2e7d32" fill="#2e7d32" fillOpacity={0.3} />
          )}
          <Tooltip contentStyle={{ background: '#fff', border: 'none', borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }} />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  );
};

// ─── Subgroup Card ───────────────────────────────────────────────────────────

const buildSubgroupRadarMetrics = (group: PerGroupSection): BiasMetric[] => [
  ...(group.subgroupAUC != null ? [{ name: 'Subgroup AUC', value: group.subgroupAUC, mitigatedValue: group.mitigatedSubgroupAUC ?? undefined }] : []),
  ...(group.bpsnAUC    != null ? [{ name: 'BPSN AUC',     value: group.bpsnAUC,     mitigatedValue: group.mitigatedBpsnAUC    ?? undefined }] : []),
  ...(group.bnspAUC    != null ? [{ name: 'BNSP AUC',     value: group.bnspAUC,     mitigatedValue: group.mitigatedBnspAUC    ?? undefined }] : []),
  ...(group.pinnedAUC  != null ? [{ name: 'Pinned AUC',   value: group.pinnedAUC,   mitigatedValue: group.mitigatedPinnedAUC  ?? undefined }] : []),
  ...(group.fprDiv     != null ? [{ name: 'FPR Div',       value: group.fprDiv,     mitigatedValue: group.mitigatedFprDiv     ?? undefined }] : []),
  ...(group.fnrDiv     != null ? [{ name: 'FNR Div',       value: group.fnrDiv,     mitigatedValue: group.mitigatedFnrDiv     ?? undefined }] : []),
  ...(group.ppv        != null ? [{ name: 'PPV',           value: group.ppv,        mitigatedValue: group.mitigatedPpv        ?? undefined }] : []),
];

const PerGroupCard = ({ group, datasetName, classifierName, methodName, accuracy, mitigatedAccuracy }: {
  group: PerGroupSection;
  datasetName?: string;
  classifierName?: string;
  methodName?: string;
  accuracy: number;
  mitigatedAccuracy?: number;
}) => {
  const radarMetrics = buildSubgroupRadarMetrics(group);
  return (
    <Card sx={{ border: '1px solid transparent', borderColor: 'divider', borderRadius: 2, py: 3, px: 2 }}>
      <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
        {datasetName}
        {methodName && <Chip size="small" sx={{ ml: 1 }} label={methodName} />}
        <Chip size="small" label="Subgroup" color="primary" sx={{ ml: 1 }} />
      </Typography>
      <Stack spacing={3}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            Protected Attribute: {group.pairLabel}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Classifier:</strong> {classifierName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Group:</strong> {group.groupLabel}
          </Typography>
        </Box>

        {(() => {
          const baseAcc = group.subgroupAccuracy != null ? group.subgroupAccuracy * 100 : accuracy;
          const mitAcc  = group.mitigatedSubgroupAccuracy != null ? group.mitigatedSubgroupAccuracy * 100
                        : (group.subgroupAccuracy == null && mitigatedAccuracy !== undefined ? mitigatedAccuracy : undefined);
          const label   = group.subgroupAccuracy != null ? 'Group Accuracy' : 'Model Accuracy';
          return (
            <Alert
              severity={mitAcc !== undefined ? (mitAcc >= baseAcc ? 'success' : 'warning') : 'info'}
              icon={<ErrorOutline />}
              sx={{ borderRadius: 2, '& .MuiAlert-icon': { alignItems: 'center' } }}
            >
              {mitAcc !== undefined ? (
                <Stack spacing={1}>
                  <Typography variant="body2">{label}: {baseAcc.toFixed(1)}%</Typography>
                  <Typography variant="body2">
                    {label} after mitigation: {mitAcc.toFixed(1)}%{' '}
                    <Typography component="span" color={mitAcc >= baseAcc ? 'success.main' : 'warning.main'} sx={{ fontWeight: 500 }}>
                      ({mitAcc >= baseAcc ? '+' : ''}{(mitAcc - baseAcc).toFixed(1)}%)
                    </Typography>
                  </Typography>
                </Stack>
              ) : (
                <Typography variant="body2">{label}: {baseAcc.toFixed(1)}%</Typography>
              )}
            </Alert>
          );
        })()}

        {radarMetrics.length > 0
          ? <MetricRadarChart metrics={radarMetrics} fixedDomain transformNames={false} />
          : <MetricRadarChart metrics={group.metrics} />}
      </Stack>
    </Card>
  );
};

const SubgroupCard = ({ section, datasetName }: { section: BiasSection; datasetName?: string }) => {
  if (!section.perGroupSections || section.perGroupSections.length === 0) return null;

  return (
    <>
      {section.fairnessIndex !== undefined && section.fairnessIndex !== null && (
        <Grid xs={12}>
          <Alert severity="info" sx={{ mb: 1 }}>
            <strong>Fairness Index ({section.protectedAttribute}):</strong> {section.fairnessIndex.toFixed(4)}
            <Typography variant="caption" sx={{ ml: 1 }} color="text.secondary">— lower = fairer (Lin 2024)</Typography>
          </Alert>
        </Grid>
      )}
      {section.perGroupSections.map((group, i) => (
        <Grid key={`pg-${i}`} xs={12} md={6}>
          <PerGroupCard
            group={group}
            datasetName={datasetName || section.datasetName}
            classifierName={section.classifierName}
            methodName={section.methodName}
            accuracy={section.accuracy}
            mitigatedAccuracy={section.mitigatedAccuracy}
          />
        </Grid>
      ))}
    </>
  );
};

// ─── Selection Summary ───────────────────────────────────────────────────────

const SelectionSummary = ({ datasets, classifiers, mitigations, activeStep }: { datasets: Dataset[]; classifiers: Classifier[]; mitigations: string[]; activeStep: number; }) => {
  if (activeStep === 0) return null;
  return (
    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
      <Stack spacing={1}>
        {activeStep >= 1 && datasets.length > 0 && classifiers.length > 0 && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DatasetOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Selected Datasets: {datasets.map((d) => d.name).join(', ')}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScienceOutlined sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Selected Classifiers: {classifiers.map((c) => c.name).join(', ')}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleOutline sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Selected Mitigations: {mitigations.length > 0 ? mitigations.join(', ') : 'None'}</Typography>
            </Box>
          </>
        )}
      </Stack>
    </Paper>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Symmetric DI: maps DI ratio to [0,1] where 1 = perfectly fair (DI=1).
// DI < 1 and DI > 1 are both unfair; |DI - 1| measures the deviation.
// Result: 1 - |DI - 1|, clamped to [0, 1].
const symDI = (di: number | null | undefined): number =>
  Math.max(0, 1 - Math.abs(1 - (di ?? 1)));

const toMetrics = (analysis: BiasAnalysis): BiasMetric[] => [
  { name: 'Statistical Parity Difference (1-m)', value: 1 - (analysis['Statistical Parity Difference'] ?? 0) },
  { name: 'Equal Opportunity Difference (1-m)', value: 1 - (analysis['Equal Opportunity Difference'] ?? 0) },
  { name: 'Average Odds Difference (1-m)', value: 1 - (analysis['Average Odds Difference'] ?? 0) },
  { name: 'Disparate Impact', value: symDI(analysis['Disparate Impact']) },
  { name: 'Theil Index (1-m)', value: 1 - (analysis['Theil Index'] ?? 0) },
];

const toPerGroupSections = (
  perGroupMetrics: Record<string, any>,
  pairLabel: string,
): PerGroupSection[] => {
  return Object.entries(perGroupMetrics).map(([groupLabel, gm]) => ({
    groupLabel,
    pairLabel,
    subgroupAccuracy: gm.accuracy ?? null,
    fprDiv: gm.FPR_div ?? null,
    fnrDiv: gm.FNR_div ?? null,
    ppv: gm.PPV ?? null,
    tpr: gm.tpr ?? null,
    fpr: gm.fpr ?? null,
    metrics: [
      { name: 'Statistical Parity Difference (1-m)', value: 1 - (gm.SPD ?? 0) },
      { name: 'Equal Opportunity Difference (1-m)', value: 1 - (gm.EOD ?? 0) },
      { name: 'Average Odds Difference (1-m)', value: 1 - (gm.AOD ?? 0) },
      { name: 'Disparate Impact', value: symDI(gm.DI) },
      { name: 'Theil Index (1-m)', value: 1 - (gm.Theil ?? 0) },
    ],
    subgroupAUC: gm['Subgroup AUC'] ?? null,
    bpsnAUC: gm['BPSN AUC'] ?? null,
    bnspAUC: gm['BNSP AUC'] ?? null,
    pinnedAUC: gm['Pinned AUC'] ?? null,
  }));
};

const toSubgroupSection = (m: BiasAnalysis, pair?: SubgroupPair): BiasSection => ({
  datasetName: m['Dataset Name'] || m['Dataset'],
  methodName: m['Method Name'],
  protectedAttribute: m['Sensitive Column'],
  classifierName: m['Classifier'] || (m as any)['Model Name'],
  accuracy: m['Model Accuracy'] * 100,
  metrics: toMetrics(m),
  isSubgroup: true,
  perGroupSections: m['Per Group Metrics'] ? toPerGroupSections(
    m['Per Group Metrics'],
    m['Sensitive Column'] ?? '',
  ) : undefined,
  subgroupAUC: m['Subgroup AUC'] ?? undefined,
  bpsnAUC: m['BPSN AUC'] ?? undefined,
  bnspAUC: m['BNSP AUC'] ?? undefined,
  pinnedAUC: m['Pinned AUC'] ?? undefined,
  gmeanAUC: m['GMean AUC'] ?? undefined,
  equalizedOddsGap: m['Equalized Odds Gap'] ?? undefined,
  predictiveParityDiff: m['Predictive Parity Difference'] ?? undefined,
  fairnessIndex: m['Fairness Index'] ?? undefined,
});

// ─── Page ────────────────────────────────────────────────────────────────────

const Page: NextPage = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([]);
  const [selectedClassifiers, setSelectedClassifiers] = useState<Classifier[]>([]);
  const [selectedMitigations, setSelectedMitigations] = useState<string[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [classifiers, setClassifiers] = useState<Classifier[]>([]);
  const [mitigations, setMitigations] = useState<Mitigation[]>([]);
  const [mitigationTab, setMitigationTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<BiasSection[]>([]);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [testSize, setTestSize] = useState(0.2);
  const [classifierParams, setClassifierParams] = useState<{ [id: number]: { [p: string]: any } }>({});
  const [paramPage, setParamPage] = useState<Record<number, number>>({});

  const [availableSubgroupPairs, setAvailableSubgroupPairs] = useState<SubgroupPair[]>([]);
  const [selectedSubgroupPairs, setSelectedSubgroupPairs] = useState<SubgroupPair[]>([]);
  const [subgroupPairsLoading, setSubgroupPairsLoading] = useState(false);

  const [featureAccordionExpanded, setFeatureAccordionExpanded] = useState(false);
  const [featureAccordionDatasetIdx, setFeatureAccordionDatasetIdx] = useState(0);

  const [selectedTargetGroup, setSelectedTargetGroup] = useState<{
    groupLabel: string; pairLabel: string; col1: string; col2: string; col3?: string;
  } | null>(null);

  // All subgroup groups available as mitigation targets (user selects any).
  const mitigationTargetGroups = analysisData
    .filter((s) => s.isSubgroup)
    .flatMap((s) => {
      const pair = selectedSubgroupPairs.find((p) => p.label === s.protectedAttribute);
      if (!pair) return [];
      return (s.perGroupSections ?? [])
        .map((g) => ({ groupLabel: g.groupLabel, pairLabel: s.protectedAttribute, col1: pair.col1, col2: pair.col2, col3: pair.col3 }));
    });

  const [beespectorActiveTab, setBeespectorActiveTab] = useState('performance');
  const [isInitializingBeespector, setIsInitializingBeespector] = useState(false);
  const [beespectorInitError, setBeespectorInitError] = useState<string | null>(null);
  const [beespectorContextInfo, setBeespectorContextInfo] = useState<any>(null);

  const { setSelectedDatasets: setCtxDatasets, setSelectedClassifiers: setCtxClassifiers, setSelectedMitigations: setCtxMitigations, setAnalysisData: setCtxAnalysis, setClassifierParams: setCtxParams } = useBeeFame();

  useEffect(() => {
    if (activeStep === 4) { setBeespectorActiveTab('performance'); initializeBeespector(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);

  const initializeBeespector = async () => {
    if (!selectedDatasets.length || !selectedClassifiers.length) return;
    setIsInitializingBeespector(true); setBeespectorInitError(null); setBeespectorContextInfo(null);
    try {
      const ds = selectedDatasets[0]; const cl = selectedClassifiers[0];
      const mitigation = selectedMitigations[0] || 'None';
      let sfName = ds.sensitive_features[0].name.toLowerCase();
      if (sfName === 'gender') sfName = 'sex';
      const clSlug = cl.name.toLowerCase().replace(/\s+/g, '_').replace('_(svc)', '').replace('_classifier', '');
      const res = await beespectorApi.post('/initialize_context', { dataset_name: ds.slug, base_classifier: clSlug, classifier_params: classifierParams[cl.id] || {}, mitigation_method: mitigation.toLowerCase().replace(/\s+/g, '_'), sensitive_feature: sfName });
      setBeespectorContextInfo(res.data);
    } catch (e: any) { setBeespectorInitError(e.response?.data?.detail || e.message || 'Unknown error'); }
    finally { setIsInitializingBeespector(false); }
  };

  useEffect(() => {
    setFeatureAccordionDatasetIdx(0);
    if (selectedDatasets.length === 1) { fetchSubgroupPairs(selectedDatasets[0].slug); }
    else { setAvailableSubgroupPairs([]); setSelectedSubgroupPairs([]); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDatasets.length, selectedDatasets[0]?.slug]);

  const fetchSubgroupPairs = async (slug: string) => {
    setSubgroupPairsLoading(true);
    try {
      const res = await api.get<SubgroupPairsResponse>(`/datasets/${slug}/subgroup-pairs`);
      setAvailableSubgroupPairs(res.data.data.pairs);
      setSelectedSubgroupPairs([]);
    } catch { setAvailableSubgroupPairs([]); }
    finally { setSubgroupPairsLoading(false); }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const [dr, cr, mr] = await Promise.all([api.get('/datasets'), api.get('/classifiers'), api.get('/methods')]);
        setDatasets(dr.data.data); setClassifiers(cr.data.data); setMitigations(mr.data.data); setError(null);
      } catch { setError('Failed to fetch data. Please try again later.'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const steps = ['Select Dataset & Classifier', 'Check Bias Metrics', 'Select Mitigation', 'Review Results', 'Deep Dive'];

  const subgroupPairsPayload = selectedSubgroupPairs.length > 0
    ? selectedSubgroupPairs.map((p) => ({ col1: p.col1, col2: p.col2, col3: p.col3 ?? null, label: p.label }))
    : null;

  const handleNext = async () => {
    if (activeStep === 0 && selectedDatasets.length > 0 && selectedClassifiers.length > 0) {
      setActiveStep((s) => s + 1); setAnalysisLoading(true); setAnalysisError(null);
      try {
        const res = await api.post<AnalysisResponse>('/analysis', {
          dataset_names: selectedDatasets.map((d) => d.slug),
          classifiers: selectedClassifiers.map((c) => ({ name: c.name, params: classifierParams[c.id] || {} })),
          test_size: testSize,
          subgroup_pairs: subgroupPairsPayload,
        });

        const transformed: BiasSection[] = res.data.data.map((a) => {
          if (a['Is Subgroup']) {
            const pair = selectedSubgroupPairs.find((p) => p.label === a['Sensitive Column']);
            return toSubgroupSection(a, pair);
          }
          const sf = selectedDatasets.find((d) => d.sensitive_features.some((f) => f.name === a['Sensitive Column']))?.sensitive_features.find((f) => f.name === a['Sensitive Column']);
          return {
            datasetName: a?.Dataset, classifierName: a['Classifier'],
            protectedAttribute: a['Sensitive Column'],
            accuracy: a['Model Accuracy'] * 100, metrics: toMetrics(a), isSubgroup: false,
          };
        });
        setAnalysisData(transformed); setCtxAnalysis(transformed);
      } catch { setAnalysisError('Failed to analyze dataset. Please try again.'); }
      finally { setAnalysisLoading(false); }

    } else if (activeStep === 2 && selectedMitigations.length > 0) {
      setActiveStep((s) => s + 1); setAnalysisLoading(true); setAnalysisError(null);
      try {
        const res = await api.post<AnalysisResponse>('/evaluation', {
          dataset_names: selectedDatasets.map((d) => d.slug),
          classifier_names: selectedClassifiers.map((c) => c.name),
          method_names: selectedMitigations,
          test_size: testSize,
          subgroup_pairs: subgroupPairsPayload,
          target_subgroup: selectedTargetGroup
            ? { col1: selectedTargetGroup.col1, col2: selectedTargetGroup.col2, col3: selectedTargetGroup.col3 ?? null, group_label: selectedTargetGroup.groupLabel }
            : null,
        });

        const newData = res.data.data;

        // Baseline subgroup sections from Step 1
        const baselineSubgroups = analysisData.filter((s) => s.isSubgroup);

        // Normal sections — merge mitigated values
        const nonSubgroupBaseline = analysisData.filter((s) => !s.isSubgroup);
        const updated = nonSubgroupBaseline.flatMap((entry) => {
          const related = newData.filter(
            (m: any) => m['Dataset Name'] === entry.datasetName && m['Sensitive Column'] === entry.protectedAttribute && m['Model Name'] === entry.classifierName && !m['Is Subgroup']
          );
          return related.map((m) => {
            const mv: Record<string, number> = {
              'Statistical Parity Difference (1-m)': 1 - (m['Statistical Parity Difference'] ?? 0),
              'Equal Opportunity Difference (1-m)': 1 - (m['Equal Opportunity Difference'] ?? 0),
              'Average Odds Difference (1-m)': 1 - (m['Average Odds Difference'] ?? 0),
              'Disparate Impact': symDI(m['Disparate Impact']),
              'Theil Index (1-m)': 1 - (m['Theil Index'] ?? 0),
            };
            return { ...entry, methodName: m['Method Name'], mitigatedAccuracy: m['Model Accuracy'] * 100, isSubgroup: false, metrics: entry.metrics.map((mt) => ({ ...mt, mitigatedValue: mv[mt.name] })) };
          });
        });

        // Subgroup sections — merge mitigated per-group values into baseline
        const mitigatedSubgroups: BiasSection[] = newData
          .filter((m: any) => m['Is Subgroup'])
          .map((m: any) => {
            const pair3 = selectedSubgroupPairs.find((p) => p.label === m['Sensitive Column']);
            const baseline = baselineSubgroups.find(
              (b) => b.protectedAttribute === m['Sensitive Column'] && b.classifierName === m['Model Name']
            );

            // Per Group Metrics'i mitigated değerlerle merge et
            const mitigatedPerGroup = m['Per Group Metrics'] ?? {};
            const mergedPerGroupSections: PerGroupSection[] = baseline?.perGroupSections
              ? baseline.perGroupSections.map((baseGroup) => {
                  const mitigatedGroup = mitigatedPerGroup[baseGroup.groupLabel];
                  if (!mitigatedGroup) return baseGroup;
                  const mitigatedMetrics: BiasMetric[] = [
                    { name: 'Statistical Parity Difference (1-m)', value: 1 - (mitigatedGroup.SPD ?? 0) },
                    { name: 'Equal Opportunity Difference (1-m)', value: 1 - (mitigatedGroup.EOD ?? 0) },
                    { name: 'Average Odds Difference (1-m)', value: 1 - (mitigatedGroup.AOD ?? 0) },
                    { name: 'Disparate Impact', value: symDI(mitigatedGroup.DI) },
                    { name: 'Theil Index (1-m)', value: 1 - (mitigatedGroup.Theil ?? 0) },
                  ];
                  return {
                    ...baseGroup,
                    // preserve base fprDiv/fnrDiv/ppv; store mitigated separately
                    mitigatedFprDiv: mitigatedGroup.FPR_div ?? null,
                    mitigatedSubgroupAccuracy: mitigatedGroup.accuracy ?? null,
                    mitigatedFnrDiv: mitigatedGroup.FNR_div ?? null,
                    mitigatedPpv: mitigatedGroup.PPV ?? null,
                    mitigatedTpr: mitigatedGroup.tpr ?? null,
                    mitigatedFpr: mitigatedGroup.fpr ?? null,
                    mitigatedSubgroupAUC: mitigatedGroup['Subgroup AUC'] ?? null,
                    mitigatedBpsnAUC: mitigatedGroup['BPSN AUC'] ?? null,
                    mitigatedBnspAUC: mitigatedGroup['BNSP AUC'] ?? null,
                    mitigatedPinnedAUC: mitigatedGroup['Pinned AUC'] ?? null,
                    metrics: baseGroup.metrics.map((bm) => ({
                      ...bm,
                      mitigatedValue: mitigatedMetrics.find((mm) => mm.name === bm.name)?.value,
                    })),
                  };
                })
              : toPerGroupSections(mitigatedPerGroup, m['Sensitive Column'] ?? '');

            const mitigatedSection = toSubgroupSection(m, pair3);
            return {
              ...mitigatedSection,
              // Bug fix: use the baseline accuracy as the "before" value
              accuracy: baseline?.accuracy ?? mitigatedSection.accuracy,
              methodName: m['Method Name'],
              mitigatedAccuracy: m['Model Accuracy'] * 100,
              perGroupSections: mergedPerGroupSections,
              metrics: baseline?.metrics ?? toMetrics(m),
            };
          });

        setAnalysisData([...updated, ...mitigatedSubgroups]);
        setCtxAnalysis([...updated, ...mitigatedSubgroups]);
      } catch { setAnalysisError('Failed to apply mitigation. Please try again.'); }
      finally { setAnalysisLoading(false); }

    } else { setActiveStep((s) => s + 1); }
  };

  const handleBack = () => {
    setActiveStep((s) => s - 1);
    if (activeStep === 1) { setSelectedDatasets([]); setSelectedClassifiers([]); }
    if (activeStep === 3) { setSelectedMitigations([]); setSelectedTargetGroup(null); }
  };

  const handleDatasetSelect = (dataset: Dataset) => {
    setSelectedDatasets((prev) => { const n = prev.some((d) => d.id === dataset.id) ? prev.filter((d) => d.id !== dataset.id) : [...prev, dataset]; setCtxDatasets(n); return n; });
  };
  const handleClassifierSelect = (classifier: Classifier) => {
    const sel = selectedClassifiers.some((c) => c.id === classifier.id);
    if (sel) {
      setSelectedClassifiers((p) => { const n = p.filter((c) => c.id !== classifier.id); setCtxClassifiers(n); return n; });
      setClassifierParams((p) => { const u = { ...p }; delete u[classifier.id]; setCtxParams(u); return u; });
    } else {
      setSelectedClassifiers((p) => { const n = [...p, classifier]; setCtxClassifiers(n); return n; });
      setClassifierParams((p) => { const u = { ...p, [classifier.id]: Object.fromEntries(classifier.params.map((pr) => [pr.title, pr.default ?? ''])) }; setCtxParams(u); return u; });
    }
  };
  const handleMitigationSelect = (m: string) => {
    setSelectedMitigations((prev) => { const n = prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]; setCtxMitigations(n); return n; });
  };
  const handleSubgroupPairToggle = (pair: SubgroupPair) => {
    setSelectedSubgroupPairs((prev) =>
      prev.some((p) => p.label === pair.label)
        ? prev.filter((p) => p.label !== pair.label)
        : [...prev, pair]
    );
  };

  const renderStepContent = (step: number) => (
    <>
      <SelectionSummary datasets={selectedDatasets} classifiers={selectedClassifiers} mitigations={selectedMitigations} activeStep={activeStep} />
      {(() => {
        switch (step) {
          case 0: return (
            <Box sx={{ mt: 4 }}>
              {loading ? (
                <Box sx={{ minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <CircularProgress size={48} />
                  <Typography variant="h6" color="text.secondary">Loading available datasets and classifiers...</Typography>
                </Box>
              ) : error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : (
                <>
                  <Alert icon={<ErrorOutline />} severity="info" sx={{ mb: 2 }}>
                    In test scenarios where default parameters are employed, the results are retrieved from a precomputed cache to ensure consistency and reduce computation time.
                  </Alert>

                  {/* Dataset */}
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>Select Dataset</Typography>
                  <Grid container spacing={3}>
                    {datasets.map((dataset) => (
                      <Grid xs={12} md={6} key={dataset.id}>
                        <Card sx={{ height: '100%', cursor: 'pointer', borderWidth: 2, borderStyle: 'solid', borderColor: selectedDatasets.some((d) => d.id === dataset.id) ? 'primary.main' : 'transparent', position: 'relative' }}>
                          {selectedDatasets.some((d) => d.id === dataset.id) && <CheckCircleOutline sx={{ position: 'absolute', top: 12, right: 12, color: 'primary.main', fontSize: 24 }} />}
                          <CardActionArea onClick={() => handleDatasetSelect(dataset)} sx={{ height: '100%', alignItems: 'flex-start', '& .MuiCardContent-root': { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' } }}>
                            <CardContent>
                              <Typography variant="h6" component="div" gutterBottom>{dataset.name}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{dataset.description}</Typography>
                              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                <Chip icon={<DatasetOutlined />} label={`${dataset.instances} instances`} size="small" />
                                <Link href={dataset.url} target="_blank" rel="noopener noreferrer" sx={{ textDecoration: 'none' }}>
                                  <Chip label="View Dataset" size="small" color="primary" variant="outlined" clickable />
                                </Link>
                              </Stack>
                              <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>Sensitive Features:</Typography>
                              {dataset.sensitive_features.map((f, i) => (
                                <Box key={i} sx={{ mb: 1.5 }}>
                                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{f.name}</Typography>
                                  <Stack direction="row" spacing={1} flexWrap="wrap">
                                    <Chip label={f.unprivileged} size="small" variant="outlined" />
                                    <Chip label={f.privileged} size="small" variant="outlined" />
                                  </Stack>
                                </Box>
                              ))}
                            </CardContent>
                          </CardActionArea>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  {/* Feature Accordion */}
                  {selectedDatasets.length > 0 && (
                    <Accordion expanded={featureAccordionExpanded} onChange={(_, e) => setFeatureAccordionExpanded(e)} sx={{ mt: 3, mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2, '&:before': { display: 'none' } }} elevation={0}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ fontWeight: 600 }}>Dataset Feature Overview{selectedDatasets.length === 1 ? ` — ${selectedDatasets[0].name}` : ` (${selectedDatasets.length} datasets)`}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {featureAccordionExpanded && (
                          <>
                            {selectedDatasets.length > 1 && (
                              <Tabs value={featureAccordionDatasetIdx} onChange={(_, v) => setFeatureAccordionDatasetIdx(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                                {selectedDatasets.map((ds, i) => <Tab key={ds.id} label={ds.name} value={i} />)}
                              </Tabs>
                            )}
                            <DatasetFeaturesPreview datasetSlug={selectedDatasets[featureAccordionDatasetIdx]?.slug || selectedDatasets[0].slug} />
                          </>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Test size */}
                  <Typography variant="h6" sx={{ mb: 2, mt: 4, fontWeight: 600, color: 'primary.main' }}>Select Test/Train Split Ratio</Typography>
                  <Paper sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}>
                    <FormControl sx={{ width: '100%' }}>
                      <TextField label="Test size" type="number" value={testSize} onChange={(e) => { const v = Number(e.target.value); if (!Number.isNaN(v)) setTestSize(v); }} inputProps={{ min: 0.05, max: 0.95, step: 0.05 }} helperText="Use a value between 0 and 1 (e.g., 0.2 = 20% test, 80% train)." />
                    </FormControl>
                  </Paper>

                  {/* Classifier */}
                  <Typography variant="h6" sx={{ mb: 2, mt: 4, fontWeight: 600, color: 'primary.main' }}>Select Classifier</Typography>
                  <Alert severity="info">All parameters are constant for demo to get faster results.</Alert>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <FormControl sx={{ width: '100%' }}>
                      <Grid container spacing={2}>
                        {classifiers.map((classifier) => (
                          <Grid xs={12} md={6} key={classifier.id}>
                            <Paper elevation={0} onClick={() => handleClassifierSelect(classifier)} sx={{ p: 1.5, borderRadius: 1, border: '1px solid', borderColor: selectedClassifiers.some((c) => c.id === classifier.id) ? 'primary.main' : 'divider', bgcolor: 'background.paper', transition: 'all 0.2s', height: '100%', cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}>
                              <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                                  <ScienceOutlined sx={{ mr: 1, color: selectedClassifiers.some((c) => c.id === classifier.id) ? 'primary.main' : 'text.secondary' }} />
                                  <Typography sx={{ fontWeight: selectedClassifiers.some((c) => c.id === classifier.id) ? 600 : 400, color: selectedClassifiers.some((c) => c.id === classifier.id) ? 'primary.main' : 'text.primary' }}>{classifier.name}</Typography>
                                </Box>
                                <Link href={classifier.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} sx={{ textDecoration: 'none' }}>
                                  <Chip label="Documentation" size="small" variant="outlined" color={selectedClassifiers.some((c) => c.id === classifier.id) ? 'primary' : 'default'} sx={{ height: 24, '&:hover': { bgcolor: 'primary.main', color: 'white', '& .MuiChip-label': { color: 'white' } } }} />
                                </Link>
                                {selectedClassifiers.some((c) => c.id === classifier.id) && <CheckCircleOutline sx={{ color: 'primary.main', fontSize: 20 }} />}
                              </Stack>
                              {selectedClassifiers.some((c) => c.id === classifier.id) && (
                                <Box sx={{ mt: 2, ml: 4 }}>
                                  {(() => {
                                    const cp = paramPage[classifier.id] ?? 0;
                                    const pp = classifier.params.slice(cp * 4, cp * 4 + 4);
                                    const tp = Math.ceil(classifier.params.length / 4);
                                    return (
                                      <>
                                        <Grid container spacing={2}>
                                          {pp.map((param, idx) => (
                                            <Grid xs={12} sm={6} key={param.title + idx}>
                                              <Typography variant="caption" sx={{ fontWeight: 600 }}>{param.title} ({param.type})</Typography>
                                              <input type={param.type === 'int' || param.type === 'float' ? 'number' : 'text'} disabled value={classifierParams[classifier.id]?.[param.title] ?? ''} onClick={(e) => e.stopPropagation()} onChange={(e) => setClassifierParams((prev) => ({ ...prev, [classifier.id]: { ...prev[classifier.id], [param.title]: param.type === 'int' ? parseInt(e.target.value) : param.type === 'float' ? parseFloat(e.target.value) : e.target.value } }))} style={{ marginTop: 4, width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', backgroundColor: '#f5f5f5', pointerEvents: 'none' }} />
                                            </Grid>
                                          ))}
                                        </Grid>
                                        {tp > 1 && (
                                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                            <Button onClick={(e) => { e.stopPropagation(); setParamPage((p) => ({ ...p, [classifier.id]: Math.max((p[classifier.id] ?? 0) - 1, 0) })); }} disabled={cp === 0} size="small">← Prev</Button>
                                            <Box sx={{ mx: 2, display: 'flex', alignItems: 'center' }}>Page {cp + 1} of {tp}</Box>
                                            <Button onClick={(e) => { e.stopPropagation(); setParamPage((p) => ({ ...p, [classifier.id]: Math.min(cp + 1, tp - 1) })); }} disabled={cp >= tp - 1} size="small">Next →</Button>
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

                  {/* Subgroup Pairs */}
                  {selectedDatasets.length === 1 && (
                    <>
                      <Typography variant="h6" sx={{ mb: 2, mt: 4, fontWeight: 600, color: 'primary.main' }}>Subgroup Fairness Analysis</Typography>
                      <Paper sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}>
                        {subgroupPairsLoading ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={20} /><Typography variant="body2" color="text.secondary">Loading subgroup combinations...</Typography></Box>
                        ) : availableSubgroupPairs.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">No subgroup combinations available for this dataset.</Typography>
                        ) : (
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Select intersectional attribute combinations to analyze. Instance count shows the smallest subgroup size.
                            </Typography>
                            <FormGroup>
                              {availableSubgroupPairs.map((pair) => {
                                const checked = selectedSubgroupPairs.some((p) => p.label === pair.label);
                                return (
                                  <FormControlLabel
                                    key={pair.label}
                                    control={<Checkbox checked={checked} onChange={() => handleSubgroupPairToggle(pair)} size="small" />}
                                    label={
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Typography variant="body2">{pair.label}</Typography>
                                        <Chip label={`n=${pair.instance_count}`} size="small" variant="outlined" color={pair.warning ? 'warning' : 'default'} />
                                        {pair.warning && <Stack direction="row" alignItems="center" spacing={0.5}><WarningAmberOutlined sx={{ fontSize: 16, color: 'warning.main' }} /><Typography variant="caption" color="warning.main">Small sample</Typography></Stack>}
                                      </Stack>
                                    }
                                  />
                                );
                              })}
                            </FormGroup>
                            {selectedSubgroupPairs.length > 0 && (
                              <Alert severity="warning" sx={{ mt: 2 }}>Subgroup analysis increases computation time significantly.</Alert>
                            )}
                          </>
                        )}
                      </Paper>
                    </>
                  )}

                </>
              )}
            </Box>
          );

          case 1: return (
            <Stack spacing={4}>
              {analysisLoading ? (
                <Box sx={{ minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <CircularProgress size={48} />
                  <Typography variant="h6" color="text.secondary">Analyzing dataset with selected classifier...</Typography>
                  <Typography variant="body2" color="text.secondary">It may take up to 10 minutes, depending on your dataset and classifier choice.</Typography>
                </Box>
              ) : analysisError ? <Alert severity="error">{analysisError}</Alert> : (
                <>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>Check bias metrics</Typography>
                  <Grid container spacing={2}>
                    {analysisData.filter((s) => !s.isSubgroup).map((section, i) => (
                      <Grid key={i} xs={6}>
                        <Card sx={{ border: '1px solid transparent', borderColor: 'divider', borderRadius: 2, py: 3, px: 2 }}>
                          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>{selectedDatasets.find((ds) => ds.slug === section.datasetName)?.name}</Typography>
                          <Stack spacing={3}>
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Protected Attribute: {section.protectedAttribute}</Typography>
                              <Typography variant="body2" color="text.secondary"><strong>Classifier:</strong> {section.classifierName}</Typography>
                            </Box>
                            <Alert severity="info" icon={<ErrorOutline />} sx={{ borderRadius: 2, '& .MuiAlert-icon': { alignItems: 'center' } }}>
                              <Typography variant="body2">Model Accuracy: {section.accuracy.toFixed(1)}%</Typography>
                            </Alert>
                            <MetricRadarChart metrics={section.metrics} />
                          </Stack>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                  {analysisData.filter((s) => s.isSubgroup).length > 0 && (
                    <>
                      <Typography variant="h6" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>Intersectional Subgroup Analysis</Typography>
                      <Grid container spacing={2}>
                        {analysisData.filter((s) => s.isSubgroup).map((s, i) => (
                          <SubgroupCard key={`sg-${i}`} section={s} datasetName={selectedDatasets.find((ds) => ds.slug === s.datasetName)?.name} />
                        ))}
                      </Grid>
                    </>
                  )}
                </>
              )}
            </Stack>
          );

          case 2: return (
            <Stack spacing={4}>
              <Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>Select Mitigation Strategy</Typography>
                <Typography color="text.secondary" paragraph>Choose a mitigation method to reduce bias in the model</Typography>
              </Box>
              {loading ? <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px"><CircularProgress /></Box>
                : error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                : (
                  <FormControl>
                    <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                      <Tabs value={mitigationTab} onChange={(_, v) => setMitigationTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50', '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' } }}>
                        <Tab label="Preprocessing" /><Tab label="Inprocessing" /><Tab label="Postprocessing" />
                      </Tabs>
                      <Box sx={{ p: 2 }}>
                        {[0, 1, 2].map((ti) => {
                          const types = ['Preprocessing', 'Inprocessing', 'Postprocessing'];
                          if (mitigationTab !== ti) return null;
                          return (
                            <Stack key={ti} spacing={2}>
                              {mitigations.filter((m) => m.type === types[ti]).map((mit) => (
                                <Paper key={mit.id} elevation={0} onClick={() => handleMitigationSelect(mit.name)} sx={{ p: 3, borderRadius: 2, bgcolor: 'background.default', border: '1px solid', borderColor: selectedMitigations.includes(mit.name) ? 'primary.main' : 'divider', transition: 'all 0.3s ease-in-out', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } }}>
                                  <Box sx={{ ml: 1 }}>
                                    <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                                      <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="h6" sx={{ fontWeight: selectedMitigations.includes(mit.name) ? 600 : 500, mb: 1, color: selectedMitigations.includes(mit.name) ? 'primary.main' : 'text.primary' }}>{mit.name}</Typography>
                                        <Typography color="text.secondary">{mit.description}</Typography>
                                      </Box>
                                      {selectedMitigations.includes(mit.name) && <CheckCircleOutline sx={{ color: 'primary.main', fontSize: 24 }} />}
                                    </Stack>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                                      <Chip label={mit.type} size="small" color={selectedMitigations.includes(mit.name) ? 'primary' : 'default'} sx={{ fontWeight: 500 }} />
                                      <Link href={mit.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} sx={{ textDecoration: 'none' }}>
                                        <Chip label="View Implementation" size="small" color={selectedMitigations.includes(mit.name) ? 'primary' : 'default'} variant="outlined" clickable sx={{ fontWeight: 500 }} />
                                      </Link>
                                    </Box>
                                  </Box>
                                </Paper>
                              ))}
                            </Stack>
                          );
                        })}
                      </Box>
                    </Paper>
                  </FormControl>
                )}
              {/* Target group selection — required when subgroups were analyzed */}
              {(() => {
                if (mitigationTargetGroups.length === 0) return null;
                return (
                  <Box>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
                      Select an unprivileged group to analyze
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      Select the intersectional subgroup you want to treat as the unprivileged group.
                      The mitigation algorithm will use a binary sensitive attribute (1&nbsp;=&nbsp;this group,
                      0&nbsp;=&nbsp;all others) to specifically improve fairness for the chosen group —
                      consistent with Kearns et al. (2019).
                    </Typography>
                    <Stack spacing={1.5}>
                      {mitigationTargetGroups.map((g, i) => {
                        const isSelected = selectedTargetGroup?.groupLabel === g.groupLabel && selectedTargetGroup?.pairLabel === g.pairLabel;
                        return (
                          <Paper
                            key={i}
                            elevation={0}
                            onClick={() => setSelectedTargetGroup(g)}
                            sx={{
                              p: 2, borderRadius: 2, border: '1px solid', cursor: 'pointer',
                              borderColor: isSelected ? 'primary.main' : 'divider',
                              bgcolor: isSelected ? 'rgba(25,118,210,0.06)' : 'background.default',
                              transition: 'all 0.2s', '&:hover': { borderColor: 'primary.main' },
                            }}
                          >
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                              <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>{g.groupLabel}</Typography>
                                <Typography variant="caption" color="text.secondary">Pair: {g.pairLabel}</Typography>
                              </Box>
                              {isSelected && <CheckCircleOutline sx={{ color: 'primary.main' }} />}
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                    {!selectedTargetGroup && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        Please select a target subgroup to proceed.
                      </Alert>
                    )}
                  </Box>
                );
              })()}
            </Stack>
          );

          case 3: return (
            <Stack spacing={4}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>Review Mitigation Results</Typography>
              {analysisLoading ? (
                <Box sx={{ minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                  <CircularProgress size={48} />
                  <Typography variant="h6" color="text.secondary">Applying mitigation and analyzing results...</Typography>
                  <Typography variant="body2" color="text.secondary">It may take up to 10 minutes, depending on your dataset and classifier choice.</Typography>
                </Box>
              ) : analysisError ? <Alert severity="error">{analysisError}</Alert> : (
                <>
                  {(selectedDatasets.length > 1 || selectedClassifiers.length > 1 || selectedMitigations.length > 1) && (
                    <Alert severity="info" sx={{ mb: 2 }}>The Deep Dive step requires exactly one dataset, one classifier, and one mitigation to be selected.</Alert>
                  )}
                  <Grid container spacing={2}>
                    {analysisData.filter((s) => !s.isSubgroup).map((section, i) => (
                      <Grid xs={6} key={i}>
                        <Card sx={{ border: '1px solid transparent', borderColor: 'divider', borderRadius: 2, py: 3, px: 2 }}>
                          <Stack spacing={3}>
                            <Box>
                              <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                                {selectedDatasets.find((ds) => ds.slug === section.datasetName)?.name}{' '}
                                <Chip size="small" sx={{ ml: 1 }} label={section.methodName} />
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid xs={12} sm={6}><Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>Protected Attribute: {section.protectedAttribute}</Typography></Grid>
                                <Grid xs={12} sm={6}><Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}><strong>Classifier:</strong> {section.classifierName}</Typography></Grid>
                              </Grid>
                            </Box>
                            {section.mitigatedAccuracy && (
                              <Alert severity={section.mitigatedAccuracy >= section.accuracy ? 'success' : 'warning'} icon={<ErrorOutline />} sx={{ borderRadius: 2, '& .MuiAlert-icon': { alignItems: 'center' } }}>
                                <Stack spacing={1}>
                                  <Typography variant="body2">Original Accuracy: {section.accuracy.toFixed(1)}%</Typography>
                                  <Typography variant="body2">
                                    Accuracy after mitigation: {section.mitigatedAccuracy.toFixed(1)}%{' '}
                                    <Typography component="span" color={section.mitigatedAccuracy >= section.accuracy ? 'success.main' : 'warning.main'} sx={{ fontWeight: 500 }}>
                                      ({section.mitigatedAccuracy >= section.accuracy ? '+' : ''}{(section.mitigatedAccuracy - section.accuracy).toFixed(1)}%)
                                    </Typography>
                                  </Typography>
                                </Stack>
                              </Alert>
                            )}
                            <MetricRadarChart metrics={section.metrics} />
                          </Stack>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  {/* ── Fairness Impossibility Note ─────────────────────────── */}
                  {(() => {
                    const mitigatedSections = analysisData.filter((s) => !s.isSubgroup && s.mitigatedAccuracy !== undefined);
                    if (mitigatedSections.length === 0) return null;
                    const worsenedNames = [...new Set(
                      mitigatedSections.flatMap((s) =>
                        s.metrics
                          .filter((m) => m.mitigatedValue !== undefined && m.mitigatedValue < m.value - 0.005)
                          .map((m) => m.name.replace(/ \([^)]+\)$/, ''))
                      )
                    )];
                    const anyImproved = mitigatedSections.some((s) =>
                      s.metrics.some((m) => m.mitigatedValue !== undefined && m.mitigatedValue > m.value + 0.005)
                    );
                    const hasConflict = worsenedNames.length > 0 && anyImproved;
                    return (
                      <Alert severity={hasConflict ? 'warning' : 'info'} sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          Impossibility of Fairness — Chouldechova (2017); Kleinberg et al. (2016)
                        </Typography>
                        <Typography variant="body2">
                          When base rates differ across groups, demographic parity, equalized odds,
                          and calibration cannot all be satisfied simultaneously. Improving one
                          criterion typically comes at the cost of another.
                          {hasConflict && (
                            <> This is visible in these results: <strong>{worsenedNames.join(', ')}</strong> worsened while other metrics improved.</>
                          )}
                        </Typography>
                      </Alert>
                    );
                  })()}

                  {analysisData.filter((s) => s.isSubgroup).length > 0 && selectedTargetGroup && (
                    <>
                      <Typography variant="h6" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
                        Selected Unprivileged Group: <strong>{selectedTargetGroup.groupLabel}</strong>
                      </Typography>
                      <Grid container spacing={2}>
                        {analysisData
                          .filter((s) => s.isSubgroup && s.protectedAttribute === selectedTargetGroup.pairLabel)
                          .flatMap((s) => {
                            const grp = (s.perGroupSections ?? []).find((g) => g.groupLabel === selectedTargetGroup.groupLabel);
                            if (!grp) return [];
                            return [(
                              <Grid key="sg-target" xs={12} md={6}>
                                <PerGroupCard
                                  group={grp}
                                  datasetName={selectedDatasets.find((ds) => ds.slug === s.datasetName)?.name}
                                  classifierName={s.classifierName}
                                  methodName={s.methodName}
                                  accuracy={s.accuracy}
                                  mitigatedAccuracy={s.mitigatedAccuracy}
                                />
                              </Grid>
                            )];
                          })}
                      </Grid>

                      {/* ── Fairness Spillover Table ─────────────────────────── */}
                      {selectedTargetGroup && (() => {
                        const allGroups = analysisData
                          .filter((s) => s.isSubgroup && s.protectedAttribute === selectedTargetGroup.pairLabel)
                          .flatMap((s) => (s.perGroupSections ?? []).map((g) => ({ ...g, isTargeted: g.groupLabel === selectedTargetGroup.groupLabel })));
                        if (allGroups.length === 0) return null;

                        const targetGroup = allGroups.find((g) => g.isTargeted);

                        // Derive signed (tpr - overall_tpr) and (fpr - overall_fpr) from stored metrics.
                        // EOD = sg_tpr - overall_tpr  →  raw EOD = 1 - metric("Equal Opportunity").value
                        // AOD = (tpr_diff + fpr_diff) / 2  →  fpr_diff = 2*AOD - EOD
                        // tpr gap vs target = EOD_sg - EOD_target  (overall cancels)
                        // fpr gap vs target = fpr_diff_sg - fpr_diff_target
                        const getRawEod = (g: PerGroupSection, mitigated = false): number | null => {
                          const m = g.metrics.find((x) => x.name.includes('Equal Opportunity'));
                          if (!m) return null;
                          const v = mitigated ? m.mitigatedValue : m.value;
                          return v != null ? 1 - v : null;
                        };
                        const getRawAod = (g: PerGroupSection, mitigated = false): number | null => {
                          const m = g.metrics.find((x) => x.name.includes('Average Odds'));
                          if (!m) return null;
                          const v = mitigated ? m.mitigatedValue : m.value;
                          return v != null ? 1 - v : null;
                        };
                        const getFprDiff = (g: PerGroupSection, mitigated = false): number | null => {
                          const eod = getRawEod(g, mitigated);
                          const aod = getRawAod(g, mitigated);
                          return eod != null && aod != null ? 2 * aod - eod : null;
                        };

                        const tEodBefore = getRawEod(targetGroup!);
                        const tEodAfter  = getRawEod(targetGroup!, true);
                        const tFprBefore = getFprDiff(targetGroup!);
                        const tFprAfter  = getFprDiff(targetGroup!, true);

                        const fmtDelta = (before: number | null | undefined, after: number | null | undefined, higherBetter: boolean) => {
                          if (before == null || after == null) return { text: '—', color: 'text.secondary' };
                          const d = after - before;
                          const improved = higherBetter ? d > 0.005 : d < -0.005;
                          const worsened = higherBetter ? d < -0.005 : d > 0.005;
                          return { text: `${d > 0 ? '+' : ''}${d.toFixed(3)}`, color: improved ? 'success.main' : worsened ? 'error.main' : 'text.secondary' };
                        };

                        const TH = ({ children }: { children: React.ReactNode }) => (
                          <Box component="th" sx={{ p: 1.5, textAlign: 'left', fontSize: 12, fontWeight: 600, borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap' }}>
                            {children}
                          </Box>
                        );
                        const TD = ({ children, sx: sxProp = {} }: { children: React.ReactNode; sx?: object }) => (
                          <Box component="td" sx={{ p: 1.5, fontSize: 13, borderBottom: '1px solid', borderColor: 'divider', ...sxProp }}>
                            {children}
                          </Box>
                        );

                        return (
                          <Box sx={{ mt: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>Fairness Spillover Analysis</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Mitigation was optimized for <strong>{selectedTargetGroup.groupLabel}</strong>.
                              Metrics show each group's gap relative to the target group —
                              Kearns et al. (2019) show that targeting one subgroup does not guarantee improvement for others.
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
                              Other groups — TPR Gap = |group TPR − target TPR|, FPR Gap = |group FPR − target FPR|: lower = more equal to target.
                              Target row — shows its own |EOD| and |FPR deviation| vs the overall population: lower = less biased.
                              Group Acc = accuracy computed only on that group's test samples.
                            </Typography>
                            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'auto' }}>
                              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                                <Box component="thead" sx={{ bgcolor: 'grey.50' }}>
                                  <Box component="tr">
                                    <TH>Subgroup</TH>
                                    <TH>TPR Gap Before</TH><TH>TPR Gap After</TH><TH>ΔTPR Gap</TH>
                                    <TH>FPR Gap Before</TH><TH>FPR Gap After</TH><TH>ΔFPR Gap</TH>
                                    <TH>Group Acc Before</TH><TH>Group Acc After</TH><TH>ΔGroup Acc</TH>
                                  </Box>
                                </Box>
                                <Box component="tbody">
                                  {allGroups.map((g, i) => {
                                    const gEodBefore = getRawEod(g);
                                    const gEodAfter  = getRawEod(g, true);
                                    const gFprBefore = getFprDiff(g);
                                    const gFprAfter  = getFprDiff(g, true);

                                    const tprBefore = gEodBefore != null && tEodBefore != null ? Math.abs(gEodBefore - tEodBefore) : null;
                                    const tprAfter  = gEodAfter  != null && tEodAfter  != null ? Math.abs(gEodAfter  - tEodAfter)  : null;
                                    const fprBefore = gFprBefore != null && tFprBefore != null ? Math.abs(gFprBefore - tFprBefore) : null;
                                    const fprAfter  = gFprAfter  != null && tFprAfter  != null ? Math.abs(gFprAfter  - tFprAfter)  : null;

                                    const accBefore = g.subgroupAccuracy != null ? g.subgroupAccuracy * 100 : null;
                                    const accAfter  = g.mitigatedSubgroupAccuracy != null ? g.mitigatedSubgroupAccuracy * 100 : null;
                                    const accDelta  = fmtDelta(accBefore, accAfter, true);

                                    const isTarget = g.isTargeted;

                                    // Target row: show its own EOD/FPR vs overall (not a gap vs itself).
                                    // Other rows: show |group_val - target_val| gap.
                                    const displayTprBefore = isTarget ? (gEodBefore != null ? Math.abs(gEodBefore) : null) : tprBefore;
                                    const displayTprAfter  = isTarget ? (gEodAfter  != null ? Math.abs(gEodAfter)  : null) : tprAfter;
                                    const displayFprBefore = isTarget ? (gFprBefore != null ? Math.abs(gFprBefore) : null) : fprBefore;
                                    const displayFprAfter  = isTarget ? (gFprAfter  != null ? Math.abs(gFprAfter)  : null) : fprAfter;

                                    const tprDelta = fmtDelta(displayTprBefore, displayTprAfter, false);
                                    const fprDelta = fmtDelta(displayFprBefore, displayFprAfter, false);

                                    return (
                                      <Box component="tr" key={i} sx={{ bgcolor: g.isTargeted ? 'rgba(25,118,210,0.07)' : 'transparent' }}>
                                        <TD sx={{ fontWeight: g.isTargeted ? 700 : 400 }}>
                                          {g.groupLabel}
                                          {g.isTargeted && <Chip size="small" label="target" color="primary" sx={{ ml: 1, height: 18, fontSize: 10 }} />}
                                        </TD>
                                        <TD>{displayTprBefore != null ? displayTprBefore.toFixed(3) : '—'}</TD>
                                        <TD>{displayTprAfter  != null ? displayTprAfter.toFixed(3)  : '—'}</TD>
                                        <TD sx={{ fontWeight: 600, color: tprDelta.color }}>{tprDelta.text}</TD>
                                        <TD>{displayFprBefore != null ? displayFprBefore.toFixed(3) : '—'}</TD>
                                        <TD>{displayFprAfter  != null ? displayFprAfter.toFixed(3)  : '—'}</TD>
                                        <TD sx={{ fontWeight: 600, color: fprDelta.color }}>{fprDelta.text}</TD>
                                        <TD>{accBefore != null ? `${accBefore.toFixed(1)}%` : '—'}</TD>
                                        <TD>{accAfter  != null ? `${accAfter.toFixed(1)}%`  : '—'}</TD>
                                        <TD sx={{ fontWeight: 600, color: accDelta.color }}>{accDelta.text}</TD>
                                      </Box>
                                    );
                                  })}
                                </Box>
                              </Box>
                            </Paper>
                          </Box>
                        );
                      })()}
                    </>
                  )}
                </>
              )}
            </Stack>
          );

          case 4: return (
            <Box>
              {beespectorContextInfo && (
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  {selectedDatasets[0] && <Chip label={`Dataset: ${selectedDatasets[0].name}`} size="small" variant="outlined" color="primary" />}
                  {selectedClassifiers[0] && <Chip label={`Classifier: ${selectedClassifiers[0].name}`} size="small" variant="outlined" color="primary" />}
                  {selectedMitigations[0] && <Chip label={`Mitigation: ${selectedMitigations[0]}`} size="small" variant="outlined" color="primary" />}
                </Stack>
              )}
              {isInitializingBeespector ? (
                <Box sx={{ minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, textAlign: 'center' }}>
                  <CircularProgress size={48} />
                  <Typography variant="h6" color="text.secondary">Initializing Deep Dive…</Typography>
                  <Typography variant="body2" color="text.secondary">Training the model with your selections. This may take up to a minute.</Typography>
                </Box>
              ) : beespectorInitError ? (
                <Box sx={{ py: 2 }}>
                  <Alert severity="error" sx={{ mb: 2 }}>{beespectorInitError}</Alert>
                  <Button variant="outlined" onClick={initializeBeespector}>Retry</Button>
                </Box>
              ) : (
                <>
                  <BeespectorNavbar activeTab={beespectorActiveTab} onChangeTab={setBeespectorActiveTab} tabs={[{ id: 'performance', label: 'Performance & Fairness' }, { id: 'datapoint', label: 'Datapoint Editor' }]} />
                  <Box sx={{ mt: 3, minHeight: 600 }}>
                    {beespectorActiveTab === 'performance' && <PerformanceFairness />}
                    {beespectorActiveTab === 'datapoint' && <DatapointEditor />}
                  </Box>
                </>
              )}
            </Box>
          );

          default: return null;
        }
      })()}
    </>
  );

  return (
    <>
      <Seo title="Demo" />
      <Box component="main" sx={{ background: '#f5f5f5', mt: '100px', py: 2 }}>
        <Container maxWidth="xl">
          <Paper sx={{ p: 3 }} elevation={0}>
            <Stepper activeStep={activeStep} sx={{ mb: 6, '& .MuiStepLabel-root .Mui-completed': { color: '#002d62' }, '& .MuiStepLabel-root .Mui-active': { color: '#002d62' }, '& .MuiStepLabel-label': { mt: 1, fontWeight: 500, fontFamily: 'Inter, sans-serif' }, '& .MuiStepConnector-line': { borderColor: 'divider' } }}>
              {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
            </Stepper>
            {renderStepContent(activeStep)}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 6 }}>
              <Button variant="contained" disabled={activeStep === 0} onClick={handleBack} size="large" sx={{ mr: 2 }}>Back</Button>
              {activeStep === steps.length - 1 ? null : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  size="large"
                  disabled={
                    analysisLoading ||
                    (activeStep === 0 && (selectedDatasets.length === 0 || selectedClassifiers.length === 0)) ||
                    (activeStep === 2 && selectedMitigations.length === 0) ||
                    (activeStep === 2 && mitigationTargetGroups.length > 0 && !selectedTargetGroup) ||
                    (activeStep === 3 && (selectedDatasets.length !== 1 || selectedClassifiers.length !== 1 || selectedMitigations.length !== 1))
                  }
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