import express from "express";
import db from "../../modules/db";
import jwt from "jsonwebtoken";
const router = express.Router();

router.post("/oauth", (req, res) => {
  try {
    const token = jwt.sign({
        email: req.body.email
    }, process.env.JWT_SECRET!);
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;