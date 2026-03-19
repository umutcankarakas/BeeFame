import type { FC } from 'react';
import Box from '@mui/material/Box';

import { Logo } from 'src/components/logo';

export const SplashScreen: FC = () => (
  <Box
    sx={{
      alignItems: 'center',
      backgroundColor: 'background.paper',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      justifyContent: 'center',
      left: 0,
      p: 3,
      position: 'fixed',
      top: 0,
      width: '100vw',
      zIndex: 1400,
    }}
  >
    <Box
      sx={{
        display: 'inline-flex',
      }}
    >
      <img src="/favicon.png" />
    </Box>
  </Box>
);
