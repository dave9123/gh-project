import express from "express";
import db from "../../modules/db";
import { businessTable, ordersTable } from "../../db/schema";
import { eq } from "drizzle-orm";
const router = express.Router();

router.get("/orders", async (req, res) => {
  try {
    const businessResult = await db.select().from(businessTable).where(eq(businessTable.ownerEmail, req.user.email));
    const businessId = businessResult[0]?.id;
    if (!businessId) return res.status(404).json({ error: "User does not own a business" });
    const orders = await db.select().from(ordersTable).where(eq(ordersTable.businessId, businessId));
    
    res.status(200).json(orders);
  } catch (error) {
    console.error("Error in /orders route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { newStatus } = req.body;

    await db.update(ordersTable).set({ status: newStatus }).where(eq(ordersTable.id, parseInt(orderId)));

    res.status(200).json({ message: "Order updated successfully" });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
