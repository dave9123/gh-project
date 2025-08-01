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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  Calculator,
  Eye,
  FileText,
  Upload,
  Link,
  ChevronUp,
  ChevronDown,
  Save,
  AlertTriangle,
  Download,
  MoreVertical,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { printingSamples } from "@/lib/printingSamples";
import NumberFlow from "@number-flow/react";
import FormRenderer from "@/components/form-renderer";
import type {
  InputDisplayType,
  Parameter,
  ParameterType,
  PricingRule,
  FixedOption,
  SubOption,
} from "@/lib/formBuilderTypes";
import type { ProductTypes } from "@/lib/product.d";
import { redirect, useRouter } from "next/navigation";

type CurrencyType = "USD" | "IDR";

interface CurrencyConfig {
  symbol: string;
  code: string;
  name: string;
}

interface FormValues {
  [key: string]: any;
}

interface FileMetadata {
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
  [key: string]: any;
}

interface FileUploadConnection {
  id: string;
  metadataKey: string; // e.g., "pages", "width", "height"
  parameterName: string; // which parameter to link to
  description: string;
}

export interface FormBuilderData {
  id?: string;
  name: string;
  description?: string;
  parameters: Parameter[];
  currency: CurrencyType;
  fileConnections: FileUploadConnection[];
  selectedFileType?: string;
  fileTypeMap?: string[];
  formValues: FormValues;
  createdAt?: string;
  updatedAt?: string;
}

interface SaveResponse {
  success: boolean;
  message: string;
  data?: FormBuilderData;
  error?: string;
}

interface QuoteFormBuilderProps {
  product?: (ProductTypes & { formData: FormBuilderData }) | null;
}

// Safe expression evaluator for basic math operations
// Handles decimal numbers with high precision
const evaluateExpression = (expression: string): number => {
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

// Safe number parsing that preserves decimal precision
const parseDecimal = (value: string | number): number => {
  if (typeof value === "number") return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// Extract metadata from uploaded files
const extractFileMetadata = async (file: File): Promise<FileMetadata> => {
  const metadata: FileMetadata = {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  };

  // Extract PDF page count
  if (file.type === "application/pdf") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const text = new TextDecoder().decode(uint8Array);

      // Simple PDF page count extraction - look for /Count in PDF structure
      const countMatch = text.match(/\/Count\s+(\d+)/);
      if (countMatch) {
        metadata.pages = parseInt(countMatch[1]);
      } else {
        // Alternative method - count page objects
        const pageMatches = text.match(/\/Type\s*\/Page[^s]/g);
        metadata.pages = pageMatches ? pageMatches.length : 1;
      }
    } catch (error) {
      console.warn("Could not extract PDF metadata:", error);
      metadata.pages = 1; // Default to 1 page if extraction fails
    }
  }

  // For images, extract dimensions and other metadata
  if (file.type.startsWith("image/")) {
    try {
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });
      metadata.width = img.width;
      metadata.height = img.height;
      metadata.aspectRatio = +(img.width / img.height).toFixed(2);
      metadata.megapixels = +((img.width * img.height) / 1000000).toFixed(2);
      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      console.warn("Could not extract image metadata:", error);
    }
  }

  // For 3D files (STL, OBJ, etc.)
  const fileExtension = file.name.split(".").pop()?.toLowerCase();
  if (
    ["stl", "obj", "ply", "3mf", "amf", "gcode"].includes(fileExtension || "")
  ) {
    try {
      const arrayBuffer = await file.arrayBuffer();

      if (fileExtension === "stl") {
        // STL file analysis
        const isAscii = isSTLAscii(arrayBuffer);
        metadata.fileFormat = isAscii ? "ASCII STL" : "Binary STL";

        if (!isAscii) {
          // Binary STL - extract triangle count
          const dataView = new DataView(arrayBuffer);
          if (arrayBuffer.byteLength >= 84) {
            metadata.triangles = dataView.getUint32(80, true);
            metadata.estimatedVertices = metadata.triangles * 3;
          }
        } else {
          // ASCII STL - count facets
          const text = new TextDecoder().decode(arrayBuffer);
          const facetMatches = text.match(/facet normal/g);
          metadata.triangles = facetMatches ? facetMatches.length : 0;
          metadata.estimatedVertices = metadata.triangles * 3;
        }

        // Calculate volume and weight for STL files
        if (metadata.triangles && metadata.triangles > 0) {
          metadata.volume = calculateSTLVolume(arrayBuffer, isAscii);
          metadata.materialDensity = materialDensities["Generic"]; // Default to PLA
          metadata.weightGrams = +calculateWeight(
            metadata.volume,
            metadata.materialDensity
          ).toFixed(2);
        }
      } else if (fileExtension === "obj") {
        // OBJ file analysis
        const text = new TextDecoder().decode(arrayBuffer);
        const vertices = text.match(/^v\s/gm);
        const faces = text.match(/^f\s/gm);
        metadata.vertices = vertices ? vertices.length : 0;
        metadata.faces = faces ? faces.length : 0;
        metadata.fileFormat = "Wavefront OBJ";

        // Calculate volume and weight for OBJ files if we have face data
        if (metadata.faces && metadata.faces > 0) {
          try {
            const volume = calculateOBJVolume(text);
            if (volume > 0) {
              metadata.volume = volume;
              metadata.materialDensity = materialDensities["Generic"]; // Default to PLA
              metadata.weightGrams = +calculateWeight(
                metadata.volume,
                metadata.materialDensity
              ).toFixed(2);
            }
          } catch (error) {
            console.warn("Could not calculate OBJ volume:", error);
          }
        }
      } else if (fileExtension === "ply") {
        // PLY file analysis
        const text = new TextDecoder().decode(arrayBuffer);
        metadata.fileFormat = "Stanford PLY";

        // Extract vertex and face counts from PLY header
        const vertexMatch = text.match(/element vertex (\d+)/);
        const faceMatch = text.match(/element face (\d+)/);

        if (vertexMatch) metadata.vertices = parseInt(vertexMatch[1]);
        if (faceMatch) {
          metadata.faces = parseInt(faceMatch[1]);
          metadata.triangles = metadata.faces; // Most PLY faces are triangles
        }

        // Calculate volume and weight for PLY files
        if (metadata.faces && metadata.faces > 0) {
          try {
            const volume = calculatePLYVolume(arrayBuffer);
            if (volume > 0) {
              metadata.volume = volume;
              metadata.materialDensity = materialDensities["Generic"];
              metadata.weightGrams = +calculateWeight(
                metadata.volume,
                metadata.materialDensity
              ).toFixed(2);
            }
          } catch (error) {
            console.warn("Could not calculate PLY volume:", error);
          }
        }
      } else if (fileExtension === "3mf") {
        // 3MF file analysis
        metadata.fileFormat = "3D Manufacturing Format";

        // 3MF files are ZIP archives containing XML - basic analysis
        try {
          // Estimate complexity based on file size (rough approximation)
          const sizeKB = arrayBuffer.byteLength / 1024;
          metadata.estimatedVertices = Math.floor(sizeKB * 100); // Rough estimate
          metadata.faces = Math.floor(metadata.estimatedVertices / 3);

          // For 3MF, we'll use a simplified volume estimation based on file size
          // This is less accurate but provides some useful metadata
          metadata.volume = Math.floor(sizeKB * 50); // Very rough estimate
          metadata.materialDensity = materialDensities["Generic"];
          metadata.weightGrams = +calculateWeight(
            metadata.volume,
            metadata.materialDensity
          ).toFixed(2);
        } catch (error) {
          console.warn("Could not analyze 3MF file:", error);
        }
      } else if (fileExtension === "amf") {
        // AMF file analysis
        metadata.fileFormat = "Additive Manufacturing Format";

        try {
          const text = new TextDecoder().decode(arrayBuffer);

          // AMF is XML-based, look for mesh information
          const vertexMatches = text.match(/<vertex>/g);
          const triangleMatches = text.match(/<triangle>/g);

          if (vertexMatches) metadata.vertices = vertexMatches.length;
          if (triangleMatches) {
            metadata.triangles = triangleMatches.length;
            metadata.faces = metadata.triangles;
          }

          // Calculate volume for AMF files if we have triangle data
          if (metadata.triangles && metadata.triangles > 0) {
            try {
              const volume = calculateAMFVolume(text);
              if (volume > 0) {
                metadata.volume = volume;
                metadata.materialDensity = materialDensities["Generic"];
                metadata.weightGrams = +calculateWeight(
                  metadata.volume,
                  metadata.materialDensity
                ).toFixed(2);
              }
            } catch (error) {
              console.warn("Could not calculate AMF volume:", error);
            }
          }
        } catch (error) {
          console.warn("Could not analyze AMF file:", error);
        }
      } else if (fileExtension === "gcode") {
        // G-code analysis
        const text = new TextDecoder().decode(arrayBuffer);
        const lines = text.split("\n");
        metadata.gcodeLines = lines.length;
        metadata.fileFormat = "G-code";

        // Extract print time estimate if available
        const timeMatch = text.match(/;TIME:(\d+)/);
        if (timeMatch) {
          metadata.printTimeSeconds = parseInt(timeMatch[1]);
          metadata.printTimeHours = +(metadata.printTimeSeconds / 3600).toFixed(
            2
          );
        }

        // Extract layer height if available
        const layerMatch = text.match(/;LAYER_HEIGHT:([\d.]+)/);
        if (layerMatch) {
          metadata.layerHeight = parseFloat(layerMatch[1]);
        }

        // Estimate volume from filament usage if available in G-code comments
        const filamentMatch = text.match(/;Filament used: ([\d.]+)m/);
        if (filamentMatch) {
          const filamentLength = parseFloat(filamentMatch[1]) * 1000; // Convert to mm
          const filamentDiameter = 1.75; // Standard 1.75mm filament
          const filamentRadius = filamentDiameter / 2;
          metadata.volume =
            Math.PI * filamentRadius * filamentRadius * filamentLength;
          metadata.materialDensity = materialDensities["Generic"];
          metadata.weightGrams = +calculateWeight(
            metadata.volume,
            metadata.materialDensity
          ).toFixed(2);
        }
      }
    } catch (error) {
      console.warn("Could not extract 3D file metadata:", error);
      metadata.fileFormat = `${fileExtension?.toUpperCase()} file`;
    }
  }

  // For document files
  if (
    [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
    ].includes(file.type)
  ) {
    metadata.fileFormat = getDocumentFormat(file.type);

    // For text files, count lines and words
    if (file.type === "text/plain" || file.type === "text/csv") {
      try {
        const text = await file.text();
        metadata.lines = text.split("\n").length;
        metadata.words = text
          .split(/\s+/)
          .filter((word) => word.length > 0).length;
        metadata.characters = text.length;
      } catch (error) {
        console.warn("Could not analyze text file:", error);
      }
    }
  }

  // Add file size categories for easier selection
  if (metadata.fileSize < 1024) {
    metadata.sizeCategory = "Bytes";
    metadata.sizeValue = metadata.fileSize;
  } else if (metadata.fileSize < 1024 * 1024) {
    metadata.sizeCategory = "KB";
    metadata.sizeValue = +(metadata.fileSize / 1024).toFixed(2);
  } else if (metadata.fileSize < 1024 * 1024 * 1024) {
    metadata.sizeCategory = "MB";
    metadata.sizeValue = +(metadata.fileSize / (1024 * 1024)).toFixed(2);
  } else {
    metadata.sizeCategory = "GB";
    metadata.sizeValue = +(metadata.fileSize / (1024 * 1024 * 1024)).toFixed(2);
  }

  return metadata;
};

// Helper function to detect if STL is ASCII or Binary
const isSTLAscii = (arrayBuffer: ArrayBuffer): boolean => {
  const text = new TextDecoder().decode(arrayBuffer.slice(0, 80));
  return text.toLowerCase().includes("solid");
};

// Helper function to calculate STL volume from triangles
const calculateSTLVolume = (
  arrayBuffer: ArrayBuffer,
  isAscii: boolean
): number => {
  try {
    if (isAscii) {
      return calculateAsciiSTLVolume(arrayBuffer);
    } else {
      return calculateBinarySTLVolume(arrayBuffer);
    }
  } catch (error) {
    console.warn("Could not calculate STL volume:", error);
    return 0;
  }
};

// Calculate volume for ASCII STL using signed volume of triangles
const calculateAsciiSTLVolume = (arrayBuffer: ArrayBuffer): number => {
  const text = new TextDecoder().decode(arrayBuffer);
  const vertexPattern =
    /vertex\s+([-+]?[0-9]*\.?[0-9]+)\s+([-+]?[0-9]*\.?[0-9]+)\s+([-+]?[0-9]*\.?[0-9]+)/g;

  let totalVolume = 0;
  let match;
  const vertices: number[][] = [];

  while ((match = vertexPattern.exec(text)) !== null) {
    vertices.push([
      parseFloat(match[1]),
      parseFloat(match[2]),
      parseFloat(match[3]),
    ]);

    // Process every 3 vertices (one triangle)
    if (vertices.length === 3) {
      const v1 = vertices[0];
      const v2 = vertices[1];
      const v3 = vertices[2];

      // Calculate signed volume contribution of this triangle
      totalVolume +=
        (v1[0] * (v2[1] * v3[2] - v2[2] * v3[1]) +
          v2[0] * (v3[1] * v1[2] - v3[2] * v1[1]) +
          v3[0] * (v1[1] * v2[2] - v1[2] * v2[1])) /
        6;

      vertices.length = 0; // Clear for next triangle
    }
  }

  return Math.abs(totalVolume);
};

// Calculate volume for Binary STL
const calculateBinarySTLVolume = (arrayBuffer: ArrayBuffer): number => {
  const dataView = new DataView(arrayBuffer);

  if (arrayBuffer.byteLength < 84) return 0;

  const triangleCount = dataView.getUint32(80, true);
  let totalVolume = 0;

  for (let i = 0; i < triangleCount; i++) {
    const offset = 84 + i * 50; // Each triangle is 50 bytes after 84-byte header

    // Skip normal vector (12 bytes), read vertices (36 bytes)
    const v1 = [
      dataView.getFloat32(offset + 12, true),
      dataView.getFloat32(offset + 16, true),
      dataView.getFloat32(offset + 20, true),
    ];
    const v2 = [
      dataView.getFloat32(offset + 24, true),
      dataView.getFloat32(offset + 28, true),
      dataView.getFloat32(offset + 32, true),
    ];
    const v3 = [
      dataView.getFloat32(offset + 36, true),
      dataView.getFloat32(offset + 40, true),
      dataView.getFloat32(offset + 44, true),
    ];

    // Calculate signed volume contribution
    totalVolume +=
      (v1[0] * (v2[1] * v3[2] - v2[2] * v3[1]) +
        v2[0] * (v3[1] * v1[2] - v3[2] * v1[1]) +
        v3[0] * (v1[1] * v2[2] - v1[2] * v2[1])) /
      6;
  }

  return Math.abs(totalVolume);
};

// Calculate volume for OBJ files using face data
const calculateOBJVolume = (objText: string): number => {
  const lines = objText.split("\n");
  const vertices: number[][] = [];
  let totalVolume = 0;

  // Parse vertices
  for (const line of lines) {
    if (line.startsWith("v ")) {
      const parts = line.split(/\s+/);
      if (parts.length >= 4) {
        vertices.push([
          parseFloat(parts[1]),
          parseFloat(parts[2]),
          parseFloat(parts[3]),
        ]);
      }
    }
  }

  // Parse faces and calculate volume
  for (const line of lines) {
    if (line.startsWith("f ")) {
      const parts = line.split(/\s+/).slice(1);
      if (parts.length >= 3) {
        // Handle face indices (OBJ uses 1-based indexing)
        const indices = parts.map((part) => {
          const vertexIndex = parseInt(part.split("/")[0]);
          return vertexIndex > 0
            ? vertexIndex - 1
            : vertices.length + vertexIndex;
        });

        // Triangulate the face if it has more than 3 vertices
        for (let i = 1; i < indices.length - 1; i++) {
          const v1 = vertices[indices[0]];
          const v2 = vertices[indices[i]];
          const v3 = vertices[indices[i + 1]];

          if (v1 && v2 && v3) {
            // Calculate signed volume contribution
            totalVolume +=
              (v1[0] * (v2[1] * v3[2] - v2[2] * v3[1]) +
                v2[0] * (v3[1] * v1[2] - v3[2] * v1[1]) +
                v3[0] * (v1[1] * v2[2] - v1[2] * v2[1])) /
              6;
          }
        }
      }
    }
  }

  return Math.abs(totalVolume);
};

// Calculate volume for PLY files
const calculatePLYVolume = (arrayBuffer: ArrayBuffer): number => {
  const text = new TextDecoder().decode(arrayBuffer);
  const lines = text.split("\n");

  let vertexCount = 0;
  let faceCount = 0;
  let headerEnded = false;
  let currentVertex = 0;
  let currentFace = 0;

  const vertices: number[][] = [];
  let totalVolume = 0;

  // Parse header to get counts
  for (const line of lines) {
    if (line.includes("element vertex")) {
      vertexCount = parseInt(line.split(" ")[2]);
    } else if (line.includes("element face")) {
      faceCount = parseInt(line.split(" ")[2]);
    } else if (line.includes("end_header")) {
      headerEnded = true;
      continue;
    }

    if (!headerEnded) continue;

    // Parse vertices
    if (currentVertex < vertexCount) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        vertices.push([
          parseFloat(parts[0]),
          parseFloat(parts[1]),
          parseFloat(parts[2]),
        ]);
      }
      currentVertex++;
    }
    // Parse faces
    else if (currentFace < faceCount) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const numVertices = parseInt(parts[0]);
        if (numVertices >= 3) {
          // Triangulate if more than 3 vertices
          for (let i = 1; i < numVertices - 1; i++) {
            const v1 = vertices[parseInt(parts[1])];
            const v2 = vertices[parseInt(parts[i + 1])];
            const v3 = vertices[parseInt(parts[i + 2])];

            if (v1 && v2 && v3) {
              totalVolume +=
                (v1[0] * (v2[1] * v3[2] - v2[2] * v3[1]) +
                  v2[0] * (v3[1] * v1[2] - v3[2] * v1[1]) +
                  v3[0] * (v1[1] * v2[2] - v1[2] * v2[1])) /
                6;
            }
          }
        }
      }
      currentFace++;
    }
  }

  return Math.abs(totalVolume);
};

// Calculate volume for AMF files (XML-based)
const calculateAMFVolume = (amfText: string): number => {
  const vertices: number[][] = [];
  let totalVolume = 0;

  // Extract vertices from XML
  const vertexRegex =
    /<vertex>\s*<coordinates>\s*<x>([\d.-]+)<\/x>\s*<y>([\d.-]+)<\/y>\s*<z>([\d.-]+)<\/z>\s*<\/coordinates>\s*<\/vertex>/g;
  let match;

  while ((match = vertexRegex.exec(amfText)) !== null) {
    vertices.push([
      parseFloat(match[1]),
      parseFloat(match[2]),
      parseFloat(match[3]),
    ]);
  }

  // Extract triangles and calculate volume
  const triangleRegex =
    /<triangle>\s*<v1>(\d+)<\/v1>\s*<v2>(\d+)<\/v2>\s*<v3>(\d+)<\/v3>\s*<\/triangle>/g;

  while ((match = triangleRegex.exec(amfText)) !== null) {
    const v1 = vertices[parseInt(match[1])];
    const v2 = vertices[parseInt(match[2])];
    const v3 = vertices[parseInt(match[3])];

    if (v1 && v2 && v3) {
      totalVolume +=
        (v1[0] * (v2[1] * v3[2] - v2[2] * v3[1]) +
          v2[0] * (v3[1] * v1[2] - v3[2] * v1[1]) +
          v3[0] * (v1[1] * v2[2] - v1[2] * v2[1])) /
        6;
    }
  }

  return Math.abs(totalVolume);
};

// Calculate weight based on volume and material density
const calculateWeight = (
  volumeMM3: number,
  materialDensity: number = 1.24
): number => {
  // Convert mm³ to cm³ (divide by 1000)
  const volumeCM3 = volumeMM3 / 1000;
  // Weight = volume × density (g/cm³)
  return volumeCM3 * materialDensity;
};

// Common 3D printing material densities (g/cm³)
const materialDensities = {
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

// Helper function to get document format name
const getDocumentFormat = (mimeType: string): string => {
  const formats: { [key: string]: string } = {
    "application/msword": "Microsoft Word (DOC)",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "Microsoft Word (DOCX)",
    "application/vnd.ms-excel": "Microsoft Excel (XLS)",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      "Microsoft Excel (XLSX)",
    "application/vnd.ms-powerpoint": "Microsoft PowerPoint (PPT)",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "Microsoft PowerPoint (PPTX)",
    "text/plain": "Plain Text",
    "text/csv": "CSV File",
  };
  return formats[mimeType] || "Document";
};

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

// Helper function to safely get currency symbol
const getCurrencySymbol = (currency: CurrencyType): string => {
  return currencies[currency]?.symbol || "$"; // Fallback to $ if currency not found
};

// Default file type mapping
const defaultFileTypeMap: { [key: string]: string[] } = {
  pdf: [".pdf"],
  images: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"],
  "3d": [".stl", ".obj", ".ply", ".3mf", ".amf", ".gcode"],
  documents: [".doc", ".docx", ".txt"],
};

export default function QuoteFormBuilder({
  product,
}: QuoteFormBuilderProps = {}) {
  console.log(product);

  const router = useRouter();
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [fileConnections, setFileConnections] = useState<
    FileUploadConnection[]
  >([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState<string>("pdf");
  const [fileTypeMap, setFileTypeMap] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>("USD");

  // Save functionality state
  const [formName, setFormName] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedData, setLastSavedData] = useState<FormBuilderData | null>(
    null
  );
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  // Initialize form data from product props
  useEffect(() => {
    if (product) {
      // Always set basic product info from ProductTypes
      setFormName(product.name);
      setFormDescription(product.description);
      let parsedFormData: Partial<FormBuilderData> = Object.assign(
        {},
        {
          parameters: [],
          currency: "USD",
          fileConnections: [],
          selectedFileType: "pdf",
          fileTypeMap: defaultFileTypeMap["pdf"],
          formValues: { quantity: "1" },
        },
        product.formData
      );

      if (product.formData) {
        // Initialize with default values

        // Try to parse formData if it exists and is not empty
        // if (product.formData && product.formData.trim() !== "") {
        //   try {
        //     const parsed: Partial<FormBuilderData> = JSON.parse(product.formData);

        //     // Merge parsed data with defaults, keeping defaults for missing fields
        //     parsedFormData = {
        //       parameters: parsed.parameters || [],
        //       currency:
        //         parsed.currency === "USD" || parsed.currency === "IDR"
        //           ? parsed.currency
        //           : product.currencyType === "USD" ||
        //             product.currencyType === "IDR"
        //           ? product.currencyType
        //           : "USD", // Fallback chain with validation
        //       fileConnections: parsed.fileConnections || [],
        //       selectedFileType: parsed.selectedFileType || "pdf",
        //       fileTypeMap:
        //         parsed.fileTypeMap ||
        //         defaultFileTypeMap[parsed.selectedFileType || "pdf"],
        //       formValues: parsed.formValues || { quantity: "1" },
        //     };

        //     console.log("Successfully parsed product formData");
        //   } catch (error) {
        //     console.warn(
        //       "Failed to parse product formData, using defaults:",
        //       error
        //     );
        //     // parsedFormData already contains defaults, so we continue with those
        //   }
        // } else {
        //   console.log("Product formData is empty or null, using default values");
        // }

        // Apply the parsed/default form data to component state
        if (parsedFormData.parameters) {
          setParameters(parsedFormData.parameters);
        }
        if (parsedFormData.currency) {
          setSelectedCurrency(parsedFormData.currency);
        }
        if (parsedFormData.fileConnections) {
          setFileConnections(parsedFormData.fileConnections);
        }
        if (parsedFormData.selectedFileType) {
          setSelectedFileType(parsedFormData.selectedFileType);
        }
        if (parsedFormData.fileTypeMap) {
          setFileTypeMap(parsedFormData.fileTypeMap);
        }
        if (parsedFormData.formValues) {
          setFormValues(parsedFormData.formValues);
        }
      }

      // Set as saved data for change tracking
      setLastSavedData({
        id: product.id,
        name: product.name,
        description: product.description,
        parameters: parsedFormData.parameters || [],
        currency: parsedFormData.currency || "USD",
        fileConnections: parsedFormData.fileConnections || [],
        selectedFileType: parsedFormData.selectedFileType || "pdf",
        fileTypeMap: parsedFormData.fileTypeMap || defaultFileTypeMap["pdf"],
        formValues: parsedFormData.formValues || { quantity: "1" },
        createdAt: new Date(product.createdAt).toISOString(),
        updatedAt: new Date(product.lastModified).toISOString(),
      });

      setHasUnsavedChanges(false);
      setSaveStatus("saved");
    }
  }, [product]);

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

  // Handle setting a parameter as main units (ensures only one can be main)
  const setMainUnitsParameter = (id: string, isMain: boolean) => {
    const parameter = parameters.find((p) => p.id === id);

    // Only allow NumericValue parameters to be set as main units
    if (parameter && parameter.type !== "NumericValue" && isMain) {
      return; // Silently ignore attempt to set non-numeric as main units
    }

    setParameters(
      parameters.map((param) => {
        if (param.id === id) {
          return { ...param, isMainUnits: isMain };
        } else if (isMain && param.isMainUnits) {
          // Remove main units flag from other parameters
          return { ...param, isMainUnits: false };
        }
        return param;
      })
    );
  };

  const deleteParameter = (id: string) => {
    setParameters(parameters.filter((param) => param.id !== id));
  };

  const moveParameterUp = (id: string) => {
    const currentIndex = parameters.findIndex((param) => param.id === id);
    if (currentIndex > 0) {
      const newParameters = [...parameters];
      [newParameters[currentIndex - 1], newParameters[currentIndex]] = [
        newParameters[currentIndex],
        newParameters[currentIndex - 1],
      ];
      setParameters(newParameters);
    }
  };

  const moveParameterDown = (id: string) => {
    const currentIndex = parameters.findIndex((param) => param.id === id);
    if (currentIndex < parameters.length - 1) {
      const newParameters = [...parameters];
      [newParameters[currentIndex], newParameters[currentIndex + 1]] = [
        newParameters[currentIndex + 1],
        newParameters[currentIndex],
      ];
      setParameters(newParameters);
    }
  };

  const addOption = (paramId: string) => {
    const param = parameters.find((p) => p.id === paramId);
    if (param && param.type === "FixedOption") {
      const newOption: FixedOption = {
        label: "",
        value: "",
        description: "",
        pricing: {},
        subOptions: [],
      };
      updateParameter(paramId, {
        options: [...(param.options || []), newOption],
      });
    }
  };

  const addSubOption = (paramId: string, optionIndex: number) => {
    const param = parameters.find((p) => p.id === paramId);
    if (param && param.options && param.options[optionIndex]) {
      const newSubOption: SubOption = {
        id: `suboption_${Date.now()}`,
        label: "",
        value: "",
        description: "",
        price: 0,
        pricingScope: "per_qty",
      };

      const updatedOptions = [...param.options];
      updatedOptions[optionIndex] = {
        ...updatedOptions[optionIndex],
        subOptions: [
          ...(updatedOptions[optionIndex].subOptions || []),
          newSubOption,
        ],
      };

      updateParameter(paramId, { options: updatedOptions });
    }
  };

  const updateSubOption = (
    paramId: string,
    optionIndex: number,
    subOptionId: string,
    updates: Partial<SubOption>
  ) => {
    const param = parameters.find((p) => p.id === paramId);
    if (param && param.options && param.options[optionIndex]) {
      const updatedOptions = [...param.options];
      const subOptions = updatedOptions[optionIndex].subOptions || [];

      updatedOptions[optionIndex] = {
        ...updatedOptions[optionIndex],
        subOptions: subOptions.map((subOpt) =>
          subOpt.id === subOptionId ? { ...subOpt, ...updates } : subOpt
        ),
      };

      updateParameter(paramId, { options: updatedOptions });
    }
  };

  const deleteSubOption = (
    paramId: string,
    optionIndex: number,
    subOptionId: string
  ) => {
    const param = parameters.find((p) => p.id === paramId);
    if (param && param.options && param.options[optionIndex]) {
      const updatedOptions = [...param.options];
      const subOptions = updatedOptions[optionIndex].subOptions || [];

      updatedOptions[optionIndex] = {
        ...updatedOptions[optionIndex],
        subOptions: subOptions.filter((subOpt) => subOpt.id !== subOptionId),
      };

      updateParameter(paramId, { options: updatedOptions });
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
    // We need to calculate them in dependency order
    const derivedParams = parameters.filter(
      (p) => p.type === "DerivedCalc" && isParameterVisible(p, formValues)
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
          let formula = param.formula;
          let hasAllDependencies = true;

          param.dependencies.forEach((dep) => {
            const value = Number.parseFloat(calculatedValues[dep]);
            if (isNaN(value)) {
              hasAllDependencies = false;
              return;
            }
            // Use high precision string representation for decimal numbers
            const valueStr = value.toString();
            formula = formula.replace(
              new RegExp(`\\b${dep}\\b`, "g"),
              valueStr
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
        if (param.pricing.base_price) {
          paramTotal += param.pricing.base_price;
          description += `Base: ${currencies[selectedCurrency].symbol}${param.pricing.base_price} per item`;
        }

        if (param.type === "FixedOption") {
          const selectedOption = param.options?.find(
            (opt) => opt.value === value
          );
          if (selectedOption) {
            // Base price for option is per QTY
            if (selectedOption.pricing.base_price) {
              paramTotal += selectedOption.pricing.base_price;
              description +=
                (description ? " + " : "") +
                `Option: ${currencies[selectedCurrency].symbol}${selectedOption.pricing.base_price} per item`;
            }
            // Unit price for option scales with main units
            if (selectedOption.pricing.unit_price) {
              const unitCost =
                selectedOption.pricing.unit_price * mainUnitsValue;
              paramTotal += unitCost;
              description +=
                (description ? " + " : "") +
                `${currencies[selectedCurrency].symbol}${
                  selectedOption.pricing.unit_price
                } × ${mainUnitsValue} ${mainUnitsParam?.unit || "units"}`;
            }
            if (selectedOption.pricing.multiplier) {
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
                    subDescription += `${subOption.label}: ${currencies[selectedCurrency].symbol}${subOption.price} per item`;
                  } else {
                    const unitCost = subOption.price * mainUnitsValue;
                    subOptionTotal += unitCost;
                    subDescription += `${subOption.label}: ${
                      currencies[selectedCurrency].symbol
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

          // Unit price calculation: total units × unit price (no double multiplication)
          if (param.pricing.unit_price) {
            const unitCost = totalUnits * param.pricing.unit_price;
            paramTotal += unitCost;
            description +=
              (description ? " + " : "") +
              `${totalUnits} ${param.unit || "units"} × ${
                currencies[selectedCurrency].symbol
              }${param.pricing.unit_price}`;
          }

          if (
            param.pricing.step_pricing &&
            totalUnits > param.pricing.step_pricing.threshold
          ) {
            const steps = Math.floor(
              totalUnits - param.pricing.step_pricing.threshold
            );
            const stepCost = steps * param.pricing.step_pricing.step_amount;
            paramTotal += stepCost;
            description +=
              (description ? " + " : "") +
              `${steps} steps × ${currencies[selectedCurrency].symbol}${param.pricing.step_pricing.step_amount}`;
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
            description: `${description}`,
            amount: paramTotal,
          });
          unitTotal += paramTotal;
        }
      });

    // Add quantity breakdown if quantity > 1
    // if (quantity > 1 && unitTotal > 0) {
    //   breakdown.push({
    //     parameter: "Quantity Multiplier",
    //     description: `Price per unit: $${unitTotal.toFixed(
    //       2
    //     )} × ${quantity} quantity`,
    //     amount: unitTotal * (quantity + 1), // Additional cost beyond the first unit
    //   });
    // }

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
                // Use high precision string representation for decimal numbers
                const valueStr = depValue.toString();
                formula = formula.replace(
                  new RegExp(`\\b${dep}\\b`, "g"),
                  valueStr
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

      // Calculate derived values that depend on this parameter
      // We need to do this in dependency order to handle chained calculations
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

                // Use high precision string representation for decimal numbers
                const valueStr = depValue.toString();
                formula = formula.replace(
                  new RegExp(`\\b${dep}\\b`, "g"),
                  valueStr
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

                // Use high precision string representation for decimal numbers
                const valueStr = depValue.toString();
                formula = formula.replace(
                  new RegExp(`\\b${dep}\\b`, "g"),
                  valueStr
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

  const loadSample = (sampleName: string) => {
    const sampleFunction =
      printingSamples[sampleName as keyof typeof printingSamples];
    if (sampleFunction) {
      setParameters(sampleFunction());
      setFormValues({ quantity: formValues.quantity || "1" }); // Preserve quantity when loading new sample
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);

    try {
      const metadata = await extractFileMetadata(file);
      setFileMetadata(metadata);

      // Apply existing connections
      fileConnections.forEach((connection) => {
        const metadataValue = metadata[connection.metadataKey];
        if (metadataValue !== undefined) {
          updateFormValue(connection.parameterName, metadataValue.toString());
        }
      });
    } catch (error) {
      console.error("Error processing file:", error);
    }
  };

  const addFileConnection = () => {
    if (!fileMetadata) return;

    const newConnection: FileUploadConnection = {
      id: `connection_${Date.now()}`,
      metadataKey: "pages",
      parameterName: "",
      description: "Link file pages to parameter",
    };
    setFileConnections([...fileConnections, newConnection]);
  };

  const updateFileConnection = (
    id: string,
    updates: Partial<FileUploadConnection>
  ) => {
    setFileConnections((connections) =>
      connections.map((conn) =>
        conn.id === id ? { ...conn, ...updates } : conn
      )
    );
  };

  const deleteFileConnection = (id: string) => {
    setFileConnections((connections) =>
      connections.filter((conn) => conn.id !== id)
    );
  };

  const applyFileConnection = (connection: FileUploadConnection) => {
    if (!fileMetadata) return;

    const metadataValue = fileMetadata[connection.metadataKey];
    if (metadataValue !== undefined) {
      updateFormValue(connection.parameterName, metadataValue.toString());
    }
  };

  // Generate file accept attribute based on selected file type
  const getFileAcceptString = () => {
    return defaultFileTypeMap[selectedFileType]?.join(",") || "";
  };

  // Set file type selection (only one at a time)
  const selectFileType = (fileType: string) => {
    setSelectedFileType(fileType);
    // Clear uploaded file when switching types to prevent metadata conflicts
    setUploadedFile(null);
    setFileMetadata(null);
    setFileConnections([]);
  };

  // Save and update functionality
  const getCurrentFormData = (): FormBuilderData => {
    return {
      id: lastSavedData?.id,
      name: formName,
      description: formDescription,
      parameters: parameters,
      currency: selectedCurrency,
      fileConnections: fileConnections,
      selectedFileType: selectedFileType,
      fileTypeMap: defaultFileTypeMap[selectedFileType],
      formValues: formValues,
      createdAt: lastSavedData?.createdAt,
      updatedAt: new Date().toISOString(),
    };
  };

  const hasDataChanged = (): boolean => {
    if (!lastSavedData) return true; // No previous save, so it's definitely changed

    const currentData = getCurrentFormData();

    // Compare key fields that indicate changes
    return (
      lastSavedData.name !== currentData.name ||
      lastSavedData.description !== currentData.description ||
      lastSavedData.currency !== currentData.currency ||
      lastSavedData.selectedFileType !== currentData.selectedFileType ||
      JSON.stringify(lastSavedData.parameters) !==
        JSON.stringify(currentData.parameters) ||
      JSON.stringify(lastSavedData.fileConnections) !==
        JSON.stringify(currentData.fileConnections) ||
      JSON.stringify(lastSavedData.fileTypeMap) !==
        JSON.stringify(currentData.fileTypeMap)
    );
  };

  const saveFormData = async (): Promise<SaveResponse | undefined> => {
    try {
      setIsSaving(true);
      setSaveStatus("saving");

      const formData = getCurrentFormData();

      // Validation
      if (!formData.name.trim()) {
        throw new Error("Product name is required");
      }

      if (formData.parameters.length === 0) {
        throw new Error("At least one product option is required");
      }

      // Check for parameters with missing names
      const invalidParams = formData.parameters.filter(
        (param) => !param.name.trim()
      );
      if (invalidParams.length > 0) {
        throw new Error(`Please provide names for all product options`);
      }

      // Check for required parameters and sub-options validation
      for (const param of formData.parameters) {
        // Only validate visible parameters
        if (!isParameterVisible(param, formValues)) continue;

        if (param.required && param.type === "FixedOption") {
          const selectedValue = formValues[param.name];
          if (!selectedValue || selectedValue === "") {
            // throw new Error(`${param.label || param.name} is required`);
          }

          // Check if the selected option has sub-options and if they are required
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
              throw new Error(
                `Please select an additional option for ${
                  selectedOption.label || param.label || param.name
                }`
              );
            }
          }
        } else if (param.required) {
          const value = formValues[param.name];
          if (
            value === undefined ||
            value === null ||
            value === "" ||
            value === 0
          ) {
            // throw new Error(`${param.label || param.name} is required`);
          }
        }
      }

      // API endpoint - adjust this to match your backend
      // Expected API structure:
      // POST /api/products - Create new product configuration
      // PUT /api/products/:id - Update existing product
      // GET /api/products/:id - Load product configuration by ID
      //
      // Transform FormBuilderData to ProductTypes format
      const productData: Partial<ProductTypes> = {
        id: formData.id,
        name: formData.name,
        description: formData.description || "",
        basePrice: 0, // You may want to calculate this from parameters
        currencyType: formData.currency,
        formData: {
          parameters: formData.parameters,
          currency: formData.currency,
          fileConnections: formData.fileConnections,
          selectedFileType: formData.selectedFileType,
          fileTypeMap: formData.fileTypeMap,
          formValues: formData.formValues,
        },
        createdAt: formData.createdAt
          ? new Date(formData.createdAt).getTime()
          : Date.now(),
        lastModified: Date.now(),
      };

      const endpoint = formData.id
        ? `/api/business/product/${formData.id}`
        : "/api/business/product";
      const method = formData.id ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      // Expect ProductTypes response from API
      const responseData: { product: ProductTypes } = await response.json();

      const productResult: ProductTypes = responseData.product;

      if (productResult.id) {
        // Transform ProductTypes back to FormBuilderData format
        const parsedFormData = productResult.formData;
        const transformedData: FormBuilderData = {
          id: productResult.id,
          name: productResult.name,
          description: productResult.description,
          parameters: parsedFormData.parameters || [],
          currency: productResult.currencyType as CurrencyType,
          fileConnections: parsedFormData.fileConnections || [],
          selectedFileType: parsedFormData.selectedFileType || "pdf",
          fileTypeMap:
            parsedFormData.fileTypeMap ||
            defaultFileTypeMap[parsedFormData.selectedFileType || "pdf"],
          formValues: parsedFormData.formValues || { quantity: "1" },
          createdAt: new Date(productResult.createdAt).toISOString(),
          updatedAt: new Date(productResult.lastModified).toISOString(),
        };

        setLastSavedData(transformedData);
        setHasUnsavedChanges(false);
        setSaveStatus("saved");

        // Clear saved status after 3 seconds
        setTimeout(() => {
          setSaveStatus("idle");
        }, 3000);

        return {
          success: true,
          message: "Product saved successfully",
          data: transformedData,
        };
      } else {
        // throw new Error("Save failed - no product ID returned");
      }
    } catch (error) {
      setSaveStatus("error");
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      // Clear error status after 5 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 5000);

      return {
        success: false,
        message: "Save failed",
        error: errorMessage,
      };
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    const result = await saveFormData();

    if (result) {
      if (!result.success) {
        console.error("Save failed:", result.error);
        // You could show a toast notification here
        alert(`Save failed: ${result.error}`);
      } else {
        console.log("Save successful:", result.message);
        // You could show a success toast notification here
      }
    }
  };

  const loadFormData = async (formId: string): Promise<SaveResponse> => {
    try {
      setIsSaving(true);
      setSaveStatus("saving");

      const response = await fetch(`/api/products/${formId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      // Expect ProductTypes response from API
      const productResult: ProductTypes = await response.json();

      if (productResult.id) {
        // Transform ProductTypes back to FormBuilderData format
        const parsedFormData = productResult.formData;
        const transformedData: FormBuilderData = {
          id: productResult.id,
          name: productResult.name,
          description: productResult.description,
          parameters: parsedFormData.parameters || [],
          currency: productResult.currencyType as CurrencyType,
          fileConnections: parsedFormData.fileConnections || [],
          selectedFileType: parsedFormData.selectedFileType || "pdf",
          fileTypeMap:
            parsedFormData.fileTypeMap ||
            defaultFileTypeMap[parsedFormData.selectedFileType || "pdf"],
          formValues: parsedFormData.formValues || { quantity: "1" },
          createdAt: new Date(productResult.createdAt).toISOString(),
          updatedAt: new Date(productResult.lastModified).toISOString(),
        };

        // Load the data into state
        setFormName(transformedData.name);
        setFormDescription(transformedData.description || "");
        setParameters(transformedData.parameters);
        setSelectedCurrency(transformedData.currency);
        setFileConnections(transformedData.fileConnections);
        setSelectedFileType(transformedData.selectedFileType || "pdf");
        setFileTypeMap(
          transformedData.fileTypeMap ||
            defaultFileTypeMap[transformedData.selectedFileType || "pdf"]
        );
        setFormValues(transformedData.formValues);
        setLastSavedData(transformedData);
        setHasUnsavedChanges(false);
        setSaveStatus("saved");

        // Clear saved status after 3 seconds
        setTimeout(() => {
          setSaveStatus("idle");
        }, 3000);

        return {
          success: true,
          message: "Product loaded successfully",
          data: transformedData,
        };
      } else {
        throw new Error("Load failed - no product found");
      }
    } catch (error) {
      setSaveStatus("error");
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      // Clear error status after 5 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 5000);

      return {
        success: false,
        message: "Load failed",
        error: errorMessage,
      };
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async (formId: string) => {
    if (showUnsavedWarning()) {
      const confirmLoad = window.confirm(
        "You have unsaved changes. Loading a new form will discard these changes. Continue?"
      );
      if (!confirmLoad) return;
    }

    const result = await loadFormData(formId);

    if (!result.success) {
      console.error("Load failed:", result.error);
      alert(`Load failed: ${result.error}`);
    } else {
      console.log("Load successful:", result.message);
    }
  };

  const deleteProduct = async (): Promise<SaveResponse | undefined> => {
    console.log("HEY");
    if (!lastSavedData?.id) {
      alert("No saved product to delete");
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus("saving");

      const response = await fetch(
        `/api/business/product/${lastSavedData.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      router.push("/dashboard");
    } catch (error) {
      setSaveStatus("error");
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";

      // Clear error status after 5 seconds
      setTimeout(() => {
        setSaveStatus("idle");
      }, 5000);

      return {
        success: false,
        message: "Delete failed",
        error: errorMessage,
      };
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const result = await deleteProduct();

    if (result) {
      if (!result.success) {
        console.error("Delete failed:", result.error);
        alert(`Delete failed: ${result.error}`);
      } else {
        console.log("Delete successful:", result.message);
        // You could show a success toast notification here
        alert("Product deleted successfully");
      }
    }
  };

  const resetForm = () => {
    if (showUnsavedWarning()) {
      const confirmReset = window.confirm(
        "You have unsaved changes. Resetting will discard these changes. Continue?"
      );
      if (!confirmReset) return;
    }

    setFormName("");
    setFormDescription("");
    setParameters([]);
    setFormValues({ quantity: "1" });
    setFileConnections([]);
    setUploadedFile(null);
    setFileMetadata(null);
    setSelectedCurrency("USD");
    setSelectedFileType("pdf");
    setFileTypeMap(defaultFileTypeMap["pdf"]);
    setLastSavedData(null);
    setHasUnsavedChanges(false);
    setSaveStatus("idle");
  };

  const exportFormData = () => {
    const formData = getCurrentFormData();
    const dataStr = JSON.stringify(formData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${formName || "form"}_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const previewFormData = () => {
    const formData = getCurrentFormData();
    const summary = {
      formInfo: {
        name: formData.name,
        description: formData.description,
        currency: formData.currency,
      },
      parameters: formData.parameters.length,
      fileConnections: formData.fileConnections.length,
      formValues: Object.keys(formData.formValues).length,
      estimatedDataSize: `${Math.round(
        JSON.stringify(formData).length / 1024
      )}KB`,
    };

    console.log("Form Data Summary:", summary);
    console.log("Complete Form Data:", formData);

    alert(`Form Data Summary:
• Name: ${summary.formInfo.name || "Untitled"}
• Parameters: ${summary.parameters}
• File Connections: ${summary.fileConnections}
• Currency: ${summary.formInfo.currency}
• Estimated Size: ${summary.estimatedDataSize}

Check console for complete data structure.`);
  };

  const importFormData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (showUnsavedWarning()) {
      const confirmImport = window.confirm(
        "You have unsaved changes. Importing will discard these changes. Continue?"
      );
      if (!confirmImport) {
        event.target.value = ""; // Reset the file input
        return;
      }
    }

    try {
      const text = await file.text();
      const importedData: FormBuilderData = JSON.parse(text);

      // Validate the imported data structure
      if (!importedData.name || !Array.isArray(importedData.parameters)) {
        throw new Error("Invalid form data format");
      }

      // Load the imported data
      setFormName(importedData.name);
      setFormDescription(importedData.description || "");
      setParameters(importedData.parameters);
      setSelectedCurrency(importedData.currency || "USD");
      setFileConnections(importedData.fileConnections || []);
      setSelectedFileType(importedData.selectedFileType || "pdf");
      setFileTypeMap(
        defaultFileTypeMap[importedData.selectedFileType || "pdf"]
      );
      setFormValues(importedData.formValues || { quantity: "1" });
      setLastSavedData(null); // Reset save state since this is imported
      setHasUnsavedChanges(true); // Mark as changed since it's imported
      setSaveStatus("idle");

      alert("Form data imported successfully!");
    } catch (error) {
      console.error("Import failed:", error);
      alert(
        `Import failed: ${
          error instanceof Error ? error.message : "Invalid file format"
        }`
      );
    }

    // Reset the file input
    event.target.value = "";
  };

  const showUnsavedWarning = (): boolean => {
    return hasUnsavedChanges && hasDataChanged();
  };

  // Track changes for unsaved warning
  useEffect(() => {
    if (lastSavedData) {
      setHasUnsavedChanges(hasDataChanged());
    }
  }, [
    parameters,
    selectedCurrency,
    fileConnections,
    selectedFileType,
    formName,
    formDescription,
  ]);

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (showUnsavedWarning()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6 space-y-4">
        {/* Form Information Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  Product Information Form
                  {showUnsavedWarning() && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Unsaved Changes
                    </Badge>
                  )}
                  {saveStatus === "saved" && (
                    <Badge variant="default" className="text-xs bg-green-600">
                      <Save className="w-3 h-3 mr-1" />
                      Saved
                    </Badge>
                  )}
                  {saveStatus === "error" && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Save Failed
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Configure product parameters and pricing for customer quotes
                  {lastSavedData?.updatedAt && (
                    <span className="block text-xs text-muted-foreground mt-1">
                      Last saved:{" "}
                      {new Date(lastSavedData.updatedAt).toLocaleString()}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={previewFormData}>
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Data
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={exportFormData}>
                      <Download className="w-4 h-4 mr-2" />
                      Export JSON
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        document.getElementById("import-file")?.click()
                      }
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import JSON
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={resetForm}
                      className="text-destructive"
                    >
                      Reset Form
                    </DropdownMenuItem>
                    {lastSavedData?.id && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleDelete}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Product
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <input
                  id="import-file"
                  type="file"
                  accept=".json"
                  onChange={importFormData}
                  className="hidden"
                />
                <Button
                  onClick={handleSave}
                  disabled={isSaving || !formName.trim()}
                  className="flex items-center gap-2"
                  variant={showUnsavedWarning() ? "default" : "outline"}
                >
                  <Save className="w-4 h-4" />
                  {isSaving
                    ? "Saving..."
                    : lastSavedData?.id
                    ? "Update"
                    : "Save"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="form-name">Product Name *</Label>
              <Input
                id="form-name"
                placeholder="e.g., Business Card Printing, T-Shirt Printing"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className={
                  !formName.trim()
                    ? "border-destructive ring-destructive/20 ring-1"
                    : ""
                }
              />
              {!formName.trim() && (
                <div className="text-xs text-destructive">
                  Product name is required
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-description">Product Description</Label>
              <Textarea
                id="form-description"
                placeholder="Describe this product and its pricing structure..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Header Section */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Product Quote Builder</h1>
            <p className="text-muted-foreground">
              Configure product parameters and pricing rules for customer quote
              generation. Set up options, calculations, and pricing that
              customers will see when requesting quotes.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Label htmlFor="currency-selector" className="text-sm font-medium">
              Currency
            </Label>
            <Select
              value={selectedCurrency}
              onValueChange={(value: CurrencyType) =>
                setSelectedCurrency(value)
              }
            >
              <SelectTrigger className="w-40" id="currency-selector">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(currencies).map(([code, config]) => (
                  <SelectItem key={code} value={code}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{config.symbol}</span>
                      <span>{config.code}</span>
                      <span className="text-muted-foreground text-sm">
                        {config.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Product Setup
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Customer View
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            File Integration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Product Parameters</h2>
              {(() => {
                const mainUnitsParam = parameters.find((p) => p.isMainUnits);
                return mainUnitsParam ? (
                  <div className="text-sm text-muted-foreground mt-1">
                    Main pricing unit:{" "}
                    <span className="font-medium">
                      {mainUnitsParam.label || mainUnitsParam.name}
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground mt-1">
                    No main pricing unit set
                  </div>
                );
              })()}
            </div>
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
                Add Product Option
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {parameters.map((param, index) => (
              <Card key={param.id}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 min-w-fit">
                        <Badge
                          variant="secondary"
                          className="text-xs font-mono"
                        >
                          #{index + 1}
                        </Badge>
                        <Badge variant="outline">{param.type}</Badge>
                      </div>
                      {param.conditional && (
                        <Badge variant="secondary" className="text-xs">
                          Conditional
                        </Badge>
                      )}
                      {param.isMainUnits && (
                        <Badge
                          variant="default"
                          className="text-xs font-medium"
                        >
                          MAIN UNITS
                        </Badge>
                      )}
                      <CardTitle className="text-lg">
                        {param.label || param.name || "Unnamed Product Option"}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Parameter ordering buttons */}
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveParameterUp(param.id)}
                          disabled={
                            parameters.findIndex((p) => p.id === param.id) === 0
                          }
                          className="h-6 px-2 hover:bg-gray-100"
                          title="Move parameter up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveParameterDown(param.id)}
                          disabled={
                            parameters.findIndex((p) => p.id === param.id) ===
                            parameters.length - 1
                          }
                          className="h-6 px-2 hover:bg-gray-100"
                          title="Move parameter down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteParameter(param.id)}
                        className="text-destructive hover:text-destructive"
                        title="Delete parameter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`name-${param.id}`}>Option ID/Name</Label>
                      <Input
                        id={`name-${param.id}`}
                        value={param.name}
                        onChange={(e) =>
                          updateParameter(param.id, { name: e.target.value })
                        }
                        placeholder="e.g., material, size, finish"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`label-${param.id}`}>
                        Customer Label
                      </Label>
                      <Input
                        id={`label-${param.id}`}
                        value={param.label}
                        onChange={(e) =>
                          updateParameter(param.id, { label: e.target.value })
                        }
                        placeholder="e.g., Material Type, Paper Size, Finish Options"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`description-${param.id}`}>
                      Customer Description
                    </Label>
                    <Textarea
                      id={`description-${param.id}`}
                      value={param.description || ""}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        updateParameter(param.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder="Help text that customers will see..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`type-${param.id}`}>Option Type</Label>
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
                            Choice Options (e.g., Material, Size)
                          </SelectItem>
                          <SelectItem value="NumericValue">
                            Number Input (e.g., Width, Height)
                          </SelectItem>
                          <SelectItem value="DerivedCalc">
                            Auto-Calculated (e.g., Area = Width × Height)
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
                      <Label htmlFor={`required-${param.id}`}>
                        Required for Quote
                      </Label>
                    </div>
                  </div>

                  {param.type === "FixedOption" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Customer Options</Label>
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-muted-foreground">
                            Display as:
                          </div>
                          <Select
                            value={param.displayType || "select"}
                            onValueChange={(value: InputDisplayType) =>
                              updateParameter(param.id, { displayType: value })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="select">Dropdown</SelectItem>
                              <SelectItem value="radio">
                                Radio Buttons
                              </SelectItem>
                              <SelectItem value="toggle">
                                Toggle Buttons
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addOption(param.id)}
                          >
                            Add Option
                          </Button>
                        </div>
                      </div>
                      {param.options?.map((option, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 space-y-3"
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
                          <div>
                            <Textarea
                              placeholder="Option description..."
                              value={option.description || ""}
                              onChange={(
                                e: React.ChangeEvent<HTMLTextAreaElement>
                              ) =>
                                updateOption(param.id, index, {
                                  description: e.target.value,
                                })
                              }
                              rows={2}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              type="number"
                              placeholder="Base Price (per QTY)"
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
                              placeholder="Unit Price (per main unit)"
                              value={option.pricing.unit_price || ""}
                              onChange={(e) =>
                                updateOption(param.id, index, {
                                  pricing: {
                                    ...option.pricing,
                                    unit_price:
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

                          {/* Sub-options section */}
                          <div className="border-t pt-3 mt-3">
                            <div className="flex items-center justify-between mb-3">
                              <Label className="text-sm">Sub-options</Label>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-muted-foreground">
                                  Display as:
                                </div>
                                <Select
                                  value={option.displayType || "radio"}
                                  onValueChange={(value: InputDisplayType) =>
                                    updateOption(param.id, index, {
                                      displayType: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="radio">Radio</SelectItem>
                                    <SelectItem value="toggle">
                                      Toggle
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addSubOption(param.id, index)}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Sub-option
                                </Button>
                              </div>
                            </div>
                            {option.subOptions?.map((subOption) => (
                              <div
                                key={subOption.id}
                                className="bg-gray-50 rounded-md p-3 space-y-2 mb-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-gray-600">
                                    Sub-option
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      deleteSubOption(
                                        param.id,
                                        index,
                                        subOption.id
                                      )
                                    }
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Sub-option Label"
                                    value={subOption.label}
                                    onChange={(e) =>
                                      updateSubOption(
                                        param.id,
                                        index,
                                        subOption.id,
                                        {
                                          label: e.target.value,
                                        }
                                      )
                                    }
                                  />
                                  <Input
                                    placeholder="Sub-option Value"
                                    value={subOption.value}
                                    onChange={(e) =>
                                      updateSubOption(
                                        param.id,
                                        index,
                                        subOption.id,
                                        {
                                          value: e.target.value,
                                        }
                                      )
                                    }
                                  />
                                </div>
                                <Textarea
                                  placeholder="Sub-option description..."
                                  value={subOption.description || ""}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLTextAreaElement>
                                  ) =>
                                    updateSubOption(
                                      param.id,
                                      index,
                                      subOption.id,
                                      {
                                        description: e.target.value,
                                      }
                                    )
                                  }
                                  rows={1}
                                />
                                <div className="grid grid-cols-3 gap-2">
                                  <Select
                                    value={subOption.pricingScope}
                                    onValueChange={(
                                      value: "per_qty" | "per_unit"
                                    ) =>
                                      updateSubOption(
                                        param.id,
                                        index,
                                        subOption.id,
                                        {
                                          pricingScope: value,
                                        }
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="per_qty">
                                        Per Qty
                                      </SelectItem>
                                      <SelectItem value="per_unit">
                                        Per Unit
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Price"
                                    value={subOption.price || ""}
                                    onChange={(e) =>
                                      updateSubOption(
                                        param.id,
                                        index,
                                        subOption.id,
                                        {
                                          price:
                                            Number.parseFloat(e.target.value) ||
                                            undefined,
                                        }
                                      )
                                    }
                                  />
                                  <span className="text-xs text-muted-foreground flex items-center">
                                    Additional cost
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {param.type === "NumericValue" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={param.min || ""}
                          onChange={(e) =>
                            updateParameter(param.id, {
                              min:
                                Number.parseFloat(e.target.value) || undefined,
                            })
                          }
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={param.max || ""}
                          onChange={(e) =>
                            updateParameter(param.id, {
                              max:
                                Number.parseFloat(e.target.value) || undefined,
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
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm">Units per Quantity</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="e.g., 1000 (if 1 quantity = 1000 units)"
                            value={param.unitsPerQuantity || ""}
                            onChange={(e) =>
                              updateParameter(param.id, {
                                unitsPerQuantity:
                                  Number.parseFloat(e.target.value) ||
                                  undefined,
                              })
                            }
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            How many units are included in one quantity item
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`main-units-${param.id}`}
                            checked={!!param.isMainUnits}
                            onCheckedChange={(checked) =>
                              setMainUnitsParameter(param.id, checked)
                            }
                          />
                          <Label
                            htmlFor={`main-units-${param.id}`}
                            className="text-sm"
                          >
                            Set as main units parameter
                          </Label>
                          {param.isMainUnits && (
                            <Badge variant="default" className="text-xs">
                              MAIN UNITS
                            </Badge>
                          )}
                        </div>
                        {param.isMainUnits && (
                          <div className="text-xs text-muted-foreground">
                            This parameter will be used as the primary units for
                            calculations. Only one parameter can be the main
                            units.
                          </div>
                        )}
                      </div>
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
                      <div>
                        <Label className="text-sm">Units per Quantity</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="e.g., 1000 (if 1 quantity = 1000 units)"
                          value={param.unitsPerQuantity || ""}
                          onChange={(e) =>
                            updateParameter(param.id, {
                              unitsPerQuantity:
                                Number.parseFloat(e.target.value) || undefined,
                            })
                          }
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          How many units are included in one quantity item
                        </div>
                      </div>
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
                                  p.type === "DerivedCalc" ||
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
                                    p.type === "FixedOption" &&
                                    p.name &&
                                    p.name.trim() !== ""
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

                  {param.type !== "FixedOption" && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-base font-medium">
                          Pricing Configuration
                        </Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <Label className="text-sm">
                              Base Price ({currencies[selectedCurrency].symbol}{" "}
                              per item ordered)
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Fixed cost per item ordered"
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
                            <div className="text-xs text-muted-foreground mt-1">
                              Fixed cost added per item in the customer's order
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm">
                              Unit Price ({currencies[selectedCurrency].symbol}{" "}
                              per main unit)
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Cost that scales with main units"
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
                            <div className="text-xs text-muted-foreground mt-1">
                              {(() => {
                                const mainUnitsParam = parameters.find(
                                  (p) => p.isMainUnits
                                );
                                return mainUnitsParam
                                  ? `Scales with ${
                                      mainUnitsParam.label ||
                                      mainUnitsParam.name
                                    } (${mainUnitsParam.unit || "units"})`
                                  : "Cost multiplied by the main pricing unit";
                              })()}
                            </div>
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
                                value={
                                  param.pricing.step_pricing?.threshold || ""
                                }
                                onChange={(e) =>
                                  updateParameter(param.id, {
                                    pricing: {
                                      ...param.pricing,
                                      step_pricing: {
                                        ...param.pricing.step_pricing,
                                        threshold:
                                          Number.parseFloat(e.target.value) ||
                                          0,
                                        step_amount:
                                          param.pricing.step_pricing
                                            ?.step_amount || 0,
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
                                          param.pricing.step_pricing
                                            ?.threshold || 0,
                                        step_amount:
                                          Number.parseFloat(e.target.value) ||
                                          0,
                                      },
                                    },
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <FormRenderer
            parameters={parameters}
            currency={selectedCurrency}
            title="Customer Quote Form"
            description="Preview how customers will see your product configuration form"
            onFormChange={(newFormValues) => {
              setFormValues(newFormValues);
            }}
            onPriceChange={(newTotalPrice, newPriceBreakdown) => {
              setTotalPrice(newTotalPrice);
              setPriceBreakdown(newPriceBreakdown);
            }}
            initialValues={formValues}
            showPriceBreakdown={true}
            showValidationErrors={true}
            readOnly={false}
            className=""
          />

          {showFileUpload && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  File Upload & Metadata Extraction
                </CardTitle>
                <CardDescription>
                  Upload files to automatically extract metadata and link to
                  form parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">
                      File Type to Accept (Choose One)
                    </Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="filetype-pdf"
                          name="fileType"
                          checked={selectedFileType === "pdf"}
                          onChange={() => selectFileType("pdf")}
                          className="rounded"
                        />
                        <Label htmlFor="filetype-pdf" className="text-sm">
                          PDF Documents
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="filetype-images"
                          name="fileType"
                          checked={selectedFileType === "images"}
                          onChange={() => selectFileType("images")}
                          className="rounded"
                        />
                        <Label htmlFor="filetype-images" className="text-sm">
                          Images (JPG, PNG, etc.)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="filetype-3d"
                          name="fileType"
                          checked={selectedFileType === "3d"}
                          onChange={() => selectFileType("3d")}
                          className="rounded"
                        />
                        <Label htmlFor="filetype-3d" className="text-sm">
                          3D Files (STL, OBJ, etc.)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="filetype-documents"
                          name="fileType"
                          checked={selectedFileType === "documents"}
                          onChange={() => selectFileType("documents")}
                          className="rounded"
                        />
                        <Label htmlFor="filetype-documents" className="text-sm">
                          Text Documents (DOC, TXT)
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="file-upload">Upload File</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept={getFileAcceptString()}
                      onChange={handleFileUpload}
                      className="mt-1"
                      disabled={!selectedFileType}
                    />
                    {!selectedFileType ? (
                      <div className="text-xs text-destructive mt-1">
                        Please select a file type above to enable upload
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground mt-1">
                        <div className="mb-1">
                          <strong>Currently accepting:</strong>
                        </div>
                        <div className="space-y-1">
                          {selectedFileType === "pdf" && (
                            <div>
                              <strong>PDF:</strong> Documents with page counting
                            </div>
                          )}
                          {selectedFileType === "images" && (
                            <div>
                              <strong>Images:</strong> JPG, PNG, GIF, BMP, WebP,
                              SVG
                            </div>
                          )}
                          {selectedFileType === "3d" && (
                            <div>
                              <strong>3D Files:</strong> STL, OBJ, PLY, 3MF,
                              AMF, G-code
                            </div>
                          )}
                          {selectedFileType === "documents" && (
                            <div>
                              <strong>Documents:</strong> DOC, DOCX, TXT
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {uploadedFile && fileMetadata && (
                  <>
                    <div className="border rounded-lg p-3 bg-muted/50">
                      <h4 className="font-medium mb-2">File Information</h4>
                      <div className="space-y-1 text-sm">
                        <div>
                          <strong>Name:</strong> {fileMetadata.fileName}
                        </div>
                        <div>
                          <strong>Size:</strong> {fileMetadata.sizeValue}{" "}
                          {fileMetadata.sizeCategory}
                        </div>
                        <div>
                          <strong>Type:</strong>{" "}
                          {fileMetadata.fileFormat || fileMetadata.fileType}
                        </div>

                        {/* PDF specific metadata */}
                        {fileMetadata.pages && (
                          <div>
                            <strong>Pages:</strong> {fileMetadata.pages}
                          </div>
                        )}

                        {/* Image specific metadata */}
                        {fileMetadata.width && fileMetadata.height && (
                          <>
                            <div>
                              <strong>Dimensions:</strong> {fileMetadata.width}{" "}
                              × {fileMetadata.height}px
                            </div>
                            {fileMetadata.aspectRatio && (
                              <div>
                                <strong>Aspect Ratio:</strong>{" "}
                                {fileMetadata.aspectRatio}:1
                              </div>
                            )}
                            {fileMetadata.megapixels && (
                              <div>
                                <strong>Megapixels:</strong>{" "}
                                {fileMetadata.megapixels}MP
                              </div>
                            )}
                          </>
                        )}

                        {/* 3D file specific metadata */}
                        {fileMetadata.triangles && (
                          <div>
                            <strong>Triangles:</strong>{" "}
                            {fileMetadata.triangles.toLocaleString()}
                          </div>
                        )}
                        {fileMetadata.vertices && (
                          <div>
                            <strong>Vertices:</strong>{" "}
                            {fileMetadata.vertices.toLocaleString()}
                          </div>
                        )}
                        {fileMetadata.faces && (
                          <div>
                            <strong>Faces:</strong>{" "}
                            {fileMetadata.faces.toLocaleString()}
                          </div>
                        )}
                        {fileMetadata.estimatedVertices &&
                          !fileMetadata.vertices && (
                            <div>
                              <strong>Est. Vertices:</strong>{" "}
                              {fileMetadata.estimatedVertices.toLocaleString()}
                            </div>
                          )}

                        {/* G-code specific metadata */}
                        {fileMetadata.gcodeLines && (
                          <div>
                            <strong>G-code Lines:</strong>{" "}
                            {fileMetadata.gcodeLines.toLocaleString()}
                          </div>
                        )}
                        {fileMetadata.printTimeHours && (
                          <div>
                            <strong>Print Time:</strong>{" "}
                            {fileMetadata.printTimeHours}h
                          </div>
                        )}
                        {fileMetadata.layerHeight && (
                          <div>
                            <strong>Layer Height:</strong>{" "}
                            {fileMetadata.layerHeight}mm
                          </div>
                        )}

                        {/* Volume and weight for 3D files */}
                        {fileMetadata.volume && (
                          <div>
                            <strong>Volume:</strong>{" "}
                            {fileMetadata.volume < 1000
                              ? `${fileMetadata.volume.toFixed(2)} mm³`
                              : `${(fileMetadata.volume / 1000).toFixed(
                                  2
                                )} cm³`}
                          </div>
                        )}
                        {fileMetadata.weightGrams && (
                          <div>
                            <strong>Est. Weight:</strong>{" "}
                            {fileMetadata.weightGrams < 1000
                              ? `${fileMetadata.weightGrams.toFixed(2)}g`
                              : `${(fileMetadata.weightGrams / 1000).toFixed(
                                  2
                                )}kg`}{" "}
                            (PLA)
                          </div>
                        )}

                        {/* Text file specific metadata */}
                        {fileMetadata.lines && (
                          <div>
                            <strong>Lines:</strong>{" "}
                            {fileMetadata.lines.toLocaleString()}
                          </div>
                        )}
                        {fileMetadata.words && (
                          <div>
                            <strong>Words:</strong>{" "}
                            {fileMetadata.words.toLocaleString()}
                          </div>
                        )}
                        {fileMetadata.characters && (
                          <div>
                            <strong>Characters:</strong>{" "}
                            {fileMetadata.characters.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Metadata Connections</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addFileConnection}
                          className="flex items-center gap-2"
                        >
                          <Link className="w-4 h-4" />
                          Add Connection
                        </Button>
                      </div>

                      {fileConnections.map((connection) => (
                        <div
                          key={connection.id}
                          className="border rounded-lg p-3 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Metadata Connection
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                deleteFileConnection(connection.id)
                              }
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Metadata Field</Label>
                              <Select
                                value={connection.metadataKey}
                                onValueChange={(value) =>
                                  updateFileConnection(connection.id, {
                                    metadataKey: value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {/* PDF metadata */}
                                  {fileMetadata.pages && (
                                    <SelectItem value="pages">
                                      Pages ({fileMetadata.pages})
                                    </SelectItem>
                                  )}

                                  {/* Image metadata */}
                                  {fileMetadata.width && (
                                    <SelectItem value="width">
                                      Width ({fileMetadata.width}px)
                                    </SelectItem>
                                  )}
                                  {fileMetadata.height && (
                                    <SelectItem value="height">
                                      Height ({fileMetadata.height}px)
                                    </SelectItem>
                                  )}
                                  {fileMetadata.aspectRatio && (
                                    <SelectItem value="aspectRatio">
                                      Aspect Ratio ({fileMetadata.aspectRatio}
                                      :1)
                                    </SelectItem>
                                  )}
                                  {fileMetadata.megapixels && (
                                    <SelectItem value="megapixels">
                                      Megapixels ({fileMetadata.megapixels}
                                      MP)
                                    </SelectItem>
                                  )}

                                  {/* 3D file metadata */}
                                  {fileMetadata.triangles && (
                                    <SelectItem value="triangles">
                                      Triangles (
                                      {fileMetadata.triangles.toLocaleString()})
                                    </SelectItem>
                                  )}
                                  {fileMetadata.vertices && (
                                    <SelectItem value="vertices">
                                      Vertices (
                                      {fileMetadata.vertices.toLocaleString()})
                                    </SelectItem>
                                  )}
                                  {fileMetadata.faces && (
                                    <SelectItem value="faces">
                                      Faces (
                                      {fileMetadata.faces.toLocaleString()})
                                    </SelectItem>
                                  )}
                                  {fileMetadata.estimatedVertices &&
                                    !fileMetadata.vertices && (
                                      <SelectItem value="estimatedVertices">
                                        Est. Vertices (
                                        {fileMetadata.estimatedVertices.toLocaleString()}
                                        )
                                      </SelectItem>
                                    )}
                                  {fileMetadata.gcodeLines && (
                                    <SelectItem value="gcodeLines">
                                      G-code Lines (
                                      {fileMetadata.gcodeLines.toLocaleString()}
                                      )
                                    </SelectItem>
                                  )}
                                  {fileMetadata.printTimeHours && (
                                    <SelectItem value="printTimeHours">
                                      Print Time ({fileMetadata.printTimeHours}
                                      h)
                                    </SelectItem>
                                  )}
                                  {fileMetadata.printTimeSeconds && (
                                    <SelectItem value="printTimeSeconds">
                                      Print Time (Seconds) (
                                      {fileMetadata.printTimeSeconds})
                                    </SelectItem>
                                  )}
                                  {fileMetadata.layerHeight && (
                                    <SelectItem value="layerHeight">
                                      Layer Height ({fileMetadata.layerHeight}
                                      mm)
                                    </SelectItem>
                                  )}

                                  {/* Volume and weight metadata */}
                                  {fileMetadata.volume && (
                                    <SelectItem value="volume">
                                      Volume (
                                      {fileMetadata.volume < 1000
                                        ? `${fileMetadata.volume.toFixed(
                                            2
                                          )} mm³`
                                        : `${(
                                            fileMetadata.volume / 1000
                                          ).toFixed(2)} cm³`}
                                      )
                                    </SelectItem>
                                  )}
                                  {fileMetadata.weightGrams && (
                                    <SelectItem value="weightGrams">
                                      Weight (
                                      {fileMetadata.weightGrams < 1000
                                        ? `${fileMetadata.weightGrams.toFixed(
                                            2
                                          )}g`
                                        : `${(
                                            fileMetadata.weightGrams / 1000
                                          ).toFixed(2)}kg`}
                                      )
                                    </SelectItem>
                                  )}

                                  {/* Text file metadata */}
                                  {fileMetadata.lines && (
                                    <SelectItem value="lines">
                                      Lines (
                                      {fileMetadata.lines.toLocaleString()})
                                    </SelectItem>
                                  )}
                                  {fileMetadata.words && (
                                    <SelectItem value="words">
                                      Words (
                                      {fileMetadata.words.toLocaleString()})
                                    </SelectItem>
                                  )}
                                  {fileMetadata.characters && (
                                    <SelectItem value="characters">
                                      Characters (
                                      {fileMetadata.characters.toLocaleString()}
                                      )
                                    </SelectItem>
                                  )}

                                  {/* File size metadata */}
                                  <SelectItem value="sizeValue">
                                    File Size ({fileMetadata.sizeValue}{" "}
                                    {fileMetadata.sizeCategory})
                                  </SelectItem>
                                  <SelectItem value="fileSize">
                                    File Size (Bytes) ({fileMetadata.fileSize})
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-xs">
                                Link to Parameter
                              </Label>
                              <Select
                                value={connection.parameterName}
                                onValueChange={(value) =>
                                  updateFileConnection(connection.id, {
                                    parameterName: value,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select parameter" />
                                </SelectTrigger>
                                <SelectContent>
                                  {parameters
                                    .filter(
                                      (p) =>
                                        p.type === "NumericValue" ||
                                        p.type === "DerivedCalc"
                                    )
                                    .map((param) => (
                                      <SelectItem
                                        key={param.id}
                                        value={param.name}
                                      >
                                        {param.label || param.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {connection.parameterName && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => applyFileConnection(connection)}
                              className="w-full flex items-center gap-2"
                            >
                              <Link className="w-4 h-4" />
                              Apply Connection
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Add File Upload Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFileUpload(!showFileUpload)}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {showFileUpload ? "Hide" : "Show"} File Upload
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5" />
                  File Metadata Connections
                </CardTitle>
                <CardDescription>
                  Configure how file metadata is automatically mapped to form
                  parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      File Type Selection
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      Choose the type of files to upload
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        value: "pdf",
                        label: "PDF Documents",
                        desc: "Extract page count",
                      },
                      {
                        value: "images",
                        label: "Images",
                        desc: "Extract dimensions, file size",
                      },
                      {
                        value: "3d",
                        label: "3D Files",
                        desc: "Extract volume, weight, file analysis",
                      },
                      {
                        value: "documents",
                        label: "Documents",
                        desc: "Extract basic file metadata",
                      },
                    ].map((fileType) => (
                      <div
                        key={fileType.value}
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          selectedFileType === fileType.value
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => selectFileType(fileType.value)}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`filetype-${fileType.value}`}
                            name="fileType"
                            value={fileType.value}
                            checked={selectedFileType === fileType.value}
                            onChange={() => selectFileType(fileType.value)}
                            className="w-4 h-4"
                          />
                          <div>
                            <Label
                              htmlFor={`filetype-${fileType.value}`}
                              className="font-medium cursor-pointer"
                            >
                              {fileType.label}
                            </Label>
                            <div className="text-xs text-muted-foreground">
                              {fileType.desc}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">File Upload</Label>
                    {uploadedFile && (
                      <Badge variant="outline" className="text-green-600">
                        {uploadedFile.name}
                      </Badge>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept={getFileAcceptString()}
                    onChange={handleFileUpload}
                    className="file:mr-4  file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <div className="text-sm text-muted-foreground">
                    Accepted files:{" "}
                    {getFileAcceptString() || "Select a file type first"}
                  </div>
                </div>

                {fileMetadata && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        Extracted Metadata
                      </Label>
                      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        {Object.entries(fileMetadata).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="font-medium text-muted-foreground capitalize">
                              {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                            </span>
                            <span className="font-mono">
                              {typeof value === "number"
                                ? value.toLocaleString()
                                : String(value)}
                              {key === "weightGrams" && " g"}
                              {key === "volume" && " mm³"}
                              {key === "fileSize" && " bytes"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">
                      Metadata Connections
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addFileConnection}
                      disabled={!fileMetadata}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Connection
                    </Button>
                  </div>

                  {fileConnections.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No metadata connections configured</p>
                      <p className="text-sm">
                        Upload a file and add connections to link metadata to
                        form parameters
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fileConnections.map((connection) => (
                        <Card key={connection.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-medium">
                                Connection{" "}
                                {fileConnections.indexOf(connection) + 1}
                              </Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  deleteFileConnection(connection.id)
                                }
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">
                                  Metadata Field
                                </Label>
                                <Select
                                  value={connection.metadataKey}
                                  onValueChange={(value) =>
                                    updateFileConnection(connection.id, {
                                      metadataKey: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Select metadata" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fileMetadata
                                      ? Object.keys(fileMetadata).map((key) => (
                                          <SelectItem key={key} value={key}>
                                            <div className="flex items-center justify-between w-full">
                                              <span className="capitalize">
                                                {key
                                                  .replace(/([A-Z])/g, " $1")
                                                  .toLowerCase()}
                                              </span>
                                              <span className="text-xs text-muted-foreground ml-2">
                                                {typeof fileMetadata[key] ===
                                                "number"
                                                  ? fileMetadata[
                                                      key
                                                    ].toLocaleString()
                                                  : String(fileMetadata[key])}
                                              </span>
                                            </div>
                                          </SelectItem>
                                        ))
                                      : // Show common metadata fields based on selected file type
                                        (() => {
                                          const commonFields: Record<
                                            string,
                                            string[]
                                          > = {
                                            pdf: [
                                              "pages",
                                              "fileName",
                                              "sizeValue",
                                              "sizeCategory",
                                            ],
                                            images: [
                                              "width",
                                              "height",
                                              "aspectRatio",
                                              "megapixels",
                                              "fileName",
                                              "sizeValue",
                                            ],
                                            "3d": [
                                              "volume",
                                              "weightGrams",
                                              "triangles",
                                              "vertices",
                                              "faces",
                                              "fileName",
                                              "sizeValue",
                                            ],
                                            documents: [
                                              "lines",
                                              "words",
                                              "characters",
                                              "fileName",
                                              "sizeValue",
                                            ],
                                          };
                                          const fields =
                                            selectedFileType &&
                                            commonFields[selectedFileType]
                                              ? commonFields[selectedFileType]
                                              : ["fileName", "sizeValue"];
                                          return fields.map((key) => (
                                            <SelectItem key={key} value={key}>
                                              <div className="flex items-center justify-between w-full">
                                                <span className="capitalize">
                                                  {key
                                                    .replace(/([A-Z])/g, " $1")
                                                    .toLowerCase()}
                                                </span>
                                                <span className="text-xs text-muted-foreground ml-2">
                                                  (no file uploaded)
                                                </span>
                                              </div>
                                            </SelectItem>
                                          ));
                                        })()}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label className="text-xs">
                                  Form Parameter
                                </Label>
                                <Select
                                  value={connection.parameterName}
                                  onValueChange={(value) =>
                                    updateFileConnection(connection.id, {
                                      parameterName: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue placeholder="Select parameter" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {parameters
                                      .filter(
                                        (param) =>
                                          param.type === "NumericValue" &&
                                          param.name
                                      )
                                      .map((param) => (
                                        <SelectItem
                                          key={param.id}
                                          value={param.name}
                                        >
                                          {param.label || param.name}
                                          {param.unit && ` (${param.unit})`}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div>
                              <Label className="text-xs">Description</Label>
                              <Input
                                value={connection.description}
                                onChange={(e) =>
                                  updateFileConnection(connection.id, {
                                    description: e.target.value,
                                  })
                                }
                                placeholder="Describe this connection..."
                                className="h-8"
                              />
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <div className="text-xs text-muted-foreground">
                                {connection.metadataKey &&
                                connection.parameterName ? (
                                  <>
                                    Maps{" "}
                                    <strong>{connection.metadataKey}</strong>
                                    {fileMetadata &&
                                    fileMetadata[connection.metadataKey] ? (
                                      <>
                                        {" "}
                                        ({fileMetadata[connection.metadataKey]})
                                      </>
                                    ) : (
                                      <> (no file uploaded)</>
                                    )}{" "}
                                    →{" "}
                                    <strong>{connection.parameterName}</strong>
                                  </>
                                ) : connection.metadataKey ? (
                                  <>
                                    Metadata field{" "}
                                    <strong>{connection.metadataKey}</strong>{" "}
                                    selected - choose a parameter to map to
                                  </>
                                ) : connection.parameterName ? (
                                  <>
                                    Parameter{" "}
                                    <strong>{connection.parameterName}</strong>{" "}
                                    selected - choose a metadata field to map
                                    from
                                  </>
                                ) : (
                                  "Configure metadata field and parameter to create mapping"
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyFileConnection(connection)}
                                disabled={
                                  !connection.metadataKey ||
                                  !connection.parameterName
                                }
                                className="h-8 text-xs"
                              >
                                {fileMetadata
                                  ? "Apply Now"
                                  : "Connection Ready"}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {fileConnections.length > 0 && fileMetadata && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <Label className="text-base font-medium">
                        Quick Actions
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            fileConnections.forEach((connection) => {
                              applyFileConnection(connection);
                            });
                          }}
                          disabled={fileConnections.length === 0}
                          className="flex items-center gap-2"
                        >
                          <Link className="w-4 h-4" />
                          Apply All Connections
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setFileConnections([]);
                          }}
                          disabled={fileConnections.length === 0}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Clear All Connections
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
