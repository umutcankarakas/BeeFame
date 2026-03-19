import type { FC } from 'react';
import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

interface Feature {
  id: string;
  title: string;
  description: string;
  image: string;
}

const features: Feature[] = [
  {
    id: 'fairness',
    title: 'Fairness Analysis',
    description: 'Uncover and measure biases in your AI models with precision.',
    image: '/feature1.svg',
  },
  {
    id: 'visual',
    title: 'Visual Insights',
    description: 'Gain clear, interactive visualizations of your fairness metrics.',
    image: '/feature2.svg',
  },
  {
    id: 'customize',
    title: 'Customizable Testing',
    description: 'Tailor fairness tests to match your specific use cases and datasets.',
    image: '/feature3.svg',
  },
  {
    id: 'recommendations',
    title: 'Actionable Recommendations',
    description: 'Receive insights and steps to improve the fairness of your AI models.',
    image: '/feature4.svg',
  },
];

export const HomeFeatures: FC = () => {
  const theme = useTheme();
  const [activeFeature, setActiveFeature] = useState<number>(0);
  const feature = features[activeFeature];

  return (
    <Box
      id="features"
      sx={{
        backgroundColor: 'neutral.800',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top center',
        backgroundImage: 'url("/gradient-bg.svg")',
        color: 'common.white',
        pt: '50px',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          spacing={2}
          sx={{ mb: 8 }}
        >
          <Typography
            align="center"
            color="inherit"
            variant="h3"
          >
            Key Features for Ensuring Fair AI
          </Typography>
          <Typography
            align="center"
            color="inherit"
            variant="subtitle2"
          >
            Discover the Tools You Need to Build Ethical and Transparent AI Models
          </Typography>
        </Stack>
        <Grid
          alignItems="flex-end"
          container
          spacing={3}
        >
          <Grid
            xs={12}
            md={6}
            sx={{ mb: 10 }}
          >
            <Stack spacing={1}>
              {features.map((feature, index) => {
                const isActive = activeFeature === index;

                return (
                  <Box
                    key={feature.id}
                    onClick={() => setActiveFeature(index)}
                    sx={{
                      borderRadius: 2.5,
                      color: 'neutral.400',
                      cursor: 'pointer',
                      p: 3,
                      transition: (theme) =>
                        theme.transitions.create(['background-color, box-shadow', 'color'], {
                          easing: theme.transitions.easing.easeOut,
                          duration: theme.transitions.duration.enteringScreen,
                        }),
                      ...(isActive && {
                        backgroundColor: 'primary.alpha12',
                        boxShadow: (theme) => `${theme.palette.primary.main} 0 0 0 1px`,
                        color: 'common.white',
                      }),
                      '&:hover': {
                        ...(!isActive && {
                          backgroundColor: 'primary.alpha4',
                          boxShadow: (theme) => `${theme.palette.primary.main} 0 0 0 1px`,
                          color: 'common.white',
                        }),
                      },
                    }}
                  >
                    <Typography
                      color="inherit"
                      sx={{ mb: 1 }}
                      variant="h6"
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      color="inherit"
                      variant="body2"
                    >
                      {feature.description}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Grid>
          <Grid
            xs={12}
            md={6}
          >
            <Box
              sx={{
                '& img': {
                  width: '80%',
                  mb: '-7px',
                },
              }}
            >
              <img src={feature.image} />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
