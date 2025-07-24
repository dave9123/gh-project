import { Parameter } from "./formBuilderTypes";

export const createSampleMaterialParameters = (): Parameter[] => {
  return [
    // Parent parameter: Material Type
    {
      id: "material_type",
      name: "material",
      label: "Material Type",
      type: "FixedOption",
      required: true,
      pricing: {
        base_price: 10, // Base handling fee
      },
      options: [
        {
          label: "Material A",
          value: "material_a",
          pricing: {
            base_price: 50,
            multiplier: 1.0,
          },
        },
        {
          label: "Material B",
          value: "material_b",
          pricing: {
            base_price: 75,
            multiplier: 1.2,
          },
        },
      ],
    },

    // Conditional parameter: Grade for Material A
    {
      id: "grade_material_a",
      name: "grade_a",
      label: "Grade (Material A)",
      type: "FixedOption",
      required: true,
      pricing: {},
      conditional: {
        parentParameter: "material",
        showWhen: ["material_a"],
      },
      options: [
        {
          label: "Grade Z (Premium)",
          value: "grade_z",
          pricing: {
            base_price: 100,
            multiplier: 1.5,
          },
        },
        {
          label: "Grade X (Standard)",
          value: "grade_x",
          pricing: {
            base_price: 25,
            multiplier: 1.0,
          },
        },
      ],
    },

    // Conditional parameter: Grade for Material B
    {
      id: "grade_material_b",
      name: "grade_b",
      label: "Grade (Material B)",
      type: "FixedOption",
      required: true,
      pricing: {},
      conditional: {
        parentParameter: "material",
        showWhen: ["material_b"],
      },
      options: [
        {
          label: "Grade Y (Industrial)",
          value: "grade_y",
          pricing: {
            base_price: 80,
            multiplier: 1.3,
          },
        },
        {
          label: "Grade W (Commercial)",
          value: "grade_w",
          pricing: {
            base_price: 40,
            multiplier: 1.1,
          },
        },
      ],
    },

    // Regular numeric parameter
    {
      id: "quantity",
      name: "quantity",
      label: "Quantity",
      type: "NumericValue",
      required: true,
      min: 1,
      max: 1000,
      step: 1,
      unit: "units",
      pricing: {
        unit_price: 2.5,
      },
    },
  ];
};
