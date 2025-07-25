import FormRenderer from "@/components/form-renderer";
import type { Parameter } from "@/lib/formBuilderTypes";

// Example usage of FormRenderer component
export default function ExampleUsage() {
  // Example parameters data - this would typically come from your API or state
  const exampleParameters: Parameter[] = [
    {
      id: "quantity",
      name: "quantity",
      label: "Quantity",
      type: "NumericValue",
      required: true,
      min: 1,
      step: 1,
      unit: "items",
      pricing: {},
      hasSubParameters: false,
      pricingScope: "per_unit",
    },
    {
      id: "size",
      name: "size",
      label: "Print Size",
      type: "FixedOption",
      required: true,
      displayType: "select",
      options: [
        {
          label: "Small (A4)",
          value: "small",
          description: "Standard A4 paper size",
          pricing: { base_price: 5 },
          subOptions: [],
        },
        {
          label: "Medium (A3)",
          value: "medium",
          description: "A3 paper size",
          pricing: { base_price: 10 },
          subOptions: [],
        },
        {
          label: "Large (A2)",
          value: "large",
          description: "A2 paper size",
          pricing: { base_price: 20 },
          subOptions: [],
        },
      ],
      pricing: {},
      hasSubParameters: false,
      pricingScope: "per_unit",
    },
    {
      id: "pages",
      name: "pages",
      label: "Number of Pages",
      type: "NumericValue",
      required: true,
      min: 1,
      step: 1,
      unit: "pages",
      pricing: { unit_price: 0.5 },
      hasSubParameters: false,
      pricingScope: "per_unit",
      isMainUnits: true, // This makes it the main units parameter
    },
  ];

  const handleFormChange = (formValues: any) => {
    console.log("Form values changed:", formValues);
  };

  const handlePriceChange = (totalPrice: number, breakdown: any[]) => {
    console.log("Price changed:", totalPrice);
    console.log("Breakdown:", breakdown);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Form Renderer Example</h1>

      <FormRenderer
        parameters={exampleParameters}
        currency="USD"
        title="Print Quote Calculator"
        description="Configure your printing requirements to get an instant quote"
        onFormChange={handleFormChange}
        onPriceChange={handlePriceChange}
        initialValues={{ quantity: "1" }}
        showPriceBreakdown={true}
        showValidationErrors={true}
        readOnly={false}
        className="max-w-6xl"
      />
    </div>
  );
}

/**
 * FormRenderer Component Usage Guide
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
 * Parameter Types Supported:
 * - "NumericValue": Number input field
 * - "FixedOption": Select/radio/toggle options
 * - "DerivedCalc": Calculated field based on formula
 *
 * FixedOption Display Types:
 * - "select": Dropdown select (default)
 * - "radio": Radio buttons
 * - "toggle": Toggle buttons
 *
 * Pricing Features:
 * - Base pricing per item
 * - Unit pricing that scales with main units
 * - Step pricing for quantity tiers
 * - Price multipliers
 * - Sub-option pricing
 *
 * Advanced Features:
 * - Conditional parameters (show/hide based on other selections)
 * - Sub-options for FixedOption parameters
 * - Derived calculations with formulas
 * - Main units designation for scaling calculations
 * - Real-time price calculation and breakdown
 * - Form validation with error display
 */
