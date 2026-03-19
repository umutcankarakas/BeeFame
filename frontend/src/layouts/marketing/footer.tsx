import { Box, Container, Typography, Stack, IconButton, Link } from '@mui/material';
import { GitHub as GitHubIcon } from '@mui/icons-material';
import { Logo } from 'src/components/logo';
import NextLink from 'next/link';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'background.default',
        borderTop: '1px solid',
        borderColor: 'divider',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          spacing={2}
        >
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
          >
            <Box
              component={NextLink}
              href={'paths.index'}
              sx={{
                display: 'flex',
                textDecoration: 'none',
                height: 32,
              }}
            >
              <Logo />
            </Box>
            <Typography
              color="text.secondary"
              variant="body2"
            >
              © {currentYear} BeeFAME. All rights reserved.
            </Typography>
          </Stack>

          <Link
            href="https://github.com/furkantopal/bee-fair"
            target="_blank"
            rel="noopener noreferrer"
            color="inherit"
          >
            <IconButton
              size="small"
              sx={{
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <GitHubIcon />
            </IconButton>
          </Link>
        </Stack>
      </Container>
    </Box>
  );
};
