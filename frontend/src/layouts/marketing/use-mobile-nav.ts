import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export const useMobileNav = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState<boolean>(false);

  const handlePathnameChange = useCallback((): void => {
    if (open) {
      setOpen(false);
    }
  }, [open]);

  useEffect(
    () => {
      handlePathnameChange();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname]
  );

  const handleOpen = useCallback((): void => {
    setOpen(true);
  }, []);

  const handleClose = useCallback((): void => {
    setOpen(false);
  }, []);

  return {
    handleOpen,
    handleClose,
    open,
  };
};
