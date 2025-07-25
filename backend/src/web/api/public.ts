import express from "express";
import { eq } from "drizzle-orm";
import db from "../../modules/db";
import { productsTable, usersTable, businessTable } from "../../db/schema";

const router = express.Router();

router.get("/get-slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({ error: "Slug parameter is required" });
    }

    const business = await db
      .select()
      .from(businessTable)
      .where(eq(businessTable.slug, slug))
      .limit(1);

    if (business.length === 0) {
      return res
        .status(404)
        .json({ error: "No business found with this slug" });
    }

    const businessData = business[0]!;

    // Fetch products related to this business
    const products = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        description: productsTable.description,
        basePrice: productsTable.basePrice,
        currencyType: productsTable.currencyType,
        businessId: productsTable.businessId,
        createdAt: productsTable.createdAt,
        lastModified: productsTable.lastModified,
        formData: productsTable.formData,
      })
      .from(productsTable)
      .where(eq(productsTable.businessId, businessData.id));

    return res.send({
      business: {
        name: businessData.name,
        slug: businessData.slug,
        id: businessData.id,
      },
      products: products,
      message: "Business and products retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

router.get(
  "/get-products-by-productId/:businessSlug/:productId",
  async (req, res) => {
    try {
      const { businessSlug, productId } = req.params;

      if (!businessSlug) {
        return res
          .status(400)
          .json({ error: "Business slug parameter is required" });
      }

      if (!productId) {
        return res
          .status(400)
          .json({ error: "Product ID parameter is required" });
      }

      // First, verify the business exists
      const business = await db
        .select()
        .from(businessTable)
        .where(eq(businessTable.slug, businessSlug))
        .limit(1);

      if (business.length === 0) {
        return res
          .status(404)
          .json({ error: "No business found with this slug" });
      }

      const businessData = business[0]!;

      // Fetch the specific product by ID and verify it belongs to this business
      const product = await db
        .select({
          id: productsTable.id,
          name: productsTable.name,
          description: productsTable.description,
          basePrice: productsTable.basePrice,
          currencyType: productsTable.currencyType,
          formData: productsTable.formData,
          businessId: productsTable.businessId,
          createdAt: productsTable.createdAt,
          lastModified: productsTable.lastModified,
        })
        .from(productsTable)
        .where(eq(productsTable.id, parseInt(productId)))
        .limit(1);

      if (product.length === 0) {
        return res.status(404).json({ error: "No product found with this ID" });
      }

      const productData = product[0]!;

      // Verify the product belongs to the specified business
      if (productData.businessId !== businessData.id) {
        return res
          .status(404)
          .json({ error: "Product does not belong to this business" });
      }

      return res.send({
        business: {
          name: businessData.name,
          slug: businessData.slug,
          id: businessData.id,
        },
        product: productData,
        message: "Product retrieved successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
);

export default router;
