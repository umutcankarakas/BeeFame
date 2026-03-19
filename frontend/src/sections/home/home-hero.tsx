import type { FC } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import Grid from '@mui/system/Unstable_Grid';

export const HomeHero: FC = () => {
  return (
    <Box
      sx={{
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top center',
        backgroundImage: 'url("/gradient-bg.svg")',
        pt: '100px',
      }}
    >
      <Container maxWidth="lg">
        <Grid
          container
          alignItems="center"
          spacing={2}
        >
          <Grid md={6}>
            <Box maxWidth="sm">
              <Typography
                variant="h1"
                sx={{ mb: 2 }}
              >
                Evaluate the Fairness of Your{' '}
                <Typography
                  component="span"
                  color="primary.main"
                  variant="inherit"
                >
                  AI Models
                </Typography>
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  fontSize: 20,
                  fontWeight: 500,
                }}
              >
                Easily test and visualize the fairness of your AI models to ensure ethical and
                unbiased decision-making
              </Typography>
            </Box>
          </Grid>
          <Grid md={6}>
            <Box
              sx={{
                pt: '120px',
                position: 'relative',
                mb: '-7px',
              }}
            >
              <img src="/hero.svg" />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
