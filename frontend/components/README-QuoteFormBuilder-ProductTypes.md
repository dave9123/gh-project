# QuoteFormBuilder with ProductTypes Integration

## Overview

The `QuoteFormBuilder` component has been enhanced to accept `ProductTypes` props, allowing it to load existing product configurations as default values. This integration enables seamless editing of existing products while maintaining backward compatibility for creating new products.

## Changes Made

### 1. Props Interface

- Added `QuoteFormBuilderProps` interface with optional `product` prop of type `ProductTypes`
- Modified component signature to accept props: `QuoteFormBuilder({ product }: QuoteFormBuilderProps = {})`

### 2. ProductTypes Integration

- Added import for `ProductTypes` from `@/lib/product.d`
- Added `useEffect` hook to initialize form data from `product` prop
- Parses `formData` JSON string from `ProductTypes` to reconstruct `FormBuilderData`

### 3. Data Transformation

#### On Component Mount (ProductTypes → FormBuilderData)

```typescript
const parsedFormData: FormBuilderData = JSON.parse(product.formData);
// Maps ProductTypes fields to component state:
// - product.name → formName
// - product.description → formDescription
// - product.id → lastSavedData.id
// - product.currencyType → selectedCurrency
// - parsedFormData.parameters → parameters
// - parsedFormData.* → corresponding state
```

#### On Save (FormBuilderData → ProductTypes)

```typescript
const productData: Partial<ProductTypes> = {
  id: formData.id,
  name: formData.name,
  description: formData.description,
  basePrice: 0, // Could be calculated from parameters
  currencyType: formData.currency,
  formData: JSON.stringify({
    parameters: formData.parameters,
    currency: formData.currency,
    fileConnections: formData.fileConnections,
    selectedFileType: formData.selectedFileType,
    fileTypeMap: formData.fileTypeMap,
    formValues: formData.formValues,
  }),
  createdAt: formData.createdAt
    ? new Date(formData.createdAt).getTime()
    : Date.now(),
  lastModified: Date.now(),
};
```

### 4. API Endpoint Updates

- **Save endpoint**: Uses `/api/products` (POST for new, PUT for existing)
- **Load endpoint**: Changed from `/api/forms/{id}` to `/api/products/{id}`
- **Request/Response**: Now handles `ProductTypes` format instead of `FormBuilderData`

### 5. Response Handling

- Transforms API response from `ProductTypes` back to `FormBuilderData` for internal state management
- Maintains existing component behavior while supporting new data structure

## Usage Examples

### 1. Edit Existing Product

```tsx
import QuoteFormBuilder from '@/components/QuoteformBuilder';
import type { ProductTypes } from '@/lib/product.d';

const existingProduct: ProductTypes = {
  id: "product_123",
  name: "Custom 3D Print",
  description: "Professional 3D printing service",
  basePrice: 25.99,
  currencyType: "USD",
  formData: JSON.stringify({
    parameters: [...],
    currency: "USD",
    // ... other FormBuilderData fields
  }),
  createdAt: 1706184000000,
  lastModified: 1706270400000,
};

function EditProduct() {
  return <QuoteFormBuilder product={existingProduct} />;
}
```

### 2. Create New Product

```tsx
function CreateProduct() {
  return <QuoteFormBuilder />; // No props = new product mode
}
```

### 3. Load from API

```tsx
function ProductEditor({ productId }: { productId: string }) {
  const [product, setProduct] = useState<ProductTypes | null>(null);

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((res) => res.json())
      .then(setProduct);
  }, [productId]);

  return product ? (
    <QuoteFormBuilder product={product} />
  ) : (
    <div>Loading...</div>
  );
}
```

### 4. Edit Product with Empty FormData

```tsx
const newProduct: ProductTypes = {
  id: "product_456",
  name: "Business Cards",
  description: "Professional business card printing",
  basePrice: 19.99,
  currencyType: "EUR",
  formData: "", // Empty - will use defaults
  createdAt: 1706184000000,
  lastModified: 1706270400000,
};

function EditNewProduct() {
  return <QuoteFormBuilder product={newProduct} />;
  // Will use EUR currency from product, but default parameters
}
```

### 5. Edit Product with Corrupted FormData

```tsx
const corruptedProduct: ProductTypes = {
  id: "product_789",
  name: "Posters",
  description: "Large format poster printing",
  basePrice: 45.99,
  currencyType: "USD",
  formData: `{"parameters": [invalid json...`, // Malformed JSON
  createdAt: 1706184000000,
  lastModified: 1706270400000,
};

function EditCorruptedProduct() {
  return <QuoteFormBuilder product={corruptedProduct} />;
  // Will gracefully fall back to defaults, show warning in console
}
```

### 6. Load from API with Error Handling

```tsx
function ProductEditor({ productId }: { productId: string }) {
  const [product, setProduct] = useState<ProductTypes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((res) => res.json())
      .then(setProduct)
      .catch((err) => console.error("Failed to load:", err))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <div>Loading...</div>;

  return product ? (
    <QuoteFormBuilder product={product} />
  ) : (
    <div>Product not found</div>
  );
}
```

## Data Structure Mapping

| ProductTypes Field         | FormBuilderData Field    | Component State           |
| -------------------------- | ------------------------ | ------------------------- |
| `id`                       | `id`                     | `lastSavedData.id`        |
| `name`                     | `name`                   | `formName`                |
| `description`              | `description`            | `formDescription`         |
| `currencyType`             | `currency`               | `selectedCurrency`        |
| `createdAt` (timestamp)    | `createdAt` (ISO string) | `lastSavedData.createdAt` |
| `lastModified` (timestamp) | `updatedAt` (ISO string) | `lastSavedData.updatedAt` |
| `formData` (JSON string)   | All other fields         | Various state variables   |

## FormData JSON Structure

The `formData` field in `ProductTypes` contains a JSON string with the following structure:

```typescript
{
  parameters: Parameter[];
  currency: CurrencyType;
  fileConnections: FileUploadConnection[];
  selectedFileType: string;
  fileTypeMap: string[];
  formValues: FormValues;
}
```

## Backward Compatibility

- Component works without props (creates new product)
- Existing functionality remains unchanged
- All existing features (parameters, pricing, file upload, etc.) work identically
- Save/load operations now use ProductTypes format but component behavior is consistent

## Error Handling

- **Null/Empty formData**: Component gracefully handles null or empty `formData` strings by using default values
- **Invalid JSON**: JSON parsing errors are caught and logged, component falls back to defaults
- **Missing Fields**: If parsed JSON is missing expected fields, defaults are used for those fields
- **Type Safety**: All transformations maintain TypeScript type safety with proper fallbacks
- **User Experience**: Parsing failures are invisible to users - component continues with sensible defaults

### FormData Parsing Logic

```typescript
// Always set basic product info first
setFormName(product.name);
setFormDescription(product.description);

// Initialize with safe defaults
let parsedFormData = {
  parameters: [],
  currency: (product.currencyType as CurrencyType) || "USD",
  fileConnections: [],
  selectedFileType: "pdf",
  fileTypeMap: defaultFileTypeMap["pdf"],
  formValues: { quantity: "1" },
};

// Only attempt parsing if formData exists and is not empty
if (product.formData && product.formData.trim() !== "") {
  try {
    const parsed = JSON.parse(product.formData);
    // Merge with defaults, keeping defaults for missing fields
    parsedFormData = { ...parsedFormData, ...parsed };
  } catch (error) {
    console.warn("Failed to parse formData, using defaults:", error);
    // Continue with defaults
  }
}
```

## Implementation Notes

1. **Optional Props**: The `product` prop is optional, maintaining backward compatibility
2. **State Initialization**: Uses `useEffect` to initialize state only when `product` prop is provided
3. **Data Validation**: JSON parsing includes error handling for malformed data
4. **Type Safety**: All transformations maintain TypeScript type safety
5. **Change Tracking**: Properly initializes `lastSavedData` for change detection
