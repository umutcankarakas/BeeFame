export type PartialDependencePoint = {
  x: number;
  base: number;
  mitigated: number;
};

export type PartialDependenceData = {
  [featureName: string]: PartialDependencePoint[];
};