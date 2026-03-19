import { useState, useEffect } from 'react';
import { Box, Container, Paper, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { Layout as MarketingLayout } from 'src/layouts/marketing';
import { Seo } from 'src/components/seo';
import { useBeeFame } from 'src/contexts/BeeFameContext';

import BeespectorNavbar from 'src/components/beespector/Navbar';
import DatapointEditor from 'src/components/beespector/DatapointEditor';
import FeaturesPage from 'src/components/beespector/FeaturesPage';
import PartialDependencies from 'src/components/beespector/PartialDependencies';
import PerformanceFairness from 'src/components/beespector/PerformanceFairness';

import { beespectorApi } from 'src/lib/beespectorAxios';

const BeespectorPage: NextPage = () => {
  const router = useRouter();
  const { selectedDatasets, selectedClassifiers, selectedMitigations, classifierParams } =
    useBeeFame();

  const [activeTab, setActiveTab] = useState('datapoint');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [contextInfo, setContextInfo] = useState<any>(null);

  useEffect(() => {
    if (selectedDatasets.length > 0 && selectedClassifiers.length > 0) {
      initializeContext();
    } else {
      setTimeout(() => {
        router.push('/demo');
      }, 100);
    }
  }, []);

  const initializeContext = async () => {
    setIsInitializing(true);
    setInitError(null);
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
      setContextInfo(response.data);
      setIsInitialized(true);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || error.message || 'An unknown error occurred.';
      setInitError(errorMessage);
    } finally {
      setIsInitializing(false);
    }
  };

  const renderContent = () => {
    if (isInitializing) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            flexDirection: 'column',
            gap: 2,
            textAlign: 'center',
          }}
        >
          <CircularProgress />
          <Typography variant="h6">Initializing Beespector...</Typography>
          <Typography color="text.secondary">
            Model training may take up to a minute for large datasets.
          </Typography>
        </Box>
      );
    }
    if (initError) {
      return (
        <Container
          maxWidth="md"
          sx={{ py: 3, textAlign: 'center' }}
        >
          <Alert
            severity="error"
            sx={{ mb: 2, textAlign: 'left' }}
          >
            <strong>Initialization Failed:</strong> {initError}
          </Alert>
          <Button
            variant="contained"
            onClick={() => router.push('/demo')}
          >
            Return to Analysis Setup
          </Button>
        </Container>
      );
    }
    if (!isInitialized) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <Typography>Waiting for initialization...</Typography>
        </Box>
      );
    }
    return (
      <>
        {activeTab === 'datapoint' && <DatapointEditor />}
        {/*activeTab === 'partial' && <PartialDependencies />*/}
        {/*activeTab === 'performance' && <PerformanceFairness />*/}
        {/*activeTab === 'features' && <FeaturesPage />*/}
      </>
    );
  };

  return (
    <>
      <Seo title="Beespector Deep Dive | BeeFAME" />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          paddingTop: '80px',
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h3"
              gutterBottom
            >
              Beespector Deep Dive
            </Typography>
            {contextInfo ? (
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexWrap: 'wrap',
                  mb: 2,
                  textTransform: 'capitalize',
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Dataset: <strong>{contextInfo.dataset}</strong>
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Base Model: <strong>{contextInfo.base_classifier.replace(/_/g, ' ')}</strong>
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Mitigation: <strong>{contextInfo.mitigation_method.replace(/_/g, ' ')}</strong>
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Samples: <strong>{contextInfo.n_samples}</strong>
                </Typography>
              </Box>
            ) : (
              !isInitializing && !initError && <Box sx={{ height: '20px', mb: 2 }} />
            )}
            <Button
              variant="outlined"
              size="small"
              onClick={() => router.push('/demo')}
              sx={{ mb: 2 }}
            >
              ← Back to Analysis
            </Button>
          </Box>
          <BeespectorNavbar
            activeTab={activeTab}
            onChangeTab={setActiveTab}
          />
          <Paper
            elevation={1}
            sx={{ p: 3, mt: 3, borderRadius: 2, bgcolor: 'background.paper', minHeight: '600px' }}
          >
            {renderContent()}
          </Paper>
        </Container>
      </Box>
    </>
  );
};

BeespectorPage.getLayout = (page) => <MarketingLayout>{page}</MarketingLayout>;

export default BeespectorPage;
