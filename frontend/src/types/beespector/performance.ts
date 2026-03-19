export type PerformanceType = {
  roc_curve: RocCurve[];
  pr_curve: PrCurve[];
  confusion_matrix: CfMatrix;
  fairness_metrics: FairnessMetrics;
  performance_metrics: PerformanceMetrics;
};

export type RocCurve = {
  fpr: number;
  tpr: number;
};

export type PrCurve = {
  recall: number;
  precision: number;
};

export type CfMatrix = {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
};

export type FairnessMetrics = {
  StatisticalParityDiff: number;
  DisparateImpact: number;
  EqualOpportunityDiff: number;
};

export type PerformanceMetrics = {
  Accuracy: number;
  F1Score: number;
  AUC: number;
};
