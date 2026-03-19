// This type is now generic and will accept any feature set from the backend.
export type BaseDataFeatures = {
  [key: string]: any;
};

export type InitialDataPoint = {
  id: number;
  x1: number;
  x2: number;
  true_label: number;
  features: BaseDataFeatures;
  pred_label: number;
  pred_prob: number;
  mitigated_pred_label: number;
  mitigated_pred_prob: number;
};

// This type maps the initial point to the structure used in the component's state.
export type DisplayDataPoint = {
  id: number;
  x1: number;
  x2: number;
  true_label: number;
  features: BaseDataFeatures;
  base_pred_label: number;
  base_pred_prob: number;
  mitigated_pred_label: number;
  mitigated_pred_prob: number;
};

export type EvaluatedPointData = {
  id: number;
  x1: number;
  x2: number;
  features: BaseDataFeatures;
  true_label: number;
  base_model_prediction: {
    pred_label: number;
    pred_prob: number;
  };
  mitigated_model_prediction: {
    pred_label: number;
    pred_prob: number;
  };
};