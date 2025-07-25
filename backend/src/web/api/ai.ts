import express from "express";
import db from "../../modules/db";
import { OpenAI } from "openai";
import { businessTable, productsTable } from "../../db/schema";
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
    fileSize: 50 * 1024 * 1024, // 10MB limit
  },
});

const systemMessage = {
  role: "system",
  content: `Anda adalah asisten layanan pencetakan berbahasa indonesia yang membantu untuk bisnis ini.

Saat pengguna bertanya tentang produk atau layanan:
- Gunakan fungsi get_products untuk mengambil katalog produk terbaru
- Sajikan produk dengan cara yang ramah dan komunikatif
- Sertakan nama, deskripsi, dan harga spesifik
- Bantu pengguna memahami pilihan mereka

Saat pengguna menginginkan penawaran harga:
- Gunakan fungsi calculate_quote dengan spesifikasi mereka
- Jelaskan faktor harga (contoh: kuantitas, bahan, ukuran, warna)

Saat pengguna mengunggah berkas:
- Gunakan fungsi set_user_upload untuk memproses berkas mereka
- Bantu mereka memahami bagaimana berkas mereka memengaruhi penawaran harga

Anda memiliki akses ke riwayat percakapan, jadi rujuk pesan sebelumnya dan pertahankan konteks. Selalu bersikap membantu, profesional, dan informatif.`,
};

// File upload endpoint for AI chat
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Tidak ada file yang diunggah" });
    }

    const { businessSlug, chatId, userId, conversationHistory, businessId } =
      req.body;

    if (!businessSlug) {
      return res.status(400).json({ error: "businessId diperlukan" });
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const fileName = `${crypto.randomUUID()}${fileExtension}`;
    const filePath = `garudahack/${businessSlug}/${
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
        businessId: businessSlug,
        chatId: chatId || "general",
        userId: userId || "anonymous",
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(uploadCommand);
    // also generate ai responses
    // Generate AI responses based on the uploaded file

    // Generate public URL for Supabase storage
    const publicUrl = `https://fasyqyuaqbncfurxwliy.supabase.co/storage/v1/object/public/garudahack/${filePath}`;

    // Return file information for AI processing

    const messages = [systemMessage];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      // Convert frontend message format to OpenAI format
      conversationHistory.forEach((msg: any) => {
        if (msg.type === "user") {
          messages.push({
            role: "user",
            content: msg.content,
          });
        } else if (msg.type === "system") {
          messages.push({
            role: "assistant",
            content: msg.content,
          });
        }
      });
    }

    // Add the current user message
    messages.push({
      role: "system",
      content: `pengguna telah mengunggah file: ${publicUrl}`,
    });

    // Call AI with the full conversation
    const aiResponse = await chatWithAI(messages, aiFunctions, businessId);

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
        response: aiResponse.choices[0].message.content,
        businessSlug: businessSlug,
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
          "Mengambil semua kategori produk dan opsi yang tersedia dari backend untuk penawaran harga dinamis.",
        parameters: {
          type: "object",
          properties: {},
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "set_product_needs",
        description:
          "Memungkinkan pengguna untuk menentukan kebutuhan produk mereka tanpa mengunggah gambar. Gunakan ini ketika pengguna mendeskripsikan apa yang ingin mereka cetak.",
        parameters: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description:
                "Kategori produk. Harus sesuai dengan salah satu produk yang tersedia dari fungsi get_products.",
            },
            specifications: {
              type: "object",
              description:
                "Spesifikasi pengguna untuk produk berdasarkan bidang formulir yang tersedia.",
              additionalProperties: true,
            },
          },
          required: ["category"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "calculate_quote",
        description:
          "Menghitung total penawaran harga berdasarkan kategori, kuantitas, dan parameter lain dari data formulir produk.",
        parameters: {
          type: "object",
          properties: {
            category: {
              type: "string",
              description:
                "Kategori produk. Harus sesuai dengan salah satu produk yang tersedia.",
            },
            specifications: {
              type: "object",
              description:
                "Spesifikasi produk berdasarkan struktur data formulir produk.",
              additionalProperties: true,
            },
          },
          required: ["category", "specifications"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "generate_invoice",
        description:
          "Membuat faktur atau ringkasan pesanan yang dapat dicetak untuk pengguna dengan penawaran harga saat ini.",
        parameters: {
          type: "object",
          properties: {
            userEmail: {
              type: "string",
              description: "Email pengguna untuk mengirim faktur",
            },
            quoteId: {
              type: "string",
              description:
                "ID dari penawaran harga yang telah dibuat sebelumnya",
            },
            fullName: { type: "string", description: "Nama pelanggan" },
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
          "Menangani pertanyaan umum pengguna yang tidak terkait dengan penawaran harga atau pengunggahan.",
        parameters: {
          type: "object",
          properties: {
            question: { type: "string", description: "Pertanyaan pengguna." },
          },
          required: ["question"],
        },
      },
    },
  ];
};
const aiFunctions = functions();

// Function to execute AI function calls
async function executeFunction(
  functionName: string,
  args: any,
  businessId: number
) {
  switch (functionName) {
    case "get_products":
      // Fetch products from database
      try {
        // Fetch products from the database
        const products = await db
          .select()
          .from(productsTable)
          .where(eq(productsTable.businessId, businessId));

        // Format products in a way that's useful for the AI to process
        const formattedProducts = products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          basePrice: p.basePrice,
          currencyType: p.currencyType,
        }));

        if (formattedProducts.length === 0) {
          return {
            success: true,
            message:
              "Tidak ada produk yang tersedia saat ini dalam katalog kami. Silakan periksa kembali nanti atau hubungi kami untuk layanan pencetakan khusus.",
            data: { totalProducts: 0, products: [] },
          };
        }

        // Create a detailed product summary for AI processing
        const productSummary = {
          totalProducts: formattedProducts.length,
          products: formattedProducts,
          categories: [...new Set(formattedProducts.map((p) => p.name))],
          priceRange: {
            min: Math.min(...formattedProducts.map((p) => p.basePrice)),
            max: Math.max(...formattedProducts.map((p) => p.basePrice)),
            currency: formattedProducts[0]?.currencyType || "IDR",
          },
        };

        // Return structured data that the AI will use to generate a user-friendly response
        return {
          success: true,
          data: productSummary,
          instruction:
            "Gunakan data produk ini untuk menghasilkan ringkasan yang membantu.",
          message:
            "Berdasarkan data produk ini, berikan ringkasan yang membantu tentang produk yang tersedia kepada pengguna. Sertakan nama produk, deskripsi, dan rentang harga. Buatlah percakapan yang membantu.",
        };
      } catch (error) {
        return {
          success: false,
          error: "Gagal mengambil produk",
          instruction:
            "Beri tahu pengguna bahwa terjadi kesalahan dalam mengambil katalog produk dan sarankan mereka untuk mencoba lagi nanti.",
        };
      }

    case "set_product_needs":
      // Handle user product needs specification
      try {
        // Fetch the specific product to get its form data
        const products = await db
          .select()
          .from(productsTable)
          .where(eq(productsTable.businessId, businessId));

        const selectedProduct = products.find((p) => p.name === args.category);

        if (!selectedProduct) {
          return {
            success: false,
            error: `Kategori produk '${
              args.category
            }' tidak ditemukan. Kategori yang tersedia: ${products
              .map((p) => p.name)
              .join(", ")}`,
          };
        }

        return {
          success: true,
          message: `Kebutuhan produk ditetapkan untuk ${args.category}`,
          data: {
            category: args.category,
            specifications: args.specifications,
            productInfo: {
              id: selectedProduct.id,
              name: selectedProduct.name,
              description: selectedProduct.description,
              basePrice: selectedProduct.basePrice,
              currencyType: selectedProduct.currencyType,
              formData: selectedProduct.formData,
            },
          },
          instruction:
            "Akui kebutuhan produk pengguna dan sarankan langkah selanjutnya seperti mendapatkan penawaran harga atau memberikan rincian lebih lanjut.",
        };
      } catch (error) {
        return {
          success: false,
          error: "Gagal memproses kebutuhan produk",
          instruction:
            "Beri tahu pengguna bahwa terjadi kesalahan dalam memproses kebutuhan produk mereka.",
        };
      }

    case "calculate_quote":
      // Let AI model calculate the quote with comprehensive pricing rules
      try {
        // Fetch the specific product to get its form data and base price
        const products = await db
          .select()
          .from(productsTable)
          .where(eq(productsTable.businessId, businessId));

        const selectedProduct = products.find((p) => p.name === args.category);

        if (!selectedProduct) {
          return {
            success: false,
            error: `Kategori produk '${
              args.category
            }' tidak ditemukan. Kategori yang tersedia: ${products
              .map((p) => p.name)
              .join(", ")}`,
          };
        }

        const basePrice = selectedProduct.basePrice || 0;
        const formData = selectedProduct.formData as any;
        const userSpecs = args.specifications || {};

        console.log("Delegating calculation to AI model");
        console.log("Product:", selectedProduct.name);
        console.log("Base Price:", basePrice);
        console.log("User Specifications:", JSON.stringify(userSpecs, null, 2));
        console.log("Form Data:", JSON.stringify(formData, null, 2));

        // Create comprehensive calculation prompt for AI
        const calculationPrompt = `
PERHITUNGAN PENAWARAN HARGA - PANDUAN LENGKAP

Anda diminta untuk menghitung penawaran harga berdasarkan data produk dan spesifikasi pengguna. Ikuti aturan perhitungan berikut dengan SANGAT TELITI:

=== DATA PRODUK ===
Nama Produk: ${selectedProduct.name}
Deskripsi: ${selectedProduct.description}
Base Price: ${basePrice} ${selectedProduct.currencyType}
Currency: ${selectedProduct.currencyType}

=== SPESIFIKASI PENGGUNA ===
${JSON.stringify(userSpecs, null, 2)}

=== STRUKTUR PRICING FORM ===
${JSON.stringify(formData, null, 2)}

=== ATURAN PERHITUNGAN PRICING ===

1. **QUANTITY**: 
   - Ambil dari userSpecs.quantity, default = 1
   - Quantity mengalikan TOTAL AKHIR

2. **MAIN UNITS PARAMETER**:
   - Cari parameter dengan isMainUnits: true
   - Nilai dari parameter ini akan digunakan untuk unit_price calculations
   - Contoh: jika Weight = 10 grams dan isMainUnits: true, maka mainUnitsValue = 10

3. **PARAMETER TYPES & PRICING**:

   **A. FixedOption (radio/select/toggle)**:
   - Cari option yang dipilih berdasarkan userSpecs[parameter.name]
   - Match dengan option.value atau option.label
   - Hitung pricing dari selectedOption.pricing:
     
     • base_price: Tambahkan langsung ke subtotal
     • unit_price: 
       - Jika parameter.pricingScope === "per_unit": unit_price * mainUnitsValue
       - Jika parameter.pricingScope === "per_qty" atau undefined: unit_price saja
     • multiplier: JANGAN kalikan langsung, kumpulkan untuk nanti
     • subOptions: Proses jika ada, gunakan pricingScope masing-masing

   **B. NumericValue/DerivedCalc**:
   - Ambil nilai numerik dari userSpecs[parameter.name]
   - Hitung dari parameter.pricing:
     
     • base_price: Tambahkan langsung ke subtotal
     • unit_price:
       - Jika parameter.pricingScope === "per_unit": nilai * unit_price
       - Jika parameter.pricingScope === "per_qty": unit_price saja
     • step_pricing: Jika nilai > threshold, tambahkan (nilai - threshold) * step_amount
     • multiplier: Kumpulkan untuk aplikasi akhir

4. **PERHITUNGAN STEP BY STEP**:
   
   STEP 1: Hitung subtotal dari semua parameter
   subtotal = base_price + sum(semua parameter costs)
   
   STEP 2: Kumpulkan semua multipliers
   totalMultiplier = multiplier1 * multiplier2 * multiplier3
   
   STEP 3: Hitung unit price
   unitPrice = subtotal * totalMultiplier
   
   STEP 4: Hitung total final
   finalTotal = unitPrice * quantity

5. **OUTPUT FORMAT YANG DIPERLUKAN**:
   Berikan hasil dalam format JSON yang VALID seperti contoh berikut:
   {
     "calculation_success": true,
     "quote_id": "generated-uuid",
     "product_name": "nama produk",
     "user_specifications": {user specs object},
     "base_price": number,
     "quantity": number,
     "main_units_value": number,
     "main_units_parameter": "nama parameter dengan isMainUnits",
     "parameter_calculations": [...],
     "multipliers": [...],
     "subtotal": number,
     "total_multiplier": number,
     "unit_price": number,
     "final_total": number,
     "currency": "IDR/USD",
     "calculation_breakdown": "penjelasan lengkap perhitungan step by step"
   }

=== CONTOH PERHITUNGAN ===
Jika ada:
- Base Price: 1000
- Weight: 10 grams (isMainUnits: true)
- Paper Size A3: unit_price 45, pricingScope: per_unit
- Printing Sides 2: multiplier 1.56, unit_price 999.92, pricingScope: per_unit
- Colour Black & White: no pricing
- Quantity: 1

Perhitungan:
1. Paper Size: 45 * 10 = 450
2. Printing Sides: 999.92 * 10 = 9999.2, multiplier = 1.56
3. Subtotal: 1000 + 450 + 9999.2 = 11449.2
4. Unit Price: 11449.2 * 1.56 = 17860.752
5. Final Total: 17860.752 * 1 = 17860.752

HITUNG DENGAN SANGAT TELITI DAN BERIKAN RESULT DALAM FORMAT JSON YANG VALID!
`;

        return {
          success: true,
          ai_calculation_required: true,
          calculation_prompt: calculationPrompt,
          product_data: {
            id: selectedProduct.id,
            name: selectedProduct.name,
            description: selectedProduct.description,
            basePrice: basePrice,
            currencyType: selectedProduct.currencyType,
            formData: formData,
          },
          user_specifications: userSpecs,
          instruction:
            "Gunakan prompt perhitungan untuk menghitung penawaran harga dengan AI model. Berikan hasil yang akurat dan detail.",
        };
      } catch (error) {
        console.error("Calculate quote preparation error:", error);
        return {
          success: false,
          error: "Gagal mempersiapkan perhitungan penawaran harga",
          instruction:
            "Beri tahu pengguna bahwa terjadi kesalahan dalam mempersiapkan perhitungan penawaran harga.",
        };
      }

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
        response: `Saya memahami Anda bertanya: ${args.question}. Bagaimana saya bisa membantu Anda dengan kebutuhan pencetakan Anda?`,
      };

    default:
      return { error: `Fungsi tidak dikenal: ${functionName}` };
  }
}

export async function chatWithAI(
  messages: Array<any>,
  tools = aiFunctions,
  businessId: number
) {
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.AI_MODEL || "deepseek/deepseek-chat-v3-0324:free",
      messages: messages as any,
      tools: tools as any,
      tool_choice: "auto",
    });

    const choice = completion.choices?.[0];
    if (!choice) {
      throw new Error("Tidak ada respons dari AI");
    }
    console.log("AI Response choice:", choice);

    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      const toolCalls = choice.message.tool_calls;

      // Add the assistant message with tool calls to the conversation
      messages.push({
        role: "assistant",
        content: choice.message.content,
        tool_calls: choice.message.tool_calls,
      });

      // Process each tool call and add tool responses
      for (const toolCall of toolCalls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        const result = await executeFunction(functionName, args, businessId);

        // Add the tool response with proper structure
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      // Add an additional instruction for specific function types
      if (toolCalls.some((call) => call.function.name === "get_products")) {
        messages.push({
          role: "system",
          content:
            "Sekarang hasilkan respons yang membantu dan komunikatif tentang produk yang tersedia. Sertakan nama produk spesifik, deskripsi, dan informasi harga. Buatlah mudah dipahami pengguna untuk memahami pilihan mereka.",
        });
      }

      console.log(
        "Messages before recursive call:",
        JSON.stringify(messages, null, 2)
      );

      // Add a small delay before recursive call to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Recursively call to get the AI's response after processing the function results
      return await chatWithAI(messages, tools, businessId);
    }

    return completion;
  } catch (error: any) {
    console.error("OpenAI API Error:", error);

    // Handle rate limiting errors
    if (error.status === 429) {
      console.log("Batas tingkat tercapai, menunggu sebelum mencoba lagi...");
      // Wait 30 seconds before retrying for rate limit
      await new Promise((resolve) => setTimeout(resolve, 30000));

      // Try one more time
      try {
        const completion = await openai.chat.completions.create({
          model: process.env.AI_MODEL || "deepseek/deepseek-chat-v3-0324:free",
          messages: messages as any,
          tools: tools as any,
          tool_choice: "auto",
        });
        return completion;
      } catch (retryError) {
        console.error("Percobaan ulang gagal:", retryError);
        // Return a fallback response
        return {
          choices: [
            {
              message: {
                content:
                  "Saya mohon maaf, tetapi saat ini saya mengalami permintaan yang tinggi. Silakan coba lagi dalam beberapa saat. Sementara itu, jika Anda memiliki pertanyaan tentang produk kami atau memerlukan penawaran harga, jangan ragu untuk bertanya dan saya akan melakukan yang terbaik untuk membantu!",
              },
            },
          ],
        } as any;
      }
    }

    // Handle other errors
    throw error;
  }
}

router.post("/", async (req, res) => {
  try {
    const { businessSlug } = req.body;

    if (!businessSlug) {
      return res.status(400).json({ error: "Pesan dan businessId diperlukan" });
    }

    const businessResult = await db
      .select({ id: businessTable.id })
      .from(businessTable)
      .where(eq(businessTable.slug, businessSlug));

    console.log(businessResult);
    if (!businessResult[0]) {
      return res.status(404).json({ error: "Bisnis tidak ditemukan" });
    } else {
      return res
        .status(200)
        .json({ success: true, message: "Bisnis ditemukan" });
    }
  } catch (err) {
    return res.status(500).json({ err });
  }
});

// Chat endpoint - POST method for better practice with request body
router.post("/chat", async (req, res) => {
  try {
    const { message, businessSlug, conversationHistory } = req.body;

    if (!message || !businessSlug) {
      return res.status(400).json({ error: "Pesan dan businessId diperlukan" });
    }

    // get businessid from the business slug
    const businessResult = await db
      .select({ id: businessTable.id })
      .from(businessTable)
      .where(eq(businessTable.slug, businessSlug));

    // Check if business exists and extract the ID
    if (!businessResult[0]) {
      return res.status(404).json({ error: "Bisnis tidak ditemukan" });
    }
    console.log(businessResult);

    const businessId = businessResult[0].id;
    console.log("Business ID:", businessId);

    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.businessId, businessId));
    // .where(eq(productsTable.businessId, parseInt(businessSlug as string, 10)));

    const categories = products.map(
      (product: any) => product.label || product.name
    );

    console.log("Available product categories:", categories);

    // Create enhanced system message

    // Build messages array with conversation history
    const messages = [systemMessage];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      // Convert frontend message format to OpenAI format
      conversationHistory.forEach((msg: any) => {
        if (msg.type === "user") {
          messages.push({
            role: "user",
            content: msg.content,
          });
        } else if (msg.type === "system") {
          messages.push({
            role: "assistant",
            content: msg.content,
          });
        }
      });
    }

    // Add the current user message
    messages.push({
      role: "user",
      content: message,
    });

    // Call AI with the full conversation
    const aiResponse = await chatWithAI(messages, aiFunctions, businessId);
    console.log(messages);

    res.json({
      success: true,
      response:
        aiResponse.choices[0]?.message?.content ||
        "Tidak ada respons yang dihasilkan",
      availableProducts: categories,
      businessSlug: businessSlug,
    });
  } catch (error) {
    console.error("AI chat error:", error);

    // Handle rate limiting specifically
    if (error instanceof Error && error.message.includes("429")) {
      return res.status(429).json({
        error:
          "Layanan AI saat ini sedang sibuk. Silakan coba lagi dalam beberapa saat.",
        retryAfter: 30,
        details: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }

    return res.status(500).json({
      error: "Kesalahan server internal",
      details: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
});

export default router;
