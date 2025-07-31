"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  AlertTriangle,
  Upload,
  Package,
  Plus,
  Minus,
  Copy,
  Trash2,
  FileText,
  ArrowLeft,
  ShoppingCart,
  Download,
} from "lucide-react";
import NumberFlow from "@number-flow/react";
import { extractMockFileMetadata } from "@/lib/fileMetadataUtils";
import type {
  Parameter,
  ParameterType,
  FixedOption,
  SubOption,
} from "@/lib/formBuilderTypes";
import type { ProductTypes, FileUploadConnection } from "@/lib/product.d";

type CurrencyType = "USD" | "IDR";

interface CurrencyConfig {
  symbol: string;
  code: string;
  name: string;
}

interface FormValues {
  [key: string]: any;
}

interface ProductItem {
  id: string;
  product: ProductTypes;
  formValues: FormValues;
  quantity: number;
  uploadedFile?: File;
  fileMetadata?: any;
  priceBreakdown: Array<{
    parameter: string;
    description: string;
    amount: number;
  }>;
  totalPrice: number;
}

interface ModernOrderUIProps {
  availableProducts: ProductTypes[];
  currency?: CurrencyType;
  onBack?: () => void;
  onAddToCart?: (items: ProductItem[]) => void;
  className?: string;
}

// Currency configurations
const currencies: Record<CurrencyType, CurrencyConfig> = {
  USD: {
    symbol: "$",
    code: "USD",
    name: "US Dollar",
  },
  IDR: {
    symbol: "Rp",
    code: "IDR",
    name: "Indonesian Rupiah",
  },
};

// Safe expression evaluator for basic math operations
const evaluateExpression = (expression: string): number => {
  try {
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, "");
    const func = new Function("return " + sanitized);
    const result = func();
    return typeof result === "number" && !isNaN(result) ? result : 0;
  } catch (e) {
    return 0;
  }
};

export default function ModernOrderUI({
  availableProducts = [],
  currency = "USD",
  onBack,
  onAddToCart,
  className = "",
}: ModernOrderUIProps) {
  const [productItems, setProductItems] = useState<ProductItem[]>([]);

  // Add a new product item
  const addProductItem = (product: ProductTypes) => {
    const newItem: ProductItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      product,
      formValues: { quantity: "1" },
      quantity: 1,
      priceBreakdown: [],
      totalPrice: 0,
    };
    setProductItems([...productItems, newItem]);
  };

  // Remove a product item
  const removeProductItem = (itemId: string) => {
    setProductItems(productItems.filter((item) => item.id !== itemId));
  };

  // Duplicate a product item
  const duplicateProductItem = (itemId: string) => {
    const item = productItems.find((item) => item.id === itemId);
    if (item) {
      const duplicatedItem: ProductItem = {
        ...item,
        id: `item-${Date.now()}-${Math.random()}`,
        uploadedFile: undefined, // Don't duplicate the file
        fileMetadata: undefined,
      };
      setProductItems([...productItems, duplicatedItem]);
    }
  };

  // Update product item
  const updateProductItem = (itemId: string, updates: Partial<ProductItem>) => {
    setProductItems((items) =>
      items.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
    );
  };

  // Calculate price for a specific item
  const calculateItemPrice = (item: ProductItem) => {
    const parameters = item.product.formData?.parameters || [];
    let unitTotal = 0;
    const breakdown: Array<{
      parameter: string;
      description: string;
      amount: number;
    }> = [];

    const quantity = Number.parseFloat(item.formValues.quantity) || 1;
    const calculatedValues = { ...item.formValues };

    // Helper function to check parameter visibility
    const isParameterVisible = (param: Parameter): boolean => {
      if (!param.conditional) return true;
      const parentValue = calculatedValues[param.conditional.parentParameter];
      return param.conditional.showWhen.includes(parentValue);
    };

    // Calculate derived values - only for visible parameters
    const derivedParams = parameters.filter(
      (p) => p.type === "DerivedCalc" && isParameterVisible(p)
    );
    const sortedDerivedParams = [...derivedParams].sort((a, b) => {
      const aDeps = a.dependencies || [];
      const bDeps = b.dependencies || [];
      if (aDeps.length === 0 && bDeps.length > 0) return -1;
      if (bDeps.length === 0 && aDeps.length > 0) return 1;
      if (aDeps.includes(b.name)) return 1;
      if (bDeps.includes(a.name)) return -1;
      return 0;
    });

    sortedDerivedParams.forEach((param) => {
      if (param.formula && param.dependencies) {
        try {
          let formula = param.formula;
          let hasAllDependencies = true;

          param.dependencies.forEach((dep) => {
            const value = Number.parseFloat(calculatedValues[dep]);
            if (isNaN(value)) {
              hasAllDependencies = false;
              return;
            }
            formula = formula.replace(
              new RegExp(`\\b${dep}\\b`, "g"),
              value.toString()
            );
          });

          if (hasAllDependencies) {
            const result = evaluateExpression(formula);
            calculatedValues[param.name] = result;
          } else {
            calculatedValues[param.name] = 0;
          }
        } catch (e) {
          calculatedValues[param.name] = 0;
        }
      }
    });

    // Get the main units parameter value
    const mainUnitsParam = parameters.find((p) => p.isMainUnits);
    const mainUnitsValue = mainUnitsParam
      ? Number.parseFloat(calculatedValues[mainUnitsParam.name]) || 0
      : 1;

    // Calculate unit price for each parameter
    parameters
      .filter((param) => param.name !== "quantity" && isParameterVisible(param))
      .forEach((param) => {
        const value = calculatedValues[param.name];
        if (value === undefined || value === null || value === "") return;

        let paramTotal = 0;
        let description = "";

        if (param.pricing?.base_price) {
          paramTotal += param.pricing.base_price;
          description += `Base: ${currencies[currency].symbol}${param.pricing.base_price} per item`;
        }

        if (param.type === "FixedOption") {
          const selectedOption = param.options?.find(
            (opt) => opt.value === value
          );
          if (selectedOption) {
            if (selectedOption.pricing?.base_price) {
              paramTotal += selectedOption.pricing.base_price;
              description +=
                (description ? " + " : "") +
                `Option: ${currencies[currency].symbol}${selectedOption.pricing.base_price} per item`;
            }
            if (selectedOption.pricing?.unit_price) {
              const unitCost =
                selectedOption.pricing.unit_price * mainUnitsValue;
              paramTotal += unitCost;
              description +=
                (description ? " + " : "") +
                `${currencies[currency].symbol}${
                  selectedOption.pricing.unit_price
                } × ${mainUnitsValue} ${mainUnitsParam?.unit || "units"}`;
            }
            if (selectedOption.pricing?.multiplier) {
              paramTotal *= selectedOption.pricing.multiplier;
              description +=
                (description ? " × " : "") +
                `${selectedOption.pricing.multiplier}`;
            }

            // Handle sub-options pricing
            if (selectedOption.subOptions) {
              selectedOption.subOptions.forEach((subOption) => {
                const subOptionValue =
                  calculatedValues[`${param.name}_${subOption.value}`];
                if (subOptionValue && subOption.price) {
                  let subOptionTotal = 0;
                  let subDescription = "";

                  if (subOption.pricingScope === "per_qty") {
                    subOptionTotal += subOption.price;
                    subDescription += `${subOption.label}: ${currencies[currency].symbol}${subOption.price} per item`;
                  } else {
                    const unitCost = subOption.price * mainUnitsValue;
                    subOptionTotal += unitCost;
                    subDescription += `${subOption.label}: ${
                      currencies[currency].symbol
                    }${subOption.price} × ${mainUnitsValue} ${
                      mainUnitsParam?.unit || "units"
                    }`;
                  }

                  if (subOptionTotal > 0) {
                    paramTotal += subOptionTotal;
                    description +=
                      (description ? " + " : "") + `[${subDescription}]`;
                  }
                }
              });
            }
          }
        } else if (
          param.type === "NumericValue" ||
          param.type === "DerivedCalc"
        ) {
          const numValue = Number.parseFloat(value) || 0;
          const unitsPerQty = param.unitsPerQuantity || 1;
          const totalUnits = numValue * unitsPerQty;

          if (param.pricing?.unit_price) {
            const unitCost =
              totalUnits * param.pricing.unit_price * mainUnitsValue;
            paramTotal += unitCost;
            description +=
              (description ? " + " : "") +
              `${totalUnits} ${param.unit || "units"} × ${
                currencies[currency].symbol
              }${param.pricing.unit_price} × ${mainUnitsValue} ${
                mainUnitsParam?.unit || "main units"
              }`;
          }

          if (
            param.pricing?.step_pricing &&
            totalUnits > param.pricing.step_pricing.threshold
          ) {
            const steps = Math.floor(
              totalUnits - param.pricing.step_pricing.threshold
            );
            const stepCost = steps * param.pricing.step_pricing.step_amount;
            paramTotal += stepCost;
            description +=
              (description ? " + " : "") +
              `${steps} steps × ${currencies[currency].symbol}${param.pricing.step_pricing.step_amount}`;
          }

          if (param.pricing?.multiplier) {
            paramTotal *= param.pricing.multiplier;
            description +=
              (description ? " × " : "") + `${param.pricing.multiplier}`;
          }
        }

        if (paramTotal > 0) {
          breakdown.push({
            parameter: param.label || param.name,
            description: `${description}`,
            amount: paramTotal,
          });
          unitTotal += paramTotal;
        }
      });

    const finalTotal = unitTotal * quantity;
    return { totalPrice: finalTotal, priceBreakdown: breakdown };
  };

  // Update form value for an item
  const updateFormValue = (itemId: string, name: string, value: any) => {
    const item = productItems.find((item) => item.id === itemId);
    if (!item) return;

    const parameters = item.product.formData?.parameters || [];
    const newFormValues = { ...item.formValues, [name]: value };

    // Calculate derived values that depend on this parameter
    const derivedParams = parameters.filter(
      (p) => p.type === "DerivedCalc" && p.dependencies?.includes(name)
    );

    // Handle dependencies
    let hasChanges = true;
    let iterations = 0;
    const maxIterations = 10;

    while (hasChanges && iterations < maxIterations) {
      hasChanges = false;
      iterations++;

      derivedParams.forEach((param) => {
        if (param.formula && param.dependencies) {
          try {
            let formula = param.formula;
            let hasAllDependencies = true;

            param.dependencies.forEach((dep) => {
              const depValue =
                dep === name
                  ? Number.parseFloat(value) || 0
                  : Number.parseFloat(newFormValues[dep]);

              if (isNaN(depValue)) {
                hasAllDependencies = false;
                return;
              }

              formula = formula.replace(
                new RegExp(`\\b${dep}\\b`, "g"),
                depValue.toString()
              );
            });

            if (hasAllDependencies) {
              const result = evaluateExpression(formula);
              const currentValue = newFormValues[param.name];
              if (currentValue !== result) {
                newFormValues[param.name] = result;
                hasChanges = true;
              }
            } else {
              if (newFormValues[param.name] !== 0) {
                newFormValues[param.name] = 0;
                hasChanges = true;
              }
            }
          } catch (e) {
            if (newFormValues[param.name] !== 0) {
              newFormValues[param.name] = 0;
              hasChanges = true;
            }
          }
        }
      });

      // Also check for any other derived params that might now have their dependencies satisfied
      const otherDerivedParams = parameters.filter(
        (p) =>
          p.type === "DerivedCalc" &&
          !derivedParams.includes(p) &&
          p.dependencies?.some((dep) => newFormValues.hasOwnProperty(dep))
      );

      otherDerivedParams.forEach((param) => {
        if (param.formula && param.dependencies) {
          try {
            let formula = param.formula;
            let hasAllDependencies = true;

            param.dependencies.forEach((dep) => {
              const depValue = Number.parseFloat(newFormValues[dep]);
              if (isNaN(depValue)) {
                hasAllDependencies = false;
                return;
              }

              formula = formula.replace(
                new RegExp(`\\b${dep}\\b`, "g"),
                depValue.toString()
              );
            });

            if (hasAllDependencies) {
              const result = evaluateExpression(formula);
              const currentValue = newFormValues[param.name];
              if (currentValue !== result) {
                newFormValues[param.name] = result;
                hasChanges = true;
              }
            }
          } catch (e) {
            // Error in calculation
          }
        }
      });
    }

    const updatedItem = { ...item, formValues: newFormValues };
    const pricing = calculateItemPrice(updatedItem);

    updateProductItem(itemId, {
      formValues: newFormValues,
      totalPrice: pricing.totalPrice,
      priceBreakdown: pricing.priceBreakdown,
    });
  };

  // Handle file upload with metadata extraction
  const handleFileUpload = async (itemId: string, file: File) => {
    try {
      const fileMetadata = await extractMockFileMetadata(file);

      updateProductItem(itemId, {
        uploadedFile: file,
        fileMetadata,
      });

      // Auto-apply file connections
      applyFileConnections(itemId, fileMetadata);
    } catch (error) {
      console.error("Error extracting file metadata:", error);
    }
  };

  // Apply file connections to update form values
  const applyFileConnections = (itemId: string, fileMetadata: any) => {
    const item = productItems.find((item) => item.id === itemId);
    if (!item) return;

    const productFileConnections = item.product.formData?.fileConnections || [];

    productFileConnections.forEach((connection) => {
      if (
        connection.metadataKey &&
        connection.parameterName &&
        fileMetadata[connection.metadataKey]
      ) {
        updateFormValue(
          itemId,
          connection.parameterName,
          fileMetadata[connection.metadataKey]
        );
      }
    });
  };

  // Get total cart value
  const getTotalCartValue = () => {
    return productItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  // Get total cart quantity
  const getTotalCartQuantity = () => {
    return productItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Recalculate prices when items change
  useEffect(() => {
    setProductItems((items) =>
      items.map((item) => {
        const pricing = calculateItemPrice(item);
        return {
          ...item,
          totalPrice: pricing.totalPrice,
          priceBreakdown: pricing.priceBreakdown,
        };
      })
    );
  }, [currency]);

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${className}`}
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            {onBack && (
              <Button
                variant="outline"
                onClick={onBack}
                className="flex items-center gap-2 h-10"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Configure Your Order
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Choose products and customize your specifications
              </p>
            </div>
          </div>

          {/* Cart Summary */}
          {productItems.length > 0 && (
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 shadow-lg">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="text-center sm:text-left">
                    <div className="text-xl sm:text-2xl font-bold text-primary flex items-center justify-center sm:justify-start gap-1">
                      {currencies[currency].symbol}
                      <NumberFlow value={getTotalCartValue()} />
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {getTotalCartQuantity()} item
                      {getTotalCartQuantity() !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => onAddToCart?.(productItems)}
                    className="flex items-center gap-2 h-10 px-6"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar - Product Selection & File Connections */}
          <div className="lg:col-span-1 space-y-6">
            {/* Add Products */}
            <Card className="shadow-sm border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-5 h-5 bg-primary/10 rounded flex items-center justify-center">
                    <Package className="w-3 h-3 text-primary" />
                  </div>
                  Add Products
                </CardTitle>
                <CardDescription className="text-sm">
                  Choose from available products
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {availableProducts.map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    className="w-full justify-start h-auto p-4 hover:bg-primary/5 hover:border-primary/20 transition-colors group"
                    onClick={() => addProductItem(product)}
                  >
                    <div className="text-left w-full">
                      <div className="font-medium text-sm group-hover:text-primary transition-colors">
                        {product.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {product.description}
                      </div>
                      <div className="text-sm font-semibold text-primary mt-2">
                        {currencies[currency].symbol}
                        {product.basePrice}
                      </div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* File Integration */}
            <Card className="shadow-sm border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <div className="w-5 h-5 bg-primary/10 rounded flex items-center justify-center">
                    <FileText className="w-3 h-3 text-primary" />
                  </div>
                  File Integration
                </CardTitle>
                <CardDescription className="text-sm">
                  Automatic metadata mapping for uploaded files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {productItems.length > 0 ? (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Active Connections
                    </Label>
                    {productItems[0].product.formData?.fileConnections?.length >
                    0 ? (
                      productItems[0].product.formData.fileConnections.map(
                        (connection, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2 bg-gray-50/50 dark:bg-gray-800/50"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                                Connection {index + 1}
                              </span>
                            </div>
                            <div className="text-sm space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-xs">
                                  Metadata:
                                </span>
                                <span className="font-medium text-xs capitalize bg-white dark:bg-gray-900 px-2 py-1 rounded border">
                                  {connection.metadataKey
                                    .replace(/([A-Z])/g, " $1")
                                    .toLowerCase()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground text-xs">
                                  Parameter:
                                </span>
                                <span className="font-medium text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded border">
                                  {productItems[0].product.formData?.parameters?.find(
                                    (p) => p.name === connection.parameterName
                                  )?.label || connection.parameterName}
                                </span>
                              </div>
                              {connection.description && (
                                <div className="text-xs text-muted-foreground mt-2 p-2 bg-white/50 dark:bg-gray-900/50 rounded border">
                                  {connection.description}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <FileText className="w-6 h-6 opacity-50" />
                        </div>
                        <p className="text-sm">
                          No file connections configured for this product
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Package className="w-6 h-6 opacity-50" />
                    </div>
                    <p className="text-sm">
                      Add a product to see file connections
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Product Items */}
          <div className="lg:col-span-3 space-y-6">
            {productItems.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300 dark:border-gray-600 shadow-sm">
                <CardContent className="py-12 px-6">
                  <div className="text-center text-muted-foreground">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Package className="w-8 h-8 opacity-50" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      No products added yet
                    </h3>
                    <p className="text-sm max-w-sm mx-auto">
                      Choose a product from the sidebar to get started with your
                      order configuration
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              productItems.map((item) => (
                <ProductItemCard
                  key={item.id}
                  item={item}
                  currency={currency}
                  currencies={currencies}
                  onUpdateFormValue={(name, value) =>
                    updateFormValue(item.id, name, value)
                  }
                  onFileUpload={(file) => handleFileUpload(item.id, file)}
                  onDuplicate={() => duplicateProductItem(item.id)}
                  onRemove={() => removeProductItem(item.id)}
                  onQuantityChange={(quantity) => {
                    updateProductItem(item.id, { quantity });
                    updateFormValue(item.id, "quantity", quantity.toString());
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Product Item Card Component
interface ProductItemCardProps {
  item: ProductItem;
  currency: CurrencyType;
  currencies: Record<CurrencyType, CurrencyConfig>;
  onUpdateFormValue: (name: string, value: any) => void;
  onFileUpload: (file: File) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
}

function ProductItemCard({
  item,
  currency,
  currencies,
  onUpdateFormValue,
  onFileUpload,
  onDuplicate,
  onRemove,
  onQuantityChange,
}: ProductItemCardProps) {
  const parameters = item.product.formData?.parameters || [];

  const handleFileUploadChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const isParameterVisible = (param: Parameter): boolean => {
    if (!param.conditional) return true;
    const parentValue = item.formValues[param.conditional.parentParameter];
    return param.conditional.showWhen.includes(parentValue);
  };

  return (
    <Card className="overflow-hidden shadow-sm border-gray-200 dark:border-gray-700">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg xl:text-xl truncate">
                {item.product.name}
              </CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {item.product.description}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              className="h-8 w-8 p-0"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRemove}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Product Preview & Controls */}
          <div className="space-y-6">
            {/* Quantity Controls */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantity
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onQuantityChange(Math.max(1, item.quantity - 1))
                  }
                  className="h-9 w-9 p-0"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-20 text-center h-9"
                  min="1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onQuantityChange(item.quantity + 1)}
                  className="h-9 w-9 p-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Upload File
              </Label>
              <Button variant="outline" className="w-full h-10" asChild>
                <label
                  htmlFor={`file-upload-${item.id}`}
                  className="cursor-pointer flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {item.uploadedFile ? "Change File" : "Upload File"}
                </label>
              </Button>
              <input
                id={`file-upload-${item.id}`}
                type="file"
                className="hidden"
                onChange={handleFileUploadChange}
                accept=".stl,.obj,.3mf,.ply,.pdf,.jpg,.png,.gif"
              />
              {item.uploadedFile && (
                <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
                  <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {item.uploadedFile.name}
                  </div>
                  {item.fileMetadata && (
                    <div className="space-y-2">
                      {Object.entries(item.fileMetadata)
                        .slice(0, 3)
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between items-center"
                          >
                            <span className="capitalize text-gray-600 dark:text-gray-400">
                              {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                            </span>
                            <span className="font-mono text-gray-900 dark:text-gray-100">
                              {typeof value === "number"
                                ? value.toLocaleString()
                                : String(value)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Middle Column - Form Parameters */}
          <div className="space-y-6">
            {parameters
              .filter((param) => isParameterVisible(param))
              .map((param) => (
                <div key={param.id} className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {param.label || param.name}
                      {param.unit && (
                        <span className="text-muted-foreground ml-1 font-normal">
                          ({param.unit})
                        </span>
                      )}
                    </Label>
                    <div className="flex gap-1">
                      {param.required && (
                        <Badge variant="destructive" className="text-xs h-5">
                          Required
                        </Badge>
                      )}
                      {param.isMainUnits && (
                        <Badge variant="default" className="text-xs h-5">
                          Main Units
                        </Badge>
                      )}
                    </div>
                  </div>

                  {param.description && (
                    <p className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                      {param.description}
                    </p>
                  )}

                  {param.type === "FixedOption" && param.options && (
                    <Select
                      value={item.formValues[param.name] || ""}
                      onValueChange={(value) =>
                        onUpdateFormValue(param.name, value)
                      }
                    >
                      <SelectTrigger className="w-full h-10">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent className="max-w-[400px]">
                        {param.options
                          .filter(
                            (option) =>
                              option.value && option.value.trim() !== ""
                          )
                          .map((option, index) => (
                            <SelectItem
                              key={`${param.id}-${index}`}
                              value={option.value}
                              className="py-3"
                            >
                              <div className="flex flex-col min-w-0 w-full">
                                <span className="truncate font-medium text-sm">
                                  {option.label}
                                </span>
                                {option.description && (
                                  <span className="text-xs text-muted-foreground truncate mt-1">
                                    {option.description}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}

                  {/* Sub-options for selected FixedOption */}
                  {param.type === "FixedOption" &&
                    (() => {
                      const selectedOption = param.options?.find(
                        (opt) => opt.value === item.formValues[param.name]
                      );
                      const mainUnitsParam = parameters.find(
                        (p) => p.isMainUnits
                      );

                      return selectedOption?.subOptions &&
                        selectedOption.subOptions.length > 0 ? (
                        <div className="space-y-3 mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {selectedOption.label} Options
                          </Label>
                          <div className="space-y-3">
                            {selectedOption.subOptions.map((subOption) => (
                              <div
                                key={subOption.id}
                                className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                              >
                                <input
                                  type="checkbox"
                                  id={`${param.name}_${subOption.value}`}
                                  checked={
                                    item.formValues[
                                      `${param.name}_${subOption.value}`
                                    ] || false
                                  }
                                  onChange={(e) =>
                                    onUpdateFormValue(
                                      `${param.name}_${subOption.value}`,
                                      e.target.checked
                                    )
                                  }
                                  className="rounded border-gray-300 mt-1"
                                />
                                <Label
                                  htmlFor={`${param.name}_${subOption.value}`}
                                  className="text-sm cursor-pointer flex-1 space-y-2"
                                >
                                  <div className="flex justify-between items-start">
                                    <span className="font-medium">
                                      {subOption.label}
                                    </span>
                                    {subOption.price && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs ml-2 shrink-0"
                                      >
                                        +{currencies[currency].symbol}
                                        {subOption.price}
                                        {subOption.pricingScope === "per_qty"
                                          ? " per item"
                                          : ` per ${
                                              mainUnitsParam?.unit || "unit"
                                            }`}
                                      </Badge>
                                    )}
                                  </div>
                                  {subOption.description && (
                                    <div className="text-xs text-muted-foreground">
                                      {subOption.description}
                                    </div>
                                  )}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}

                  {param.type === "NumericValue" && (
                    <Input
                      type="number"
                      value={item.formValues[param.name] || ""}
                      onChange={(e) =>
                        onUpdateFormValue(param.name, e.target.value)
                      }
                      placeholder="Enter value"
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      className="h-10"
                    />
                  )}

                  {param.type === "DerivedCalc" && (
                    <div className="space-y-2">
                      <Input
                        value={
                          typeof item.formValues[param.name] === "number"
                            ? item.formValues[param.name].toFixed(2)
                            : item.formValues[param.name] || "0.00"
                        }
                        disabled
                        className="bg-gray-50 dark:bg-gray-800 font-mono h-10 text-center"
                      />
                      {param.formula && (
                        <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                          <span className="font-medium">Formula:</span>{" "}
                          {param.formula}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>

          {/* Right Column - Price Breakdown */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Price Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.priceBreakdown.length > 0 ? (
                  <>
                    {item.priceBreakdown.map((breakdown, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-start text-sm"
                      >
                        <div className="flex-1 mr-2">
                          <div className="font-medium">
                            {breakdown.parameter}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {breakdown.description}
                          </div>
                        </div>
                        <div className="font-mono text-right">
                          {currencies[currency].symbol}
                          <NumberFlow
                            value={breakdown.amount}
                            format={{
                              minimumFractionDigits: currency === "IDR" ? 0 : 2,
                              maximumFractionDigits: currency === "IDR" ? 0 : 2,
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    {item.quantity > 1 && (
                      <>
                        <Separator />
                        <div className="flex justify-between items-center text-sm">
                          <span>Quantity</span>
                          <span className="font-mono">× {item.quantity}</span>
                        </div>
                      </>
                    )}

                    <Separator />
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total</span>
                      <span className="font-mono text-primary">
                        {currencies[currency].symbol}
                        <NumberFlow
                          value={item.totalPrice}
                          format={{
                            minimumFractionDigits: currency === "IDR" ? 0 : 2,
                            maximumFractionDigits: currency === "IDR" ? 0 : 2,
                          }}
                        />
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Configure options to see pricing</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
