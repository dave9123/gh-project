export type ParameterType = "FixedOption" | "NumericValue" | "DerivedCalc";

export interface PricingRule {
  base_price?: number;
  unit_price?: number;
  multiplier?: number;
  step_pricing?: {
    threshold: number;
    step_amount: number;
  };
}

export interface FixedOption {
  label: string;
  value: string;
  pricing: PricingRule;
}

export interface Parameter {
  id: string;
  name: string;
  label: string;
  type: ParameterType;
  required: boolean;
  pricing: PricingRule;
  options?: FixedOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  formula?: string;
  dependencies?: string[];
  conditional?: {
    parentParameter: string;
    showWhen: string[];
  };
}

export interface FormValues {
  [key: string]: any;
}
