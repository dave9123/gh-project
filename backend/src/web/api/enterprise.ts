import express from "express";
import db from "../../modules/db";
import { usersTable } from "../../../db/schema";
const router = express.Router();

router.post("/create", (req, res) => {
  const { name, slugName, phoneNumber, ownerEmail } = req.body;
  if (!name || !slugName || !phoneNumber || !ownerEmail) {
    return res.status(400).json({ error: "All fields are required" });
  }
  /*
    db.insert(usersTable).values({
    })
  */


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
  const { name, description, basePrice, currencyType, owner } = req.body;
  if (!name || !description || !basePrice || !currencyType || !owner) {
    return res.status(400).json({ error: "All fields are required" });
  }

  res.send({
    generatedId: "UniqueID Generated from Backend",
    name: "Product Name",
    description: "product description",
    currencyType: "IDR",
    basePrice: 0,
  });
});

router.delete("/product/:productId", (req, res) => {
  const { productId } = req.params;
});

router.get("/product/:productId", (req, res) => {
  const { productId } = req.params;
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
