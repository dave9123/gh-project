/**
 * Test scenarios for QuoteFormBuilder with ProductTypes integration
 * Demonstrates how the component handles different formData conditions
 */

import React from "react";
import QuoteFormBuilder from "./QuoteformBuilder";
import type { ProductTypes } from "@/lib/product.d";

// Scenario 1: Product with complete formData
const productWithCompleteData: ProductTypes = {
  id: "product_complete",
  name: "Premium T-Shirt Printing",
  description: "High-quality custom t-shirt printing service",
  basePrice: 15.99,
  currencyType: "USD",
  formData: JSON.stringify({
    parameters: [
      {
        id: "param_quantity",
        name: "quantity",
        label: "Quantity",
        type: "NumericValue",
        required: true,
        min: 1,
        step: 1,
        unit: "pieces",
        pricing: {},
        hasSubParameters: false,
        pricingScope: "per_unit",
      },
      {
        id: "param_size",
        name: "size",
        label: "T-Shirt Size",
        type: "FixedOption",
        required: true,
        displayType: "select",
        options: [
          { label: "Small", value: "S", pricing: { base_price: 0 } },
          { label: "Medium", value: "M", pricing: { base_price: 0 } },
          { label: "Large", value: "L", pricing: { base_price: 2 } },
          { label: "XL", value: "XL", pricing: { base_price: 4 } },
        ],
        pricing: {},
        hasSubParameters: false,
        pricingScope: "per_unit",
      },
    ],
    currency: "USD",
    fileConnections: [],
    selectedFileType: "images",
    fileTypeMap: [".jpg", ".png", ".gif"],
    formValues: { quantity: "1", size: "M" },
  }),
  createdAt: Date.now() - 86400000, // 1 day ago
  lastModified: Date.now() - 3600000, // 1 hour ago
};

// Scenario 2: Product with empty formData
const productWithEmptyData: ProductTypes = {
  id: "product_empty",
  name: "Basic Flyer Printing",
  description: "Simple flyer printing service - not configured yet",
  basePrice: 5.99,
  currencyType: "USD",
  formData: "", // Empty string
  createdAt: Date.now() - 172800000, // 2 days ago
  lastModified: Date.now() - 7200000, // 2 hours ago
};

// Scenario 3: Product with null formData
const productWithNullData: ProductTypes = {
  id: "product_null",
  name: "Business Card Printing",
  description: "Professional business card printing - setup pending",
  basePrice: 29.99,
  currencyType: "EUR",
  formData: null as any, // Simulating null formData
  createdAt: Date.now() - 259200000, // 3 days ago
  lastModified: Date.now() - 10800000, // 3 hours ago
};

// Scenario 4: Product with invalid JSON in formData
const productWithInvalidData: ProductTypes = {
  id: "product_invalid",
  name: "Poster Printing",
  description: "Large format poster printing - corrupted configuration",
  basePrice: 45.99,
  currencyType: "USD",
  formData: `{
    "parameters": [
      {
        "id": "param_size",
        "name": "size"
        // Missing comma and invalid JSON structure
        "type": "FixedOption"
      }
    ]
    // Missing proper closing
  `, // Invalid JSON
  createdAt: Date.now() - 345600000, // 4 days ago
  lastModified: Date.now() - 14400000, // 4 hours ago
};

// Test component that demonstrates all scenarios
export default function QuoteFormBuilderTests() {
  const [currentScenario, setCurrentScenario] =
    React.useState<string>("complete");

  const scenarios = {
    complete: {
      product: productWithCompleteData,
      title: "Complete formData",
      description:
        "Product with valid JSON formData containing parameters and configuration",
    },
    empty: {
      product: productWithEmptyData,
      title: "Empty formData",
      description: "Product with empty string formData - should use defaults",
    },
    null: {
      product: productWithNullData,
      title: "Null formData",
      description:
        "Product with null formData - should use defaults with EUR currency",
    },
    invalid: {
      product: productWithInvalidData,
      title: "Invalid JSON formData",
      description:
        "Product with malformed JSON - should gracefully fallback to defaults",
    },
    new: {
      product: undefined,
      title: "New Product",
      description: "No product data provided - should create new product",
    },
  };

  const currentTest = scenarios[currentScenario as keyof typeof scenarios];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">
          QuoteFormBuilder Test Scenarios
        </h1>
        <p className="text-muted-foreground mb-4">
          Test how the component handles different ProductTypes data conditions
        </p>

        {/* Scenario Selector */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-3">Test Scenarios:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(scenarios).map(([key, scenario]) => (
              <button
                key={key}
                onClick={() => setCurrentScenario(key)}
                className={`p-3 rounded-lg text-left border transition-colors ${
                  currentScenario === key
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium">{scenario.title}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {scenario.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Current Test Info */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">
            Current Test: {currentTest.title}
          </h3>
          <p className="text-blue-700 mb-3">{currentTest.description}</p>

          {currentTest.product && (
            <div className="text-sm text-blue-600">
              <div>
                <strong>Product ID:</strong> {currentTest.product.id}
              </div>
              <div>
                <strong>Name:</strong> {currentTest.product.name}
              </div>
              <div>
                <strong>Currency:</strong> {currentTest.product.currencyType}
              </div>
              <div>
                <strong>FormData Status:</strong>{" "}
                {currentTest.product.formData === null
                  ? "null"
                  : currentTest.product.formData === ""
                  ? "empty string"
                  : currentTest.product.formData.length > 100
                  ? `${currentTest.product.formData.length} characters (${
                      currentScenario === "invalid"
                        ? "invalid JSON"
                        : "valid JSON"
                    })`
                  : "short content"}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Component Under Test */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <h3 className="font-semibold mb-4">QuoteFormBuilder Component:</h3>
        <QuoteFormBuilder
          key={currentScenario} // Force re-mount for each scenario
          product={currentTest.product}
        />
      </div>

      {/* Expected Behavior */}
      <div className="mt-6 bg-green-50 p-4 rounded-lg">
        <h3 className="font-semibold text-green-800 mb-2">
          Expected Behavior:
        </h3>
        <div className="text-green-700 text-sm">
          {currentScenario === "complete" && (
            <ul className="space-y-1">
              <li>• Should load all parameters from formData</li>
              <li>• Should use USD currency</li>
              <li>• Should set file type to 'images'</li>
              <li>• Should pre-fill form with quantity=1, size=M</li>
              <li>• Should show as 'saved' status</li>
            </ul>
          )}
          {(currentScenario === "empty" || currentScenario === "null") && (
            <ul className="space-y-1">
              <li>• Should use product name and description</li>
              <li>• Should use currency from product.currencyType</li>
              <li>• Should initialize with empty parameters array</li>
              <li>• Should use default file type 'pdf'</li>
              <li>• Should have default formValues (quantity: "1")</li>
              <li>• Should show warning in console but continue gracefully</li>
            </ul>
          )}
          {currentScenario === "invalid" && (
            <ul className="space-y-1">
              <li>• Should catch JSON parse error gracefully</li>
              <li>• Should use product name and description</li>
              <li>• Should fallback to default configuration</li>
              <li>• Should show warning in console about parse failure</li>
              <li>• Should not crash or show error to user</li>
            </ul>
          )}
          {currentScenario === "new" && (
            <ul className="space-y-1">
              <li>• Should start with empty form</li>
              <li>• Should use USD as default currency</li>
              <li>• Should have no parameters initially</li>
              <li>• Should be ready for creating new product</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
