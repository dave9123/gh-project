import express from "express";
import db from "../../modules/db";
import { productsTable, usersTable } from "../../db/schema";
import { eq } from "drizzle-orm";
const router = express.Router();

router.post("/create", (req, res) => {
  const { name, slugName, phoneNumber, ownerEmail } = req.body;
  if (!name || !slugName || !phoneNumber || !ownerEmail) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // db.insert(usersTable).values({

  // })

  res.send({
    generatedId: "",
    name: "",
    slugName: "",
    phoneNumber: "",
    ownerEmail: "",
  })
});

router.get("/get", (req, res) => {
  res.send({
    generatedId: "<UniqueID Generated from Backend>",
    name: "Business Name",
    slugName: "business-name",
    phoneNumber: "Business Phone Number",
    ownerEmail: "email@domain.com"
  });
});

router.post("/product", (req, res) => {
  try {
    if (!req.body?.name || !req.body?.description || !req.body?.basePrice || !req.body?.currencyType) return res.status(400).json({ error: "All fields are required" });
    const { name, description, basePrice, currencyType } = req.body;

    db.insert(productsTable).values({
      name,
      description,
      basePrice,
      currencyType,
    }).then((result => {
      res.send({
        generatedId: result.oid as number,
        name,
        description,
        currencyType,
        basePrice,
      });
    }));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

router.delete("/product/:productId", (req, res) => {
  const { productId } = req.params;
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
  if (process.env.NODE_ENV === "production") return res.status(403).json({ error: "Forbidden" }); 
  const products = await db.select().from(productsTable);
  res.send(products);
});

router.post("/parameter", (req, res) => {
  const { productId, name, ratioType, ratioToPrice } = req.body;
  if (!productId || !name || !ratioType || !ratioToPrice) {
    return res.status(400).json({ error: "All fields are required" });
  }
});

router.delete("/paramater/:id", (req, res) => {
  const { id } = req.params;
});

router.get("/parameter/:id", (req, res) => {
  const { id } = req.params;
});

export default router;
