import express from "express";
import db from "../../modules/db";
import { ordersTable, usersTable } from "../../db/schema";
import { eq } from "drizzle-orm";
const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { businessId, fileId, name, productId, quantity, currency, total, status } = req.body;
        const userResult = await db.select().from(usersTable).where(eq(usersTable.email, req.user.email));
        const userId = userResult[0]?.id;
        if (!userId) return res.status(404).json({ error: "User not found" });

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

router.get("/", async (req, res) => {
    try {
        const userResult = await db.select().from(usersTable).where(eq(usersTable.email, req.user.email));
        const userId = userResult[0]?.id;
        if (!userId) return res.status(404).json({ error: "User not found" });
        const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, userId));

        res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
