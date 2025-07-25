import express from "express";
import db from "../../modules/db";
import { OpenAI } from "openai";
import { productsTable } from "../../db/schema";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";

const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_API_BASE_URL,
});

// Configure Supabase S3 client for AI chat uploads
const s3Client = new S3Client({
  endpoint: "https://fasyqyuaqbncfurxwliy.supabase.co/storage/v1/s3",
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.SUPABASE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.SUPABASE_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

// Configure multer for AI chat file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow file types suitable for AI analysis
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "application/pdf",
      "text/plain",
      "text/csv",
      "application/json",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// File upload endpoint for AI chat
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { businessId, chatId, userId } = req.body;

    if (!businessId) {
      return res.status(400).json({ error: "businessId is required" });
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${crypto.randomUUID()}${fileExtension}`;
    const filePath = `ai-chat/${businessId}/${chatId || "general"}/${fileName}`;

    // Upload to Supabase S3
    const uploadCommand = new PutObjectCommand({
      Bucket: "ai-chat-uploads", // Make sure this bucket exists in Supabase
      Key: filePath,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ContentLength: req.file.size,
      Metadata: {
        originalName: req.file.originalname,
        businessId: businessId,
        chatId: chatId || "general",
        userId: userId || "anonymous",
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(uploadCommand);

    // Generate public URL for Supabase storage
    const publicUrl = `https://fasyqyuaqbncfurxwliy.supabase.co/storage/v1/object/public/ai-chat-uploads/${filePath}`;

    // Return file information for AI processing
    res.json({
      success: true,
      file: {
        id: fileName.split(".")[0], // Use UUID part as ID
        originalName: req.file.originalname,
        fileName: fileName,
        filePath: filePath,
        url: publicUrl,
        size: req.file.size,
        mimeType: req.file.mimetype,
        businessId: businessId,
        chatId: chatId || "general",
        userId: userId || "anonymous",
        uploadedAt: new Date().toISOString(),
        // Additional info for AI processing
        isImage: req.file.mimetype.startsWith("image/"),
        isDocument: !req.file.mimetype.startsWith("image/"),
      },
    });
  } catch (error) {
    console.error("AI chat file upload error:", error);

    if (error instanceof Error) {
      if (error.message.includes("File too large")) {
        return res.status(400).json({ error: "File size exceeds 10MB limit" });
      }
    }

    res.status(500).json({
      error: "Failed to upload file for AI analysis",
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
});

router.get("/", (req, res) => {
  try {
    const { message } = req.body;
    const { businessId } = req.query;
    let categories: string[] = [];

    if (!message || !businessId) {
      return res
        .status(400)
        .json({ error: "Message and businessId are required" });
    }

    db.select()
      .from(productsTable)
      .where(eq(productsTable.business, businessId))
      .then((cts: any) => {
        categories = cts.map((category: any) => category.name);
      });

    //TODO: DEFINE ALL THE FUNCTIONS HERE

    const functions = () => {
      return [
        {
          name: "getCategoryInfo",
          description: "Get category information",
          parameters: {
            type: "object",
            properties: {
              userInput: {
                type: "string",
                description: "User input to get category information",
                enum: categories,
              },
            },
            required: ["userInput"],
          },
        },
        {
          name: "getQuote",
          description: "Get a quote",
          parameters: {
            type: "object",
            properties: {
              userInput: {
                type: "string",
                description: "User input to get a quote",
              },
            },
            required: ["userInput"],
          },
        },
      ];
    };
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
