/**
 * Custom React Hook for Form Builder functionality
 * Combines file upload, form calculations, and state management
 */

import { useState, useEffect } from "react";
import type { Parameter } from "@/lib/formBuilderTypes";
import {
  extractMockFileMetadata,
  applyFileConnections,
  type FileMetadata,
  type FileUploadConnection,
} from "@/lib/fileMetadataUtils";
import {
  calculatePrice,
  updateFormValueWithCalculations,
  initializeDerivedCalculations,
  type FormValues,
  type CurrencyType,
  type PriceBreakdownItem,
} from "@/lib/formCalculationUtils";

interface UseFormBuilderOptions {
  parameters: Parameter[];
  initialValues?: FormValues;
  currency?: CurrencyType;
  fileConnections?: FileUploadConnection[];
  onFormChange?: (values: FormValues) => void;
  onPriceChange?: (totalPrice: number, breakdown: PriceBreakdownItem[]) => void;
  onFileUpload?: (file: File, metadata: FileMetadata) => void;
}

export const useFormBuilder = ({
  parameters,
  initialValues = { quantity: "1" },
  currency = "USD",
  fileConnections = [],
  onFormChange,
  onPriceChange,
  onFileUpload,
}: UseFormBuilderOptions) => {
  // Form state
  const [formValues, setFormValues] = useState<FormValues>(initialValues);
  const [totalPrice, setTotalPrice] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdownItem[]>(
    []
  );

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Initialize derived calculations when parameters change
  useEffect(() => {
    const initializedValues = initializeDerivedCalculations(
      parameters,
      formValues
    );
    if (JSON.stringify(initializedValues) !== JSON.stringify(formValues)) {
      setFormValues(initializedValues);
    }
  }, [parameters]);

  // Calculate price when form values change
  useEffect(() => {
    const { totalPrice: newTotalPrice, breakdown } = calculatePrice(
      parameters,
      formValues,
      currency
    );
    setTotalPrice(newTotalPrice);
    setPriceBreakdown(breakdown);
    onPriceChange?.(newTotalPrice, breakdown);
  }, [formValues, parameters, currency, onPriceChange]);

  // Notify parent of form changes
  useEffect(() => {
    onFormChange?.(formValues);
  }, [formValues, onFormChange]);

  // Update form value with automatic calculations
  const updateFormValue = (name: string, value: any) => {
    setFormValues((prevValues) =>
      updateFormValueWithCalculations(name, value, parameters, prevValues)
    );
  };

  // Handle file upload with metadata extraction
  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setIsProcessingFile(true);

    try {
      const metadata = await extractMockFileMetadata(file);
      setFileMetadata(metadata);

      // Apply file connections if provided
      if (fileConnections.length > 0) {
        applyFileConnections(metadata, fileConnections, updateFormValue);
      }

      onFileUpload?.(file, metadata);
      console.log("File processed successfully:", metadata);
    } catch (error) {
      console.error("Error processing file:", error);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormValues(initialValues);
    setUploadedFile(null);
    setFileMetadata(null);
    setTotalPrice(0);
    setPriceBreakdown([]);
  };

  // Reset file upload state
  const clearFile = () => {
    setUploadedFile(null);
    setFileMetadata(null);
  };

  return {
    // Form state
    formValues,
    totalPrice,
    priceBreakdown,

    // File state
    uploadedFile,
    fileMetadata,
    isProcessingFile,

    // Actions
    updateFormValue,
    handleFileInputChange,
    handleFileUpload,
    resetForm,
    clearFile,

    // Computed values
    isFormValid: true, // You can add validation logic here
    hasChanges: JSON.stringify(formValues) !== JSON.stringify(initialValues),
  };
};

export default useFormBuilder;
