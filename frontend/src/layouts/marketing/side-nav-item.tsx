import type { FC, ReactNode } from 'react';
import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import ChevronDownIcon from '@untitled-ui/icons-react/build/esm/ChevronDown';
import ChevronRightIcon from '@untitled-ui/icons-react/build/esm/ChevronRight';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Collapse from '@mui/material/Collapse';
import SvgIcon from '@mui/material/SvgIcon';

import NextLink from 'next/link';

interface SideNavItemProps {
  active?: boolean;
  children?: ReactNode;
  depth?: number;
  disabled?: boolean;
  external?: boolean;
  open?: boolean;
  path?: string;
  title: string;
}

export const SideNavItem: FC<SideNavItemProps> = (props) => {
  const { active, children, disabled, external, open: openProp, path, title } = props;
  const [open, setOpen] = useState<boolean>(!!openProp);

  const handleToggle = useCallback((): void => {
    setOpen((prevOpen) => !prevOpen);
  }, []);

  // Branch

  if (children) {
    return (
      <li>
        <ButtonBase
          disabled={disabled}
          onClick={handleToggle}
          sx={{
            alignItems: 'center',
            borderRadius: 1,
            display: 'flex',
            justifyContent: 'flex-start',
            px: '12px',
            py: '6px',
            textAlign: 'left',
            width: '100%',
            ...(active && {
              backgroundColor: 'action.hover',
            }),
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <Box
            component="span"
            sx={{
              flexGrow: 1,
              fontFamily: (theme) => theme.typography.fontFamily,
              fontSize: 14,
              fontWeight: 500,
              lineHeight: '24px',
              whiteSpace: 'nowrap',
              ...(active && {
                color: 'primary.main',
              }),
            }}
          >
            {title}
          </Box>
          <SvgIcon
            sx={{
              color: 'action.active',
              fontSize: 16,
              ml: 2,
            }}
          >
            {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </SvgIcon>
        </ButtonBase>
        <Collapse
          in={open}
          sx={{ mt: 0.5 }}
        >
          {children}
        </Collapse>
      </li>
    );
  }

  // Leaf

  const linkProps = path
    ? external
      ? {
          component: 'a',
          href: path,
          target: '_blank',
        }
      : {
          component: NextLink,
          href: path,
        }
    : {};

  return (
    <li>
      <ButtonBase
        sx={{
          alignItems: 'center',
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'flex-start',
          px: '12px',
          py: '6px',
          textAlign: 'left',
          width: '100%',
          ...(active && {
            backgroundColor: 'action.hover',
          }),
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        {...linkProps}
      >
        <Box
          component="span"
          sx={{
            flexGrow: 1,
            fontFamily: (theme) => theme.typography.fontFamily,
            fontSize: 14,
            fontWeight: 500,
            lineHeight: '24px',
            whiteSpace: 'nowrap',
            ...(active && {
              color: 'primary.main',
            }),
          }}
        >
          {title}
        </Box>
      </ButtonBase>
    </li>
  );
};

SideNavItem.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.any,
  depth: PropTypes.number,
  disabled: PropTypes.bool,
  external: PropTypes.bool,
  open: PropTypes.bool,
  path: PropTypes.string,
  title: PropTypes.string.isRequired,
};
