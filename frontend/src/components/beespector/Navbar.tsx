import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';

type NavbarTab = { id: string; label: string };

const DEFAULT_TABS: NavbarTab[] = [
  { id: 'features', label: 'Dataset Overview' },
  { id: 'performance', label: 'Performance & Fairness' },
  { id: 'partial', label: 'Partial Dependence' },
  { id: 'datapoint', label: 'Datapoint Editor' },
];

type NavbarProps = {
  activeTab: string;
  onChangeTab: (tab: string) => void;
  tabs?: NavbarTab[];
};

function BeespectorNavbar({ activeTab, onChangeTab, tabs = DEFAULT_TABS }: NavbarProps) {

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    onChangeTab(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs
        value={activeTab}
        onChange={handleChange}
        aria-label="Beespector navigation tabs"
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            label={tab.label}
            value={tab.id}
          />
        ))}
      </Tabs>
    </Box>
  );
}

export default BeespectorNavbar;
