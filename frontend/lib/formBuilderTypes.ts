export type ParameterType = "FixedOption" | "NumericValue" | "DerivedCalc";

export type InputDisplayType = "radio" | "select" | "toggle";

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
  description?: string;
  pricing: PricingRule;
  subOptions?: SubOption[];
  displayType?: InputDisplayType;
}

export interface SubOption {
  id: string;
  label: string;
  value: string;
  description?: string;
  price?: number;
  pricingScope: "per_qty" | "per_unit";
}

export interface Parameter {
  id: string;
  name: string;
  label: string;
  description?: string;
  type: ParameterType;
  required: boolean;
  pricing: PricingRule;
  options?: FixedOption[];
  displayType?: InputDisplayType;
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
  hasSubParameters?: boolean;
  subParameters?: Parameter[];
  pricingScope?: "per_unit" | "per_qty";
  unitsPerQuantity?: number;
  isMainUnits?: boolean;
}

export interface FormValues {
  [key: string]: any;
}
