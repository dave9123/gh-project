import express from "express";
import db from "../../modules/db";
const router = express.Router();

router.get("/orders", (req, res) => {});
router.post("/orders/:id", (req, res) => {
  const { id } = req.params;
});

export default router;
