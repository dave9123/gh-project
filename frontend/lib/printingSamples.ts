import { Parameter } from "./formBuilderTypes";

// 1. Business Cards - Simple quantity-based pricing with material options
export const businessCardsSample = (): Parameter[] => [
  {
    id: "bc_material",
    name: "material",
    label: "Card Material",
    description:
      "Choose the paper stock for your business cards. Higher point values indicate thicker, more premium materials.",
    type: "FixedOption",
    required: true,
    pricing: { base_price: 5 }, // Setup fee
    options: [
      {
        label: "Standard (14pt)",
        value: "standard",
        description: "Lightweight, cost-effective option for everyday use",
        pricing: { base_price: 0, multiplier: 1.0 },
        subOptions: [
          {
            id: "matte_finish",
            label: "Matte Finish",
            value: "matte",
            description: "Non-reflective finish that reduces fingerprints",
            price: 2,
            pricingScope: "per_qty",
          },
          {
            id: "gloss_finish",
            label: "Gloss Finish",
            value: "gloss",
            description: "Shiny finish that makes colors pop",
            price: 3,
            pricingScope: "per_qty",
          },
        ],
      },
      {
        label: "Premium (16pt)",
        value: "premium",
        description: "Thicker stock with better feel and durability",
        pricing: { base_price: 15, multiplier: 1.3 },
        subOptions: [
          {
            id: "spot_uv",
            label: "Spot UV Coating",
            value: "spot_uv",
            description: "Adds selective glossy coating to specific areas",
            price: 8,
            pricingScope: "per_qty",
          },
          {
            id: "embossing",
            label: "Embossed Text",
            value: "emboss",
            description: "Raised text effect for premium look",
            price: 12,
            pricingScope: "per_qty",
          },
        ],
      },
      {
        label: "Luxury (18pt + UV)",
        value: "luxury",
        description: "Premium thick stock with UV coating included",
        pricing: { base_price: 35, multiplier: 1.8 },
        subOptions: [
          {
            id: "foil_stamping",
            label: "Foil Stamping",
            value: "foil",
            description: "Metallic foil accents (gold or silver)",
            price: 20,
            pricingScope: "per_qty",
          },
          {
            id: "die_cut",
            label: "Custom Die Cut",
            value: "die_cut",
            description: "Custom shape cutting for unique cards",
            price: 25,
            pricingScope: "per_qty",
          },
        ],
      },
    ],
  },
  {
    id: "bc_quantity",
    name: "quantity",
    label: "Quantity",
    type: "NumericValue",
    required: true,
    min: 100,
    max: 10000,
    step: 50,
    unit: "cards",
    pricing: {
      unit_price: 0.12,
      step_pricing: { threshold: 1000, step_amount: -0.02 }, // Discount for bulk
    },
  },
];

// 2. Banners - Area-based pricing with material and finishing options
export const bannersSample = (): Parameter[] => [
  {
    id: "banner_width",
    name: "width",
    label: "Width",
    type: "NumericValue",
    required: true,
    min: 12,
    max: 120,
    step: 6,
    unit: "inches",
    pricing: {},
  },
  {
    id: "banner_height",
    name: "height",
    label: "Height",
    type: "NumericValue",
    required: true,
    min: 12,
    max: 60,
    step: 6,
    unit: "inches",
    pricing: {},
  },
  {
    id: "banner_area",
    name: "area",
    label: "Total Area",
    type: "DerivedCalc",
    required: false,
    formula: "width * height / 144", // Convert to square feet
    dependencies: ["width", "height"],
    pricing: { unit_price: 3.5 }, // Per square foot
  },
  {
    id: "banner_material",
    name: "banner_material",
    label: "Material Type",
    type: "FixedOption",
    required: true,
    pricing: {},
    options: [
      {
        label: "13oz Vinyl",
        value: "vinyl_13oz",
        pricing: { multiplier: 1.0 },
      },
      {
        label: "18oz Vinyl (Heavy Duty)",
        value: "vinyl_18oz",
        pricing: { multiplier: 1.4 },
      },
      {
        label: "Mesh (Wind Resistant)",
        value: "mesh",
        pricing: { multiplier: 1.2 },
      },
    ],
  },
  {
    id: "banner_grommets",
    name: "grommets",
    label: "Grommets",
    type: "FixedOption",
    required: true,
    pricing: {},
    options: [
      {
        label: "Standard (every 2 feet)",
        value: "standard",
        pricing: { base_price: 8 },
      },
      {
        label: "Reinforced (every 18 inches)",
        value: "reinforced",
        pricing: { base_price: 15 },
      },
    ],
  },
];

// 3. T-Shirt Printing - Quantity breaks with setup and color charges
export const tshirtSample = (): Parameter[] => [
  {
    id: "tshirt_quantity",
    name: "quantity",
    label: "Quantity",
    type: "NumericValue",
    required: true,
    min: 12,
    max: 1000,
    step: 1,
    unit: "shirts",
    pricing: {
      base_price: 25, // Screen setup fee
      unit_price: 8.5,
      step_pricing: { threshold: 50, step_amount: -0.75 }, // Volume discount
    },
  },
  {
    id: "tshirt_colors",
    name: "colors",
    label: "Number of Print Colors",
    type: "FixedOption",
    required: true,
    pricing: {},
    options: [
      {
        label: "1 Color",
        value: "1",
        pricing: { base_price: 0 },
      },
      {
        label: "2 Colors",
        value: "2",
        pricing: { base_price: 15 },
      },
      {
        label: "3 Colors",
        value: "3",
        pricing: { base_price: 30 },
      },
      {
        label: "4+ Colors (Full Color)",
        value: "full",
        pricing: { base_price: 50, multiplier: 1.3 },
      },
    ],
  },
  {
    id: "tshirt_sides",
    name: "sides",
    label: "Print Locations",
    type: "FixedOption",
    required: true,
    pricing: {},
    options: [
      {
        label: "Front Only",
        value: "front",
        pricing: { multiplier: 1.0 },
      },
      {
        label: "Front + Back",
        value: "both",
        pricing: { base_price: 20, multiplier: 1.4 },
      },
    ],
  },
];

// 4. Stickers - Die-cut vs standard with size tiers
export const stickersSample = (): Parameter[] => [
  {
    id: "sticker_type",
    name: "type",
    label: "Sticker Type",
    type: "FixedOption",
    required: true,
    pricing: {},
    options: [
      {
        label: "Standard Shape (Rectangle/Circle)",
        value: "standard",
        pricing: { base_price: 0 },
      },
      {
        label: "Die-Cut (Custom Shape)",
        value: "diecut",
        pricing: { base_price: 45 }, // Die setup fee
      },
    ],
  },
  {
    id: "sticker_size",
    name: "size",
    label: "Size Category",
    type: "FixedOption",
    required: true,
    pricing: {},
    options: [
      {
        label: 'Small (up to 2")',
        value: "small",
        pricing: { unit_price: 0.25 },
      },
      {
        label: 'Medium (2-4")',
        value: "medium",
        pricing: { unit_price: 0.45 },
      },
      {
        label: 'Large (4-6")',
        value: "large",
        pricing: { unit_price: 0.85 },
      },
      {
        label: 'Extra Large (6"+)',
        value: "xlarge",
        pricing: { unit_price: 1.5 },
      },
    ],
  },
  {
    id: "sticker_quantity",
    name: "quantity",
    label: "Quantity",
    type: "NumericValue",
    required: true,
    min: 25,
    max: 10000,
    step: 25,
    unit: "stickers",
    pricing: {
      step_pricing: { threshold: 500, step_amount: -0.05 },
    },
  },
];

// 5. Brochures - Page count with folding and paper options
export const brochuresSample = (): Parameter[] => [
  {
    id: "brochure_pages",
    name: "pages",
    label: "Number of Pages",
    type: "FixedOption",
    required: true,
    pricing: { base_price: 12 }, // Design setup
    options: [
      {
        label: "Tri-fold (6 panels)",
        value: "trifold",
        pricing: { unit_price: 0.35 },
      },
      {
        label: "Bi-fold (4 panels)",
        value: "bifold",
        pricing: { unit_price: 0.28 },
      },
      {
        label: "Z-fold (6 panels)",
        value: "zfold",
        pricing: { unit_price: 0.38 },
      },
      {
        label: "8-page Booklet",
        value: "booklet8",
        pricing: { base_price: 8, unit_price: 0.55 },
      },
    ],
  },
  {
    id: "brochure_paper",
    name: "paper",
    label: "Paper Type",
    type: "FixedOption",
    required: true,
    pricing: {},
    options: [
      {
        label: "100lb Text",
        value: "100text",
        pricing: { multiplier: 1.0 },
      },
      {
        label: "100lb Gloss Cover",
        value: "100gloss",
        pricing: { multiplier: 1.25 },
      },
      {
        label: "14pt Cardstock",
        value: "14pt",
        pricing: { multiplier: 1.6 },
      },
    ],
  },
  {
    id: "brochure_quantity",
    name: "quantity",
    label: "Quantity",
    type: "NumericValue",
    required: true,
    min: 100,
    max: 5000,
    step: 50,
    unit: "brochures",
    pricing: {
      step_pricing: { threshold: 1000, step_amount: -0.08 },
    },
  },
];

// 6. Canvas Prints - Size-based with frame options
export const canvasSample = (): Parameter[] => [
  {
    id: "canvas_size",
    name: "size",
    label: "Canvas Size",
    type: "FixedOption",
    required: true,
    pricing: { base_price: 15 }, // Stretching fee
    options: [
      {
        label: '8" x 10"',
        value: "8x10",
        pricing: { base_price: 25 },
      },
      {
        label: '11" x 14"',
        value: "11x14",
        pricing: { base_price: 35 },
      },
      {
        label: '16" x 20"',
        value: "16x20",
        pricing: { base_price: 55 },
      },
      {
        label: '20" x 24"',
        value: "20x24",
        pricing: { base_price: 85 },
      },
      {
        label: '24" x 36"',
        value: "24x36",
        pricing: { base_price: 125 },
      },
    ],
  },
  {
    id: "canvas_frame",
    name: "frame",
    label: "Frame Option",
    type: "FixedOption",
    required: true,
    pricing: {},
    options: [
      {
        label: "Gallery Wrap (No Frame)",
        value: "gallery",
        pricing: { multiplier: 1.0 },
      },
      {
        label: "Black Float Frame",
        value: "black_float",
        pricing: { base_price: 35, multiplier: 1.2 },
      },
      {
        label: "Natural Wood Frame",
        value: "wood_frame",
        pricing: { base_price: 45, multiplier: 1.3 },
      },
    ],
  },
];

// 7. Vehicle Wraps - Complex area calculation with material grades
export const vehicleWrapSample = (): Parameter[] => [
  {
    id: "vehicle_type",
    name: "vehicle_type",
    label: "Vehicle Type",
    type: "FixedOption",
    required: true,
    pricing: { base_price: 150 }, // Design/template fee
    options: [
      {
        label: "Compact Car",
        value: "compact",
        pricing: { base_price: 800 },
      },
      {
        label: "Sedan/SUV",
        value: "sedan",
        pricing: { base_price: 1200 },
      },
      {
        label: "Pickup Truck",
        value: "pickup",
        pricing: { base_price: 1400 },
      },
      {
        label: "Van/Box Truck",
        value: "van",
        pricing: { base_price: 1800 },
      },
    ],
  },
  {
    id: "wrap_coverage",
    name: "coverage",
    label: "Wrap Coverage",
    type: "FixedOption",
    required: true,
    pricing: {},
    options: [
      {
        label: "Partial Wrap (30%)",
        value: "partial",
        pricing: { multiplier: 0.4 },
      },
      {
        label: "Half Wrap (50%)",
        value: "half",
        pricing: { multiplier: 0.6 },
      },
      {
        label: "Full Wrap (100%)",
        value: "full",
        pricing: { multiplier: 1.0 },
      },
    ],
  },
  {
    id: "vinyl_grade",
    name: "vinyl_grade",
    label: "Vinyl Grade",
    type: "FixedOption",
    required: true,
    pricing: {},
    options: [
      {
        label: "Standard (3-year)",
        value: "standard",
        pricing: { multiplier: 1.0 },
      },
      {
        label: "Premium (5-year)",
        value: "premium",
        pricing: { multiplier: 1.3 },
      },
      {
        label: "Cast (7-year)",
        value: "cast",
        pricing: { multiplier: 1.6 },
      },
    ],
  },
];

// 8. Wedding Invitations - Quantity tiers with premium options
export const weddingInvitesSample = (): Parameter[] => [
  {
    id: "invite_style",
    name: "style",
    label: "Invitation Style",
    type: "FixedOption",
    required: true,
    pricing: { base_price: 25 }, // Setup fee
    options: [
      {
        label: "Digital Print",
        value: "digital",
        pricing: { unit_price: 1.25 },
      },
      {
        label: "Letterpress",
        value: "letterpress",
        pricing: { base_price: 85, unit_price: 3.5 },
      },
      {
        label: "Foil Stamping",
        value: "foil",
        pricing: { base_price: 125, unit_price: 4.25 },
      },
    ],
  },
  {
    id: "invite_paper",
    name: "paper",
    label: "Paper Stock",
    type: "FixedOption",
    required: true,
    pricing: {},
    options: [
      {
        label: "Cotton (110lb)",
        value: "cotton",
        pricing: { multiplier: 1.0 },
      },
      {
        label: "Linen (120lb)",
        value: "linen",
        pricing: { multiplier: 1.4 },
      },
      {
        label: "Pearl Shimmer",
        value: "pearl",
        pricing: { multiplier: 1.8 },
      },
    ],
  },
  {
    id: "invite_quantity",
    name: "quantity",
    label: "Quantity",
    type: "NumericValue",
    required: true,
    min: 25,
    max: 500,
    step: 25,
    unit: "invitations",
    pricing: {
      step_pricing: { threshold: 100, step_amount: -0.15 },
    },
  },
];

// 9. Posters - Size categories with paper types
export const postersSample = (): Parameter[] => [
  {
    id: "poster_size",
    name: "size",
    label: "Poster Size",
    type: "FixedOption",
    required: true,
    pricing: {},
    options: [
      {
        label: '11" x 17"',
        value: "11x17",
        pricing: { base_price: 8 },
      },
      {
        label: '18" x 24"',
        value: "18x24",
        pricing: { base_price: 15 },
      },
      {
        label: '24" x 36"',
        value: "24x36",
        pricing: { base_price: 25 },
      },
      {
        label: '27" x 40"',
        value: "27x40",
        pricing: { base_price: 35 },
      },
    ],
  },
  {
    id: "poster_paper",
    name: "paper",
    label: "Paper Type",
    type: "FixedOption",
    required: true,
    pricing: {},
    options: [
      {
        label: "Standard (80lb)",
        value: "standard",
        pricing: { multiplier: 1.0 },
      },
      {
        label: "Satin Photo",
        value: "satin",
        pricing: { multiplier: 1.5 },
      },
      {
        label: "Glossy Photo",
        value: "glossy",
        pricing: { multiplier: 1.6 },
      },
      {
        label: "Canvas Texture",
        value: "canvas",
        pricing: { multiplier: 2.2 },
      },
    ],
  },
  {
    id: "poster_quantity",
    name: "quantity",
    label: "Quantity",
    type: "NumericValue",
    required: true,
    min: 1,
    max: 100,
    step: 1,
    unit: "posters",
    pricing: {
      step_pricing: { threshold: 10, step_amount: -0.5 },
    },
  },
];

// 10. Custom Packaging - Box dimensions with material and finish options
export const packagingSample = (): Parameter[] => [
  {
    id: "box_length",
    name: "length",
    label: "Length",
    type: "NumericValue",
    required: true,
    min: 2,
    max: 24,
    step: 0.25,
    unit: "inches",
    pricing: {},
  },
  {
    id: "box_width",
    name: "width",
    label: "Width",
    type: "NumericValue",
    required: true,
    min: 2,
    max: 18,
    step: 0.25,
    unit: "inches",
    pricing: {},
  },
  {
    id: "box_height",
    name: "height",
    label: "Height",
    type: "NumericValue",
    required: true,
    min: 1,
    max: 12,
    step: 0.25,
    unit: "inches",
    pricing: {},
  },
  {
    id: "box_volume",
    name: "volume",
    label: "Box Volume",
    type: "DerivedCalc",
    required: false,
    formula: "length * width * height",
    dependencies: ["length", "width", "height"],
    pricing: {
      base_price: 2.5, // Base box cost
      unit_price: 0.08, // Per cubic inch
    },
  },
  {
    id: "box_material",
    name: "material",
    label: "Material",
    type: "FixedOption",
    required: true,
    pricing: {},
    options: [
      {
        label: "Standard Cardboard",
        value: "cardboard",
        pricing: { multiplier: 1.0 },
      },
      {
        label: "Corrugated",
        value: "corrugated",
        pricing: { multiplier: 1.4 },
      },
      {
        label: "Rigid Chipboard",
        value: "rigid",
        pricing: { multiplier: 1.8 },
      },
    ],
  },
  {
    id: "box_finish",
    name: "finish",
    label: "Finish Options",
    type: "FixedOption",
    required: true,
    pricing: {},
    options: [
      {
        label: "Plain (No Print)",
        value: "plain",
        pricing: { multiplier: 1.0 },
      },
      {
        label: "1-Color Print",
        value: "1color",
        pricing: { base_price: 35, multiplier: 1.3 },
      },
      {
        label: "Full Color Print",
        value: "fullcolor",
        pricing: { base_price: 65, multiplier: 1.8 },
      },
      {
        label: "Spot UV + Full Color",
        value: "uv_full",
        pricing: { base_price: 125, multiplier: 2.4 },
      },
    ],
  },
  {
    id: "box_quantity",
    name: "quantity",
    label: "Quantity",
    type: "NumericValue",
    required: true,
    min: 50,
    max: 10000,
    step: 50,
    unit: "boxes",
    pricing: {
      step_pricing: { threshold: 500, step_amount: -0.25 },
    },
  },
];

// Export all samples
export const printingSamples = {
  "Business Cards": businessCardsSample,
  Banners: bannersSample,
  "T-Shirt Printing": tshirtSample,
  Stickers: stickersSample,
  Brochures: brochuresSample,
  "Canvas Prints": canvasSample,
  "Vehicle Wraps": vehicleWrapSample,
  "Wedding Invitations": weddingInvitesSample,
  Posters: postersSample,
  "Custom Packaging": packagingSample,
};
