"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Calculator, Eye, FileText } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { printingSamples } from "@/lib/printingSamples";

type ParameterType = "FixedOption" | "NumericValue" | "DerivedCalc";

interface PricingRule {
  base_price?: number;
  unit_price?: number;
  multiplier?: number;
  step_pricing?: {
    threshold: number;
    step_amount: number;
  };
}

interface FixedOption {
  label: string;
  value: string;
  pricing: PricingRule;
}

export interface Parameter {
  id: string;
  name: string;
  label: string;
  type: ParameterType;
  required: boolean;
  pricing: PricingRule;
  options?: FixedOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  formula?: string;
  dependencies?: string[];
  conditional?: {
    parentParameter: string;
    showWhen: string[];
  };
  hasSubParameters?: boolean;
  subParameters?: Parameter[];
  pricingScope?: "per_unit" | "per_quantity";
}

interface FormValues {
  [key: string]: any;
}

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

export default function QuoteFormBuilder() {
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [activeTab, setActiveTab] = useState("builder");
  const [formValues, setFormValues] = useState<FormValues>({ quantity: "1" });
  const [totalPrice, setTotalPrice] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState<
    Array<{
      parameter: string;
      description: string;
      amount: number;
    }>
  >([]);

  const addParameter = () => {
    const newParam: Parameter = {
      id: `param_${Date.now()}`,
      name: "",
      label: "",
      type: "NumericValue",
      required: false,
      pricing: {},
      hasSubParameters: false,
      pricingScope: "per_unit",
    };
    setParameters([...parameters, newParam]);
  };

  const addSubParameter = (parentId: string) => {
    const newSubParam: Parameter = {
      id: `subparam_${Date.now()}`,
      name: "",
      label: "",
      type: "FixedOption",
      required: false,
      pricing: {},
      options: [],
      pricingScope: "per_unit",
    };

    setParameters(
      parameters.map((param) => {
        if (param.id === parentId) {
          return {
            ...param,
            subParameters: [...(param.subParameters || []), newSubParam],
          };
        }
        return param;
      })
    );
  };

  const updateSubParameter = (
    parentId: string,
    subId: string,
    updates: Partial<Parameter>
  ) => {
    setParameters(
      parameters.map((param) => {
        if (param.id === parentId && param.subParameters) {
          return {
            ...param,
            subParameters: param.subParameters.map((subParam) =>
              subParam.id === subId ? { ...subParam, ...updates } : subParam
            ),
          };
        }
        return param;
      })
    );
  };

  const deleteSubParameter = (parentId: string, subId: string) => {
    setParameters(
      parameters.map((param) => {
        if (param.id === parentId && param.subParameters) {
          return {
            ...param,
            subParameters: param.subParameters.filter(
              (subParam) => subParam.id !== subId
            ),
          };
        }
        return param;
      })
    );
  };

  const addQuantityParameter = () => {
    // Check if quantity parameter already exists
    const hasQuantity = parameters.some((p) => p.name === "quantity");
    if (!hasQuantity) {
      const quantityParam: Parameter = {
        id: `param_quantity_${Date.now()}`,
        name: "quantity",
        label: "Quantity",
        type: "NumericValue",
        required: true,
        min: 1,
        step: 1,
        unit: "units",
        pricing: {}, // No pricing rules for quantity itself
        hasSubParameters: false,
        pricingScope: "per_unit",
      };
      setParameters([quantityParam, ...parameters]);
    }
  };

  const updateParameter = (id: string, updates: Partial<Parameter>) => {
    setParameters(
      parameters.map((param) =>
        param.id === id ? { ...param, ...updates } : param
      )
    );
  };

  const deleteParameter = (id: string) => {
    setParameters(parameters.filter((param) => param.id !== id));
  };

  const addOption = (paramId: string) => {
    const param = parameters.find((p) => p.id === paramId);
    if (param && param.type === "FixedOption") {
      const newOption: FixedOption = {
        label: "",
        value: "",
        pricing: {},
      };
      updateParameter(paramId, {
        options: [...(param.options || []), newOption],
      });
    }
  };

  const updateOption = (
    paramId: string,
    optionIndex: number,
    updates: Partial<FixedOption>
  ) => {
    const param = parameters.find((p) => p.id === paramId);
    if (param && param.options) {
      const newOptions = [...param.options];
      newOptions[optionIndex] = { ...newOptions[optionIndex], ...updates };
      updateParameter(paramId, { options: newOptions });
    }
  };

  const deleteOption = (paramId: string, optionIndex: number) => {
    const param = parameters.find((p) => p.id === paramId);
    if (param && param.options) {
      const newOptions = param.options.filter(
        (_, index) => index !== optionIndex
      );
      updateParameter(paramId, { options: newOptions });
    }
  };

  const isParameterVisible = (
    param: Parameter,
    formValues: FormValues
  ): boolean => {
    if (!param.conditional) return true;
    const parentValue = formValues[param.conditional.parentParameter];
    return param.conditional.showWhen.includes(parentValue);
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
    parameters
      .filter(
        (p) => p.type === "DerivedCalc" && isParameterVisible(p, formValues)
      )
      .forEach((param) => {
        if (param.formula && param.dependencies) {
          try {
            let formula = param.formula;
            param.dependencies.forEach((dep) => {
              const value = Number.parseFloat(calculatedValues[dep]) || 0;
              formula = formula.replace(
                new RegExp(`\\b${dep}\\b`, "g"),
                value.toString()
              );
            });
            // Simple math expression evaluator (safer than eval)
            const result = evaluateExpression(formula);
            calculatedValues[param.name] = result;
          } catch (e) {
            calculatedValues[param.name] = 0;
          }
        }
      });

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

        if (param.pricing.base_price) {
          paramTotal += param.pricing.base_price;
          description += `Base: $${param.pricing.base_price}`;
        }

        if (param.type === "FixedOption") {
          const selectedOption = param.options?.find(
            (opt) => opt.value === value
          );
          if (selectedOption) {
            if (selectedOption.pricing.base_price) {
              paramTotal += selectedOption.pricing.base_price;
              description +=
                (description ? " + " : "") +
                `Option: $${selectedOption.pricing.base_price}`;
            }
            if (selectedOption.pricing.multiplier) {
              paramTotal *= selectedOption.pricing.multiplier;
              description +=
                (description ? " × " : "") +
                `${selectedOption.pricing.multiplier}`;
            }
          }
        } else if (
          param.type === "NumericValue" ||
          param.type === "DerivedCalc"
        ) {
          const numValue = Number.parseFloat(value) || 0;

          if (param.pricing.unit_price) {
            const unitCost = numValue * param.pricing.unit_price;
            paramTotal += unitCost;
            description +=
              (description ? " + " : "") +
              `${numValue} × $${param.pricing.unit_price}`;
          }

          if (
            param.pricing.step_pricing &&
            numValue > param.pricing.step_pricing.threshold
          ) {
            const steps = Math.floor(
              numValue - param.pricing.step_pricing.threshold
            );
            const stepCost = steps * param.pricing.step_pricing.step_amount;
            paramTotal += stepCost;
            description +=
              (description ? " + " : "") +
              `${steps} steps × $${param.pricing.step_pricing.step_amount}`;
          }

          if (param.pricing.multiplier) {
            paramTotal *= param.pricing.multiplier;
            description +=
              (description ? " × " : "") + `${param.pricing.multiplier}`;
          }
        }

        if (paramTotal > 0) {
          breakdown.push({
            parameter: param.label || param.name,
            description: `${description} (per unit)`,
            amount: paramTotal,
          });
          unitTotal += paramTotal;
        }
      });

    // Add quantity breakdown if quantity > 1
    if (quantity > 1 && unitTotal > 0) {
      breakdown.push({
        parameter: "Quantity",
        description: `${unitTotal.toFixed(2)} × ${quantity} units`,
        amount: unitTotal * (quantity - 1), // Additional cost beyond the first unit
      });
    }

    const finalTotal = unitTotal * quantity;
    setTotalPrice(finalTotal);
    setPriceBreakdown(breakdown);
  };

  // Initialize derived calculations
  const initializeDerivedCalcs = () => {
    setFormValues((prev) => {
      const newValues = { ...prev };

      parameters
        .filter((p) => p.type === "DerivedCalc")
        .forEach((param) => {
          if (param.formula && param.dependencies) {
            try {
              let formula = param.formula;
              param.dependencies.forEach((dep) => {
                const depValue = Number.parseFloat(newValues[dep]) || 0;
                formula = formula.replace(
                  new RegExp(`\\b${dep}\\b`, "g"),
                  depValue.toString()
                );
              });
              const result = evaluateExpression(formula);
              newValues[param.name] = result;
            } catch (e) {
              newValues[param.name] = 0;
            }
          }
        });

      return newValues;
    });
  };

  // Run initialization when parameters change
  useEffect(() => {
    initializeDerivedCalcs();
  }, [parameters]);

  useEffect(() => {
    calculatePrice();
  }, [formValues, parameters]);

  const updateFormValue = (name: string, value: any) => {
    setFormValues((prev) => {
      const newValues = { ...prev, [name]: value };

      // Immediately calculate any derived values that depend on this parameter
      parameters
        .filter(
          (p) => p.type === "DerivedCalc" && p.dependencies?.includes(name)
        )
        .forEach((param) => {
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
                newValues[param.name] = result;
              } else {
                newValues[param.name] = 0;
              }
            } catch (e) {
              newValues[param.name] = 0;
            }
          }
        });

      return newValues;
    });
  };

  const loadSample = (sampleName: string) => {
    const sampleFunction =
      printingSamples[sampleName as keyof typeof printingSamples];
    if (sampleFunction) {
      setParameters(sampleFunction());
      setFormValues({ quantity: formValues.quantity || "1" }); // Preserve quantity when loading new sample
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Quote Form Builder</h1>
        <p className="text-muted-foreground">
          Build dynamic pricing forms with FixedOption, NumericValue, and
          DerivedCalc parameters. Total price is calculated as unit price ×
          quantity.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Form Builder
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview & Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Parameters</h2>
            <div className="flex gap-2">
              <Select onValueChange={loadSample}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Load Sample" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(printingSamples).map((sampleName) => (
                    <SelectItem key={sampleName} value={sampleName}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {sampleName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={addQuantityParameter}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Add Quantity
              </Button>
              <Button
                onClick={addParameter}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Parameter
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {parameters.map((param) => (
              <Card key={param.id}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{param.type}</Badge>
                      {param.conditional && (
                        <Badge variant="secondary" className="text-xs">
                          Conditional
                        </Badge>
                      )}
                      <CardTitle className="text-lg">
                        {param.label || param.name || "Unnamed Parameter"}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteParameter(param.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`name-${param.id}`}>Parameter Name</Label>
                      <Input
                        id={`name-${param.id}`}
                        value={param.name}
                        onChange={(e) =>
                          updateParameter(param.id, { name: e.target.value })
                        }
                        placeholder="e.g., material, quantity"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`label-${param.id}`}>Display Label</Label>
                      <Input
                        id={`label-${param.id}`}
                        value={param.label}
                        onChange={(e) =>
                          updateParameter(param.id, { label: e.target.value })
                        }
                        placeholder="e.g., Material Type, Quantity"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`type-${param.id}`}>Parameter Type</Label>
                      <Select
                        value={param.type}
                        onValueChange={(value: ParameterType) =>
                          updateParameter(param.id, { type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FixedOption">
                            Fixed Option
                          </SelectItem>
                          <SelectItem value="NumericValue">
                            Numeric Value
                          </SelectItem>
                          <SelectItem value="DerivedCalc">
                            Derived Calculation
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id={`required-${param.id}`}
                        checked={param.required}
                        onCheckedChange={(checked) =>
                          updateParameter(param.id, { required: checked })
                        }
                      />
                      <Label htmlFor={`required-${param.id}`}>Required</Label>
                    </div>
                  </div>

                  {param.type === "FixedOption" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Options</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(param.id)}
                        >
                          Add Option
                        </Button>
                      </div>
                      {param.options?.map((option, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Option {index + 1}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteOption(param.id, index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Label"
                              value={option.label}
                              onChange={(e) =>
                                updateOption(param.id, index, {
                                  label: e.target.value,
                                })
                              }
                            />
                            <Input
                              placeholder="Value"
                              value={option.value}
                              onChange={(e) =>
                                updateOption(param.id, index, {
                                  value: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              type="number"
                              placeholder="Base Price"
                              value={option.pricing.base_price || ""}
                              onChange={(e) =>
                                updateOption(param.id, index, {
                                  pricing: {
                                    ...option.pricing,
                                    base_price:
                                      Number.parseFloat(e.target.value) ||
                                      undefined,
                                  },
                                })
                              }
                            />
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Multiplier"
                              value={option.pricing.multiplier || ""}
                              onChange={(e) =>
                                updateOption(param.id, index, {
                                  pricing: {
                                    ...option.pricing,
                                    multiplier:
                                      Number.parseFloat(e.target.value) ||
                                      undefined,
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {param.type === "NumericValue" && (
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={param.min || ""}
                        onChange={(e) =>
                          updateParameter(param.id, {
                            min: Number.parseFloat(e.target.value) || undefined,
                          })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={param.max || ""}
                        onChange={(e) =>
                          updateParameter(param.id, {
                            max: Number.parseFloat(e.target.value) || undefined,
                          })
                        }
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Step"
                        value={param.step || ""}
                        onChange={(e) =>
                          updateParameter(param.id, {
                            step:
                              Number.parseFloat(e.target.value) || undefined,
                          })
                        }
                      />
                      <Input
                        placeholder="Unit"
                        value={param.unit || ""}
                        onChange={(e) =>
                          updateParameter(param.id, { unit: e.target.value })
                        }
                      />
                    </div>
                  )}

                  {param.type === "DerivedCalc" && (
                    <div className="space-y-2">
                      <Label>Formula (use parameter names)</Label>
                      <Input
                        placeholder="e.g., length * width"
                        value={param.formula || ""}
                        onChange={(e) =>
                          updateParameter(param.id, { formula: e.target.value })
                        }
                      />
                      <Label>Dependencies</Label>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          Select the numeric parameters this calculation depends
                          on:
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                          {parameters
                            .filter(
                              (p) =>
                                p.id !== param.id &&
                                (p.type === "NumericValue" ||
                                  p.name === "quantity")
                            )
                            .map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="checkbox"
                                  id={`dep-${param.id}-${p.id}`}
                                  checked={
                                    param.dependencies?.includes(p.name) ||
                                    false
                                  }
                                  onChange={(e) => {
                                    const currentDeps =
                                      param.dependencies || [];
                                    const newDeps = e.target.checked
                                      ? [...currentDeps, p.name]
                                      : currentDeps.filter(
                                          (dep) => dep !== p.name
                                        );

                                    updateParameter(param.id, {
                                      dependencies: newDeps,
                                    });
                                  }}
                                  className="rounded"
                                />
                                <Label htmlFor={`dep-${param.id}-${p.id}`}>
                                  {p.label || p.name} {p.unit && `(${p.unit})`}
                                </Label>
                              </div>
                            ))}
                        </div>
                        {param.dependencies &&
                          param.dependencies.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                              Selected: {param.dependencies.join(", ")}
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`conditional-${param.id}`}
                        checked={!!param.conditional}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateParameter(param.id, {
                              conditional: {
                                parentParameter: "",
                                showWhen: [],
                              },
                            });
                          } else {
                            updateParameter(param.id, {
                              conditional: undefined,
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`conditional-${param.id}`}>
                        Make this a conditional parameter
                      </Label>
                    </div>

                    {param.conditional && (
                      <div className="border rounded-lg p-3 space-y-3">
                        <div>
                          <Label>Parent Parameter</Label>
                          <Select
                            value={param.conditional.parentParameter}
                            onValueChange={(value) =>
                              updateParameter(param.id, {
                                conditional: {
                                  ...param.conditional!,
                                  parentParameter: value,
                                },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select parent parameter" />
                            </SelectTrigger>
                            <SelectContent>
                              {parameters
                                .filter(
                                  (p) =>
                                    p.id !== param.id &&
                                    p.type === "FixedOption"
                                )
                                .map((p) => (
                                  <SelectItem key={p.id} value={p.name}>
                                    {p.label || p.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {param.conditional.parentParameter && (
                          <div>
                            <Label>Show when parent value is:</Label>
                            <div className="space-y-2 mt-2">
                              {(() => {
                                const parentParam = parameters.find(
                                  (p) =>
                                    p.name ===
                                    param.conditional!.parentParameter
                                );
                                return (
                                  parentParam?.options?.map((option) => (
                                    <div
                                      key={option.value}
                                      className="flex items-center space-x-2"
                                    >
                                      <input
                                        type="checkbox"
                                        id={`condition-${param.id}-${option.value}`}
                                        checked={param.conditional!.showWhen.includes(
                                          option.value
                                        )}
                                        onChange={(e) => {
                                          const newShowWhen = e.target.checked
                                            ? [
                                                ...param.conditional!.showWhen,
                                                option.value,
                                              ]
                                            : param.conditional!.showWhen.filter(
                                                (v) => v !== option.value
                                              );

                                          updateParameter(param.id, {
                                            conditional: {
                                              ...param.conditional!,
                                              showWhen: newShowWhen,
                                            },
                                          });
                                        }}
                                        className="rounded"
                                      />
                                      <Label
                                        htmlFor={`condition-${param.id}-${option.value}`}
                                      >
                                        {option.label}
                                      </Label>
                                    </div>
                                  )) || []
                                );
                              })()}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />
                  <div>
                    <Label className="text-base font-medium">
                      Pricing Rules
                    </Label>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label className="text-sm">Base Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={param.pricing.base_price || ""}
                          onChange={(e) =>
                            updateParameter(param.id, {
                              pricing: {
                                ...param.pricing,
                                base_price:
                                  Number.parseFloat(e.target.value) ||
                                  undefined,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Unit Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={param.pricing.unit_price || ""}
                          onChange={(e) =>
                            updateParameter(param.id, {
                              pricing: {
                                ...param.pricing,
                                unit_price:
                                  Number.parseFloat(e.target.value) ||
                                  undefined,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Multiplier</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={param.pricing.multiplier || ""}
                          onChange={(e) =>
                            updateParameter(param.id, {
                              pricing: {
                                ...param.pricing,
                                multiplier:
                                  Number.parseFloat(e.target.value) ||
                                  undefined,
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Step Pricing</Label>
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            placeholder="Threshold"
                            value={param.pricing.step_pricing?.threshold || ""}
                            onChange={(e) =>
                              updateParameter(param.id, {
                                pricing: {
                                  ...param.pricing,
                                  step_pricing: {
                                    ...param.pricing.step_pricing,
                                    threshold:
                                      Number.parseFloat(e.target.value) || 0,
                                    step_amount:
                                      param.pricing.step_pricing?.step_amount ||
                                      0,
                                  },
                                },
                              })
                            }
                          />
                          <Input
                            type="number"
                            placeholder="Amount"
                            value={
                              param.pricing.step_pricing?.step_amount || ""
                            }
                            onChange={(e) =>
                              updateParameter(param.id, {
                                pricing: {
                                  ...param.pricing,
                                  step_pricing: {
                                    threshold:
                                      param.pricing.step_pricing?.threshold ||
                                      0,
                                    step_amount:
                                      Number.parseFloat(e.target.value) || 0,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Quote Form
                </CardTitle>
                <CardDescription>
                  Fill out the form to get an instant quote
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {parameters
                  .filter((param) => isParameterVisible(param, formValues))
                  .map((param) => (
                    <div key={param.id} className="space-y-2">
                      <Label htmlFor={`form-${param.id}`}>
                        {param.label || param.name}
                        {param.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                        {param.unit && (
                          <span className="text-muted-foreground ml-1">
                            ({param.unit})
                          </span>
                        )}
                        {param.conditional && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Conditional
                          </Badge>
                        )}
                      </Label>

                      {param.type === "FixedOption" && (
                        <Select
                          value={formValues[param.name] || ""}
                          onValueChange={(value) => {
                            updateFormValue(param.name, value);
                            const dependentParams = parameters.filter(
                              (p) =>
                                p.conditional?.parentParameter === param.name
                            );
                            dependentParams.forEach((depParam) => {
                              updateFormValue(depParam.name, "");
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                          <SelectContent>
                            {param.options?.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {param.type === "NumericValue" && (
                        <Input
                          id={`form-${param.id}`}
                          type="number"
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={formValues[param.name] || ""}
                          onChange={(e) =>
                            updateFormValue(param.name, e.target.value)
                          }
                        />
                      )}

                      {param.type === "DerivedCalc" && (
                        <div className="space-y-2">
                          <Input
                            id={`form-${param.id}`}
                            value={
                              typeof formValues[param.name] === "number"
                                ? formValues[param.name].toFixed(2)
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
                          ${item.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                    <Separator />
                    {(() => {
                      const quantity =
                        Number.parseFloat(formValues.quantity) || 1;
                      const unitTotal = priceBreakdown
                        .filter((item) => item.parameter !== "Quantity")
                        .reduce((sum, item) => sum + item.amount, 0);

                      return quantity > 1 ? (
                        <>
                          <div className="flex justify-between items-center text-base">
                            <span>Subtotal (per unit)</span>
                            <span className="font-mono">
                              ${unitTotal.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-base">
                            <span>Quantity</span>
                            <span className="font-mono">× {quantity}</span>
                          </div>
                          <Separator />
                        </>
                      ) : null;
                    })()}
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span className="font-mono">
                        ${totalPrice.toFixed(2)}
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
