/**
 * Form Calculation Utilities
 * Shared utilities for form value calculations and pricing
 */

import type { Parameter } from "@/lib/formBuilderTypes";

export interface FormValues {
  [key: string]: any;
}

export interface PriceBreakdownItem {
  parameter: string;
  description: string;
  amount: number;
}

export type CurrencyType = "USD" | "IDR";

export interface CurrencyConfig {
  symbol: string;
  code: string;
  name: string;
}

// Currency configurations
export const currencies: Record<CurrencyType, CurrencyConfig> = {
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

/**
 * Format price for display with proper decimal handling
 */
export const formatPrice = (
  amount: number,
  currency: CurrencyType = "USD",
  minDecimals: number = 2,
  maxDecimals: number = 6
): string => {
  const config = currencies[currency];

  // For very small amounts, show more decimal places
  if (amount < 0.01 && amount > 0) {
    return `${config.symbol}${amount.toFixed(maxDecimals)}`;
  }

  // For regular amounts, use standard formatting
  return `${config.symbol}${amount.toFixed(minDecimals)}`;
};

/**
 * Safe number parsing that preserves decimal precision
 */
export const parseDecimal = (value: string | number): number => {
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Safe expression evaluator for basic math operations
 * Handles decimal numbers with high precision
 */
export const evaluateExpression = (expression: string): number => {
  try {
    // Remove any non-mathematical characters for safety, but preserve decimals
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, "");

    // Use Function constructor instead of eval for better safety
    const func = new Function("return " + sanitized);
    const result = func();

    // Return result with full precision for decimal numbers
    return typeof result === "number" && !isNaN(result) ? result : 0;
  } catch (e) {
    return 0;
  }
};

/**
 * Check if a parameter should be visible based on conditional logic
 */
export const isParameterVisible = (
  param: Parameter,
  formValues: FormValues
): boolean => {
  if (!param.conditional) return true;
  const parentValue = formValues[param.conditional.parentParameter];
  return param.conditional.showWhen.includes(parentValue);
};

/**
 * Calculate derived values for DerivedCalc parameters
 */
export const calculateDerivedValues = (
  parameters: Parameter[],
  currentValues: FormValues
): FormValues => {
  const newValues = { ...currentValues };

  // Get derived parameters and sort by dependency order
  const derivedParams = parameters.filter(
    (p) => p.type === "DerivedCalc" && isParameterVisible(p, currentValues)
  );

  // Sort by dependency order (params with no deps first, then those that depend on already calculated ones)
  const sortedDerivedParams = [...derivedParams].sort((a, b) => {
    const aDeps = a.dependencies || [];
    const bDeps = b.dependencies || [];

    // If a has no dependencies but b does, a comes first
    if (aDeps.length === 0 && bDeps.length > 0) return -1;
    if (bDeps.length === 0 && aDeps.length > 0) return 1;

    // If a depends on b, b comes first
    if (aDeps.includes(b.name)) return 1;
    if (bDeps.includes(a.name)) return -1;

    return 0;
  });

  // Calculate derived values in order
  sortedDerivedParams.forEach((param) => {
    if (param.formula && param.dependencies) {
      try {
        // Replace parameter names with their values in the formula
        let formula = param.formula;
        param.dependencies.forEach((dep) => {
          const value = parseFloat(newValues[dep]) || 0;
          // Use high precision string representation for decimal numbers
          const valueStr = value.toString();
          formula = formula.replace(new RegExp(dep, "g"), valueStr);
        });

        const result = evaluateExpression(formula);
        newValues[param.name] = result.toString();
      } catch (e) {
        console.warn(`Error calculating derived value for ${param.name}:`, e);
        newValues[param.name] = "0";
      }
    }
  });

  return newValues;
};

/**
 * Update form value with automatic derived calculations
 */
export const updateFormValueWithCalculations = (
  name: string,
  value: any,
  parameters: Parameter[],
  currentValues: FormValues
): FormValues => {
  const newValues = { ...currentValues, [name]: value };

  // Calculate derived values that depend on this parameter
  const derivedParams = parameters.filter(
    (p) => p.type === "DerivedCalc" && p.dependencies?.includes(name)
  );

  // Keep calculating until no more changes occur (handles chained dependencies)
  let hasChanges = true;
  let iterations = 0;
  const maxIterations = 10; // Prevent infinite loops

  while (hasChanges && iterations < maxIterations) {
    hasChanges = false;
    iterations++;

    derivedParams.forEach((param) => {
      if (param.formula && param.dependencies) {
        try {
          let formula = param.formula;
          param.dependencies.forEach((dep) => {
            const depValue = parseFloat(newValues[dep]) || 0;
            // Use high precision string representation for decimal numbers
            const valueStr = depValue.toString();
            formula = formula.replace(new RegExp(dep, "g"), valueStr);
          });

          const result = evaluateExpression(formula);
          const newResult = result.toString();

          if (newValues[param.name] !== newResult) {
            newValues[param.name] = newResult;
            hasChanges = true;
          }
        } catch (e) {
          console.warn(`Error calculating derived value for ${param.name}:`, e);
          newValues[param.name] = "0";
        }
      }
    }); // Also check for any other derived params that might now have their dependencies satisfied
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
          param.dependencies.forEach((dep) => {
            const depValue = parseFloat(newValues[dep]) || 0;
            // Use high precision string representation for decimal numbers
            const valueStr = depValue.toString();
            formula = formula.replace(new RegExp(dep, "g"), valueStr);
          });

          const result = evaluateExpression(formula);
          const newResult = result.toString();

          if (newValues[param.name] !== newResult) {
            newValues[param.name] = newResult;
            hasChanges = true;
          }
        } catch (e) {
          console.warn(`Error calculating derived value for ${param.name}:`, e);
          newValues[param.name] = "0";
        }
      }
    });
  }

  return newValues;
};

/**
 * Calculate price breakdown and total
 */
export const calculatePrice = (
  parameters: Parameter[],
  formValues: FormValues,
  selectedCurrency: CurrencyType = "USD"
): { totalPrice: number; breakdown: PriceBreakdownItem[] } => {
  let unitTotal = 0;
  const breakdown: PriceBreakdownItem[] = [];

  // Get quantity from form values, default to 1
  const quantity = Number.parseFloat(formValues.quantity) || 1;

  const calculatedValues = calculateDerivedValues(parameters, formValues);

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
      if (param.pricing.base_price) {
        paramTotal += param.pricing.base_price;
        description += `Base: ${currencies[selectedCurrency].symbol}${param.pricing.base_price} per item`;
      }

      if (param.type === "FixedOption") {
        const selectedOption = param.options?.find(
          (opt) => opt.value === value
        );
        if (selectedOption) {
          // Add option base price
          if (selectedOption.pricing.base_price) {
            paramTotal += selectedOption.pricing.base_price;
            description += description ? "; " : "";
            description += `${selectedOption.label}: ${currencies[selectedCurrency].symbol}${selectedOption.pricing.base_price}`;
          }

          // Add sub-option pricing
          const subOptionKey = `${param.name}_suboption`;
          const selectedSubOption = formValues[subOptionKey];
          if (selectedSubOption && selectedOption.subOptions) {
            const subOpt = selectedOption.subOptions.find(
              (so) => so.value === selectedSubOption
            );
            if (subOpt && subOpt.price) {
              paramTotal += subOpt.price;
              description += description ? "; " : "";
              description += `${subOpt.label}: ${currencies[selectedCurrency].symbol}${subOpt.price}`;
            }
          }

          // Apply multiplier if present
          if (selectedOption.pricing.multiplier) {
            paramTotal *= selectedOption.pricing.multiplier;
            description += description ? "; " : "";
            description += `Multiplier: ${selectedOption.pricing.multiplier}x`;
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
        if (param.pricing.unit_price) {
          const unitPrice = param.pricing.unit_price * totalUnits;
          paramTotal += unitPrice;
          description += description ? "; " : "";
          description += `Unit price: ${currencies[selectedCurrency].symbol}${
            param.pricing.unit_price
          } × ${totalUnits.toLocaleString()} ${param.unit || "units"}`;
        }

        if (
          param.pricing.step_pricing &&
          totalUnits > param.pricing.step_pricing.threshold
        ) {
          const stepAmount =
            (totalUnits - param.pricing.step_pricing.threshold) *
            param.pricing.step_pricing.step_amount;
          paramTotal += stepAmount;
          description += description ? "; " : "";
          description += `Volume discount: ${currencies[selectedCurrency].symbol}${param.pricing.step_pricing.step_amount} per unit above ${param.pricing.step_pricing.threshold}`;
        }

        if (param.pricing.multiplier) {
          paramTotal *= param.pricing.multiplier;
          description += description ? "; " : "";
          description += `Multiplier: ${param.pricing.multiplier}x`;
        }
      }

      if (paramTotal > 0) {
        breakdown.push({
          parameter: param.label || param.name,
          description: description,
          amount: paramTotal,
        });
        unitTotal += paramTotal;
      }
    });

  const finalTotal = unitTotal * quantity;
  return { totalPrice: finalTotal, breakdown };
};

/**
 * Initialize derived calculations for all parameters
 */
export const initializeDerivedCalculations = (
  parameters: Parameter[],
  currentValues: FormValues
): FormValues => {
  const newValues = { ...currentValues };

  parameters
    .filter((p) => p.type === "DerivedCalc")
    .forEach((param) => {
      if (param.formula && param.dependencies) {
        try {
          let formula = param.formula;
          param.dependencies.forEach((dep) => {
            const value = parseFloat(newValues[dep]) || 0;
            // Use high precision string representation for decimal numbers
            const valueStr = value.toString();
            formula = formula.replace(new RegExp(dep, "g"), valueStr);
          });

          const result = evaluateExpression(formula);
          newValues[param.name] = result.toString();
        } catch (e) {
          console.warn(
            `Error initializing derived value for ${param.name}:`,
            e
          );
          newValues[param.name] = "0";
        }
      }
    });

  return newValues;
};

/**
 * Validate required sub-options
 */
export const validateRequiredSubOptions = (
  parameters: Parameter[],
  formValues: FormValues
): string[] => {
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
          const subOptionKey = `${param.name}_suboption`;
          const selectedSubOption = formValues[subOptionKey];

          if (!selectedSubOption || selectedSubOption === "") {
            errors.push(
              `Please select a ${param.label} option for ${selectedOption.label}`
            );
          }
        }
      }
    });

  return errors;
};
