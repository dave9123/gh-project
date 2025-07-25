import express from "express";
import db from "../../modules/db";
import { ordersTable } from "../../db/schema";
const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { businessId, fileId, name, userId, productId, quantity, price, currency, total, status } = req.body;

        await db.insert(ordersTable).values({
            businessId,
            fileId,
            name,
            userId,
            productId,
            quantity,
            totalPrice: total,
            currency,
            status
        });

        res.status(201).json({ message: "Order created successfully" });
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