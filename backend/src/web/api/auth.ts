import express from "express";
import db from "../../modules/db";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";

import { usersTable } from "../../db/schema";

const router = express.Router();

router.post("/oauth", async (req, res) => {
  try {
    // check if the user already exists
    const token = jwt.sign(
      {
        email: req.body.email,
      },
      process.env.JWT_SECRET!
    );
    
    const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, req.body.email));
    if (existingUser.length == 0) await db.insert(usersTable).values({
      email: req.body.email,
      provider: req.body.provider,
    });

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

