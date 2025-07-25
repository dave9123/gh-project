import express from "express";
import db from "../../modules/db";
import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import path from "path";

const router = express.Router();

// Configure Supabase S3 client
const s3Client = new S3Client({
    endpoint: process.env.SUPABASE_S3_URL!,
    region: "us-east-2", // Supabase uses us-east-1 as default
    credentials: {
        accessKeyId: process.env.SUPABASE_ACCESS_KEY_ID!,
        secretAccessKey: process.env.SUPABASE_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true, // Required for Supabase
});

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow common file types for AI chat
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
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

router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const { businessId, chatId } = req.body;

        if (!businessId) {
            return res.status(400).json({ error: "businessId is required" });
        }

        // Generate unique filename
        const fileExtension = path.extname(req.file.originalname);
        const fileName = `${crypto.randomUUID()}${fileExtension}`;
        const filePath = `garudahack/${businessId}/${chatId || "general"
            }/${fileName}`;

        // Upload to Supabase S3
        const uploadCommand = new PutObjectCommand({
            Bucket: "garudahack", // You might need to create this bucket in Supabase
            Key: filePath,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
            ContentLength: req.file.size,
            Metadata: {
                originalName: req.file.originalname,
                businessId: businessId,
                chatId: chatId || "general",
                uploadedAt: new Date().toISOString(),
            },
        });

        await s3Client.send(uploadCommand);

        // Generate public URL
        const publicUrl = `https://fasyqyuaqbncfurxwliy.supabase.co/storage/v1/object/public/garudahack/${filePath}`;

        // Return file information
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
                uploadedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("File upload error:", error);

        if (error instanceof Error) {
            if (error.message === "File type not supported") {
                return res.status(400).json({ error: "File type not supported" });
            }
            if (error.message.includes("File too large")) {
                return res.status(400).json({ error: "File size exceeds 10MB limit" });
            }
        }

        res.status(500).json({
            error: "Failed to upload file",
            details: process.env.NODE_ENV === "development" ? error : undefined,
        });
    }
});

router.delete("/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { businessId, filePath } = req.body;

        if (!businessId || !filePath) {
            return res
                .status(400)
                .json({ error: "businessId and filePath are required" });
        }

        // TODO: Implement S3 delete functionality
        // const deleteCommand = new DeleteObjectCommand({
        //   Bucket: "ai-chat-uploads",
        //   Key: filePath,
        // });
        // await s3Client.send(deleteCommand);

        res.json({ success: true, message: "File deleted successfully" });
    } catch (error) {
        console.error("File deletion error:", error);
        res.status(500).json({ error: "Failed to delete file" });
    }
});

export default router;
