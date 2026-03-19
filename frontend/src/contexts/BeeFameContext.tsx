import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Dataset {
  id: number;
  name: string;
  slug: string;
  url: string;
  instances: number;
  description: string;
  sensitive_features: {
    name: string;
    unprivileged: string;
    privileged: string;
  }[];
}

interface Classifier {
  id: number;
  name: string;
  url: string;
  params: any[];
}

interface BeeFameContextType {
  selectedDatasets: Dataset[];
  setSelectedDatasets: (datasets: Dataset[]) => void;
  selectedClassifiers: Classifier[];
  setSelectedClassifiers: (classifiers: Classifier[]) => void;
  selectedMitigations: string[];
  setSelectedMitigations: (mitigations: string[]) => void;
  
  analysisData: any[];
  setAnalysisData: (data: any[]) => void;
  
  classifierParams: { [classifierId: number]: { [param: string]: any } };
  setClassifierParams: (params: any) => void;
}

const BeeFameContext = createContext<BeeFameContextType | undefined>(undefined);

export const BeeFameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([]);
  const [selectedClassifiers, setSelectedClassifiers] = useState<Classifier[]>([]);
  const [selectedMitigations, setSelectedMitigations] = useState<string[]>([]);
  const [analysisData, setAnalysisData] = useState<any[]>([]);
  const [classifierParams, setClassifierParams] = useState<any>({});

  const value = {
    selectedDatasets,
    setSelectedDatasets,
    selectedClassifiers,
    setSelectedClassifiers,
    selectedMitigations,
    setSelectedMitigations,
    analysisData,
    setAnalysisData,
    classifierParams,
    setClassifierParams,
  };

  return <BeeFameContext.Provider value={value}>{children}</BeeFameContext.Provider>;
};

export const useBeeFame = () => {
  const context = useContext(BeeFameContext);
  if (context === undefined) {
    throw new Error('useBeeFame must be used within a BeeFameProvider');
  }
  return context;
};