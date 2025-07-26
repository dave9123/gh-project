"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Upload,
  Package,
  Maximize2,
  Plus,
  Minus,
  Copy,
  Trash2,
} from "lucide-react";
import { FormDataT, ProductTypes } from "@/lib/product";

type ProductWithFormData = {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  currencyType: string;
  businessId: number;
  createdAt: string;
  lastModified: string;
  formData: FormDataT;
};

type OrderProductUIProps = {
  product: ProductTypes;
  onBack: () => void;
};

export function OrderProductUI({ product, onBack }: OrderProductUIProps) {
  const [quantity, setQuantity] = useState(1);
  const [weight, setWeight] = useState(23);
  const [formValues, setFormValues] = useState<Record<string, any>>(() => {
    // Initialize with default values
    const initialValues: Record<string, any> = {};

    // Set some example defaults based on the image
    product.formData.parameters?.forEach((param) => {
      if (
        param.type === "FixedOption" &&
        param.options &&
        param.options.length > 0
      ) {
        // Set default to first option or find specific defaults
        if (param.name?.toLowerCase().includes("technology")) {
          const fdmOption = param.options.find((opt) =>
            opt.label.toLowerCase().includes("fdm")
          );
          initialValues[param.id] = fdmOption?.value || param.options[0].value;
        } else if (param.name?.toLowerCase().includes("material")) {
          const plaOption = param.options.find((opt) =>
            opt.label.toLowerCase().includes("pla")
          );
          initialValues[param.id] = plaOption?.value || param.options[0].value;
        } else if (param.name?.toLowerCase().includes("color")) {
          const blackOption = param.options.find((opt) =>
            opt.label.toLowerCase().includes("black")
          );
          initialValues[param.id] =
            blackOption?.value || param.options[0].value;
        } else if (param.name?.toLowerCase().includes("finishing")) {
          const noFinishOption = param.options.find((opt) =>
            opt.label.toLowerCase().includes("no finish")
          );
          initialValues[param.id] =
            noFinishOption?.value || param.options[0].value;
        } else {
          initialValues[param.id] = param.options[0].value;
        }
      } else if (param.type === "NumericValue") {
        initialValues[param.id] = param.min || 0;
      }
    });

    return initialValues;
  });
  const [dimensions, setDimensions] = useState({
    width: 8.6,
    height: 1.27,
    length: 7.62,
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Calculate total price based on form values and quantity
  const calculatePrice = () => {
    let totalPrice = product.basePrice * quantity;

    // Add pricing from form parameters
    product.formData.parameters?.forEach((param) => {
      const value = formValues[param.id];
      if (value && param.pricing) {
        if (param.pricing.unit_price) {
          totalPrice += param.pricing.unit_price * quantity;
        }
        if (param.pricing.base_price) {
          totalPrice += param.pricing.base_price;
        }
        if (param.pricing.multiplier) {
          totalPrice *= param.pricing.multiplier;
        }
      }
    });

    return totalPrice;
  };

  const totalPrice = calculatePrice();

  const handleParameterChange = (parameterId: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [parameterId]: value,
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleDimensionChange = (dimension: string, value: number) => {
    setDimensions((prev) => ({
      ...prev,
      [dimension]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button variant="outline" onClick={onBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Configure Your Order
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {product.name} - Customize your product
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Product Preview & File Upload */}
          <div className="lg:col-span-1 space-y-6">
            {/* Product Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Item</span>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Package className="mr-1 h-4 w-4" />
                      {quantity}
                    </span>
                    <span>{weight} gr</span>
                    <span>
                      {product.currencyType}
                      {totalPrice.toLocaleString()}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(
                            Math.max(1, parseInt(e.target.value) || 1)
                          )
                        }
                        className="w-20 text-center"
                        min="1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Product Name and Specs */}
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">STL</Badge>
                      <Badge variant="secondary">FDM</Badge>
                      <Badge variant="secondary">PLA</Badge>
                      <Badge variant="secondary">BLACK</Badge>
                    </div>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <span className="font-medium">
                        {product.currencyType}
                        {totalPrice.toLocaleString()}
                      </span>
                      <span className="ml-4 flex items-center">
                        <Package className="mr-1 h-3 w-3" />
                        {(weight * quantity).toFixed(2)} gr
                      </span>
                    </div>
                  </div>

                  {/* 3D Preview Placeholder */}
                  <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg h-48 flex items-center justify-center">
                    <div className="text-gray-400 text-center">
                      <Package className="mx-auto h-12 w-12 mb-2" />
                      <p>3D Preview</p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute bottom-2 left-2"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* File Upload */}
                  <div>
                    <Button variant="outline" className="w-full" asChild>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                      </label>
                    </Button>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".stl,.obj,.3mf,.ply"
                    />
                    {uploadedFile && (
                      <p className="text-sm text-gray-600 mt-2">
                        Uploaded: {uploadedFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dimensions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="width">Width</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="width"
                        type="number"
                        value={dimensions.width}
                        onChange={(e) =>
                          handleDimensionChange(
                            "width",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        step="0.1"
                      />
                      <span className="text-sm text-gray-500">cm</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="height">Height</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="height"
                        type="number"
                        value={dimensions.height}
                        onChange={(e) =>
                          handleDimensionChange(
                            "height",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        step="0.1"
                      />
                      <span className="text-sm text-gray-500">cm</span>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="length">Length</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="length"
                        type="number"
                        value={dimensions.length}
                        onChange={(e) =>
                          handleDimensionChange(
                            "length",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        step="0.1"
                      />
                      <span className="text-sm text-gray-500">cm</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Configuration Options */}
          <div className="lg:col-span-2 space-y-6">
            {product.formData.parameters?.map((parameter) => (
              <Card key={parameter.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    {parameter.label}
                    {parameter.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </CardTitle>
                  {parameter.description && (
                    <CardDescription>{parameter.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {parameter.type === "FixedOption" && parameter.options && (
                    <div className="space-y-3">
                      {parameter.displayType === "radio" ||
                      !parameter.displayType ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {parameter.options.map((option) => {
                            const isSelected =
                              formValues[parameter.id] === option.value;
                            return (
                              <label
                                key={option.value}
                                className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={parameter.id}
                                  value={option.value}
                                  checked={isSelected}
                                  onChange={() =>
                                    handleParameterChange(
                                      parameter.id,
                                      option.value
                                    )
                                  }
                                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {option.label}
                                  </div>
                                  {option.description && (
                                    <div className="text-sm text-gray-500 mt-1">
                                      {option.description}
                                    </div>
                                  )}
                                  {option.pricing.unit_price && (
                                    <div className="text-sm font-medium text-blue-600 mt-1">
                                      +{product.currencyType}
                                      {option.pricing.unit_price}/unit
                                    </div>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {parameter.options.map((option) => {
                            const isSelected =
                              formValues[parameter.id] === option.value;
                            return (
                              <button
                                key={option.value}
                                onClick={() =>
                                  handleParameterChange(
                                    parameter.id,
                                    option.value
                                  )
                                }
                                className={`p-3 rounded-lg border-2 text-left transition-all ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                }`}
                              >
                                <div className="font-medium">
                                  {option.label}
                                </div>
                                {option.description && (
                                  <div className="text-sm text-gray-500 mt-1">
                                    {option.description}
                                  </div>
                                )}
                                {option.pricing.unit_price && (
                                  <div className="text-sm font-medium text-blue-600 mt-1">
                                    +{product.currencyType}
                                    {option.pricing.unit_price}/unit
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {parameter.type === "NumericValue" && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={formValues[parameter.id] || parameter.min || 0}
                          onChange={(e) =>
                            handleParameterChange(
                              parameter.id,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          min={parameter.min}
                          max={parameter.max}
                          step={parameter.step || 1}
                          className="w-32"
                        />
                        {parameter.unit && (
                          <span className="text-sm text-gray-500">
                            {parameter.unit}
                          </span>
                        )}
                      </div>
                      {parameter.min !== undefined &&
                        parameter.max !== undefined && (
                          <div className="text-sm text-gray-500">
                            Range: {parameter.min} - {parameter.max}{" "}
                            {parameter.unit}
                          </div>
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Note</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full h-24 p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any special instructions or notes for your order..."
                  value={formValues.notes || ""}
                  onChange={(e) =>
                    handleParameterChange("notes", e.target.value)
                  }
                />
              </CardContent>
            </Card>

            {/* Order Summary & Action */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold">
                      {product.currencyType}
                      {totalPrice.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {quantity} item{quantity > 1 ? "s" : ""} •{" "}
                      {(weight * quantity).toFixed(2)} gr total
                    </div>
                  </div>
                  <Button size="lg" className="px-8">
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
