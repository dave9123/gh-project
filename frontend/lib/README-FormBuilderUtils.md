# Form Builder Utilities

This directory contains reusable utilities for the form builder system, extracted from the main calculation page to enable sharing across components.

## 📁 Files Overview

### `fileMetadataUtils.ts`

Utilities for handling file uploads and metadata extraction.

**Key Features:**

- Mock file metadata extraction for demonstration
- File connection management (linking file metadata to form parameters)
- Support for 3D files, PDFs, images, and documents
- File type validation and formatting utilities

**Main Functions:**

- `extractMockFileMetadata(file: File)` - Extract metadata from uploaded files
- `applyFileConnections()` - Apply file connections to form values
- `getFileAcceptString()` - Generate file accept string for inputs
- `formatMetadataValue()` - Format metadata values for display
- `calculateWeight()` - Calculate weight from volume and density

### `formCalculationUtils.ts`

Utilities for form calculations, pricing, and derived values.

**Key Features:**

- Safe expression evaluation for formulas
- Derived value calculations with dependency resolution
- Price calculation with multiple pricing models
- Form value updates with automatic recalculation

**Main Functions:**

- `calculatePrice()` - Calculate total price and breakdown
- `updateFormValueWithCalculations()` - Update form value with derived calculations
- `evaluateExpression()` - Safe math expression evaluator
- `isParameterVisible()` - Check parameter visibility based on conditions
- `initializeDerivedCalculations()` - Initialize all derived values

### `useFormBuilder.ts`

Custom React hook that combines all form builder functionality.

**Key Features:**

- Complete form state management
- Automatic price calculations
- File upload handling with metadata extraction
- Form validation and change tracking

## 🚀 Usage Examples

### Basic Form Calculations

```tsx
import {
  calculatePrice,
  updateFormValueWithCalculations,
} from "@/lib/formCalculationUtils";

// Calculate price
const { totalPrice, breakdown } = calculatePrice(parameters, formValues, "USD");

// Update form value with automatic derived calculations
const newFormValues = updateFormValueWithCalculations(
  "print_volume",
  "50000",
  parameters,
  currentFormValues
);
```

### File Upload and Metadata

```tsx
import {
  extractMockFileMetadata,
  applyFileConnections,
} from "@/lib/fileMetadataUtils";

// Extract file metadata
const metadata = await extractMockFileMetadata(file);

// Apply file connections to form
applyFileConnections(metadata, connections, updateFormValue);
```

### Using the Custom Hook

```tsx
import useFormBuilder from "@/lib/useFormBuilder";

function MyFormComponent() {
  const {
    formValues,
    totalPrice,
    priceBreakdown,
    uploadedFile,
    fileMetadata,
    updateFormValue,
    handleFileInputChange,
    resetForm,
  } = useFormBuilder({
    parameters: myParameters,
    initialValues: { quantity: "1" },
    currency: "USD",
    fileConnections: myFileConnections,
    onFormChange: (values) => console.log("Form changed:", values),
    onPriceChange: (price, breakdown) => console.log("Price:", price),
  });

  return (
    <div>
      <input type="file" onChange={handleFileInputChange} />
      <div>Total: ${totalPrice}</div>
      {/* Your form UI here */}
    </div>
  );
}
```

### Integration with Form Renderer

```tsx
import FormRenderer from "@/components/form-renderer";
import {
  defaultFileTypeMap,
  getFileAcceptString,
} from "@/lib/fileMetadataUtils";

function FormExample() {
  const formData = {
    fileTypeMap: defaultFileTypeMap["3d"],
    fileConnections: [
      {
        id: "vol_connection",
        metadataKey: "volume",
        parameterName: "print_volume",
        description: "Link volume to print volume parameter",
      },
    ],
  };

  return (
    <div>
      <input type="file" accept={getFileAcceptString(formData.fileTypeMap)} />
      <FormRenderer
        parameters={parameters}
        currency="USD"
        initialValues={formValues}
        onFormChange={handleFormChange}
        onPriceChange={handlePriceChange}
      />
    </div>
  );
}
```

## 🔧 Key Interfaces

### `FileMetadata`

```tsx
interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  volume?: number;
  weightGrams?: number;
  pages?: number;
  width?: number;
  height?: number;
  // ... additional properties
  [key: string]: any;
}
```

### `FileUploadConnection`

```tsx
interface FileUploadConnection {
  id: string;
  metadataKey: string; // Property in metadata (e.g., "volume")
  parameterName: string; // Form parameter to update
  description: string; // Human-readable description
}
```

### `FormValues`

```tsx
interface FormValues {
  [key: string]: any;
}
```

## 🎯 Benefits

1. **Reusability**: Share calculation logic across components
2. **Maintainability**: Single source of truth for form calculations
3. **Type Safety**: Full TypeScript support with proper interfaces
4. **Testing**: Easier to unit test isolated utility functions
5. **Performance**: Optimized calculation algorithms with dependency resolution
6. **Flexibility**: Support for multiple file types and pricing models

## 🔄 Migration from calc/page.tsx

The utilities were extracted from the main calculation page to enable reuse. The original functions have been:

1. **Refactored** - Improved error handling and type safety
2. **Modularized** - Split into logical groups (file handling, calculations, hooks)
3. **Enhanced** - Added proper TypeScript interfaces and documentation
4. **Optimized** - Better dependency resolution for derived calculations

## 🚨 Important Notes

- `extractMockFileMetadata()` is for demonstration only - replace with real file processing in production
- Always validate file types and sizes before processing
- The custom hook handles most common use cases but can be extended as needed
- Price calculations support multiple currencies and complex pricing models
- Derived calculations are resolved in dependency order to handle chained formulas

## 🔗 Related Files

- `/components/form-renderer.tsx` - Main form rendering component
- `/components/form-renderer-example.tsx` - Example usage with dummy data
- `/app/dashboard/calc/page.tsx` - Original implementation (now uses these utilities)
- `/lib/formBuilderTypes.ts` - TypeScript interfaces for parameters and options
