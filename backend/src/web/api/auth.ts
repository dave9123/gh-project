import express from "express";
import db from "../../modules/db";
import jwt from "jsonwebtoken";
const router = express.Router();

router.post("/oauth", (req, res) => {
    const token = jwt.sign({
        email: req.body.email
    }, process.env.JWT_SECRET!);
    res.json({ token });
});

export default router;