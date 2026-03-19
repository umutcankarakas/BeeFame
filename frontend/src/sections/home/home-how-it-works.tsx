import type { FC } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/system/Unstable_Grid';
import SettingsIcon from '@mui/icons-material/TuneRounded';
import RadarIcon from '@mui/icons-material/RadarRounded';
import CompareArrowsIcon from '@mui/icons-material/CompareArrowsRounded';

const steps = [
  {
    number: '01',
    icon: <SettingsIcon sx={{ fontSize: 36, color: 'primary.main' }} />,
    title: 'Pick Your Setup',
    description:
      'Choose a dataset (Census Income or German Credit) and a classifier — Random Forest, XGBoost, SVC, or Logistic Regression. Tune parameters to match your scenario.',
  },
  {
    number: '02',
    icon: <RadarIcon sx={{ fontSize: 36, color: 'primary.main' }} />,
    title: 'Inspect Bias',
    description:
      'Radar charts display five fairness metrics across sensitive attributes (Age, Gender, Race) before any intervention, giving you a clear picture of where bias lives.',
  },
  {
    number: '03',
    icon: <CompareArrowsIcon sx={{ fontSize: 36, color: 'primary.main' }} />,
    title: 'Mitigate & Compare',
    description:
      'Apply a preprocessing strategy — Relabeller, Prevalence Sampling, or Data Repairer — then compare original vs. mitigated metrics side-by-side. Dive deeper with Beespector.',
  },
];

export const HomeHowItWorks: FC = () => {
  return (
    <Box
      id="how-it-works"
      sx={{
        backgroundColor: 'grey.50',
        py: 10,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            textAlign: 'center',
            mb: 8,
          }}
        >
          <Typography
            variant="overline"
            color="primary.main"
            sx={{ fontWeight: 700, letterSpacing: 2, mb: 1, display: 'block' }}
          >
            Simple Process
          </Typography>
          <Typography
            variant="h3"
            sx={{ mb: 2, fontWeight: 700 }}
          >
            How It Works
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: 18, maxWidth: 520, mx: 'auto' }}
          >
            From raw dataset to bias-mitigated model in four steps — no ML expertise required.
          </Typography>
        </Box>

        <Grid
          container
          spacing={4}
        >
          {steps.map((step) => (
            <Grid
              key={step.number}
              xs={12}
              md={4}
            >
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 3,
                  p: 1,
                  transition: 'box-shadow 0.2s',
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h2"
                    sx={{
                      fontWeight: 800,
                      color: 'primary.main',
                      opacity: 0.15,
                      lineHeight: 1,
                      mb: 2,
                      fontSize: '4rem',
                    }}
                  >
                    {step.number}
                  </Typography>
                  <Box sx={{ mb: 2 }}>{step.icon}</Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 700, mb: 1.5 }}
                  >
                    {step.title}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    variant="body2"
                    sx={{ lineHeight: 1.7 }}
                  >
                    {step.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
