import type { FC } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';

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
          <Grid
            xs={12}
            md={6}
          >
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
                  mb: 4,
                }}
              >
                Audit bias, apply mitigation strategies, and compare fairness metrics — in minutes.
              </Typography>
              <Button
                component={NextLink}
                href="/demo"
                variant="contained"
                size="large"
                sx={{ fontWeight: 600, px: 4, py: 1.5 }}
              >
                Try the Demo
              </Button>
            </Box>
          </Grid>
          <Grid
            xs={12}
            md={6}
          >
            <Box
              sx={{
                pt: '120px',
                position: 'relative',
                mb: '-7px',
              }}
            >
              <img
                src="/hero.svg"
                style={{ width: '100%' }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};
