import express from "express";
import db from "../../modules/db";
const router = express.Router();

router.post("/upload", (req, res) => {
  
});

router.delete("/delete/:id", (req, res) => {
  const { id } = req.params;
});

export default router;