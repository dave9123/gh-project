import express from "express";
import { eq } from "drizzle-orm";
import db from "../../modules/db";
import { productsTable, usersTable, businessTable } from "../../db/schema";
const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    console.log(req.user, req.body);

    const { name, slug, phoneNumber, ownerEmail } = req.body;
    if (!name || !slug || !phoneNumber || !ownerEmail) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (slug.includes(" ")) {
      return res.status(400).json({ error: "Slug name cannot contain spaces" });
    }

    if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, req.user.email))
      .limit(1);

    if (user[0]) {
      await db.insert(businessTable).values({
        name,
        slug,
        phoneNumber,
        ownerEmail: user[0].email,
      });

      res.send({
        message: "Business created successfully!",
        business: {
          name,
          slug,
          phoneNumber,
          ownerEmail,
        },
      });

      return;
    }

    res.send({
      message: "Error occured when creating business!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

router.get("/get", async (req, res) => {
  try {
    console.log(req.user);

    if (!req.user?.email) {
      return res
        .status(401)
        .json({ error: "User not authenticated or email not found" });
    }

    const business = await db
      .select()
      .from(businessTable)
      .where(eq(businessTable.ownerEmail, req.user.email))
      .limit(1);

    if (business.length === 0) {
      return res.status(404).json({ error: "No business found for this user" });
    }

    const businessData = business[0]!;
    res.send({
      business: {
        name: businessData.name,
        slug: businessData.slug,
        phoneNumber: businessData.phoneNumber,
        ownerEmail: businessData.ownerEmail,
      },
      message: "Business retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

router.post("/product", async (req, res) => {
  try {
    if (
      !req.body?.name ||
      !req.body?.description ||
      !req.body?.basePrice ||
      !req.body?.currencyType
    )
      return res.status(400).json({ error: "All fields are required" });
    const { name, description, basePrice, currencyType } = req.body;

    const userEmail = req.user.email;

    // Get user's business first
    const business = await db
      .select()
      .from(businessTable)
      .where(eq(businessTable.ownerEmail, userEmail))
      .limit(1);

    if (business.length === 0) {
      return res.status(404).json({ error: "No business found for this user" });
    }

    const businessData = business[0]!;
    const businessId = businessData.id;

    const result = await db
      .insert(productsTable)
      // @ts-ignore
      .values({
        name,
        description,
        basePrice,
        currencyType,
        businessId: businessId, // Assuming businessId is stored in user session
      })
      .returning({ insertId: productsTable.id });

    res.send({
      product: {
        id: result && result[0] ? result[0].insertId : 0,
        name,
        description,
        currencyType,
        basePrice,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

router.get("/products", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user?.email) {
      return res
        .status(401)
        .json({ error: "User not authenticated or email not found" });
    }

    const userEmail = req.user.email;

    // Get user's business first
    const business = await db
      .select()
      .from(businessTable)
      .where(eq(businessTable.ownerEmail, userEmail))
      .limit(1);

    if (business.length === 0) {
      return res.status(404).json({ error: "No business found for this user" });
    }

    const businessData = business[0]!;
    const businessId = businessData.id;

    // Get products belonging to the user's business
    const products = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        basePrice: productsTable.basePrice,
        currencyType: productsTable.currencyType,
      })
      .from(productsTable)
      .orderBy(productsTable.createdAt);

    res.send({
      products,
      totalCount: products.length,
      businessInfo: {
        id: businessData.id,
        name: businessData.name,
        slug: businessData.slug,
      },
      message: "Products retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

router.put("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const productIdNum = parseInt(productId);

    if (isNaN(productIdNum)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Check if product exists
    const existingProduct = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productIdNum))
      .limit(1);

    if (existingProduct.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Build update object with only provided fields
    const updateData: any = {};

    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.description !== undefined)
      updateData.description = req.body.description;
    if (req.body.basePrice !== undefined)
      updateData.basePrice = req.body.basePrice;
    if (req.body.currencyType !== undefined)
      updateData.currencyType = req.body.currencyType;
    if (req.body.formData !== undefined)
      updateData.formData = req.body.formData;

    // Add lastModified timestamp
    updateData.lastModified = new Date();

    // Check if there's anything to update
    if (Object.keys(updateData).length === 1) {
      // Only lastModified
      return res
        .status(400)
        .json({ error: "No valid fields provided for update" });
    }

    // Perform the update
    const result = await db
      .update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, productIdNum))
      .returning();

    if (result.length === 0) {
      return res.status(500).json({ error: "Failed to update product" });
    }

    if (result[0]) {
      res.send({
        message: "Product updated successfully",
        product: result[0],
        id: result[0].id,
      });
    }

    res.send({
      message: "Product updated successfully",
      product: result[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

router.delete("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const productIdNum = parseInt(productId);

    if (isNaN(productIdNum)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Check if user is authenticated
    if (!req.user?.email) {
      return res
        .status(401)
        .json({ error: "User not authenticated or email not found" });
    }

    const userEmail = req.user.email;

    // Get user's business first to verify ownership
    const business = await db
      .select()
      .from(businessTable)
      .where(eq(businessTable.ownerEmail, userEmail))
      .limit(1);

    if (business.length === 0) {
      return res.status(404).json({ error: "No business found for this user" });
    }

    const businessData = business[0]!;

    // Check if product exists and belongs to the user's business
    const existingProduct = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productIdNum))
      .limit(1);

    if (existingProduct.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    const productData = existingProduct[0]!;

    // Verify the product belongs to the user's business
    if (productData.businessId !== businessData.id) {
      return res.status(403).json({
        error: "Unauthorized: Product does not belong to your business",
      });
    }

    // Delete the product
    const result = await db
      .delete(productsTable)
      .where(eq(productsTable.id, productIdNum))
      .returning({
        id: productsTable.id,
        name: productsTable.name,
      });

    if (result.length === 0) {
      return res.status(500).json({ error: "Failed to delete product" });
    }

    res.send({
      message: "Product deleted successfully",
      deletedProduct: {
        id: result[0]!.id,
        name: result[0]!.name,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

router.get("/product/:productId", async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user?.email) {
      return res
        .status(401)
        .json({ error: "User not authenticated or email not found" });
    }

    const { productId } = req.params;
    const productIdNum = parseInt(productId);

    if (isNaN(productIdNum)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const userEmail = req.user.email;

    // Get user's business first
    const business = await db
      .select()
      .from(businessTable)
      .where(eq(businessTable.ownerEmail, userEmail))
      .limit(1);

    if (business.length === 0) {
      return res.status(404).json({ error: "No business found for this user" });
    }

    const businessData = business[0]!;

    // Get the specific product by ID
    const product = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        basePrice: productsTable.basePrice,
        currencyType: productsTable.currencyType,
        createdAt: productsTable.createdAt,
        lastModified: productsTable.lastModified,
      })
      .from(productsTable)
      .where(eq(productsTable.id, productIdNum))
      .limit(1);

    if (product.length === 0) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    const productData = product[0]!;

    res.send({
      product: productData,
      businessInfo: {
        id: businessData.id,
        name: businessData.name,
        slug: businessData.slug,
      },
      message: "Product retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

router.get("/product", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production")
      return res.status(403).json({ error: "Forbidden" });
    const products = await db.select().from(productsTable);
    res.send(products);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

router.delete("/parameter/:id", (req, res) => {
  try {
    const { id } = req.params;
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

router.get("/parameter/:id", (req, res) => {
  try {
    const { id } = req.params;
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

export default router;
