import express from "express";
import db from "../../modules/db";
import { productsTable, usersTable, businessTable } from "../../db/schema";
const router = express.Router();

router.post("/create", (req, res) => {
  try {
    console.log(req.user, req.body);

    const { name, slug, phoneNumber, ownerEmail } = req.body;
    if (!name || !slug || !phoneNumber || !ownerEmail) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (slug.includes(" ")) {
      return res.status(400).json({ error: "Slug name cannot contain spaces" });
    }
    const email = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,63}$/g;
    if (!email.test(ownerEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }

    db.insert(businessTable).values({
      name,
      slug,
      phoneNumber,
      ownerEmail,
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
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

router.get("/get", async (req, res) => {
  try {
    // await db.select().from(businessTable).then((business) => {/

    console.log(req.user);
    res.send({
      name: "Business Name",
      slug: "business-name",
      phoneNumber: "Business Phone Number",
      ownerEmail: "email@domain.com",
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

    const result = await db
      .insert(productsTable)
      .values({
        name,
        description,
        basePrice,
        currencyType,
      })
      .returning({ insertId: productsTable.id });

    res.send({
      generatedId: result && result[0] ? result[0].insertId : 0,
      name,
      description,
      currencyType,
      basePrice,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

router.delete("/product/:productId", (req, res) => {
  try {
    const { productId } = req.params;
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

router.get("/product/:productId", (req, res) => {
  try {
    // const product = parseInt(req.params.productId);
    // if (isNaN(product)) return res.status(400).json({ error: "Product ID is required" });
    // const productItem = db.select().from(usersTable).where(eq(usersTable.id, product));
    // res.send({
    //   generatedId: productItem.oid,
    //   name: productItem.$dynamic.name,
    // })
    // db.select()
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

router.post("/product", (req, res) => {
  try {
    const { productId, name, ratioType, ratioToPrice } = req.body;
    if (!productId || !name || !ratioType || !ratioToPrice) {
      return res.status(400).json({ error: "All fields are required" });
    }
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
