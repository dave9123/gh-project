/**
 * File Metadata Extraction Utilities
 * Shared utilities for extracting metadata from uploaded files
 */

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  pages?: number;
  width?: number;
  height?: number;
  aspectRatio?: number;
  megapixels?: number;
  triangles?: number;
  vertices?: number;
  faces?: number;
  estimatedVertices?: number;
  fileFormat?: string;
  gcodeLines?: number;
  printTimeSeconds?: number;
  printTimeHours?: number;
  layerHeight?: number;
  lines?: number;
  words?: number;
  characters?: number;
  sizeCategory?: string;
  sizeValue?: number;
  volume?: number; // in cubic millimeters
  weightGrams?: number; // estimated weight in grams
  materialDensity?: number; // g/cm³ used for weight calculation
  [key: string]: any; // Allow additional properties for flexibility
}

export interface FileUploadConnection {
  id: string;
  metadataKey: string; // e.g., "pages", "width", "height"
  parameterName: string; // which parameter to link to
  description: string;
}

// Common 3D printing material densities (g/cm³)
export const materialDensities = {
  PLA: 1.24,
  ABS: 1.05,
  PETG: 1.27,
  TPU: 1.2,
  PC: 1.2,
  ASA: 1.05,
  Nylon: 1.14,
  "Wood Fill": 1.28,
  "Metal Fill": 4.0,
  "Carbon Fiber": 1.3,
  Generic: 1.24, // Default PLA density
};

// Default file type mapping
export const defaultFileTypeMap: { [key: string]: string[] } = {
  pdf: [".pdf"],
  images: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"],
  "3d": [".stl", ".obj", ".ply", ".3mf", ".amf", ".gcode"],
  documents: [".doc", ".docx", ".txt"],
};

/**
 * Mock file metadata extraction (simulates the real extractFileMetadata function)
 * This is used for demonstration purposes
 */
export const extractMockFileMetadata = async (
  file: File
): Promise<FileMetadata> => {
  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const fileExtension = file.name.split(".").pop()?.toLowerCase();

  // Base metadata that all files have
  const baseMetadata: FileMetadata = {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  };

  if (
    fileExtension &&
    [".stl", ".obj", ".ply", ".3mf", ".amf"].includes(`.${fileExtension}`)
  ) {
    // Mock 3D file metadata
    return {
      ...baseMetadata,
      fileFormat: `${fileExtension.toUpperCase()} file`,
      volume: Math.floor(Math.random() * 100000) + 10000, // Random volume between 10,000-110,000 mm³
      weightGrams: Math.floor(Math.random() * 200) + 20, // Random weight between 20-220g
      triangles: Math.floor(Math.random() * 50000) + 5000,
      vertices: Math.floor(Math.random() * 25000) + 2500,
      estimatedVertices: Math.floor(Math.random() * 25000) + 2500,
    };
  } else if (fileExtension === "gcode") {
    return {
      ...baseMetadata,
      fileFormat: "G-Code file",
      gcodeLines: Math.floor(Math.random() * 100000) + 10000,
      printTimeSeconds: Math.floor(Math.random() * 86400) + 3600, // 1-24 hours
      printTimeHours: Math.round((Math.random() * 23 + 1) * 100) / 100,
      layerHeight: 0.2,
      volume: Math.floor(Math.random() * 100000) + 10000,
      weightGrams: Math.floor(Math.random() * 200) + 20,
    };
  } else if (file.type === "application/pdf") {
    // Mock PDF metadata
    return {
      ...baseMetadata,
      fileFormat: "PDF Document",
      pages: Math.floor(Math.random() * 50) + 1, // 1-50 pages
    };
  } else if (file.type.startsWith("image/")) {
    // Mock image metadata
    const width = Math.floor(Math.random() * 3000) + 500; // 500-3500px
    const height = Math.floor(Math.random() * 3000) + 500;
    return {
      ...baseMetadata,
      fileFormat: "Image File",
      width,
      height,
      aspectRatio: +(width / height).toFixed(2),
      megapixels: Math.round(((width * height) / 1000000) * 100) / 100,
    };
  }

  return baseMetadata;
};

/**
 * Apply file connections to form values
 */
export const applyFileConnections = (
  metadata: FileMetadata,
  connections: FileUploadConnection[],
  updateFormValue: (name: string, value: string) => void
): void => {
  connections.forEach((connection) => {
    const metadataValue = metadata[connection.metadataKey];
    if (metadataValue !== undefined) {
      console.log(
        `Auto-filling ${connection.parameterName} with ${metadataValue} from file ${connection.metadataKey}`
      );
      updateFormValue(connection.parameterName, metadataValue.toString());
    }
  });
};

/**
 * Generate file accept string from file type map
 */
export const getFileAcceptString = (fileTypeMap: string[]): string => {
  return fileTypeMap.join(",");
};

/**
 * Calculate weight based on volume and material density
 */
export const calculateWeight = (
  volumeMM3: number,
  materialDensity: number = materialDensities.Generic
): number => {
  // Convert mm³ to cm³ (divide by 1000)
  const volumeCM3 = volumeMM3 / 1000;
  // Weight = volume × density (g/cm³)
  return volumeCM3 * materialDensity;
};

/**
 * Format file metadata value for display
 */
export const formatMetadataValue = (key: string, value: any): string => {
  if (typeof value === "number") {
    if (key.includes("Time") && key.includes("Hours")) {
      return `${value} hours`;
    } else if (key.includes("volume")) {
      return `${value.toLocaleString()} mm³`;
    } else if (key.includes("weight") || key.includes("Weight")) {
      return `${value}g`;
    } else {
      return value.toLocaleString();
    }
  }
  return value;
};

/**
 * Format metadata key for display (camelCase to Title Case)
 */
export const formatMetadataKey = (key: string): string => {
  return key.replace(/([A-Z])/g, " $1").trim();
};
