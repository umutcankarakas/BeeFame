export type Features = {
  featureName: string;
  count: number;
  missing: number;
  mean: number;
  min: number;
  max: number;
  median: number;
  std: number;
  histogram: FeatureHistogram[];
};

export type FeatureHistogram = {
  bin: string;
  value: number;
};

export type SortableKeys = keyof Pick<
  Features,
  "count" | "missing" | "mean" | "min" | "max" | "median" | "std"
>;
