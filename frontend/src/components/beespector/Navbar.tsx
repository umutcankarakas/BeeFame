import React from 'react';
import { Box, Tab, Tabs } from '@mui/material';

type NavbarProps = {
  activeTab: string;
  onChangeTab: (tab: string) => void;
};

function BeespectorNavbar({ activeTab, onChangeTab }: NavbarProps) {
  const tabs = [
    { id: 'datapoint', label: 'Datapoint Editor' },
    //{ id: 'partial', label: 'Partial Dependence' },
    //{ id: 'performance', label: 'Performance & Fairness' },
    //{ id: 'features', label: 'Features' },
  ];

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
