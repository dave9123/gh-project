# FormRenderer Component

A reusable React component for rendering dynamic forms with pricing calculations, similar to the customer view tab in the calc page.

## Features

- **Dynamic Form Rendering**: Renders forms based on parameter configuration data
- **Multiple Input Types**: Supports NumericValue, FixedOption, and DerivedCalc parameter types
- **Display Options**: FixedOption parameters can be displayed as select dropdowns, radio buttons, or toggle buttons
- **Sub-Options**: Supports nested options with additional pricing
- **Real-time Pricing**: Automatic price calculation with detailed breakdown
- **Conditional Logic**: Show/hide parameters based on other selections
- **Form Validation**: Built-in validation with error display
- **Derived Calculations**: Formula-based calculations with dependency management
- **Currency Support**: USD and IDR currency formatting
- **Responsive Layout**: Mobile-friendly grid layout

## Installation

```tsx
import FormRenderer from "@/components/form-renderer";
```

## Basic Usage

```tsx
import FormRenderer from "@/components/form-renderer";
import type { Parameter } from "@/lib/formBuilderTypes";

const parameters: Parameter[] = [
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
  // ... more parameters
];

function MyComponent() {
  return (
    <FormRenderer
      parameters={parameters}
      currency="USD"
      title="Quote Calculator"
      onFormChange={(formValues) => console.log(formValues)}
      onPriceChange={(total, breakdown) => console.log(total, breakdown)}
    />
  );
}
```

## Props

### Required Props

- `parameters: Parameter[]` - Array of parameter objects that define the form structure

### Optional Props

- `currency: "USD" | "IDR"` - Currency for pricing (default: "USD")
- `title: string` - Form title (default: "Quote Form")
- `description: string` - Form description (default: "Fill out the form to calculate pricing")
- `onFormChange: (formValues) => void` - Callback when form values change
- `onPriceChange: (totalPrice, breakdown) => void` - Callback when price changes
- `initialValues: FormValues` - Initial form values (default: `{ quantity: "1" }`)
- `showPriceBreakdown: boolean` - Whether to show price breakdown (default: true)
- `showValidationErrors: boolean` - Whether to show validation errors (default: true)
- `readOnly: boolean` - Whether form is read-only (default: false)
- `className: string` - Additional CSS classes

## Parameter Types

### NumericValue

Number input field with validation support.

```tsx
{
  type: "NumericValue",
  min: 1,
  max: 100,
  step: 0.1,
  unit: "meters",
  pricing: {
    unit_price: 2.5,
    base_price: 10
  }
}
```

### FixedOption

Select, radio, or toggle button options.

```tsx
{
  type: "FixedOption",
  displayType: "select", // "select", "radio", or "toggle"
  options: [
    {
      label: "Option A",
      value: "option_a",
      description: "Description of option A",
      pricing: { base_price: 5 },
      subOptions: [
        {
          id: "sub1",
          label: "Sub Option 1",
          value: "sub1",
          price: 2,
          pricingScope: "per_qty"
        }
      ]
    }
  ]
}
```

### DerivedCalc

Calculated field based on formula and dependencies.

```tsx
{
  type: "DerivedCalc",
  formula: "width * height * 0.1",
  dependencies: ["width", "height"],
  unit: "square_meters"
}
```

## Pricing Features

### Base Pricing

Fixed cost per item in the order.

```tsx
pricing: {
  base_price: 10; // $10 per item
}
```

### Unit Pricing

Cost that scales with main units parameter.

```tsx
pricing: {
  unit_price: 0.5; // $0.5 per unit of main parameter
}
```

### Step Pricing

Additional cost for quantities above threshold.

```tsx
pricing: {
  step_pricing: {
    threshold: 10,
    step_amount: 1 // $1 for each unit above 10
  }
}
```

### Price Multipliers

Multiply the calculated price by a factor.

```tsx
pricing: {
  multiplier: 1.2; // 20% markup
}
```

## Advanced Features

### Conditional Parameters

Show/hide parameters based on other selections.

```tsx
{
  conditional: {
    parentParameter: "material",
    showWhen: ["premium", "deluxe"]
  }
}
```

### Main Units

Designate a parameter as the main units for scaling calculations.

```tsx
{
  isMainUnits: true, // This parameter's value scales other unit pricing
  type: "NumericValue"
}
```

### Sub-Options

Nested options within FixedOption parameters.

```tsx
{
  type: "FixedOption",
  options: [
    {
      label: "Material Type",
      value: "material",
      subOptions: [
        {
          id: "finish1",
          label: "Matte Finish",
          value: "matte",
          price: 5,
          pricingScope: "per_qty"
        },
        {
          id: "finish2",
          label: "Gloss Finish",
          value: "gloss",
          price: 3,
          pricingScope: "per_unit"
        }
      ]
    }
  ]
}
```

## Examples

See `form-renderer-example.tsx` for a complete working example with different parameter types and pricing configurations.

## Integration with Existing Code

The FormRenderer component is already integrated into the calc page's customer view tab, replacing the previous inline implementation. This provides better code reusability and maintainability.

To use in other parts of your application:

1. Import the component and types
2. Prepare your parameters array
3. Handle the form change and price change callbacks
4. Optionally customize the display options

The component handles all form state management, validation, and pricing calculations internally, making it easy to drop into any page that needs dynamic form rendering.
