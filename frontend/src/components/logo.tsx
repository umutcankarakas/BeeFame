import type { FC } from 'react';
import { useTheme } from '@mui/material/styles';

export const Logo: FC = () => {
  const theme = useTheme();

  return (
    <img
      src="/logo.svg"
      alt="BeeFAME"
    />
  );
};
