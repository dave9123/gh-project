import { FormBuilderData } from "@/components/QuoteformBuilder";

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

type CurrencyType = "USD" | "IDR";

interface CurrencyConfig {
  symbol: string;
  code: string;
  name: string;
}

export interface FormValues {
  [key: string]: any;
}

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  pages?: number;
  width?: number;
  height?: number;
  aspectRatio?: number;
  megapixels?: number;
  triangles?: number;
  vertices?: number;
  faces?: number;
  estimatedVertices?: number;
  fileFormat?: string;
  gcodeLines?: number;
  printTimeSeconds?: number;
  printTimeHours?: number;
  layerHeight?: number;
  lines?: number;
  words?: number;
  characters?: number;
  sizeCategory?: string;
  sizeValue?: number;
  volume?: number; // in cubic millimeters
  weightGrams?: number; // estimated weight in grams
  materialDensity?: number; // g/cm³ used for weight calculation
  [key: string]: any;
}

interface FileUploadConnection {
  id: string;
  metadataKey: string; // e.g., "pages", "width", "height"
  parameterName: string; // which parameter to link to
  description: string;
}

type FormDataT = {
  parameters: Parameter[];
  currency: CurrencyType;
  fileConnections: FileUploadConnection[];
  selectedFileType?: string;
  fileTypeMap?: string[];
  formValues: FormValues;
};
export type ProductTypes = {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  currencyType: string;
  formData: FormDataT;
  createdAt: number;
  lastModified: number;
};
