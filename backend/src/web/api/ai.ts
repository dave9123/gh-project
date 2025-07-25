import express from "express";
import db from "../../modules/db";
import { OpenAI } from "openai";
import { productsTable } from "../../db/schema";
import { eq } from "drizzle-orm";
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
    const filePath = `garudahack/${businessId}/${
      chatId || "general"
    }/${fileName}`;

    // Upload to Supabase S3
    const uploadCommand = new PutObjectCommand({
      Bucket: "garudahack", // Make sure this bucket exists in Supabase
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
    const publicUrl = `https://fasyqyuaqbncfurxwliy.supabase.co/storage/v1/object/public/garudahack/${filePath}`;

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

//TODO: DEFINE ALL THE FUNCTIONS HERE

const functions = () => {
  return [
    {
      type: "function" as const,
      function: {
        name: "get_products",
        description:
          "Fetches all available product categories and options from the backend for dynamic quoting.",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "set_user_upload",
        description:
          "Handles user-uploaded files and triggers any file-based analysis (e.g. size, colors, dimensions).",
        parameters: {
          type: "object",
          properties: {
            fileUrl: {
              type: "string",
              description:
                "Public URL of the uploaded file from Supabase or other storage.",
            },
            category: {
              type: "string",
              description:
                "The product category related to this file (e.g. 'mug', 'banner').",
            },
          },
          required: ["fileUrl", "category"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "calculate_quote",
        description:
          "Calculates the total quote based on category, quantity, material, and other parameters.",
        parameters: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description: "Product type like mug, shirt, sticker",
            },
            material: {
              type: "string",
              description: "Material such as ceramic, vinyl, etc.",
            },
            quantity: {
              type: "number",
              description: "Number of items to print",
            },
            colorCount: {
              type: "number",
              description: "How many colors used in design",
            },
            sizeCm: {
              type: "number",
              description: "Width or surface in cm if relevant",
            },
            extraOptions: {
              type: "object",
              description: "Other optional parameters specific to product",
              additionalProperties: { type: "string" },
            },
          },
          required: ["category", "quantity"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "generate_invoice",
        description:
          "Creates a printable invoice or order summary for the user with current quote.",
        parameters: {
          type: "object",
          properties: {
            userEmail: {
              type: "string",
              description: "User's email to send invoice to",
            },
            quoteId: {
              type: "string",
              description: "ID of the previously generated quote",
            },
            fullName: { type: "string", description: "Customer's name" },
          },
          required: ["userEmail", "quoteId", "fullName"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "general_ask",
        description:
          "Handles general user questions not related to quoting or uploading.",
        parameters: {
          type: "object",
          properties: {
            question: { type: "string", description: "The user's question." },
          },
          required: ["question"],
        },
      },
    },
  ];
};
const aiFunctions = functions();

// Function to execute AI function calls
async function executeFunction(functionName: string, args: any) {
  switch (functionName) {
    case "get_products":
      // Fetch products from database
      try {
        const products = await db.select().from(productsTable);
        return {
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            basePrice: p.basePrice,
          })),
        };
      } catch (error) {
        return { error: "Failed to fetch products" };
      }

    case "set_user_upload":
      // Handle user upload
      return {
        message: `File ${args.fileUrl} processed for category ${args.category}`,
      };

    case "calculate_quote":
      // Calculate quote based on parameters
      const basePrice = 10000; // Base price in IDR
      const materialMultiplier = args.material === "premium" ? 1.5 : 1.0;
      const colorMultiplier = args.colorCount ? args.colorCount * 0.2 + 1 : 1.0;
      const sizeMultiplier = args.sizeCm ? Math.max(1, args.sizeCm / 10) : 1.0;

      const totalPrice =
        basePrice *
        args.quantity *
        materialMultiplier *
        colorMultiplier *
        sizeMultiplier;

      return {
        quote: {
          id: crypto.randomUUID(),
          category: args.category,
          quantity: args.quantity,
          material: args.material || "standard",
          colorCount: args.colorCount || 1,
          sizeCm: args.sizeCm || 10,
          unitPrice: Math.round(totalPrice / args.quantity),
          totalPrice: Math.round(totalPrice),
          currency: "IDR",
        },
      };

    case "generate_invoice":
      // Generate invoice
      return {
        invoice: {
          id: crypto.randomUUID(),
          quoteId: args.quoteId,
          customerName: args.fullName,
          customerEmail: args.userEmail,
          generatedAt: new Date().toISOString(),
          status: "generated",
        },
      };

    case "general_ask":
      // Handle general questions
      return {
        response: `I understand you're asking: ${args.question}. How can I help you with your printing needs?`,
      };

    default:
      return { error: `Unknown function: ${functionName}` };
  }
}

export async function chatWithAI(messages: Array<any>, tools = aiFunctions) {
  const completion = await openai.chat.completions.create({
    model: "mistralai/mistral-small-3.2-24b-instruct:free",
    messages: messages as any,
    tools: tools as any,
    tool_choice: "auto",
  });

  const choice = completion.choices?.[0];
  if (!choice) {
    throw new Error("No response from AI");
  }

  if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
    const toolCalls = choice.message.tool_calls;

    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);
      const result = await executeFunction(functionName, args);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      } as any);
    }

    return await chatWithAI(messages, tools);
  }

  return completion;
}

router.get("/", async (req, res) => {
  try {
    const { businessId } = req.query;

    if (!businessId) {
      return res.status(400).json({ error: "businessId is required" });
    }

    // Fetch products for this business
    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.businessId, parseInt(businessId as string, 10)));

    const categories = products.map((product: any) => product.name);

    res.json({
      success: true,
      message: "AI chat service is ready",
      availableProducts: categories,
      businessId: businessId,
      endpoints: {
        chat: "POST /ai/chat",
        upload: "POST /ai/upload",
      },
    });
  } catch (error) {
    console.error("AI info error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
});

// Chat endpoint - POST method for better practice with request body
router.post("/chat", async (req, res) => {
  try {
    const { message, businessId } = req.body;

    if (!message || !businessId) {
      return res
        .status(400)
        .json({ error: "Message and businessId are required" });
    }

    // // Fetch products for this business
    // const products = await db
    //   .select()
    //   .from(productsTable)
    //   .where(eq(productsTable.businessId, parseInt(businessId as string, 10)));
    // Use this mock data first
    const products = [
      {
        id: "param_quantity_1753396120178",
        name: "quantity",
        label: "Quantity",
        type: "NumericValue",
        required: true,
        min: 1,
        step: 1,
        unit: "units",
        pricing: {},
        hasSubParameters: false,
        pricingScope: "per_unit",
      },
    ];

    const categories = products.map(
      (product: any) => product.label || product.name
    );

    // Create initial message for AI
    const messages = [
      {
        role: "system",
        content: `You are a helpful printing service assistant. Available products: ${categories.join(
          ", "
        )}. Help users with quotes, uploads, and general questions about printing services.`,
      },
      {
        role: "user",
        content: message,
      },
    ];

    // Call AI with the message
    const aiResponse = await chatWithAI(messages);

    res.json({
      success: true,
      response:
        aiResponse.choices[0]?.message?.content || "No response generated",
      availableProducts: categories,
      businessId: businessId,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
});

export default router;
