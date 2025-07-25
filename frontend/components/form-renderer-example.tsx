import FormRenderer from "@/components/form-renderer";
import type { Parameter } from "@/lib/formBuilderTypes";
import { useState } from "react";
import {
  extractMockFileMetadata,
  applyFileConnections,
  getFileAcceptString,
  formatMetadataValue,
  formatMetadataKey,
  defaultFileTypeMap,
  type FileMetadata,
  type FileUploadConnection,
} from "@/lib/fileMetadataUtils";
import {
  calculatePrice,
  updateFormValueWithCalculations,
  initializeDerivedCalculations,
  currencies,
  type FormValues,
  type CurrencyType,
} from "@/lib/formCalculationUtils";
// Alternative: import useFormBuilder from "@/lib/useFormBuilder"; // For simplified usage

// Example usage of FormRenderer component with comprehensive dummy data
// This mirrors the structure from getCurrentFormData in the calc page
export default function ExampleUsage() {
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [formValues, setFormValues] = useState<FormValues>({
    quantity: "1",
    material: "pla",
    print_volume: "50000",
    estimated_weight: "62",
    layer_height: "0.2",
    infill_percentage: "20",
    support_material: "yes",
    finishing: "standard",
    rush_order: "no",
  });

  // Comprehensive dummy data that matches FormBuilderData interface structure
  const exampleFormData = {
    id: "form_example_2025",
    name: "3D Printing Service Quote",
    description:
      "Custom 3D printing service with multiple material options and finishing choices",
    currency: "USD" as CurrencyType,
    selectedFileType: "3d",
    fileTypeMap: defaultFileTypeMap["3d"],
    createdAt: "2025-01-15T10:30:00.000Z",
    updatedAt: "2025-01-20T14:45:00.000Z",

    // File upload connections for linking file metadata to parameters
    fileConnections: [
      {
        id: "connection_volume",
        metadataKey: "volume",
        parameterName: "print_volume",
        description: "Link STL volume to print volume parameter",
      },
      {
        id: "connection_weight",
        metadataKey: "weightGrams",
        parameterName: "estimated_weight",
        description: "Link calculated weight to weight parameter",
      },
    ] as FileUploadConnection[],

    // Initial form values (moved to state)
    formValues,
  };

  // Complex parameter structure with various types and pricing models
  const exampleParameters: Parameter[] = [
    // Quantity parameter (always first)
    {
      id: "param_quantity_2025",
      name: "quantity",
      label: "Quantity",
      description: "Number of items to print",
      type: "NumericValue",
      required: true,
      min: 1,
      max: 100,
      step: 1,
      unit: "units",
      pricing: {},
      hasSubParameters: false,
      pricingScope: "per_unit",
    },

    // Material selection with sub-options
    {
      id: "param_material_2025",
      name: "material",
      label: "Print Material",
      description: "Choose the material for your 3D print",
      type: "FixedOption",
      required: true,
      displayType: "select",
      options: [
        {
          label: "PLA (Standard)",
          value: "pla",
          description: "Easy to print, biodegradable, good for prototypes",
          pricing: { base_price: 15 },
          subOptions: [
            {
              id: "pla_color_1",
              label: "Standard Colors",
              value: "standard_color",
              description: "White, Black, Gray",
              price: 0,
              pricingScope: "per_qty",
            },
            {
              id: "pla_color_2",
              label: "Premium Colors",
              value: "premium_color",
              description: "Red, Blue, Green, Yellow",
              price: 3,
              pricingScope: "per_qty",
            },
            {
              id: "pla_color_3",
              label: "Specialty Colors",
              value: "specialty_color",
              description: "Transparent, Glow-in-dark, Wood-fill",
              price: 8,
              pricingScope: "per_qty",
            },
          ],
        },
        {
          label: "ABS (Durable)",
          value: "abs",
          description: "Strong, heat resistant, good for functional parts",
          pricing: { base_price: 20 },
          subOptions: [
            {
              id: "abs_color_1",
              label: "Standard Colors",
              value: "standard_color",
              description: "White, Black, Gray",
              price: 0,
              pricingScope: "per_qty",
            },
            {
              id: "abs_color_2",
              label: "Premium Colors",
              value: "premium_color",
              description: "Red, Blue, Green",
              price: 5,
              pricingScope: "per_qty",
            },
          ],
        },
        {
          label: "PETG (Clear)",
          value: "petg",
          description: "Crystal clear, chemical resistant, food safe",
          pricing: { base_price: 25 },
          subOptions: [
            {
              id: "petg_finish_1",
              label: "Clear/Transparent",
              value: "clear",
              description: "Crystal clear finish",
              price: 0,
              pricingScope: "per_qty",
            },
            {
              id: "petg_finish_2",
              label: "Colored PETG",
              value: "colored",
              description: "Various solid colors",
              price: 7,
              pricingScope: "per_qty",
            },
          ],
        },
        {
          label: "TPU (Flexible)",
          value: "tpu",
          description: "Flexible, rubber-like material",
          pricing: { base_price: 35 },
          subOptions: [
            {
              id: "tpu_hardness_1",
              label: "Shore 85A (Flexible)",
              value: "85a",
              description: "More flexible, rubber-like",
              price: 0,
              pricingScope: "per_qty",
            },
            {
              id: "tpu_hardness_2",
              label: "Shore 95A (Semi-Rigid)",
              value: "95a",
              description: "Less flexible, more durable",
              price: 5,
              pricingScope: "per_qty",
            },
          ],
        },
      ],
      pricing: {},
      hasSubParameters: false,
      pricingScope: "per_unit",
    },

    // Print volume (main units parameter with file connection)
    {
      id: "param_volume_2025",
      name: "print_volume",
      label: "Print Volume",
      description:
        "Volume of material needed (automatically calculated from STL file)",
      type: "NumericValue",
      required: true,
      min: 1,
      max: 1000000,
      step: 100,
      unit: "mm³",
      pricing: {
        unit_price: 0.0002, // $0.0002 per mm³
        step_pricing: {
          threshold: 100000, // Above 100,000 mm³
          step_amount: 0.0001, // Reduced rate for larger volumes
        },
      },
      hasSubParameters: false,
      pricingScope: "per_unit",
      isMainUnits: true, // This makes it the main units parameter
      unitsPerQuantity: 1,
    },

    // Derived calculation for estimated weight
    {
      id: "param_weight_2025",
      name: "estimated_weight",
      label: "Estimated Weight",
      description: "Calculated weight based on volume and material density",
      type: "DerivedCalc",
      required: false,
      unit: "grams",
      formula: "print_volume * 0.00124", // PLA density conversion
      dependencies: ["print_volume"],
      pricing: {},
      hasSubParameters: false,
      pricingScope: "per_unit",
    },

    // Layer height selection
    {
      id: "param_layer_height_2025",
      name: "layer_height",
      label: "Layer Height (Quality)",
      description: "Lower values = higher quality, longer print time",
      type: "FixedOption",
      required: true,
      displayType: "radio",
      options: [
        {
          label: "0.1mm (Ultra Fine)",
          value: "0.1",
          description: "Highest quality, longest print time",
          pricing: { multiplier: 2.5 },
        },
        {
          label: "0.15mm (Fine)",
          value: "0.15",
          description: "High quality, longer print time",
          pricing: { multiplier: 1.8 },
        },
        {
          label: "0.2mm (Standard)",
          value: "0.2",
          description: "Good balance of quality and speed",
          pricing: { multiplier: 1.0 },
        },
        {
          label: "0.3mm (Fast)",
          value: "0.3",
          description: "Lower quality, faster printing",
          pricing: { multiplier: 0.7 },
        },
      ],
      pricing: {},
      hasSubParameters: false,
      pricingScope: "per_unit",
    },

    // Infill percentage
    {
      id: "param_infill_2025",
      name: "infill_percentage",
      label: "Infill Density",
      description:
        "Internal structure density (affects strength and material usage)",
      type: "FixedOption",
      required: true,
      displayType: "select",
      options: [
        {
          label: "10% (Hollow/Display)",
          value: "10",
          description: "Minimal material, display purposes only",
          pricing: { multiplier: 0.8 },
        },
        {
          label: "20% (Standard)",
          value: "20",
          description: "Good for most applications",
          pricing: { multiplier: 1.0 },
        },
        {
          label: "50% (Strong)",
          value: "50",
          description: "Stronger parts, more material",
          pricing: { multiplier: 1.4 },
        },
        {
          label: "100% (Solid)",
          value: "100",
          description: "Maximum strength, most material",
          pricing: { multiplier: 2.2 },
        },
      ],
      pricing: {},
      hasSubParameters: false,
      pricingScope: "per_unit",
    },

    // Support material (conditional on complexity)
    {
      id: "param_supports_2025",
      name: "support_material",
      label: "Support Material",
      description: "Required for overhangs and complex geometries",
      type: "FixedOption",
      required: true,
      displayType: "toggle",
      options: [
        {
          label: "No Supports Needed",
          value: "no",
          description: "Simple geometry, no overhangs",
          pricing: { base_price: 0 },
        },
        {
          label: "Standard Supports",
          value: "yes",
          description: "PLA supports (same material)",
          pricing: { base_price: 8 },
        },
        {
          label: "Soluble Supports",
          value: "soluble",
          description: "PVA supports for complex parts",
          pricing: { base_price: 25 },
        },
      ],
      pricing: {},
      hasSubParameters: false,
      pricingScope: "per_unit",
    },

    // Post-processing options
    {
      id: "param_finishing_2025",
      name: "finishing",
      label: "Post-Processing",
      description: "Additional finishing services",
      type: "FixedOption",
      required: false,
      displayType: "select",
      options: [
        {
          label: "Standard (As-Printed)",
          value: "standard",
          description: "No additional processing",
          pricing: { base_price: 0 },
        },
        {
          label: "Support Removal Only",
          value: "support_removal",
          description: "Clean support material removal",
          pricing: { base_price: 5 },
        },
        {
          label: "Light Sanding",
          value: "light_sanding",
          description: "Remove layer lines on visible surfaces",
          pricing: { base_price: 15 },
        },
        {
          label: "Full Finishing",
          value: "full_finishing",
          description: "Sanding, priming, and painting",
          pricing: { base_price: 45 },
        },
      ],
      pricing: {},
      hasSubParameters: false,
      pricingScope: "per_unit",
    },

    // Rush order option
    {
      id: "param_rush_2025",
      name: "rush_order",
      label: "Delivery Speed",
      description: "Standard delivery is 5-7 business days",
      type: "FixedOption",
      required: false,
      displayType: "radio",
      options: [
        {
          label: "Standard (5-7 days)",
          value: "no",
          description: "Normal processing time",
          pricing: { multiplier: 1.0 },
        },
        {
          label: "Rush (2-3 days)",
          value: "rush",
          description: "Priority processing",
          pricing: { multiplier: 1.5 },
        },
        {
          label: "Express (24 hours)",
          value: "express",
          description: "Emergency processing",
          pricing: { multiplier: 2.5 },
        },
      ],
      pricing: {},
      hasSubParameters: false,
      pricingScope: "per_unit",
    },
  ];

  // File upload handler using the utility functions
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    try {
      console.log("Processing file:", file.name);
      const metadata = await extractMockFileMetadata(file);
      setFileMetadata(metadata);

      // Apply file connections automatically using the utility function
      applyFileConnections(
        metadata,
        exampleFormData.fileConnections,
        (name, value) => {
          setFormValues((prevValues) =>
            updateFormValueWithCalculations(
              name,
              value,
              exampleParameters,
              prevValues
            )
          );
        }
      );

      console.log("File metadata extracted:", metadata);
    } catch (error) {
      console.error("Error processing file:", error);
    }
  };

  const handleFormChange = (newFormValues: FormValues) => {
    console.log("Form values changed:", newFormValues);
    setFormValues(newFormValues);
    console.log("Complete form data structure:", {
      ...exampleFormData,
      formValues: newFormValues,
      updatedAt: new Date().toISOString(),
    });
  };

  const handlePriceChange = (totalPrice: number, breakdown: any[]) => {
    console.log("Price changed:", totalPrice);
    console.log("Breakdown:", breakdown);
    console.log(
      "Price per unit:",
      totalPrice / parseInt(formValues.quantity || "1")
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{exampleFormData.name}</h1>
        <p className="text-gray-600 mb-4">{exampleFormData.description}</p>

        {/* Form metadata display */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm">
          <h3 className="font-semibold mb-2">
            Form Metadata (matching getCurrentFormData structure):
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-medium">Form ID:</span> {exampleFormData.id}
            </div>
            <div>
              <span className="font-medium">Currency:</span>{" "}
              {exampleFormData.currency}
            </div>
            <div>
              <span className="font-medium">File Type:</span>{" "}
              {exampleFormData.selectedFileType}
            </div>
            <div>
              <span className="font-medium">Parameters:</span>{" "}
              {exampleParameters.length}
            </div>
            <div>
              <span className="font-medium">Created:</span>{" "}
              {new Date(exampleFormData.createdAt).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Updated:</span>{" "}
              {new Date(exampleFormData.updatedAt).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">File Connections:</span>{" "}
              {exampleFormData.fileConnections.length}
            </div>
            <div>
              <span className="font-medium">Accepted Files:</span>{" "}
              {exampleFormData.fileTypeMap.join(", ")}
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-green-800 mb-3">
            File Upload ({exampleFormData.selectedFileType.toUpperCase()} Files)
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload 3D File for Automatic Parameter Detection
              </label>
              <input
                type="file"
                accept={getFileAcceptString(exampleFormData.fileTypeMap)}
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 
                          file:mr-4 file:py-2 file:px-4 
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-green-50 file:text-green-700
                          hover:file:bg-green-100
                          border border-gray-300 rounded-lg cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: {exampleFormData.fileTypeMap.join(", ")}
              </p>
            </div>

            {uploadedFile && (
              <div className="border border-green-200 rounded-lg p-3 bg-white">
                <h4 className="font-medium text-green-800 mb-2">
                  Uploaded File:
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {uploadedFile.name}
                  </p>
                  <p>
                    <span className="font-medium">Size:</span>{" "}
                    {(uploadedFile.size / 1024).toFixed(2)} KB
                  </p>
                  <p>
                    <span className="font-medium">Type:</span>{" "}
                    {uploadedFile.type || "Unknown"}
                  </p>
                </div>
              </div>
            )}

            {fileMetadata && (
              <div className="border border-green-200 rounded-lg p-3 bg-white">
                <h4 className="font-medium text-green-800 mb-2">
                  Extracted Metadata:
                </h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {Object.entries(fileMetadata).map(([key, value]) => (
                    <p key={key}>
                      <span className="font-medium capitalize">
                        {formatMetadataKey(key)}:
                      </span>{" "}
                      {formatMetadataValue(key, value)}
                    </p>
                  ))}
                </div>

                {exampleFormData.fileConnections.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-green-100">
                    <h5 className="font-medium text-green-700 mb-2">
                      Active File Connections:
                    </h5>
                    {exampleFormData.fileConnections.map((connection) => {
                      const metadataValue =
                        fileMetadata[connection.metadataKey];
                      return (
                        <div
                          key={connection.id}
                          className="text-xs text-green-600 mb-1"
                        >
                          {connection.description}:{" "}
                          {metadataValue
                            ? `${metadataValue} → ${connection.parameterName}`
                            : "No data available"}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <FormRenderer
        parameters={exampleParameters}
        currency={exampleFormData.currency}
        title={exampleFormData.name}
        description="Configure your 3D printing requirements to get an instant quote"
        onFormChange={handleFormChange}
        onPriceChange={handlePriceChange}
        initialValues={formValues}
        showPriceBreakdown={true}
        showValidationErrors={true}
        readOnly={false}
        className="max-w-6xl"
      />

      {/* Additional information about the dummy data structure */}
      <div className="mt-8 bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">
          Dummy Data Features:
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • Complete FormBuilderData structure matching getCurrentFormData()
          </li>
          <li>
            • Multiple parameter types: NumericValue, FixedOption, DerivedCalc
          </li>
          <li>• Sub-options for material colors and specifications</li>
          <li>• File upload connections for 3D file metadata</li>
          <li>• Interactive file upload with mock metadata extraction</li>
          <li>• Automatic parameter filling based on file connections</li>
          <li>
            • Various pricing models: base_price, unit_price, multipliers,
            step_pricing
          </li>
          <li>
            • Main units parameter (print_volume) for scaling calculations
          </li>
          <li>• Derived calculations (estimated weight from volume)</li>
          <li>• Different display types: select, radio, toggle</li>
          <li>• Realistic 3D printing service parameters and pricing</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * FormRenderer Component Usage Guide with Comprehensive Dummy Data
 *
 * This example demonstrates a complete FormBuilderData structure that matches
 * the getCurrentFormData() function from the calc page, including:
 *
 * FormBuilderData Structure:
 * - id: Unique form identifier
 * - name: Form title
 * - description: Form description
 * - currency: "USD" | "IDR"
 * - selectedFileType: File type category (pdf, images, 3d, documents)
 * - fileTypeMap: Array of accepted file extensions
 * - fileConnections: Links between file metadata and form parameters
 * - formValues: Current form values/state
 * - createdAt/updatedAt: Timestamps
 * - parameters: Array of Parameter objects
 *
 * Required Props:
 * - parameters: Parameter[] - Array of parameter objects that define the form structure
 *
 * Optional Props:
 * - currency: "USD" | "IDR" - Currency to use for pricing (default: "USD")
 * - title: string - Form title (default: "Quote Form")
 * - description: string - Form description (default: "Fill out the form to calculate pricing")
 * - onFormChange: (formValues) => void - Callback when form values change
 * - onPriceChange: (totalPrice, breakdown) => void - Callback when price changes
 * - initialValues: FormValues - Initial form values (default: { quantity: "1" })
 * - showPriceBreakdown: boolean - Whether to show price breakdown (default: true)
 * - showValidationErrors: boolean - Whether to show validation errors (default: true)
 * - readOnly: boolean - Whether form is read-only (default: false)
 * - className: string - Additional CSS classes
 *
 * Parameter Types Demonstrated:
 * - "NumericValue": Number input field (quantity, print_volume)
 * - "FixedOption": Select/radio/toggle options (material, layer_height, etc.)
 * - "DerivedCalc": Calculated field based on formula (estimated_weight)
 *
 * FixedOption Display Types Shown:
 * - "select": Dropdown select (material, infill_percentage, finishing)
 * - "radio": Radio buttons (layer_height, rush_order)
 * - "toggle": Toggle buttons (support_material)
 *
 * Pricing Features Demonstrated:
 * - Base pricing per item (material options)
 * - Unit pricing that scales with main units (print_volume)
 * - Step pricing for quantity tiers (volume discounts)
 * - Price multipliers (layer height, infill, rush orders)
 * - Sub-option pricing (material colors, TPU hardness)
 *
 * Advanced Features Shown:
 * - File upload connections (STL volume → print_volume, weight calculations)
 * - Interactive file upload with fileTypeMap validation
 * - Mock metadata extraction for 3D files (STL, OBJ, PLY, 3MF, AMF, G-Code)
 * - Automatic form parameter population from file metadata
 * - Real-time file connection status display
 * - Sub-options for FixedOption parameters (material colors and specifications)
 * - Derived calculations with formulas (weight = volume × density)
 * - Main units designation for scaling calculations (print_volume)
 * - Real-time price calculation and breakdown
 * - Form validation with error display
 * - Comprehensive metadata structure matching production forms
 *
 * File Upload Features:
 * - Accepts files based on selectedFileType and fileTypeMap
 * - Mock metadata extraction simulating real 3D file processing
 * - Automatic parameter filling via fileConnections
 * - Visual feedback showing uploaded file info and extracted metadata
 * - File connection status display showing which parameters are auto-filled
 */
