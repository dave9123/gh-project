/**
 * Example usage of QuoteFormBuilder component with ProductTypes props
 *
 * This example demonstrates how to use the QuoteFormBuilder component
 * with a ProductTypes object as props to load existing product configurations.
 */

import React, { useState, useEffect } from "react";
import QuoteFormBuilder from "./QuoteformBuilder";
import type { ProductTypes } from "@/lib/product.d";

// Example ProductTypes data
const exampleProduct: ProductTypes = {
  id: "product_123",
  name: "Custom 3D Printing Service",
  description: "Professional 3D printing with multiple material options",
  basePrice: 25.99,
  currencyType: "USD",
  formData: JSON.stringify({
    parameters: [
      {
        id: "param_quantity_2025",
        name: "quantity",
        label: "Quantity",
        type: "NumericValue",
        required: true,
        min: 1,
        step: 1,
        unit: "units",
        pricing: {},
        hasSubParameters: false,
        pricingScope: "per_unit",
      },
      {
        id: "param_material_2025",
        name: "material",
        label: "Print Material",
        type: "FixedOption",
        required: true,
        displayType: "select",
        options: [
          {
            label: "PLA (Standard)",
            value: "pla",
            description: "Easy to print, biodegradable",
            pricing: { base_price: 15, multiplier: 1.0 },
          },
          {
            label: "ABS (Durable)",
            value: "abs",
            description: "Strong and heat resistant",
            pricing: { base_price: 20, multiplier: 1.2 },
          },
        ],
        pricing: {},
        hasSubParameters: false,
        pricingScope: "per_unit",
      },
    ],
    currency: "USD",
    fileConnections: [],
    selectedFileType: "3d",
    fileTypeMap: [".stl", ".obj", ".ply"],
    formValues: { quantity: "1", material: "pla" },
  }),
  createdAt: 1706184000000, // Jan 25, 2024
  lastModified: 1706270400000, // Jan 26, 2024
};

// Example 1: Using the component with product data
export function QuoteFormBuilderWithProduct() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Product Configuration</h1>
      <QuoteFormBuilder product={exampleProduct} />
    </div>
  );
}

// Example 2: Using the component without product data (new product)
export function QuoteFormBuilderNew() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create New Product</h1>
      <QuoteFormBuilder />
    </div>
  );
}

// Example 3: Loading product data from an API call
export function QuoteFormBuilderFromAPI({ productId }: { productId: string }) {
  const [product, setProduct] = useState<ProductTypes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        if (response.ok) {
          const productData = await response.json();
          setProduct(productData);
        }
      } catch (error) {
        console.error("Failed to load product:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  if (loading) {
    return <div>Loading product...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">
        {product ? "Edit Product" : "Product Not Found"}
      </h1>
      {product ? (
        <QuoteFormBuilder product={product} />
      ) : (
        <div>Product not found</div>
      )}
    </div>
  );
}

export default QuoteFormBuilderWithProduct;
