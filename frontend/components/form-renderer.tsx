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
import { Calculator, AlertTriangle } from "lucide-react";
import NumberFlow from "@number-flow/react";
import type {
  Parameter,
  ParameterType,
  FixedOption,
  SubOption,
} from "@/lib/formBuilderTypes";

type CurrencyType = "USD" | "IDR";

interface CurrencyConfig {
  symbol: string;
  code: string;
  name: string;
}

interface FormValues {
  [key: string]: any;
}

interface FormRendererProps {
  parameters: Parameter[];
  currency?: CurrencyType;
  title?: string;
  description?: string;
  onFormChange?: (formValues: FormValues) => void;
  onPriceChange?: (
    totalPrice: number,
    priceBreakdown: Array<{
      parameter: string;
      description: string;
      amount: number;
    }>
  ) => void;
  initialValues?: FormValues;
  showPriceBreakdown?: boolean;
  showValidationErrors?: boolean;
  readOnly?: boolean;
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
    // Remove any non-mathematical characters for safety
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, "");

    // Use Function constructor instead of eval for better safety
    const func = new Function("return " + sanitized);
    const result = func();

    return typeof result === "number" && !isNaN(result) ? result : 0;
  } catch (e) {
    return 0;
  }
};

export default function FormRenderer({
  parameters = [],
  currency = "USD",
  title = "Quote Form",
  description = "Fill out the form to calculate pricing",
  onFormChange,
  onPriceChange,
  initialValues = { quantity: "1" },
  showPriceBreakdown = true,
  showValidationErrors = true,
  readOnly = false,
  className = "",
}: FormRendererProps) {
  const [formValues, setFormValues] = useState<FormValues>(initialValues);
  const [totalPrice, setTotalPrice] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState<
    Array<{
      parameter: string;
      description: string;
      amount: number;
    }>
  >([]);

  const isParameterVisible = (
    param: Parameter,
    formValues: FormValues
  ): boolean => {
    if (!param.conditional) return true;
    const parentValue = formValues[param.conditional.parentParameter];
    return param.conditional.showWhen.includes(parentValue);
  };

  const validateRequiredSubOptions = (): string[] => {
    const errors: string[] = [];

    parameters
      .filter(
        (param) =>
          param.required &&
          param.type === "FixedOption" &&
          isParameterVisible(param, formValues)
      )
      .forEach((param) => {
        const selectedValue = formValues[param.name];

        if (selectedValue && selectedValue !== "") {
          const selectedOption = param.options?.find(
            (opt) => opt.value === selectedValue
          );

          if (
            selectedOption?.subOptions &&
            selectedOption.subOptions.length > 0
          ) {
            const hasSubOptionSelected = selectedOption.subOptions.some(
              (subOption) => formValues[`${param.name}_${subOption.value}`]
            );

            if (!hasSubOptionSelected) {
              errors.push(
                `${
                  selectedOption.label || param.label || param.name
                } requires selecting an additional option`
              );
            }
          }
        }
      });

    return errors;
  };

  const calculatePrice = () => {
    let unitTotal = 0;
    const breakdown: Array<{
      parameter: string;
      description: string;
      amount: number;
    }> = [];

    // Get quantity from form values, default to 1
    const quantity = Number.parseFloat(formValues.quantity) || 1;

    const calculatedValues = { ...formValues };

    // Calculate all derived values using current form values
    const derivedParams = parameters.filter(
      (p) => p.type === "DerivedCalc" && isParameterVisible(p, formValues)
    );

    // Sort by dependency order
    const sortedDerivedParams = [...derivedParams].sort((a, b) => {
      const aDeps = a.dependencies || [];
      const bDeps = b.dependencies || [];

      if (aDeps.length === 0 && bDeps.length > 0) return -1;
      if (bDeps.length === 0 && aDeps.length > 0) return 1;

      if (aDeps.includes(b.name)) return 1;
      if (bDeps.includes(a.name)) return -1;

      return 0;
    });

    // Calculate derived values in order
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

    // Calculate unit price for each parameter (excluding quantity)
    parameters
      .filter(
        (param) =>
          isParameterVisible(param, formValues) && param.name !== "quantity"
      )
      .forEach((param) => {
        const value = calculatedValues[param.name];
        if (value === undefined || value === null || value === "") return;

        let paramTotal = 0;
        let description = "";

        // Base price is per QTY (per item ordered)
        if (param.pricing?.base_price) {
          paramTotal += param.pricing.base_price;
          description += `Base: ${currencies[currency].symbol}${param.pricing.base_price} per item`;
        }

        if (param.type === "FixedOption") {
          const selectedOption = param.options?.find(
            (opt) => opt.value === value
          );
          if (selectedOption) {
            // Base price for option is per QTY
            if (selectedOption.pricing?.base_price) {
              paramTotal += selectedOption.pricing.base_price;
              description +=
                (description ? " + " : "") +
                `Option: ${currencies[currency].symbol}${selectedOption.pricing.base_price} per item`;
            }
            // Unit price for option scales with main units
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

          // Unit price scales with main units if this param has unit pricing
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
    setTotalPrice(finalTotal);
    setPriceBreakdown(breakdown);

    // Call callbacks
    if (onPriceChange) {
      onPriceChange(finalTotal, breakdown);
    }
  };

  const updateFormValue = (name: string, value: any) => {
    setFormValues((prev) => {
      const newValues = { ...prev, [name]: value };

      // Calculate derived values that depend on this parameter
      const derivedParams = parameters.filter(
        (p) => p.type === "DerivedCalc" && p.dependencies?.includes(name)
      );

      // Keep calculating until no more changes occur (handles chained dependencies)
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
                    : Number.parseFloat(newValues[dep]);

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
                const currentValue = newValues[param.name];
                if (currentValue !== result) {
                  newValues[param.name] = result;
                  hasChanges = true;
                }
              } else {
                if (newValues[param.name] !== 0) {
                  newValues[param.name] = 0;
                  hasChanges = true;
                }
              }
            } catch (e) {
              if (newValues[param.name] !== 0) {
                newValues[param.name] = 0;
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
            p.dependencies?.some((dep) => newValues.hasOwnProperty(dep))
        );

        otherDerivedParams.forEach((param) => {
          if (param.formula && param.dependencies) {
            try {
              let formula = param.formula;
              let hasAllDependencies = true;

              param.dependencies.forEach((dep) => {
                const depValue = Number.parseFloat(newValues[dep]);
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
                const currentValue = newValues[param.name];
                if (currentValue !== result) {
                  newValues[param.name] = result;
                  hasChanges = true;
                }
              }
            } catch (e) {
              // Error in calculation
            }
          }
        });
      }

      return newValues;
    });
  };

  // Calculate price whenever form values or parameters change
  useEffect(() => {
    calculatePrice();
  }, [formValues, parameters]);

  // Call onFormChange callback when form values change
  useEffect(() => {
    if (onFormChange) {
      onFormChange(formValues);
    }
  }, [formValues, onFormChange]);

  const validationErrors = showValidationErrors
    ? validateRequiredSubOptions()
    : [];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                <CardTitle>{title}</CardTitle>
              </div>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {parameters
                .filter((param) => isParameterVisible(param, formValues))
                .map((param) => (
                  <div key={param.id} className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Label
                        htmlFor={`form-${param.id}`}
                        className="flex-shrink-0"
                      >
                        {param.label || param.name}
                        {param.unit && (
                          <span className="text-muted-foreground ml-1">
                            ({param.unit})
                          </span>
                        )}
                      </Label>
                      {param.required && (
                        <Badge
                          variant="destructive"
                          className="text-xs font-medium px-2 py-1"
                        >
                          REQUIRED
                        </Badge>
                      )}
                      {param.unitsPerQuantity && param.unitsPerQuantity > 1 && (
                        <Badge variant="outline" className="text-xs">
                          {param.unitsPerQuantity} units per quantity
                        </Badge>
                      )}
                      {param.isMainUnits && (
                        <Badge
                          variant="default"
                          className="text-xs font-medium px-2 py-1"
                        >
                          MAIN UNITS
                        </Badge>
                      )}
                      {param.conditional && (
                        <Badge variant="secondary" className="text-xs">
                          Conditional
                        </Badge>
                      )}
                    </div>

                    {/* Parameter description */}
                    {param.description && (
                      <p className="text-sm text-muted-foreground">
                        {param.description}
                      </p>
                    )}

                    {param.type === "FixedOption" && (
                      <>
                        {/* Render based on displayType */}
                        {(param.displayType === "select" ||
                          !param.displayType) && (
                          <Select
                            value={
                              formValues[param.name] === ""
                                ? "__none__"
                                : formValues[param.name] || "__none__"
                            }
                            onValueChange={(value) => {
                              if (readOnly) return;
                              const actualValue =
                                value === "__none__" ? "" : value;
                              updateFormValue(param.name, actualValue);
                              const dependentParams = parameters.filter(
                                (p) =>
                                  p.conditional?.parentParameter === param.name
                              );
                              dependentParams.forEach((depParam) => {
                                updateFormValue(depParam.name, "");
                              });
                            }}
                            disabled={readOnly}
                          >
                            <SelectTrigger
                              className={
                                param.required &&
                                (!formValues[param.name] ||
                                  formValues[param.name] === "")
                                  ? "border-destructive ring-destructive/20 ring-2"
                                  : ""
                              }
                            >
                              <SelectValue
                                placeholder={
                                  param.required
                                    ? "Please select an option (Required)"
                                    : "Select an option"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {!param.required && (
                                <SelectItem value="__none__">
                                  <span className="text-muted-foreground italic">
                                    None (clear selection)
                                  </span>
                                </SelectItem>
                              )}
                              {param.options && param.options.length > 0 ? (
                                param.options
                                  .filter(
                                    (option) =>
                                      option.value &&
                                      option.value.trim() !== "" &&
                                      option.label &&
                                      option.label.trim() !== ""
                                  )
                                  .map((option, index) => (
                                    <SelectItem
                                      key={`${param.id}-${index}`}
                                      value={option.value}
                                    >
                                      <div className="flex flex-col">
                                        <span>{option.label}</span>
                                        {option.description && (
                                          <span className="text-xs text-muted-foreground">
                                            {option.description}
                                          </span>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))
                              ) : (
                                <SelectItem
                                  key="no-options"
                                  value="__no_options__"
                                  disabled
                                >
                                  No options available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        )}

                        {/* Radio button rendering */}
                        {param.displayType === "radio" && (
                          <div className="space-y-3">
                            {!param.required && (
                              <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                                <input
                                  type="radio"
                                  id={`${param.id}-none`}
                                  name={param.name}
                                  value=""
                                  checked={
                                    !formValues[param.name] ||
                                    formValues[param.name] === ""
                                  }
                                  onChange={() => {
                                    if (readOnly) return;
                                    updateFormValue(param.name, "");
                                    const dependentParams = parameters.filter(
                                      (p) =>
                                        p.conditional?.parentParameter ===
                                        param.name
                                    );
                                    dependentParams.forEach((depParam) => {
                                      updateFormValue(depParam.name, "");
                                    });
                                  }}
                                  disabled={readOnly}
                                  className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <Label
                                  htmlFor={`${param.id}-none`}
                                  className="text-sm cursor-pointer text-muted-foreground italic"
                                >
                                  None (clear selection)
                                </Label>
                              </div>
                            )}
                            {param.options && param.options.length > 0 ? (
                              param.options
                                .filter(
                                  (option) =>
                                    option.value &&
                                    option.value.trim() !== "" &&
                                    option.label &&
                                    option.label.trim() !== ""
                                )
                                .map((option, index) => (
                                  <div
                                    key={`${param.id}-${index}`}
                                    className="flex items-start space-x-3 p-3 rounded hover:bg-gray-50 border border-gray-200"
                                  >
                                    <input
                                      type="radio"
                                      id={`${param.id}-${option.value}`}
                                      name={param.name}
                                      value={option.value}
                                      checked={
                                        formValues[param.name] === option.value
                                      }
                                      onChange={() => {
                                        if (readOnly) return;
                                        updateFormValue(
                                          param.name,
                                          option.value
                                        );
                                        const dependentParams =
                                          parameters.filter(
                                            (p) =>
                                              p.conditional?.parentParameter ===
                                              param.name
                                          );
                                        dependentParams.forEach((depParam) => {
                                          updateFormValue(depParam.name, "");
                                        });
                                      }}
                                      disabled={readOnly}
                                      className="w-4 h-4 text-primary focus:ring-primary mt-0.5"
                                    />
                                    <Label
                                      htmlFor={`${param.id}-${option.value}`}
                                      className="flex-1 cursor-pointer"
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">
                                          {option.label}
                                        </span>
                                        {option.description && (
                                          <span className="text-xs text-muted-foreground mt-1">
                                            {option.description}
                                          </span>
                                        )}
                                      </div>
                                    </Label>
                                  </div>
                                ))
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                No options available
                              </div>
                            )}
                          </div>
                        )}

                        {/* Toggle button rendering */}
                        {param.displayType === "toggle" && (
                          <div className="space-y-2">
                            {!param.required && (
                              <Button
                                variant={
                                  !formValues[param.name] ||
                                  formValues[param.name] === ""
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => {
                                  if (readOnly) return;
                                  updateFormValue(param.name, "");
                                  const dependentParams = parameters.filter(
                                    (p) =>
                                      p.conditional?.parentParameter ===
                                      param.name
                                  );
                                  dependentParams.forEach((depParam) => {
                                    updateFormValue(depParam.name, "");
                                  });
                                }}
                                disabled={readOnly}
                                className="mr-2 mb-2"
                              >
                                None
                              </Button>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {param.options && param.options.length > 0 ? (
                                param.options
                                  .filter(
                                    (option) =>
                                      option.value &&
                                      option.value.trim() !== "" &&
                                      option.label &&
                                      option.label.trim() !== ""
                                  )
                                  .map((option, index) => (
                                    <Button
                                      key={`${param.id}-${index}`}
                                      variant={
                                        formValues[param.name] === option.value
                                          ? "default"
                                          : "outline"
                                      }
                                      size="sm"
                                      onClick={() => {
                                        if (readOnly) return;
                                        updateFormValue(
                                          param.name,
                                          option.value
                                        );
                                        const dependentParams =
                                          parameters.filter(
                                            (p) =>
                                              p.conditional?.parentParameter ===
                                              param.name
                                          );
                                        dependentParams.forEach((depParam) => {
                                          updateFormValue(depParam.name, "");
                                        });
                                      }}
                                      disabled={readOnly}
                                      className="flex flex-col items-start h-auto p-3"
                                      title={option.description}
                                    >
                                      <span className="font-medium">
                                        {option.label}
                                      </span>
                                      {option.description && (
                                        <span className="text-xs opacity-70 mt-1 text-left">
                                          {option.description.length > 50
                                            ? `${option.description.substring(
                                                0,
                                                50
                                              )}...`
                                            : option.description}
                                        </span>
                                      )}
                                    </Button>
                                  ))
                              ) : (
                                <div className="text-sm text-muted-foreground">
                                  No options available
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {param.type === "FixedOption" &&
                      param.required &&
                      (!formValues[param.name] ||
                        formValues[param.name] === "") && (
                        <div className="text-xs text-destructive font-medium flex items-center gap-1">
                          <span className="w-1 h-1 bg-destructive rounded-full"></span>
                          This field is required
                        </div>
                      )}

                    {/* Sub-options for selected FixedOption */}
                    {param.type === "FixedOption" &&
                      (() => {
                        const selectedOption = param.options?.find(
                          (opt) => opt.value === formValues[param.name]
                        );
                        const subOptionDisplayType =
                          selectedOption?.displayType || "radio";
                        const isSubOptionRequired = param.required;
                        const hasSubOptionSelected =
                          selectedOption?.subOptions?.some(
                            (subOption) =>
                              formValues[`${param.name}_${subOption.value}`]
                          );

                        return selectedOption?.subOptions &&
                          selectedOption.subOptions.length > 0 ? (
                          <div className="ml-4 mt-3 space-y-3 border-l-2 border-gray-200 pl-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Label className="text-sm font-medium text-gray-700">
                                Additional Options for {selectedOption.label}:
                              </Label>
                              {isSubOptionRequired && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs font-medium px-2 py-1"
                                >
                                  REQUIRED
                                </Badge>
                              )}
                            </div>

                            {/* Radio display for sub-options */}
                            {subOptionDisplayType === "radio" && (
                              <div
                                className={`space-y-2 ${
                                  isSubOptionRequired && !hasSubOptionSelected
                                    ? "border-2 border-destructive rounded-lg p-2"
                                    : ""
                                }`}
                              >
                                {!isSubOptionRequired && (
                                  <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                                    <input
                                      type="radio"
                                      id={`suboption-none-${param.id}`}
                                      name={`${param.name}_suboptions`}
                                      value=""
                                      checked={!hasSubOptionSelected}
                                      onChange={() => {
                                        if (readOnly) return;
                                        selectedOption.subOptions?.forEach(
                                          (subOption) => {
                                            updateFormValue(
                                              `${param.name}_${subOption.value}`,
                                              false
                                            );
                                          }
                                        );
                                      }}
                                      disabled={readOnly}
                                      className="w-4 h-4 text-primary focus:ring-primary"
                                    />
                                    <Label
                                      htmlFor={`suboption-none-${param.id}`}
                                      className="text-sm cursor-pointer"
                                    >
                                      None (no additional options)
                                    </Label>
                                  </div>
                                )}

                                {selectedOption.subOptions.map((subOption) => (
                                  <div key={subOption.id} className="space-y-2">
                                    <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                                      <input
                                        type="radio"
                                        id={`suboption-${param.id}-${subOption.id}`}
                                        name={`${param.name}_suboptions`}
                                        value={subOption.value}
                                        checked={
                                          !!formValues[
                                            `${param.name}_${subOption.value}`
                                          ]
                                        }
                                        onChange={() => {
                                          if (readOnly) return;
                                          selectedOption.subOptions?.forEach(
                                            (otherSubOption) => {
                                              updateFormValue(
                                                `${param.name}_${otherSubOption.value}`,
                                                false
                                              );
                                            }
                                          );
                                          updateFormValue(
                                            `${param.name}_${subOption.value}`,
                                            true
                                          );
                                        }}
                                        disabled={readOnly}
                                        className="w-4 h-4 text-primary focus:ring-primary"
                                      />
                                      <Label
                                        htmlFor={`suboption-${param.id}-${subOption.id}`}
                                        className="text-sm font-medium flex items-center gap-2 cursor-pointer flex-1"
                                      >
                                        <div className="flex flex-col">
                                          <span>{subOption.label}</span>
                                          {subOption.price &&
                                            subOption.price > 0 && (
                                              <span className="text-green-600 font-medium text-xs">
                                                +{currencies[currency].symbol}
                                                <NumberFlow
                                                  value={subOption.price}
                                                  format={{
                                                    minimumFractionDigits:
                                                      currency === "IDR"
                                                        ? 0
                                                        : 2,
                                                    maximumFractionDigits:
                                                      currency === "IDR"
                                                        ? 0
                                                        : 2,
                                                  }}
                                                />{" "}
                                                {subOption.pricingScope ===
                                                "per_qty"
                                                  ? "per item"
                                                  : "per unit"}
                                              </span>
                                            )}
                                        </div>
                                        {subOption.pricingScope ===
                                          "per_unit" && (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs ml-auto"
                                          >
                                            Per Unit
                                          </Badge>
                                        )}
                                      </Label>
                                    </div>
                                    {subOption.description && (
                                      <p className="text-xs text-muted-foreground ml-8">
                                        {subOption.description}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Validation message for required sub-options */}
                            {isSubOptionRequired && !hasSubOptionSelected && (
                              <div className="text-xs text-destructive font-medium flex items-center gap-1 mt-2">
                                <span className="w-1 h-1 bg-destructive rounded-full"></span>
                                Please select an additional option
                              </div>
                            )}
                          </div>
                        ) : null;
                      })()}

                    {param.type === "NumericValue" && (
                      <>
                        <Input
                          id={`form-${param.id}`}
                          type="number"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={formValues[param.name] || ""}
                          onChange={(e) => {
                            if (readOnly) return;
                            updateFormValue(param.name, e.target.value);
                          }}
                          placeholder={
                            param.required
                              ? "Enter value (Required)"
                              : "Enter value"
                          }
                          disabled={readOnly}
                          className={
                            param.required &&
                            (!formValues[param.name] ||
                              formValues[param.name] === "")
                              ? "border-destructive ring-destructive/20 ring-2"
                              : ""
                          }
                        />
                        {param.required &&
                          (!formValues[param.name] ||
                            formValues[param.name] === "") && (
                            <div className="text-xs text-destructive font-medium flex items-center gap-1">
                              <span className="w-1 h-1 bg-destructive rounded-full"></span>
                              This field is required
                            </div>
                          )}
                      </>
                    )}

                    {param.type === "DerivedCalc" && (
                      <div className="space-y-2">
                        <Input
                          id={`form-${param.id}`}
                          value={
                            typeof formValues[param.name] === "number"
                              ? formValues[param.name] < 0.01 &&
                                formValues[param.name] > 0
                                ? formValues[param.name].toFixed(6)
                                : formValues[param.name].toFixed(2)
                              : formValues[param.name] || "0.00"
                          }
                          disabled
                          className="bg-muted font-mono"
                        />
                        {param.formula && (
                          <div className="text-xs text-muted-foreground">
                            Formula: {param.formula}
                          </div>
                        )}
                        {param.dependencies &&
                          param.dependencies.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Depends on: {param.dependencies.join(", ")}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Validation Warnings */}
          {validationErrors.length > 0 && (
            <Card className="border-destructive">
              <CardHeader className="pb-3">
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Required Selections Missing
                </CardTitle>
                <CardDescription>
                  Please complete all required selections to proceed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {validationErrors.map((error, index) => (
                    <div
                      key={index}
                      className="text-sm text-destructive flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 bg-destructive rounded-full"></span>
                      {error}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Price Breakdown */}
          {showPriceBreakdown && (
            <Card>
              <CardHeader>
                <CardTitle>Price Breakdown</CardTitle>
                <CardDescription>
                  Real-time calculation based on your inputs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {priceBreakdown.length > 0 ? (
                  <>
                    {priceBreakdown.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-start"
                      >
                        <div>
                          <div className="font-medium">{item.parameter}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                        <div className="font-mono">
                          {currencies[currency].symbol}
                          <NumberFlow
                            value={item.amount}
                            format={{
                              minimumFractionDigits: currency === "IDR" ? 0 : 2,
                              maximumFractionDigits:
                                currency === "IDR"
                                  ? 0
                                  : item.amount < 0.01 && item.amount > 0
                                  ? 6
                                  : 2,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <Separator />
                    {(() => {
                      const quantity =
                        Number.parseFloat(formValues.quantity) || 1;
                      const unitTotal = priceBreakdown
                        .filter(
                          (item) => item.parameter !== "Quantity Multiplier"
                        )
                        .reduce((sum, item) => sum + item.amount, 0);

                      return quantity > 1 ? (
                        <>
                          <div className="flex justify-between items-center text-base">
                            <span>Price per unit</span>
                            <span className="font-mono">
                              {currencies[currency].symbol}
                              <NumberFlow
                                value={unitTotal}
                                format={{
                                  minimumFractionDigits:
                                    currency === "IDR" ? 0 : 2,
                                  maximumFractionDigits:
                                    currency === "IDR"
                                      ? 0
                                      : unitTotal < 0.01 && unitTotal > 0
                                      ? 6
                                      : 2,
                                }}
                              />
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-base">
                            <span>Quantity ordered</span>
                            <span className="font-mono">× {quantity}</span>
                          </div>
                          <Separator />
                        </>
                      ) : null;
                    })()}
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span className="font-mono">
                        {currencies[currency].symbol}
                        <NumberFlow
                          value={totalPrice}
                          format={{
                            minimumFractionDigits: currency === "IDR" ? 0 : 2,
                            maximumFractionDigits:
                              currency === "IDR"
                                ? 0
                                : totalPrice < 0.01 && totalPrice > 0
                                ? 6
                                : 2,
                          }}
                        />
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Fill out the form to see price calculation
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
