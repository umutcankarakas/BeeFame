import type { FC, ReactNode } from 'react';
import PropTypes from 'prop-types';
import Menu01Icon from '@untitled-ui/icons-react/build/esm/Menu01';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import useMediaQuery from '@mui/material/useMediaQuery';
import type { Theme } from '@mui/material/styles/createTheme';
import NextLink from 'next/link';
import { Logo } from 'src/components/logo';
import { TopNavItem } from './top-nav-item';
import { usePathname } from 'next/navigation';

interface Item {
  disabled?: boolean;
  external?: boolean;
  popover?: ReactNode;
  path?: string;
  title: string;
}

const items: Item[] = [
  {
    title: 'Homepage',
    path: '/',
  },
  {
    title: 'Features',
    path: '/#features',
  },
  {
    title: 'Teams',
    path: '/#teams',
  },
  {
    title: 'FAQ',
    path: '/#faq',
  },
];

const TOP_NAV_HEIGHT = 64;

interface TopNavProps {
  onMobileNavOpen?: () => void;
}

export const TopNav: FC<TopNavProps> = (props) => {
  const { onMobileNavOpen } = props;
  const pathname = usePathname();
  const mdUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));

  return (
    <Box
      component="header"
      sx={{
        left: 0,
        position: 'fixed',
        right: 0,
        top: 0,
        pt: 2,
        zIndex: (theme) => theme.zIndex.appBar,
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          backdropFilter: 'blur(6px)',
          backgroundColor: 'transparent',
          borderRadius: 2.5,
          boxShadow: 'none',
          transition: (theme) =>
            theme.transitions.create('box-shadow, background-color', {
              easing: theme.transitions.easing.easeInOut,
              duration: 200,
            }),
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ height: TOP_NAV_HEIGHT }}
        >
          <Stack
            alignItems="center"
            direction="row"
            spacing={1}
            sx={{ flexGrow: 1 }}
          >
            <Stack
              alignItems="center"
              component={NextLink}
              direction="row"
              display="inline-flex"
              href="/"
              spacing={1}
              sx={{ textDecoration: 'none' }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  height: 65,
                }}
              >
                <Logo />
              </Box>
            </Stack>
          </Stack>
          {mdUp && (
            <Stack
              alignItems="center"
              direction="row"
              spacing={2}
            >
              <Box
                component="nav"
                sx={{ height: '100%' }}
              >
                <Stack
                  component="ul"
                  alignItems="center"
                  justifyContent="center"
                  direction="row"
                  spacing={1}
                  sx={{
                    height: '100%',
                    listStyle: 'none',
                    m: 0,
                    p: 0,
                  }}
                >
                  <>
                    {items.map((item) => {
                      const checkPath = !!(item.path && pathname);
                      const partialMatch = checkPath ? pathname.includes(item.path!) : false;
                      const exactMatch = checkPath ? pathname === item.path : false;
                      const active = item.popover ? partialMatch : exactMatch;

                      return (
                        <TopNavItem
                          active={active}
                          external={item.external}
                          key={item.title}
                          path={item.path}
                          popover={item.popover}
                          title={item.title}
                        />
                      );
                    })}
                  </>
                </Stack>
              </Box>
            </Stack>
          )}
          <Stack
            alignItems="center"
            direction="row"
            justifyContent="flex-end"
            spacing={2}
            sx={{ flexGrow: 1 }}
          >
            <Button
              LinkComponent={NextLink}
              size={mdUp ? 'medium' : 'small'}
              href="/demo"
              variant="contained"
            >
              Demo
            </Button>
            {!mdUp && (
              <IconButton onClick={onMobileNavOpen}>
                <SvgIcon fontSize="small">
                  <Menu01Icon />
                </SvgIcon>
              </IconButton>
            )}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

TopNav.propTypes = {
  onMobileNavOpen: PropTypes.func,
};
