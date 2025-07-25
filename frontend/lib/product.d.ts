import { FormBuilderData } from "@/components/QuoteformBuilder";

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
