import express from "express";
import db from "../../modules/db";
import { ordersTable } from "../../db/schema";
const router = express.Router();

router.post("/", (req, res) => {
  try {
    const { id, fieldId, formValues, currency, total, status } = req.body;

    db.insert(ordersTable).values({
      
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", (req, res) => {
  try {

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;